import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { awsService } from './awsService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Status & Configuration
app.get('/api/config', (req, res) => {
  res.json(awsService.getConfig());
});

// Dashboard Statistics
app.get('/api/stats', (req, res) => {
  res.json(awsService.getStats());
});

// Topics Endpoints
app.get('/api/topics', async (req, res) => {
  try {
    const topics = await awsService.listTopics();
    res.json(topics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/topics', async (req, res) => {
  try {
    const { name, type, displayName } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Topic name is required.' });
    }
    const topic = await awsService.createTopic(name, type || 'Standard', displayName);
    res.status(201).json(topic);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/topics/:arn', async (req, res) => {
  try {
    const topic = await awsService.getTopic(req.params.arn);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found.' });
    }
    res.json(topic);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Subscriptions Endpoints
app.get('/api/subscriptions', async (req, res) => {
  try {
    const topicArn = req.query.topicArn as string | undefined;
    const subs = await awsService.listSubscriptions(topicArn);
    res.json(subs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/subscriptions', async (req, res) => {
  try {
    const {
      topicArn,
      protocol,
      endpoint,
      subscriberName,
      location,
      filterPolicy,
      autoConfirm
    } = req.body;

    if (!topicArn || !protocol || !endpoint || !location) {
      return res.status(400).json({
        error: 'Missing required subscription fields: topicArn, protocol, endpoint, location (lat/lng)'
      });
    }

    const sub = await awsService.createSubscription({
      topicArn,
      protocol,
      endpoint,
      subscriberName,
      location,
      filterPolicy,
      autoConfirm: Boolean(autoConfirm)
    });

    res.status(201).json(sub);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/subscriptions/confirm', async (req, res) => {
  try {
    const { arn } = req.body;
    if (!arn) {
      return res.status(400).json({ error: 'Subscription ARN is required.' });
    }
    const confirmed = await awsService.confirmSubscription(arn);
    if (!confirmed) {
      return res.status(404).json({ error: 'Subscription not found.' });
    }
    res.json(confirmed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/subscriptions/filter-policy', async (req, res) => {
  try {
    const { arn, filterPolicy } = req.body;
    if (!arn) {
      return res.status(400).json({ error: 'Subscription ARN is required.' });
    }
    const updated = await awsService.updateFilterPolicy(arn, filterPolicy);
    if (!updated) {
      return res.status(404).json({ error: 'Subscription not found.' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Publishing and Fan-out Endpoint
app.post('/api/publish', async (req, res) => {
  try {
    const {
      topicArn,
      subject,
      message,
      messageAttributes,
      geoRadiusEnabled,
      publisherLocation,
      radiusKm
    } = req.body;

    if (!topicArn || !subject || !message) {
      return res.status(400).json({ error: 'topicArn, subject, and message are required.' });
    }

    const result = await awsService.publishMessage({
      topicArn,
      subject,
      message,
      messageAttributes,
      geoRadiusEnabled,
      publisherLocation,
      radiusKm
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delivery Logs
app.get('/api/delivery-logs', (req, res) => {
  const limit = parseInt(req.query.limit as string, 10) || 100;
  res.json(awsService.getDeliveryLogs(limit));
});

// Simulated Inboxes
app.get('/api/inbox/email', (req, res) => {
  res.json(awsService.getEmailInbox());
});

app.get('/api/inbox/sms', (req, res) => {
  res.json(awsService.getSmsInbox());
});

app.post('/api/inbox/clear', (req, res) => {
  awsService.clearInboxes();
  res.json({ success: true, message: 'Inboxes cleared.' });
});

app.listen(PORT, () => {
  console.log(`[PadosiCast] Backend API running at http://localhost:${PORT}`);
});
