import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Radio,
  Layers,
  Compass,
  CheckCircle2,
  XCircle,
  Filter,
  Info,
  Sliders
} from 'lucide-react';
import { Subscription } from '../types';

interface GeoMapViewProps {
  subscriptions: Subscription[];
  onSetPublisherLocation?: (lat: number, lng: number) => void;
}

export const GeoMapView: React.FC<GeoMapViewProps> = ({
  subscriptions,
  onSetPublisherLocation
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const publisherMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const subscriberMarkersRef = useRef<L.Marker[]>([]);

  // Publisher coordinates & radius
  const [publisherPos, setPublisherPos] = useState<[number, number]>([12.9716, 77.5946]);
  const [radiusKm, setRadiusKm] = useState<number>(1.5);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

  // Quick calculate distance
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Create map centered on campus
    const map = L.map(mapContainerRef.current).setView(publisherPos, 14);
    mapInstanceRef.current = map;

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(map);

    // Custom Publisher Icon (AWS Orange Radar)
    const publisherIcon = L.divIcon({
      className: 'publisher-pin',
      html: `
        <div style="background-color: #ec7211; width: 32px; height: 32px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker(publisherPos, {
      icon: publisherIcon,
      draggable: true
    }).addTo(map);
    publisherMarkerRef.current = marker;

    marker.bindPopup(
      `<div style="font-family: sans-serif; font-size: 12px;"><strong>Publisher Dispatch Post</strong><br/>Drag to move publisher position</div>`
    );

    marker.on('dragend', (e) => {
      const latlng = e.target.getLatLng();
      setPublisherPos([latlng.lat, latlng.lng]);
      if (onSetPublisherLocation) {
        onSetPublisherLocation(latlng.lat, latlng.lng);
      }
    });

    // Delivery Radius Circle
    const circle = L.circle(publisherPos, {
      radius: radiusKm * 1000,
      color: '#ec7211',
      fillColor: '#ec7211',
      fillOpacity: 0.15,
      weight: 2,
      dashArray: '4, 4'
    }).addTo(map);
    radiusCircleRef.current = circle;

    // Click anywhere on map to reposition publisher
    map.on('click', (e) => {
      setPublisherPos([e.latlng.lat, e.latlng.lng]);
      if (marker) marker.setLatLng(e.latlng);
      if (circle) circle.setLatLng(e.latlng);
      if (onSetPublisherLocation) {
        onSetPublisherLocation(e.latlng.lat, e.latlng.lng);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Circle & Publisher Marker when radius or pos changes
  useEffect(() => {
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setRadius(radiusKm * 1000);
      radiusCircleRef.current.setLatLng(publisherPos);
    }
    if (publisherMarkerRef.current) {
      publisherMarkerRef.current.setLatLng(publisherPos);
    }
  }, [radiusKm, publisherPos]);

  // Render Subscriber Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    subscriberMarkersRef.current.forEach((m) => m.remove());
    subscriberMarkersRef.current = [];

    subscriptions.forEach((sub) => {
      const dist = getDistanceKm(
        publisherPos[0],
        publisherPos[1],
        sub.location.lat,
        sub.location.lng
      );
      const isWithinRadius = dist <= radiusKm;
      const isConfirmed = sub.status === 'Confirmed';

      // Pin Color:
      // Green = Confirmed & Within Radius (Eligible)
      // Amber = Pending Confirmation
      // Gray = Outside Radius
      let bgColor = '#10b981'; // green
      let statusBadge = 'Eligible (In Radius)';
      if (!isConfirmed) {
        bgColor = '#f59e0b'; // amber
        statusBadge = 'Pending Confirmation';
      } else if (!isWithinRadius) {
        bgColor = '#64748b'; // slate/gray
        statusBadge = `Outside Radius (+${(dist - radiusKm).toFixed(2)}km)`;
      }

      const subIcon = L.divIcon({
        className: 'subscriber-pin',
        html: `
          <div style="background-color: ${bgColor}; width: 26px; height: 26px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([sub.location.lat, sub.location.lng], {
        icon: subIcon
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 11px; min-width: 180px;">
          <strong style="font-size: 12px; color: #1e293b;">${sub.subscriberName}</strong><br/>
          <span style="color: #64748b;">${sub.endpoint} (${sub.protocol.toUpperCase()})</span>
          <hr style="margin: 4px 0; border: none; border-top: 1px solid #e2e8f0;"/>
          <strong>Distance:</strong> ${dist} km<br/>
          <strong>H3 Res 9:</strong> <code style="font-size: 10px;">${sub.location.h3Res9 || 'res-9'}</code><br/>
          <strong>Status:</strong> <span style="color: ${bgColor}; font-weight: bold;">${statusBadge}</span>
        </div>
      `);

      marker.on('click', () => {
        setSelectedSub(sub);
      });

      subscriberMarkersRef.current.push(marker);
    });
  }, [subscriptions, publisherPos, radiusKm]);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-amber-600" />
            <h1 className="text-xl font-bold text-gray-900">
              PadosiCast Geo-Radius & Candidate Map
            </h1>
          </div>
          <p className="text-xs text-gray-600 mt-1 max-w-xl">
            Visualizing the publisher-owned delivery radius. H3 Resolution 9 cells (~100m) identify candidate subscribers, followed by exact Haversine distance verification.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-xs bg-gray-50 px-3 py-2 rounded border border-gray-200 shrink-0">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-aws-orange border border-white shadow-sm" />
            <span className="text-gray-700 font-medium">Publisher</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-sm" />
            <span className="text-gray-700 font-medium">In Radius</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-500 border border-white shadow-sm" />
            <span className="text-gray-700 font-medium">Outside</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-sm" />
            <span className="text-gray-700 font-medium">Pending</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map Canvas (3 Columns) */}
        <div className="lg:col-span-3 bg-white rounded-lg p-2 border border-gray-200 shadow-sm flex flex-col h-[560px]">
          <div className="flex-1 relative rounded overflow-hidden">
            <div ref={mapContainerRef} className="w-full h-full" />
            <div className="absolute top-3 right-3 z-[400] bg-white/90 backdrop-blur px-3 py-1.5 rounded shadow text-xs text-gray-800 font-medium border border-gray-200 flex items-center space-x-1.5 pointer-events-none">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Click anywhere on map to reposition publisher</span>
            </div>
          </div>
        </div>

        {/* Controls and Subscriber Inspection (1 Column) */}
        <div className="space-y-4 text-xs">
          {/* Radius Control Box */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between font-bold text-gray-900">
              <div className="flex items-center space-x-1.5">
                <Sliders className="w-4 h-4 text-aws-orange" />
                <span>Publisher Radius</span>
              </div>
              <span className="text-aws-orange font-mono text-sm">{radiusKm} km</span>
            </div>

            <input
              type="range"
              min="0.5"
              max="8"
              step="0.5"
              value={radiusKm}
              onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
              className="w-full accent-aws-orange cursor-pointer"
            />

            <div className="text-[11px] text-gray-500 space-y-1">
              <div>
                <strong>Lat:</strong> {publisherPos[0].toFixed(4)} | <strong>Lng:</strong> {publisherPos[1].toFixed(4)}
              </div>
              <p className="text-[10px] text-gray-400">
                Rule: Publisher owns radius. Subscribers do not define their own delivery bounds.
              </p>
            </div>
          </div>

          {/* Selected Subscriber Details Card */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-1.5 font-bold text-gray-900">
              <Radio className="w-4 h-4 text-blue-600" />
              <span>Subscriber Inspector</span>
            </div>

            {selectedSub ? (
              <div className="space-y-2">
                <div className="font-semibold text-gray-900 text-sm">
                  {selectedSub.subscriberName}
                </div>
                <div className="text-gray-500 font-mono text-[11px]">
                  {selectedSub.endpoint}
                </div>

                <div className="p-2.5 bg-gray-50 rounded border space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Distance:</span>
                    <strong className="text-gray-900">
                      {getDistanceKm(
                        publisherPos[0],
                        publisherPos[1],
                        selectedSub.location.lat,
                        selectedSub.location.lng
                      )}{' '}
                      km
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">H3 Cell:</span>
                    <span className="font-mono text-gray-700">
                      {selectedSub.location.h3Res9 || 'res-9'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Confirmation:</span>
                    <span
                      className={
                        selectedSub.status === 'Confirmed'
                          ? 'text-green-600 font-semibold'
                          : 'text-amber-600 font-semibold'
                      }
                    >
                      {selectedSub.status}
                    </span>
                  </div>
                </div>

                {selectedSub.filterPolicy && (
                  <div>
                    <span className="text-gray-600 font-semibold text-[10px]">Filter Policy:</span>
                    <pre className="p-2 bg-slate-900 text-slate-100 rounded text-[10px] font-mono mt-1 overflow-x-auto">
                      {JSON.stringify(selectedSub.filterPolicy, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-400 text-center py-6 text-xs">
                Click on any map subscriber pin to inspect distance, H3 index, and filter status.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
