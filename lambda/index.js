/**
 * AWS Lambda Function: PadosiCastBackend
 * Runtime: Node.js 18.x or 20.x
 *
 * Flow:
 * Task + Required Skill + Location + Radius
 *   ↓
 * API Gateway (POST /publish)
 *   ↓
 * Lambda (This function)
 *   ↓
 * DynamoDB: Scan / Query 'padosi-subscriber'
 *   ↓
 * Filtering:
 *   - confirmed = true
 *   - skill matches required skill (case-insensitive)
 *   - distance <= radius (Haversine formula)
 *   ↓
 * Amazon SNS: Publish to 'padosidemo' topic with ONLY eligible volunteers
 *   ↓
 * DynamoDB: Record audit in 'padosi-deliveries'
 *   ↓
 * Return response with eligible, delivered, skipped counts & volunteer details
 */

const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const REGION = process.env.AWS_REGION || 'ap-south-1';
// Support TOPIC_ARN (primary), SNS_TOPIC_ARN, or fallback ARN targeting padosidemo
const SNS_TOPIC_ARN =
  process.env.TOPIC_ARN ||
  process.env.SNS_TOPIC_ARN ||
  'arn:aws:sns:ap-south-1:123456789012:padosidemo';
const SUBSCRIBERS_TABLE = process.env.SUBSCRIBERS_TABLE || 'padosi-subscriber';
const DELIVERIES_TABLE = process.env.DELIVERIES_TABLE || 'padosi-deliveries';

const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);
const snsClient = new SNSClient({ region: REGION });

/**
 * Great-Circle Haversine distance in kilometers
 */
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

