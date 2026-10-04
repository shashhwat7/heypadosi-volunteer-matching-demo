import React, { useState } from 'react';
import {
  Mail,
  Trash2,
  RefreshCw,
  Search,
  Tag,
  Clock,
  Layers,
  Inbox,
  AlertCircle
} from 'lucide-react';
import { InboxMessage } from '../types';

interface EmailInboxViewProps {
  messages: InboxMessage[];
  onRefresh: () => void;
  onClear: () => void;
}

export const EmailInboxView: React.FC<EmailInboxViewProps> = ({
  messages,
  onRefresh,
  onClear
}) => {
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(
    messages.length > 0 ? messages[0] : null
  );
  const [filterSubscriber, setFilterSubscriber] = useState<string>('all');

  const uniqueSubscribers = Array.from(new Set(messages.map((m) => m.to)));

  const filteredMessages = messages.filter((m) => {
    if (filterSubscriber !== 'all' && m.to !== filterSubscriber) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Simulated Email Inbox</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
              PadosiCast Simulated Endpoint
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1 max-w-xl">
            Simulates messages delivered by Amazon SNS to confirmed email subscriptions without spamming external email inboxes during classroom demonstrations.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded shadow-sm flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
            <span>Refresh</span>
          </button>
          <button
            onClick={onClear}
            className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded shadow-sm flex items-center space-x-1.5"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
            <span>Clear Inbox</span>
          </button>
        </div>
      </div>

      {/* Main Mail Interface */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[600px]">
        {/* Email List (Left Column) */}
        <div className="border-r border-gray-200 flex flex-col h-full bg-gray-50/50">
          {/* Sub-header Filter */}
          <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700">
              Delivered Emails ({filteredMessages.length})
            </span>
            <select
              value={filterSubscriber}
              onChange={(e) => setFilterSubscriber(e.target.value)}
              className="text-[11px] bg-white border border-gray-300 rounded px-2 py-1 outline-none text-gray-700"
            >
              <option value="all">All Email Inboxes</option>
              {uniqueSubscribers.map((email) => (
                <option key={email} value={email}>
                  {email}
                </option>
              ))}
            </select>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
            {filteredMessages.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-xs flex flex-col items-center">
                <Inbox className="w-8 h-8 text-gray-300 mb-2" />
                <span>No delivered emails yet.</span>
                <span className="text-[10px] text-gray-400 mt-1">
                  Publish a message that matches an email subscription.
                </span>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 border-l-4 border-l-aws-blue'
                        : 'hover:bg-gray-100/70 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-gray-900 truncate">
                        {msg.subscriberName}
                      </span>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="text-xs font-medium text-gray-800 truncate mt-0.5">
                      {msg.subject || '(No Subject)'}
                    </div>

                    <div className="text-[11px] text-gray-500 line-clamp-2 mt-1">
                      {msg.body}
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                      <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                        {msg.topicName}
                      </span>
                      <span className="text-blue-600 font-mono">{msg.to}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Email Viewer (Right 2 Columns) */}
        <div className="md:col-span-2 flex flex-col h-full bg-white overflow-y-auto">
          {selectedMessage ? (
            <div className="p-6 space-y-6">
              {/* Header Box mimicking real AWS SNS email */}
              <div className="border-b border-gray-200 pb-5 space-y-3">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-bold text-gray-900 leading-snug">
                    {selectedMessage.subject || 'Amazon SNS Notification'}
                  </h2>
                  <span className="text-xs text-gray-500 font-mono">
                    {new Date(selectedMessage.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex">
                    <span className="w-16 font-semibold text-gray-500">From:</span>
                    <span className="text-gray-900 font-mono">
                      "{selectedMessage.topicName}" &lt;no-reply@sns.amazonaws.com&gt;
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-16 font-semibold text-gray-500">To:</span>
                    <span className="text-gray-900 font-semibold">
                      {selectedMessage.subscriberName}{' '}
                      <span className="font-mono font-normal text-gray-600">
                        &lt;{selectedMessage.to}&gt;
                      </span>
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-16 font-semibold text-gray-500">Topic:</span>
                    <span className="text-aws-blue font-mono">{selectedMessage.topicName}</span>
                  </div>
                </div>

                {/* Message Attributes Badge Chips */}
                {Object.keys(selectedMessage.receivedAttributes).length > 0 && (
                  <div className="pt-2 flex items-center space-x-2">
                    <span className="text-[11px] font-semibold text-gray-500 flex items-center space-x-1">
                      <Tag className="w-3 h-3 text-indigo-600" />
                      <span>SNS Attributes:</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(selectedMessage.receivedAttributes).map(([k, v]) => (
                        <span
                          key={k}
                          className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-900 text-[10px] font-mono"
                        >
                          {k} = "{v}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Message Body */}
              <div className="text-sm text-gray-800 leading-relaxed font-sans whitespace-pre-wrap">
                {selectedMessage.body}
              </div>

              {/* AWS SNS Standard Email Footer */}
              <div className="pt-8 border-t border-gray-200 text-[11px] text-gray-400 space-y-2">
                <p>
                  --<br />
                  If you wish to stop receiving notifications from this topic, please unsubscribe or contact your AWS administrator.
                </p>
                <p className="font-mono text-[10px]">
                  Message ID: {selectedMessage.messageId}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-xs">
              Select an email from the left column to preview its content.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
