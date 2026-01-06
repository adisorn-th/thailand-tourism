const AMPHOE_SOURCE_URL =
  "https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_THA_2.json";

export async function GET() {
  try {
    const res = await fetch(AMPHOE_SOURCE_URL, { cache: "force-cache" });
    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch amphoe data." }),
        {
          status: res.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to fetch amphoe data." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
