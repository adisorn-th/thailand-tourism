import { promises as fs } from "fs";
import path from "path";

const PROVINCES_SOURCE_URL =
  "https://raw.githubusercontent.com/thailand-geography-data/thailand-geography-json/master/src/provinces.json";
const DISTRICTS_SOURCE_URL =
  "https://raw.githubusercontent.com/thailand-geography-data/thailand-geography-json/master/src/districts.json";
const SUBDISTRICTS_SOURCE_URL =
  "https://raw.githubusercontent.com/thailand-geography-data/thailand-geography-json/master/src/subdistricts.json";

const LOCAL_POSTCODE_DIR = path.join(process.cwd(), "data", "postcodes");
const LOCAL_PROVINCES_PATH = path.join(LOCAL_POSTCODE_DIR, "provinces.json");
const LOCAL_DISTRICTS_PATH = path.join(LOCAL_POSTCODE_DIR, "districts.json");
const LOCAL_SUBDISTRICTS_PATH = path.join(LOCAL_POSTCODE_DIR, "subdistricts.json");

export async function GET() {
  try {
    const [provincesJson, districtsJson, subdistrictsJson] = await Promise.all([
      fs.readFile(LOCAL_PROVINCES_PATH, "utf-8"),
      fs.readFile(LOCAL_DISTRICTS_PATH, "utf-8"),
      fs.readFile(LOCAL_SUBDISTRICTS_PATH, "utf-8"),
    ]);

    return new Response(
      JSON.stringify({
        provinces: JSON.parse(provincesJson),
        districts: JSON.parse(districtsJson),
        subdistricts: JSON.parse(subdistrictsJson),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=86400",
        },
      }
    );
  } catch (error) {
    console.warn("Failed to read local postcode data, falling back to remote fetch:", error);
  }

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
