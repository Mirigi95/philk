import fs from "fs";
import path from "path";

// In-memory cache so we don't re-read/re-parse the CSV on every single keystroke
let cachedIcdData = null;

function loadIcdData() {
  if (cachedIcdData) return cachedIcdData;

  try {
    // Adjust path based on where your CSV is stored relative to this file
    const filePath = path.join(process.cwd(), "api", "icd", "icd10cm-codes-2026.csv");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    const rows = fileContent.split("\n");
    cachedIcdData = rows
      .map((row) => {
        const [code, ...descParts] = row.split(",");
        return {
          code: code?.trim().replace(/"/g, ""),
          description: descParts.join(",")?.trim().replace(/"/g, ""),
        };
      })
      .filter((item) => item.code && item.description);

    return cachedIcdData;
  } catch (err) {
    console.error("Error reading ICD CSV file:", err);
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { q = "" } = req.query;
    const query = q.trim().toLowerCase();

    if (query.length < 2) {
      return res.status(200).json({ results: [] });
    }

    const data = loadIcdData();

    // Filter matching code or description (limit to 10 for performance)
    const matches = data
      .filter(
        (item) =>
          item.code.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      )
      .slice(0, 10);

    return res.status(200).json({ results: matches });
  } catch (error) {
    console.error("Error searching ICD codes:", error);
    return res.status(500).json({ error: "Failed to search ICD codes" });
  }
}