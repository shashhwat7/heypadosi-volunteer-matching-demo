import {
  Topic,
  Subscription,
  PublishRequest,
  DeliveryLogEntry,
  InboxMessage,
  DashboardStats,
  ServerConfig
} from '../types';

const API_BASE = '/api';

export async function fetchServerConfig(): Promise<ServerConfig> {
  const res = await fetch(`${API_BASE}/config`);
  if (!res.ok) throw new Error('Failed to fetch server config');
  return res.json();
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchTopics(): Promise<Topic[]> {
  const res = await fetch(`${API_BASE}/topics`);
  if (!res.ok) throw new Error('Failed to fetch topics');
  return res.json();
}

export async function fetchTopic(arn: string): Promise<Topic> {
  const res = await fetch(`${API_BASE}/topics/${encodeURIComponent(arn)}`);
  if (!res.ok) throw new Error('Failed to fetch topic details');
  return res.json();
}

export async function createTopic(data: { name: string; type: 'Standard' | 'FIFO'; displayName?: string }): Promise<Topic> {
  const res = await fetch(`${API_BASE}/topics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create topic');
  }
  return res.json();
}

export async function fetchSubscriptions(topicArn?: string): Promise<Subscription[]> {
  const url = topicArn ? `${API_BASE}/subscriptions?topicArn=${encodeURIComponent(topicArn)}` : `${API_BASE}/subscriptions`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch subscriptions');
  return res.json();
}

export async function createSubscription(data: {
  topicArn: string;
  protocol: 'email' | 'sms' | 'http';
  endpoint: string;
  subscriberName: string;
  location: { lat: number; lng: number; address?: string };
  filterPolicy?: Record<string, any> | null;
  autoConfirm?: boolean;
}): Promise<Subscription> {
  const res = await fetch(`${API_BASE}/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create subscription');
  }
  return res.json();
}

export async function confirmSubscription(arn: string): Promise<Subscription> {
  const res = await fetch(`${API_BASE}/subscriptions/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ arn })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to confirm subscription');
  }
  return res.json();
}

export async function updateFilterPolicy(arn: string, filterPolicy: Record<string, any> | null): Promise<Subscription> {
  const res = await fetch(`${API_BASE}/subscriptions/filter-policy`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ arn, filterPolicy })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update filter policy');
  }
  return res.json();
}

export async function publishMessage(data: PublishRequest): Promise<{
  messageId: string;
  topicArn: string;
  deliveries: DeliveryLogEntry[];
  realAwsPublished: boolean;
}> {
  const res = await fetch(`${API_BASE}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to publish message');
  }
  return res.json();
}

export async function fetchDeliveryLogs(limit: number = 100): Promise<DeliveryLogEntry[]> {
  const res = await fetch(`${API_BASE}/delivery-logs?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch delivery logs');
  return res.json();
}

export async function fetchEmailInbox(): Promise<InboxMessage[]> {
  const res = await fetch(`${API_BASE}/inbox/email`);
  if (!res.ok) throw new Error('Failed to fetch email inbox');
  return res.json();
}

export async function fetchSmsInbox(): Promise<InboxMessage[]> {
  const res = await fetch(`${API_BASE}/inbox/sms`);
  if (!res.ok) throw new Error('Failed to fetch SMS inbox');
  return res.json();
}

export async function clearInboxes(): Promise<void> {
  await fetch(`${API_BASE}/inbox/clear`, { method: 'POST' });
}

export interface ReturnedVolunteer {
  subscriberId: string;
  name: string;
  skill: string;
  channel: string;
  latitude: number;
  longitude: number;
  distance: number;
  confirmed: boolean;
  eligible: boolean;
  status?: string;
  skipReason?: string | null;
  [key: string]: any;
}

export interface AwsPublishPayload {
  message: string;
  subject?: string;
  requiredSkill?: string;
  skill?: string;
  latitude: number;
  longitude: number;
  radius: number;
  [key: string]: any;
}

export interface AwsPublishResponse {
  message?: string;
  messageId?: string;
  eligibleCount?: number;
  deliveredCount?: number;
  skippedCount?: number;
  eligibleSubscribers?: ReturnedVolunteer[];
  skippedSubscribers?: ReturnedVolunteer[];
  volunteers?: ReturnedVolunteer[];
  subscribers?: ReturnedVolunteer[];
  [key: string]: any;
}

export const AWS_API_GATEWAY_ENDPOINT =
  (import.meta.env.VITE_AWS_API_GATEWAY_ENDPOINT as string) ||
  'https://dwd9l98512.execute-api.ap-south-1.amazonaws.com/dev1/publish';

export async function publishToAwsApiGateway(
  payload: AwsPublishPayload
): Promise<AwsPublishResponse> {
  const normalizedPayload = {
    ...payload,
    skill: payload.skill || payload.requiredSkill,
    requiredSkill: payload.requiredSkill || payload.skill
  };

  const res = await fetch(AWS_API_GATEWAY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(normalizedPayload)
  });

  if (!res.ok) {
    const errorText = await res.text();
    let message = errorText;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message || parsed.error || errorText;
    } catch {}
    throw new Error(`AWS API Gateway Error (${res.status}): ${message}`);
  }

  return res.json();
}

