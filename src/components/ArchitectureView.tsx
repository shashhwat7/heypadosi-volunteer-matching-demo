import React from 'react';
import {
  Server,
  Layers,
  ShieldAlert,
  CheckCircle2,
  MapPin,
  Filter,
  ArrowRight,
  Database,
  Cpu,
  Globe,
  Code
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Overview Banner */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <Server className="w-6 h-6 text-aws-orange" />
          <h1 className="text-2xl font-bold text-gray-900">
            PadosiCast Architecture & Amazon SNS System Guide
          </h1>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          PadosiCast is an educational <strong>Amazon SNS simulation and demonstration platform</strong> designed to give students, cloud engineers, and software architects an interactive, visual understanding of event-driven fan-out, subscription confirmation lifecycles, attribute filtering, and spatial delivery constraints.
        </p>
      </div>

      {/* Critical Comparison: Real Amazon SNS vs PadosiCast Enhancement */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-aws-orange" />
            <h2 className="font-bold text-base tracking-tight">
              Real Amazon SNS vs. PadosiCast Enhancement
            </h2>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded font-mono">
            AWS SNS Specification vs Custom Extension
          </span>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                <tr>
                  <th className="py-3 px-4">Feature / Concept</th>
                  <th className="py-3 px-4 text-blue-900 bg-blue-50/50">Native Amazon SNS</th>
                  <th className="py-3 px-4 text-amber-950 bg-amber-50/50">PadosiCast Enhancement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 px-4 font-semibold text-gray-900">Topic Management</td>
                  <td className="py-3 px-4 bg-blue-50/20 text-gray-700">
                    Standard and FIFO topics with unique Topic ARNs.
                  </td>
                  <td className="py-3 px-4 bg-amber-50/20 text-gray-700">
                    Directly maps to AWS SNS Topics via AWS SDK (<code className="font-mono">@aws-sdk/client-sns</code>).
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-semibold text-gray-900">Subscription Lifecycle</td>
                  <td className="py-3 px-4 bg-blue-50/20 text-gray-700">
                    Requires <code className="font-mono">Subscribe</code> call; sits in <code className="font-mono">PendingConfirmation</code> until confirmed.
                  </td>
                  <td className="py-3 px-4 bg-amber-50/20 text-gray-700">
                    Replicates AWS confirmation token handshake with simulated in-app confirmation.
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-semibold text-gray-900">Message Attributes</td>
                  <td className="py-3 px-4 bg-blue-50/20 text-gray-700">
                    Supports String, Number, Binary key-value metadata attached to messages.
                  </td>
                  <td className="py-3 px-4 bg-amber-50/20 text-gray-700">
                    100% compliant with SNS message attribute structure and data types.
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-semibold text-gray-900">Subscription Filter Policy</td>
                  <td className="py-3 px-4 bg-blue-50/20 text-gray-700">
                    JSON match expressions on attributes (<code className="font-mono">exact</code>, <code className="font-mono">prefix</code>, <code className="font-mono">numeric</code>, <code className="font-mono">exists</code>).
                  </td>
                  <td className="py-3 px-4 bg-amber-50/20 text-gray-700">
                    Evaluated identically using the AWS SNS Filter Policy algorithmic engine.
                  </td>
                </tr>

                <tr className="bg-amber-100/40">
                  <td className="py-3.5 px-4 font-bold text-amber-950">
                    Geo-Radius Filtering
                  </td>
                  <td className="py-3.5 px-4 bg-blue-50/30 text-gray-500 italic">
                    <strong>NOT a native Amazon SNS feature.</strong> SNS has no built-in concept of geographical coordinates or distance radii.
                  </td>
                  <td className="py-3.5 px-4 bg-amber-50 text-amber-950 font-semibold">
                    <strong>PadosiCast Custom Enhancement:</strong> Publisher owns radius. Uses Uber H3 resolution 9 candidate selection + Haversine exact distance checking.
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-semibold text-gray-900">Subscriber Endpoints</td>
                  <td className="py-3 px-4 bg-blue-50/20 text-gray-700">
                    Dispatches to live email, telecom SMS carriers, and HTTPS webhooks.
                  </td>
                  <td className="py-3 px-4 bg-amber-50/20 text-gray-700">
                    Provides simulated visual inboxes so demonstrations require zero telecom credits or external inboxes.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cloud Architecture Diagram */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
          <Layers className="w-5 h-5 text-blue-600" />
          <span>Complete AWS Cloud Architecture</span>
        </h2>

        {/* ASCII / Visual Flow Diagram */}
        <div className="p-4 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed">
          <pre>{`
  +-------------------------+
  |  React + Vite Frontend  |  <--- AWS Console UI (Never holds secret credentials)
  +------------+------------+
               |
               | HTTP REST API Calls
               v
  +-------------------------+
  |   Amazon API Gateway    |  <--- Handles routing, rate limiting & CORS
  +------------+------------+
               |
               v
  +-------------------------+
  |    AWS Lambda Backend   |  <--- Encapsulates AWS SDK (@aws-sdk/client-sns)
  +------------+------------+
               |
         +-----+---------------------------------+
         |                                       |
         v                                       v
  +--------------+                      +-----------------+
  |  Amazon SNS  |                      | Amazon DynamoDB |
  +------+-------+                      +--------+--------+
         |                                       |
         | 1. Publish Event                      | Metadata: Subscriber locations,
         | 2. Confirmed Status Check             | coordinates, H3 indices,
         | 3. Attribute Filter Policy Check      | delivery logs, simulated inboxes
         |                                       |
         +-------------------+-------------------+
                             |
                             v
               +---------------------------+
               |  PadosiCast Geo-Radius    |  <--- Publisher delivery radius check
               |  H3 Res 9 + Haversine     |
               +-------------+-------------+
                             |
         +-------------------+-------------------+
         |                                       |
         v                                       v
  +--------------+                        +--------------+
  | Email Inbox  |                        |  SMS Phone   |
  |  (Simulated) |                        |  (Simulated) |
  +--------------+                        +--------------+
          `}</pre>
        </div>
      </div>

      {/* Deep Dive: H3 + Haversine Geo Algorithm */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-amber-600" />
          <span>Spatial Fan-out: H3 Resolution 9 + Haversine Exact Check</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-gray-50 rounded-lg border space-y-2">
            <h3 className="font-bold text-gray-900 text-sm">1. Uber H3 Hexagonal Grid (Res 9)</h3>
            <p className="text-gray-600 leading-relaxed">
              H3 partitions the surface of the earth into hierarchical hexagonal cells. Resolution 9 cells have an average edge length of ~105 meters (approx ~0.1 km² area).
            </p>
            <div className="p-2 bg-slate-900 text-slate-100 rounded font-mono text-[11px]">
              Index: 893b04454b3ffff (~100m hex)
            </div>
            <p className="text-gray-500 text-[11px]">
              Candidate subscriber filtering queries H3 grid disks around the publisher's origin cell before distance calculation, optimizing spatial queries in high-density regions.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border space-y-2">
            <h3 className="font-bold text-gray-900 text-sm">2. Haversine Spherical Distance</h3>
            <p className="text-gray-600 leading-relaxed">
              To avoid edge distortions on planar projections, the Haversine formula determines the great-circle distance between publisher and subscriber coordinates over Earth's spherical radius (R = 6,371 km).
            </p>
            <div className="p-2 bg-slate-900 text-slate-100 rounded font-mono text-[11px]">
              a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
            </div>
            <p className="text-gray-500 text-[11px]">
              <strong>Rule:</strong> Distance &le; Publisher Radius Km &rarr; Passed. Otherwise skipped with log reason "Outside geo-radius".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
