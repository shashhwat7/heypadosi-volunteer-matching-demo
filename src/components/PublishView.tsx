import React, { useState } from 'react';
import {
  Send,
  Radio,
  MapPin,
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Filter,
  Sparkles,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { Topic, DeliveryLogEntry, MessageAttributeValue } from '../types';
import { publishMessage } from '../services/api';

interface PublishViewProps {
  topics: Topic[];
  defaultTopicArn?: string;
  onPublishComplete: () => void;
  setActiveTab: (tab: string) => void;
}

interface AttributeRow {
  name: string;
  type: 'String' | 'Number';
  value: string;
}

export const PublishView: React.FC<PublishViewProps> = ({
  topics,
  defaultTopicArn,
  onPublishComplete,
  setActiveTab
}) => {
  const [topicArn, setTopicArn] = useState<string>(
    defaultTopicArn || (topics.length > 0 ? topics[0].arn : '')
  );
  const [subject, setSubject] = useState('Campus Parcel Delivery Ready');
  const [message, setMessage] = useState(
    'Your courier package #IND-84920 has arrived at Gate 1 Reception Desk. Please collect before 8:00 PM with your student ID.'
  );

  // Message Attributes state
  const [attributes, setAttributes] = useState<AttributeRow[]>([
    { name: 'category', type: 'String', value: 'parcel' },
    { name: 'priority', type: 'String', value: 'urgent' },
    { name: 'area', type: 'String', value: 'campus' }
  ]);

  // Geo Radius state
  const [geoRadiusEnabled, setGeoRadiusEnabled] = useState(true);
  const [publisherLat, setPublisherLat] = useState('12.9716');
  const [publisherLng, setPublisherLng] = useState('77.5946');
  const [publisherAddress, setPublisherAddress] = useState('Campus Main Gate 1 Dispatch Post');
  const [radiusKm, setRadiusKm] = useState(1.5);

  // Publishing State & Result
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{
    messageId: string;
    topicArn: string;
    deliveries: DeliveryLogEntry[];
    realAwsPublished: boolean;
  } | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Quick Preset Scenarios
  const loadScenario = (type: 'parcel' | 'security' | 'offcampus') => {
    if (type === 'parcel') {
      setSubject('Amazon Package Arrived at Gate 1');
      setMessage('Parcel for Hostel Block A received at security post. Please present verification OTP.');
      setAttributes([
        { name: 'category', type: 'String', value: 'parcel' },
        { name: 'priority', type: 'String', value: 'urgent' },
        { name: 'area', type: 'String', value: 'campus' }
      ]);
      setGeoRadiusEnabled(true);
      setRadiusKm(1.5);
    } else if (type === 'security') {
      const fifoTopic = topics.find(t => t.type === 'FIFO');
      if (fifoTopic) setTopicArn(fifoTopic.arn);
      setSubject('CRITICAL: Campus Weather & Security Alert');
      setMessage('Severe storm warnings issued for city center. All students remain indoors until further notice.');
      setAttributes([
        { name: 'priority', type: 'String', value: 'urgent' },
        { name: 'category', type: 'String', value: 'security' }
      ]);
      setGeoRadiusEnabled(true);
      setRadiusKm(5.0);
    } else if (type === 'offcampus') {
      setSubject('Alumni & Community Tech Meetup');
      setMessage('Monthly innovation meetup starting this Saturday at Outer Ring Tech Park Auditorium.');
      setAttributes([
        { name: 'category', type: 'String', value: 'announcement' },
        { name: 'area', type: 'String', value: 'metro' }
      ]);
      setGeoRadiusEnabled(false);
    }
  };

  const addAttribute = () => {
    setAttributes([...attributes, { name: '', type: 'String', value: '' }]);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const updateAttribute = (index: number, field: keyof AttributeRow, val: string) => {
    const copy = [...attributes];
    (copy[index] as any)[field] = val;
    setAttributes(copy);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicArn) {
      setPublishError('Please select an SNS Topic.');
      return;
    }
    setPublishError(null);
    setIsPublishing(true);

    // Format attributes for SNS
    const snsAttrs: Record<string, MessageAttributeValue> = {};
    for (const attr of attributes) {
      if (attr.name.trim() && attr.value.trim()) {
        snsAttrs[attr.name.trim()] = {
          DataType: attr.type,
          StringValue: attr.type === 'String' ? attr.value.trim() : undefined,
          NumberValue: attr.type === 'Number' ? attr.value.trim() : undefined
        };
      }
    }

    try {
      const res = await publishMessage({
        topicArn,
        subject: subject.trim(),
        message: message.trim(),
        messageAttributes: snsAttrs,
        geoRadiusEnabled,
        publisherLocation: geoRadiusEnabled
          ? {
              lat: parseFloat(publisherLat),
              lng: parseFloat(publisherLng),
              address: publisherAddress.trim()
            }
          : undefined,
        radiusKm: geoRadiusEnabled ? radiusKm : undefined
      });

      setPublishResult(res);
      onPublishComplete();
    } catch (err: any) {
      setPublishError(err.message || 'Failed to publish message');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Send className="w-5 h-5 text-aws-orange" />
            <h1 className="text-xl font-bold text-gray-900">Publish Message to Amazon SNS</h1>
          </div>
          <p className="text-xs text-gray-600 mt-1 max-w-xl">
            Simulate a message publisher. SNS ingests the message, evaluates subscription filter policies, and applies PadosiCast geo-radius filtering before fan-out delivery.
          </p>
        </div>

        {/* Quick Demo Scenario Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs font-semibold text-gray-500 hidden md:inline">Demo Scenarios:</span>
          <button
            type="button"
            onClick={() => loadScenario('parcel')}
            className="px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 rounded text-xs font-medium flex items-center space-x-1"
          >
            <Sparkles className="w-3 h-3 text-aws-orange" />
            <span>Campus Parcel</span>
          </button>
          <button
            type="button"
            onClick={() => loadScenario('security')}
            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded text-xs font-medium"
          >
            Security (FIFO)
          </button>
          <button
            type="button"
            onClick={() => loadScenario('offcampus')}
            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded text-xs font-medium"
          >
            Wide Announcement
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Publishing Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handlePublish} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm space-y-5 text-xs">
            {publishError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded flex items-center space-x-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{publishError}</span>
              </div>
            )}

            {/* 1. Target Topic */}
            <div>
              <label className="block font-semibold text-gray-900 mb-1">
                Target SNS Topic <span className="text-red-500">*</span>
              </label>
              <select
                value={topicArn}
                onChange={(e) => setTopicArn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-xs focus:ring-2 focus:ring-aws-blue outline-none"
                required
              >
                {topics.map((t) => (
                  <option key={t.arn} value={t.arn}>
                    {t.name} [{t.type}] - {t.arn}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Message Subject */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-gray-900">
                  Subject <span className="text-gray-500 font-normal">(Used in Email headers & SMS prefix)</span>
                </label>
                <span className="text-[10px] text-gray-400">{subject.length}/100</span>
              </div>
              <input
                type="text"
                value={subject}
                maxLength={100}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Urgent Campus Delivery"
                className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-aws-blue outline-none"
                required
              />
            </div>

            {/* 3. Message Body */}
            <div>
              <label className="block font-semibold text-gray-900 mb-1">
                Message Body <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter notification text to broadcast..."
                className="w-full p-3 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-aws-blue outline-none"
                required
              />
            </div>

            {/* 4. Amazon SNS Message Attributes */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Tag className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-gray-900 text-xs">
                    Amazon SNS Message Attributes
                  </span>
                </div>
                <button
                  type="button"
                  onClick={addAttribute}
                  className="text-aws-blue hover:text-aws-blueHover font-medium text-xs flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Attribute</span>
                </button>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Subscribers filter messages based on these metadata attributes. For example, a subscriber with policy <code className="bg-white px-1 py-0.5 rounded border">category: ['parcel']</code> will receive this message only if category matches.
              </p>

              {attributes.length === 0 ? (
                <div className="text-gray-400 text-center py-2 text-[11px]">
                  No message attributes attached. Click "Add Attribute" to attach filterable metadata.
                </div>
              ) : (
                <div className="space-y-2">
                  {attributes.map((attr, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={attr.name}
                        onChange={(e) => updateAttribute(idx, 'name', e.target.value)}
                        placeholder="Attribute Name (e.g. category)"
                        className="w-1/3 px-2 py-1.5 border border-gray-300 rounded text-xs font-mono"
                      />
                      <select
                        value={attr.type}
                        onChange={(e) => updateAttribute(idx, 'type', e.target.value as any)}
                        className="w-24 px-2 py-1.5 border border-gray-300 rounded text-xs bg-white"
                      >
                        <option value="String">String</option>
                        <option value="Number">Number</option>
                      </select>
                      <input
                        type="text"
                        value={attr.value}
                        onChange={(e) => updateAttribute(idx, 'value', e.target.value)}
                        placeholder="Value (e.g. parcel)"
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => removeAttribute(idx)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Delete attribute"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. PadosiCast Geo-Radius Filtering (Custom Enhancement) */}
            <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="geoRadiusToggle"
                    checked={geoRadiusEnabled}
                    onChange={(e) => setGeoRadiusEnabled(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <label htmlFor="geoRadiusToggle" className="font-bold text-gray-900 cursor-pointer">
                    Enable PadosiCast Geo-Radius Filtering (Publisher Delivery Radius)
                  </label>
                </div>
                <span className="text-[10px] uppercase font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                  PadosiCast Feature
                </span>
              </div>

              {geoRadiusEnabled && (
                <div className="space-y-3 pt-2 border-t border-amber-200/80">
                  <div className="text-[11px] text-amber-900 leading-relaxed">
                    <strong>Rule: Publisher owns the delivery radius.</strong> Only subscribers whose stored coordinate falls within <strong>{radiusKm} km</strong> of the publisher will be eligible.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-700">Publisher Latitude</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={publisherLat}
                        onChange={(e) => setPublisherLat(e.target.value)}
                        className="w-full px-2 py-1.5 border rounded text-xs font-mono bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-700">Publisher Longitude</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={publisherLng}
                        onChange={(e) => setPublisherLng(e.target.value)}
                        className="w-full px-2 py-1.5 border rounded text-xs font-mono bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-700">Dispatch Landmark</label>
                      <input
                        type="text"
                        value={publisherAddress}
                        onChange={(e) => setPublisherAddress(e.target.value)}
                        className="w-full px-2 py-1.5 border rounded text-xs bg-white"
                      />
                    </div>
                  </div>

                  {/* Radius Slider */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-900">
                        Delivery Radius: <strong className="text-amber-800 font-mono text-sm">{radiusKm} km</strong>
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Evaluated via H3 Resolution 9 + Haversine formula
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="10"
                      step="0.5"
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
                      className="w-full accent-aws-orange cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                      <span>0.5 km (Immediate Hostel)</span>
                      <span>2.0 km (Campus Perimeter)</span>
                      <span>5.0 km (Metro Area)</span>
                      <span>10.0 km</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-gray-500 text-[11px]">
                Publishes through backend to Amazon SNS + PadosiCast Pipeline
              </span>
              <button
                type="submit"
                disabled={isPublishing}
                className="px-6 py-2.5 bg-aws-orange hover:bg-aws-orangeHover text-white text-xs font-bold rounded shadow-md transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isPublishing ? 'Publishing to SNS...' : 'Publish Message'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Instant Fan-Out Results & Explanation */}
        <div className="space-y-4">
          {publishResult ? (
            <div className="bg-white rounded-lg p-5 border border-green-300 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-bold text-sm">Message Published Successfully!</h3>
              </div>

              <div className="p-2.5 bg-gray-50 rounded border text-xs space-y-1 font-mono">
                <div>
                  <span className="text-gray-500">Message ID: </span>
                  <span className="text-gray-900 font-semibold">{publishResult.messageId}</span>
                </div>
                <div>
                  <span className="text-gray-500">Deliveries Evaluated: </span>
                  <span className="text-blue-700 font-semibold">{publishResult.deliveries.length} subscribers</span>
                </div>
                {publishResult.realAwsPublished && (
                  <div className="text-green-700 font-sans text-[11px] font-semibold">
                    ✓ Transmitted to Live Amazon SNS Topic
                  </div>
                )}
              </div>

              {/* Fan-out breakdown */}
              <div>
                <h4 className="font-semibold text-xs text-gray-900 mb-2">Fan-Out Delivery Decisions:</h4>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {publishResult.deliveries.map((del) => (
                    <div
                      key={del.id}
                      className={`p-2.5 rounded border text-xs ${
                        del.status === 'Delivered'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">{del.subscriber}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            del.status === 'Delivered'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-300 text-gray-800'
                          }`}
                        >
                          {del.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1">
                        Protocol: <span className="uppercase font-mono">{del.protocol}</span>
                        {del.distanceKm !== null && ` • Distance: ${del.distanceKm} km`}
                      </div>

                      {del.status === 'Delivered' ? (
                        <div className="text-green-700 text-[11px] mt-1 font-medium">
                          ✓ Filter matched & within {radiusKm} km radius
                        </div>
                      ) : (
                        <div className="text-red-700 text-[11px] mt-1 font-medium">
                          ✕ Skipped: {del.skipReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => setActiveTab('geomap')}
                  className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded text-xs font-semibold flex items-center justify-center space-x-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>View Delivery on Geo Map</span>
                </button>
                <button
                  onClick={() => setActiveTab('email')}
                  className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded text-xs font-semibold flex items-center justify-center space-x-1.5"
                >
                  <span>Open Simulated Inboxes</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm space-y-4 text-xs text-gray-600">
              <div className="flex items-center space-x-2 text-gray-900 font-bold">
                <Info className="w-4 h-4 text-aws-blue" />
                <span>How Amazon SNS Fan-out Works</span>
              </div>
              <p className="leading-relaxed">
                When you publish, Amazon SNS immediately evaluates every active subscription attached to the topic.
              </p>
              <div className="space-y-2">
                <div className="p-2.5 bg-gray-50 rounded border">
                  <div className="font-semibold text-gray-900 mb-1">1. Filter Policy Evaluation</div>
                  <p className="text-gray-600 text-[11px]">
                    SNS matches published attributes against each subscription's JSON filter policy. Unmatched subscribers are discarded with zero delivery cost.
                  </p>
                </div>
                <div className="p-2.5 bg-amber-50/60 rounded border border-amber-200">
                  <div className="font-semibold text-amber-950 mb-1">2. PadosiCast Geo-Radius</div>
                  <p className="text-amber-900 text-[11px]">
                    Publisher specifies delivery radius. H3 Res 9 candidates and Haversine distance are calculated. Only matching subscribers receive the broadcast.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
