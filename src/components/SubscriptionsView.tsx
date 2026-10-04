import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Mail,
  Smartphone,
  Globe,
  CheckCircle,
  Clock,
  Filter,
  MapPin,
  Edit2,
  Check,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Subscription, Topic } from '../types';
import { createSubscription, confirmSubscription, updateFilterPolicy } from '../services/api';

interface SubscriptionsViewProps {
  subscriptions: Subscription[];
  topics: Topic[];
  onSubscriptionUpdated: () => void;
  onFilterByTopic?: (topicArn: string) => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  subscriptions,
  topics,
  onSubscriptionUpdated,
  onFilterByTopic
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPolicySub, setEditingPolicySub] = useState<Subscription | null>(null);
  const [policyJsonInput, setPolicyJsonInput] = useState('');
  const [policyError, setPolicyError] = useState<string | null>(null);

  // Filter table by topic
  const [filterTopicArn, setFilterTopicArn] = useState<string>('all');

  // Create form state
  const [selectedTopicArn, setSelectedTopicArn] = useState(topics[0]?.arn || '');
  const [protocol, setProtocol] = useState<'email' | 'sms' | 'http'>('email');
  const [endpoint, setEndpoint] = useState('');
  const [subscriberName, setSubscriberName] = useState('');
  const [lat, setLat] = useState('12.9716');
  const [lng, setLng] = useState('77.5946');
  const [address, setAddress] = useState('Hostel Block A, Main Campus');
  const [filterPolicyPreset, setFilterPolicyPreset] = useState<'none' | 'parcel' | 'urgent' | 'custom'>('none');
  const [customFilterPolicy, setCustomFilterPolicy] = useState('{\n  "category": ["parcel"]\n}');
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Confirmation trigger
  const [confirmingArn, setConfirmingArn] = useState<string | null>(null);

  const handleConfirm = async (arn: string) => {
    setConfirmingArn(arn);
    try {
      await confirmSubscription(arn);
      onSubscriptionUpdated();
    } catch (err: any) {
      alert(`Confirmation error: ${err.message}`);
    } finally {
      setConfirmingArn(null);
    }
  };

  const openPolicyEditor = (sub: Subscription) => {
    setEditingPolicySub(sub);
    setPolicyJsonInput(sub.filterPolicy ? JSON.stringify(sub.filterPolicy, null, 2) : '{\n  "category": ["parcel"]\n}');
    setPolicyError(null);
  };

  const handleSavePolicy = async () => {
    if (!editingPolicySub) return;
    try {
      const parsed = policyJsonInput.trim() ? JSON.parse(policyJsonInput) : null;
      await updateFilterPolicy(editingPolicySub.arn, parsed);
      setEditingPolicySub(null);
      onSubscriptionUpdated();
    } catch (err: any) {
      setPolicyError('Invalid JSON format: ' + err.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsSubmitting(true);

    let policyObj = null;
    if (filterPolicyPreset === 'parcel') {
      policyObj = { category: ['parcel', 'food'] };
    } else if (filterPolicyPreset === 'urgent') {
      policyObj = { priority: ['urgent'] };
    } else if (filterPolicyPreset === 'custom') {
      try {
        policyObj = JSON.parse(customFilterPolicy);
      } catch (err: any) {
        setCreateError('Invalid Custom Filter Policy JSON: ' + err.message);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await createSubscription({
        topicArn: selectedTopicArn,
        protocol,
        endpoint: endpoint.trim(),
        subscriberName: subscriberName.trim() || endpoint.trim(),
        location: {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          address: address.trim()
        },
        filterPolicy: policyObj,
        autoConfirm
      });
      setShowCreateModal(false);
      setEndpoint('');
      setSubscriberName('');
      onSubscriptionUpdated();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSubs = filterTopicArn === 'all'
    ? subscriptions
    : subscriptions.filter(s => s.topicArn === filterTopicArn);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-purple-600" />
            <h1 className="text-xl font-bold text-gray-900">Amazon SNS Subscriptions</h1>
          </div>
          <p className="text-xs text-gray-600 mt-1 max-w-xl">
            Endpoints subscribe to SNS topics. Messages fan out exclusively to <strong>Confirmed</strong> subscriptions whose <strong>Subscription Filter Policies</strong> and <strong>PadosiCast Geo-Radius</strong> conditions match.
          </p>
        </div>

        <button
          onClick={() => {
            if (topics.length > 0 && !selectedTopicArn) setSelectedTopicArn(topics[0].arn);
            setShowCreateModal(true);
          }}
          className="bg-aws-orange hover:bg-aws-orangeHover text-white text-xs font-semibold px-4 py-2 rounded shadow flex items-center justify-center space-x-1.5 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Subscription</span>
        </button>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-700">Filter by Topic:</span>
            <select
              value={filterTopicArn}
              onChange={(e) => setFilterTopicArn(e.target.value)}
              className="text-xs bg-white border border-gray-300 rounded px-2.5 py-1 text-gray-700 outline-none focus:ring-1 focus:ring-aws-blue"
            >
              <option value="all">All Topics ({subscriptions.length})</option>
              {topics.map(t => (
                <option key={t.arn} value={t.arn}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-gray-500 flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span>Confirmed ({subscriptions.filter(s => s.status === 'Confirmed').length})</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Pending ({subscriptions.filter(s => s.status === 'PendingConfirmation').length})</span>
            </span>
          </div>
        </div>

        {/* Subscriptions Table */}
        {filteredSubs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            No subscriptions found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                <tr>
                  <th className="py-2.5 px-4">Subscriber & Endpoint</th>
                  <th className="py-2.5 px-4">Topic</th>
                  <th className="py-2.5 px-4">Protocol</th>
                  <th className="py-2.5 px-4">Confirmation Status</th>
                  <th className="py-2.5 px-4">SNS Filter Policy</th>
                  <th className="py-2.5 px-4">Location (H3 Res 9)</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSubs.map((sub) => {
                  const topicObj = topics.find(t => t.arn === sub.topicArn);
                  const topicName = topicObj ? topicObj.name : sub.topicArn.split(':').pop();

                  return (
                    <tr key={sub.arn} className="hover:bg-gray-50/80 transition-colors">
                      {/* Subscriber Name & Endpoint */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{sub.subscriberName}</div>
                        <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                          {sub.endpoint}
                        </div>
                      </td>

                      {/* Topic */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-[11px] border">
                          {topicName}
                        </span>
                      </td>

                      {/* Protocol */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center space-x-1 uppercase text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700 border">
                          {sub.protocol === 'email' && <Mail className="w-3 h-3 text-blue-600" />}
                          {sub.protocol === 'sms' && <Smartphone className="w-3 h-3 text-purple-600" />}
                          {sub.protocol === 'http' && <Globe className="w-3 h-3 text-emerald-600" />}
                          <span>{sub.protocol}</span>
                        </span>
                      </td>

                      {/* Confirmation Status */}
                      <td className="py-3 px-4">
                        {sub.status === 'Confirmed' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span>Confirmed</span>
                          </span>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending</span>
                            </span>
                            <button
                              onClick={() => handleConfirm(sub.arn)}
                              disabled={confirmingArn === sub.arn}
                              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-medium transition-colors shadow-sm disabled:opacity-50"
                              title="Simulate subscriber clicking confirmation link"
                            >
                              {confirmingArn === sub.arn ? 'Confirming...' : 'Confirm Now'}
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Filter Policy */}
                      <td className="py-3 px-4">
                        {sub.filterPolicy ? (
                          <div className="group relative cursor-pointer" onClick={() => openPolicyEditor(sub)}>
                            <div className="bg-indigo-50 text-indigo-900 border border-indigo-200 px-2 py-1 rounded text-[11px] font-mono max-w-xs truncate flex items-center justify-between">
                              <span className="truncate">
                                {JSON.stringify(sub.filterPolicy)}
                              </span>
                              <Edit2 className="w-3 h-3 text-indigo-500 ml-1.5 shrink-0 opacity-60 group-hover:opacity-100" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-gray-400">
                            <span className="text-[11px]">None (Accepts all)</span>
                            <button
                              onClick={() => openPolicyEditor(sub)}
                              className="text-aws-blue hover:underline text-[10px] font-medium ml-1"
                            >
                              + Add Policy
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Location & H3 */}
                      <td className="py-3 px-4">
                        <div className="flex items-start space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-[11px] text-gray-800">
                              {sub.location.address || `${sub.location.lat.toFixed(4)}, ${sub.location.lng.toFixed(4)}`}
                            </div>
                            <div className="text-[10px] font-mono text-gray-500">
                              H3: {sub.location.h3Res9 || 'res-9'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openPolicyEditor(sub)}
                          className="text-xs text-aws-blue hover:text-aws-blueHover font-medium"
                        >
                          Edit Policy
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Filter Policy Editor Modal */}
      {editingPolicySub && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 text-left border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900 text-base">
                  Edit SNS Subscription Filter Policy
                </h3>
              </div>
              <button
                onClick={() => setEditingPolicySub(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="text-gray-600">
                Subscriber: <strong className="text-gray-900">{editingPolicySub.subscriberName}</strong>
              </div>

              {policyError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
                  {policyError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-gray-900 mb-1">
                  Filter Policy JSON (Amazon SNS Standard format)
                </label>
                <textarea
                  value={policyJsonInput}
                  onChange={(e) => setPolicyJsonInput(e.target.value)}
                  rows={6}
                  className="w-full p-3 font-mono text-xs border border-gray-300 rounded focus:ring-2 focus:ring-aws-blue outline-none"
                  placeholder='{"category": ["parcel", "food"]}'
                />
              </div>

              {/* Presets */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-gray-700">Quick SNS Examples:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPolicyJsonInput('{\n  "category": ["parcel", "food"]\n}')}
                    className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-[10px] text-gray-700 font-mono"
                  >
                    category in [parcel, food]
                  </button>
                  <button
                    type="button"
                    onClick={() => setPolicyJsonInput('{\n  "priority": ["urgent"]\n}')}
                    className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-[10px] text-gray-700 font-mono"
                  >
                    priority = urgent
                  </button>
                  <button
                    type="button"
                    onClick={() => setPolicyJsonInput('{\n  "category": ["parcel"],\n  "priority": ["urgent"]\n}')}
                    className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-[10px] text-gray-700 font-mono"
                  >
                    Both category AND priority
                  </button>
                  <button
                    type="button"
                    onClick={() => setPolicyJsonInput('')}
                    className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-[10px] text-gray-700 font-mono"
                  >
                    Clear (Match All)
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setEditingPolicySub(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePolicy}
                className="px-4 py-2 bg-aws-orange hover:bg-aws-orangeHover text-white text-xs font-semibold rounded shadow transition-colors"
              >
                Save Filter Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Subscription Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-6 text-left border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-aws-orange" />
                <h3 className="font-bold text-gray-900 text-base">Create Subscription</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-xs">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                  {createError}
                </div>
              )}

              {/* Topic Selection */}
              <div>
                <label className="block font-semibold text-gray-900 mb-1">
                  Topic ARN <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTopicArn}
                  onChange={(e) => setSelectedTopicArn(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-xs focus:ring-2 focus:ring-aws-blue outline-none"
                  required
                >
                  {topics.map(t => (
                    <option key={t.arn} value={t.arn}>
                      {t.name} ({t.arn})
                    </option>
                  ))}
                </select>
              </div>

              {/* Protocol */}
              <div>
                <label className="block font-semibold text-gray-900 mb-1">
                  Protocol <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['email', 'sms', 'http'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setProtocol(p)}
                      className={`p-2.5 rounded border text-center font-semibold capitalize flex items-center justify-center space-x-1.5 transition-all ${
                        protocol === p
                          ? 'border-aws-blue bg-blue-50 text-aws-blue ring-1 ring-aws-blue'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {p === 'email' && <Mail className="w-3.5 h-3.5" />}
                      {p === 'sms' && <Smartphone className="w-3.5 h-3.5" />}
                      {p === 'http' && <Globe className="w-3.5 h-3.5" />}
                      <span>{p}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subscriber Name & Endpoint */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-900 mb-1">
                    Subscriber Name
                  </label>
                  <input
                    type="text"
                    value={subscriberName}
                    onChange={(e) => setSubscriberName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-aws-blue outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-900 mb-1">
                    Endpoint ({protocol === 'email' ? 'Email Address' : protocol === 'sms' ? 'Phone Number' : 'HTTP URL'}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder={
                      protocol === 'email'
                        ? 'student@campus.edu'
                        : protocol === 'sms'
                        ? '+919876543210'
                        : 'https://webhook.site/demo'
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-xs focus:ring-2 focus:ring-aws-blue outline-none"
                    required
                  />
                </div>
              </div>

              {/* Geographic Location (DynamoDB Application Metadata) */}
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded space-y-2">
                <div className="flex items-center space-x-1.5 text-amber-900 font-semibold text-xs">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span>Subscriber Geographic Coordinates (for Geo-Radius check)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-600 font-medium">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      className="w-full px-2 py-1 border rounded text-xs font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-600 font-medium">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      className="w-full px-2 py-1 border rounded text-xs font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-600 font-medium">Preset Campus Location</label>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'hostelA') {
                          setLat('12.9746');
                          setLng('77.5966');
                          setAddress('Hostel Block A');
                        } else if (val === 'faculty') {
                          setLat('12.9656');
                          setLng('77.5986');
                          setAddress('Faculty Quarters');
                        } else if (val === 'techPark') {
                          setLat('12.9856');
                          setLng('77.5826');
                          setAddress('Outer Tech Park (1.8km)');
                        } else if (val === 'suburb') {
                          setLat('13.0266');
                          setLng('77.6426');
                          setAddress('Suburban Area (7.5km away)');
                        }
                      }}
                      className="w-full px-2 py-1 border rounded text-xs bg-white"
                    >
                      <option value="">Select preset...</option>
                      <option value="hostelA">Hostel Block A (~0.4km)</option>
                      <option value="faculty">Faculty Quarters (~0.9km)</option>
                      <option value="techPark">Outer Tech Park (~1.8km)</option>
                      <option value="suburb">Suburban Area (~7.5km)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-600 font-medium">Location Label / Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Hostel Block A, Main Campus"
                    className="w-full px-2 py-1 border rounded text-xs"
                  />
                </div>
              </div>

              {/* Filter Policy Configuration */}
              <div>
                <label className="block font-semibold text-gray-900 mb-1">
                  Subscription Filter Policy
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setFilterPolicyPreset('none')}
                    className={`py-1.5 px-2 border rounded text-[11px] font-medium ${
                      filterPolicyPreset === 'none' ? 'bg-aws-blue text-white' : 'bg-gray-50'
                    }`}
                  >
                    No Filter (All)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterPolicyPreset('parcel')}
                    className={`py-1.5 px-2 border rounded text-[11px] font-medium ${
                      filterPolicyPreset === 'parcel' ? 'bg-aws-blue text-white' : 'bg-gray-50'
                    }`}
                  >
                    Parcel / Food
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterPolicyPreset('urgent')}
                    className={`py-1.5 px-2 border rounded text-[11px] font-medium ${
                      filterPolicyPreset === 'urgent' ? 'bg-aws-blue text-white' : 'bg-gray-50'
                    }`}
                  >
                    Urgent Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterPolicyPreset('custom')}
                    className={`py-1.5 px-2 border rounded text-[11px] font-medium ${
                      filterPolicyPreset === 'custom' ? 'bg-aws-blue text-white' : 'bg-gray-50'
                    }`}
                  >
                    Custom JSON
                  </button>
                </div>

                {filterPolicyPreset === 'custom' && (
                  <textarea
                    rows={4}
                    value={customFilterPolicy}
                    onChange={(e) => setCustomFilterPolicy(e.target.value)}
                    className="w-full p-2 border font-mono text-xs rounded"
                  />
                )}
              </div>

              {/* Auto Confirm */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="autoConfirm"
                  checked={autoConfirm}
                  onChange={(e) => setAutoConfirm(e.target.checked)}
                  className="rounded text-aws-blue focus:ring-aws-blue"
                />
                <label htmlFor="autoConfirm" className="text-xs text-gray-700 cursor-pointer">
                  Auto-confirm subscription (set status immediately to <strong>Confirmed</strong> for demo)
                </label>
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
                  {isSubmitting ? 'Creating...' : 'Create Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
