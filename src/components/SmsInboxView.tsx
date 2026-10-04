import React, { useState } from 'react';
import {
  Smartphone,
  Trash2,
  RefreshCw,
  Tag,
  Shield,
  Send,
  MessageSquare,
  User,
  Radio
} from 'lucide-react';
import { InboxMessage } from '../types';

interface SmsInboxViewProps {
  messages: InboxMessage[];
  onRefresh: () => void;
  onClear: () => void;
}

export const SmsInboxView: React.FC<SmsInboxViewProps> = ({
  messages,
  onRefresh,
  onClear
}) => {
  const uniquePhones = Array.from(new Set(messages.map((m) => m.to)));
  const [selectedPhone, setSelectedPhone] = useState<string>(
    uniquePhones.length > 0 ? uniquePhones[0] : '+919876543210'
  );

  const phoneMessages = messages.filter((m) => m.to === selectedPhone);
  const activeSubscriberName =
    phoneMessages.length > 0
      ? phoneMessages[0].subscriberName
      : selectedPhone === '+919876543210'
      ? 'Priya Patel (Faculty Quarters)'
      : 'Kiran Verma (Student Center)';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-purple-600" />
            <h1 className="text-xl font-bold text-gray-900">Simulated SMS Phone</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
              PadosiCast Simulated Endpoint
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1 max-w-xl">
            Simulates text messages received by mobile devices over SMS protocol from Amazon SNS without consuming external SMS credits or telecom carrier rates.
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
            <span>Clear SMS</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Device Selector & Sub Info (1 Column) */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-gray-900">Select Simulated Phone:</h3>

            <div className="space-y-2">
              {[
                { number: '+919876543210', name: 'Priya Patel (Faculty Quarters)' },
                { number: '+919123456780', name: 'Kiran Verma (Student Center)' },
                ...uniquePhones
                  .filter((p) => p !== '+919876543210' && p !== '+919123456780')
                  .map((p) => ({ number: p, name: 'Custom Subscriber' }))
              ].map((sub) => (
                <button
                  key={sub.number}
                  onClick={() => setSelectedPhone(sub.number)}
                  className={`w-full text-left p-3 rounded-lg border transition-all text-xs ${
                    selectedPhone === sub.number
                      ? 'border-purple-600 bg-purple-50 text-purple-950 ring-1 ring-purple-600 font-semibold'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{sub.name}</span>
                    <span className="font-mono text-[11px] opacity-75">{sub.number}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    {messages.filter((m) => m.to === sub.number).length} messages received
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm text-xs text-gray-600 space-y-2">
            <div className="font-bold text-gray-900 flex items-center space-x-1.5">
              <Radio className="w-4 h-4 text-purple-600" />
              <span>SMS Characteristics in Amazon SNS</span>
            </div>
            <p className="leading-relaxed">
              In real AWS SNS, SMS messages are delivered globally through AWS telecom aggregators. The SNS Topic Display Name determines the sender ID (alphanumeric where carrier regulations allow).
            </p>
          </div>
        </div>

        {/* Smartphone Mockup Canvas (2 Columns) */}
        <div className="md:col-span-2 flex justify-center">
          <div className="w-full max-w-md bg-slate-900 p-4 rounded-[40px] shadow-2xl border-4 border-slate-700">
            {/* Phone Screen */}
            <div className="bg-gray-100 rounded-[32px] overflow-hidden flex flex-col h-[580px] border border-slate-800">
              {/* Phone Status Bar */}
              <div className="bg-slate-800 text-white px-6 py-2 flex items-center justify-between text-[11px] font-mono">
                <span>9:41 AM</span>
                <div className="w-16 h-4 bg-black rounded-full" /> {/* Dynamic Island */}
                <span>5G 100%</span>
              </div>

              {/* Messaging App Header */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center space-x-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-aws-orange text-white flex items-center justify-center font-bold text-xs">
                  SNS
                </div>
                <div className="flex-1">
                  <div className="font-bold text-xs text-gray-900 leading-tight">
                    AWS-SNS Alerts
                  </div>
                  <div className="text-[10px] text-gray-500">
                    To: {activeSubscriberName} ({selectedPhone})
                  </div>
                </div>
              </div>

              {/* Messages Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#e5e9f0]/40">
                {phoneMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs text-center p-4">
                    <MessageSquare className="w-8 h-8 text-gray-300 mb-2" />
                    <span>No SMS messages received yet.</span>
                    <span className="text-[10px] text-gray-400 mt-1">
                      Publish a message matching this subscriber's filter policy and location!
                    </span>
                  </div>
                ) : (
                  phoneMessages.map((msg) => (
                    <div key={msg.id} className="flex flex-col items-start space-y-1">
                      <div className="text-[9px] text-gray-400 font-mono ml-2">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>

                      {/* Bubble */}
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-3.5 shadow-sm max-w-[88%] space-y-2 text-xs">
                        {msg.subject && (
                          <div className="font-bold text-gray-900 text-[11px] border-b pb-1 text-aws-blue">
                            [{msg.topicName}] {msg.subject}
                          </div>
                        )}
                        <p className="text-gray-800 leading-relaxed font-sans">{msg.body}</p>

                        {/* Received Attributes */}
                        {Object.keys(msg.receivedAttributes).length > 0 && (
                          <div className="pt-1 flex flex-wrap gap-1">
                            {Object.entries(msg.receivedAttributes).map(([k, v]) => (
                              <span
                                key={k}
                                className="bg-purple-50 text-purple-900 border border-purple-200 text-[9px] px-1.5 py-0.5 rounded font-mono"
                              >
                                {k}: {v}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom bar */}
              <div className="bg-white p-2.5 border-t border-gray-200 text-center text-[10px] text-gray-400">
                Incoming broadcast channel (Receive only)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
