import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Copy,
  Check,
  Send,
  ExternalLink,
  Shield,
  Clock,
  Users,
  Info,
  Radio
} from 'lucide-react';
import { Topic } from '../types';
import { createTopic } from '../services/api';

interface TopicsViewProps {
  topics: Topic[];
  onTopicCreated: () => void;
  onPublishToTopic: (topicArn: string) => void;
  onSelectTopic: (topicArn: string) => void;
}

export const TopicsView: React.FC<TopicsViewProps> = ({
  topics,
  onTopicCreated,
  onPublishToTopic,
  onSelectTopic
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  // Form State
  const [topicName, setTopicName] = useState('');
  const [topicType, setTopicType] = useState<'Standard' | 'FIFO'>('Standard');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Copy feedback
  const [copiedArn, setCopiedArn] = useState<string | null>(null);

  const handleCopyArn = (arn: string) => {
    navigator.clipboard.writeText(arn);
    setCopiedArn(arn);
    setTimeout(() => setCopiedArn(null), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) {
      setError('Please provide a topic name.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      await createTopic({
        name: topicName.trim(),
        type: topicType,
        displayName: displayName.trim() || undefined
      });
      setShowCreateModal(false);
      setTopicName('');
      setDisplayName('');
      setTopicType('Standard');
      onTopicCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create topic');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-aws-blue" />
            <h1 className="text-xl font-bold text-gray-900">Amazon SNS Topics</h1>
          </div>
          <p className="text-xs text-gray-600 mt-1 max-w-xl">
            A topic is an access point and communication channel to which publishers send messages and subscribers attach.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-aws-orange hover:bg-aws-orangeHover text-white text-xs font-semibold px-4 py-2 rounded shadow flex items-center justify-center space-x-1.5 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Topic</span>
        </button>
      </div>

      {/* Topics Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="font-semibold text-xs text-gray-800 uppercase tracking-wider">
            Registered Topics ({topics.length})
          </div>
          <div className="text-[11px] text-gray-500">
            Click on a topic to view details and attributes
          </div>
        </div>

        {topics.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            No topics created yet. Click "Create Topic" to create your first Amazon SNS topic.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                <tr>
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Topic ARN</th>
                  <th className="py-2.5 px-4">Subscriptions</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topics.map((t) => (
                  <tr
                    key={t.arn}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    onClick={() => setSelectedTopic(t)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900 group-hover:text-aws-blue flex items-center space-x-1.5">
                        <span>{t.name}</span>
                        {t.displayName && (
                          <span className="text-[10px] text-gray-500 font-normal">
                            ({t.displayName})
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Created {new Date(t.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          t.type === 'FIFO'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span className="truncate max-w-xs">{t.arn}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyArn(t.arn);
                          }}
                          className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-800 transition-colors"
                          title="Copy Topic ARN"
                        >
                          {copiedArn === t.arn ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5 font-medium text-gray-700">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span>{t.subscriptionsCount}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPublishToTopic(t.arn);
                          }}
                          className="px-2.5 py-1 text-xs bg-aws-orange/10 hover:bg-aws-orange text-aws-orange hover:text-white rounded border border-aws-orange/30 font-medium transition-colors flex items-center space-x-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Publish</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Topic Details Drawer / Modal */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 text-left border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-aws-orange" />
                <h3 className="font-bold text-gray-900 text-base">
                  Topic Details: {selectedTopic.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTopic(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded border">
                  <div className="text-gray-500 font-medium">Type</div>
                  <div className="font-semibold text-gray-900 mt-1">{selectedTopic.type}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded border">
                  <div className="text-gray-500 font-medium">Display Name (SMS sender)</div>
                  <div className="font-semibold text-gray-900 mt-1">
                    {selectedTopic.displayName || 'None'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded border">
                <div className="text-gray-500 font-medium">Topic ARN</div>
                <div className="font-mono text-gray-800 text-[11px] mt-1 break-all flex items-center justify-between">
                  <span>{selectedTopic.arn}</span>
                  <button
                    onClick={() => handleCopyArn(selectedTopic.arn)}
                    className="ml-2 text-aws-blue hover:underline font-sans text-xs shrink-0"
                  >
                    Copy ARN
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">SNS Topic Attributes:</h4>
                <div className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-[11px] overflow-x-auto">
                  <pre>{JSON.stringify(selectedTopic.attributes, null, 2)}</pre>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-900">
                <div className="font-semibold mb-1 flex items-center space-x-1">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>Topic Characteristics:</span>
                </div>
                <p className="text-blue-800">
                  {selectedTopic.type === 'FIFO'
                    ? 'FIFO topics guarantee exact message ordering (First-In, First-Out) and message deduplication. Subscribers must be SQS FIFO queues in standard AWS, or application handlers in PadosiCast.'
                    : 'Standard topics provide maximum throughput, best-effort message ordering, and fan out instantly to unlimited numbers of endpoints (Email, SMS, HTTP, Lambda).'}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedTopic(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const arn = selectedTopic.arn;
                  setSelectedTopic(null);
                  onPublishToTopic(arn);
                }}
                className="px-4 py-2 bg-aws-orange hover:bg-aws-orangeHover text-white text-xs font-semibold rounded shadow flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish to this Topic</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Topic Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 text-left border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-aws-orange" />
                <h3 className="font-bold text-gray-900 text-base">Create Amazon SNS Topic</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                  {error}
                </div>
              )}

              {/* Type Selection */}
              <div>
                <label className="block font-semibold text-gray-900 mb-1.5">Topic Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 border rounded-lg cursor-pointer flex flex-col justify-between ${
                      topicType === 'Standard'
                        ? 'border-aws-blue bg-blue-50/50 ring-1 ring-aws-blue'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">Standard</span>
                      <input
                        type="radio"
                        name="topicType"
                        checked={topicType === 'Standard'}
                        onChange={() => setTopicType('Standard')}
                        className="text-aws-blue focus:ring-aws-blue"
                      />
                    </div>
                    <span className="text-[11px] text-gray-500 mt-2">
                      Highest throughput, best-effort message ordering, at-least-once delivery.
                    </span>
                  </label>

                  <label
                    className={`p-3 border rounded-lg cursor-pointer flex flex-col justify-between ${
                      topicType === 'FIFO'
                        ? 'border-aws-blue bg-blue-50/50 ring-1 ring-aws-blue'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">FIFO</span>
                      <input
                        type="radio"
                        name="topicType"
                        checked={topicType === 'FIFO'}
                        onChange={() => setTopicType('FIFO')}
                        className="text-aws-blue focus:ring-aws-blue"
                      />
                    </div>
                    <span className="text-[11px] text-gray-500 mt-2">
                      Strict message ordering (First-In, First-Out), exactly-once processing.
                    </span>
                  </label>
                </div>
              </div>

              {/* Topic Name */}
              <div>
                <label className="block font-semibold text-gray-900 mb-1">
                  Topic Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    placeholder={topicType === 'FIFO' ? 'e.g. security-notices.fifo' : 'e.g. campus-alerts'}
                    className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-xs focus:ring-2 focus:ring-aws-blue focus:border-transparent outline-none"
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  {topicType === 'FIFO'
                    ? 'FIFO topic names must end with the .fifo suffix (automatically appended if omitted).'
                    : 'Up to 256 alphanumeric characters, hyphens (-), and underscores (_).'}
                </p>
              </div>

              {/* Display Name */}
              <div>
                <label className="block font-semibold text-gray-900 mb-1">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Campus Alerts"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-aws-blue focus:border-transparent outline-none"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Used as the sender ID for SMS messages and the sender display name for emails.
                </p>
              </div>

              <div className="mt-6 flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-aws-orange hover:bg-aws-orangeHover text-white text-xs font-semibold rounded shadow transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating in AWS...' : 'Create Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
