import React from 'react';
import {
  Bell,
  Layers,
  Send,
  Mail,
  Smartphone,
  MapPin,
  FileText,
  Activity,
  Server,
  Info,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { ServerConfig } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  config: ServerConfig | null;
  unreadEmailCount: number;
  unreadSmsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  config,
  unreadEmailCount,
  unreadSmsCount
}) => {
  const [showConfigModal, setShowConfigModal] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'topics', label: 'Topics', icon: Layers },
    { id: 'subscriptions', label: 'Subscriptions', icon: Bell },
    { id: 'publish', label: 'Publish Message', icon: Send },
    { id: 'logs', label: 'Delivery Logs', icon: FileText },
    { id: 'geomap', label: 'Geo-Radius Map', icon: MapPin },
    {
      id: 'email',
      label: 'Email Inbox',
      icon: Mail,
      badge: unreadEmailCount > 0 ? unreadEmailCount : undefined
    },
    {
      id: 'sms',
      label: 'SMS Phone',
      icon: Smartphone,
      badge: unreadSmsCount > 0 ? unreadSmsCount : undefined
    },
    { id: 'architecture', label: 'AWS Architecture', icon: Server }
  ];

  return (
    <>
      <header className="bg-aws-squid text-white border-b border-gray-800 sticky top-0 z-50 shadow-md">
        {/* Top utility bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo & Service Title */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-aws-orange flex items-center justify-center font-bold text-white shadow">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">
                  PadosiCast
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono border border-gray-700">
                  Amazon SNS Simulator & Geo-Fanout
                </span>
              </div>
            </div>

            {/* AWS Region & Mode Controls */}
            <div className="flex items-center space-x-3">
              {/* Mode indicator */}
              <button
                onClick={() => setShowConfigModal(true)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  config?.isRealAws
                    ? 'bg-green-950/70 text-green-300 border-green-800 hover:bg-green-900/80'
                    : 'bg-amber-950/70 text-amber-300 border-amber-800 hover:bg-amber-900/80'
                }`}
                title="Click to view AWS configuration details"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    config?.isRealAws ? 'bg-green-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span>
                  {config?.isRealAws ? 'Real AWS SDK Active' : 'High-Fidelity Simulation'}
                </span>
                <Info className="w-3.5 h-3.5 ml-1 opacity-70" />
              </button>

              {/* AWS Region Selector */}
              <div className="flex items-center space-x-1.5 text-xs text-gray-300 bg-gray-900/80 px-2.5 py-1 rounded border border-gray-800">
                <span className="text-gray-400">Region:</span>
                <span className="font-mono text-aws-orange font-semibold">
                  {config?.awsRegion || 'ap-south-1'}
                </span>
                <span className="text-gray-400 text-[10px] hidden sm:inline">(Mumbai)</span>
              </div>

              {/* Quick Publish CTA */}
              <button
                onClick={() => setActiveTab('publish')}
                className="hidden sm:inline-flex items-center space-x-1.5 bg-aws-orange hover:bg-aws-orangeHover text-white text-xs font-semibold px-3 py-1.5 rounded shadow transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Cast</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-aws-squidLight border-t border-gray-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1 overflow-x-auto scrollbar-none py-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-aws-blue text-white shadow-sm font-semibold'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-aws-orange text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* AWS Architecture / Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 text-left border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Server className="w-5 h-5 text-aws-blue" />
                <h3 className="font-semibold text-gray-900 text-base">AWS Architecture & Backend Mode</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-gray-700">
              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <div className="font-semibold text-gray-900 mb-1">Current Execution Mode:</div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      config?.isRealAws ? 'bg-green-500' : 'bg-amber-500'
                    }`}
                  />
                  <span className="font-medium text-sm">
                    {config?.isRealAws
                      ? 'Live AWS Cloud Connection (@aws-sdk/client-sns)'
                      : 'High-Fidelity Local Simulation Mode'}
                  </span>
                </div>
                <p className="mt-1 text-gray-600">
                  {config?.isRealAws
                    ? 'Calls real Amazon SNS endpoints in AWS cloud. Subscriptions and topics are synchronized.'
                    : 'Provides an identical, zero-dependency offline environment with realistic ARNs, confirmation tokens, and simulated message delivery.'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-gray-900">Security Architecture:</div>
                <p className="text-gray-600 leading-relaxed">
                  Per strict AWS security guidelines, AWS Access Keys and Secret Keys are
                  <strong> never exposed in the browser frontend</strong>. All AWS SDK calls execute
                  exclusively inside the Node backend (representing AWS Lambda and API Gateway).
                </p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-900">
                <div className="font-semibold mb-1 flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Switching to Live AWS Account:</span>
                </div>
                <p className="text-blue-800">
                  To connect real Amazon SNS, simply populate <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">AWS_ACCESS_KEY_ID</code> and <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">AWS_SECRET_ACCESS_KEY</code> in the project root <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">.env</code> file and restart the server.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-medium rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
