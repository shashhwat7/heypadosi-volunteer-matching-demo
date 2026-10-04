import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Mail,
  Smartphone,
  Globe
} from 'lucide-react';
import { DeliveryLogEntry } from '../types';

interface DeliveryLogsViewProps {
  logs: DeliveryLogEntry[];
  onRefresh: () => void;
}

export const DeliveryLogsView: React.FC<DeliveryLogsViewProps> = ({ logs, onRefresh }) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<DeliveryLogEntry | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const matchSubscriber = log.subscriber.toLowerCase().includes(q);
      const matchEndpoint = log.endpoint.toLowerCase().includes(q);
      const matchSubject = log.subject.toLowerCase().includes(q);
      const matchMessageId = log.messageId.toLowerCase().includes(q);
      const matchTopic = log.topicName.toLowerCase().includes(q);
      if (!matchSubscriber && !matchEndpoint && !matchSubject && !matchMessageId && !matchTopic) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Toolbar */}
      <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-aws-blue" />
            <h1 className="text-xl font-bold text-gray-900">Amazon SNS & Fan-out Delivery Logs</h1>
          </div>
          <p className="text-xs text-gray-600 mt-1 max-w-xl">
            Detailed audit trail of fan-out delivery attempts. Inspect exactly why subscriptions were delivered, skipped, or failed.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded shadow-sm flex items-center space-x-1.5 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by subscriber, endpoint, message ID, subject..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-aws-blue outline-none"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-2">
          <span className="text-gray-500 font-medium">Status:</span>
          {(['all', 'Delivered', 'Skipped', 'Failed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-aws-blue text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? `All (${logs.length})` : `${s} (${logs.filter((l) => l.status === s).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            No delivery records match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                <tr>
                  <th className="py-2.5 px-4">Message ID & Time</th>
                  <th className="py-2.5 px-4">Topic</th>
                  <th className="py-2.5 px-4">Subscriber</th>
                  <th className="py-2.5 px-4">Protocol</th>
                  <th className="py-2.5 px-4">Distance</th>
                  <th className="py-2.5 px-4">SNS Filter</th>
                  <th className="py-2.5 px-4">Geo Result</th>
                  <th className="py-2.5 px-4">Delivery Status</th>
                  <th className="py-2.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    {/* Message ID & Time */}
                    <td className="py-3 px-4">
                      <div className="font-mono text-gray-800 text-[11px] font-semibold truncate max-w-[130px]">
                        {log.messageId}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </td>

                    {/* Topic */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-[11px] border">
                        {log.topicName}
                      </span>
                    </td>

                    {/* Subscriber */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{log.subscriber}</div>
                      <div className="text-[10px] text-gray-500 font-mono truncate max-w-[140px]">
                        {log.endpoint}
                      </div>
                    </td>

                    {/* Protocol */}
                    <td className="py-3 px-4 uppercase text-[10px] font-mono">
                      <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border">
                        {log.protocol === 'email' && <Mail className="w-3 h-3 text-blue-600" />}
                        {log.protocol === 'sms' && <Smartphone className="w-3 h-3 text-purple-600" />}
                        {log.protocol === 'http' && <Globe className="w-3 h-3 text-emerald-600" />}
                        <span>{log.protocol}</span>
                      </span>
                    </td>

                    {/* Distance */}
                    <td className="py-3 px-4">
                      {log.distanceKm !== null ? (
                        <span className="font-mono text-gray-700">{log.distanceKm} km</span>
                      ) : (
                        <span className="text-gray-400 font-mono text-[10px]">N/A</span>
                      )}
                    </td>

                    {/* Filter Result */}
                    <td className="py-3 px-4">
                      {log.filterResult === 'MATCH' && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Match</span>
                        </span>
                      )}
                      {log.filterResult === 'MISMATCH' && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                          <XCircle className="w-3 h-3" />
                          <span>Mismatch</span>
                        </span>
                      )}
                      {log.filterResult === 'NONE' && (
                        <span className="text-gray-400 text-[11px]">No Policy</span>
                      )}
                    </td>

                    {/* Geo Result */}
                    <td className="py-3 px-4">
                      {log.geoResult === 'WITHIN_RADIUS' && (
                        <span className="text-green-700 font-semibold text-[11px] flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Within</span>
                        </span>
                      )}
                      {log.geoResult === 'OUTSIDE_RADIUS' && (
                        <span className="text-amber-700 font-semibold text-[11px] flex items-center space-x-1">
                          <XCircle className="w-3 h-3" />
                          <span>Outside</span>
                        </span>
                      )}
                      {log.geoResult === 'NOT_APPLICABLE' && (
                        <span className="text-gray-400 text-[11px]">N/A</span>
                      )}
                    </td>

                    {/* Delivery Status & Skip Reason */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'Delivered'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : log.status === 'Skipped'
                            ? 'bg-slate-100 text-slate-800 border border-slate-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                      >
                        {log.status === 'Delivered' && <CheckCircle2 className="w-3 h-3" />}
                        {log.status === 'Skipped' && <Clock className="w-3 h-3" />}
                        {log.status === 'Failed' && <XCircle className="w-3 h-3" />}
                        <span>{log.status}</span>
                      </span>

                      {log.skipReason && (
                        <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                          {log.skipReason}
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <span className="text-aws-blue hover:text-aws-blueHover font-medium text-xs inline-flex items-center space-x-1">
                        <span>Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deep Inspection Drawer / Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 text-left border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-aws-blue" />
                <h3 className="font-bold text-gray-900 text-base">
                  Delivery Log Audit: {selectedLog.messageId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Status Header Banner */}
              <div
                className={`p-3.5 rounded-lg border flex items-center justify-between ${
                  selectedLog.status === 'Delivered'
                    ? 'bg-green-50 border-green-200 text-green-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div>
                  <div className="font-bold text-sm">
                    Status: {selectedLog.status}
                    {selectedLog.skipReason ? ` (${selectedLog.skipReason})` : ''}
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    Target Subscriber: {selectedLog.subscriber} &lt;{selectedLog.endpoint}&gt;
                  </div>
                </div>
                <div className="text-right text-[11px] font-mono">
                  {new Date(selectedLog.timestamp).toLocaleString()}
                </div>
              </div>

              {/* Message Details */}
              <div className="p-3 bg-gray-50 rounded border space-y-1">
                <div>
                  <span className="text-gray-500 font-medium">Topic ARN: </span>
                  <span className="font-mono text-gray-900 break-all">{selectedLog.topicArn}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Subject: </span>
                  <span className="font-semibold text-gray-900">{selectedLog.subject}</span>
                </div>
              </div>

              {/* Step 1: SNS Filter Policy Analysis */}
              <div className="p-3.5 rounded-lg border border-indigo-200 bg-indigo-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-indigo-950 flex items-center space-x-1.5">
                    <Filter className="w-4 h-4 text-indigo-600" />
                    <span>Amazon SNS Filter Policy Evaluation</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedLog.filterResult === 'MATCH'
                        ? 'bg-green-600 text-white'
                        : selectedLog.filterResult === 'MISMATCH'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {selectedLog.filterResult}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-900">{selectedLog.filterExplanation}</p>
              </div>

              {/* Step 2: PadosiCast Geo-Radius Analysis */}
              <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-amber-950 flex items-center space-x-1.5">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span>PadosiCast Geo-Radius Evaluation</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedLog.geoResult === 'WITHIN_RADIUS'
                        ? 'bg-green-600 text-white'
                        : selectedLog.geoResult === 'OUTSIDE_RADIUS'
                        ? 'bg-amber-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {selectedLog.geoResult}
                  </span>
                </div>
                <p className="text-[11px] text-amber-900">{selectedLog.geoExplanation}</p>
              </div>

              {/* Published Attributes */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-1.5">Published Message Attributes:</h4>
                <div className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-[11px] overflow-x-auto">
                  <pre>{JSON.stringify(selectedLog.messageAttributes, null, 2)}</pre>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
