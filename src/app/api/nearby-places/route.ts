import { NextRequest, NextResponse } from "next/server";

/**
 * Find the nearest health/counseling facility using the Overpass API (real
 * geographic proximity via OSM tags), not Nominatim text search.
 */
export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lng = req.nextUrl.searchParams.get("lng");
  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  try {
    const radiusM = 15000; // 15 km

    // Overpass QL: find nodes/ways tagged as health-related within radius
    const query = `
[out:json][timeout:10];
(
  node["amenity"="clinic"](around:${radiusM},${lat},${lng});
  node["amenity"="hospital"](around:${radiusM},${lat},${lng});
  node["amenity"="doctors"](around:${radiusM},${lat},${lng});
  node["amenity"="social_facility"](around:${radiusM},${lat},${lng});
  node["healthcare"](around:${radiusM},${lat},${lng});
  way["amenity"="clinic"](around:${radiusM},${lat},${lng});
  way["amenity"="hospital"](around:${radiusM},${lat},${lng});
  way["amenity"="social_facility"](around:${radiusM},${lat},${lng});
  way["healthcare"](around:${radiusM},${lat},${lng});
);
out center 8;
`;

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Aadhar/1.0 (family support app)",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ place: null }, { status: 200 });
    }

    const json = (await res.json()) as {
      elements: {
        tags?: Record<string, string>;
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
      }[];
    };

    if (!json.elements?.length) {
      return NextResponse.json({ place: null }, { status: 200 });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    // Pick the closest element that has a name
    let best: { name: string; lat: number; lon: number; dist: number } | null = null;
    for (const el of json.elements) {
      const name = el.tags?.name;
      if (!name) continue;
      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      if (elLat == null || elLon == null) continue;
      const dist = haversineKm(userLat, userLng, elLat, elLon);
      if (!best || dist < best.dist) {
        best = { name, lat: elLat, lon: elLon, dist };
      }
    }

    if (!best) {
      return NextResponse.json({ place: null }, { status: 200 });
    }

    return NextResponse.json(
      { place: { name: best.name, lat: String(best.lat), lon: String(best.lon) } },
      { headers: { "Cache-Control": "public, s-maxage=3600" } }
    );
  } catch {
    return NextResponse.json({ place: null }, { status: 200 });
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
