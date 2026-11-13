/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  Download,
  Copy,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  X,
  RefreshCw,
  Search,
  Building2,
  ExternalLink,
} from "lucide-react";
import { SupplierMasterRecord } from "../../types";
import {
  parseCsvOrTsvRecords,
  findHeaderVal,
  fetchGoogleSheetAsCsvText,
} from "../../lib/csvImportUtils";

export type BulkSupplierImportItem = Omit<SupplierMasterRecord, "id" | "createdAt"> & {
  id?: string;
  createdAt?: string;
};

interface SupplierBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSuppliers: SupplierMasterRecord[];
  onAddSupplierMaster?: (data: Omit<SupplierMasterRecord, "id" | "createdAt">) => Promise<void> | void;
  onEditSupplierMaster?: (
    id: string,
    data: Omit<SupplierMasterRecord, "id" | "createdAt">,
  ) => Promise<void> | void;
  onBulkImportSuppliersMaster?: (records: BulkSupplierImportItem[]) => Promise<void> | void;
}

interface ParsedSupplierRow {
  rowIndex: number;
  supplierName: string;
  supplierGst: string;
  supplierAddress: string;
  contactPersonName: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  importDomestic: "Import" | "Domestic";
  remarks: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  isDuplicate: boolean;
  existingSupplier?: SupplierMasterRecord;
  duplicateReason?: string;
}

const normalizeSupplierKey = (name: string) =>
  name ? name.toLowerCase().replace(/[^a-z0-9]/g, "").trim() : "";

function parseImportDomestic(raw: string): { value: "Import" | "Domestic"; warning?: string } {
  const norm = raw.trim().toLowerCase();
  if (!norm) return { value: "Import" };
  if (
    norm === "domestic" ||
    norm === "dom" ||
    norm === "local" ||
    norm === "india" ||
    norm === "indian"
  ) {
    return { value: "Domestic" };
  }
  if (
    norm === "import" ||
    norm === "imp" ||
    norm === "overseas" ||
    norm === "foreign" ||
    norm === "international"
  ) {
    return { value: "Import" };
  }
  return {
    value: "Import",
    warning: `Unrecognized type "${raw}", defaulted to Import.`,
  };
}

