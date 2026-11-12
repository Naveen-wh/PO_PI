/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { fetchViaAppsScript, syncRecordToAppsScript, MODULE_CONFIGS, getBlueprintFieldsForCollection } from "./googleSheetsService";
import { getAppsScriptConfig, getGoogleSheetsSettings } from "./firebaseService";

export interface OperationalSheetConfig {
  collectionKey: string;
  configKey: string;
  defaultSheetName: string;
  label: string;
}

export const OPERATIONAL_COLLECTIONS: OperationalSheetConfig[] = [
  { collectionKey: "purchase_orders", configKey: "purchase_orders_apps_script", defaultSheetName: "PO", label: "Purchase Orders (PO)" },
  { collectionKey: "proforma_invoices", configKey: "proforma_invoices_apps_script", defaultSheetName: "PI", label: "Proforma Invoices (PI)" }
];

// In-memory cache for resolved Apps Script URLs to avoid redundant Firestore reads
const urlCache: { [configKey: string]: { url: string; sheetName: string } } = {};
let globalAppsScriptUrlCache: string | null = null;  // will remove this functionality later

/**
 * Resolves the Google Apps Script Web App URL and Sheet Name for an operational table.
 * Priority: Specific Config Doc in Firestore settings -> Global Google Sheets config in Firestore -> Empty
 */
export async function getOperationalSheetEndpoint(configKey: string, defaultSheetName: string): Promise<{ url: string; sheetName: string }> {
  if (urlCache[configKey] && urlCache[configKey].url) {
    return {
      url: urlCache[configKey].url,
      sheetName: defaultSheetName || urlCache[configKey].sheetName || defaultSheetName
    };
  }

  let sheetName = defaultSheetName;
  let url = "";

  try {
    const config = await getAppsScriptConfig(configKey, defaultSheetName);
    if (config?.appsScriptUrl && config.appsScriptUrl.trim()) {
      url = config.appsScriptUrl.trim();
      if (config.sheetName) sheetName = config.sheetName;
    }
  } catch {
    // ignore
  }

  if (!url) {
    try {
      if (globalAppsScriptUrlCache === null) {
        const globalSettings = await getGoogleSheetsSettings();
        globalAppsScriptUrlCache = globalSettings?.appsScriptUrl?.trim() || "";
      }
      if (globalAppsScriptUrlCache) {
        url = globalAppsScriptUrlCache;
      }
    } catch {
      // ignore
    }
  }

  const result = { url, sheetName };
  if (url) {
    urlCache[configKey] = result;
  }
  return result;
}

/**
 * Clears URL cache so newly saved settings in Firestore are refreshed immediately
 */
export function clearSheetUrlCache(): void {
  for (const k in urlCache) delete urlCache[k];
  globalAppsScriptUrlCache = null;
}

/**
 * Loads operational records from Google Sheet via Apps Script deployed URL.
 * 2
 */
export async function fetchOperationalSheetData(
  collectionKey: string,
  defaultSheetName: string,
  configKey: string
): Promise<any[]> {
  const { url, sheetName } = await getOperationalSheetEndpoint(configKey, defaultSheetName);
  if (!url) {
    return [];
  }

  try {
    const records = await fetchViaAppsScript(url, sheetName, collectionKey);
    return records || [];
  } catch (err) {
    console.warn(`[OperationalSheet] Could not load ${collectionKey} from Google Sheet (${sheetName}):`, err);
    return [];
  }
}

/**
 * Executes a CRUD operation (ADD, EDIT, DELETE) directly against Google Sheet via Apps Script deployed URL.
 */
export async function syncOperationalAction(
  action: "ADD" | "EDIT" | "DELETE" | "GENERATE",
  collectionKey: string,
  record: any,
  defaultSheetName: string,
  configKey: string,
  current_user_email: string,
  current_user_name: string
): Promise<{ status: "success" | "warning" | "skipped"; message?: string ; id?: string; data?: any}> {
  const { url, sheetName } = await getOperationalSheetEndpoint(configKey, defaultSheetName);
  if (!url) {
    console.warn(`[OperationalSheet] No Apps Script URL configured for ${collectionKey} (${configKey})`);
    return { status: "skipped", message: "No Apps Script URL configured" };
  }

  const targetSheet = defaultSheetName || sheetName || "PO";
  return syncRecordToAppsScript(url, action, collectionKey, record, targetSheet, current_user_email, current_user_name);
}

/**
 * Clears all records of an operational worksheet in Google Sheets via Apps Script.
 * I don't want to give any command from frontend to wipe all data
 */
// export async function clearOperationalSheetRecords(
//   collectionKey: string,
//   defaultSheetName: string,
//   configKey: string
// ): Promise<{ status: "success" | "warning" | "skipped"; message?: string }> {
//   const { url, sheetName } = await getOperationalSheetEndpoint(configKey, defaultSheetName);
//   if (!url) {
//     console.warn(`[OperationalSheet] No Apps Script URL configured for ${collectionKey} (${configKey})`);
//     return { status: "skipped", message: "No Apps Script URL configured" };
//   }

//   return syncRecordToAppsScript(url, "CLEAR" as any, collectionKey, {}, sheetName);
// }
