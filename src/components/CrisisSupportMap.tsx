"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export type CrisisMapPlace = { name: string; lat: string; lon: string };

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

/**
 * OpenStreetMap tiles + explicit markers (user + optional Nominatim result).
 * Google’s iframe embed does not reliably show our search as pins.
 */
export function CrisisSupportMap({
  userLat,
  userLng,
  place,
  labelYou,
  labelSupport,
  openMapsLabel,
}: {
  userLat: number;
  userLng: number;
  place: CrisisMapPlace | null;
  labelYou: string;
  labelSupport: string;
  openMapsLabel: string;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const L = await import("leaflet");
      if (cancelled || !elRef.current) return;

      const m = L.map(elRef.current, { scrollWheelZoom: true });
      mapRef.current = m;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(m);

      const userIcon = L.divIcon({
        className: "crisis-leaflet-divicon",
        html: `<div class="crisis-leaflet-pin crisis-leaflet-pin--user"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      L.marker([userLat, userLng], { icon: userIcon })
        .addTo(m)
        .bindPopup(`<strong>${escapeHtml(labelYou)}</strong>`);

      if (place) {
        const plat = parseFloat(place.lat);
        const plng = parseFloat(place.lon);
        if (Number.isFinite(plat) && Number.isFinite(plng)) {
          const placeIcon = L.divIcon({
            className: "crisis-leaflet-divicon",
            html: `<div class="crisis-leaflet-pin crisis-leaflet-pin--support"></div>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          });
          const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
          L.marker([plat, plng], { icon: placeIcon })
            .addTo(m)
            .bindPopup(
              `<strong>${escapeHtml(labelSupport)}</strong><br/>${escapeHtml(place.name)}<br/><a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(openMapsLabel)}</a>`
            );

          const bounds = L.latLngBounds([userLat, userLng], [plat, plng]);
          m.fitBounds(bounds, { padding: [52, 52], maxZoom: 15 });
        } else {
          m.setView([userLat, userLng], 14);
        }
      } else {
        m.setView([userLat, userLng], 14);
      }

      requestAnimationFrame(() => {
        if (!cancelled) m.invalidateSize();
      });
      window.setTimeout(() => {
        if (!cancelled) m.invalidateSize();
      }, 400);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [userLat, userLng, place?.lat, place?.lon, place?.name, labelYou, labelSupport, openMapsLabel]);

  return <div ref={elRef} className="crisis-map-leaflet" />;
}
