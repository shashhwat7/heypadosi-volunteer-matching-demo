import {
  SNSClient,
  CreateTopicCommand,
  ListTopicsCommand,
  GetTopicAttributesCommand,
  PublishCommand,
  SubscribeCommand,
  ConfirmSubscriptionCommand,
  SetSubscriptionAttributesCommand
} from '@aws-sdk/client-sns';
import {
  Topic,
  Subscription,
  PublishRequest,
  DeliveryLogEntry,
  InboxMessage,
  DashboardStats,
  MessageAttributeValue
} from './types';
import { evaluateSnsFilterPolicy } from './snsFilterEvaluator';
import { evaluateSubscriberGeoRadius, getH3Resolution9Cell } from './geo';

export class AwsService {
  private snsClient: SNSClient | null = null;
  private isRealAws: boolean = false;
  private awsRegion: string = process.env.AWS_REGION || 'ap-south-1';
  private awsAccountId: string = '123456789012';

  // State store (retained in memory, emulating DynamoDB tables + SNS state)
  private topics: Map<string, Topic> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();
  private deliveryLogs: DeliveryLogEntry[] = [];
  private emailInbox: InboxMessage[] = [];
  private smsInbox: InboxMessage[] = [];
  private messagesPublishedCount: number = 0;

  constructor() {
    this.initAwsClient();
    this.seedDemoData();
  }

