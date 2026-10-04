export interface Topic {
  arn: string;
  name: string;
  type: 'Standard' | 'FIFO';
  displayName?: string;
  createdAt: string;
  subscriptionsCount: number;
  attributes: {
    TopicArn: string;
    DisplayName?: string;
    SubscriptionsConfirmed?: string;
    SubscriptionsPending?: string;
    FifoTopic?: string;
    ContentBasedDeduplication?: string;
    KmsMasterKeyId?: string;
  };
}

export type SubscriptionProtocol = 'email' | 'sms' | 'http';
export type SubscriptionStatus = 'PendingConfirmation' | 'Confirmed';

export interface SubscriberLocation {
  lat: number;
  lng: number;
  address?: string;
  h3Res9?: string;
}

export interface Subscription {
  arn: string;
  topicArn: string;
  protocol: SubscriptionProtocol;
  endpoint: string;
  subscriberName: string;
  status: SubscriptionStatus;
  confirmationToken?: string;
  filterPolicy: Record<string, any> | null;
  location: SubscriberLocation;
  createdAt: string;
  isSimulated: boolean;
}

export interface MessageAttributeValue {
  DataType: 'String' | 'Number' | 'String.Array';
  StringValue?: string;
  NumberValue?: string;
}

export interface PublishRequest {
  topicArn: string;
  subject: string;
  message: string;
  messageAttributes?: Record<string, MessageAttributeValue>;
  geoRadiusEnabled?: boolean;
  publisherLocation?: {
    lat: number;
    lng: number;
    address?: string;
  };
  radiusKm?: number;
}

export type DeliveryStatus = 'Delivered' | 'Retrying' | 'Failed' | 'Skipped';
export type FilterResult = 'MATCH' | 'MISMATCH' | 'NONE';
export type GeoResult = 'WITHIN_RADIUS' | 'OUTSIDE_RADIUS' | 'SKIPPED' | 'NOT_APPLICABLE';

export interface DeliveryLogEntry {
  id: string;
  messageId: string;
  topicArn: string;
  topicName: string;
  subject: string;
  subscriber: string;
  endpoint: string;
  protocol: SubscriptionProtocol;
  distanceKm: number | null;
  filterResult: FilterResult;
  filterExplanation: string;
  geoResult: GeoResult;
  geoExplanation: string;
  status: DeliveryStatus;
  skipReason: string | null;
  timestamp: string;
  messageAttributes: Record<string, string>;
  retryCount: number;
}

export interface InboxMessage {
  id: string;
  messageId: string;
  type: 'email' | 'sms';
  to: string;
  subscriberName: string;
  subject?: string;
  body: string;
  topicName: string;
  timestamp: string;
  receivedAttributes: Record<string, string>;
}

export interface DashboardStats {
  topicsCount: number;
  subscriptionsCount: number;
  confirmedSubscriptionsCount: number;
  messagesPublishedCount: number;
  successfulDeliveriesCount: number;
  failedDeliveriesCount: number;
  filteredMessagesCount: number;
  geoFilteredMessagesCount: number;
}

export interface ServerConfig {
  isRealAws: boolean;
  awsRegion: string;
  awsAccountId: string;
}
