/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Normalizes a header key to lowercase alphanumeric for flexible column matching.
 */
export function normalizeHeaderKey(header: string): string {
  return header.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
}

/**
 * RFC-4180 compliant CSV / TSV parser that preserves quoted multiline fields
 * and escaped double-quotes (""), and auto-detects tab vs comma separation.
 */
export function parseCsvOrTsvRecords(rawText: string): Record<string, string>[] {
  if (!rawText) return [];
  const text = rawText.replace(/^\uFEFF/, "").trim();
  if (!text) return [];

  // Auto-detect delimiter from the first unquoted line
  let firstLine = "";
  let inQuotesFirst = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotesFirst = !inQuotesFirst;
    } else if ((ch === "\n" || ch === "\r") && !inQuotesFirst) {
      break;
    } else {
      firstLine += ch;
    }
  }
  const delimiter = firstLine.includes("\t") ? "\t" : ",";

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }

  // Push final cell/row
  currentRow.push(currentCell.trim());
  if (currentRow.some((cell) => cell !== "")) {
    rows.push(currentRow);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => normalizeHeaderKey(h));
  const records: Record<string, string>[] = [];

  for (let r = 1; r < rows.length; r++) {
    const values = rows[r];
    if (!values.some((v) => v.trim() !== "")) continue;
    const obj: Record<string, string> = {};
    headers.forEach((hdr, idx) => {
      if (hdr) {
        obj[hdr] = (values[idx] || "").trim();
      }
    });
    records.push(obj);
  }

  return records;
}

/**
 * Matches a value from a parsed CSV row using prioritized exact and fuzzy header aliases.
 */
export function findHeaderVal(
  row: Record<string, string>,
  possibleKeys: string[],
): string {
  for (const key of possibleKeys) {
    const cleanKey = normalizeHeaderKey(key);
    if (row[cleanKey] !== undefined && row[cleanKey] !== "") {
      return row[cleanKey].trim();
    }
  }

  const rowKeys = Object.keys(row);
  for (const key of possibleKeys) {
    const cleanKey = normalizeHeaderKey(key);
    const found = rowKeys.find(
      (k) => k.includes(cleanKey) || cleanKey.includes(k),
    );
    if (found && row[found] !== undefined && row[found] !== "") {
      return row[found].trim();
    }
  }

  return "";
}

/**
 * Converts a Google Sheets view/edit/share URL into a direct CSV export URL
 * and fetches the CSV text.
 */
export async function fetchGoogleSheetAsCsvText(
  sheetUrl: string,
): Promise<string> {
  const trimmed = sheetUrl.trim();
  if (!trimmed) {
    throw new Error("Please enter a valid Google Sheets URL or CSV link.");
  }

  let fetchUrl = trimmed;

  if (trimmed.includes("docs.google.com/spreadsheets/d/")) {
    // Already a published CSV link? Keep as-is
    if (!trimmed.includes("output=csv") && !trimmed.includes("format=csv")) {
      const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        const docId = match[1];
        const gidMatch = trimmed.match(/gid=([0-9]+)/);
        const gid = gidMatch ? gidMatch[1] : "0";
        fetchUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv&gid=${gid}`;
      }
    }
  }

  const res = await fetch(fetchUrl);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch spreadsheet (${res.status} ${res.statusText}). Ensure the sheet is shared as 'Anyone with the link can view' or published to the web as CSV.`,
    );
  }

  const text = await res.text();
  if (!text || text.trim().length < 3) {
    throw new Error("Received empty data from the provided URL.");
  }

  const lower = text.trim().slice(0, 200).toLowerCase();
  if (lower.startsWith("<!doctype html") || lower.startsWith("<html")) {
    throw new Error(
      "Google Sheets returned a login/HTML page instead of CSV. Please set sharing to 'Anyone with the link can view' or use File -> Share -> Publish to web (CSV).",
    );
  }

  return text;
}
