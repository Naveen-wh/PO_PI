/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import {
  User,
  AolBranchName,
  SupplierName,
  Product,
  AolGodown,
  // DomesticSupplierName,
  DispatchLocation,
  WarehouseManagedBy,
  FreightTerm,
  PoRecord,
  SupplierMasterRecord,
} from "../../types";
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  X,
  Building2,
  Package,
  DollarSign,
  TrendingUp,
  RotateCcw,
  AlertTriangle,
  Receipt,
  MapPin,
  Calendar,
  Sparkles,
  FileText,
  UserCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Printer,
  ChevronDown,
  Check,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { DateRangeFilterPopup } from "../Utility/DateRangeFilterPopup";
import AppsScriptSyncBanner, {
  useAppsScriptSync
} from "../Utility/AppsScriptSyncBanner";
import {
  formatAmountInWords,
  formatNumberForCurrency,
  numberToWordsIndian,
} from "../../lib/numberToWords";

import { FullScreenLoader } from "../Utility/FullScreenLoader";

/**
 * Calculates sum of total quantities across all populated products (1..7) for a PO.
 */
export function getPoTotalQty(rec: PoRecord): number {
  let sum = 0;
  for (let i = 1; i <= 7; i++) {
    const q = (rec as any)[`totalQty${i}`];
    if (q !== undefined && q !== null && q !== "") {
      sum += Number(q) || 0;
    }
  }
  return sum;
}

/**
 * Calculates sum of total packs across all populated products (1..7) for a PO.
 */
export function getPoTotalPacks(rec: PoRecord): number {
  let sum = 0;
  for (let i = 1; i <= 7; i++) {
    const p = (rec as any)[`packs${i}`];
    if (p !== undefined && p !== null && p !== "") {
      sum += Number(p) || 0;
    }
  }
  return sum;
}

/**
 * Extracts list of populated products (1..7) from a PoRecord.
 */
export function getPoProductsList(rec: PoRecord): Array<{
  slot: number;
  description: string;
  packingKgs: string;
  packs: number;
  totalQty: number;
  rate: number;
  amount: number;
}> {
  const list: Array<{
    slot: number;
    description: string;
    packingKgs: string;
    packs: number;
    totalQty: number;
    rate: number;
    amount: number;
  }> = [];

  for (let i = 1; i <= 7; i++) {
    const desc = (rec as any)[`productDescription${i}`];
    const packing = (rec as any)[`packingKgs${i}`];
    const packs = (rec as any)[`packs${i}`];
    const qty = (rec as any)[`totalQty${i}`];
    const rate = (rec as any)[`rate${i}`];
    const amount = (rec as any)[`amount${i}`];

    if (
      desc ||
      qty ||
      amount ||
      packs ||
      (i === 1 && rec.productDescription1)
    ) {
      list.push({
        slot: i,
        description: desc || (i === 1 ? rec.productDescription1 : "") || "",
        packingKgs: packing || (i === 1 ? rec.packingKgs1 : "") || "",
        packs: Number(packs ?? (i === 1 ? rec.packs1 : 0)) || 0,
        totalQty: Number(qty ?? (i === 1 ? rec.totalQty1 : 0)) || 0,
        rate: Number(rate ?? (i === 1 ? rec.rate1 : 0)) || 0,
        amount: Number(amount ?? (i === 1 ? rec.amount1 : 0)) || 0,
      });
    }
  }

  if (list.length === 0) {
    list.push({
      slot: 1,
      description: rec.productDescription1 || "",
      packingKgs: rec.packingKgs1 || "",
      packs: Number(rec.packs1) || 0,
      totalQty: Number(rec.totalQty1) || 0,
      rate: Number(rec.rate1) || 0,
      amount: Number(rec.amount1) || 0,
    });
  }

  return list;
}

export interface SupplierOptionItem {
  id: string;
  name: string;
  gstin: string;
  address: string;
  cpName?: string;
  cpPhone?: string;
  cpEmail?: string;
  category?: string;
}

interface SearchableSupplierSelectProps {
  value: string;
  onChange: (value: string, matched?: SupplierOptionItem) => void;
  suppliers: SupplierOptionItem[];
  placeholder?: string;
  onQuickAdd?: () => void;
  required?: boolean;
  accentColor?: "emerald" | "amber";
}