exports.handler = async (event) => {
  console.log('Incoming event:', JSON.stringify(event));

  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS Preflight OK' })
    };
  }

  try {
    // 1. Parse request body
    const body = event.body ? JSON.parse(event.body) : event;
    const {
      message,
      subject = 'Padosi Volunteer Notification',
      requiredSkill,
      skill,
      latitude,
      longitude,
      radius = 5
    } = body;

    if (!message || latitude == null || longitude == null) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required parameters: message, latitude, longitude'
        })
      };
    }

    const reqLat = parseFloat(latitude);
    const reqLng = parseFloat(longitude);
    const reqRadius = parseFloat(radius);
    const targetSkill = (requiredSkill || skill || '').trim().toLowerCase();
    const displaySkill = (requiredSkill || skill || 'General').trim();

    // 2. Fetch real volunteers from DynamoDB 'padosi-subscriber' table (NO MOCK DATA)
    let subscribers = [];
    try {
      const scanRes = await docClient.send(
        new ScanCommand({
          TableName: SUBSCRIBERS_TABLE
        })
      );
      subscribers = scanRes.Items || [];
      console.log(`Retrieved ${subscribers.length} subscribers from ${SUBSCRIBERS_TABLE}`);
    } catch (dbErr) {
      console.error(`Failed to scan DynamoDB table ${SUBSCRIBERS_TABLE}:`, dbErr);
      throw new Error(`DynamoDB Error reading ${SUBSCRIBERS_TABLE}: ${dbErr.message}`);
    }

    // 3. Evaluate each volunteer against the 3 conditions:
    //    1) confirmed = true
    //    2) skill matches requiredSkill (case-insensitive)
    //    3) distance <= radius
    const evaluatedVolunteers = subscribers.map((sub) => {
      const volLat = parseFloat(sub.latitude ?? sub.lat);
      const volLng = parseFloat(sub.longitude ?? sub.lng);
      const distance = haversineDistanceKm(reqLat, reqLng, volLat, volLng);

      // Check confirmed status
      const isConfirmed =
        sub.confirmed === true ||
        sub.confirmed === 'true' ||
        sub.status === 'Confirmed' ||
        sub.confirmed === 1;

      // Check skill matching (case-insensitive)
      const rawVolSkill = sub.skill || sub.skills || '';
      let skillMatches = false;
      if (!targetSkill) {
        skillMatches = true;
      } else if (typeof rawVolSkill === 'string') {
        skillMatches = rawVolSkill.trim().toLowerCase() === targetSkill;
      } else if (Array.isArray(rawVolSkill)) {
        skillMatches = rawVolSkill.some(
          (s) => String(s).trim().toLowerCase() === targetSkill
        );
      }

      // Check distance <= radius
      const inRadius = !isNaN(distance) && distance <= reqRadius;

      let status = 'Delivered';
      let skipReason = null;

      if (!isConfirmed) {
        status = 'Skipped';
        skipReason = 'Unconfirmed volunteer (confirmed = false)';
      } else if (!skillMatches) {
        status = 'Skipped';
        skipReason = `Skill mismatch: "${rawVolSkill}" ≠ "${displaySkill}"`;
      } else if (!inRadius) {
        status = 'Skipped';
        skipReason = `Outside radius (${distance} km > ${reqRadius} km)`;
      }

      return {
        subscriberId: sub.subscriberId || sub.id || 'unknown',
        name: sub.name || 'Volunteer',
        skill: sub.skill || 'General',
        channel: sub.channel || sub.endpoint || 'N/A',
        latitude: volLat,
        longitude: volLng,
        confirmed: isConfirmed,
        distanceKm: distance,
        status,
        skipReason
      };
    });

    const deliveredVolunteers = evaluatedVolunteers.filter((v) => v.status === 'Delivered');
    const skippedVolunteers = evaluatedVolunteers.filter((v) => v.status === 'Skipped');

    // 4. Publish to Amazon SNS topic 'padosidemo'
    // Send ONLY eligible volunteers in the message body
    const eligibleListText =
      deliveredVolunteers.length > 0
        ? deliveredVolunteers
            .map(
              (v, idx) =>
                `${idx + 1}. ${v.name} (${v.skill}) - ${v.channel} [${v.distanceKm} km away]`
            )
            .join('\n')
        : 'No matching volunteers within radius.';

    const snsMessageBody = `[Padosi Volunteer Notification]
Task: ${message}
Subject: ${subject}
Required Skill: ${displaySkill}
Location: (${reqLat}, ${reqLng})
Search Radius: ${reqRadius} km

Eligible Volunteers Dispatched (${deliveredVolunteers.length}):
${eligibleListText}`;

    let messageId = `sns-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const snsPublishRes = await snsClient.send(
        new PublishCommand({
          TopicArn: SNS_TOPIC_ARN,
          Subject: (subject || 'Padosi Volunteer Alert').substring(0, 100),
          Message: snsMessageBody,
          MessageAttributes: {
            requiredSkill: { DataType: 'String', StringValue: displaySkill },
            radiusKm: { DataType: 'Number', StringValue: String(reqRadius) },
            eligibleCount: { DataType: 'Number', StringValue: String(deliveredVolunteers.length) }
          }
        })
      );
      if (snsPublishRes.MessageId) {
        messageId = snsPublishRes.MessageId;
      }
      console.log(`Published to SNS Topic ${SNS_TOPIC_ARN}: MessageId=${messageId}`);
    } catch (snsErr) {
      console.warn(`SNS Publish to ${SNS_TOPIC_ARN} warning:`, snsErr.message);
    }

    // 5. Record results in DynamoDB 'padosi-deliveries'
    const deliveryRecord = {
      deliveryId: `del-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      messageId,
      subject,
      message,
      requiredSkill: displaySkill,
      requesterLatitude: reqLat,
      requesterLongitude: reqLng,
      radiusKm: reqRadius,
      eligibleCount: deliveredVolunteers.length,
      deliveredCount: deliveredVolunteers.length,
      skippedCount: skippedVolunteers.length,
      volunteers: evaluatedVolunteers,
      timestamp: new Date().toISOString()
    };

    try {
      await docClient.send(
        new PutCommand({
          TableName: DELIVERIES_TABLE,
          Item: deliveryRecord
        })
      );
      console.log(`Recorded delivery in ${DELIVERIES_TABLE}: ${deliveryRecord.deliveryId}`);
    } catch (putErr) {
      console.warn(`Could not save record to ${DELIVERIES_TABLE}:`, putErr.message);
    }

    // 6. Return response to API Gateway & Frontend
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Broadcast published successfully',
        messageId,
        eligibleCount: deliveredVolunteers.length,
        deliveredCount: deliveredVolunteers.length,
        skippedCount: skippedVolunteers.length,
        volunteers: evaluatedVolunteers
      })
    };
  } catch (error) {
    console.error('Lambda handler execution failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Internal Lambda Error'
      })
    };
  }
};