  private initAwsClient() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (accessKeyId && secretAccessKey && accessKeyId.trim() !== '' && secretAccessKey.trim() !== '') {
      try {
        this.snsClient = new SNSClient({
          region: this.awsRegion,
          credentials: {
            accessKeyId,
            secretAccessKey,
            sessionToken: process.env.AWS_SESSION_TOKEN
          }
        });
        this.isRealAws = true;
        console.log(`[PadosiCast] Initialized real AWS SNS Client for region ${this.awsRegion}`);
      } catch (err) {
        console.warn('[PadosiCast] AWS Client initialization failed, falling back to simulation:', err);
        this.isRealAws = false;
      }
    } else {
      console.log('[PadosiCast] Running in high-fidelity Amazon SNS Simulation mode (No AWS keys supplied).');
      this.isRealAws = false;
    }
  }

  private seedDemoData() {
    // Initial Campus Alerts topic
    const topicArn = `arn:aws:sns:${this.awsRegion}:${this.awsAccountId}:campus-alerts`;
    this.topics.set(topicArn, {
      arn: topicArn,
      name: 'campus-alerts',
      type: 'Standard',
      displayName: 'Campus Community Alerts',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      subscriptionsCount: 4,
      attributes: {
        TopicArn: topicArn,
        DisplayName: 'Campus Community Alerts',
        SubscriptionsConfirmed: '3',
        SubscriptionsPending: '1',
        FifoTopic: 'false'
      }
    });

    // Initial Urgent Notices topic (FIFO)
    const fifoArn = `arn:aws:sns:${this.awsRegion}:${this.awsAccountId}:urgent-security.fifo`;
    this.topics.set(fifoArn, {
      arn: fifoArn,
      name: 'urgent-security.fifo',
      type: 'FIFO',
      displayName: 'Urgent Security Alerts',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      subscriptionsCount: 1,
      attributes: {
        TopicArn: fifoArn,
        DisplayName: 'Urgent Security Alerts',
        SubscriptionsConfirmed: '1',
        SubscriptionsPending: '0',
        FifoTopic: 'true',
        ContentBasedDeduplication: 'true'
      }
    });

    // Reference center coordinate (Bangalore Electronic City / Tech Campus or Indian Tech Hub)
    // Latitude: 12.9716, Longitude: 77.5946
    const centerLat = 12.9716;
    const centerLng = 77.5946;

    // Subscriber 1: Confirmed Email - Parcel and Food deliveries inside campus (~0.4 km)
    const sub1Arn = `${topicArn}:sub-email-rahul-001`;
    this.subscriptions.set(sub1Arn, {
      arn: sub1Arn,
      topicArn,
      protocol: 'email',
      endpoint: 'rahul.sharma@campus.edu',
      subscriberName: 'Rahul Sharma (Hostel Block A)',
      status: 'Confirmed',
      filterPolicy: {
        category: ['parcel', 'food'],
        priority: ['normal', 'urgent']
      },
      location: {
        lat: centerLat + 0.003,
        lng: centerLng + 0.002,
        address: 'Hostel Block A, North Wing',
        h3Res9: getH3Resolution9Cell(centerLat + 0.003, centerLng + 0.002)
      },
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      isSimulated: true
    });

    // Subscriber 2: Confirmed SMS - Urgent security & campus-wide alerts (~0.9 km)
    const sub2Arn = `${topicArn}:sub-sms-priya-002`;
    this.subscriptions.set(sub2Arn, {
      arn: sub2Arn,
      topicArn,
      protocol: 'sms',
      endpoint: '+919876543210',
      subscriberName: 'Priya Patel (Faculty Quarters)',
      status: 'Confirmed',
      filterPolicy: {
        priority: ['urgent']
      },
      location: {
        lat: centerLat - 0.006,
        lng: centerLng + 0.004,
        address: 'Faculty Housing, Unit 12',
        h3Res9: getH3Resolution9Cell(centerLat - 0.006, centerLng + 0.004)
      },
      createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
      isSimulated: true
    });

    // Subscriber 3: Confirmed Email - General notices, no filter policy (~1.8 km)
    const sub3Arn = `${topicArn}:sub-email-ananya-003`;
    this.subscriptions.set(sub3Arn, {
      arn: sub3Arn,
      topicArn,
      protocol: 'email',
      endpoint: 'ananya.rao@alumni.org',
      subscriberName: 'Ananya Rao (Tech Park Off-Campus)',
      status: 'Confirmed',
      filterPolicy: null, // Accepts all
      location: {
        lat: centerLat + 0.014,
        lng: centerLng - 0.012,
        address: 'Outer Ring Tech Park, Gate 3',
        h3Res9: getH3Resolution9Cell(centerLat + 0.014, centerLng - 0.012)
      },
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      isSimulated: true
    });

    // Subscriber 4: Pending Confirmation SMS (~0.5 km)
    const sub4Arn = `${topicArn}:sub-pending-kiran-004`;
    this.subscriptions.set(sub4Arn, {
      arn: sub4Arn,
      topicArn,
      protocol: 'sms',
      endpoint: '+919123456780',
      subscriberName: 'Kiran Verma (Student Center)',
      status: 'PendingConfirmation',
      confirmationToken: 'sim-tok-847291',
      filterPolicy: {
        category: ['parcel']
      },
      location: {
        lat: centerLat + 0.002,
        lng: centerLng - 0.003,
        address: 'Student Recreation Hub',
        h3Res9: getH3Resolution9Cell(centerLat + 0.002, centerLng - 0.003)
      },
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      isSimulated: true
    });

    // Subscriber 5: Far away (~7.5 km) Confirmed Email
    const sub5Arn = `${topicArn}:sub-email-vikram-005`;
    this.subscriptions.set(sub5Arn, {
      arn: sub5Arn,
      topicArn,
      protocol: 'email',
      endpoint: 'vikram.nair@suburb.in',
      subscriberName: 'Vikram Nair (Suburban Residence)',
      status: 'Confirmed',
      filterPolicy: {
        category: ['parcel', 'announcement']
      },
      location: {
        lat: centerLat + 0.055,
        lng: centerLng + 0.048,
        address: 'Green Meadows Layout, Sector 7',
        h3Res9: getH3Resolution9Cell(centerLat + 0.055, centerLng + 0.048)
      },
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      isSimulated: true
    });

    // Also attach sub2 to FIFO topic
    const subFifoArn = `${fifoArn}:sub-sms-priya-fifo`;
    this.subscriptions.set(subFifoArn, {
      arn: subFifoArn,
      topicArn: fifoArn,
      protocol: 'sms',
      endpoint: '+919876543210',
      subscriberName: 'Priya Patel (Security Desk)',
      status: 'Confirmed',
      filterPolicy: null,
      location: {
        lat: centerLat - 0.006,
        lng: centerLng + 0.004,
        address: 'Faculty Housing, Unit 12',
        h3Res9: getH3Resolution9Cell(centerLat - 0.006, centerLng + 0.004)
      },
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      isSimulated: true
    });
  }

  public getConfig() {
    return {
      isRealAws: this.isRealAws,
      awsRegion: this.awsRegion,
      awsAccountId: this.awsAccountId
    };
  }

  // Topic Operations
  public async listTopics(): Promise<Topic[]> {
    if (this.isRealAws && this.snsClient) {
      try {
        const cmd = new ListTopicsCommand({});
        const res = await this.snsClient.send(cmd);
        if (res.Topics) {
          for (const t of res.Topics) {
            if (t.TopicArn && !this.topics.has(t.TopicArn)) {
              const name = t.TopicArn.split(':').pop() || '';
              const isFifo = name.endsWith('.fifo');
              this.topics.set(t.TopicArn, {
                arn: t.TopicArn,
                name,
                type: isFifo ? 'FIFO' : 'Standard',
                createdAt: new Date().toISOString(),
                subscriptionsCount: 0,
                attributes: {
                  TopicArn: t.TopicArn,
                  FifoTopic: isFifo ? 'true' : 'false'
                }
              });
            }
          }
        }
      } catch (err) {
        console.error('[PadosiCast] AWS ListTopics error:', err);
      }
    }
    return Array.from(this.topics.values());
  }

  public async getTopic(arn: string): Promise<Topic | undefined> {
    return this.topics.get(arn);
  }

  public async createTopic(name: string, type: 'Standard' | 'FIFO', displayName?: string): Promise<Topic> {
    let cleanName = name.trim();
    if (type === 'FIFO' && !cleanName.endsWith('.fifo')) {
      cleanName += '.fifo';
    } else if (type === 'Standard' && cleanName.endsWith('.fifo')) {
      cleanName = cleanName.replace(/\.fifo$/, '');
    }

    const topicArn = `arn:aws:sns:${this.awsRegion}:${this.awsAccountId}:${cleanName}`;

    if (this.isRealAws && this.snsClient) {
      try {
        const attributes: Record<string, string> = {};
        if (type === 'FIFO') {
          attributes['FifoTopic'] = 'true';
          attributes['ContentBasedDeduplication'] = 'true';
        }
        if (displayName) {
          attributes['DisplayName'] = displayName;
        }

        const cmd = new CreateTopicCommand({
          Name: cleanName,
          Attributes: attributes
        });
        const res = await this.snsClient.send(cmd);
        const realArn = res.TopicArn || topicArn;

        const topic: Topic = {
          arn: realArn,
          name: cleanName,
          type,
          displayName,
          createdAt: new Date().toISOString(),
          subscriptionsCount: 0,
          attributes: {
            TopicArn: realArn,
            DisplayName: displayName,
            FifoTopic: type === 'FIFO' ? 'true' : 'false'
          }
        };
        this.topics.set(realArn, topic);
        return topic;
      } catch (err) {
        console.error('[PadosiCast] Real AWS CreateTopic error:', err);
        // Fallback to local representation if permission denied or AWS error
      }
    }

    const topic: Topic = {
      arn: topicArn,
      name: cleanName,
      type,
      displayName,
      createdAt: new Date().toISOString(),
      subscriptionsCount: 0,
      attributes: {
        TopicArn: topicArn,
        DisplayName: displayName,
        SubscriptionsConfirmed: '0',
        SubscriptionsPending: '0',
        FifoTopic: type === 'FIFO' ? 'true' : 'false'
      }
    };
    this.topics.set(topicArn, topic);
    return topic;
  }

  // Subscription Operations
  public async listSubscriptions(topicArn?: string): Promise<Subscription[]> {
    const subs = Array.from(this.subscriptions.values());
    if (topicArn) {
      return subs.filter(s => s.topicArn === topicArn);
    }
    return subs;
  }

  public async createSubscription(params: {
    topicArn: string;
    protocol: 'email' | 'sms' | 'http';
    endpoint: string;
    subscriberName: string;
    location: { lat: number; lng: number; address?: string };
    filterPolicy?: Record<string, any> | null;
    autoConfirm?: boolean;
  }): Promise<Subscription> {
    const subId = `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const subArn = `${params.topicArn}:${subId}`;
    const h3Cell = getH3Resolution9Cell(params.location.lat, params.location.lng);

    const subscription: Subscription = {
      arn: subArn,
      topicArn: params.topicArn,
      protocol: params.protocol,
      endpoint: params.endpoint,
      subscriberName: params.subscriberName || params.endpoint,
      status: params.autoConfirm ? 'Confirmed' : 'PendingConfirmation',
      confirmationToken: `token-${Math.random().toString(36).substring(2, 9)}`,
      filterPolicy: params.filterPolicy || null,
      location: {
        ...params.location,
        h3Res9: h3Cell
      },
      createdAt: new Date().toISOString(),
      isSimulated: true
    };

    // If real AWS is configured and protocol is email/sms, also try SNS subscribe
    if (this.isRealAws && this.snsClient) {
      try {
        const attributes: Record<string, string> = {};
        if (params.filterPolicy && Object.keys(params.filterPolicy).length > 0) {
          attributes['FilterPolicy'] = JSON.stringify(params.filterPolicy);
        }
        await this.snsClient.send(
          new SubscribeCommand({
            TopicArn: params.topicArn,
            Protocol: params.protocol,
            Endpoint: params.endpoint,
            Attributes: attributes,
            ReturnSubscriptionArn: true
          })
        );
      } catch (err) {
        console.warn('[PadosiCast] Real AWS subscribe attempt:', err);
      }
    }

    this.subscriptions.set(subArn, subscription);

    // Update topic subscription counts
    const topic = this.topics.get(params.topicArn);
    if (topic) {
      topic.subscriptionsCount += 1;
    }

    return subscription;
  }

  public async confirmSubscription(arn: string): Promise<Subscription | null> {
    const sub = this.subscriptions.get(arn);
    if (!sub) return null;

    sub.status = 'Confirmed';
    this.subscriptions.set(arn, sub);

    const topic = this.topics.get(sub.topicArn);
    if (topic && topic.attributes) {
      const conf = parseInt(topic.attributes.SubscriptionsConfirmed || '0', 10) + 1;
      topic.attributes.SubscriptionsConfirmed = conf.toString();
    }
    return sub;
  }

  public async updateFilterPolicy(arn: string, filterPolicy: Record<string, any> | null): Promise<Subscription | null> {
    const sub = this.subscriptions.get(arn);
    if (!sub) return null;

    sub.filterPolicy = filterPolicy;
    this.subscriptions.set(arn, sub);
    return sub;
  }

  // Publishing and Fan-out Pipeline
  public async publishMessage(req: PublishRequest): Promise<{
    messageId: string;
    topicArn: string;
    deliveries: DeliveryLogEntry[];
    realAwsPublished: boolean;
  }> {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    this.messagesPublishedCount += 1;

    let realAwsPublished = false;

    // 1. If Real AWS SNS is enabled, publish to AWS SNS
    if (this.isRealAws && this.snsClient) {
      try {
        const snsAttrs: Record<string, any> = {};
        if (req.messageAttributes) {
          for (const [key, val] of Object.entries(req.messageAttributes)) {
            snsAttrs[key] = {
              DataType: val.DataType || 'String',
              StringValue: val.StringValue || (val.NumberValue ? String(val.NumberValue) : '')
            };
          }
        }

        const publishCmd = new PublishCommand({
          TopicArn: req.topicArn,
          Subject: req.subject,
          Message: req.message,
          MessageAttributes: snsAttrs
        });
        const res = await this.snsClient.send(publishCmd);
        if (res.MessageId) {
          realAwsPublished = true;
          console.log(`[PadosiCast] Published message ${res.MessageId} to real Amazon SNS.`);
        }
      } catch (err) {
        console.error('[PadosiCast] Real AWS SNS publish error:', err);
      }
    }

    // 2. Execute PadosiCast Fan-out & Delivery Pipeline
    // Retrieve all subscriptions registered for this topic
    const topic = this.topics.get(req.topicArn);
    const topicName = topic?.name || req.topicArn.split(':').pop() || 'Topic';
    const topicSubs = Array.from(this.subscriptions.values()).filter(s => s.topicArn === req.topicArn);

    const flattenedAttrs: Record<string, string> = {};
    if (req.messageAttributes) {
      for (const [k, v] of Object.entries(req.messageAttributes)) {
        flattenedAttrs[k] = v.StringValue || (v.NumberValue ? String(v.NumberValue) : '');
      }
    }

    const newDeliveries: DeliveryLogEntry[] = [];

    for (const sub of topicSubs) {
      let filterResult: DeliveryLogEntry['filterResult'] = 'NONE';
      let filterExplanation = 'No filter policy applied';
      let geoResult: DeliveryLogEntry['geoResult'] = 'NOT_APPLICABLE';
      let geoExplanation = 'Geo-radius filtering not enabled for this message';
      let distanceKm: number | null = null;
      let status: DeliveryLogEntry['status'] = 'Delivered';
      let skipReason: string | null = null;

      // Condition 1: Subscription Confirmation Check
      if (sub.status !== 'Confirmed') {
        status = 'Skipped';
        skipReason = 'Subscription not confirmed';
        filterExplanation = 'Subscription pending confirmation; filter not evaluated.';
        geoExplanation = 'Subscription pending confirmation; geo check bypassed.';
      } else {
        // Condition 2: SNS Filter Policy Evaluation
        const filterEval = evaluateSnsFilterPolicy(sub.filterPolicy, req.messageAttributes);
        filterResult = sub.filterPolicy ? (filterEval.matches ? 'MATCH' : 'MISMATCH') : 'NONE';
        filterExplanation = filterEval.explanation;

        if (!filterEval.matches) {
          status = 'Skipped';
          skipReason = 'Filter policy mismatch';
        }

        // Condition 3: PadosiCast Geo-Radius Check (if enabled by publisher)
        if (req.geoRadiusEnabled && req.publisherLocation && req.radiusKm !== undefined) {
          const geoEval = evaluateSubscriberGeoRadius(
            req.publisherLocation.lat,
            req.publisherLocation.lng,
            req.radiusKm,
            sub.location.lat,
            sub.location.lng
          );
          distanceKm = geoEval.distanceKm;
          geoResult = geoEval.isWithinRadius ? 'WITHIN_RADIUS' : 'OUTSIDE_RADIUS';
          geoExplanation = geoEval.explanation;

          // If it was still eligible, but outside geo radius -> skip!
          if (status === 'Delivered' && !geoEval.isWithinRadius) {
            status = 'Skipped';
            skipReason = 'Outside geo-radius';
          }
        }
      }

      const deliveryEntry: DeliveryLogEntry = {
        id: `del-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        messageId,
        topicArn: req.topicArn,
        topicName,
        subject: req.subject,
        subscriber: sub.subscriberName,
        endpoint: sub.endpoint,
        protocol: sub.protocol,
        distanceKm,
        filterResult,
        filterExplanation,
        geoResult,
        geoExplanation,
        status,
        skipReason,
        timestamp: new Date().toISOString(),
        messageAttributes: flattenedAttrs,
        retryCount: 0
      };

      this.deliveryLogs.unshift(deliveryEntry);
      newDeliveries.push(deliveryEntry);

      // If delivered, send to Simulated Inboxes
      if (status === 'Delivered') {
        const inboxMsg: InboxMessage = {
          id: `inb-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          messageId,
          type: sub.protocol === 'sms' ? 'sms' : 'email',
          to: sub.endpoint,
          subscriberName: sub.subscriberName,
          subject: req.subject,
          body: req.message,
          topicName,
          timestamp: new Date().toISOString(),
          receivedAttributes: flattenedAttrs
        };

        if (sub.protocol === 'sms') {
          this.smsInbox.unshift(inboxMsg);
        } else {
          this.emailInbox.unshift(inboxMsg);
        }
      }
    }

    return {
      messageId,
      topicArn: req.topicArn,
      deliveries: newDeliveries,
      realAwsPublished
    };
  }

  // Delivery Logs
  public getDeliveryLogs(limit: number = 100): DeliveryLogEntry[] {
    return this.deliveryLogs.slice(0, limit);
  }

  // Simulated Inboxes
  public getEmailInbox(): InboxMessage[] {
    return this.emailInbox;
  }

  public getSmsInbox(): InboxMessage[] {
    return this.smsInbox;
  }

  public clearInboxes() {
    this.emailInbox = [];
    this.smsInbox = [];
  }

  // Dashboard Stats
  public getStats(): DashboardStats {
    let confirmedCount = 0;
    for (const sub of this.subscriptions.values()) {
      if (sub.status === 'Confirmed') confirmedCount++;
    }

    let successfulDeliveries = 0;
    let failedDeliveries = 0;
    let filterPolicyMismatches = 0;
    let geoFilteredCount = 0;

    for (const log of this.deliveryLogs) {
      if (log.status === 'Delivered') {
        successfulDeliveries++;
      } else if (log.status === 'Failed') {
        failedDeliveries++;
      } else if (log.status === 'Skipped') {
        if (log.skipReason === 'Filter policy mismatch') {
          filterPolicyMismatches++;
        } else if (log.skipReason === 'Outside geo-radius') {
          geoFilteredCount++;
        }
      }
    }

    return {
      topicsCount: this.topics.size,
      subscriptionsCount: this.subscriptions.size,
      confirmedSubscriptionsCount: confirmedCount,
      messagesPublishedCount: this.messagesPublishedCount,
      successfulDeliveriesCount: successfulDeliveries,
      failedDeliveriesCount: failedDeliveries,
      filteredMessagesCount: filterPolicyMismatches,
      geoFilteredMessagesCount: geoFilteredCount
    };
  }
}

export const awsService = new AwsService();
