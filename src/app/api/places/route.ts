import type { NextRequest } from "next/server";

import { searchPlaces } from "@/lib/weather/open-meteo/client";

const MIN_LENGTH = 2;
const MAX_LENGTH = 80;

/**
 * City search, proxied so the client never depends on the provider's response
 * shape. Results are cached at the edge for a day: place names don't change.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < MIN_LENGTH) return Response.json({ places: [] });
  if (query.length > MAX_LENGTH) {
    return Response.json(
      { error: `Query must be ${MAX_LENGTH} characters or fewer.` },
      { status: 400 },
    );
  }

  try {
    const places = await searchPlaces(query);
    return Response.json(
      { places },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch {
    return Response.json({ error: "Place search is unavailable." }, { status: 502 });
  }
}
