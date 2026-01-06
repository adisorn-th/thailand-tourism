const PROVINCES_SOURCE_URL =
  "https://raw.githubusercontent.com/thailand-geography-data/thailand-geography-json/master/src/provinces.json";
const DISTRICTS_SOURCE_URL =
  "https://raw.githubusercontent.com/thailand-geography-data/thailand-geography-json/master/src/districts.json";
const SUBDISTRICTS_SOURCE_URL =
  "https://raw.githubusercontent.com/thailand-geography-data/thailand-geography-json/master/src/subdistricts.json";

export async function GET() {
  try {
    const [provinceRes, districtRes, subdistrictRes] = await Promise.all([
      fetch(PROVINCES_SOURCE_URL, { cache: "force-cache" }),
      fetch(DISTRICTS_SOURCE_URL, { cache: "force-cache" }),
      fetch(SUBDISTRICTS_SOURCE_URL, { cache: "force-cache" }),
    ]);

    if (!provinceRes.ok || !districtRes.ok || !subdistrictRes.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch postcode data." }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const [provinces, districts, subdistricts] = await Promise.all([
      provinceRes.json(),
      districtRes.json(),
      subdistrictRes.json(),
    ]);

    return new Response(JSON.stringify({ provinces, districts, subdistricts }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to fetch postcode data." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