export default function SupplierBulkImportModal({
  isOpen,
  onClose,
  existingSuppliers = [],
  onAddSupplierMaster,
  onEditSupplierMaster,
  onBulkImportSuppliersMaster,
}: SupplierBulkImportModalProps) {
  const [importMode, setImportMode] = useState<"file" | "sheet_url" | "paste">("file");
  const [pastedText, setPastedText] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [duplicateStrategy, setDuplicateStrategy] = useState<"overwrite" | "skip" | "create_new">("overwrite");
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "valid" | "errors" | "duplicates">("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingMap = useMemo(() => {
    const map = new Map<string, SupplierMasterRecord>();
    existingSuppliers.forEach((s) => {
      const key = normalizeSupplierKey(s.supplierName || "");
      if (key && !map.has(key)) {
        map.set(key, s);
      }
    });
    return map;
  }, [existingSuppliers]);

  const parsedRows: ParsedSupplierRow[] = useMemo(() => {
    if (!pastedText.trim()) return [];
    const rawRecords = parseCsvOrTsvRecords(pastedText);
    if (rawRecords.length === 0) return [];

    const seenInSheet = new Map<string, number>();

    return rawRecords.map((rec, idx) => {
      const rowIndex = idx + 1;
      const errors: string[] = [];
      const warnings: string[] = [];

      const supplierName = findHeaderVal(rec, [
        "suppliername",
        "supplier",
        "vendorname",
        "vendor",
        "companyname",
        "company",
        "partyname",
        "name",
      ]);

      const supplierGst = findHeaderVal(rec, [
        "suppliergst",
        "suppliergstin",
        "gstin",
        "gst",
        "gstno",
        "gstnumber",
        "vendorgst",
        "taxid",
      ]).toUpperCase();

      const rawType = findHeaderVal(rec, [
        "importdomestic",
        "importordomestic",
        "suppliertype",
        "type",
        "category",
        "origin",
      ]);
      const parsedType = parseImportDomestic(rawType);
      if (parsedType.warning) {
        warnings.push(parsedType.warning);
      }

      const supplierAddress = findHeaderVal(rec, [
        "supplieraddress",
        "address",
        "fulladdress",
        "officeaddress",
        "vendoraddress",
        "location",
      ]);

      const contactPersonName = findHeaderVal(rec, [
        "contactpersonname",
        "contactperson",
        "cpname",
        "contactname",
        "representative",
      ]);

      const contactPersonEmail = findHeaderVal(rec, [
        "contactpersonemail",
        "cpemail",
        "cpemailid",
        "email",
        "emailid",
        "contactemail",
      ]);

      const contactPersonPhone = findHeaderVal(rec, [
        "contactpersonphone",
        "cpphone",
        "cpnumber",
        "phone",
        "phonenumber",
        "mobile",
        "mobilenumber",
        "contactno",
      ]);

      const remarks = findHeaderVal(rec, [
        "remarks",
        "remark",
        "notes",
        "note",
        "description",
        "comments",
      ]);

      if (!supplierName) {
        errors.push("Supplier Name is required.");
      }

      const norm = normalizeSupplierKey(supplierName);
      const existing = norm ? existingMap.get(norm) : undefined;
      const isDuplicate = !!existing;

      if (norm) {
        const firstSeenRow = seenInSheet.get(norm);
        if (firstSeenRow !== undefined) {
          warnings.push(`Repeated in file (first seen at row #${firstSeenRow}).`);
        } else {
          seenInSheet.set(norm, rowIndex);
        }
      }

      return {
        rowIndex,
        supplierName,
        supplierGst,
        supplierAddress,
        contactPersonName,
        contactPersonEmail,
        contactPersonPhone,
        importDomestic: parsedType.value,
        remarks,
        isValid: errors.length === 0,
        errors,
        warnings,
        isDuplicate,
        existingSupplier: existing,
        duplicateReason: isDuplicate
          ? `Matches existing supplier: "${existing?.supplierName}"`
          : undefined,
      };
    });
  }, [pastedText, existingMap]);

  const stats = useMemo(() => {
    const total = parsedRows.length;
    const valid = parsedRows.filter((r) => r.isValid && !r.isDuplicate).length;
    const duplicates = parsedRows.filter((r) => r.isValid && r.isDuplicate).length;
    const errors = parsedRows.filter((r) => !r.isValid).length;
    return { total, valid, duplicates, errors };
  }, [parsedRows]);

  const filteredRows = useMemo(() => {
    return parsedRows.filter((r) => {
      if (statusFilter === "valid" && (!r.isValid || r.isDuplicate)) return false;
      if (statusFilter === "duplicates" && !r.isDuplicate) return false;
      if (statusFilter === "errors" && r.isValid) return false;

      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        return (
          r.supplierName.toLowerCase().includes(q) ||
          r.supplierGst.toLowerCase().includes(q) ||
          r.importDomestic.toLowerCase().includes(q) ||
          r.contactPersonName.toLowerCase().includes(q) ||
          r.contactPersonEmail.toLowerCase().includes(q) ||
          r.contactPersonPhone.toLowerCase().includes(q) ||
          r.supplierAddress.toLowerCase().includes(q) ||
          r.remarks.toLowerCase().includes(q) ||
          r.errors.some((e) => e.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [parsedRows, statusFilter, searchFilter]);

  const sampleCsvContent = useMemo(() => {
    return [
      `Supplier Name,Supplier GST,Import / Domestic,Supplier Address,Contact Person Name,Contact Person Email,Contact Person Phone,Remarks`,
      `"Global Chemicals Ltd","","Import","Jurong Island Industrial Park, Singapore","David Lim","david@globalchem.sg","+65 6123 4567","Preferred sea freight supplier"`,
      `"Aura Fine Enterprises","27AAACA8899B1Z4","Domestic","Plot C-14 TTC Industrial Area, Navi Mumbai","Vikram Joshi","vikram@aurafine.in","+91 98200 55443","30 days net credit"`,
      `"Sino Aroma Ingredients","","Import","Pudong New Area, Shanghai, China","Lin Wei","lin@sinoaroma.cn","+86 21 5566 7788","LC 60 days"`,
    ].join("\n");
  }, []);

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleCsvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "suppliers_master_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadSample = () => {
    setPastedText(sampleCsvContent);
    setFileName("sample_suppliers.csv");
    setImportError("");
    setImportResult(null);
    setImportMode("paste");
  };

  const readSelectedFile = (file: File) => {
    setFileName(file.name);
    setImportError("");
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        setPastedText(text);
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readSelectedFile(file);
    }
  };

  const handleFetchSheetUrl = async () => {
    setUrlError("");
    setImportError("");
    setImportResult(null);
    setIsFetchingUrl(true);

    try {
      const csvText = await fetchGoogleSheetAsCsvText(sheetUrl);
      setPastedText(csvText);
      setFileName("Google Sheets Data");
    } catch (err: any) {
      setUrlError(
        err?.message ||
          "Failed to fetch CSV from Google Sheets URL. Ensure sharing is set to 'Anyone with link can view' or try pasting the data directly.",
      );
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleExecuteImport = async () => {
    const rowsToProcess = parsedRows.filter((r) => {
      if (!r.isValid) return false;
      if (r.isDuplicate && duplicateStrategy === "skip") return false;
      return true;
    });

    if (rowsToProcess.length === 0) {
      setImportError("No valid supplier rows to import with the current settings.");
      return;
    }

    setImportError("");
    setIsProcessing(true);
    setImportProgress({ current: 0, total: rowsToProcess.length });

    let createdCount = 0;
    let updatedCount = 0;
    const skippedCount = parsedRows.length - rowsToProcess.length;
    const errorCount = stats.errors;

    try {
      if (onBulkImportSuppliersMaster) {
        const nowIso = new Date().toISOString();
        const batchItems: BulkSupplierImportItem[] = rowsToProcess.map((r, i) => {
          const isUpdate = Boolean(
            r.isDuplicate && duplicateStrategy === "overwrite" && r.existingSupplier?.id,
          );
          if (isUpdate) {
            updatedCount++;
            return {
              id: r.existingSupplier!.id,
              createdAt: r.existingSupplier!.createdAt || nowIso,
              supplierName: r.supplierName,
              supplierGst: r.supplierGst || r.existingSupplier!.supplierGst || "",
              supplierAddress: r.supplierAddress || r.existingSupplier!.supplierAddress || "",
              contactPersonName:
                r.contactPersonName || r.existingSupplier!.contactPersonName || "",
              contactPersonEmail:
                r.contactPersonEmail || r.existingSupplier!.contactPersonEmail || "",
              contactPersonPhone:
                r.contactPersonPhone || r.existingSupplier!.contactPersonPhone || "",
              importDomestic: r.importDomestic,
              remarks: r.remarks || r.existingSupplier!.remarks || "",
            };
          } else {
            createdCount++;
            return {
              id: `sup-m-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
              createdAt: nowIso,
              supplierName: r.supplierName,
              supplierGst: r.supplierGst,
              supplierAddress: r.supplierAddress,
              contactPersonName: r.contactPersonName,
              contactPersonEmail: r.contactPersonEmail,
              contactPersonPhone: r.contactPersonPhone,
              importDomestic: r.importDomestic,
              remarks: r.remarks,
            };
          }
        });

        await onBulkImportSuppliersMaster(batchItems);
      } else {
        for (let i = 0; i < rowsToProcess.length; i++) {
          const r = rowsToProcess[i];
          setImportProgress({ current: i + 1, total: rowsToProcess.length });

          if (
            r.isDuplicate &&
            duplicateStrategy === "overwrite" &&
            r.existingSupplier?.id &&
            onEditSupplierMaster
          ) {
            await onEditSupplierMaster(r.existingSupplier.id, {
              supplierName: r.supplierName,
              supplierGst: r.supplierGst || r.existingSupplier.supplierGst || "",
              supplierAddress:
                r.supplierAddress || r.existingSupplier.supplierAddress || "",
              contactPersonName:
                r.contactPersonName || r.existingSupplier.contactPersonName || "",
              contactPersonEmail:
                r.contactPersonEmail || r.existingSupplier.contactPersonEmail || "",
              contactPersonPhone:
                r.contactPersonPhone || r.existingSupplier.contactPersonPhone || "",
              importDomestic: r.importDomestic,
              remarks: r.remarks || r.existingSupplier.remarks || "",
            });
            updatedCount++;
          } else if (onAddSupplierMaster) {
            await onAddSupplierMaster({
              supplierName: r.supplierName,
              supplierGst: r.supplierGst,
              supplierAddress: r.supplierAddress,
              contactPersonName: r.contactPersonName,
              contactPersonEmail: r.contactPersonEmail,
              contactPersonPhone: r.contactPersonPhone,
              importDomestic: r.importDomestic,
              remarks: r.remarks,
            });
            createdCount++;
          }
        }
      }

      setImportResult({
        created: createdCount,
        updated: updatedCount,
        skipped: skippedCount,
        errors: errorCount,
      });
    } catch (err: any) {
      console.error("Bulk supplier import error:", err);
      setImportError(err?.message || "An error occurred while importing suppliers.");
    } finally {
      setIsProcessing(false);
      setImportProgress(null);
    }
  };

  const handleReset = () => {
    setPastedText("");
    setFileName("");
    setSheetUrl("");
    setUrlError("");
    setImportError("");
    setImportResult(null);
    setSearchFilter("");
    setStatusFilter("all");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-emerald-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800/60 text-emerald-400 rounded-xl border border-emerald-700/50">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-white">
                  Bulk Import Suppliers Master
                </h3>
                <span className="text-[10px] font-mono font-bold bg-emerald-800 text-emerald-300 px-2 py-0.5 rounded-full">
                  CSV &amp; Google Sheets
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Import supplier profiles via CSV/TSV upload, Google Sheets link, or direct copy-paste.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-emerald-900/50 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success Banner */}
        {importResult && (
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shrink-0">
            <div className="flex items-center gap-3">
              <CheckCircle size={24} className="text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-emerald-950">Supplier Import Completed Successfully!</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Created <strong>{importResult.created}</strong> new suppliers, updated{" "}
                  <strong>{importResult.updated}</strong> existing suppliers
                  {importResult.skipped > 0 && `, skipped ${importResult.skipped} duplicate/invalid rows`}.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-bold px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 rounded-lg cursor-pointer transition-all"
              >
                Import More
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg cursor-pointer transition-all shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {importError && (
          <div className="px-4 py-3 bg-rose-50 border-b border-rose-200 text-rose-700 flex items-center justify-between gap-3 text-xs font-semibold shrink-0">
            <span className="flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" /> {importError}
            </span>
            <button type="button" onClick={() => setImportError("")} className="p-1 hover:bg-rose-100 rounded">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Template Guide */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet size={18} className="text-emerald-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-800">CSV &amp; Google Sheets Template Guide</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Supported columns:{" "}
                  <code className="text-emerald-700 font-mono font-semibold">Supplier Name</code> (required),{" "}
                  <code className="text-emerald-700 font-mono font-semibold">Supplier GST</code>,{" "}
                  <code className="text-emerald-700 font-mono font-semibold">Import / Domestic</code>,{" "}
                  <code className="text-emerald-700 font-mono font-semibold">Supplier Address</code>,{" "}
                  <code className="text-emerald-700 font-mono font-semibold">Contact Person Name</code>,{" "}
                  <code className="text-emerald-700 font-mono font-semibold">Contact Person Email</code>,{" "}
                  <code className="text-emerald-700 font-mono font-semibold">Contact Person Phone</code>,{" "}
                  <code className="text-emerald-700 font-mono font-semibold">Remarks</code>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleLoadSample}
                className="flex-1 sm:flex-none text-xs font-bold font-mono px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs transition-all"
              >
                <Copy size={13} /> Load Sample
              </button>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex-1 sm:flex-none text-xs font-bold font-mono px-3 py-1.5 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs transition-all"
              >
                <Download size={13} /> Download Template
              </button>
            </div>
          </div>

          {/* Import Mode Tabs */}
          <div className="flex flex-wrap border-b border-slate-200 gap-2 pb-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setImportMode("file")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                importMode === "file"
                  ? "bg-emerald-100/80 text-emerald-800 border border-emerald-300 shadow-3xs"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              <Upload size={14} /> Upload CSV / TSV File
            </button>
            <button
              type="button"
              onClick={() => setImportMode("sheet_url")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                importMode === "sheet_url"
                  ? "bg-emerald-100/80 text-emerald-800 border border-emerald-300 shadow-3xs"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              <ExternalLink size={14} /> Google Sheets Link
            </button>
            <button
              type="button"
              onClick={() => setImportMode("paste")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                importMode === "paste"
                  ? "bg-emerald-100/80 text-emerald-800 border border-emerald-300 shadow-3xs"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              <Copy size={14} /> Paste from Google Sheets / Excel
            </button>
          </div>

          {/* Mode 1: File Upload */}
          {importMode === "file" && (
            <div className="flex flex-col gap-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-50/60"
                    : "border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40"
                }`}
              >
                <div className="p-3 bg-white rounded-full border border-slate-200 shadow-xs text-emerald-600">
                  <Upload size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {fileName ? `Loaded: ${fileName}` : "Click to select or drag & drop a CSV / TSV file"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports .csv, .tsv, or CSV files exported from Google Sheets / Excel
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Mode 2: Google Sheets URL */}
          {importMode === "sheet_url" && (
            <div className="flex flex-col gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="text-xs font-bold text-slate-700">
                Google Sheets Link or Published CSV URL:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=0"
                  className="flex-1 text-xs border border-slate-300 bg-white px-3 py-2 rounded-xl focus:ring-1 focus:ring-emerald-500 outline-none text-slate-800"
                />
                <button
                  type="button"
                  onClick={handleFetchSheetUrl}
                  disabled={isFetchingUrl}
                  className="text-xs font-bold px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shrink-0"
                >
                  {isFetchingUrl ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                  Fetch Sheet Data
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Share the Google Sheet as <strong>Anyone with the link can view</strong> (or use File → Share → Publish to web as CSV).
              </p>
              {urlError && (
                <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle size={14} className="shrink-0" /> {urlError}
                </p>
              )}
            </div>
          )}

          {/* Mode 3: Paste Text */}
          {importMode === "paste" && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Paste Table Data (with header row):</span>
                {pastedText && (
                  <button
                    type="button"
                    onClick={() => {
                      setPastedText("");
                      setFileName("");
                    }}
                    className="text-[11px] font-mono text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear Text
                  </button>
                )}
              </label>
              <textarea
                rows={5}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`Supplier Name\tSupplier GST\tImport / Domestic\tSupplier Address\tContact Person Name\tContact Person Email\tContact Person Phone\tRemarks\nGlobal Chemicals Ltd\t\tImport\tJurong Island, Singapore\tDavid Lim\tdavid@globalchem.sg\t+65 6123 4567\tSea freight`}
                className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-800 placeholder-slate-400 resize-y"
              />
            </div>
          )}

          {/* Import Settings & Stats Bar */}
          {parsedRows.length > 0 && (
            <div className="bg-slate-100/80 p-3.5 rounded-xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 font-mono uppercase text-[10px]">
                  If Supplier Exists:
                </span>
                <select
                  value={duplicateStrategy}
                  onChange={(e) => setDuplicateStrategy(e.target.value as any)}
                  className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="overwrite">Overwrite &amp; Update Details</option>
                  <option value="skip">Skip Existing</option>
                  <option value="create_new">Create as New Entry</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] shrink-0">
                <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg font-bold text-slate-700">
                  Total: <strong>{stats.total}</strong>
                </span>
                <span className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold text-emerald-700">
                  New Ready: <strong>{stats.valid}</strong>
                </span>
                {stats.duplicates > 0 && (
                  <span className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg font-bold text-amber-700">
                    Duplicates: <strong>{stats.duplicates}</strong>
                  </span>
                )}
                {stats.errors > 0 && (
                  <span className="bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg font-bold text-rose-700">
                    Errors: <strong>{stats.errors}</strong>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="flex flex-col gap-2.5 flex-1 min-h-[220px]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                      statusFilter === "all"
                        ? "bg-slate-800 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All ({stats.total})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("valid")}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                      statusFilter === "valid"
                        ? "bg-emerald-700 text-white"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    Valid Only ({stats.valid})
                  </button>
                  {stats.duplicates > 0 && (
                    <button
                      type="button"
                      onClick={() => setStatusFilter("duplicates")}
                      className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                        statusFilter === "duplicates"
                          ? "bg-amber-600 text-white"
                          : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                      }`}
                    >
                      Duplicates ({stats.duplicates})
                    </button>
                  )}
                  {stats.errors > 0 && (
                    <button
                      type="button"
                      onClick={() => setStatusFilter("errors")}
                      className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                        statusFilter === "errors"
                          ? "bg-rose-600 text-white"
                          : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                      }`}
                    >
                      Errors ({stats.errors})
                    </button>
                  )}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter preview rows..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-auto max-h-[260px] scrollbar-thin bg-white shadow-3xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase font-bold font-mono text-slate-500 dark:text-slate-200 tracking-wider">
                    <tr className="whitespace-nowrap">
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Supplier Name</th>
                      <th className="py-2 px-3">GSTIN</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Contact Person</th>
                      <th className="py-2 px-3">Email / Phone</th>
                      <th className="py-2 px-3">Address</th>
                      <th className="py-2 px-3">Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400 font-mono text-xs">
                          No matching preview rows found.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => (
                        <tr
                          key={row.rowIndex}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            !row.isValid
                              ? "bg-rose-50/40"
                              : row.isDuplicate
                              ? "bg-amber-50/30"
                              : ""
                          }`}
                        >
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-400">{row.rowIndex}</td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {!row.isValid ? (
                              <span className="bg-rose-100 text-rose-800 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <AlertCircle size={10} /> Error
                              </span>
                            ) : row.isDuplicate ? (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <AlertTriangle size={10} /> Duplicate
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <CheckCircle size={10} /> Ready
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">
                            {row.supplierName || <span className="text-rose-500 italic">Missing</span>}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap font-mono text-[11px]">
                            {row.supplierGst || "-"}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                                row.importDomestic === "Import"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {row.importDomestic}
                            </span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">{row.contactPersonName || "-"}</td>
                          <td className="py-2 px-3 whitespace-nowrap font-mono text-[11px]">
                            {[row.contactPersonEmail, row.contactPersonPhone].filter(Boolean).join(" / ") ||
                              "-"}
                          </td>
                          <td className="py-2 px-3 max-w-[180px] truncate" title={row.supplierAddress}>
                            {row.supplierAddress || "-"}
                          </td>
                          <td className="py-2 px-3 text-[11px]">
                            {row.errors.length > 0 && (
                              <div className="text-rose-600 font-semibold">{row.errors.join(", ")}</div>
                            )}
                            {row.warnings.length > 0 && (
                              <div className="text-amber-600">{row.warnings.join(", ")}</div>
                            )}
                            {row.duplicateReason && (
                              <div className="text-amber-700 text-[10px] font-mono">{row.duplicateReason}</div>
                            )}
                            {row.isValid &&
                              row.errors.length === 0 &&
                              row.warnings.length === 0 &&
                              !row.isDuplicate && (
                                <span className="text-emerald-600 text-[10px] font-mono">Valid</span>
                              )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-mono">
            {parsedRows.length > 0 ? (
              <span>
                Ready to process{" "}
                <strong>
                  {parsedRows.filter((r) => r.isValid && (!r.isDuplicate || duplicateStrategy !== "skip")).length}
                </strong>{" "}
                supplier records
              </span>
            ) : (
              <span>Upload a CSV file, fetch a Google Sheet, or paste data to preview</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition-all"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={
                isProcessing ||
                parsedRows.length === 0 ||
                parsedRows.filter((r) => r.isValid && (!r.isDuplicate || duplicateStrategy !== "skip")).length === 0
              }
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Importing {importProgress ? `(${importProgress.current}/${importProgress.total})` : "..."}
                </>
              ) : (
                <>
                  <Building2 size={15} />
                  Import {stats.valid + (duplicateStrategy !== "skip" ? stats.duplicates : 0)} Suppliers
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