export function SearchableSupplierSelect({
  value,
  onChange,
  suppliers,
  placeholder = "Type to search or enter supplier name...",
  onQuickAdd,
  required = false,
  accentColor = "emerald",
}: SearchableSupplierSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || "");
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync internal search term when external value changes
  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  // Filter suppliers in real-time
  const filteredSuppliers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.gstin && s.gstin.toLowerCase().includes(term)) ||
        (s.address && s.address.toLowerCase().includes(term)) ||
        (s.cpName && s.cpName.toLowerCase().includes(term)),
    );
  }, [suppliers, searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearchTerm(text);
    const matched = suppliers.find(
      (s) => s.name.trim().toLowerCase() === text.trim().toLowerCase(),
    );
    onChange(text, matched);
    if (!isOpen) setIsOpen(true);
  };

  const handleSelect = (item: SupplierOptionItem) => {
    setSearchTerm(item.name);
    onChange(item.name, item);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchTerm("");
    onChange("", undefined);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const activeFocusRing =
    accentColor === "amber"
      ? "focus:ring-amber-500 focus:border-amber-500"
      : "focus:ring-emerald-500 focus:border-emerald-500";

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          required={required}
          value={searchTerm}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsOpen(false);
            } else if (
              e.key === "Enter" &&
              isOpen &&
              filteredSuppliers.length > 0
            ) {
              e.preventDefault();
              handleSelect(filteredSuppliers[0]);
            }
          }}
          className={`w-full pl-3 pr-16 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-1 ${activeFocusRing}`}
        />

        <div className="absolute right-1.5 flex items-center gap-0.5">
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear selection"
              className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
            >
              <X size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            title="Toggle supplier list"
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
          >
            <ChevronDown
              size={14}
              className={`transition-transform duration-150 ${isOpen ? "rotate-180 text-emerald-600" : ""}`}
            />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-72 flex flex-col animate-in fade-in duration-100">
          <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono font-semibold">
            <span>
              {filteredSuppliers.length} supplier
              {filteredSuppliers.length === 1 ? "" : "s"} (sorted A-Z)
            </span>
            {onQuickAdd && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onQuickAdd();
                }}
                className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
              >
                + New Supplier
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((sup) => {
                const isSelected =
                  value.trim().toLowerCase() === sup.name.trim().toLowerCase();
                return (
                  <button
                    key={sup.id}
                    type="button"
                    onClick={() => handleSelect(sup)}
                    className={`w-full text-left px-3 py-2.5 hover:bg-emerald-50/80 transition flex items-start justify-between gap-2 group ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-950 font-bold border-l-4 border-emerald-600"
                        : "text-slate-700"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-slate-900 group-hover:text-emerald-900">
                          {sup.name}
                        </span>
                        {sup.category && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              sup.category.toLowerCase().includes("import")
                                ? "bg-blue-100 text-blue-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {sup.category}
                          </span>
                        )}
                      </div>

                      {(sup.gstin || sup.address || sup.cpName) && (
                        <div className="mt-0.5 text-[11px] text-slate-500 font-mono flex items-center gap-2 flex-wrap">
                          {sup.gstin && (
                            <span className="font-semibold text-slate-700">
                              GST: {sup.gstin}
                            </span>
                          )}
                          {sup.address && (
                            <span
                              className="truncate max-w-[220px] text-slate-500"
                              title={sup.address}
                            >
                              • {sup.address}
                            </span>
                          )}
                          {sup.cpName && (
                            <span className="text-slate-500">
                              • CP: {sup.cpName}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <CheckCircle2
                        size={16}
                        className="text-emerald-600 shrink-0 mt-0.5"
                      />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-500 space-y-2">
                <p>No existing supplier matches &quot;{searchTerm}&quot;.</p>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                  >
                    Use &quot;{searchTerm}&quot;
                  </button>
                  {onQuickAdd && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onQuickAdd();
                      }}
                      className="px-2.5 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
                    >
                      + Save to Master
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export interface PoViewProps {
  activeUserId: string;
  activeUser?: User;
  users: User[];
  poRecords?: PoRecord[];
  suppliers?: SupplierName[];
  // domesticSuppliers?: DomesticSupplierName[];
  aolBranches?: AolBranchName[];
  aolGodowns?: AolGodown[];
  dispatchLocations?: DispatchLocation[];
  warehouses?: WarehouseManagedBy[];
  products?: Product[];
  freightTerms?: FreightTerm[];
  onAddPo: (record: Omit<PoRecord, "id" | "createdAt">) => Promise<boolean>;
  onUpdatePo: (record: PoRecord) => Promise<boolean>;
  onGeneratePdf: (rec: PoRecord, sheetName?: string) => Promise<string | null>;
  onDeletePo: (id: string) => void;
  onAddSupplier?: (data: Omit<SupplierName, "id" | "createdAt">) => void;
  // onAddDomesticSupplier?: (data: Omit<DomesticSupplierName, "id" | "createdAt">) => void;
  onAddProduct?: (data: Omit<Product, "id" | "createdAt">) => void;
  canAdd?: boolean;
  canEdit?: boolean;
  suppliersMaster?: SupplierMasterRecord[];
  onAddSupplierMaster?: (
    data: Omit<SupplierMasterRecord, "id" | "createdAt">,
  ) => void;
  onRefreshPoRecords?: () => Promise<void> | void;
}

export default function PoView({
  activeUserId,
  activeUser: activeUserProp,
  users = [],
  poRecords = [],
  suppliers = [],
  // domesticSuppliers = [],
  aolBranches = [],
  aolGodowns = [],
  dispatchLocations = [],
  warehouses = [],
  products = [],
  freightTerms = [],
  onAddPo,
  onUpdatePo,
  onGeneratePdf,
  onDeletePo,
  onAddSupplier,
  // onAddDomesticSupplier,
  onAddProduct,
  canAdd = true,
  canEdit = true,
  suppliersMaster = [],
  onAddSupplierMaster,
  onRefreshPoRecords,
}: PoViewProps) {
  const activeUser =
    activeUserProp ||
    users.find(
      (u) =>
        u.id.toLowerCase() === activeUserId.toLowerCase() ||
        (u.email && u.email.toLowerCase() === activeUserId.toLowerCase()),
    );

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterProduct, setFilterProduct] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateFilterType, setDateFilterType] = useState<"entry" | "invoice">(
    "invoice",
  ); // "invoice" = PO Date, "entry" = Create/Edit Date
  

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PoRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<PoRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<PoRecord | null>(null);

  // Full Screen Loading Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState("Saving Purchase Order to Google Sheet...");

  // PDF Generation State for PO records
  // const [generatingPdfIds, setGeneratingPdfIds] = useState<{ [id: string]: boolean }>({});
  const [generatingPdfIds, setGeneratingPdfIds] = useState<Record<string, boolean>>({});
  const [localPdfUrls, setLocalPdfUrls] = useState<{ [id: string]: string }>({});

  // Google Sheets Apps Script Integration
  const { config, syncStatus, setSyncStatus, readDataFromSheet } = useAppsScriptSync(
    "purchase_orders_apps_script",
    "PO",
    "purchase_orders",
    undefined,
  );


  // Trigger PDF Generation via Apps Script Web App backend
  // const handleGeneratePdf = async (rec: PoRecord) => {
  //   const recId = rec.id || rec.poNumber;
  //   if (!recId) return;

  //   if (!config.appsScriptUrl || !config.appsScriptUrl.trim()) {
  //     alert("Apps Script Web App URL is not configured. Please configure it in the Google Sheets Sync settings above.");
  //     return;
  //   }

  //   setGeneratingPdfIds((prev) => ({ ...prev, [recId]: true }));

  //   const payload = {
  //     action: "GENERATE",
  //     id: rec.id,
  //     recordId: rec.id || rec.poNumber,
  //     poNumber: rec.poNumber || "",
  //     sheetName: config.sheetName || "PO",
  //     collectionKey: "purchase_orders",
  //     current_user_email: activeUser?.email || "",
  //     current_user_name: activeUser?.name || "System",
  //   };

  //   try {
  //     const response = await fetch(config.appsScriptUrl.trim(), {
  //       method: "POST",
  //       headers: { "Content-Type": "text/plain;charset=utf-8" },
  //       body: JSON.stringify(payload),
  //     });

  //     let resData: any = null;
  //     try {
  //       const text = await response.text();
  //       resData = JSON.parse(text);
  //     } catch {
  //       // response text was not JSON
  //     }

  //     const generatedUrl =
  //       resData?.pdfUrl ||
  //       resData?.pdf_url ||
  //       resData?.url ||
  //       resData?.fileUrl ||
  //       resData?.file_url ||
  //       resData?.data?.["PDF File URLs"] ||
  //       resData?.["PDF File URLs"] ||
  //       resData?.poPdfUrl;

  //     if (generatedUrl && typeof generatedUrl === "string") {
  //       setLocalPdfUrls((prev) => ({ ...prev, [recId]: generatedUrl }));
  //       try {
  //         await onUpdatePo({ ...rec, poPdfUrl: generatedUrl });
  //       } catch {
  //         // ignore
  //       }
  //     }

  //     // Refresh records from sheet / backend
  //     if (onRefreshPoRecords) {
  //       await onRefreshPoRecords();
  //     } else if (readDataFromSheet) {
  //       await readDataFromSheet();
  //     }
  //   } catch (err: any) {
  //     console.error("PDF generation request failed:", err);
  //     // Wait briefly then attempt refresh in case Apps Script redirect finished in backend
  //     setTimeout(() => {
  //       if (onRefreshPoRecords) {
  //         onRefreshPoRecords();
  //       } else if (readDataFromSheet) {
  //         readDataFromSheet();
  //       }
  //     }, 3500);
  //   } finally {
  //     setGeneratingPdfIds((prev) => {
  //       const next = { ...prev };
  //       delete next[recId];
  //       return next;
  //     });
  //   }
  // };

  // Unified supplier master list with full details, sorted alphabetically
  const sortedSuppliersMaster = useMemo<SupplierOptionItem[]>(() => {
    const list: SupplierOptionItem[] = [];
    const seen = new Set<string>();

    // 1. First add from suppliersMaster (highest priority, has full GST, address, CP info)
    suppliersMaster.forEach((s) => {
      const name = (s.supplierName || (s as any).name || "").trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        list.push({
          id: s.id,
          name: name,
          gstin: (s.supplierGst || (s as any).gstin || "").trim(),
          address: (s.supplierAddress || (s as any).address || "").trim(),
          cpName: (s.contactPersonName || (s as any).cpName || "").trim(),
          cpPhone: (s.contactPersonPhone || (s as any).cpNumber || "").trim(),
          cpEmail: (s.contactPersonEmail || (s as any).cpEmailId || "").trim(),
          category: s.importDomestic || "Domestic",
        });
      }
    });

    // 2. Add any from domesticSuppliers not already present
    // domesticSuppliers.forEach((s) => {
    //   const name = (s?.name || "").trim();
    //   if (name && !seen.has(name.toLowerCase())) {
    //     seen.add(name.toLowerCase());
    //     list.push({
    //       id: s.id || `dom-${name}`,
    //       name: name,
    //       gstin: "",
    //       address: "",
    //       category: "Domestic",
    //     });
    //   }
    // });

    // 3. Add any from legacy suppliers not already present
    suppliers.forEach((s) => {
      const name = (s?.name || "").trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        list.push({
          id: s.id || `sup-${name}`,
          name: name,
          gstin: "",
          address: "",
          category: "Supplier",
        });
      }
    });

    return list.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
  }, [suppliersMaster, suppliers]);

  const allSupplierNames = useMemo(() => {
    return sortedSuppliersMaster.map((s) => s.name);
  }, [sortedSuppliersMaster]);

  // Make dropdowns for The Billing and Delivery Locations
  const allDeliveryLocations = useMemo(() => {
    const set = new Set<string>();
    aolGodowns.forEach((g) => g?.name && set.add(g.name.trim()));
    // dispatchLocations.forEach((d) => d?.name && set.add(d.name.trim()));
    // warehouses.forEach((w) => w?.name && set.add(w.name.trim()));
    // aolBranches.forEach((b) => b?.name && set.add(b.name.trim()));
    return Array.from(set).sort();
  }, [aolGodowns]);

  const allBillingLocations = allDeliveryLocations;

  const allProductNames = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p?.name && set.add(p.name.trim()));
    return Array.from(set).sort();
  }, [products]);

  const allDeliveryTerms = useMemo(() => {
    const set = new Set<string>([
      "FOR Destination",
      "Ex-Works",
      "CIF",
      "FOB",
      "Door Delivery",
      "To Pay",
    ]);
    freightTerms.forEach((f) => f?.name && set.add(f.name.trim()));
    return Array.from(set).sort();
  }, [freightTerms]);

  // Form Fields State for Create Modal
  const [formPoDate, setFormPoDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  // const [formPoNumber, setFormPoNumber] = useState("");
  const [formSupplierName, setFormSupplierName] = useState("");
  const [formSupplierGstin, setFormSupplierGstin] = useState("");
  const [formSupplierAddress, setFormSupplierAddress] = useState("");
  const [formCreateEditDate, setFormCreateEditDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [formCpName, setFormCpName] = useState("");
  const [formCpNumber, setFormCpNumber] = useState("");
  const [formCpEmailId, setFormCpEmailId] = useState("");

  // Handler for selecting Checked By in Create PO modal with auto-population
  const handleCheckedByForCreate = (selecteduser: string) => {
    setFormCheckedBy(selecteduser);

    // Find matching location details from master list
    const found = users.find(
      (u) => u.name.trim().toLowerCase() === selecteduser.trim().toLowerCase(),
    );

    if (found) {
      // Sync Ship To GSTIN and Address directly
      setFormSpName(found.name || "");
      setFormSpEmailId(found.email || "");
      setFormSpPhoneNumber(found.phone || "");
    } else {
      // Clear fields if default "-- Select --" or an unmatched location is chosen
      setFormSpName("");
      setFormSpEmailId("");
      setFormSpPhoneNumber("");
    }
  };

  // Handler for selecting Checked By in Edit PO modal with auto-population
  const handleCheckedByForedit = (selecteduser: string) => {
    if (!editingRecord) return;

    const found = users.find(
      (u) => u.name.trim().toLowerCase() === selecteduser.trim().toLowerCase(),
    );

    setEditingRecord({
      ...editingRecord,
      checkedBy: selecteduser,
      spName: found?.name ?? "",
      spEmailId: found?.email ?? "",
      spPhoneNumber: found?.phone ?? "",
    });
  };


  // Handler for selecting Delivery Location in Create PO modal with auto-population
  const handleSelectDeliveryLocation = (selectedLocation: string) => {
    setFormDeliveryLocation(selectedLocation);

    // Find matching location details from master list
    const found = aolGodowns.find(
      (loc) =>
        loc.name.trim().toLowerCase() === selectedLocation.trim().toLowerCase(),
    );

    if (found) {
      // Sync Ship To GSTIN and Address directly
      setFormShipToGst(found.gstin || "");
      setFormShipToAddress(found.address || "");
    } else {
      // Clear fields if default "-- Select --" or an unmatched location is chosen
      setFormShipToGst("");
      setFormShipToAddress("");
    }
  };

  // Handle for Selecting Delivery Location in Edit PO Model with Auto-population
  const handleSelectDeliveryLocationForEdit = (selectedLocation: string) => {
    if (!editingRecord) return;

    const found = aolGodowns.find(
      (loc) =>
        loc.name.trim().toLowerCase() === selectedLocation.trim().toLowerCase(),
    );

    setEditingRecord({
      ...editingRecord,
      deliveryLocation: selectedLocation,
      shipToGst: found?.gstin ?? "",
      shipToAddress: found?.address ?? "",
    });
  };

  // Handler for selecting Billing Location in Create PO modal with auto-population
  const handleSelectBillingLocation = (selectedLocation: string) => {
    setFormBillingLocation(selectedLocation);

    // Find matching location details from master list
    const found = aolGodowns.find(
      (loc) =>
        loc.name.trim().toLowerCase() === selectedLocation.trim().toLowerCase(),
    );

    if (found) {
      // Sync Ship To GSTIN and Address directly
      setFormBillToGst(found.gstin || "");
      setFormBillToAddress(found.address || "");
    } else {
      // Clear fields if default "-- Select --" or an unmatched location is chosen
      setFormBillToGst("");
      setFormBillToAddress("");
    }
  };

  // Handle for Selecting Billing Location in Edit PO Model with Auto-population
  const handleSelectBillingLocationForEdit = (selectedLocation: string) => {
    if (!editingRecord) return;

    const found = aolGodowns.find(
      (loc) =>
        loc.name.trim().toLowerCase() === selectedLocation.trim().toLowerCase(),
    );

    setEditingRecord({
      ...editingRecord,
      billingLocation: selectedLocation,
      billToGst: found?.gstin ?? "",
      billToAddress: found?.address ?? "",
    });
  };

  // Handler for selecting supplier in Create PO modal with auto-population
  const handleSelectSupplierForCreate = (
    selectedName: string,
    matched?: SupplierOptionItem,
  ) => {
    setFormSupplierName(selectedName);

    const found =
      matched ||
      sortedSuppliersMaster.find(
        (s) =>
          s.name.trim().toLowerCase() === selectedName.trim().toLowerCase(),
      );

    if (found) {
      // Always update or reset values based on the newly selected supplier
      setFormSupplierGstin(found.gstin || "");
      setFormSupplierAddress(found.address || "");
      setFormCpName(found.cpName || "");
      setFormCpNumber(found.cpPhone || "");
      setFormCpEmailId(found.cpEmail || "");
    } else {
      // Optional: Clear form fields if no matching supplier is found
      setFormSupplierGstin("");
      setFormSupplierAddress("");
      setFormCpName("");
      setFormCpNumber("");
      setFormCpEmailId("");
    }
  };

  // Handler for selecting supplier in Edit PO modal with auto-population
  const handleSelectSupplierForEdit = (
    selectedName: string,
    matched?: SupplierOptionItem,
  ) => {
    if (!editingRecord) return;

    const found =
      matched ||
      sortedSuppliersMaster.find(
        (s) =>
          s.name.trim().toLowerCase() === selectedName.trim().toLowerCase(),
      );

    setEditingRecord({
      ...editingRecord,
      supplierName: selectedName,
      // Overwrite fields directly with new supplier data (or fallback to empty string / previous value)
      supplierGstin: found?.gstin ?? "",
      supplierAddress: found?.address ?? "",
      cpName: found?.cpName ?? "",
      cpNumber: found?.cpPhone ?? "",
      cpEmailId: found?.cpEmail ?? "",
    });
  };

  const [formDeliveryLocation, setFormDeliveryLocation] = useState(
    allDeliveryLocations[0] || "",
  );
  const [formBillingLocation, setFormBillingLocation] = useState(
    allBillingLocations[0] || "",
  );
  const [formShipToAddress, setFormShipToAddress] = useState("");
  const [formBillToAddress, setFormBillToAddress] = useState("");
  const [formShipToGst, setFormShipToGst] = useState("");
  const [formBillToGst, setFormBillToGst] = useState("");
  const [formPreparedBy, setFormPreparedBy] = useState(
    activeUser?.name || users[0]?.name || "",
  );
  const [formCheckedBy, setFormCheckedBy] = useState("");
  const [formSpName, setFormSpName] = useState("");
  const [formSpPhoneNumber, setFormSpPhoneNumber] = useState("");
  const [formSpEmailId, setFormSpEmailId] = useState("");
  const [formPaymentTerms, setFormPaymentTerms] = useState(
    "Immediate on delivery",
  );
  const [formDeliveryTerms, setFormDeliveryTerms] = useState("");
  const [formOtherTerms, setFormOtherTerms] = useState(
    "Standard Warranty & Commercial Terms Apply",
  );
  const [formCurrency, setFormCurrency] = useState("INR");

  // Dynamic products list for Create Modal (up to 7 products)
  const [formProducts, setFormProducts] = useState<
    Array<{
      productDescription: string;
      packingKgs: string;
      packs: string;
      totalQty: string;
      rate: string;
      amount: number;
    }>
  >([
    {
      productDescription: allProductNames[0] || "",
      packingKgs: "",
      packs: "",
      totalQty: "",
      rate: "",
      amount: 0,
    },
  ]);

  // Dynamic products list for Edit Modal (up to 7 products)
  const [editProducts, setEditProducts] = useState<
    Array<{
      productDescription: string;
      packingKgs: string;
      packs: string;
      totalQty: string;
      rate: string;
      amount: number;
    }>
  >([]);

  const [formSubTotal, setFormSubTotal] = useState(0);
  const [formGstPercent, setFormGstPercent] = useState<string>("18");
  const [formGst, setFormGst] = useState(0);
  const [formTotalInNum, setFormTotalInNum] = useState(0);
  const [formTotalInWord, setFormTotalInWord] = useState("");

  // Auto-generate PO Number Helper
  // const generateNextPoNumber = () => {
  //   const year = new Date().getFullYear();
  //   const count = (poRecords.length + 1).toString().padStart(4, "0");
  //   return `PO-${year}-${count}`;
  // };

  // Recalculate create form values from products array
  const recalcCreateTotals = (
    productsList: Array<{ amount: number }>,
    gstPercentStr: string,
    curr: string,
  ) => {
    const subTotal = Number(
      productsList.reduce((acc, p) => acc + (p.amount || 0), 0).toFixed(2),
    );
    const isInr = (curr || "INR").toUpperCase() === "INR";
    let gst = 0;
    let totalInNum = subTotal;

    if (isInr) {
      const gstPercent = parseFloat(gstPercentStr) || 0;
      gst = Number(((subTotal * gstPercent) / 100).toFixed(2));
      totalInNum = Number((subTotal + gst).toFixed(2));
    } else {
      gst = 0;
      totalInNum = subTotal;
    }

    const totalInWord = formatAmountInWords(totalInNum, curr);

    setFormSubTotal(subTotal);
    setFormGst(gst);
    setFormTotalInNum(totalInNum);
    setFormTotalInWord(totalInWord);
  };

  // Open Create Modal and Reset
  const handleOpenCreate = () => {
    const today = new Date().toISOString().split("T")[0];
    setFormPoDate(today);
    // setFormPoNumber(generateNextPoNumber());
    setFormSupplierName("");
    setFormSupplierGstin("");
    setFormSupplierAddress("");
    setFormCreateEditDate(today);
    setFormCpName("");
    setFormCpNumber("");
    setFormCpEmailId("");
    setFormDeliveryLocation(allDeliveryLocations[0] || "");
    setFormBillingLocation(allBillingLocations[0] || "");
    setFormShipToAddress("");
    setFormBillToAddress("");
    setFormShipToGst("");
    setFormBillToGst("");
    setFormPreparedBy(activeUser?.name || users[0]?.name || "");
    setFormCheckedBy("");
    setFormSpName("");
    setFormSpPhoneNumber("");
    setFormSpEmailId("");
    setFormPaymentTerms("");
    setFormDeliveryTerms("");
    setFormOtherTerms("");
    setFormCurrency("INR");
    setFormProducts([
      {
        productDescription: allProductNames[0] || "",
        packingKgs: "",
        packs: "",
        totalQty: "",
        rate: "",
        amount: 0,
      },
    ]);
    setFormSubTotal(0);
    setFormGstPercent("18");
    setFormGst(0);
    setFormTotalInNum(0);
    setFormTotalInWord("");
    setIsCreateModalOpen(true);
  };

  // Add Product to Create Form (Max 7)
  const handleAddCreateProduct = () => {
    if (formProducts.length >= 7) {
      alert("A maximum of 7 products can be added to a single Purchase Order.");
      return;
    }
    const updated = [
      ...formProducts,
      {
        productDescription: allProductNames[0] || "",
        packingKgs: "",
        packs: "",
        totalQty: "",
        rate: "",
        amount: 0,
      },
    ];
    setFormProducts(updated);
    recalcCreateTotals(updated, formGstPercent, formCurrency);
  };

  // Remove Product from Create Form
  const handleRemoveCreateProduct = (index: number) => {
    if (formProducts.length <= 1) {
      alert("A Purchase Order must contain at least one product.");
      return;
    }
    const updated = formProducts.filter((_, i) => i !== index);
    setFormProducts(updated);
    recalcCreateTotals(updated, formGstPercent, formCurrency);
  };

  // Update a single product field in Create Form
  const handleCreateProductChange = (
    index: number,
    field: "productDescription" | "packingKgs" | "packs" | "totalQty" | "rate",
    value: string,
  ) => {
    const updated = [...formProducts];
    const current = { ...updated[index], [field]: value };

    // Auto-calculate totalQty if packs or packingKgs changed
    if (field === "packs" || field === "packingKgs") {
      const p = parseFloat(field === "packs" ? value : current.packs) || 0;
      const k =
        parseFloat(field === "packingKgs" ? value : current.packingKgs) || 0;
      if (p > 0 && k > 0) {
        current.totalQty = (p * k).toString();
      }
    }

    const qty = parseFloat(current.totalQty) || 0;
    const rate = parseFloat(current.rate) || 0;
    current.amount = Number((qty * rate).toFixed(2));

    updated[index] = current;
    setFormProducts(updated);
    recalcCreateTotals(updated, formGstPercent, formCurrency);
  };

  // Open Edit Modal with initialized products (1 to 7)
  const handleOpenEdit = (rec: PoRecord) => {
    const items: Array<{
      productDescription: string;
      packingKgs: string;
      packs: string;
      totalQty: string;
      rate: string;
      amount: number;
    }> = [];

    for (let i = 1; i <= 7; i++) {
      const desc = (rec as any)[`productDescription${i}`];
      const packing = (rec as any)[`packingKgs${i}`];
      const packs = (rec as any)[`packs${i}`];
      const qty = (rec as any)[`totalQty${i}`];
      const rate = (rec as any)[`rate${i}`];
      const amt = (rec as any)[`amount${i}`];

      if (desc || qty || amt || packs || i === 1) {
        if (desc || qty || amt || i === 1) {
          items.push({
            productDescription:
              desc || (i === 1 ? rec.productDescription1 : "") || "",
            packingKgs: packing || (i === 1 ? rec.packingKgs1 : "") || "",
            packs:
              packs !== undefined && packs !== null && packs !== ""
                ? String(packs)
                : i === 1 && rec.packs1
                  ? String(rec.packs1)
                  : "",
            totalQty:
              qty !== undefined && qty !== null && qty !== ""
                ? String(qty)
                : i === 1 && rec.totalQty1
                  ? String(rec.totalQty1)
                  : "",
            rate:
              rate !== undefined && rate !== null && rate !== ""
                ? String(rate)
                : i === 1 && rec.rate1
                  ? String(rec.rate1)
                  : "",
            amount:
              Number(amt !== undefined ? amt : i === 1 ? rec.amount1 : 0) || 0,
          });
        }
      }
    }

    setEditProducts(
      items.length > 0
        ? items
        : [
            {
              productDescription: rec.productDescription1 || "",
              packingKgs: rec.packingKgs1 || "",
              packs: rec.packs1 ? String(rec.packs1) : "",
              totalQty: rec.totalQty1 ? String(rec.totalQty1) : "",
              rate: rec.rate1 ? String(rec.rate1) : "",
              amount: rec.amount1 || 0,
            },
          ],
    );
    setEditingRecord({ ...rec });
  };

  // Add Product in Edit Modal (Max 7)
  const handleAddEditProduct = () => {
    if (editProducts.length >= 7) {
      alert("A maximum of 7 products can be added to a single Purchase Order.");
      return;
    }
    const updated = [
      ...editProducts,
      {
        productDescription: allProductNames[0] || "",
        packingKgs: "",
        packs: "",
        totalQty: "",
        rate: "",
        amount: 0,
      },
    ];
    setEditProducts(updated);
    if (editingRecord) {
      const isInr = (editingRecord.currency || "INR").toUpperCase() === "INR";
      const newSubTotal = Number(
        updated.reduce((acc, p) => acc + (p.amount || 0), 0).toFixed(2),
      );
      const gstAmt = isInr
        ? parseFloat(String(editingRecord.gst || 0)) || 0
        : 0;
      const newTotal = isInr
        ? Number((newSubTotal + gstAmt).toFixed(2))
        : newSubTotal;
      setEditingRecord({
        ...editingRecord,
        subTotal: newSubTotal,
        gst: gstAmt,
        totalInNum: newTotal,
        totalInWord: formatAmountInWords(
          newTotal,
          editingRecord.currency || "INR",
        ),
      });
    }
  };

  // Remove Product in Edit Modal
  const handleRemoveEditProduct = (index: number) => {
    if (editProducts.length <= 1) {
      alert("A Purchase Order must contain at least one product.");
      return;
    }
    const updated = editProducts.filter((_, i) => i !== index);
    setEditProducts(updated);
    if (editingRecord) {
      const isInr = (editingRecord.currency || "INR").toUpperCase() === "INR";
      const newSubTotal = Number(
        updated.reduce((acc, p) => acc + (p.amount || 0), 0).toFixed(2),
      );
      const gstAmt = isInr
        ? parseFloat(String(editingRecord.gst || 0)) || 0
        : 0;
      const newTotal = isInr
        ? Number((newSubTotal + gstAmt).toFixed(2))
        : newSubTotal;
      setEditingRecord({
        ...editingRecord,
        subTotal: newSubTotal,
        gst: gstAmt,
        totalInNum: newTotal,
        totalInWord: formatAmountInWords(
          newTotal,
          editingRecord.currency || "INR",
        ),
      });
    }
  };

  // Update Product Field in Edit Modal
  const handleEditProductChange = (
    index: number,
    field: "productDescription" | "packingKgs" | "packs" | "totalQty" | "rate",
    value: string,
  ) => {
    const updated = [...editProducts];
    const current = { ...updated[index], [field]: value };

    if (field === "packs" || field === "packingKgs") {
      const p = parseFloat(field === "packs" ? value : current.packs) || 0;
      const k =
        parseFloat(field === "packingKgs" ? value : current.packingKgs) || 0;
      if (p > 0 && k > 0) {
        current.totalQty = (p * k).toString();
      }
    }

    const qty = parseFloat(current.totalQty) || 0;
    const rate = parseFloat(current.rate) || 0;
    current.amount = Number((qty * rate).toFixed(2));

    updated[index] = current;
    setEditProducts(updated);

    if (editingRecord) {
      const isInr = (editingRecord.currency || "INR").toUpperCase() === "INR";
      const newSubTotal = Number(
        updated.reduce((acc, p) => acc + (p.amount || 0), 0).toFixed(2),
      );
      const gstAmt = isInr
        ? parseFloat(String(editingRecord.gst || 0)) || 0
        : 0;
      const newTotal = isInr
        ? Number((newSubTotal + gstAmt).toFixed(2))
        : newSubTotal;
      setEditingRecord({
        ...editingRecord,
        subTotal: newSubTotal,
        gst: gstAmt,
        totalInNum: newTotal,
        totalInWord: formatAmountInWords(
          newTotal,
          editingRecord.currency || "INR",
        ),
      });
    }
  };

  // Submit Create PO
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSupplierName.trim()) {
      alert("Please select or enter a Supplier Name.");
      return;
    }
    if (!formProducts[0] || !formProducts[0].productDescription.trim()) {
      alert("Please select or enter Product Description 1.");
      return;
    }

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    const newRecord: Omit<PoRecord, "id" | "createdAt"> = {
      poDate: formPoDate || today,
      poNumber: "PO-0",
      supplierName: formSupplierName.trim(),
      supplierGstin: formSupplierGstin.trim(),
      supplierAddress: formSupplierAddress.trim(),
      createEditDate: formCreateEditDate || today,
      cpName: formCpName.trim(),
      cpNumber: formCpNumber.trim(),
      cpEmailId: formCpEmailId.trim(),
      deliveryLocation: formDeliveryLocation.trim(),
      billingLocation: formBillingLocation.trim(),
      shipToAddress: formShipToAddress.trim(),
      billToAddress: formBillToAddress.trim(),
      shipToGst: formShipToGst.trim(),
      billToGst: formBillToGst.trim(),
      preparedBy: formPreparedBy.trim() || activeUser?.name || "System",
      checkedBy: formCheckedBy.trim(),
      spName: formSpName.trim(),
      spPhoneNumber: formSpPhoneNumber.trim(),
      spEmailId: formSpEmailId.trim(),
      paymentTerms: formPaymentTerms.trim(),
      deliveryTerms: formDeliveryTerms.trim(),
      otherTerms: formOtherTerms.trim(),
      currency: formCurrency || "INR",
      subTotal: formSubTotal,
      gst: (formCurrency || "INR").toUpperCase() === "INR" ? formGst : 0,
      totalInNum:
        (formCurrency || "INR").toUpperCase() === "INR"
          ? formTotalInNum
          : formSubTotal,
      totalInWord:
        formTotalInWord ||
        formatAmountInWords(
          (formCurrency || "INR").toUpperCase() === "INR"
            ? formTotalInNum
            : formSubTotal,
          formCurrency,
        ),

      // Product 1 (Primary - always filled)
      productDescription1: formProducts[0]?.productDescription.trim() || "",
      packingKgs1: formProducts[0]?.packingKgs.trim() || "",
      packs1: parseFloat(formProducts[0]?.packs) || 0,
      totalQty1: parseFloat(formProducts[0]?.totalQty) || 0,
      rate1: parseFloat(formProducts[0]?.rate) || 0,
      amount1: formProducts[0]?.amount || 0,

      // Product 2
      productDescription2: formProducts[1]?.productDescription?.trim() || "",
      packingKgs2: formProducts[1]?.packingKgs?.trim() || "",
      packs2:
        formProducts[1] && formProducts[1].packs !== ""
          ? parseFloat(formProducts[1].packs) || 0
          : undefined,
      totalQty2:
        formProducts[1] && formProducts[1].totalQty !== ""
          ? parseFloat(formProducts[1].totalQty) || 0
          : undefined,
      rate2:
        formProducts[1] && formProducts[1].rate !== ""
          ? parseFloat(formProducts[1].rate) || 0
          : undefined,
      amount2: formProducts[1] ? formProducts[1].amount || 0 : undefined,

      // Product 3
      productDescription3: formProducts[2]?.productDescription?.trim() || "",
      packingKgs3: formProducts[2]?.packingKgs?.trim() || "",
      packs3:
        formProducts[2] && formProducts[2].packs !== ""
          ? parseFloat(formProducts[2].packs) || 0
          : undefined,
      totalQty3:
        formProducts[2] && formProducts[2].totalQty !== ""
          ? parseFloat(formProducts[2].totalQty) || 0
          : undefined,
      rate3:
        formProducts[2] && formProducts[2].rate !== ""
          ? parseFloat(formProducts[2].rate) || 0
          : undefined,
      amount3: formProducts[2] ? formProducts[2].amount || 0 : undefined,

      // Product 4
      productDescription4: formProducts[3]?.productDescription?.trim() || "",
      packingKgs4: formProducts[3]?.packingKgs?.trim() || "",
      packs4:
        formProducts[3] && formProducts[3].packs !== ""
          ? parseFloat(formProducts[3].packs) || 0
          : undefined,
      totalQty4:
        formProducts[3] && formProducts[3].totalQty !== ""
          ? parseFloat(formProducts[3].totalQty) || 0
          : undefined,
      rate4:
        formProducts[3] && formProducts[3].rate !== ""
          ? parseFloat(formProducts[3].rate) || 0
          : undefined,
      amount4: formProducts[3] ? formProducts[3].amount || 0 : undefined,

      // Product 5
      productDescription5: formProducts[4]?.productDescription?.trim() || "",
      packingKgs5: formProducts[4]?.packingKgs?.trim() || "",
      packs5:
        formProducts[4] && formProducts[4].packs !== ""
          ? parseFloat(formProducts[4].packs) || 0
          : undefined,
      totalQty5:
        formProducts[4] && formProducts[4].totalQty !== ""
          ? parseFloat(formProducts[4].totalQty) || 0
          : undefined,
      rate5:
        formProducts[4] && formProducts[4].rate !== ""
          ? parseFloat(formProducts[4].rate) || 0
          : undefined,
      amount5: formProducts[4] ? formProducts[4].amount || 0 : undefined,

      // Product 6
      productDescription6: formProducts[5]?.productDescription?.trim() || "",
      packingKgs6: formProducts[5]?.packingKgs?.trim() || "",
      packs6:
        formProducts[5] && formProducts[5].packs !== ""
          ? parseFloat(formProducts[5].packs) || 0
          : undefined,
      totalQty6:
        formProducts[5] && formProducts[5].totalQty !== ""
          ? parseFloat(formProducts[5].totalQty) || 0
          : undefined,
      rate6:
        formProducts[5] && formProducts[5].rate !== ""
          ? parseFloat(formProducts[5].rate) || 0
          : undefined,
      amount6: formProducts[5] ? formProducts[5].amount || 0 : undefined,

      // Product 7
      productDescription7: formProducts[6]?.productDescription?.trim() || "",
      packingKgs7: formProducts[6]?.packingKgs?.trim() || "",
      packs7:
        formProducts[6] && formProducts[6].packs !== ""
          ? parseFloat(formProducts[6].packs) || 0
          : undefined,
      totalQty7:
        formProducts[6] && formProducts[6].totalQty !== ""
          ? parseFloat(formProducts[6].totalQty) || 0
          : undefined,
      rate7:
        formProducts[6] && formProducts[6].rate !== ""
          ? parseFloat(formProducts[6].rate) || 0
          : undefined,
      amount7: formProducts[6] ? formProducts[6].amount || 0 : undefined,

      createdBy: activeUser?.name || "System",
      editBy: "",
      editTimestamp: "",
      createdByUserId: activeUserId,
    };

    // Turn on Full-Screen Loader & Disable UI interactions
    setLoaderMessage("Saving Purchase Order to Google Sheet...");
    setIsSubmitting(true);

    try {
      const success = await onAddPo(newRecord);
      if (success) {
        setIsCreateModalOpen(false); // Close modal only on success
      }
    } catch (err: any) {
      alert(`An unexpected error occurred: ${err?.message || err}`);
    } finally {
      // Remove loading overlay regardless of success or failure
      setIsSubmitting(false);
    }

    // onAddPo(newRecord);
    // setIsCreateModalOpen(false);
  };


  // Submit Edit PO
const handleSaveEdit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingRecord) return;

  const now = new Date();
  const editTimestamp = `${now.toISOString().split("T")[0]} ${now.toTimeString().split(" ")[0]}`;
  const today = now.toISOString().split("T")[0];

  const isInr = (editingRecord.currency || "INR").toUpperCase() === "INR";
  const subTotal = Number(
    editProducts.reduce((acc, p) => acc + (p.amount || 0), 0).toFixed(2),
  );
  const gst = isInr ? parseFloat(String(editingRecord.gst || 0)) || 0 : 0;
  const totalInNum = isInr ? Number((subTotal + gst).toFixed(2)) : subTotal;
  const totalInWord = formatAmountInWords(
    totalInNum,
    editingRecord.currency || "INR",
  );

  // Helper function: Safely converts any value (number, undefined, null) to a string before trimming
  const safeString = (val: any) => String(val ?? "").trim();

  const updatedRec: PoRecord = {
    ...editingRecord,
    subTotal,
    gst,
    totalInNum,
    totalInWord,
    createEditDate: today,
    editBy: activeUser?.name || "System",
    editTimestamp: editTimestamp,
    poPdfUrl: "", // Reset PDF URL so the row changes back to "Generate PDF" after editing

    // Product 1
    productDescription1: safeString(editProducts[0]?.productDescription),
    packingKgs1: safeString(editProducts[0]?.packingKgs),
    packs1: parseFloat(String(editProducts[0]?.packs)) || 0,
    totalQty1: parseFloat(String(editProducts[0]?.totalQty)) || 0,
    rate1: parseFloat(String(editProducts[0]?.rate)) || 0,
    amount1: editProducts[0]?.amount || 0,

    // Product 2
    productDescription2: safeString(editProducts[1]?.productDescription),
    packingKgs2: safeString(editProducts[1]?.packingKgs),
    packs2:
      editProducts[1] && editProducts[1].packs !== "" && editProducts[1].packs !== undefined
        ? parseFloat(String(editProducts[1].packs)) || 0
        : undefined,
    totalQty2:
      editProducts[1] && editProducts[1].totalQty !== "" && editProducts[1].totalQty !== undefined
        ? parseFloat(String(editProducts[1].totalQty)) || 0
        : undefined,
    rate2:
      editProducts[1] && editProducts[1].rate !== "" && editProducts[1].rate !== undefined
        ? parseFloat(String(editProducts[1].rate)) || 0
        : undefined,
    amount2: editProducts[1] ? editProducts[1].amount || 0 : undefined,

    // Product 3
    productDescription3: safeString(editProducts[2]?.productDescription),
    packingKgs3: safeString(editProducts[2]?.packingKgs),
    packs3:
      editProducts[2] && editProducts[2].packs !== "" && editProducts[2].packs !== undefined
        ? parseFloat(String(editProducts[2].packs)) || 0
        : undefined,
    totalQty3:
      editProducts[2] && editProducts[2].totalQty !== "" && editProducts[2].totalQty !== undefined
        ? parseFloat(String(editProducts[2].totalQty)) || 0
        : undefined,
    rate3:
      editProducts[2] && editProducts[2].rate !== "" && editProducts[2].rate !== undefined
        ? parseFloat(String(editProducts[2].rate)) || 0
        : undefined,
    amount3: editProducts[2] ? editProducts[2].amount || 0 : undefined,

    // Product 4
    productDescription4: safeString(editProducts[3]?.productDescription),
    packingKgs4: safeString(editProducts[3]?.packingKgs),
    packs4:
      editProducts[3] && editProducts[3].packs !== "" && editProducts[3].packs !== undefined
        ? parseFloat(String(editProducts[3].packs)) || 0
        : undefined,
    totalQty4:
      editProducts[3] && editProducts[3].totalQty !== "" && editProducts[3].totalQty !== undefined
        ? parseFloat(String(editProducts[3].totalQty)) || 0
        : undefined,
    rate4:
      editProducts[3] && editProducts[3].rate !== "" && editProducts[3].rate !== undefined
        ? parseFloat(String(editProducts[3].rate)) || 0
        : undefined,
    amount4: editProducts[3] ? editProducts[3].amount || 0 : undefined,

    // Product 5
    productDescription5: safeString(editProducts[4]?.productDescription),
    packingKgs5: safeString(editProducts[4]?.packingKgs),
    packs5:
      editProducts[4] && editProducts[4].packs !== "" && editProducts[4].packs !== undefined
        ? parseFloat(String(editProducts[4].packs)) || 0
        : undefined,
    totalQty5:
      editProducts[4] && editProducts[4].totalQty !== "" && editProducts[4].totalQty !== undefined
        ? parseFloat(String(editProducts[4].totalQty)) || 0
        : undefined,
    rate5:
      editProducts[4] && editProducts[4].rate !== "" && editProducts[4].rate !== undefined
        ? parseFloat(String(editProducts[4].rate)) || 0
        : undefined,
    amount5: editProducts[4] ? editProducts[4].amount || 0 : undefined,

    // Product 6
    productDescription6: safeString(editProducts[5]?.productDescription),
    packingKgs6: safeString(editProducts[5]?.packingKgs),
    packs6:
      editProducts[5] && editProducts[5].packs !== "" && editProducts[5].packs !== undefined
        ? parseFloat(String(editProducts[5].packs)) || 0
        : undefined,
    totalQty6:
      editProducts[5] && editProducts[5].totalQty !== "" && editProducts[5].totalQty !== undefined
        ? parseFloat(String(editProducts[5].totalQty)) || 0
        : undefined,
    rate6:
      editProducts[5] && editProducts[5].rate !== "" && editProducts[5].rate !== undefined
        ? parseFloat(String(editProducts[5].rate)) || 0
        : undefined,
    amount6: editProducts[5] ? editProducts[5].amount || 0 : undefined,

    // Product 7
    productDescription7: safeString(editProducts[6]?.productDescription),
    packingKgs7: safeString(editProducts[6]?.packingKgs),
    packs7:
      editProducts[6] && editProducts[6].packs !== "" && editProducts[6].packs !== undefined
        ? parseFloat(String(editProducts[6].packs)) || 0
        : undefined,
    totalQty7:
      editProducts[6] && editProducts[6].totalQty !== "" && editProducts[6].totalQty !== undefined
        ? parseFloat(String(editProducts[6].totalQty)) || 0
        : undefined,
    rate7:
      editProducts[6] && editProducts[6].rate !== "" && editProducts[6].rate !== undefined
        ? parseFloat(String(editProducts[6].rate)) || 0
        : undefined,
    amount7: editProducts[6] ? editProducts[6].amount || 0 : undefined,
  };

  // Turn on Full-Screen Loader & Disable UI interactions
  setLoaderMessage("Updating Purchase Order in Google Sheet...");
  setIsSubmitting(true);

  try {
    const success = await onUpdatePo(updatedRec);
    if (success) {
      // Clear generated PDF URL for this record from local cache so the row displays "Generate PDF"
      const recKey = updatedRec.id || updatedRec.poNumber;
      setLocalPdfUrls((prev) => {
        const next = { ...prev };
        if (recKey) delete next[recKey];
        if (updatedRec.id) delete next[updatedRec.id];
        if (updatedRec.poNumber) delete next[updatedRec.poNumber];
        return next;
      });

      // Keep viewingRecord in sync if the view details modal is open
      setViewingRecord((prev) => {
        if (
          prev &&
          (prev.id === updatedRec.id ||
            (prev.poNumber && prev.poNumber === updatedRec.poNumber))
        ) {
          return {
            ...updatedRec,
            poPdfUrl: "",
          };
        }
        return prev;
      });

      setEditingRecord(null); // Close edit modal only after successful network operation
    }
  } catch (err: any) {
    alert(`An unexpected error occurred while saving: ${err?.message || err}`);
  } finally {
    // Hide full-screen loader regardless of outcome
    setIsSubmitting(false);
  }
};

const handleGeneratePdfClick = async (rec: PoRecord) => {
    const recId = rec.id || rec.poNumber;
    if (!recId) return;

    setGeneratingPdfIds((prev) => ({ ...prev, [recId]: true }));
    // Turn on Full-Screen Loader & Disable UI interactions
    setLoaderMessage("Generating PO PDF file, it may take upto 5 mins Kindly wait...");
    setIsSubmitting(true);
    
    try {
      // Delegate completely to App.tsx / Central Service with explicit record and configured sheetName
      const pdfUrl = await onGeneratePdf(rec, config.sheetName || "PO");
      if (pdfUrl && typeof pdfUrl === "string") {
        setLocalPdfUrls((prev) => ({ ...prev, [recId]: pdfUrl }));
      }
    } catch (err: any) {
      alert(`An unexpected error occurred while generating PDF: ${err?.message || err}`);
    } finally {
      setGeneratingPdfIds((prev) => {
        const next = { ...prev };
        delete next[recId];
        return next; 
      });
      setIsSubmitting(false);
    }
  };

  // Submit Edit PO
  // const handleSaveEdit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!editingRecord) return;

  //   const now = new Date();
  //   const editTimestamp = `${now.toISOString().split("T")[0]} ${now.toTimeString().split(" ")[0]}`;
  //   const today = now.toISOString().split("T")[0];

  //   const isInr = (editingRecord.currency || "INR").toUpperCase() === "INR";
  //   const subTotal = Number(
  //     editProducts.reduce((acc, p) => acc + (p.amount || 0), 0).toFixed(2),
  //   );
  //   const gst = isInr ? parseFloat(String(editingRecord.gst || 0)) || 0 : 0;
  //   const totalInNum = isInr ? Number((subTotal + gst).toFixed(2)) : subTotal;
  //   const totalInWord = formatAmountInWords(
  //     totalInNum,
  //     editingRecord.currency || "INR",
  //   );

  //   const updatedRec: PoRecord = {
  //     ...editingRecord,
  //     subTotal,
  //     gst,
  //     totalInNum,
  //     totalInWord,
  //     createEditDate: today,
  //     editBy: activeUser?.name || "System",
  //     editTimestamp: editTimestamp,

  //     // Product 1
  //     productDescription1: editProducts[0]?.productDescription?.trim() || "",
  //     packingKgs1: editProducts[0]?.packingKgs?.trim() || "",
  //     packs1: parseFloat(editProducts[0]?.packs) || 0,
  //     totalQty1: parseFloat(editProducts[0]?.totalQty) || 0,
  //     rate1: parseFloat(editProducts[0]?.rate) || 0,
  //     amount1: editProducts[0]?.amount || 0,

  //     // Product 2
  //     productDescription2: editProducts[1]?.productDescription?.trim() || "",
  //     packingKgs2: editProducts[1]?.packingKgs?.trim() || "",
  //     packs2:
  //       editProducts[1] && editProducts[1].packs !== ""
  //         ? parseFloat(editProducts[1].packs) || 0
  //         : undefined,
  //     totalQty2:
  //       editProducts[1] && editProducts[1].totalQty !== ""
  //         ? parseFloat(editProducts[1].totalQty) || 0
  //         : undefined,
  //     rate2:
  //       editProducts[1] && editProducts[1].rate !== ""
  //         ? parseFloat(editProducts[1].rate) || 0
  //         : undefined,
  //     amount2: editProducts[1] ? editProducts[1].amount || 0 : undefined,

  //     // Product 3
  //     productDescription3: editProducts[2]?.productDescription?.trim() || "",
  //     packingKgs3: editProducts[2]?.packingKgs?.trim() || "",
  //     packs3:
  //       editProducts[2] && editProducts[2].packs !== ""
  //         ? parseFloat(editProducts[2].packs) || 0
  //         : undefined,
  //     totalQty3:
  //       editProducts[2] && editProducts[2].totalQty !== ""
  //         ? parseFloat(editProducts[2].totalQty) || 0
  //         : undefined,
  //     rate3:
  //       editProducts[2] && editProducts[2].rate !== ""
  //         ? parseFloat(editProducts[2].rate) || 0
  //         : undefined,
  //     amount3: editProducts[2] ? editProducts[2].amount || 0 : undefined,

  //     // Product 4
  //     productDescription4: editProducts[3]?.productDescription?.trim() || "",
  //     packingKgs4: editProducts[3]?.packingKgs?.trim() || "",
  //     packs4:
  //       editProducts[3] && editProducts[3].packs !== ""
  //         ? parseFloat(editProducts[3].packs) || 0
  //         : undefined,
  //     totalQty4:
  //       editProducts[3] && editProducts[3].totalQty !== ""
  //         ? parseFloat(editProducts[3].totalQty) || 0
  //         : undefined,
  //     rate4:
  //       editProducts[3] && editProducts[3].rate !== ""
  //         ? parseFloat(editProducts[3].rate) || 0
  //         : undefined,
  //     amount4: editProducts[3] ? editProducts[3].amount || 0 : undefined,

  //     // Product 5
  //     productDescription5: editProducts[4]?.productDescription?.trim() || "",
  //     packingKgs5: editProducts[4]?.packingKgs?.trim() || "",
  //     packs5:
  //       editProducts[4] && editProducts[4].packs !== ""
  //         ? parseFloat(editProducts[4].packs) || 0
  //         : undefined,
  //     totalQty5:
  //       editProducts[4] && editProducts[4].totalQty !== ""
  //         ? parseFloat(editProducts[4].totalQty) || 0
  //         : undefined,
  //     rate5:
  //       editProducts[4] && editProducts[4].rate !== ""
  //         ? parseFloat(editProducts[4].rate) || 0
  //         : undefined,
  //     amount5: editProducts[4] ? editProducts[4].amount || 0 : undefined,

  //     // Product 6
  //     productDescription6: editProducts[5]?.productDescription?.trim() || "",
  //     packingKgs6: editProducts[5]?.packingKgs?.trim() || "",
  //     packs6:
  //       editProducts[5] && editProducts[5].packs !== ""
  //         ? parseFloat(editProducts[5].packs) || 0
  //         : undefined,
  //     totalQty6:
  //       editProducts[5] && editProducts[5].totalQty !== ""
  //         ? parseFloat(editProducts[5].totalQty) || 0
  //         : undefined,
  //     rate6:
  //       editProducts[5] && editProducts[5].rate !== ""
  //         ? parseFloat(editProducts[5].rate) || 0
  //         : undefined,
  //     amount6: editProducts[5] ? editProducts[5].amount || 0 : undefined,

  //     // Product 7
  //     productDescription7: editProducts[6]?.productDescription?.trim() || "",
  //     packingKgs7: editProducts[6]?.packingKgs?.trim() || "",
  //     packs7:
  //       editProducts[6] && editProducts[6].packs !== ""
  //         ? parseFloat(editProducts[6].packs) || 0
  //         : undefined,
  //     totalQty7:
  //       editProducts[6] && editProducts[6].totalQty !== ""
  //         ? parseFloat(editProducts[6].totalQty) || 0
  //         : undefined,
  //     rate7: editProducts[6]
  //       ? editProducts[6].rate !== ""
  //         ? parseFloat(editProducts[6].rate) || 0
  //         : undefined
  //       : undefined,
  //     amount7: editProducts[6] ? editProducts[6].amount || 0 : undefined,
  //   };

  //   // Turn on Full-Screen Loader & Disable UI interactions
  //   setIsSubmitting(true);

  //   try {
  //     const success = await onUpdatePo(updatedRec);
  //     if (success) {
  //       setEditingRecord(null); // Close modal only on success
  //     }
  //   } catch (err: any) {
  //     alert(`An unexpected error occurred: ${err?.message || err}`);
  //   } finally {
  //     // Remove loading overlay regardless of success or failure
  //     setIsSubmitting(false);
  //   }

  //   // onUpdatePo(updatedRec);
  //   // setEditingRecord(null);
  // };

  // Quick Add Supplier / Product
  {
    /*
  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddValue.trim()) return;
    const val = quickAddValue.trim();

    if (quickAddType === "supplier") {
      const gstVal = quickAddSupplierGst.trim();
      const addrVal = quickAddSupplierAddress.trim();

      if (onAddSupplierMaster) {
        onAddSupplierMaster({
          supplierName: val,
          supplierGst: gstVal,
          supplierAddress: addrVal,
          importDomestic: "Domestic",
          remarks: "Added via PO Quick Add",
        });
      }
      if (onAddDomesticSupplier) onAddDomesticSupplier({ name: val });

      const newOption: SupplierOptionItem = {
        id: `quick-${Date.now()}`,
        name: val,
        gstin: gstVal,
        address: addrVal,
        category: "Domestic",
      };

      if (editingRecord) {
        handleSelectSupplierForEdit(val, newOption);
      } else {
        handleSelectSupplierForCreate(val, newOption);
      }

      setQuickAddSupplierGst("");
      setQuickAddSupplierAddress("");
    } else if (quickAddType === "product") {
      if (onAddProduct) onAddProduct({ name: val, category: "General", group: "General", manufacturer: "General" });
      if (editingRecord) {
        const updated = [...editProducts];
        if (updated[quickAddProductSlot]) {
          updated[quickAddProductSlot] = { ...updated[quickAddProductSlot], productDescription: val };
          setEditProducts(updated);
        }
      } else {
        const updated = [...formProducts];
        if (updated[quickAddProductSlot]) {
          updated[quickAddProductSlot] = { ...updated[quickAddProductSlot], productDescription: val };
          setFormProducts(updated);
        }
      }
    }

    setQuickAddType(null);
    setQuickAddValue("");
  };
  */
  }

  // Filter Logic
  const filteredRecords = poRecords.filter((rec) => {
    const prods = getPoProductsList(rec);
    const prodNames = prods.map((p) => p.description.toLowerCase()).join(" ");

    const matchesSearch =
      (rec.poNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.supplierName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      prodNames.includes(searchTerm.toLowerCase()) ||
      (rec.deliveryLocation || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (rec.billingLocation || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (rec.preparedBy || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.createdBy || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSupplier =
      filterSupplier === "all" || rec.supplierName === filterSupplier;
    const matchesLocation =
      filterLocation === "all" ||
      rec.deliveryLocation === filterLocation ||
      rec.billingLocation === filterLocation;
    const matchesProduct =
      filterProduct === "all" ||
      prods.some((p) => p.description === filterProduct);

    let matchesDate = true;
    if (startDate || endDate) {
      const recDate =
        dateFilterType === "entry" ? rec.createEditDate : rec.poDate;
      if (!recDate) {
        matchesDate = false;
      } else {
        if (startDate && recDate < startDate) matchesDate = false;
        if (endDate && recDate > endDate) matchesDate = false;
      }
    }

    return (
      matchesSearch &&
      matchesSupplier &&
      matchesLocation &&
      matchesProduct &&
      matchesDate
    );
  });

  // Totals calculations
  const isFiltered = Boolean(
    searchTerm.trim() !== "" ||
    filterSupplier !== "all" ||
    filterLocation !== "all" ||
    filterProduct !== "all" ||
    startDate !== "" ||
    endDate !== "",
  );
  const totalEntries = filteredRecords.length;
  const overallEntries = poRecords.length;
  const totalQty = filteredRecords.reduce(
    (sum, rec) => sum + getPoTotalQty(rec),
    0,
  );
  const totalSubTotal = filteredRecords.reduce(
    (sum, rec) => sum + (Number(rec.subTotal) || 0),
    0,
  );
  const totalGst = filteredRecords.reduce(
    (sum, rec) => sum + (Number(rec.gst) || 0),
    0,
  );
  const totalAmount = filteredRecords.reduce(
    (sum, rec) => sum + (Number(rec.totalInNum) || 0),
    0,
  );

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterSupplier("all");
    setFilterLocation("all");
    setFilterProduct("all");
    setStartDate("");
    setEndDate("");
    setDateFilterType("invoice");
  };

  return (
    <div className="space-y-4">
      {/* Real-time Google Sheets Apps Script Sync Banner */}
      <AppsScriptSyncBanner
        configKey="purchase_orders_apps_script"
        defaultSheetName="PO"
        collectionKey="purchase_orders"
        moduleTitle="Purchase Orders (PO)"
        activeUser={activeUser}
        config={config}
        syncStatus={syncStatus}
        setSyncStatus={setSyncStatus}
        records={poRecords}
      />

      {/* onDataFetched={(records) => {
          records.forEach((row) => {
            const normalized = normalizePoRow(
              row,
              activeUser?.name || "System",
            );
            const existing = poRecords.find(
              (p) =>
                p.id === normalized.id || p.poNumber === normalized.poNumber,
            );
            if (existing) {
              onUpdatePo({ ...existing, ...normalized });
            } else {
              onAddPo(normalized);
            }
          });
        }} */}

      {/* Top Metrics Cards (Similar to PD Sub-view) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Entries Count */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg shrink-0">
            <Receipt size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                {isFiltered ? "Filtered POs" : "Total PO Records"}
              </p>
              {isFiltered && (
                <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded">
                  Filtered
                </span>
              )}
            </div>
            <p className="text-lg font-bold text-slate-900 font-mono">
              {totalEntries.toLocaleString()}{" "}
              {isFiltered && (
                <span className="text-xs font-normal text-slate-400">
                  / {overallEntries}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Card 2: Total Sum of Qty */}
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg shrink-0">
            <Package size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider font-mono">
                {isFiltered ? "Filtered Total Qty" : "Total Order Qty"}
              </p>
              <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                Sum
              </span>
            </div>
            <p className="text-lg font-extrabold text-emerald-800 font-mono">
              {totalQty.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-emerald-600">
                Units/Kg
              </span>
            </p>
          </div>
        </div>

        {/* Card 3: Total Sub Total */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg shrink-0">
            <DollarSign size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                {isFiltered ? "Filtered Sub Total" : "Total Sub Total"}
              </p>
              <span className="text-[9px] font-bold font-mono text-amber-800">
                GST: ₹
                {totalGst.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <p className="text-lg font-bold text-amber-900 font-mono">
              ₹
              {totalSubTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>

        {/* Card 4: Total Value in Num */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-700 rounded-lg shrink-0">
            <TrendingUp size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                {isFiltered ? "Filtered Grand Total" : "Grand Total (In Num)"}
              </p>
              <span className="text-[9px] font-bold font-mono text-purple-800">
                Gross
              </span>
            </div>
            <p className="text-lg font-bold text-purple-900 font-mono">
              ₹
              {totalAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col gap-2.5 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[220px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search PO #, Supplier, Product, Location, Prepared By..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 outline-none"
            >
              <option value="all">All Suppliers</option>
              {allSupplierNames.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 outline-none"
            >
              <option value="all">All Branchs</option>
              {allDeliveryLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 outline-none"
            >
              <option value="all">All Products</option>
              {allProductNames.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {/* Date Range Popup */}
            <DateRangeFilterPopup
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              dateFilterType={dateFilterType}
              onDateFilterTypeChange={setDateFilterType}
              label="PO Date Filter"
              entryDateLabel="Create/Edit Date"
              invoiceDateLabel="PO Date"
            />

            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition"
              >
                <RotateCcw size={13} />
                Reset
              </button>
            )}
          </div>

          {canAdd && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus size={16} />
              Create PO
            </button>
          )}
        </div>
      </div>

      {/* Main Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[640px] scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 font-mono text-[11px] uppercase tracking-wider text-slate-600">
              <tr>
                <th className="py-2.5 px-3 font-semibold text-slate-500 w-10">
                  #
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700">
                  PO Date
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700">
                  PO Number
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700">
                  Supplier Name
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700">
                  Delivery Location
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700">
                  Billing Location
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700">
                  Product Description
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700 text-right">
                  Packs
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700 text-center">
                  Packing/Kgs
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700 text-right">
                  Total Qty
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700 text-right">
                  Rate
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700 text-right">
                  Sub Total
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700 text-right">
                  GST
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700 text-right">
                  Total (In Num)
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700">
                  Prepared By
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700">
                  Create/Edit Date
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700">
                  PO File
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700 text-center w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={17} className="py-12 text-center text-slate-400">
                    <Receipt
                      className="mx-auto mb-2 opacity-30 text-slate-400"
                      size={32}
                    />
                    <p className="font-medium text-sm">
                      No Purchase Orders found
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {isFiltered
                        ? "Try clearing filters to see existing records"
                        : "Click 'Create PO' or sync with Google Sheets to add records"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, index) => {
                  const recKey = rec.id || rec.poNumber || "";
                  const effectivePdfUrl =
                    (recKey && localPdfUrls[recKey]) ||
                    (rec.poNumber && localPdfUrls[rec.poNumber]) ||
                    (rec.id && localPdfUrls[rec.id]) ||
                    rec.poPdfUrl ||
                    "";
                  const isGenerating = !!(
                    (recKey && generatingPdfIds[recKey]) ||
                    (rec.id && generatingPdfIds[rec.id]) ||
                    (rec.poNumber && generatingPdfIds[rec.poNumber])
                  );

                  return (
                    <tr
                      key={rec.id || `po-${index}`}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => setViewingRecord(rec)}
                    >
                      <td className="py-2 px-3 text-slate-400 font-mono">
                        {index + 1}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-700 whitespace-nowrap">
                        {rec.poDate || "-"}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {rec.poNumber || "-"}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900 whitespace-nowrap">
                        {rec.supplierName || "-"}
                      </td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                        {rec.deliveryLocation || "-"}
                      </td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                        {rec.billingLocation || "-"}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-800 whitespace-nowrap max-w-[220px]">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="truncate"
                            title={getPoProductsList(rec)
                              .map((p) => p.description)
                              .filter(Boolean)
                              .join(", ")}
                          >
                            {rec.productDescription1 || "-"}
                          </span>
                          {getPoProductsList(rec).length > 1 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold shrink-0">
                              +{getPoProductsList(rec).length - 1} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600 text-right whitespace-nowrap">
                        {getPoTotalPacks(rec)
                          ? Number(getPoTotalPacks(rec)).toLocaleString()
                          : "-"}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-500 text-center whitespace-nowrap">
                        {getPoProductsList(rec).length > 1 ? (
                          <span className="text-[10px] text-slate-500 font-sans">
                            Multi ({getPoProductsList(rec).length})
                          </span>
                        ) : (
                          rec.packingKgs1 || "-"
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-800 text-right whitespace-nowrap">
                        {Number(getPoTotalQty(rec) || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-700 text-right whitespace-nowrap">
                        {rec.currency || "₹"}{" "}
                        {formatNumberForCurrency(
                          rec.rate1 || 0,
                          rec.currency || "INR",
                          2,
                          2,
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono font-medium text-slate-900 text-right whitespace-nowrap">
                        {rec.currency || "₹"}{" "}
                        {formatNumberForCurrency(
                          rec.subTotal || 0,
                          rec.currency || "INR",
                          2,
                          2,
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-amber-700 text-right whitespace-nowrap">
                        {(rec.currency || "INR").toUpperCase() === "INR" ? (
                          formatNumberForCurrency(rec.gst || 0, "INR", 2, 2)
                        ) : (
                          <span className="text-slate-400 font-sans text-[11px]">
                            -
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono font-extrabold text-purple-900 text-right whitespace-nowrap">
                        {rec.currency || "₹"}{" "}
                        {formatNumberForCurrency(
                          rec.totalInNum || 0,
                          rec.currency || "INR",
                          2,
                          2,
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                        {rec.preparedBy || rec.createdBy || "-"}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {rec.createEditDate ||
                          rec.createdAt?.split(" ")[0] ||
                          "-"}
                      </td>
                      <td
                        className="py-2 px-3 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isGenerating ? (
                          <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-300 rounded-md select-none pointer-events-none cursor-not-allowed shadow-2xs"
                            title="File is creating, please wait..."
                          >
                            <Loader2 size={13} className="animate-spin text-amber-600 shrink-0" />
                            <span className="font-sans">File is creating please wait...</span>
                          </div>
                        ) : effectivePdfUrl ? (
                          <a
                            href={effectivePdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-900 border border-blue-200 rounded-md transition-colors shadow-2xs"
                            title={`Open PDF for ${rec.poNumber || rec.id || "PO"}`}
                          >
                            <FileText size={13} className="text-blue-600 shrink-0" />
                            <span className="font-mono">{rec.poNumber || rec.id || "View PDF"}</span>
                            <ExternalLink size={12} className="text-blue-500 shrink-0 opacity-70" />
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGeneratePdfClick(rec);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-300 rounded-md shadow-2xs transition-colors cursor-pointer"
                            title="Generate PDF file via Apps Script"
                          >
                            <Sparkles size={12} className="text-emerald-600 shrink-0" />
                            <span>Generate PDF</span>
                          </button>
                        )}
                      </td>
                      <td
                        className="py-2 px-3 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingRecord(rec)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition"
                            title="View PO Details"
                          >
                            <Eye size={14} />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(rec)}
                              className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-amber-50 transition"
                              title="Edit PO"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => setDeletingRecord(rec)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                            title="Delete PO"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredRecords.length > 0 && (
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800 font-mono text-[11px]">
                <tr>
                  <td
                    colSpan={7}
                    className="py-2.5 px-3 text-right uppercase tracking-wider text-slate-500"
                  >
                    Totals:
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {filteredRecords
                      .reduce((s, r) => s + getPoTotalPacks(r), 0)
                      .toLocaleString()}
                  </td>
                  <td></td>
                  <td className="py-2.5 px-3 text-right text-emerald-800">
                    {totalQty.toLocaleString()}
                  </td>
                  <td></td>
                  <td className="py-2.5 px-3 text-right">
                    ₹
                    {totalSubTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-2.5 px-3 text-right text-amber-700">
                    ₹
                    {totalGst.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-2.5 px-3 text-right text-purple-900">
                    ₹
                    {totalAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* CREATE PO MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-6 overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <Receipt size={18} className="text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    Create New Purchase Order (PO)
                  </h3>
                  <p className="text-[11px] text-emerald-100/80 font-mono">
                    All fields will sync to Google Sheet via Google Apps Script
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleCreateSubmit}
              className="p-5 max-h-[80vh] overflow-y-auto space-y-5 text-xs"
            >
              {/* SECTION 1: HEADER & SUPPLIER */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-700 font-bold font-mono text-[11px] uppercase tracking-wider">
                  <Building2 size={14} className="text-emerald-600" />
                  1. General & Supplier Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Create/Edit Date
                    </label>
                    <input
                      type="date"
                      value={formCreateEditDate}
                      onChange={(e) => setFormCreateEditDate(e.target.value)}
                      readOnly
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 text-slate-800 text-xs"
                    />
                  </div>

                  {/* <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-600 font-medium">PO Number *</label>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PO-2026-0001"
                      value={12}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-emerald-500 font-semibold"
                    />
                  </div> */}

                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-600 font-medium">
                        Supplier Name *
                      </label>
                    </div>
                    <SearchableSupplierSelect
                      value={formSupplierName}
                      onChange={handleSelectSupplierForCreate}
                      suppliers={sortedSuppliersMaster}
                      placeholder="Type to search or enter supplier name..."
                      required
                      accentColor="emerald"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-600 font-medium">
                        Supplier GSTIN
                      </label>
                      {formSupplierGstin &&
                        sortedSuppliersMaster.some(
                          (s) =>
                            s.name.trim().toLowerCase() ===
                              formSupplierName.trim().toLowerCase() &&
                            s.gstin === formSupplierGstin,
                        ) && (
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            <Check size={11} /> Auto-filled
                          </span>
                        )}
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      value={formSupplierGstin}
                      onChange={(e) => setFormSupplierGstin(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-emerald-500 uppercase text-slate-800 font-medium text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      CP Name (Contact Person)
                    </label>
                    <input
                      type="text"
                      placeholder="Contact Person Name"
                      value={formCpName}
                      onChange={(e) => setFormCpName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      CP Number
                    </label>
                    <input
                      type="text"
                      placeholder="Contact Phone #"
                      value={formCpNumber}
                      onChange={(e) => setFormCpNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      CP Email ID
                    </label>
                    <input
                      type="email"
                      placeholder="cp@supplier.com"
                      value={formCpEmailId}
                      onChange={(e) => setFormCpEmailId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-600 font-medium">
                        Supplier Address
                      </label>
                      {formSupplierAddress &&
                        sortedSuppliersMaster.some(
                          (s) =>
                            s.name.trim().toLowerCase() ===
                              formSupplierName.trim().toLowerCase() &&
                            s.address === formSupplierAddress,
                        ) && (
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            <Check size={11} /> Auto-filled
                          </span>
                        )}
                    </div>
                    <input
                      type="text"
                      placeholder="Address, City, State"
                      value={formSupplierAddress}
                      onChange={(e) => setFormSupplierAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 text-slate-800 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: REPRESENTATIVES & Commercial Terms */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-700 font-bold font-mono text-[11px] uppercase tracking-wider">
                  <UserCheck size={14} className="text-emerald-600" />
                  2. Representatives & Commercial Terms
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Prepared By
                    </label>
                    <select
                      value={formPreparedBy}
                      onChange={(e) => setFormPreparedBy(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-medium"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Checked By
                    </label>
                    <select
                      value={formCheckedBy}
                      onChange={(e) => handleCheckedByForCreate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-medium"
                    >
                      <option value="">-- None / Select Checker --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      SP Name (Sales Person)
                    </label>
                    <input
                      type="text"
                      placeholder="Sales Person Name"
                      value={formSpName}
                      onChange={(e) => setFormSpName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      SP Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="Sales Person Phone"
                      value={formSpPhoneNumber}
                      onChange={(e) => setFormSpPhoneNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      SP Email Id
                    </label>
                    <input
                      type="email"
                      placeholder="sp@supplier.com"
                      value={formSpEmailId}
                      onChange={(e) => setFormSpEmailId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Payment Terms
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 30 Days Credit, Advance"
                      value={formPaymentTerms}
                      onChange={(e) => setFormPaymentTerms(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Delivery Terms
                    </label>
                    <input
                      type="text"
                      placeholder="Delivery terms"
                      value={formDeliveryTerms}
                      onChange={(e) => setFormDeliveryTerms(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Other Terms
                    </label>
                    <input
                      type="text"
                      placeholder="Special instructions or warranty terms"
                      value={formOtherTerms}
                      onChange={(e) => setFormOtherTerms(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: DELIVERY & BILLING LOCATIONS */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-700 font-bold font-mono text-[11px] uppercase tracking-wider">
                  <MapPin size={14} className="text-emerald-600" />
                  3. Delivery & Billing Logistics
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Delivery Location
                    </label>
                    <select
                      value={formDeliveryLocation}
                      onChange={(e) =>
                        handleSelectDeliveryLocation(e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-medium"
                    >
                      <option value="">-- Select Delivery Location --</option>
                      {allDeliveryLocations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Billing Location
                    </label>
                    <select
                      value={formBillingLocation}
                      onChange={(e) =>
                        handleSelectBillingLocation(e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-medium"
                    >
                      <option value="">-- Select Billing Location --</option>
                      {allBillingLocations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Ship To GST
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      value={formShipToGst}
                      onChange={(e) => setFormShipToGst(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-emerald-500 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Bill To GST
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      value={formBillToGst}
                      onChange={(e) => setFormBillToGst(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-emerald-500 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Ship To Address
                    </label>
                    <input
                      type="text"
                      placeholder="Full Destination Address"
                      value={formShipToAddress}
                      onChange={(e) => setFormShipToAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Bill To Address
                    </label>
                    <input
                      type="text"
                      placeholder="Registered Billing Office Address"
                      value={formBillToAddress}
                      onChange={(e) => setFormBillToAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: PRODUCT & PRICING (UP TO 7 PRODUCTS) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700 font-bold font-mono text-[11px] uppercase tracking-wider">
                    <Package size={14} className="text-emerald-600" />
                    4. Products & Quantities ({formProducts.length} of max 7)
                  </div>
                  {formProducts.length < 7 && (
                    <button
                      type="button"
                      onClick={handleAddCreateProduct}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition cursor-pointer"
                    >
                      <Plus size={13} />
                      Add Product ({formProducts.length}/7)
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {formProducts.map((prod, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="font-mono font-bold text-xs text-slate-800 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-bold">
                            {pIdx + 1}
                          </span>
                          Product {pIdx + 1}
                        </span>
                        {formProducts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCreateProduct(pIdx)}
                            className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded transition flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                            title="Remove product"
                          >
                            <Trash2 size={13} />
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5">
                        <div className="md:col-span-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-slate-600 font-medium text-[11px]">
                              Product Description {pIdx + 1} *
                            </label>
                          </div>
                          <select
                            required
                            value={prod.productDescription}
                            onChange={(e) =>
                              handleCreateProductChange(
                                pIdx,
                                "productDescription",
                                e.target.value,
                              )
                            }
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-medium text-xs"
                          >
                            <option value="">-- Select Product --</option>
                            {allProductNames.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-600 font-medium mb-1 text-[11px]">
                            Packing/Kgs {pIdx + 1}
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 50, 200, Bulk"
                            value={prod.packingKgs}
                            onChange={(e) =>
                              handleCreateProductChange(
                                pIdx,
                                "packingKgs",
                                e.target.value,
                              )
                            }
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 font-medium mb-1 text-[11px]">
                            Packs {pIdx + 1}
                          </label>
                          <input
                            type="number"
                            step="any"
                            placeholder="e.g. 100"
                            value={prod.packs}
                            onChange={(e) =>
                              handleCreateProductChange(
                                pIdx,
                                "packs",
                                e.target.value,
                              )
                            }
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-emerald-500 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 font-medium mb-1 text-[11px]">
                            Total Qty {pIdx + 1} *
                          </label>
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="Total Units / Kgs"
                            value={prod.totalQty}
                            onChange={(e) =>
                              handleCreateProductChange(
                                pIdx,
                                "totalQty",
                                e.target.value,
                              )
                            }
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:ring-1 focus:ring-emerald-500 text-emerald-800 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 font-medium mb-1 text-[11px]">
                            Rate {pIdx + 1} *
                          </label>
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="Rate per unit"
                            value={prod.rate}
                            onChange={(e) =>
                              handleCreateProductChange(
                                pIdx,
                                "rate",
                                e.target.value,
                              )
                            }
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-semibold focus:ring-1 focus:ring-emerald-500 text-xs"
                          />
                        </div>

                        <div className="md:col-span-6 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">
                            Product {pIdx + 1} Amount:
                          </span>
                          <span className="font-mono font-bold text-emerald-800">
                            {formCurrency}{" "}
                            {(prod.amount || 0).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {formProducts.length < 7 && (
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={handleAddCreateProduct}
                      className="px-4 py-2 border border-dashed border-emerald-300 hover:border-emerald-500 text-emerald-700 bg-emerald-50/60 hover:bg-emerald-50 rounded-xl text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus size={14} />+ Add Another Product (up to 7 max)
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 5: TOTALS */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-700 font-bold font-mono text-[11px] uppercase tracking-wider">
                  <CreditCard size={14} className="text-emerald-600" />
                  5. Currency & Grand Totals
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Currency
                    </label>
                    <select
                      value={formCurrency}
                      onChange={(e) => {
                        setFormCurrency(e.target.value);
                        recalcCreateTotals(
                          formProducts,
                          formGstPercent,
                          e.target.value,
                        );
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-mono font-semibold"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>

                  {/* Calculations breakdown */}
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Sub Total (Sum of all products)
                    </label>
                    <input
                      type="number"
                      step="any"
                      readOnly
                      value={formSubTotal}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-mono font-bold text-slate-700"
                    />
                  </div>

                  {formCurrency === "INR" ? (
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        GST (%)
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={formGstPercent}
                          onChange={(e) => {
                            setFormGstPercent(e.target.value);
                            recalcCreateTotals(
                              formProducts,
                              e.target.value,
                              formCurrency,
                            );
                          }}
                          className="w-24 px-2 py-2 bg-white border border-slate-200 rounded-lg font-mono"
                        >
                          <option value="18">18%</option>
                          <option value="12">12%</option>
                          <option value="5">5%</option>
                          <option value="0">0%</option>
                          <option value="28">28%</option>
                        </select>
                        <input
                          type="number"
                          step="any"
                          placeholder="GST Amount"
                          value={formGst}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setFormGst(val);
                            const total = Number(
                              (formSubTotal + val).toFixed(2),
                            );
                            setFormTotalInNum(total);
                            setFormTotalInWord(
                              formatAmountInWords(total, formCurrency),
                            );
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-medium focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Total (In Num) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formTotalInNum}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormTotalInNum(val);
                        setFormTotalInWord(
                          formatAmountInWords(val, formCurrency),
                        );
                      }}
                      className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg font-mono font-extrabold text-purple-900 focus:ring-1 focus:ring-purple-500 text-sm"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-slate-600 font-medium mb-1">
                      Total (In Word)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rupees One Lakh Eighteen Thousand Only"
                      value={formTotalInWord}
                      onChange={(e) => setFormTotalInWord(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-serif italic text-slate-800 focus:ring-1 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  Save & Sync PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PO MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-6 overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="bg-gradient-to-r from-amber-600 to-orange-700 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <Edit2 size={18} className="text-amber-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    Edit Purchase Order ({editingRecord.poNumber})
                  </h3>
                  <p className="text-[11px] text-amber-100/80 font-mono">
                    Updated details will sync directly to Google Sheet row
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSaveEdit}
              className="p-5 max-h-[80vh] overflow-y-auto space-y-5 text-xs"
            >
              {/* SECTION 1: HEADER & SUPPLIER */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-700 font-bold font-mono text-[11px] uppercase tracking-wider">
                  <Building2 size={14} className="text-amber-600" />
                  1. General & Supplier Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Create/Edit Date
                    </label>
                    <input
                      type="date"
                      value={editingRecord.createEditDate || ""}
                      readOnly
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          createEditDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs"
                    />
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-600 font-medium">
                        Supplier Name
                      </label>
                    </div>
                    <SearchableSupplierSelect
                      value={editingRecord.supplierName || ""}
                      onChange={handleSelectSupplierForEdit}
                      suppliers={sortedSuppliersMaster}
                      placeholder="Type to search or enter supplier name..."
                      accentColor="amber"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-600 font-medium">
                        Supplier GSTIN
                      </label>
                      {editingRecord.supplierGstin &&
                        sortedSuppliersMaster.some(
                          (s) =>
                            s.name.trim().toLowerCase() ===
                              (editingRecord.supplierName || "")
                                .trim()
                                .toLowerCase() &&
                            s.gstin === editingRecord.supplierGstin,
                        ) && (
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            <Check size={11} /> Auto-filled
                          </span>
                        )}
                    </div>
                    <input
                      type="text"
                      value={editingRecord.supplierGstin || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          supplierGstin: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono uppercase text-slate-800 font-medium text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      CP Name
                    </label>
                    <input
                      type="text"
                      value={editingRecord.cpName || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          cpName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      CP Number
                    </label>
                    <input
                      type="text"
                      value={editingRecord.cpNumber || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          cpNumber: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      CP Email ID
                    </label>
                    <input
                      type="email"
                      value={editingRecord.cpEmailId || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          cpEmailId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-600 font-medium">
                        Supplier Address
                      </label>
                      {editingRecord.supplierAddress &&
                        sortedSuppliersMaster.some(
                          (s) =>
                            s.name.trim().toLowerCase() ===
                              (editingRecord.supplierName || "")
                                .trim()
                                .toLowerCase() &&
                            s.address === editingRecord.supplierAddress,
                        ) && (
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            <Check size={11} /> Auto-filled
                          </span>
                        )}
                    </div>
                    <input
                      type="text"
                      value={editingRecord.supplierAddress || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          supplierAddress: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Representatives & Commercial Terms */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-700 font-bold font-mono text-[11px] uppercase tracking-wider">
                  <UserCheck size={14} className="text-amber-600" />
                  2. Representatives & Commercial Terms
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Prepared By
                    </label>
                    <select
                      value={editingRecord.preparedBy || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          preparedBy: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Checked By
                    </label>
                    <select
                      value={editingRecord.checkedBy || ""}
                      onChange={(e) => handleCheckedByForedit(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="">-- None --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      SP Name
                    </label>
                    <input
                      type="text"
                      value={editingRecord.spName || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          spName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      SP Phone Number
                    </label>
                    <input
                      type="text"
                      value={editingRecord.spPhoneNumber || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          spPhoneNumber: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      SP Email Id
                    </label>
                    <input
                      type="email"
                      value={editingRecord.spEmailId || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          spEmailId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Payment Terms
                    </label>
                    <input
                      type="text"
                      value={editingRecord.paymentTerms || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          paymentTerms: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Delivery Terms
                    </label>
                    <select
                      value={editingRecord.deliveryTerms || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          deliveryTerms: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    >
                      {allDeliveryTerms.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Other Terms
                    </label>
                    <input
                      type="text"
                      value={editingRecord.otherTerms || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          otherTerms: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: DELIVERY & BILLING LOCATIONS */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-700 font-bold font-mono text-[11px] uppercase tracking-wider">
                  <MapPin size={14} className="text-amber-600" />
                  3. Delivery & Billing Logistics
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Delivery Location
                    </label>
                    <select
                      value={editingRecord.deliveryLocation || ""}
                      onChange={(e) =>
                        handleSelectDeliveryLocationForEdit(e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="">-- Select --</option>
                      {allDeliveryLocations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Billing Location
                    </label>
                    <select
                      value={editingRecord.billingLocation || ""}
                      onChange={(e) =>
                        handleSelectBillingLocationForEdit(e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="">-- Select --</option>
                      {allBillingLocations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Ship To GST
                    </label>
                    <input
                      type="text"
                      value={editingRecord.shipToGst || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          shipToGst: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Bill To GST
                    </label>
                    <input
                      type="text"
                      value={editingRecord.billToGst || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          billToGst: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Ship To Address
                    </label>
                    <input
                      type="text"
                      value={editingRecord.shipToAddress || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          shipToAddress: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Bill To Address
                    </label>
                    <input
                      type="text"
                      value={editingRecord.billToAddress || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          billToAddress: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: PRODUCT & QUANTITIES (UP TO 7 PRODUCTS) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700 font-bold font-mono text-[11px] uppercase tracking-wider">
                    <Package size={14} className="text-amber-600" />
                    4. Products & Quantities ({editProducts.length} of max 7)
                  </div>
                  {editProducts.length < 7 && (
                    <button
                      type="button"
                      onClick={handleAddEditProduct}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition cursor-pointer"
                    >
                      <Plus size={13} />
                      Add Product ({editProducts.length}/7)
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {editProducts.map((prod, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="font-mono font-bold text-xs text-slate-800 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] flex items-center justify-center font-bold">
                            {pIdx + 1}
                          </span>
                          Product {pIdx + 1}
                        </span>
                        {editProducts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEditProduct(pIdx)}
                            className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded transition flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                            title="Remove product"
                          >
                            <Trash2 size={13} />
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5">
                        <div className="md:col-span-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-slate-600 font-medium text-[11px]">
                              Product Description {pIdx + 1} *
                            </label>
                          </div>
                          <select
                            required
                            value={prod.productDescription}
                            onChange={(e) =>
                              handleEditProductChange(
                                pIdx,
                                "productDescription",
                                e.target.value,
                              )
                            }
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 font-medium text-xs"
                          >
                            <option value="">-- Select Product --</option>
                            {allProductNames.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-600 font-medium mb-1 text-[11px]">
                            Packing/Kgs {pIdx + 1}
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 50, 200, Bulk"
                            value={prod.packingKgs}
                            onChange={(e) =>
                              handleEditProductChange(
                                pIdx,
                                "packingKgs",
                                e.target.value,
                              )
                            }
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 font-medium mb-1 text-[11px]">
                            Packs {pIdx + 1}
                          </label>
                          <input
                            type="number"
                            step="any"
                            placeholder="e.g. 100"
                            value={prod.packs}
                            onChange={(e) =>
                              handleEditProductChange(
                                pIdx,
                                "packs",
                                e.target.value,
                              )
                            }
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-amber-500 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 font-medium mb-1 text-[11px]">
                            Total Qty {pIdx + 1} *
                          </label>
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="Total Units / Kgs"
                            value={prod.totalQty}
                            onChange={(e) =>
                              handleEditProductChange(
                                pIdx,
                                "totalQty",
                                e.target.value,
                              )
                            }
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:ring-1 focus:ring-amber-500 text-emerald-800 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 font-medium mb-1 text-[11px]">
                            Rate {pIdx + 1} *
                          </label>
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="Rate per unit"
                            value={prod.rate}
                            onChange={(e) =>
                              handleEditProductChange(
                                pIdx,
                                "rate",
                                e.target.value,
                              )
                            }
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-semibold focus:ring-1 focus:ring-amber-500 text-xs"
                          />
                        </div>

                        <div className="md:col-span-6 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">
                            Product {pIdx + 1} Amount:
                          </span>
                          <span className="font-mono font-bold text-amber-900">
                            {editingRecord.currency || "₹"}{" "}
                            {(prod.amount || 0).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {editProducts.length < 7 && (
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={handleAddEditProduct}
                      className="px-4 py-2 border border-dashed border-amber-300 hover:border-amber-500 text-amber-800 bg-amber-50/60 hover:bg-amber-50 rounded-xl text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus size={14} />+ Add Another Product (up to 7 max)
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 5: Currency & Grand Totals */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-700 font-bold font-mono text-[11px] uppercase tracking-wider">
                  <CreditCard size={14} className="text-amber-600" />
                  5. Currency & Grand Totals
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Currency
                    </label>
                    <select
                      value={editingRecord.currency || "INR"}
                      onChange={(e) => {
                        const newCurr = e.target.value;
                        const isInr = newCurr.toUpperCase() === "INR";
                        const sub = editingRecord.subTotal || 0;
                        const gst = isInr
                          ? parseFloat(String(editingRecord.gst || 0)) || 0
                          : 0;
                        const total = isInr
                          ? Number((sub + gst).toFixed(2))
                          : sub;
                        setEditingRecord({
                          ...editingRecord,
                          currency: newCurr,
                          gst: gst,
                          totalInNum: total,
                          totalInWord: formatAmountInWords(total, newCurr),
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-semibold"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Sub Total
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.subTotal || 0}
                      readOnly
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-mono font-bold"
                    />
                  </div>

                  {editingRecord.currency === "INR" ? (
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        GST Amount
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={editingRecord.gst || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const sub = editingRecord.subTotal || 0;
                          const total = Number((sub + val).toFixed(2));
                          setEditingRecord({
                            ...editingRecord,
                            gst: val,
                            totalInNum: total,
                            totalInWord: formatAmountInWords(
                              total,
                              editingRecord.currency || "INR",
                            ),
                          });
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-medium"
                      />
                    </div>
                  ) : null}

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Total (In Num)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.totalInNum || 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setEditingRecord({
                          ...editingRecord,
                          totalInNum: val,
                          totalInWord: formatAmountInWords(
                            val,
                            editingRecord.currency || "INR",
                          ),
                        });
                      }}
                      className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg font-mono font-extrabold text-purple-900"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-slate-600 font-medium mb-1">
                      Total (In Word)
                    </label>
                    <input
                      type="text"
                      value={editingRecord.totalInWord || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          totalInWord: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-serif italic text-slate-800 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  Update & Sync PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PO VOUCHER MODAL */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-6 overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            {/* Voucher Header Bar */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    Purchase Order Voucher
                    <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono">
                      {viewingRecord.poNumber}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    PO Date: {viewingRecord.poDate || "-"} | Created:{" "}
                    {viewingRecord.createdAt ||
                      viewingRecord.createEditDate ||
                      "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const mKey = viewingRecord.id || viewingRecord.poNumber || "";
                  const mPdfUrl =
                    (mKey && localPdfUrls[mKey]) ||
                    (viewingRecord.poNumber && localPdfUrls[viewingRecord.poNumber]) ||
                    (viewingRecord.id && localPdfUrls[viewingRecord.id]) ||
                    viewingRecord.poPdfUrl ||
                    "";
                  const mGenerating = !!(
                    (mKey && generatingPdfIds[mKey]) ||
                    (viewingRecord.id && generatingPdfIds[viewingRecord.id]) ||
                    (viewingRecord.poNumber && generatingPdfIds[viewingRecord.poNumber])
                  );

                  if (mGenerating) {
                    return (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-300 bg-amber-950/80 border border-amber-500/40 rounded-lg pointer-events-none select-none">
                        <Loader2 size={13} className="animate-spin text-amber-400" />
                        <span>File is creating please wait...</span>
                      </span>
                    );
                  }
                  if (mPdfUrl) {
                    return (
                      <a
                        href={mPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 rounded-lg transition"
                        title="Open PDF File"
                      >
                        <FileText size={13} />
                        <span>PDF File</span>
                        <ExternalLink size={12} />
                      </a>
                    );
                  }
                  return (
                    <button
                      type="button"
                      onClick={() => handleGeneratePdfClick(viewingRecord)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 rounded-lg transition cursor-pointer"
                      title="Generate PDF File via Apps Script"
                    >
                      <Sparkles size={13} className="text-emerald-400" />
                      <span>Generate PDF</span>
                    </button>
                  );
                })()}
                <button
                  onClick={() => window.print()}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                  title="Print PO"
                >
                  <Printer size={16} />
                </button>
                <button
                  onClick={() => setViewingRecord(null)}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Voucher Content */}
            <div className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
              {/* Supplier & Billing Addresses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
                    Supplier Details
                  </p>
                  <p className="font-bold text-sm text-slate-900">
                    {viewingRecord.supplierName || "-"}
                  </p>
                  <p className="text-slate-600 mt-1">
                    {viewingRecord.supplierAddress || "No address provided"}
                  </p>
                  <p className="text-slate-700 font-mono mt-1">
                    GSTIN: {viewingRecord.supplierGstin || "N/A"}
                  </p>
                  {viewingRecord.cpName && (
                    <p className="text-slate-500 text-[11px] mt-2">
                      Contact: {viewingRecord.cpName}{" "}
                      {viewingRecord.cpNumber && `(${viewingRecord.cpNumber})`}{" "}
                      {viewingRecord.cpEmailId &&
                        `| ${viewingRecord.cpEmailId}`}
                    </p>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
                    Billing & Shipping Logistics
                  </p>
                  <p className="font-semibold text-slate-800">
                    <span className="text-slate-500">Billing Branch:</span>{" "}
                    {viewingRecord.billingLocation || "-"}
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    {viewingRecord.billToAddress ||
                      "Address as per branch registration"}
                  </p>
                  <p className="text-slate-700 font-mono text-[11px]">
                    Bill To GST: {viewingRecord.billToGst || "N/A"}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-200">
                    <p className="font-semibold text-slate-800">
                      <span className="text-slate-500">Delivery Location:</span>{" "}
                      {viewingRecord.deliveryLocation || "-"}
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      {viewingRecord.shipToAddress ||
                        "Same as Delivery Location"}
                    </p>
                    <p className="text-slate-700 font-mono text-[11px]">
                      Ship To GST: {viewingRecord.shipToGst || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Product Details Table (All Products 1 to 7) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 font-mono text-[11px] text-slate-600 uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-8">#</th>
                      <th className="py-2.5 px-3">Product Description</th>
                      <th className="py-2.5 px-3 text-center">Packing/Kgs</th>
                      <th className="py-2.5 px-3 text-right">Packs</th>
                      <th className="py-2.5 px-3 text-right">Total Qty</th>
                      <th className="py-2.5 px-3 text-right">Rate</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {getPoProductsList(viewingRecord).map((prod, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {prod.description || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {prod.packingKgs || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {prod.packs
                            ? Number(prod.packs).toLocaleString()
                            : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                          {Number(prod.totalQty || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {viewingRecord.currency || "₹"}{" "}
                          {formatNumberForCurrency(
                            prod.rate || 0,
                            viewingRecord.currency || "INR",
                            2,
                            2,
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {viewingRecord.currency || "₹"}{" "}
                          {formatNumberForCurrency(
                            prod.amount || 0,
                            viewingRecord.currency || "INR",
                            2,
                            2,
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-mono font-bold border-t border-slate-200 text-slate-800 text-[11px]">
                    <tr>
                      <td
                        colSpan={3}
                        className="py-2.5 px-3 text-right uppercase text-slate-500"
                      >
                        Totals:
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {getPoTotalPacks(viewingRecord).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-800">
                        {getPoTotalQty(viewingRecord).toLocaleString()}
                      </td>
                      <td></td>
                      <td className="py-2.5 px-3 text-right">
                        {viewingRecord.currency || "₹"}{" "}
                        {formatNumberForCurrency(
                          viewingRecord.subTotal || 0,
                          viewingRecord.currency || "INR",
                          2,
                          2,
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Totals & Commercials Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Terms & Conditions
                  </p>
                  <p className="text-slate-700">
                    <span className="font-semibold">Payment Terms:</span>{" "}
                    {viewingRecord.paymentTerms || "Standard"}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-semibold">Delivery Terms:</span>{" "}
                    {viewingRecord.deliveryTerms || "FOR Destination"}
                  </p>
                  {viewingRecord.otherTerms && (
                    <p className="text-slate-600 text-[11px] italic">
                      <span className="font-semibold not-italic">
                        Other Terms:
                      </span>{" "}
                      {viewingRecord.otherTerms}
                    </p>
                  )}
                  {viewingRecord.spName && (
                    <p className="text-slate-500 text-[11px] pt-1">
                      Sales Rep: {viewingRecord.spName}{" "}
                      {viewingRecord.spPhoneNumber &&
                        `(${viewingRecord.spPhoneNumber})`}
                    </p>
                  )}
                </div>

                <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-200 space-y-2">
                  <div className="flex justify-between text-slate-700 font-mono">
                    <span>Sub Total:</span>
                    <span>
                      {viewingRecord.currency || "₹"}{" "}
                      {formatNumberForCurrency(
                        viewingRecord.subTotal || 0,
                        viewingRecord.currency || "INR",
                        2,
                        2,
                      )}
                    </span>
                  </div>
                  {(viewingRecord.currency || "INR").toUpperCase() ===
                    "INR" && (
                    <div className="flex justify-between text-amber-800 font-mono">
                      <span>GST:</span>
                      <span>
                        {viewingRecord.currency || "₹"}{" "}
                        {formatNumberForCurrency(
                          viewingRecord.gst || 0,
                          viewingRecord.currency || "INR",
                          2,
                          2,
                        )}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-purple-200 flex justify-between font-bold text-sm text-purple-900 font-mono">
                    <span>Total (In Num):</span>
                    <span>
                      {viewingRecord.currency || "₹"}{" "}
                      {formatNumberForCurrency(
                        viewingRecord.totalInNum || 0,
                        viewingRecord.currency || "INR",
                        2,
                        2,
                      )}
                    </span>
                  </div>
                  <div className="pt-1.5 text-[11px] font-serif italic text-purple-950">
                    <span className="font-sans font-bold not-italic text-[10px] uppercase tracking-wider text-purple-700 block">
                      Total In Words:
                    </span>
                    {viewingRecord.totalInWord ||
                      formatAmountInWords(
                        viewingRecord.totalInNum || 0,
                        viewingRecord.currency || "INR",
                      )}
                  </div>
                </div>
              </div>

              {/* Signatures & Audit Trail */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] text-slate-400 uppercase font-mono">
                    Prepared By
                  </p>
                  <p className="font-bold text-slate-800 mt-1">
                    {viewingRecord.preparedBy || viewingRecord.createdBy || "-"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {viewingRecord.createdAt ||
                      viewingRecord.createEditDate ||
                      ""}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] text-slate-400 uppercase font-mono">
                    Checked & Authorized By
                  </p>
                  <p className="font-bold text-slate-800 mt-1">
                    {viewingRecord.checkedBy || "Authorized Signatory"}
                  </p>
                  {viewingRecord.editBy && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Last edited by {viewingRecord.editBy} (
                      {viewingRecord.editTimestamp || ""})
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Record ID: {viewingRecord.id}
              </span>
              <div className="flex gap-2">
                {/* {canEdit && (
                  <button
                    onClick={() => {
                      const rec = { ...viewingRecord };
                      setViewingRecord(null);
                      setEditingRecord(rec);
                    }}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition"
                  >
                    Edit Record
                  </button>
                )} */}
                <button
                  onClick={() => setViewingRecord(null)}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900">
                  Delete Purchase Order
                </h4>
                <p className="text-xs text-slate-500">
                  This action will delete the row in Google Sheets via Apps
                  Script.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 my-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
              Are you sure you want to permanently delete PO{" "}
              <span className="font-bold font-mono text-slate-900">
                {deletingRecord.poNumber}
              </span>{" "}
              for supplier{" "}
              <span className="font-bold text-slate-900">
                {deletingRecord.supplierName}
              </span>
              ?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeletePo(deletingRecord.id);
                  setDeletingRecord(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Delete PO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD MODAL FOR SUPPLIER / PRODUCT */}
      {/*
      {quickAddType && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200">
            <h4 className="font-bold text-sm text-slate-900 mb-1">
              Add New {quickAddType === "supplier" ? "Supplier" : "Product"}
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Enter name to save into Firestore dropdown master list.
            </p>
            <form onSubmit={handleQuickAddSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {quickAddType === "supplier" ? "Supplier Name *" : "Product Name *"}
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder={quickAddType === "supplier" ? "e.g. Acme Chemicals Ltd" : "e.g. Product Name"}
                  value={quickAddValue}
                  onChange={(e) => setQuickAddValue(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {quickAddType === "supplier" && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Supplier GSTIN (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      value={quickAddSupplierGst}
                      onChange={(e) => setQuickAddSupplierGst(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Supplier Address (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai, Maharashtra"
                      value={quickAddSupplierAddress}
                      onChange={(e) => setQuickAddSupplierAddress(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setQuickAddType(null);
                    setQuickAddValue("");
                    setQuickAddSupplierGst("");
                    setQuickAddSupplierAddress("");
                  }}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      */}

      {/* Reusable Full Screen Loader */}
      <FullScreenLoader show={isSubmitting} message={loaderMessage} />
    </div>
  );
}

/**
 * Normalizes rows fetched from Google Sheets via Apps Script into standard PoRecord shape.
 * Accommodates exact user requested headers and camelCase properties.
 */
function normalizePoRow(row: any, defaultUserName: string): PoRecord {
  const idVal =
    row.id ||
    row["PO Number"] ||
    row.poNumber ||
    `po-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const poDateVal = row["PO Date"] || row.poDate || row.date || "";
  const poNumberVal = row["PO Number"] || row.poNumber || "";
  const supplierNameVal = row["Supplier Name"] || row.supplierName || "";
  const supplierGstinVal = row["Supplier GSTIN"] || row.supplierGstin || "";
  const supplierAddressVal =
    row["Supplier Address"] || row.supplierAddress || "";
  const createEditDateVal = row["Create/Edit Date"] || row.createEditDate || "";
  const cpNameVal = row["CP Name"] || row.cpName || "";
  const cpNumberVal = row["CP Number"] || row.cpNumber || "";
  const cpEmailIdVal = row["CP Email ID"] || row.cpEmailId || "";
  const deliveryLocationVal =
    row["Delivery Location"] || row.deliveryLocation || "";
  const billingLocationVal =
    row["Billing Location"] || row.billingLocation || "";
  const shipToAddressVal = row["Ship To Address"] || row.shipToAddress || "";
  const billToAddressVal = row["Bill To Address"] || row.billToAddress || "";
  const shipToGstVal = row["Ship To GST"] || row.shipToGst || "";
  const billToGstVal = row["Bill To GST"] || row.billToGst || "";
  const preparedByVal = row["Prepared By"] || row.preparedBy || defaultUserName;
  const checkedByVal = row["Checked By"] || row.checkedBy || "";
  const spNameVal = row["SP Name"] || row.spName || "";
  const spPhoneNumberVal = row["SP Phone Number"] || row.spPhoneNumber || "";
  const spEmailIdVal = row["SP Email Id"] || row.spEmailId || "";
  const paymentTermsVal = row["Payment Terms"] || row.paymentTerms || "";
  const deliveryTermsVal = row["Delivery Terms"] || row.deliveryTerms || "";
  const otherTermsVal = row["Other Terms"] || row.otherTerms || "";
  const currencyVal = row["Currency"] || row.currency || "INR";
  const isInr = (currencyVal || "INR").toUpperCase() === "INR";
  const subTotalVal = parseFloat(row["Sub Total"] || row.subTotal) || 0;
  const gstVal = isInr ? parseFloat(row["GST"] || row.gst) || 0 : 0;
  const totalInNumVal =
    parseFloat(row["Total (In Num)"] || row.totalInNum) ||
    (isInr ? subTotalVal + gstVal : subTotalVal);
  const totalInWordVal =
    row["Total (In Word)"] ||
    row.totalInWord ||
    formatAmountInWords(totalInNumVal, currencyVal);
  const productDescription1Val =
    row["Product Description 1"] || row.productDescription1 || "";
  const packingKgs1Val = row["Packing/Kgs 1"] || row.packingKgs1 || "";
  const packs1Val = parseFloat(row["Packs 1"] || row.packs1) || 0;
  const totalQty1Val = parseFloat(row["Total Qty 1"] || row.totalQty1) || 0;
  const rate1Val = parseFloat(row["Rate 1"] || row.rate1) || 0;
  const amount1Val =
    parseFloat(row["Amount 1"] || row.amount1) || totalQty1Val * rate1Val;
  const createdByVal = row["Created By"] || row.createdBy || defaultUserName;
  const editByVal = row["Edit By"] || row.editBy || "";
  const editTimestampVal = row["Edit Timestamp"] || row.editTimestamp || "";
  const createdAtVal =
    row["Created_at"] || row.createdAt || new Date().toISOString();
  const poPdfUrlVal =
    row["PDF File URLs"] ||
    row.poPdfUrl ||
    row["PDF File URL"] ||
    row["Pdf File Url"] ||
    row["pdf_url"] ||
    row["pdfUrl"] ||
    "";

  const record: PoRecord = {
    id: idVal,
    createdAt: createdAtVal,
    poDate: poDateVal,
    poNumber: poNumberVal,
    supplierName: supplierNameVal,
    supplierGstin: supplierGstinVal,
    supplierAddress: supplierAddressVal,
    createEditDate: createEditDateVal,
    cpName: cpNameVal,
    cpNumber: cpNumberVal,
    cpEmailId: cpEmailIdVal,
    deliveryLocation: deliveryLocationVal,
    billingLocation: billingLocationVal,
    shipToAddress: shipToAddressVal,
    billToAddress: billToAddressVal,
    shipToGst: shipToGstVal,
    billToGst: billToGstVal,
    preparedBy: preparedByVal,
    checkedBy: checkedByVal,
    spName: spNameVal,
    spPhoneNumber: spPhoneNumberVal,
    spEmailId: spEmailIdVal,
    paymentTerms: paymentTermsVal,
    deliveryTerms: deliveryTermsVal,
    otherTerms: otherTermsVal,
    currency: currencyVal,
    subTotal: subTotalVal,
    gst: gstVal,
    totalInNum: totalInNumVal,
    totalInWord: totalInWordVal,
    productDescription1: productDescription1Val,
    packingKgs1: packingKgs1Val,
    packs1: packs1Val,
    totalQty1: totalQty1Val,
    rate1: rate1Val,
    amount1: amount1Val,
    createdBy: createdByVal,
    editBy: editByVal,
    editTimestamp: editTimestampVal,
    poPdfUrl:poPdfUrlVal,
  };

  // Extract products 2 to 7 if present
  for (let i = 2; i <= 7; i++) {
    const desc =
      row[`Product Description ${i}`] || row[`productDescription${i}`] || "";
    const packing = row[`Packing/Kgs ${i}`] || row[`packingKgs${i}`] || "";
    const pRaw =
      row[`Packs ${i}`] !== undefined && row[`Packs ${i}`] !== ""
        ? row[`Packs ${i}`]
        : row[`packs${i}`];
    const qRaw =
      row[`Total Qty ${i}`] !== undefined && row[`Total Qty ${i}`] !== ""
        ? row[`Total Qty ${i}`]
        : row[`totalQty${i}`];
    const rRaw =
      row[`Rate ${i}`] !== undefined && row[`Rate ${i}`] !== ""
        ? row[`Rate ${i}`]
        : row[`rate${i}`];
    const aRaw =
      row[`Amount ${i}`] !== undefined && row[`Amount ${i}`] !== ""
        ? row[`Amount ${i}`]
        : row[`amount${i}`];

    if (
      desc ||
      pRaw !== undefined ||
      qRaw !== undefined ||
      rRaw !== undefined ||
      aRaw !== undefined
    ) {
      (record as any)[`productDescription${i}`] = desc;
      (record as any)[`packingKgs${i}`] = packing;
      (record as any)[`packs${i}`] =
        pRaw !== undefined && pRaw !== "" ? parseFloat(pRaw) || 0 : undefined;
      (record as any)[`totalQty${i}`] =
        qRaw !== undefined && qRaw !== "" ? parseFloat(qRaw) || 0 : undefined;
      (record as any)[`rate${i}`] =
        rRaw !== undefined && rRaw !== "" ? parseFloat(rRaw) || 0 : undefined;
      (record as any)[`amount${i}`] =
        aRaw !== undefined && aRaw !== "" ? parseFloat(aRaw) || 0 : undefined;
    }
  }

  return record;
}
