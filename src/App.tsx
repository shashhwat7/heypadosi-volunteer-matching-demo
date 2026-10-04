import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Send,
  Radio,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Code2,
  FileText,
  Database,
  Users
} from 'lucide-react';
import {
  publishToAwsApiGateway,
  AwsPublishPayload,
  AwsPublishResponse,
  ReturnedVolunteer,
  AWS_API_GATEWAY_ENDPOINT
} from './services/api';

export const App: React.FC = () => {
  // Input Mode: 'form' | 'json'
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');

  // Form Fields
  const [message, setMessage] = useState<string>('Need help with tutoring');
  const [subject, setSubject] = useState<string>('Tutoring Help Needed');
  const [requiredSkill, setRequiredSkill] = useState<string>('tutoring');
  const [latitude, setLatitude] = useState<string>('12.7871');
  const [longitude, setLongitude] = useState<string>('80.2200');
  const [radius, setRadius] = useState<string>('5');

  // JSON Mode Text
  const [jsonText, setJsonText] = useState<string>(() =>
    JSON.stringify(
      {
        message: 'Need help with tutoring',
        subject: 'Tutoring Help Needed',
        requiredSkill: 'tutoring',
        latitude: 12.7871,
        longitude: 80.2200,
        radius: 5
      },
      null,
      2
    )
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Request & Response State
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishResponse, setPublishResponse] = useState<AwsPublishResponse | null>(null);
  const [lastPublishedPayload, setLastPublishedPayload] = useState<AwsPublishPayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCorsError, setIsCorsError] = useState<boolean>(false);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const publisherMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const volunteerMarkersRef = useRef<L.Marker[]>([]);

  const numLat = parseFloat(latitude) || 12.7871;
  const numLng = parseFloat(longitude) || 80.2200;
  const numRadius = parseFloat(radius) || 5;

  // Sync Form State -> JSON text when switching to JSON or when form values change
  const syncFormToJson = (
    msg = message,
    subj = subject,
    skill = requiredSkill,
    lat = latitude,
    lng = longitude,
    rad = radius
  ) => {
    const obj = {
      message: msg,
      subject: subj,
      requiredSkill: skill,
      latitude: parseFloat(lat) || 0,
      longitude: parseFloat(lng) || 0,
      radius: parseFloat(rad) || 5
    };
    setJsonText(JSON.stringify(obj, null, 2));
    setJsonError(null);
  };

  // Sync JSON text -> Form State
  const syncJsonToForm = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      setJsonError(null);
      if (parsed.message != null) setMessage(String(parsed.message));
      if (parsed.subject != null) setSubject(String(parsed.subject));
      if (parsed.requiredSkill != null || parsed.skill != null) {
        setRequiredSkill(String(parsed.requiredSkill || parsed.skill));
      }
      if (parsed.latitude != null) setLatitude(String(parsed.latitude));
      if (parsed.longitude != null) setLongitude(String(parsed.longitude));
      if (parsed.radius != null) setRadius(String(parsed.radius));
      return parsed;
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON format');
      return null;
    }
  };

  // Switch tabs
  const handleTabChange = (tab: 'form' | 'json') => {
    if (tab === 'json') {
      syncFormToJson();
    } else {
      syncJsonToForm(jsonText);
    }
    setActiveTab(tab);
  };

  // Handle direct JSON editing
  const handleJsonChange = (text: string) => {
    setJsonText(text);
    syncJsonToForm(text);
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current).setView([numLat, numLng], 12);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    // Publisher / Requester Marker
    const publisherIcon = L.divIcon({
      className: 'publisher-pin',
      html: `
        <div style="background-color: #ec7211; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker([numLat, numLng], {
      icon: publisherIcon,
      draggable: true
    }).addTo(map);
    publisherMarkerRef.current = marker;

    marker.bindPopup('<b>Job Requester Location</b><br/>Drag or click map to update coordinates');
    marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      const newLat = pos.lat.toFixed(4);
      const newLng = pos.lng.toFixed(4);
      setLatitude(newLat);
      setLongitude(newLng);
      syncFormToJson(message, subject, requiredSkill, newLat, newLng, radius);
    });

    // Delivery-Radius Circle
    const circle = L.circle([numLat, numLng], {
      radius: numRadius * 1000,
      color: '#ec7211',
      fillColor: '#ec7211',
      fillOpacity: 0.15,
      weight: 2,
      dashArray: '4, 4'
    }).addTo(map);
    radiusCircleRef.current = circle;

    // Click anywhere on map to relocate requester
    map.on('click', (e) => {
      const newLat = e.latlng.lat.toFixed(4);
      const newLng = e.latlng.lng.toFixed(4);
      setLatitude(newLat);
      setLongitude(newLng);
      syncFormToJson(message, subject, requiredSkill, newLat, newLng, radius);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map pin & circle when coordinates or radius change
  useEffect(() => {
    if (publisherMarkerRef.current) {
      publisherMarkerRef.current.setLatLng([numLat, numLng]);
    }
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setLatLng([numLat, numLng]);
      radiusCircleRef.current.setRadius(numRadius * 1000);
    }
  }, [numLat, numLng, numRadius]);

  // Parse real volunteer data from Lambda response
  // Lambda returns: eligibleSubscribers and skippedSubscribers
  // Backend fields: subscriberId, name, skill, channel, latitude, longitude, distance, confirmed, eligible
  const eligibleList: ReturnedVolunteer[] = (
    publishResponse?.eligibleSubscribers ||
    publishResponse?.eligibleVolunteers ||
    []
  ).map((s: any) => ({
    subscriberId: String(s.subscriberId || s.id || ''),
    name: String(s.name || s.subscriberId || 'Volunteer'),
    skill: String(s.skill || ''),
    channel: String(s.channel || s.endpoint || ''),
    latitude: Number(s.latitude ?? s.lat),
    longitude: Number(s.longitude ?? s.lng),
    distance: Number(s.distance ?? s.distanceKm ?? 0),
    confirmed: s.confirmed === true || s.confirmed === 'true',
    eligible: true,
    status: 'Delivered',
    skipReason: s.skipReason || null
  }));

  const skippedList: ReturnedVolunteer[] = (
    publishResponse?.skippedSubscribers ||
    publishResponse?.skippedVolunteers ||
    []
  ).map((s: any) => ({
    subscriberId: String(s.subscriberId || s.id || ''),
    name: String(s.name || s.subscriberId || 'Volunteer'),
    skill: String(s.skill || ''),
    channel: String(s.channel || s.endpoint || ''),
    latitude: Number(s.latitude ?? s.lat),
    longitude: Number(s.longitude ?? s.lng),
    distance: Number(s.distance ?? s.distanceKm ?? 0),
    confirmed: s.confirmed === true || s.confirmed === 'true',
    eligible: false,
    status: 'Skipped',
    skipReason: s.skipReason || 'Outside radius or skill mismatch'
  }));

  const fallbackList: ReturnedVolunteer[] = (
    publishResponse?.volunteers ||
    publishResponse?.subscribers ||
    []
  ).map((s: any) => {
    const isEligible = s.eligible === true || s.status === 'Delivered';
    return {
      subscriberId: String(s.subscriberId || s.id || ''),
      name: String(s.name || s.subscriberId || 'Volunteer'),
      skill: String(s.skill || ''),
      channel: String(s.channel || s.endpoint || ''),
      latitude: Number(s.latitude ?? s.lat),
      longitude: Number(s.longitude ?? s.lng),
      distance: Number(s.distance ?? s.distanceKm ?? 0),
      confirmed: s.confirmed === true || s.confirmed === 'true',
      eligible: isEligible,
      status: s.status || (isEligible ? 'Delivered' : 'Skipped'),
      skipReason: s.skipReason || (isEligible ? null : 'Outside radius or skill mismatch')
    };
  });

  const returnedVolunteers: ReturnedVolunteer[] =
    eligibleList.length > 0 || skippedList.length > 0
      ? [...eligibleList, ...skippedList]
      : fallbackList;

  // Render returned volunteers on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous volunteer markers
    volunteerMarkersRef.current.forEach((m) => m.remove());
    volunteerMarkersRef.current = [];

    // Add markers for volunteers returned from the API response
    returnedVolunteers.forEach((vol) => {
      const vLat = vol.latitude;
      const vLng = vol.longitude;
      if (isNaN(vLat) || isNaN(vLng) || vLat === 0) return;

      const isEligible = vol.eligible;
      const color = isEligible ? '#10b981' : '#64748b';
      const label = isEligible ? '✓ Eligible / Delivered' : '✕ Skipped';

      const icon = L.divIcon({
        className: 'volunteer-pin',
        html: `
          <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const m = L.marker([vLat, vLng], { icon }).addTo(map);
      m.bindPopup(`
        <div style="font-family: sans-serif; font-size: 11px; line-height: 1.4;">
          <strong>${vol.name}</strong> (${vol.subscriberId})<br/>
          <span><strong>Skill:</strong> ${vol.skill}</span><br/>
          <span><strong>Channel:</strong> ${vol.channel}</span><br/>
          <span><strong>Distance:</strong> ${vol.distance} km</span><br/>
          <span><strong>Confirmed:</strong> ${vol.confirmed ? 'Yes' : 'No'}</span><br/>
          <strong>Status:</strong> <span style="color:${color}; font-weight:bold;">${label}</span>
          ${vol.skipReason ? `<br/><span style="color:#b91c1c;">${vol.skipReason}</span>` : ''}
        </div>
      `);
      volunteerMarkersRef.current.push(m);
    });
  }, [returnedVolunteers]);

  // Unified Publish Handler
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsCorsError(false);
    setPublishResponse(null);

    let payload: AwsPublishPayload;

    if (activeTab === 'json') {
      let parsed: any;
      try {
        parsed = JSON.parse(jsonText);
      } catch (err: any) {
        setErrorMessage(`Invalid JSON payload: ${err.message}`);
        setJsonError(err.message);
        return;
      }

      if (!parsed.message || !String(parsed.message).trim()) {
        setErrorMessage('JSON must contain a non-empty "message" property.');
        return;
      }

      const pLat = parseFloat(parsed.latitude);
      const pLng = parseFloat(parsed.longitude);
      const pRad = parseFloat(parsed.radius);

      if (isNaN(pLat) || isNaN(pLng)) {
        setErrorMessage('JSON must contain valid numeric "latitude" and "longitude".');
        return;
      }
      if (isNaN(pRad) || pRad <= 0) {
        setErrorMessage('JSON must contain a positive numeric "radius".');
        return;
      }

      payload = {
        ...parsed,
        message: String(parsed.message).trim(),
        subject: parsed.subject ? String(parsed.subject).trim() : undefined,
        requiredSkill: (parsed.requiredSkill || parsed.skill || '').trim(),
        skill: (parsed.skill || parsed.requiredSkill || '').trim(),
        latitude: pLat,
        longitude: pLng,
        radius: pRad
      };
    } else {
      if (!message.trim()) {
        setErrorMessage('Please enter a message / task description.');
        return;
      }
      if (isNaN(numLat) || isNaN(numLng)) {
        setErrorMessage('Please enter valid numeric latitude and longitude.');
        return;
      }
      if (isNaN(numRadius) || numRadius <= 0) {
        setErrorMessage('Please enter a valid radius greater than 0 km.');
        return;
      }

      payload = {
        message: message.trim(),
        subject: subject.trim() || undefined,
        requiredSkill: requiredSkill.trim(),
        skill: requiredSkill.trim(),
        latitude: numLat,
        longitude: numLng,
        radius: numRadius
      };
    }

    setIsPublishing(true);

    try {
      const response = await publishToAwsApiGateway(payload);
      setPublishResponse(response);
      setLastPublishedPayload(payload);
    } catch (err: any) {
      console.error('Publish error:', err);
      const isFailedFetch =
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('NetworkError') ||
        err.name === 'TypeError';

      if (isFailedFetch) {
        setIsCorsError(true);
        setErrorMessage(
          'Network / CORS Error: The browser was unable to receive the response from API Gateway. Ensure CORS is enabled on the /publish resource in AWS API Gateway and deployed to the dev1 stage.'
        );
      } else {
        setErrorMessage(err.message || 'Failed to publish broadcast');
      }
    } finally {
      setIsPublishing(false);
    }
  };

  // Counts derived strictly from the backend response
  const deliveredCount =
    publishResponse?.deliveredCount ??
    returnedVolunteers.filter((v) => v.status === 'Delivered').length;
  const skippedCount =
    publishResponse?.skippedCount ??
    returnedVolunteers.filter((v) => v.status === 'Skipped').length;
  const eligibleCount = publishResponse?.eligibleCount ?? deliveredCount;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 font-sans flex flex-col">
      {/* Top AWS Bar */}
      <header className="bg-aws-squid text-white border-b border-gray-800 py-3 px-6 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-aws-orange flex items-center justify-center font-bold text-white shadow">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-base leading-tight tracking-tight">
                Padosi • Hyperlocal Volunteer Notification
              </div>
              <div className="text-[11px] text-gray-400">
                Hyperlocal Volunteer Dispatch Logic • Amazon SNS + DynamoDB + Lambda
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">

        {/* 2-Column Grid: Form/JSON & Results (Left) + Leaflet Map (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Input Modes & Results (7 Cols) */}
          <div className="md:col-span-7 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden text-xs">
              {/* Mode Switch Tabs: Task Form | JSON */}
              <div className="flex border-b border-gray-200 bg-gray-50/70">
                <button
                  type="button"
                  onClick={() => handleTabChange('form')}
                  className={`flex items-center space-x-1.5 px-4 py-2.5 font-bold transition-all border-b-2 text-xs ${activeTab === 'form'
                    ? 'border-aws-orange text-aws-orange bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Task Form</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('json')}
                  className={`flex items-center space-x-1.5 px-4 py-2.5 font-bold transition-all border-b-2 text-xs ${activeTab === 'json'
                    ? 'border-aws-orange text-aws-orange bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>JSON</span>
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handlePublish} className="p-5 space-y-4">
                {activeTab === 'form' ? (
                  <>
                    {/* Message / Task Description */}
                    <div>
                      <label className="block font-semibold text-gray-800 mb-1">
                        Message / Task Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value);
                          syncFormToJson(e.target.value);
                        }}
                        placeholder="Enter task description..."
                        className="w-full p-2.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-aws-blue outline-none"
                        required
                      />
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block font-semibold text-gray-800 mb-1">
                        Subject <span className="text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => {
                          setSubject(e.target.value);
                          syncFormToJson(message, e.target.value);
                        }}
                        placeholder="e.g. Plumbing Help"
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-aws-blue outline-none"
                      />
                    </div>

                    {/* Required Skill */}
                    <div>
                      <label className="block font-semibold text-gray-800 mb-1">
                        Required Skill
                      </label>
                      <input
                        type="text"
                        value={requiredSkill}
                        onChange={(e) => {
                          setRequiredSkill(e.target.value);
                          syncFormToJson(message, subject, e.target.value);
                        }}
                        placeholder="e.g. plumbing, electrician, carpentry"
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-aws-blue outline-none"
                      />
                    </div>

                    {/* Latitude & Longitude */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-800 mb-1">
                          Latitude <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={latitude}
                          onChange={(e) => {
                            setLatitude(e.target.value);
                            syncFormToJson(message, subject, requiredSkill, e.target.value);
                          }}
                          placeholder="12.7871"
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs font-mono focus:ring-1 focus:ring-aws-blue outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-800 mb-1">
                          Longitude <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={longitude}
                          onChange={(e) => {
                            setLongitude(e.target.value);
                            syncFormToJson(message, subject, requiredSkill, latitude, e.target.value);
                          }}
                          placeholder="80.2200"
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs font-mono focus:ring-1 focus:ring-aws-blue outline-none"
                          required
                        />
                      </div>
                    </div>

                    {/* Radius */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-gray-800">
                          Radius (km) <span className="text-red-500">*</span>
                        </label>
                        <span className="font-mono text-aws-orange font-bold">{numRadius} km</span>
                      </div>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="50"
                        value={radius}
                        onChange={(e) => {
                          setRadius(e.target.value);
                          syncFormToJson(
                            message,
                            subject,
                            requiredSkill,
                            latitude,
                            longitude,
                            e.target.value
                          );
                        }}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs font-mono focus:ring-1 focus:ring-aws-blue outline-none"
                        required
                      />
                    </div>
                  </>
                ) : (
                  /* JSON Mode */
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block font-semibold text-gray-800">
                        Task Payload (JSON) <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] text-gray-500 font-mono">
                        Validates on submit
                      </span>
                    </div>

                    <textarea
                      rows={12}
                      value={jsonText}
                      onChange={(e) => handleJsonChange(e.target.value)}
                      placeholder='{\n  "message": "...",\n  "subject": "...",\n  "requiredSkill": "...",\n  "latitude": 12.7871,\n  "longitude": 80.2200,\n  "radius": 5\n}'
                      className={`w-full p-3 font-mono text-xs border rounded outline-none leading-relaxed ${jsonError
                        ? 'border-red-400 bg-red-50/30'
                        : 'border-gray-300 bg-gray-50 focus:border-aws-blue focus:bg-white'
                        }`}
                      spellCheck={false}
                      required
                    />

                    {jsonError && (
                      <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded text-[11px] flex items-center space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>JSON Syntax Error: {jsonError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Alert */}
                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded text-xs space-y-2">
                    <div className="flex items-start space-x-1.5 font-semibold">
                      <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>Request Failed:</span>
                    </div>
                    <p className="leading-relaxed pl-5">{errorMessage}</p>

                    {isCorsError && (
                      <div className="mt-2 p-2.5 bg-white border border-red-300 rounded text-[11px] text-gray-800 space-y-1">
                        <div className="font-bold text-red-900 flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Action Required in AWS API Gateway:</span>
                        </div>
                        <p>
                          In AWS API Gateway Console &rarr; Resources &rarr; <code>/publish</code> &rarr; <strong>Enable CORS</strong> &rarr; Select <strong>DEFAULT 4XX, DEFAULT 5XX</strong> &rarr; <strong>Save</strong> &rarr; <strong>Deploy API to 'dev1' stage</strong>.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Publish Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isPublishing}
                    className="w-full py-2.5 bg-aws-orange hover:bg-aws-orangeHover text-white text-xs font-bold rounded shadow transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {isPublishing
                        ? 'Publishing to AWS API Gateway...'
                        : 'Publish Broadcast'}
                    </span>
                  </button>
                </div>
              </form>
            </div>

            {/* Results Section (Appears after publishing) */}
            {publishResponse && (
              <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm space-y-4 text-xs font-mono">
                <div className="border-b pb-2 flex items-center justify-between">
                  <div className="font-bold text-sm text-green-700 flex items-center space-x-1.5 font-sans">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Broadcast Published</span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-sans">
                    AWS Lambda &rarr; Amazon SNS
                  </span>
                </div>

                {/* SNS Message ID & Stats */}
                <div className="p-3 bg-gray-50 rounded border space-y-1.5 text-[11px]">
                  <div>
                    <span className="text-gray-500 font-sans">SNS Topic / Message ID: </span>
                    <span className="text-gray-900 font-bold break-all">
                      {publishResponse.messageId || 'Published'}
                    </span>
                  </div>

                  <div className="pt-1 flex items-center space-x-4 font-sans font-medium text-xs">
                    <span className="text-gray-700">
                      Eligible: <strong>{eligibleCount}</strong>
                    </span>
                    <span className="text-green-700">
                      Delivered: <strong>{deliveredCount}</strong>
                    </span>
                    <span className="text-slate-600">
                      Skipped: <strong>{skippedCount}</strong>
                    </span>
                  </div>
                </div>

                {/* Volunteers returned from real DynamoDB backend */}
                {returnedVolunteers.length > 0 ? (
                  <div>
                    <div className="font-bold text-gray-800 text-xs mb-2 font-sans flex items-center justify-between">
                      <span>Subscribers (from DynamoDB):</span>
                      <span className="text-[11px] text-gray-400 font-normal">
                        {returnedVolunteers.length} evaluated
                      </span>
                    </div>

                    <div className="space-y-2">
                      {returnedVolunteers.map((vol, idx) => (
                        <div
                          key={vol.subscriberId || vol.id || idx}
                          className={`p-2.5 rounded border transition-colors ${vol.status === 'Delivered'
                            ? 'bg-green-50/70 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-gray-900 font-sans text-xs">
                                {vol.name || vol.subscriberId || `Subscriber ${idx + 1}`}
                              </span>
                              {vol.skill && (
                                <span className="px-1.5 py-0.5 rounded bg-gray-200/80 text-[10px] font-sans font-medium text-gray-700">
                                  {vol.skill}
                                </span>
                              )}
                              {(vol.channel || vol.endpoint) && (
                                <span className="text-[11px] text-gray-500 font-sans hidden sm:inline">
                                  {vol.channel || vol.endpoint}
                                </span>
                              )}
                            </div>
                            <span
                              className={`font-semibold ${vol.status === 'Delivered' ? 'text-green-700' : 'text-gray-600'
                                }`}
                            >
                              {vol.status === 'Delivered' ? '✓ Delivered' : '✕ Skipped'}
                            </span>
                          </div>

                          {vol.status === 'Skipped' && vol.skipReason && (
                            <div className="text-red-700 text-[11px] mt-1 pl-2 border-l-2 border-red-400 font-sans">
                              {vol.skipReason}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-[11px] font-sans bg-gray-50 p-2.5 rounded border">
                    Server returned: {publishResponse.message || 'Notification published successfully.'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Leaflet Map & Live Volunteer Status (5 Cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-white rounded-lg p-3.5 border border-gray-200 shadow-sm flex flex-col">
              <div className="flex items-center justify-between pb-2 mb-2 border-b text-xs">
                <div className="font-bold text-gray-900 flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span>Geo Visualization</span>
                </div>
                <span className="text-[11px] text-gray-500 font-mono">
                  Radius: <strong>{numRadius} km</strong>
                </span>
              </div>

              {/* Map Canvas */}
              <div className="h-[360px] rounded overflow-hidden relative border border-gray-200">
                <div ref={mapContainerRef} className="w-full h-full" />
                <div className="absolute bottom-2 left-2 z-[400] bg-white/95 px-2 py-1 rounded text-[10px] text-gray-700 shadow border">
                  Click map or drag orange pin to set publisher location
                </div>
              </div>

              {/* Legend */}
              <div className="pt-2 flex items-center justify-around text-[10px] text-gray-600">
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-aws-orange" />
                  <span>Publisher</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Delivered</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  <span>Skipped</span>
                </div>
              </div>
            </div>

            {/* Real DynamoDB Volunteers Status Panel */}
            <div className="bg-white rounded-lg p-3.5 border border-gray-200 shadow-sm text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-gray-900 flex items-center space-x-1.5">
                  <Database className="w-3.5 h-3.5 text-gray-500" />
                  <span>DynamoDB (<code>padosi-subscriber</code>)</span>
                </div>
                {returnedVolunteers.length > 0 && (
                  <span className="text-[10px] text-gray-500 font-mono">
                    {returnedVolunteers.length} loaded
                  </span>
                )}
              </div>

              {returnedVolunteers.length > 0 ? (
                <div className="space-y-1.5 text-[11px] divide-y divide-gray-100 max-h-[220px] overflow-y-auto">
                  {returnedVolunteers.map((vol, idx) => {
                    const isDelivered = vol.status === 'Delivered';
                    return (
                      <div
                        key={vol.subscriberId || vol.id || idx}
                        className="pt-1.5 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-semibold text-gray-800">
                              {vol.name || vol.subscriberId || `Subscriber ${idx + 1}`}
                            </span>
                            {vol.skill && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-gray-100 text-gray-600 font-medium">
                                {vol.skill}
                              </span>
                            )}
                          </div>
                          {(vol.channel || vol.endpoint) && (
                            <div className="text-[10px] text-gray-400 truncate max-w-[170px]">
                              {vol.channel || vol.endpoint}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          {(vol.distanceKm != null || vol.distance != null) && (
                            <span
                              className={`font-mono text-[10px] ${isDelivered ? 'text-green-700 font-bold' : 'text-gray-500'
                                }`}
                            >
                              {vol.distanceKm ?? vol.distance} km
                            </span>
                          )}
                          <div className="text-[9px]">
                            {isDelivered ? (
                              <span className="text-green-600 font-semibold">Delivered</span>
                            ) : (
                              <span className="text-gray-400">Skipped</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-gray-400 text-[11px] py-4 text-center space-y-1">
                  <Users className="w-5 h-5 mx-auto text-gray-300" />
                  <p>Awaiting publish request...</p>
                  <p className="text-[10px] text-gray-400">
                    Real volunteer records from DynamoDB will appear here upon submission.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-3 text-center text-[11px] text-gray-500">
        Padosi Demo • Hyperlocal Volunteer Notification • Amazon SNS + AWS Lambda + DynamoDB
      </footer>
    </div>
  );
};

export default App;
