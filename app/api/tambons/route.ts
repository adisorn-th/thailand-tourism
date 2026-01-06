import { promises as fs } from "fs";
import path from "path";

const TAMBON_SOURCE_URL =
  "https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_THA_3.json";

const LOCAL_TAMBON_PATH = path.join(process.cwd(), "data", "tambons.json");

export async function GET() {
  try {
    const fileContents = await fs.readFile(LOCAL_TAMBON_PATH, "utf-8");
    return new Response(fileContents, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.warn("Failed to read local tambon data, falling back to remote fetch:", error);
  }

  try {
    const res = await fetch(TAMBON_SOURCE_URL, { cache: "force-cache" });
    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch tambon data." }),
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
      JSON.stringify({ error: "Failed to fetch tambon data." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
