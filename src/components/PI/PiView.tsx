/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import {
  User,
  Client,
  PaymentBank,
  Product,
  AolGodown,
  FreightTerm,
  PiRecord,
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
  FileSpreadsheet,
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
  Landmark,
} from "lucide-react";
import { DateRangeFilterPopup } from "../Utility/DateRangeFilterPopup";
import AppsScriptSyncBanner, {
  useAppsScriptSync,
} from "../Utility/AppsScriptSyncBanner";
import {
  formatAmountInWords,
  formatNumberForCurrency,
} from "../../lib/numberToWords";
import { FullScreenLoader } from "../Utility/FullScreenLoader";

/**
 * Calculates sum of quantities across populated products (1..4) for a PI.
 */
export function getPiTotalQty(rec: PiRecord): number {
  let sum = 0;
  for (let i = 1; i <= 4; i++) {
    const q = (rec as any)[`productQty${i}`];
    if (q !== undefined && q !== null && q !== "") {
      sum += Number(q) || 0;
    }
  }
  return sum;
}

/**
 * Extracts list of populated products (1..4) from a PiRecord.
 */
export function getPiProductsList(rec: PiRecord): Array<{
  slot: number;
  productName: string;
  qty: number;
  rate: number;
  amount: number;
}> {
  const list: Array<{
    slot: number;
    productName: string;
    qty: number;
    rate: number;
    amount: number;
  }> = [];

  for (let i = 1; i <= 4; i++) {
    const name = (rec as any)[`productName${i}`];
    const qty = (rec as any)[`productQty${i}`];
    const rate = (rec as any)[`productRate${i}`];
    const amount = (rec as any)[`amount${i}`];

    if (name || qty || amount || (i === 1 && rec.productName1)) {
      list.push({
        slot: i,
        productName: name || (i === 1 ? rec.productName1 : "") || "",
        qty: Number(qty ?? (i === 1 ? rec.productQty1 : 0)) || 0,
        rate: Number(rate ?? (i === 1 ? rec.productRate1 : 0)) || 0,
        amount: Number(amount ?? (i === 1 ? rec.amount1 : 0)) || 0,
      });
    }
  }

  if (list.length === 0) {
    list.push({
      slot: 1,
      productName: rec.productName1 || "",
      qty: Number(rec.productQty1) || 0,
      rate: Number(rec.productRate1) || 0,
      amount: Number(rec.amount1) || 0,
    });
  }

  return list;
}

export interface ClientOptionItem {
  id: string;
  companyName: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  gst: string;
  city?: string;
}

interface SearchableClientSelectProps {
  value: string;
  onChange: (value: string, matched?: ClientOptionItem) => void;
  clients: ClientOptionItem[];
  placeholder?: string;
  required?: boolean;
  accentColor?: "emerald" | "amber";
}

