import React from 'react';
import {
  Layers,
  Bell,
  CheckCircle,
  Send,
  CheckCircle2,
  XCircle,
  Filter,
  MapPin,
  ArrowRight,
  TrendingUp,
  Activity,
  ExternalLink,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { DashboardStats, DeliveryLogEntry } from '../types';

interface DashboardProps {
  stats: DashboardStats | null;
  recentLogs: DeliveryLogEntry[];
  setActiveTab: (tab: string) => void;
  onRefresh: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  recentLogs,
  setActiveTab,
  onRefresh
}) => {
  return (
    <div className="space-y-6">
      {/* Welcome & Overview Banner */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase bg-orange-100 text-orange-800 border border-orange-200">
              AWS SNS Lab
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-xs text-gray-500 font-medium">Educational Demonstration Platform</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1 tracking-tight">
            Amazon SNS & Geo-Fanout Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl leading-relaxed">
            Experience complete Amazon SNS event-driven fan-out architecture in action: publish to topics,
            evaluate JSON filter policies, and apply PadosiCast's H3 resolution 9 geographic radius checks.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={onRefresh}
            className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded shadow-sm flex items-center space-x-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-gray-500" />
            <span>Refresh Stats</span>
          </button>
          <button
            onClick={() => setActiveTab('publish')}
            className="px-4 py-2 text-xs font-semibold text-white bg-aws-orange hover:bg-aws-orangeHover rounded shadow flex items-center space-x-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publish Message</span>
          </button>
        </div>
      </div>

      {/* Primary SNS Statistics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Topics */}
        <div
          onClick={() => setActiveTab('topics')}
          className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-sm hover:border-aws-blue cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Topics</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.topicsCount ?? 0}</div>
          <div className="text-[10px] text-gray-500 mt-1">Standard & FIFO</div>
        </div>

        {/* Total Subscriptions */}
        <div
          onClick={() => setActiveTab('subscriptions')}
          className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-sm hover:border-aws-blue cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Subs</span>
            <Bell className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.subscriptionsCount ?? 0}</div>
          <div className="text-[10px] text-gray-500 mt-1">Endpoints registered</div>
        </div>

        {/* Confirmed Subscriptions */}
        <div
          onClick={() => setActiveTab('subscriptions')}
          className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-sm hover:border-aws-blue cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Confirmed</span>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-700">
            {stats?.confirmedSubscriptionsCount ?? 0}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">Ready for fan-out</div>
        </div>

        {/* Messages Published */}
        <div
          onClick={() => setActiveTab('publish')}
          className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-sm hover:border-aws-blue cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Published</span>
            <Send className="w-4 h-4 text-aws-orange" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats?.messagesPublishedCount ?? 0}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">SNS message events</div>
        </div>

        {/* Successful Deliveries */}
        <div
          onClick={() => setActiveTab('logs')}
          className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-sm hover:border-aws-blue cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Delivered</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">
            {stats?.successfulDeliveriesCount ?? 0}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">Fan-out successes</div>
        </div>

        {/* Filter Policy Skips */}
        <div
          onClick={() => setActiveTab('logs')}
          className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-sm hover:border-aws-blue cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">SNS Filtered</span>
            <Filter className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">
            {stats?.filteredMessagesCount ?? 0}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">Attribute policy skips</div>
        </div>

        {/* Geo Filtered Skips */}
        <div
          onClick={() => setActiveTab('geomap')}
          className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-sm hover:border-aws-blue cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Geo Filtered</span>
            <MapPin className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {stats?.geoFilteredMessagesCount ?? 0}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">Outside radius</div>
        </div>

        {/* Failed */}
        <div
          onClick={() => setActiveTab('logs')}
          className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-sm hover:border-aws-blue cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Failed</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">
            {stats?.failedDeliveriesCount ?? 0}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">Delivery errors</div>
        </div>
      </div>

      {/* Visual Messaging Pipeline Flow Diagram */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-aws-orange" />
            <h2 className="text-base font-bold text-gray-900">
              Live Fan-out & Filter Pipeline Flow
            </h2>
          </div>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">
            Publisher → SNS Topic → Subscriptions → Filter Policy → Geo-Radius → Delivery
          </span>
        </div>

        {/* Interactive step pipeline cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2 relative">
          {/* Step 1: Publisher */}
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3 relative group">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Step 1
            </div>
            <div className="font-semibold text-xs text-slate-900 flex items-center space-x-1">
              <Send className="w-3.5 h-3.5 text-aws-orange" />
              <span>Publisher</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-tight">
              Publishes payload, message attributes & delivery radius.
            </p>
            <div className="mt-2 text-[10px] font-mono text-slate-500 bg-white p-1 rounded border">
              category="parcel"
            </div>
          </div>

          {/* Step 2: SNS Topic */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 relative group">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1">
              Step 2 (AWS SNS)
            </div>
            <div className="font-semibold text-xs text-blue-900 flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>SNS Topic</span>
            </div>
            <p className="text-[11px] text-blue-800 mt-1 leading-tight">
              Receives cast; holds Standard or FIFO deduplication.
            </p>
            <div className="mt-2 text-[10px] font-mono text-blue-700 bg-white p-1 rounded border">
              arn:aws:sns:campus
            </div>
          </div>

          {/* Step 3: Subscriptions */}
          <div className="bg-purple-50 border border-purple-200 rounded-md p-3 relative group">
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 mb-1">
              Step 3 (AWS SNS)
            </div>
            <div className="font-semibold text-xs text-purple-900 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Confirmation</span>
            </div>
            <p className="text-[11px] text-purple-800 mt-1 leading-tight">
              Only <strong>Confirmed</strong> subscriptions proceed to evaluation.
            </p>
            <div className="mt-2 text-[10px] font-mono text-purple-700 bg-white p-1 rounded border">
              Pending ➔ Confirmed
            </div>
          </div>

          {/* Step 4: SNS Filter Policy */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3 relative group">
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 mb-1">
              Step 4 (AWS SNS)
            </div>
            <div className="font-semibold text-xs text-indigo-900 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              <span>SNS Filter Policy</span>
            </div>
            <p className="text-[11px] text-indigo-800 mt-1 leading-tight">
              Evaluates subscriber JSON policy vs message attributes.
            </p>
            <div className="mt-2 text-[10px] font-mono text-indigo-700 bg-white p-1 rounded border">
              {"category:['parcel']"}
            </div>
          </div>

          {/* Step 5: PadosiCast Geo-Radius */}
          <div className="bg-amber-50 border border-amber-300 rounded-md p-3 relative group ring-2 ring-amber-400/40">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-1 flex items-center justify-between">
              <span>Step 5</span>
              <span className="bg-amber-200 text-amber-900 text-[9px] px-1 rounded font-bold">
                PadosiCast
              </span>
            </div>
            <div className="font-semibold text-xs text-amber-950 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>Geo-Radius Check</span>
            </div>
            <p className="text-[11px] text-amber-900 mt-1 leading-tight">
              H3 res 9 candidates + Haversine distance &le; publisher radius.
            </p>
            <div className="mt-2 text-[10px] font-mono text-amber-800 bg-white p-1 rounded border">
              dist &le; 1.5 km
            </div>
          </div>

          {/* Step 6: Fan-out Delivery */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 relative group">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
              Step 6 (AWS Delivery)
            </div>
            <div className="font-semibold text-xs text-emerald-900 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Fan-out Delivery</span>
            </div>
            <p className="text-[11px] text-emerald-800 mt-1 leading-tight">
              Delivered simultaneously to Email, SMS & HTTP endpoints.
            </p>
            <div className="mt-2 text-[10px] font-mono text-emerald-700 bg-white p-1 rounded border">
              Email / SMS Inbox
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick Actions & Demonstration Guide */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-sm text-gray-900 mb-3 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-aws-orange" />
              <span>Interactive Demonstration Steps</span>
            </h3>

            <div className="space-y-2.5 text-xs text-gray-700">
              <div
                onClick={() => setActiveTab('topics')}
                className="p-2.5 rounded bg-gray-50 hover:bg-gray-100 border border-gray-200 cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-gray-900">1. Explore / Create SNS Topic</div>
                  <div className="text-gray-500 text-[11px]">Standard or FIFO topic with real ARN format</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>

              <div
                onClick={() => setActiveTab('subscriptions')}
                className="p-2.5 rounded bg-gray-50 hover:bg-gray-100 border border-gray-200 cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-gray-900">2. Verify Subscriptions & Filters</div>
                  <div className="text-gray-500 text-[11px]">Inspect Pending vs Confirmed & JSON policies</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>

              <div
                onClick={() => setActiveTab('publish')}
                className="p-2.5 rounded bg-orange-50 hover:bg-orange-100 border border-orange-200 cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-orange-950">3. Publish Test Cast</div>
                  <div className="text-orange-800 text-[11px]">Send parcel notice with 1.5km delivery radius</div>
                </div>
                <ArrowRight className="w-4 h-4 text-orange-500" />
              </div>

              <div
                onClick={() => setActiveTab('geomap')}
                className="p-2.5 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-blue-950">4. Inspect Geo-Radius Map</div>
                  <div className="text-blue-800 text-[11px]">Live Leaflet map showing radius circle and pins</div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-500" />
              </div>

              <div
                onClick={() => setActiveTab('email')}
                className="p-2.5 rounded bg-green-50 hover:bg-green-100 border border-green-200 cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-green-950">5. View Simulated Inboxes</div>
                  <div className="text-green-800 text-[11px]">See delivered emails & SMS messages</div>
                </div>
                <ArrowRight className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Recent Delivery Activity Table */}
        <div className="lg:col-span-2 bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-gray-900 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Recent SNS Delivery Events</span>
              </h3>
              <button
                onClick={() => setActiveTab('logs')}
                className="text-xs text-aws-blue hover:underline font-medium flex items-center space-x-1"
              >
                <span>View Full Log</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {recentLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-xs">
                No delivery logs recorded yet. Publish your first message to see fan-out activity!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                    <tr>
                      <th className="py-2 px-3">Subscriber</th>
                      <th className="py-2 px-3">Protocol</th>
                      <th className="py-2 px-3">Filter</th>
                      <th className="py-2 px-3">Geo Check</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentLogs.slice(0, 6).map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-gray-900">{log.subscriber}</div>
                          <div className="text-[10px] text-gray-500 truncate max-w-[140px]">
                            {log.endpoint}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 uppercase text-[10px] font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border">
                            {log.protocol}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px]">
                          {log.filterResult === 'MATCH' && (
                            <span className="text-green-700 font-medium">Match</span>
                          )}
                          {log.filterResult === 'MISMATCH' && (
                            <span className="text-indigo-700 font-medium">Mismatch</span>
                          )}
                          {log.filterResult === 'NONE' && (
                            <span className="text-gray-500">None</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-[11px]">
                          {log.geoResult === 'WITHIN_RADIUS' && (
                            <span className="text-green-700 font-medium">
                              In Radius ({log.distanceKm}km)
                            </span>
                          )}
                          {log.geoResult === 'OUTSIDE_RADIUS' && (
                            <span className="text-amber-700 font-medium">
                              Outside ({log.distanceKm}km)
                            </span>
                          )}
                          {log.geoResult === 'NOT_APPLICABLE' && (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              log.status === 'Delivered'
                                ? 'bg-green-100 text-green-800'
                                : log.status === 'Skipped'
                                ? 'bg-slate-100 text-slate-800 border border-slate-200'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {log.status}
                          </span>
                          {log.skipReason && (
                            <div className="text-[9px] text-gray-500 mt-0.5 max-w-[120px] truncate" title={log.skipReason}>
                              {log.skipReason}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span>Showing latest {Math.min(recentLogs.length, 6)} delivery decisions</span>
            <button
              onClick={() => setActiveTab('logs')}
              className="text-aws-blue hover:underline"
            >
              Analyze skip reasons &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