function SearchableClientSelect({
  value,
  onChange,
  clients,
  placeholder = "Type to search or enter company name...",
  required = false,
  accentColor = "emerald",
}: SearchableClientSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || "");
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  const filteredClients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter(
      (c) =>
        c.companyName.toLowerCase().includes(term) ||
        c.fullName.toLowerCase().includes(term) ||
        (c.address && c.address.toLowerCase().includes(term)) ||
        (c.phone && c.phone.toLowerCase().includes(term)) ||
        (c.gst && c.gst.toLowerCase().includes(term)),
    );
  }, [clients, searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearchTerm(text);
    const matched = clients.find(
      (c) => c.companyName.trim().toLowerCase() === text.trim().toLowerCase(),
    );
    onChange(text, matched);
    if (!isOpen) setIsOpen(true);
  };

  const handleSelect = (item: ClientOptionItem) => {
    setSearchTerm(item.companyName);
    onChange(item.companyName, item);
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
              filteredClients.length > 0
            ) {
              e.preventDefault();
              handleSelect(filteredClients[0]);
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
            title="Toggle customer list"
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
              {filteredClients.length} customer
              {filteredClients.length === 1 ? "" : "s"} (sorted A-Z)
            </span>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {filteredClients.length > 0 ? (
              filteredClients.map((cl) => {
                const isSelected =
                  value.trim().toLowerCase() ===
                  cl.companyName.trim().toLowerCase();
                return (
                  <button
                    key={cl.id}
                    type="button"
                    onClick={() => handleSelect(cl)}
                    className={`w-full text-left px-3 py-2.5 hover:bg-emerald-50/80 transition flex items-start justify-between gap-2 group ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-950 font-bold border-l-4 border-emerald-600"
                        : "text-slate-700"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-900 group-hover:text-emerald-900">
                        {cl.companyName}
                      </div>
                      {(cl.fullName || cl.phone || cl.address) && (
                        <div className="mt-0.5 text-[11px] text-slate-500 font-mono flex items-center gap-2 flex-wrap">
                          {cl.fullName && (
                            <span className="font-semibold text-slate-700">
                              {cl.fullName}
                            </span>
                          )}
                          {cl.phone && <span>• {cl.phone}</span>}
                          {cl.address && (
                            <span
                              className="truncate max-w-[220px]"
                              title={cl.address}
                            >
                              • {cl.address}
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
                <p>No existing customer matches &quot;{searchTerm}&quot;.</p>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Use &quot;{searchTerm}&quot;
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface PiProductSlotForm {
  productName: string;
  productQty: string;
  productRate: string;
  amount: number;
}

export interface PiViewProps {
  activeUserId: string;
  activeUser?: User;
  users: User[];
  piRecords?: PiRecord[];
  clients?: Client[];
  paymentBanks?: PaymentBank[];
  aolGodowns?: AolGodown[];
  products?: Product[];
  freightTerms?: FreightTerm[];
  onAddPi: (record: Omit<PiRecord, "id" | "createdAt">) => Promise<boolean>;
  onUpdatePi: (record: PiRecord) => Promise<boolean>;
  onGeneratePdf: (rec: PiRecord, sheetName?: string) => Promise<string | null>;
  onDeletePi: (id: string) => void;
  canAdd?: boolean;
  canEdit?: boolean;
  onRefreshPiRecords?: () => Promise<void> | void;
}

export default function PiView({
  activeUserId,
  activeUser: activeUserProp,
  users = [],
  piRecords = [],
  clients = [],
  paymentBanks = [],
  aolGodowns = [],
  products = [],
  freightTerms = [],
  onAddPi,
  onUpdatePi,
  onGeneratePdf,
  onDeletePi,
  canAdd = true,
  canEdit = true,
  onRefreshPiRecords,
}: PiViewProps) {
  const activeUser =
    users.find(
      (u) =>
        (u.id || "").trim().toLowerCase() ===
          (activeUserId || "").trim().toLowerCase() ||
        (u.email &&
          u.email.trim().toLowerCase() ===
            (activeUserId || "").trim().toLowerCase()),
    ) || activeUserProp;

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterProduct, setFilterProduct] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateFilterType, setDateFilterType] = useState<"entry" | "invoice">(
    "invoice",
  );

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PiRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<PiRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<PiRecord | null>(null);

  // Full Screen Loading Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState(
    "Saving Proforma Invoice to Google Sheet...",
  );

  // PDF Generation State
  const [generatingPdfIds, setGeneratingPdfIds] = useState<
    Record<string, boolean>
  >({});
  const [localPdfUrls, setLocalPdfUrls] = useState<{ [id: string]: string }>(
    {},
  );

  // Google Sheets Apps Script Integration
  const { config, syncStatus, setSyncStatus } =
    useAppsScriptSync(
      "proforma_invoices_apps_script",
      "PI",
      "proforma_invoices",
      undefined,
    );

  // Sorted client list for searchable Bill To / Ship To dropdowns
  const sortedClientsMaster = useMemo<ClientOptionItem[]>(() => {
    const list: ClientOptionItem[] = [];
    const seen = new Set<string>();

    clients.forEach((c) => {
      const companyName = (c.companyName || c.fullName || "").trim();
      if (companyName && !seen.has(companyName.toLowerCase())) {
        seen.add(companyName.toLowerCase());
        list.push({
          id: c.id,
          companyName,
          fullName: (c.fullName || "").trim(),
          phone: (c.phone || "").trim(),
          email: (c.email || "").trim(),
          address: (c.address || "").trim(),
          gst: (c.gst || "").trim(),
          city: (c.city || "").trim(),
        });
      }
    });

    return list.sort((a, b) =>
      a.companyName.localeCompare(b.companyName, undefined, {
        sensitivity: "base",
      }),
    );
  }, [clients]);

  const allAolGodownNames = useMemo(() => {
    const set = new Set<string>();
    aolGodowns.forEach((g) => g?.name && set.add(g.name.trim()));
    return Array.from(set).sort();
  }, [aolGodowns]);

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

  const formatBankLabel = (bank: PaymentBank) => {
    const parts = [bank.bankName, bank.branch].filter(Boolean);
    return parts.join(" - ");
  };

  // Users belonging to Sales team (case-insensitive match on teamName containing "sales")
  const salesTeamUsers = useMemo(() => {
    return users
      .filter((u) => {
        const team = (u.teamName || "").trim().toLowerCase();
        return team.includes("sales") && u.status !== "disabled";
      })
      .sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", undefined, {
          sensitivity: "base",
        }),
      );
  }, [users]);

  // ==================== CREATE FORM STATES ====================
  const [formCreateEditDate, setFormCreateEditDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [formBuyersOrderNumber, setFormBuyersOrderNumber] = useState("");
  const [formOrderPlacedBy, setFormOrderPlacedBy] = useState("");
  const [formCustomerMobileNumber, setFormCustomerMobileNumber] = useState("");
  const [formCustomerEmailId, setFormCustomerEmailId] = useState("");

  const [formBillToCompanyName, setFormBillToCompanyName] = useState("");
  const [formBillToAddress, setFormBillToAddress] = useState("");
  const [formSameAsBillTo, setFormSameAsBillTo] = useState(false);
  const [formShipToCompanyName, setFormShipToCompanyName] = useState("");
  const [formShipToAddress, setFormShipToAddress] = useState("");

  const [formPaymentTerms, setFormPaymentTerms] = useState(
    "100% Advance Against PI",
  );
  const [formOtherTerms, setFormOtherTerms] = useState("");
  const [formDeliveryNoteTerms, setFormDeliveryNoteTerms] = useState("");
  const [formPartyRemark, setFormPartyRemark] = useState("");

  const [formAolBankAccount, setFormAolBankAccount] = useState("");
  const [formAccountNo, setFormAccountNo] = useState("");
  const [formIfscCode, setFormIfscCode] = useState("");

  const [formAolBranchGodown, setFormAolBranchGodown] = useState(
    allAolGodownNames[0] || "",
  );
  const [formAolBranchAddress, setFormAolBranchAddress] = useState("");
  const [formAolBranchGstin, setFormAolBranchGstin] = useState("");

  const [formAolSalesPersonName, setFormAolSalesPersonName] = useState(
    activeUser?.name || "",
  );
  const [formAolSalesPersonEmail, setFormAolSalesPersonEmail] = useState(
    activeUser?.email || "",
  );

  // Dynamic products (up to 4 max)
  const [formProducts, setFormProducts] = useState<PiProductSlotForm[]>([
    { productName: "", productQty: "", productRate: "", amount: 0 },
  ]);

  const [formFreightCharges, setFormFreightCharges] = useState<string>("0");
  const [formGstPercent, setFormGstPercent] = useState<string>("18");
  const [formTcsApplicableOrNot, setFormTcsApplicableOrNot] =
    useState<string>("No");

  const [formSubTotal, setFormSubTotal] = useState<number>(0);
  const [formGst, setFormGst] = useState<number>(0);
  const [formTcsAmount, setFormTcsAmount] = useState<number>(0);
  const [formTotalInNum, setFormTotalInNum] = useState<number>(0);
  const [formAmountInWord, setFormAmountInWord] = useState<string>(
    "Rupees Zero Only",
  );

  // ==================== CREATE CALCULATIONS ====================
  const recalcCreateTotals = (
    prodList: PiProductSlotForm[],
    freightStr: string,
    gstPctStr: string,
    tcsFlag: string,
  ) => {
    const subTotal = Number(
      prodList.reduce((acc, p) => acc + (p.amount || 0), 0).toFixed(2),
    );
    const freight = parseFloat(freightStr) || 0;
    const gstPct = parseFloat(gstPctStr) || 0;
    const taxableBase = subTotal + freight;
    const gstAmount = Number(((taxableBase * gstPct) / 100).toFixed(2));
    const isTcsYes = tcsFlag.trim().toLowerCase() === "yes";
    const tcsAmount = isTcsYes
      ? Number((((taxableBase + gstAmount) * 0.1) / 100).toFixed(2))
      : 0;
    const grandTotal = Number(
      (taxableBase + gstAmount + tcsAmount).toFixed(2),
    );

    setFormSubTotal(subTotal);
    setFormGst(gstAmount);
    setFormTcsAmount(tcsAmount);
    setFormTotalInNum(grandTotal);
    setFormAmountInWord(formatAmountInWords(grandTotal, "INR"));
  };

  const handleCreateProductChange = (
    idx: number,
    field: keyof PiProductSlotForm,
    val: string,
  ) => {
    const updated = [...formProducts];
    const target = { ...updated[idx], [field]: val };

    if (field === "productQty" || field === "productRate") {
      const q =
        parseFloat(field === "productQty" ? val : target.productQty) || 0;
      const r =
        parseFloat(field === "productRate" ? val : target.productRate) || 0;
      target.amount = Number((q * r).toFixed(2));
    }

    updated[idx] = target;
    setFormProducts(updated);
    recalcCreateTotals(
      updated,
      formFreightCharges,
      formGstPercent,
      formTcsApplicableOrNot,
    );
  };

  const handleAddCreateProduct = () => {
    if (formProducts.length >= 4) return;
    const updated = [
      ...formProducts,
      { productName: "", productQty: "", productRate: "", amount: 0 },
    ];
    setFormProducts(updated);
  };

  const handleRemoveCreateProduct = (idx: number) => {
    if (formProducts.length <= 1) return;
    const updated = formProducts.filter((_, i) => i !== idx);
    setFormProducts(updated);
    recalcCreateTotals(
      updated,
      formFreightCharges,
      formGstPercent,
      formTcsApplicableOrNot,
    );
  };

  // ==================== CREATE AUTO-FILL HANDLERS ====================
  const handleSelectBillToClientForCreate = (
    selectedName: string,
    matched?: ClientOptionItem,
  ) => {
    setFormBillToCompanyName(selectedName);
    const found =
      matched ||
      sortedClientsMaster.find(
        (c) =>
          c.companyName.trim().toLowerCase() ===
          selectedName.trim().toLowerCase(),
      );

    if (found) {
      setFormBillToAddress(found.address || "");
      if (found.fullName) setFormOrderPlacedBy(found.fullName);
      if (found.phone) setFormCustomerMobileNumber(found.phone);
      if (found.email) setFormCustomerEmailId(found.email);

      if (formSameAsBillTo) {
        setFormShipToCompanyName(found.companyName);
        setFormShipToAddress(found.address || "");
      }
    } else if (formSameAsBillTo) {
      setFormShipToCompanyName(selectedName);
    }
  };

  const handleSelectShipToClientForCreate = (
    selectedName: string,
    matched?: ClientOptionItem,
  ) => {
    setFormSameAsBillTo(false);
    setFormShipToCompanyName(selectedName);
    const found =
      matched ||
      sortedClientsMaster.find(
        (c) =>
          c.companyName.trim().toLowerCase() ===
          selectedName.trim().toLowerCase(),
      );
    if (found) {
      setFormShipToAddress(found.address || "");
    }
  };

  const handleToggleSameAsBillToCreate = (checked: boolean) => {
    setFormSameAsBillTo(checked);
    if (checked) {
      setFormShipToCompanyName(formBillToCompanyName);
      setFormShipToAddress(formBillToAddress);
    }
  };

  const handleSelectBankForCreate = (selectedBankVal: string) => {
    setFormAolBankAccount(selectedBankVal);
    const found = paymentBanks.find(
      (b) =>
        formatBankLabel(b).toLowerCase() ===
          selectedBankVal.trim().toLowerCase() ||
        b.bankName.trim().toLowerCase() ===
          selectedBankVal.trim().toLowerCase(),
    );
    if (found) {
      setFormAccountNo(found.accountNumber || "");
      setFormIfscCode(found.ifscCode || "");
    } else {
      setFormAccountNo("");
      setFormIfscCode("");
    }
  };

  const handleSelectAolGodownForCreate = (selectedGodown: string) => {
    setFormAolBranchGodown(selectedGodown);
    const found = aolGodowns.find(
      (g) => g.name.trim().toLowerCase() === selectedGodown.trim().toLowerCase(),
    );
    if (found) {
      setFormAolBranchAddress(found.address || "");
      setFormAolBranchGstin(found.gstin || "");
    } else {
      setFormAolBranchAddress("");
      setFormAolBranchGstin("");
    }
  };

  const handleSelectSalesPersonForCreate = (selectedName: string) => {
    setFormAolSalesPersonName(selectedName);
    const found = users.find(
      (u) => u.name.trim().toLowerCase() === selectedName.trim().toLowerCase(),
    );
    if (found) {
      setFormAolSalesPersonEmail(found.email || "");
    } else {
      setFormAolSalesPersonEmail("");
    }
  };

  // ==================== OPEN CREATE MODAL ====================
  const handleOpenCreate = () => {
    const today = new Date().toISOString().split("T")[0];
    setFormCreateEditDate(today);
    setFormBuyersOrderNumber("");
    setFormOrderPlacedBy("");
    setFormCustomerMobileNumber("");
    setFormCustomerEmailId("");
    setFormBillToCompanyName("");
    setFormBillToAddress("");
    setFormSameAsBillTo(false);
    setFormShipToCompanyName("");
    setFormShipToAddress("");
    setFormPaymentTerms("100% Advance Against PI");
    setFormOtherTerms("");
    setFormDeliveryNoteTerms("");
    setFormPartyRemark("");

    const defaultBank = paymentBanks[0];
    if (defaultBank) {
      setFormAolBankAccount(formatBankLabel(defaultBank));
      setFormAccountNo(defaultBank.accountNumber || "");
      setFormIfscCode(defaultBank.ifscCode || "");
    } else {
      setFormAolBankAccount("");
      setFormAccountNo("");
      setFormIfscCode("");
    }

    const defaultGodown = aolGodowns[0];
    if (defaultGodown) {
      setFormAolBranchGodown(defaultGodown.name);
      setFormAolBranchAddress(defaultGodown.address || "");
      setFormAolBranchGstin(defaultGodown.gstin || "");
    } else {
      setFormAolBranchGodown("");
      setFormAolBranchAddress("");
      setFormAolBranchGstin("");
    }

    const defaultSalesUser = salesTeamUsers.find(
      (u) => u.id === activeUser?.id,
    );
    setFormAolSalesPersonName(defaultSalesUser?.name || "");
    setFormAolSalesPersonEmail(defaultSalesUser?.email || "");

    const initProds: PiProductSlotForm[] = [
      { productName: "", productQty: "", productRate: "", amount: 0 },
    ];
    setFormProducts(initProds);
    setFormFreightCharges("0");
    setFormGstPercent("18");
    setFormTcsApplicableOrNot("No");
    recalcCreateTotals(initProds, "0", "18", "No");
    setIsCreateModalOpen(true);
  };

  // ==================== EDIT FORM STATES ====================
  const [editProducts, setEditProducts] = useState<PiProductSlotForm[]>([]);
  const [editGstPercent, setEditGstPercent] = useState<string>("18");

  const handleOpenEdit = (rec: PiRecord) => {
    const existingList = getPiProductsList(rec);
    const mapped: PiProductSlotForm[] = existingList.map((p) => ({
      productName: p.productName || "",
      productQty: p.qty ? String(p.qty) : "",
      productRate: p.rate ? String(p.rate) : "",
      amount: p.amount || 0,
    }));
    if (mapped.length === 0) {
      mapped.push({
        productName: "",
        productQty: "",
        productRate: "",
        amount: 0,
      });
    }
    setEditProducts(mapped);

    const sub = Number(rec.subTotal || 0);
    const freight = Number(rec.freightCharges || 0);
    const base = sub + freight;
    if (base > 0 && rec.gst) {
      const approxPct = Math.round((rec.gst / base) * 100);
      if ([0, 5, 12, 18, 28].includes(approxPct)) {
        setEditGstPercent(String(approxPct));
      } else {
        setEditGstPercent("18");
      }
    } else {
      setEditGstPercent(rec.gst === 0 ? "0" : "18");
    }

    setEditingRecord({ ...rec });
  };

  const recalcEditTotals = (
    prodList: PiProductSlotForm[],
    recState: PiRecord,
    gstPctStr: string,
  ) => {
    const subTotal = Number(
      prodList.reduce((acc, p) => acc + (p.amount || 0), 0).toFixed(2),
    );
    const freight = Number(recState.freightCharges || 0);
    const gstPct = parseFloat(gstPctStr) || 0;
    const taxableBase = subTotal + freight;
    const gstAmount = Number(((taxableBase * gstPct) / 100).toFixed(2));
    const isTcsYes =
      (recState.tcsApplicableOrNot || "").trim().toLowerCase() === "yes";
    const tcsAmount = isTcsYes
      ? Number((((taxableBase + gstAmount) * 0.1) / 100).toFixed(2))
      : 0;
    const totalInNum = Number(
      (taxableBase + gstAmount + tcsAmount).toFixed(2),
    );
    const amountInWord = formatAmountInWords(totalInNum, "INR");

    setEditingRecord({
      ...recState,
      subTotal,
      gst: gstAmount,
      tcsAmount,
      totalInNum,
      amountInWord,
    });
  };

  const handleEditProductChange = (
    idx: number,
    field: keyof PiProductSlotForm,
    val: string,
  ) => {
    if (!editingRecord) return;
    const updated = [...editProducts];
    const target = { ...updated[idx], [field]: val };

    if (field === "productQty" || field === "productRate") {
      const q =
        parseFloat(field === "productQty" ? val : target.productQty) || 0;
      const r =
        parseFloat(field === "productRate" ? val : target.productRate) || 0;
      target.amount = Number((q * r).toFixed(2));
    }

    updated[idx] = target;
    setEditProducts(updated);
    recalcEditTotals(updated, editingRecord, editGstPercent);
  };

  const handleAddEditProduct = () => {
    if (editProducts.length >= 4) return;
    setEditProducts([
      ...editProducts,
      { productName: "", productQty: "", productRate: "", amount: 0 },
    ]);
  };

  const handleRemoveEditProduct = (idx: number) => {
    if (!editingRecord || editProducts.length <= 1) return;
    const updated = editProducts.filter((_, i) => i !== idx);
    setEditProducts(updated);
    recalcEditTotals(updated, editingRecord, editGstPercent);
  };

  const handleSelectBillToClientForEdit = (
    selectedName: string,
    matched?: ClientOptionItem,
  ) => {
    if (!editingRecord) return;
    const found =
      matched ||
      sortedClientsMaster.find(
        (c) =>
          c.companyName.trim().toLowerCase() ===
          selectedName.trim().toLowerCase(),
      );
    setEditingRecord({
      ...editingRecord,
      billToCompanyName: selectedName,
      billToAddress: found?.address ?? editingRecord.billToAddress,
      orderPlacedBy: found?.fullName || editingRecord.orderPlacedBy,
      customerMobileNumber:
        found?.phone || editingRecord.customerMobileNumber,
      customerEmailId: found?.email || editingRecord.customerEmailId,
    });
  };

  const handleSelectShipToClientForEdit = (
    selectedName: string,
    matched?: ClientOptionItem,
  ) => {
    if (!editingRecord) return;
    const found =
      matched ||
      sortedClientsMaster.find(
        (c) =>
          c.companyName.trim().toLowerCase() ===
          selectedName.trim().toLowerCase(),
      );
    setEditingRecord({
      ...editingRecord,
      shipToCompanyName: selectedName,
      shipToAddress: found?.address ?? editingRecord.shipToAddress,
    });
  };

  const handleSelectBankForEdit = (selectedBankVal: string) => {
    if (!editingRecord) return;
    const found = paymentBanks.find(
      (b) =>
        formatBankLabel(b).toLowerCase() ===
          selectedBankVal.trim().toLowerCase() ||
        b.bankName.trim().toLowerCase() ===
          selectedBankVal.trim().toLowerCase(),
    );
    setEditingRecord({
      ...editingRecord,
      aolBankAccount: selectedBankVal,
      accountNo: found?.accountNumber ?? "",
      ifscCode: found?.ifscCode ?? "",
    });
  };

  const handleSelectAolGodownForEdit = (selectedGodown: string) => {
    if (!editingRecord) return;
    const found = aolGodowns.find(
      (g) => g.name.trim().toLowerCase() === selectedGodown.trim().toLowerCase(),
    );
    setEditingRecord({
      ...editingRecord,
      aolBranchGodown: selectedGodown,
      aolBranchAddress: found?.address ?? "",
      aolBranchGstin: found?.gstin ?? "",
    });
  };

  const handleSelectSalesPersonForEdit = (selectedName: string) => {
    if (!editingRecord) return;
    const found = users.find(
      (u) => u.name.trim().toLowerCase() === selectedName.trim().toLowerCase(),
    );
    setEditingRecord({
      ...editingRecord,
      aolSalesPersonName: selectedName,
      aolSalesPersonEmail: found?.email ?? "",
    });
  };

  // ==================== SUBMIT CREATE PI ====================
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBillToCompanyName.trim()) {
      alert("Company Name (Bill To - Customer Billing Name) is required.");
      return;
    }
    if (!formProducts[0]?.productName?.trim()) {
      alert("Product Name 1 is required.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const freightVal = parseFloat(formFreightCharges) || 0;

    const newRecord: Omit<PiRecord, "id" | "createdAt"> = {
      piDate: today,
      piNumber: "",
      createEditDate: formCreateEditDate || today,

      orderPlacedBy: formOrderPlacedBy.trim(),
      customerMobileNumber: formCustomerMobileNumber.trim(),
      customerEmailId: formCustomerEmailId.trim(),
      billToCompanyName: formBillToCompanyName.trim(),
      billToAddress: formBillToAddress.trim(),
      shipToCompanyName: formShipToCompanyName.trim(),
      shipToAddress: formShipToAddress.trim(),
      buyersOrderNumber: formBuyersOrderNumber.trim(),

      paymentTerms: formPaymentTerms.trim(),
      otherTerms: formOtherTerms.trim(),
      aolBankAccount: formAolBankAccount.trim(),
      accountNo: formAccountNo.trim(),
      ifscCode: formIfscCode.trim(),
      aolBranchGodown: formAolBranchGodown.trim(),
      aolBranchAddress: formAolBranchAddress.trim(),
      aolBranchGstin: formAolBranchGstin.trim(),
      aolSalesPersonName: formAolSalesPersonName.trim(),
      aolSalesPersonEmail: formAolSalesPersonEmail.trim(),

      // Product 1
      productName1: formProducts[0]?.productName?.trim() || "",
      productQty1: parseFloat(formProducts[0]?.productQty) || 0,
      productRate1: parseFloat(formProducts[0]?.productRate) || 0,
      amount1: formProducts[0]?.amount || 0,

      // Product 2
      productName2: formProducts[1]?.productName?.trim() || "",
      productQty2:
        formProducts[1] && formProducts[1].productQty !== ""
          ? parseFloat(formProducts[1].productQty) || 0
          : undefined,
      productRate2:
        formProducts[1] && formProducts[1].productRate !== ""
          ? parseFloat(formProducts[1].productRate) || 0
          : undefined,
      amount2: formProducts[1] ? formProducts[1].amount || 0 : undefined,

      // Product 3
      productName3: formProducts[2]?.productName?.trim() || "",
      productQty3:
        formProducts[2] && formProducts[2].productQty !== ""
          ? parseFloat(formProducts[2].productQty) || 0
          : undefined,
      productRate3:
        formProducts[2] && formProducts[2].productRate !== ""
          ? parseFloat(formProducts[2].productRate) || 0
          : undefined,
      amount3: formProducts[2] ? formProducts[2].amount || 0 : undefined,

      // Product 4
      productName4: formProducts[3]?.productName?.trim() || "",
      productQty4:
        formProducts[3] && formProducts[3].productQty !== ""
          ? parseFloat(formProducts[3].productQty) || 0
          : undefined,
      productRate4:
        formProducts[3] && formProducts[3].productRate !== ""
          ? parseFloat(formProducts[3].productRate) || 0
          : undefined,
      amount4: formProducts[3] ? formProducts[3].amount || 0 : undefined,

      freightCharges: freightVal,
      tcsApplicableOrNot: formTcsApplicableOrNot,
      deliveryNoteTerms: formDeliveryNoteTerms.trim(),
      partyRemark: formPartyRemark.trim(),

      subTotal: formSubTotal,
      gst: formGst,
      tcsAmount: formTcsAmount,
      totalInNum: formTotalInNum,
      amountInWord:
        formAmountInWord.trim() || formatAmountInWords(formTotalInNum, "INR"),

      createdBy: activeUser?.name || "System",
      editBy: "",
      editTimestamp: "",
      createdByUserId: activeUserId,
    };

    setLoaderMessage("Saving Proforma Invoice to Google Sheet...");
    setIsSubmitting(true);

    try {
      const success = await onAddPi(newRecord);
      if (success) {
        setIsCreateModalOpen(false);
      }
    } catch (err: any) {
      alert(`An unexpected error occurred: ${err?.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== SUBMIT EDIT PI ====================
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const now = new Date();
    const editTimestamp = `${now.toISOString().split("T")[0]} ${now.toTimeString().split(" ")[0]}`;
    const today = now.toISOString().split("T")[0];
    const safeString = (val: any) => String(val ?? "").trim();

    const subTotal = Number(
      editProducts.reduce((acc, p) => acc + (p.amount || 0), 0).toFixed(2),
    );
    const freight = parseFloat(String(editingRecord.freightCharges || 0)) || 0;
    const gst = parseFloat(String(editingRecord.gst || 0)) || 0;
    const isTcsYes =
      (editingRecord.tcsApplicableOrNot || "").trim().toLowerCase() === "yes";
    const tcsAmount = isTcsYes
      ? parseFloat(String(editingRecord.tcsAmount || 0)) || 0
      : 0;
    const totalInNum = Number(
      (subTotal + freight + gst + tcsAmount).toFixed(2),
    );
    const amountInWord = formatAmountInWords(totalInNum, "INR");

    const updatedRec: PiRecord = {
      ...editingRecord,
      subTotal,
      freightCharges: freight,
      gst,
      tcsAmount,
      totalInNum,
      amountInWord,
      createEditDate: today,
      editBy: activeUser?.name || "System",
      editTimestamp,
      piPdfUrl: "", // Reset PDF URL so the row changes back to "Generate PDF" after editing

      // Product 1
      productName1: safeString(editProducts[0]?.productName),
      productQty1: parseFloat(String(editProducts[0]?.productQty)) || 0,
      productRate1: parseFloat(String(editProducts[0]?.productRate)) || 0,
      amount1: editProducts[0]?.amount || 0,

      // Product 2
      productName2: safeString(editProducts[1]?.productName),
      productQty2:
        editProducts[1] &&
        editProducts[1].productQty !== "" &&
        editProducts[1].productQty !== undefined
          ? parseFloat(String(editProducts[1].productQty)) || 0
          : undefined,
      productRate2:
        editProducts[1] &&
        editProducts[1].productRate !== "" &&
        editProducts[1].productRate !== undefined
          ? parseFloat(String(editProducts[1].productRate)) || 0
          : undefined,
      amount2: editProducts[1] ? editProducts[1].amount || 0 : undefined,

      // Product 3
      productName3: safeString(editProducts[2]?.productName),
      productQty3:
        editProducts[2] &&
        editProducts[2].productQty !== "" &&
        editProducts[2].productQty !== undefined
          ? parseFloat(String(editProducts[2].productQty)) || 0
          : undefined,
      productRate3:
        editProducts[2] &&
        editProducts[2].productRate !== "" &&
        editProducts[2].productRate !== undefined
          ? parseFloat(String(editProducts[2].productRate)) || 0
          : undefined,
      amount3: editProducts[2] ? editProducts[2].amount || 0 : undefined,

      // Product 4
      productName4: safeString(editProducts[3]?.productName),
      productQty4:
        editProducts[3] &&
        editProducts[3].productQty !== "" &&
        editProducts[3].productQty !== undefined
          ? parseFloat(String(editProducts[3].productQty)) || 0
          : undefined,
      productRate4:
        editProducts[3] &&
        editProducts[3].productRate !== "" &&
        editProducts[3].productRate !== undefined
          ? parseFloat(String(editProducts[3].productRate)) || 0
          : undefined,
      amount4: editProducts[3] ? editProducts[3].amount || 0 : undefined,
    };

    setLoaderMessage("Updating Proforma Invoice in Google Sheet...");
    setIsSubmitting(true);

    try {
      const success = await onUpdatePi(updatedRec);
      if (success) {
        const recKey = updatedRec.id || updatedRec.piNumber;
        setLocalPdfUrls((prev) => {
          const next = { ...prev };
          if (recKey) delete next[recKey];
          if (updatedRec.id) delete next[updatedRec.id];
          if (updatedRec.piNumber) delete next[updatedRec.piNumber];
          return next;
        });

        setViewingRecord((prev) => {
          if (
            prev &&
            (prev.id === updatedRec.id ||
              (prev.piNumber && prev.piNumber === updatedRec.piNumber))
          ) {
            return {
              ...updatedRec,
              piPdfUrl: "",
            };
          }
          return prev;
        });

        setEditingRecord(null);
      }
    } catch (err: any) {
      alert(`An unexpected error occurred while saving: ${err?.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== GENERATE PDF ====================
  const handleGeneratePdfClick = async (rec: PiRecord) => {
    const recId = rec.id || rec.piNumber;
    if (!recId) return;

    setGeneratingPdfIds((prev) => ({ ...prev, [recId]: true }));
    setLoaderMessage(
      "Generating PI PDF file, it may take upto 5 mins Kindly wait...",
    );
    setIsSubmitting(true);

    try {
      const pdfUrl = await onGeneratePdf(rec, config.sheetName || "PI");
      if (pdfUrl && typeof pdfUrl === "string") {
        setLocalPdfUrls((prev) => ({ ...prev, [recId]: pdfUrl }));
      }
    } catch (err: any) {
      alert(
        `An unexpected error occurred while generating PDF: ${err?.message || err}`,
      );
    } finally {
      setGeneratingPdfIds((prev) => {
        const next = { ...prev };
        delete next[recId];
        return next;
      });
      setIsSubmitting(false);
    }
  };

  // ==================== VISIBILITY, FILTER & KPI LOGIC ====================
  // Users in a Sales team only see their own PI records (matched by creator or AOL Sales Person); all other teams see all records
  const isSalesTeamUser = useMemo(() => {
    const team = (activeUser?.teamName || "").trim().toLowerCase();
    return team.includes("sales");
  }, [activeUser?.teamName]);

  const visiblePiRecords = useMemo(() => {
    if (!isSalesTeamUser) return piRecords;
    if (!activeUser) return [];

    const userIdNorm = (activeUser.id || "").trim().toLowerCase();
    const userNameNorm = (activeUser.name || "").trim().toLowerCase();
    const userEmailNorm = (activeUser.email || "").trim().toLowerCase();

    return piRecords.filter((rec) => {
      const recCreatorId = (rec.createdByUserId || "").trim().toLowerCase();
      const recCreatorName = (rec.createdBy || "").trim().toLowerCase();
      const recSalesPersonName = (rec.aolSalesPersonName || "")
        .trim()
        .toLowerCase();
      const recSalesPersonEmail = (rec.aolSalesPersonEmail || "")
        .trim()
        .toLowerCase();

      if (recCreatorId) {
        if (userIdNorm && recCreatorId === userIdNorm) return true;
        if (userEmailNorm && recCreatorId === userEmailNorm) return true;
      }
      if (recCreatorName && recCreatorName !== "system") {
        if (userNameNorm && recCreatorName === userNameNorm) return true;
        if (userEmailNorm && recCreatorName === userEmailNorm) return true;
      }
      if (recSalesPersonEmail && userEmailNorm) {
        if (recSalesPersonEmail === userEmailNorm) return true;
      }
      if (recSalesPersonName && userNameNorm) {
        if (recSalesPersonName === userNameNorm) return true;
      }
      return false;
    });
  }, [piRecords, isSalesTeamUser, activeUser]);

  const uniqueCompanies = useMemo(() => {
    const set = new Set<string>();
    visiblePiRecords.forEach((r) => {
      if (r.billToCompanyName) set.add(r.billToCompanyName.trim());
    });
    return Array.from(set).sort();
  }, [visiblePiRecords]);

  const uniqueBranches = useMemo(() => {
    const set = new Set<string>();
    visiblePiRecords.forEach((r) => {
      if (r.aolBranchGodown) set.add(r.aolBranchGodown.trim());
    });
    return Array.from(set).sort();
  }, [visiblePiRecords]);

  const filteredRecords = visiblePiRecords.filter((rec) => {
    const prods = getPiProductsList(rec);
    const prodNames = prods.map((p) => p.productName.toLowerCase()).join(" ");
    const q = searchTerm.trim().toLowerCase();

    const matchesSearch =
      !q ||
      (rec.piNumber || "").toLowerCase().includes(q) ||
      (rec.buyersOrderNumber || "").toLowerCase().includes(q) ||
      (rec.billToCompanyName || "").toLowerCase().includes(q) ||
      (rec.shipToCompanyName || "").toLowerCase().includes(q) ||
      (rec.orderPlacedBy || "").toLowerCase().includes(q) ||
      (rec.aolBranchGodown || "").toLowerCase().includes(q) ||
      (rec.aolSalesPersonName || "").toLowerCase().includes(q) ||
      (rec.aolSalesPersonEmail || "").toLowerCase().includes(q) ||
      prodNames.includes(q);

    const matchesCompany =
      filterCompany === "all" ||
      (rec.billToCompanyName || "").trim() === filterCompany;
    const matchesBranch =
      filterBranch === "all" ||
      (rec.aolBranchGodown || "").trim() === filterBranch;
    const matchesProduct =
      filterProduct === "all" ||
      prods.some((p) => p.productName.trim() === filterProduct);

    let matchesDate = true;
    if (startDate || endDate) {
      const recDate =
        dateFilterType === "entry" ? rec.createEditDate : rec.piDate;
      if (!recDate) {
        matchesDate = false;
      } else {
        if (startDate && recDate < startDate) matchesDate = false;
        if (endDate && recDate > endDate) matchesDate = false;
      }
    }

    return (
      matchesSearch &&
      matchesCompany &&
      matchesBranch &&
      matchesProduct &&
      matchesDate
    );
  });

  const isFiltered = Boolean(
    searchTerm.trim() !== "" ||
      filterCompany !== "all" ||
      filterBranch !== "all" ||
      filterProduct !== "all" ||
      startDate !== "" ||
      endDate !== "",
  );

  const totalEntries = filteredRecords.length;
  const overallEntries = visiblePiRecords.length;
  const totalQty = filteredRecords.reduce(
    (sum, rec) => sum + getPiTotalQty(rec),
    0,
  );
  const totalSubTotal = filteredRecords.reduce(
    (sum, rec) => sum + (Number(rec.subTotal) || 0),
    0,
  );
  const totalFreight = filteredRecords.reduce(
    (sum, rec) => sum + (Number(rec.freightCharges) || 0),
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
    setFilterCompany("all");
    setFilterBranch("all");
    setFilterProduct("all");
    setStartDate("");
    setEndDate("");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Google Sheets Apps Script Integration Banner */}
      <AppsScriptSyncBanner
        collectionKey="proforma_invoices"
        configKey="proforma_invoices_apps_script"
        defaultSheetName="PI"
        moduleTitle="Proforma Invoice (PI)"
        records={visiblePiRecords}
        activeUser={activeUser}
        config={config}
        syncStatus={syncStatus}
        setSyncStatus={setSyncStatus}
        onRefreshTable={
          onRefreshPiRecords
            ? () => {
                onRefreshPiRecords();
              }
            : undefined
        }
      />

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              {isFiltered ? "Filtered PIs" : "Total PIs"}
            </p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5 font-mono">
              {totalEntries}
              {isFiltered && (
                <span className="text-xs text-slate-400 font-normal ml-1">
                  / {overallEntries}
                </span>
              )}
            </h3>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <FileSpreadsheet size={20} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Total Order Qty
            </p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5 font-mono">
              {totalQty.toLocaleString("en-IN")}
            </h3>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Package size={20} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Total Sub-Total (INR)
            </p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5 font-mono">
              ₹{" "}
              {totalSubTotal.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </h3>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Total PI Value (INR)
            </p>
            <h3 className="text-xl font-bold text-purple-700 mt-0.5 font-mono">
              ₹{" "}
              {totalAmount.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </h3>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
            <DollarSign size={20} />
          </div>
        </div>
      </div>

      {/* Filter & Action Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search PI No, Buyer Order, Customer, Product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            {/* Bill To Company Filter */}
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 outline-none max-w-[200px]"
            >
              <option value="all">All Bill-To Customers</option>
              {uniqueCompanies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* AOL Branch / Godown Filter */}
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 outline-none max-w-[180px]"
            >
              <option value="all">All AOL Branches</option>
              {uniqueBranches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            {/* Product Filter */}
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 outline-none max-w-[180px]"
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
              label="PI Date Filter"
              entryDateLabel="Create/Edit Date"
              invoiceDateLabel="PI Date"
            />

            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition cursor-pointer"
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
              Create PI
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
                  PI Date
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700">
                  PI Number
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700">
                  Buyer&apos;s Order No
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700">
                  Bill To Company
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700">
                  Order Placed By
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700">
                  Ship To Company
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700">
                  AOL Branch / Godown
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700">
                  AOL Sales Person
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700">
                  Product Name
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700 text-right">
                  Total Qty
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700 text-right">
                  Sub Total (₹)
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700 text-right">
                  Freight (₹)
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700 text-right">
                  GST (₹)
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700 text-center">
                  TCS
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700 text-right">
                  Grand Total (₹)
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700">
                  Create/Edit Date
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700">
                  PI File
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-700 text-center w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={19} className="py-12 text-center text-slate-400">
                    <FileSpreadsheet
                      className="mx-auto mb-2 opacity-30 text-slate-400"
                      size={32}
                    />
                    <p className="font-medium text-sm">
                      No Proforma Invoices found
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {isFiltered
                        ? "Try clearing filters to see existing records"
                        : "Click 'Create PI' or sync with Google Sheets to add records"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, index) => {
                  const recKey = rec.id || rec.piNumber || "";
                  const effectivePdfUrl =
                    (recKey && localPdfUrls[recKey]) ||
                    (rec.piNumber && localPdfUrls[rec.piNumber]) ||
                    (rec.id && localPdfUrls[rec.id]) ||
                    rec.piPdfUrl ||
                    "";
                  const isGenerating = !!(
                    (recKey && generatingPdfIds[recKey]) ||
                    (rec.id && generatingPdfIds[rec.id]) ||
                    (rec.piNumber && generatingPdfIds[rec.piNumber])
                  );
                  const prods = getPiProductsList(rec);

                  return (
                    <tr
                      key={rec.id || `pi-${index}`}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => setViewingRecord(rec)}
                    >
                      <td className="py-2 px-3 text-slate-400 font-mono">
                        {index + 1}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-700 whitespace-nowrap">
                        {rec.piDate || "-"}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {rec.piNumber || rec.id || "-"}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-700 whitespace-nowrap">
                        {rec.buyersOrderNumber || "-"}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900 whitespace-nowrap">
                        {rec.billToCompanyName || "-"}
                      </td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                        {rec.orderPlacedBy || "-"}
                      </td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                        {rec.shipToCompanyName || "-"}
                      </td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                        {rec.aolBranchGodown || "-"}
                      </td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                        {rec.aolSalesPersonName || "-"}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-800 whitespace-nowrap max-w-[220px]">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="truncate"
                            title={prods
                              .map((p) => p.productName)
                              .filter(Boolean)
                              .join(", ")}
                          >
                            {rec.productName1 || "-"}
                          </span>
                          {prods.length > 1 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold shrink-0">
                              +{prods.length - 1} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-800 text-right whitespace-nowrap">
                        {Number(getPiTotalQty(rec) || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2 px-3 font-mono font-medium text-slate-900 text-right whitespace-nowrap">
                        ₹{" "}
                        {formatNumberForCurrency(
                          rec.subTotal || 0,
                          "INR",
                          2,
                          2,
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-700 text-right whitespace-nowrap">
                        ₹{" "}
                        {formatNumberForCurrency(
                          rec.freightCharges || 0,
                          "INR",
                          2,
                          2,
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-amber-700 text-right whitespace-nowrap">
                        ₹ {formatNumberForCurrency(rec.gst || 0, "INR", 2, 2)}
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            (rec.tcsApplicableOrNot || "")
                              .trim()
                              .toLowerCase() === "yes"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {rec.tcsApplicableOrNot || "No"}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono font-extrabold text-purple-900 text-right whitespace-nowrap">
                        ₹{" "}
                        {formatNumberForCurrency(
                          rec.totalInNum || 0,
                          "INR",
                          2,
                          2,
                        )}
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
                            <Loader2
                              size={13}
                              className="animate-spin text-amber-600 shrink-0"
                            />
                            <span className="font-sans">
                              File is creating please wait...
                            </span>
                          </div>
                        ) : effectivePdfUrl ? (
                          <a
                            href={effectivePdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-900 border border-blue-200 rounded-md transition-colors shadow-2xs"
                            title={`Open PDF for ${rec.piNumber || rec.id || "PI"}`}
                          >
                            <FileText
                              size={13}
                              className="text-blue-600 shrink-0"
                            />
                            <span className="font-mono">
                              {rec.piNumber || rec.id || "View PDF"}
                            </span>
                            <ExternalLink
                              size={12}
                              className="text-blue-500 shrink-0 opacity-70"
                            />
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
                            <Sparkles
                              size={12}
                              className="text-emerald-600 shrink-0"
                            />
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
                            className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition cursor-pointer"
                            title="View PI Details"
                          >
                            <Eye size={14} />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(rec)}
                              className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-amber-50 transition cursor-pointer"
                              title="Edit PI"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => setDeletingRecord(rec)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition cursor-pointer"
                            title="Delete PI"
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
                    colSpan={10}
                    className="py-2.5 px-3 text-right uppercase tracking-wider text-slate-500"
                  >
                    Totals:
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-800">
                    {totalQty.toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    ₹
                    {totalSubTotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    ₹
                    {totalFreight.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-2.5 px-3 text-right text-amber-700">
                    ₹
                    {totalGst.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td></td>
                  <td className="py-2.5 px-3 text-right text-purple-900">
                    ₹
                    {totalAmount.toLocaleString("en-IN", {
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

      {/* CREATE PI MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-6 overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <FileSpreadsheet size={18} className="text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    Create New Proforma Invoice (PI - INR)
                  </h3>
                  <p className="text-[11px] text-emerald-100/80 font-mono">
                    Syncs directly to Google Sheet via Apps Script
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleCreateSubmit}
              className="p-5 max-h-[82vh] overflow-y-auto space-y-5 text-xs"
            >
              {/* SECTION 1: CUSTOMER, BILL TO & SHIP TO DETAILS */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-700 font-bold font-mono text-[11px] uppercase tracking-wider">
                  <Building2 size={14} className="text-emerald-600" />
                  1. Customer, Bill To & Ship To Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Create/Edit Date
                    </label>
                    <input
                      type="date"
                      value={formCreateEditDate}
                      readOnly
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Buyer&apos;s Order Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PO/2026/0142"
                      value={formBuyersOrderNumber}
                      onChange={(e) => setFormBuyersOrderNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-mono font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Order Placed by (Customer Dealing Person Name) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Customer Dealing Person Name"
                      value={formOrderPlacedBy}
                      onChange={(e) => setFormOrderPlacedBy(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Mobile Number (Customer Dealing Person) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98XXXXXXXX"
                      value={formCustomerMobileNumber}
                      onChange={(e) =>
                        setFormCustomerMobileNumber(e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-slate-600 font-medium mb-1">
                      E-Mail ID (Customer Dealing Person)
                    </label>
                    <input
                      type="email"
                      placeholder="customer@company.com"
                      value={formCustomerEmailId}
                      onChange={(e) => setFormCustomerEmailId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Bill To */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Company Name (Bill To - Customer Billing Name) *
                    </label>
                    <SearchableClientSelect
                      value={formBillToCompanyName}
                      onChange={handleSelectBillToClientForCreate}
                      clients={sortedClientsMaster}
                      required
                      placeholder="Search or enter Bill-To Company Name..."
                      accentColor="emerald"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Company Address (Bill To) - Customer Billing Address *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Full Registered Billing Address"
                      value={formBillToAddress}
                      onChange={(e) => {
                        setFormBillToAddress(e.target.value);
                        if (formSameAsBillTo) {
                          setFormShipToAddress(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Ship To */}
                <div className="pt-1 space-y-2">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formSameAsBillTo}
                      onChange={(e) =>
                        handleToggleSameAsBillToCreate(e.target.checked)
                      }
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Ship To details same as Bill To
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Company Name (Ship To) - Company Delivery Name / Location *
                      </label>
                      <SearchableClientSelect
                        value={formShipToCompanyName}
                        onChange={handleSelectShipToClientForCreate}
                        clients={sortedClientsMaster}
                        required
                        placeholder="Search or enter Ship-To Company / Delivery Name..."
                        accentColor="emerald"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Company Shipping Address (Ship To) - Company Delivery Address *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Full Delivery / Shipping Address"
                        value={formShipToAddress}
                        onChange={(e) => {
                          setFormSameAsBillTo(false);
                          setFormShipToAddress(e.target.value);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: AOL BRANCH/GODOWN, BANK & SALES PERSON */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-700 font-bold font-mono text-[11px] uppercase tracking-wider">
                  <Landmark size={14} className="text-emerald-600" />
                  2. AOL Branch/Godown, Bank Account & Sales Person
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      AOL BRANCH/ GODOWN *
                    </label>
                    <select
                      required
                      value={formAolBranchGodown}
                      onChange={(e) =>
                        handleSelectAolGodownForCreate(e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-medium"
                    >
                      <option value="">-- Select AOL Branch/Godown --</option>
                      {allAolGodownNames.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-600 font-medium">
                        GSTIN
                      </label>
                      {formAolBranchGstin && (
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          <Check size={11} /> Auto-filled
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="AOL Branch GSTIN"
                      value={formAolBranchGstin}
                      onChange={(e) => setFormAolBranchGstin(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono uppercase focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-600 font-medium">
                        Address
                      </label>
                      {formAolBranchAddress && (
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          <Check size={11} /> Auto-filled
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="AOL Branch/Godown Address"
                      value={formAolBranchAddress}
                      onChange={(e) => setFormAolBranchAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      IN WHICH AOL BANK ACCOUNT YOU WANT TO RECIVED PAYMENT *
                    </label>
                    <select
                      required
                      value={formAolBankAccount}
                      onChange={(e) =>
                        handleSelectBankForCreate(e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-medium"
                    >
                      <option value="">-- Select AOL Bank Account --</option>
                      {paymentBanks.map((bank) => {
                        const label = formatBankLabel(bank);
                        return (
                          <option key={bank.id} value={label}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-600 font-medium">
                        Account No
                      </label>
                      {formAccountNo && (
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          <Check size={11} /> Auto-filled
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Bank Account Number"
                      value={formAccountNo}
                      onChange={(e) => setFormAccountNo(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-600 font-medium">
                        IFSC Code
                      </label>
                      {formIfscCode && (
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          <Check size={11} /> Auto-filled
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Bank IFSC Code"
                      value={formIfscCode}
                      onChange={(e) => setFormIfscCode(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono uppercase focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      AOL Sales Person Name *
                    </label>
                    <select
                      required
                      value={formAolSalesPersonName}
                      onChange={(e) =>
                        handleSelectSalesPersonForCreate(e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-medium"
                    >
                      <option value="">-- Select Sales Person --</option>
                      {salesTeamUsers.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-600 font-medium">
                        Email Address
                      </label>
                      {formAolSalesPersonEmail && (
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          <Check size={11} /> Auto-filled
                        </span>
                      )}
                    </div>
                    <input
                      type="email"
                      placeholder="AOL Sales Person Email Address"
                      value={formAolSalesPersonEmail}
                      onChange={(e) =>
                        setFormAolSalesPersonEmail(e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: COMMERCIAL TERMS & REMARKS */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-700 font-bold font-mono text-[11px] uppercase tracking-wider">
                  <Truck size={14} className="text-emerald-600" />
                  3. Terms & Delivery Notes
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      PAYMENT TERM&apos;S
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 100% Advance Against PI"
                      value={formPaymentTerms}
                      onChange={(e) => setFormPaymentTerms(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      OTHER TERM&apos;S / TERMS OF DELIVERY
                    </label>
                    <input
                      type="text"
                      list="pi-delivery-terms-suggestions"
                      placeholder="e.g. Ex-Works / FOR Destination"
                      value={formOtherTerms}
                      onChange={(e) => setFormOtherTerms(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                    <datalist id="pi-delivery-terms-suggestions">
                      {allDeliveryTerms.map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Terms of Delivery or Delivery Note
                    </label>
                    <input
                      type="text"
                      placeholder="Dispatch instructions / Delivery Note"
                      value={formDeliveryNoteTerms}
                      onChange={(e) =>
                        setFormDeliveryNoteTerms(e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Any Note or Remark for the party
                    </label>
                    <input
                      type="text"
                      placeholder="Additional remarks for customer"
                      value={formPartyRemark}
                      onChange={(e) => setFormPartyRemark(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: PRODUCTS 1 TO 4 */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700 font-bold font-mono text-[11px] uppercase tracking-wider">
                    <Package size={14} className="text-emerald-600" />
                    4. Products & Quantities ({formProducts.length} of max 4)
                  </div>
                  {formProducts.length < 4 && (
                    <button
                      type="button"
                      onClick={handleAddCreateProduct}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition cursor-pointer"
                    >
                      <Plus size={13} />
                      Add Product ({formProducts.length}/4)
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {formProducts.map((prod, pIdx) => {
                    const qtyLabel =
                      pIdx === 0
                        ? "Product 1 Quantity *"
                        : `Product Quantity ${pIdx + 1} *`;
                    const rateLabel =
                      pIdx === 0
                        ? "Product 1 Rate (₹) *"
                        : `Product Rate ${pIdx + 1} (₹) *`;
                    return (
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
                            >
                              <Trash2 size={13} />
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
                          <div className="md:col-span-2">
                            <label className="block text-slate-600 font-medium mb-1 text-[11px]">
                              Product Name {pIdx + 1} *
                            </label>
                            <select
                              required
                              value={prod.productName}
                              onChange={(e) =>
                                handleCreateProductChange(
                                  pIdx,
                                  "productName",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-medium text-xs"
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
                              {qtyLabel}
                            </label>
                            <input
                              type="number"
                              step="any"
                              required
                              placeholder="Quantity"
                              value={prod.productQty}
                              onChange={(e) =>
                                handleCreateProductChange(
                                  pIdx,
                                  "productQty",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:ring-1 focus:ring-emerald-500 text-emerald-800 text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 font-medium mb-1 text-[11px]">
                              {rateLabel}
                            </label>
                            <input
                              type="number"
                              step="any"
                              required
                              placeholder="Rate in INR"
                              value={prod.productRate}
                              onChange={(e) =>
                                handleCreateProductChange(
                                  pIdx,
                                  "productRate",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-semibold focus:ring-1 focus:ring-emerald-500 text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 font-medium mb-1 text-[11px]">
                              Amount {pIdx + 1} (₹)
                            </label>
                            <div className="w-full px-2.5 py-2 bg-emerald-50/70 border border-emerald-200 rounded-lg font-mono font-bold text-emerald-900 text-xs">
                              ₹{" "}
                              {(prod.amount || 0).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {formProducts.length < 4 && (
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={handleAddCreateProduct}
                      className="px-4 py-2 border border-dashed border-emerald-300 hover:border-emerald-500 text-emerald-700 bg-emerald-50/60 hover:bg-emerald-50 rounded-xl text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus size={14} />+ Add Another Product (up to 4 max)
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 5: FREIGHT, TCS & INR TOTALS (NO CURRENCY FIELD) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-700 font-bold font-mono text-[11px] uppercase tracking-wider">
                  <CreditCard size={14} className="text-emerald-600" />
                  5. Freight, TCS & INR Totals (INR Only)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Products Sub Total (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      readOnly
                      value={formSubTotal}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-mono font-bold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Freight Charges (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={formFreightCharges}
                      onChange={(e) => {
                        setFormFreightCharges(e.target.value);
                        recalcCreateTotals(
                          formProducts,
                          e.target.value,
                          formGstPercent,
                          formTcsApplicableOrNot,
                        );
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-medium focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      GST (₹)
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formGstPercent}
                        onChange={(e) => {
                          setFormGstPercent(e.target.value);
                          recalcCreateTotals(
                            formProducts,
                            formFreightCharges,
                            e.target.value,
                            formTcsApplicableOrNot,
                          );
                        }}
                        className="w-24 px-2 py-2 bg-white border border-slate-200 rounded-lg font-mono"
                      >
                        <option value="18">18%</option>
                      </select>
                      <input
                        type="number"
                        step="any"
                        placeholder="GST Amount"
                        value={formGst}
                        onChange={(e) => {
                          const gstVal = parseFloat(e.target.value) || 0;
                          setFormGst(gstVal);
                          const freight =
                            parseFloat(formFreightCharges) || 0;
                          const isTcsYes =
                            formTcsApplicableOrNot.trim().toLowerCase() ===
                            "yes";
                          const tcs = isTcsYes ? formTcsAmount : 0;
                          const total = Number(
                            (formSubTotal + freight + gstVal + tcs).toFixed(2),
                          );
                          setFormTotalInNum(total);
                          setFormAmountInWord(
                            formatAmountInWords(total, "INR"),
                          );
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-medium focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="hidden">
                    <label className="block text-slate-600 font-medium mb-1">
                      TCS Applicable Or Not
                    </label>
                    <select
                      value={formTcsApplicableOrNot}
                      onChange={(e) => {
                        setFormTcsApplicableOrNot(e.target.value);
                        recalcCreateTotals(
                          formProducts,
                          formFreightCharges,
                          formGstPercent,
                          e.target.value,
                        );
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes (0.1%)</option>
                    </select>
                  </div>

                  {formTcsApplicableOrNot.trim().toLowerCase() === "yes" && (
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        TCS Amount (₹)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formTcsAmount}
                        onChange={(e) => {
                          const tcsVal = parseFloat(e.target.value) || 0;
                          setFormTcsAmount(tcsVal);
                          const freight =
                            parseFloat(formFreightCharges) || 0;
                          const total = Number(
                            (
                              formSubTotal +
                              freight +
                              formGst +
                              tcsVal
                            ).toFixed(2),
                          );
                          setFormTotalInNum(total);
                          setFormAmountInWord(
                            formatAmountInWords(total, "INR"),
                          );
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-medium focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Grand Total (INR ₹) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formTotalInNum}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormTotalInNum(val);
                        setFormAmountInWord(formatAmountInWords(val, "INR"));
                      }}
                      className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg font-mono font-extrabold text-purple-900 focus:ring-1 focus:ring-purple-500 text-sm"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-slate-600 font-medium mb-1">
                      Amount in Word
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rupees One Lakh Eighteen Thousand Only"
                      value={formAmountInWord}
                      onChange={(e) => setFormAmountInWord(e.target.value)}
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
                  Save & Sync PI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PI MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-6 overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="bg-gradient-to-r from-amber-600 to-orange-700 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <Edit2 size={18} className="text-amber-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    Edit Proforma Invoice ({editingRecord.piNumber || editingRecord.id})
                  </h3>
                  <p className="text-[11px] text-amber-100/80 font-mono">
                    Updated details will sync directly to Google Sheet row
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSaveEdit}
              className="p-5 max-h-[82vh] overflow-y-auto space-y-5 text-xs"
            >
              {/* SECTION 1: CUSTOMER, BILL TO & SHIP TO */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-700 font-bold font-mono text-[11px] uppercase tracking-wider">
                  <Building2 size={14} className="text-amber-600" />
                  1. Customer, Bill To & Ship To Details
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
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Buyer&apos;s Order Number
                    </label>
                    <input
                      type="text"
                      value={editingRecord.buyersOrderNumber || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          buyersOrderNumber: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Order Placed by (Customer Dealing Person Name) *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingRecord.orderPlacedBy || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          orderPlacedBy: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Mobile Number (Customer Dealing Person) *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingRecord.customerMobileNumber || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          customerMobileNumber: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-slate-600 font-medium mb-1">
                      E-Mail ID (Customer Dealing Person)
                    </label>
                    <input
                      type="email"
                      value={editingRecord.customerEmailId || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          customerEmailId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Company Name (Bill To - Customer Billing Name) *
                    </label>
                    <SearchableClientSelect
                      value={editingRecord.billToCompanyName || ""}
                      onChange={handleSelectBillToClientForEdit}
                      clients={sortedClientsMaster}
                      required
                      accentColor="amber"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Company Address (Bill To) - Customer Billing Address *
                    </label>
                    <input
                      type="text"
                      required
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

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Company Name (Ship To) - Company Delivery Name / Location *
                    </label>
                    <SearchableClientSelect
                      value={editingRecord.shipToCompanyName || ""}
                      onChange={handleSelectShipToClientForEdit}
                      clients={sortedClientsMaster}
                      required
                      accentColor="amber"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Company Shipping Address (Ship To) - Company Delivery Address *
                    </label>
                    <input
                      type="text"
                      required
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
                </div>
              </div>

              {/* SECTION 2: AOL BRANCH/GODOWN, BANK & SALES PERSON */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-700 font-bold font-mono text-[11px] uppercase tracking-wider">
                  <Landmark size={14} className="text-amber-600" />
                  2. AOL Branch/Godown, Bank Account & Sales Person
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      AOL BRANCH/ GODOWN *
                    </label>
                    <select
                      required
                      value={editingRecord.aolBranchGodown || ""}
                      onChange={(e) =>
                        handleSelectAolGodownForEdit(e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium"
                    >
                      <option value="">-- Select AOL Branch/Godown --</option>
                      {editingRecord.aolBranchGodown &&
                        !allAolGodownNames.includes(
                          editingRecord.aolBranchGodown,
                        ) && (
                          <option value={editingRecord.aolBranchGodown}>
                            {editingRecord.aolBranchGodown}
                          </option>
                        )}
                      {allAolGodownNames.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      GSTIN
                    </label>
                    <input
                      type="text"
                      value={editingRecord.aolBranchGstin || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          aolBranchGstin: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={editingRecord.aolBranchAddress || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          aolBranchAddress: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      IN WHICH AOL BANK ACCOUNT YOU WANT TO RECIVED PAYMENT *
                    </label>
                    <select
                      required
                      value={editingRecord.aolBankAccount || ""}
                      onChange={(e) => handleSelectBankForEdit(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium"
                    >
                      <option value="">-- Select AOL Bank Account --</option>
                      {editingRecord.aolBankAccount &&
                        !paymentBanks.some(
                          (b) =>
                            formatBankLabel(b) === editingRecord.aolBankAccount,
                        ) && (
                          <option value={editingRecord.aolBankAccount}>
                            {editingRecord.aolBankAccount}
                          </option>
                        )}
                      {paymentBanks.map((bank) => {
                        const label = formatBankLabel(bank);
                        return (
                          <option key={bank.id} value={label}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Account No
                    </label>
                    <input
                      type="text"
                      value={editingRecord.accountNo || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          accountNo: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={editingRecord.ifscCode || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          ifscCode: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      AOL Sales Person Name *
                    </label>
                    <select
                      required
                      value={editingRecord.aolSalesPersonName || ""}
                      onChange={(e) =>
                        handleSelectSalesPersonForEdit(e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium"
                    >
                      <option value="">-- Select Sales Person --</option>
                      {editingRecord.aolSalesPersonName &&
                        !salesTeamUsers.some(
                          (u) => u.name === editingRecord.aolSalesPersonName,
                        ) && (
                          <option value={editingRecord.aolSalesPersonName}>
                            {editingRecord.aolSalesPersonName}
                          </option>
                        )}
                      {salesTeamUsers.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-slate-600 font-medium mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editingRecord.aolSalesPersonEmail || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          aolSalesPersonEmail: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: COMMERCIAL TERMS & REMARKS */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-700 font-bold font-mono text-[11px] uppercase tracking-wider">
                  <Truck size={14} className="text-amber-600" />
                  3. Terms & Delivery Notes
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      PAYMENT TERM&apos;S
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

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      OTHER TERM&apos;S / TERMS OF DELIVERY
                    </label>
                    <input
                      type="text"
                      list="pi-delivery-terms-suggestions"
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

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Terms of Delivery or Delivery Note
                    </label>
                    <input
                      type="text"
                      value={editingRecord.deliveryNoteTerms || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          deliveryNoteTerms: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Any Note or Remark for the party
                    </label>
                    <input
                      type="text"
                      value={editingRecord.partyRemark || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          partyRemark: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: PRODUCTS 1 TO 4 */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700 font-bold font-mono text-[11px] uppercase tracking-wider">
                    <Package size={14} className="text-amber-600" />
                    4. Products & Quantities ({editProducts.length} of max 4)
                  </div>
                  {editProducts.length < 4 && (
                    <button
                      type="button"
                      onClick={handleAddEditProduct}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition cursor-pointer"
                    >
                      <Plus size={13} />
                      Add Product ({editProducts.length}/4)
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {editProducts.map((prod, pIdx) => {
                    const qtyLabel =
                      pIdx === 0
                        ? "Product 1 Quantity *"
                        : `Product Quantity ${pIdx + 1} *`;
                    const rateLabel =
                      pIdx === 0
                        ? "Product 1 Rate (₹) *"
                        : `Product Rate ${pIdx + 1} (₹) *`;
                    return (
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
                            >
                              <Trash2 size={13} />
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
                          <div className="md:col-span-2">
                            <label className="block text-slate-600 font-medium mb-1 text-[11px]">
                              Product Name {pIdx + 1} *
                            </label>
                            <select
                              required
                              value={prod.productName}
                              onChange={(e) =>
                                handleEditProductChange(
                                  pIdx,
                                  "productName",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs"
                            >
                              <option value="">-- Select Product --</option>
                              {prod.productName &&
                                !allProductNames.includes(prod.productName) && (
                                  <option value={prod.productName}>
                                    {prod.productName}
                                  </option>
                                )}
                              {allProductNames.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-600 font-medium mb-1 text-[11px]">
                              {qtyLabel}
                            </label>
                            <input
                              type="number"
                              step="any"
                              required
                              value={prod.productQty}
                              onChange={(e) =>
                                handleEditProductChange(
                                  pIdx,
                                  "productQty",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-emerald-800 text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 font-medium mb-1 text-[11px]">
                              {rateLabel}
                            </label>
                            <input
                              type="number"
                              step="any"
                              required
                              value={prod.productRate}
                              onChange={(e) =>
                                handleEditProductChange(
                                  pIdx,
                                  "productRate",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-semibold text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 font-medium mb-1 text-[11px]">
                              Amount {pIdx + 1} (₹)
                            </label>
                            <div className="w-full px-2.5 py-2 bg-amber-50/70 border border-amber-200 rounded-lg font-mono font-bold text-amber-900 text-xs">
                              ₹{" "}
                              {(prod.amount || 0).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 5: FREIGHT, TCS & INR TOTALS */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-700 font-bold font-mono text-[11px] uppercase tracking-wider">
                  <CreditCard size={14} className="text-amber-600" />
                  5. Freight, TCS & INR Totals (INR Only)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Products Sub Total (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      readOnly
                      value={editingRecord.subTotal || 0}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-mono font-bold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Freight Charges (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editingRecord.freightCharges ?? 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const nextRec = {
                          ...editingRecord,
                          freightCharges: val,
                        };
                        recalcEditTotals(editProducts, nextRec, editGstPercent);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      GST (₹)
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={editGstPercent}
                        onChange={(e) => {
                          setEditGstPercent(e.target.value);
                          recalcEditTotals(
                            editProducts,
                            editingRecord,
                            e.target.value,
                          );
                        }}
                        className="w-24 px-2 py-2 bg-white border border-slate-200 rounded-lg font-mono"
                      >
                        <option value="18">18%</option>
                      </select>
                      <input
                        type="number"
                        step="any"
                        value={editingRecord.gst ?? 0}
                        onChange={(e) => {
                          const gstVal = parseFloat(e.target.value) || 0;
                          const sub = editingRecord.subTotal || 0;
                          const freight = editingRecord.freightCharges || 0;
                          const isTcsYes =
                            (editingRecord.tcsApplicableOrNot || "")
                              .trim()
                              .toLowerCase() === "yes";
                          const tcs = isTcsYes
                            ? editingRecord.tcsAmount || 0
                            : 0;
                          const total = Number(
                            (sub + freight + gstVal + tcs).toFixed(2),
                          );
                          setEditingRecord({
                            ...editingRecord,
                            gst: gstVal,
                            totalInNum: total,
                            amountInWord: formatAmountInWords(total, "INR"),
                          });
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-medium"
                      />
                    </div>
                  </div>

                  <div className="hidden">
                    <label className="block text-slate-600 font-medium mb-1">
                      TCS Applicable Or Not
                    </label>
                    <select
                      value={editingRecord.tcsApplicableOrNot || "No"}
                      onChange={(e) => {
                        const nextRec = {
                          ...editingRecord,
                          tcsApplicableOrNot: e.target.value,
                        };
                        recalcEditTotals(editProducts, nextRec, editGstPercent);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes (0.1%)</option>
                    </select>
                  </div>

                  {(editingRecord.tcsApplicableOrNot || "")
                    .trim()
                    .toLowerCase() === "yes" && (
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        TCS Amount (₹)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={editingRecord.tcsAmount ?? 0}
                        onChange={(e) => {
                          const tcsVal = parseFloat(e.target.value) || 0;
                          const sub = editingRecord.subTotal || 0;
                          const freight = editingRecord.freightCharges || 0;
                          const gstVal = editingRecord.gst || 0;
                          const total = Number(
                            (sub + freight + gstVal + tcsVal).toFixed(2),
                          );
                          setEditingRecord({
                            ...editingRecord,
                            tcsAmount: tcsVal,
                            totalInNum: total,
                            amountInWord: formatAmountInWords(total, "INR"),
                          });
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-medium"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Grand Total (INR ₹) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editingRecord.totalInNum ?? 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setEditingRecord({
                          ...editingRecord,
                          totalInNum: val,
                          amountInWord: formatAmountInWords(val, "INR"),
                        });
                      }}
                      className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg font-mono font-extrabold text-purple-900 text-sm"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-slate-600 font-medium mb-1">
                      Amount in Word
                    </label>
                    <input
                      type="text"
                      value={editingRecord.amountInWord || ""}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          amountInWord: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-serif italic text-slate-800 font-medium"
                    />
                  </div>
                </div>
              </div>

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
                  Update & Sync PI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PI VOUCHER MODAL */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:bg-white print:p-0">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-6 overflow-hidden border border-slate-200 print:shadow-none print:border-none print:my-0">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet size={18} className="text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">
                    Proforma Invoice Details —{" "}
                    {viewingRecord.piNumber || viewingRecord.id}
                  </h3>
                  <p className="text-[11px] text-slate-300 font-mono">
                    PI Date: {viewingRecord.piDate || "-"} • Buyer&apos;s Order:{" "}
                    {viewingRecord.buyersOrderNumber || "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const recKey = viewingRecord.id || viewingRecord.piNumber || "";
                  const effectivePdfUrl =
                    (recKey && localPdfUrls[recKey]) ||
                    (viewingRecord.piNumber &&
                      localPdfUrls[viewingRecord.piNumber]) ||
                    (viewingRecord.id && localPdfUrls[viewingRecord.id]) ||
                    viewingRecord.piPdfUrl ||
                    "";
                  const isGen = !!(
                    (recKey && generatingPdfIds[recKey]) ||
                    (viewingRecord.id && generatingPdfIds[viewingRecord.id]) ||
                    (viewingRecord.piNumber &&
                      generatingPdfIds[viewingRecord.piNumber])
                  );

                  if (isGen) {
                    return (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-200 rounded-lg text-xs font-medium">
                        <Loader2 size={13} className="animate-spin" />
                        File is creating please wait...
                      </span>
                    );
                  }
                  if (effectivePdfUrl) {
                    return (
                      <a
                        href={effectivePdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
                      >
                        <ExternalLink size={13} />
                        Open PI PDF
                      </a>
                    );
                  }
                  return (
                    <button
                      type="button"
                      onClick={() => handleGeneratePdfClick(viewingRecord)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      <Sparkles size={13} />
                      Generate PDF
                    </button>
                  );
                })()}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Printer size={13} />
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => setViewingRecord(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-5 max-h-[82vh] overflow-y-auto space-y-4 text-xs print:max-h-none">
              {/* Top Voucher Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    PROFORMA INVOICE
                  </h2>
                  <p className="text-[11px] font-mono text-slate-500">
                    PI No:{" "}
                    <span className="font-bold text-emerald-700">
                      {viewingRecord.piNumber || viewingRecord.id || "-"}
                    </span>{" "}
                    • Buyer&apos;s Order No:{" "}
                    <span className="font-bold text-slate-800">
                      {viewingRecord.buyersOrderNumber || "-"}
                    </span>
                  </p>
                </div>
                <div className="text-left sm:text-right font-mono text-[11px] text-slate-600 space-y-0.5">
                  <div>
                    <span className="text-slate-400">PI Date:</span>{" "}
                    <span className="font-bold text-slate-800">
                      {viewingRecord.piDate || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Create/Edit Date:</span>{" "}
                    <span className="font-bold text-slate-800">
                      {viewingRecord.createEditDate || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bill To & Ship To Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                    <Building2 size={12} /> Bill To (Customer Billing)
                  </div>
                  <p className="font-bold text-sm text-slate-900">
                    {viewingRecord.billToCompanyName || "-"}
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    {viewingRecord.billToAddress || "-"}
                  </p>
                  <div className="pt-1 border-t border-slate-200/70 text-[11px] text-slate-600 space-y-0.5">
                    <div>
                      <span className="font-semibold text-slate-700">
                        Order Placed By:
                      </span>{" "}
                      {viewingRecord.orderPlacedBy || "-"}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">
                        Mobile:
                      </span>{" "}
                      {viewingRecord.customerMobileNumber || "-"} •{" "}
                      <span className="font-semibold text-slate-700">
                        E-Mail:
                      </span>{" "}
                      {viewingRecord.customerEmailId || "-"}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                    <MapPin size={12} /> Ship To (Customer Delivery)
                  </div>
                  <p className="font-bold text-sm text-slate-900">
                    {viewingRecord.shipToCompanyName || "-"}
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    {viewingRecord.shipToAddress || "-"}
                  </p>
                </div>
              </div>

              {/* AOL Branch/Godown, Bank & Sales Person */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    AOL Branch / Godown
                  </div>
                  <p className="font-bold text-slate-900">
                    {viewingRecord.aolBranchGodown || "-"}
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    {viewingRecord.aolBranchAddress || "-"}
                  </p>
                  <p className="font-mono text-[11px] text-slate-700">
                    GSTIN: {viewingRecord.aolBranchGstin || "-"}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    AOL Bank Details
                  </div>
                  <p className="font-bold text-slate-900">
                    {viewingRecord.aolBankAccount || "-"}
                  </p>
                  <p className="font-mono text-[11px] text-slate-700">
                    A/c No: {viewingRecord.accountNo || "-"}
                  </p>
                  <p className="font-mono text-[11px] text-slate-700">
                    IFSC: {viewingRecord.ifscCode || "-"}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    AOL Sales Representative
                  </div>
                  <p className="font-bold text-slate-900">
                    {viewingRecord.aolSalesPersonName || "-"}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Email: {viewingRecord.aolSalesPersonEmail || "-"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Created By: {viewingRecord.createdBy || "-"}
                  </p>
                </div>
              </div>

              {/* Products Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-mono text-[11px] uppercase">
                    <tr>
                      <th className="py-2 px-3 w-10">#</th>
                      <th className="py-2 px-3">Product Name</th>
                      <th className="py-2 px-3 text-right">Quantity</th>
                      <th className="py-2 px-3 text-right">Rate (₹)</th>
                      <th className="py-2 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {getPiProductsList(viewingRecord).map((prod, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {prod.productName || "-"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {prod.qty.toLocaleString("en-IN")}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          ₹ {formatNumberForCurrency(prod.rate, "INR", 2, 2)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          ₹ {formatNumberForCurrency(prod.amount, "INR", 2, 2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Commercial Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                  <div>
                    <span className="font-bold text-slate-700">
                      PAYMENT TERM&apos;S:
                    </span>{" "}
                    <span className="text-slate-600">
                      {viewingRecord.paymentTerms || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">
                      OTHER TERM&apos;S / TERMS OF DELIVERY:
                    </span>{" "}
                    <span className="text-slate-600">
                      {viewingRecord.otherTerms || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">
                      Terms of Delivery or Delivery Note:
                    </span>{" "}
                    <span className="text-slate-600">
                      {viewingRecord.deliveryNoteTerms || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">
                      Any Note or Remark for the party:
                    </span>{" "}
                    <span className="text-slate-600">
                      {viewingRecord.partyRemark || "-"}
                    </span>
                  </div>
                </div>

                <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-200 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span>Sub Total:</span>
                    <span className="font-semibold">
                      ₹{" "}
                      {formatNumberForCurrency(
                        viewingRecord.subTotal || 0,
                        "INR",
                        2,
                        2,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Freight Charges:</span>
                    <span className="font-semibold">
                      ₹{" "}
                      {formatNumberForCurrency(
                        viewingRecord.freightCharges || 0,
                        "INR",
                        2,
                        2,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-amber-800">
                    <span>GST:</span>
                    <span className="font-semibold">
                      ₹{" "}
                      {formatNumberForCurrency(
                        viewingRecord.gst || 0,
                        "INR",
                        2,
                        2,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>
                      TCS Applicable ({viewingRecord.tcsApplicableOrNot || "No"}
                      ):
                    </span>
                    <span className="font-semibold">
                      ₹{" "}
                      {formatNumberForCurrency(
                        viewingRecord.tcsAmount || 0,
                        "INR",
                        2,
                        2,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-purple-200 pt-1.5 text-sm font-extrabold text-purple-950">
                    <span>Grand Total (INR):</span>
                    <span>
                      ₹{" "}
                      {formatNumberForCurrency(
                        viewingRecord.totalInNum || 0,
                        "INR",
                        2,
                        2,
                      )}
                    </span>
                  </div>
                  <div className="pt-1 text-[11px] font-serif italic text-slate-700">
                    {viewingRecord.amountInWord || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE PI CONFIRMATION MODAL */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900">
                  Delete Proforma Invoice
                </h4>
                <p className="text-xs text-slate-500">
                  This action will delete the row in Google Sheets via Apps
                  Script.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 my-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
              Are you sure you want to permanently delete PI{" "}
              <span className="font-bold font-mono text-slate-900">
                {deletingRecord.piNumber || deletingRecord.id}
              </span>{" "}
              for customer{" "}
              <span className="font-bold text-slate-900">
                {deletingRecord.billToCompanyName}
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
                  if (deletingRecord.id) {
                    onDeletePi(deletingRecord.id);
                  }
                  setDeletingRecord(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Delete PI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Full Screen Loader */}
      <FullScreenLoader show={isSubmitting} message={loaderMessage} />
    </div>
  );
}

/**
 * Normalizes rows fetched from Google Sheets via Apps Script into standard PiRecord shape.
 * Accommodates exact user requested headers and camelCase properties.
 */
export function normalizePiRow(row: any, defaultUserName: string): PiRecord {
  const idVal =
    row.id ||
    row["PI Number"] ||
    row.piNumber ||
    `pi-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  const piDateVal = row["PI Date"] || row.piDate || row.date || "";
  const piNumberVal = row["PI Number"] || row.piNumber || "";
  const createEditDateVal = row["Create/Edit Date"] || row.createEditDate || "";

  const orderPlacedByVal =
    row["Order Placed by (Customer Dealing Person Name)"] ||
    row.orderPlacedBy ||
    "";
  const customerMobileVal =
    row["Mobile Number (Customer Dealing Person)"] ||
    row.customerMobileNumber ||
    "";
  const customerEmailVal =
    row["E-Mail ID (Customer Dealing Person)"] || row.customerEmailId || "";
  const billToCompanyVal =
    row["Company Name (Bill To - Customer Billing Name"] ||
    row["Company Name (Bill To - Customer Billing Name)"] ||
    row.billToCompanyName ||
    "";
  const billToAddressVal =
    row["Company Address (Bill To) - Customer Billing Address"] ||
    row.billToAddress ||
    "";
  const shipToCompanyVal =
    row["Company Name (Ship To) - Company Delivery Name / Location"] ||
    row.shipToCompanyName ||
    "";
  const shipToAddressVal =
    row["Company Shipping Address (Ship To) - Company Delivery Address"] ||
    row.shipToAddress ||
    "";
  const buyersOrderNumberVal =
    row["Buyer's Order Number"] || row.buyersOrderNumber || "";

  const paymentTermsVal = row["PAYMENT TERM'S"] || row.paymentTerms || "";
  const otherTermsVal =
    row["OTHER TERM'S / TERMS OF DELIVERY"] || row.otherTerms || "";
  const aolBankAccountVal =
    row["IN WHICH AOL BANK ACCOUNT YOU WANT TO RECIVED PAYMENT"] ||
    row.aolBankAccount ||
    "";
  const accountNoVal = row["Account No"] || row.accountNo || "";
  const ifscCodeVal = row["IFSC Code"] || row.ifscCode || "";
  const aolBranchGodownVal =
    row["AOL BRANCH/ GODOWN"] || row.aolBranchGodown || "";
  const aolBranchAddressVal = row["Address"] || row.aolBranchAddress || "";
  const aolBranchGstinVal = row["GSTIN"] || row.aolBranchGstin || "";
  const aolSalesPersonNameVal =
    row["AOL Sales Person Name"] || row.aolSalesPersonName || "";
  const aolSalesPersonEmailVal =
    row["Email Address"] || row.aolSalesPersonEmail || "";

  const productName1Val = row["Product Name 1"] || row.productName1 || "";
  const productQty1Val =
    parseFloat(
      row["Product 1 Quantity"] ?? row["Product Quantity 1"] ?? row.productQty1,
    ) || 0;
  const productRate1Val =
    parseFloat(
      row["Product 1 Rate"] ?? row["Product Rate 1"] ?? row.productRate1,
    ) || 0;
  const amount1Val =
    parseFloat(row["Amount 1"] ?? row.amount1) ||
    productQty1Val * productRate1Val;

  const freightChargesVal =
    parseFloat(row["Freight Charges"] ?? row.freightCharges) || 0;
  const tcsApplicableVal =
    row["TCS Applicable Or Not"] || row.tcsApplicableOrNot || "No";
  const deliveryNoteTermsVal =
    row["Terms of Delivery or Delivery Note"] || row.deliveryNoteTerms || "";
  const partyRemarkVal =
    row["Any Note or Remark for the party"] || row.partyRemark || "";

  const subTotalVal = parseFloat(row["Sub Total"] ?? row.subTotal) || 0;
  const gstVal = parseFloat(row["GST"] ?? row.gst) || 0;
  const tcsAmountVal = parseFloat(row["TCS Amount"] ?? row.tcsAmount) || 0;
  const totalInNumVal =
    parseFloat(row["Total (In Num)"] ?? row.totalInNum) ||
    subTotalVal + freightChargesVal + gstVal + tcsAmountVal;
  const amountInWordVal =
    row["Amount in Word"] ||
    row.amountInWord ||
    formatAmountInWords(totalInNumVal, "INR");

  const createdByVal =
    row["Created By"] ||
    row["Created by"] ||
    row.createdBy ||
    row.created_by ||
    row["Created By Name"] ||
    row["Created By Email"] ||
    row["Current User"] ||
    defaultUserName;
  const createdByUserIdVal =
    row.createdByUserId ||
    row["Created By User ID"] ||
    row["created_by_user_id"] ||
    "";
  const editByVal = row["Edit By"] || row.editBy || "";
  const editTimestampVal = row["Edit Timestamp"] || row.editTimestamp || "";
  const createdAtVal =
    row["Created_at"] || row.createdAt || new Date().toISOString();
  const piPdfUrlVal =
    row["PDF File URLs"] ||
    row.piPdfUrl ||
    row["PDF File URL"] ||
    row["Pdf File Url"] ||
    row["pdf_url"] ||
    row["pdfUrl"] ||
    "";

  const record: PiRecord = {
    id: idVal,
    createdAt: createdAtVal,
    piDate: piDateVal,
    piNumber: piNumberVal,
    createEditDate: createEditDateVal,

    orderPlacedBy: orderPlacedByVal,
    customerMobileNumber: customerMobileVal,
    customerEmailId: customerEmailVal,
    billToCompanyName: billToCompanyVal,
    billToAddress: billToAddressVal,
    shipToCompanyName: shipToCompanyVal,
    shipToAddress: shipToAddressVal,
    buyersOrderNumber: buyersOrderNumberVal,

    paymentTerms: paymentTermsVal,
    otherTerms: otherTermsVal,
    aolBankAccount: aolBankAccountVal,
    accountNo: accountNoVal,
    ifscCode: ifscCodeVal,
    aolBranchGodown: aolBranchGodownVal,
    aolBranchAddress: aolBranchAddressVal,
    aolBranchGstin: aolBranchGstinVal,
    aolSalesPersonName: aolSalesPersonNameVal,
    aolSalesPersonEmail: aolSalesPersonEmailVal,

    productName1: productName1Val,
    productQty1: productQty1Val,
    productRate1: productRate1Val,
    amount1: amount1Val,

    freightCharges: freightChargesVal,
    tcsApplicableOrNot: tcsApplicableVal,
    deliveryNoteTerms: deliveryNoteTermsVal,
    partyRemark: partyRemarkVal,
    subTotal: subTotalVal,
    gst: gstVal,
    tcsAmount: tcsAmountVal,
    totalInNum: totalInNumVal,
    amountInWord: amountInWordVal,

    createdBy: createdByVal,
    createdByUserId: createdByUserIdVal || undefined,
    editBy: editByVal,
    editTimestamp: editTimestampVal,
    piPdfUrl: piPdfUrlVal,
  };

  for (let i = 2; i <= 4; i++) {
    const pName = row[`Product Name ${i}`] || row[`productName${i}`] || "";
    const qRaw =
      row[`Product Quantity ${i}`] !== undefined &&
      row[`Product Quantity ${i}`] !== ""
        ? row[`Product Quantity ${i}`]
        : row[`Product ${i} Quantity`] !== undefined &&
            row[`Product ${i} Quantity`] !== ""
          ? row[`Product ${i} Quantity`]
          : row[`productQty${i}`];
    const rRaw =
      row[`Product Rate ${i}`] !== undefined && row[`Product Rate ${i}`] !== ""
        ? row[`Product Rate ${i}`]
        : row[`Product ${i} Rate`] !== undefined &&
            row[`Product ${i} Rate`] !== ""
          ? row[`Product ${i} Rate`]
          : row[`productRate${i}`];
    const aRaw =
      row[`Amount ${i}`] !== undefined && row[`Amount ${i}`] !== ""
        ? row[`Amount ${i}`]
        : row[`amount${i}`];

    if (
      pName ||
      qRaw !== undefined ||
      rRaw !== undefined ||
      aRaw !== undefined
    ) {
      (record as any)[`productName${i}`] = pName;
      (record as any)[`productQty${i}`] =
        qRaw !== undefined && qRaw !== "" ? parseFloat(qRaw) || 0 : undefined;
      (record as any)[`productRate${i}`] =
        rRaw !== undefined && rRaw !== "" ? parseFloat(rRaw) || 0 : undefined;
      (record as any)[`amount${i}`] =
        aRaw !== undefined && aRaw !== "" ? parseFloat(aRaw) || 0 : undefined;
    }
  }

  return record;
}
