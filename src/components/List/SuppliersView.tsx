/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  AlertCircle,
  MapPin,
  Mail,
  Phone,
  FileText,
  User as UserIcon,
  Check,
  RotateCcw,
} from "lucide-react";
import { User, SupplierMasterRecord } from "../../types";

interface SuppliersViewProps {
  activeUserId: string;
  users: User[];
  suppliersMaster: SupplierMasterRecord[];
  onAddSupplierMaster: (data: Omit<SupplierMasterRecord, "id" | "createdAt">) => void;
  onEditSupplierMaster: (id: string, data: Omit<SupplierMasterRecord, "id" | "createdAt">) => void;
  onDeleteSupplierMaster: (id: string) => void;
}

export default function SuppliersView({
  activeUserId,
  users,
  suppliersMaster = [],
  onAddSupplierMaster,
  onEditSupplierMaster,
  onDeleteSupplierMaster,
}: SuppliersViewProps) {
  const activeUser = users.find((u) => u.id === activeUserId);
  const isManagerOrAdmin =
    activeUser?.accessLevel === "Manager" || activeUser?.role === "Admin";

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // "all", "Import", "Domestic"

  // Form Fields:
  // 1. Supplier Name
  // 2. Supplier GST
  // 3. Supplier Address
  // 4. Contact Person Name
  // 5. Contact Person Email
  // 6. Contact Person Phone
  // 7. Import/ Domestic
  // 8. Remarks
  const [supplierName, setSupplierName] = useState("");
  const [supplierGst, setSupplierGst] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [contactPersonName, setContactPersonName] = useState("");
  const [contactPersonEmail, setContactPersonEmail] = useState("");
  const [contactPersonPhone, setContactPersonPhone] = useState("");
  const [importDomestic, setImportDomestic] = useState<"Import" | "Domestic">("Import");
  const [remarks, setRemarks] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setSupplierName("");
    setSupplierGst("");
    setSupplierAddress("");
    setContactPersonName("");
    setContactPersonEmail("");
    setContactPersonPhone("");
    setImportDomestic("Import");
    setRemarks("");
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManagerOrAdmin) return;

    if (!supplierName.trim()) {
      setError("Supplier Name is required.");
      return;
    }

    // Check for duplicate supplier name (case-insensitive)
    const isDuplicate = suppliersMaster.some(
      (s) =>
        s.supplierName.trim().toLowerCase() === supplierName.trim().toLowerCase() &&
        s.id !== editingId
    );

    if (isDuplicate) {
      setError(`A supplier named "${supplierName.trim()}" already exists.`);
      return;
    }

    setError(null);

    const payload: Omit<SupplierMasterRecord, "id" | "createdAt"> = {
      supplierName: supplierName.trim(),
      supplierGst: supplierGst.trim().toUpperCase(),
      supplierAddress: supplierAddress.trim(),
      contactPersonName: contactPersonName.trim(),
      contactPersonEmail: contactPersonEmail.trim(),
      contactPersonPhone: contactPersonPhone.trim(),
      importDomestic: importDomestic,
      remarks: remarks.trim(),
    };

    if (editingId) {
      onEditSupplierMaster(editingId, payload);
    } else {
      onAddSupplierMaster(payload);
    }

    resetForm();
  };

  const handleStartEdit = (supplier: SupplierMasterRecord) => {
    setEditingId(supplier.id);
    setSupplierName(supplier.supplierName || "");
    setSupplierGst(supplier.supplierGst || "");
    setSupplierAddress(supplier.supplierAddress || "");
    setContactPersonName(supplier.contactPersonName || "");
    setContactPersonEmail(supplier.contactPersonEmail || "");
    setContactPersonPhone(supplier.contactPersonPhone || "");
    setImportDomestic((supplier.importDomestic as any) || "Import");
    setRemarks(supplier.remarks || "");
    setConfirmDeleteId(null);
    setError(null);

    const formElement = document.getElementById("supplier-form-container");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  // Filter suppliers
  const filteredSuppliers = suppliersMaster.filter((s) => {
    const term = searchQuery.toLowerCase().trim();
    const typeMatch =
      filterType === "all" ||
      (s.importDomestic || "").toLowerCase() === filterType.toLowerCase();

    if (!typeMatch) return false;
    if (!term) return true;

    return (
      (s.supplierName || "").toLowerCase().includes(term) ||
      (s.supplierGst || "").toLowerCase().includes(term) ||
      (s.supplierAddress || "").toLowerCase().includes(term) ||
      (s.contactPersonName || "").toLowerCase().includes(term) ||
      (s.contactPersonEmail || "").toLowerCase().includes(term) ||
      (s.contactPersonPhone || "").toLowerCase().includes(term) ||
      (s.importDomestic || "").toLowerCase().includes(term) ||
      (s.remarks || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Information Header */}
      <div className="bg-slate-50/70 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase font-mono tracking-wider flex items-center gap-2">
            <Building2 className="text-emerald-600 dark:text-emerald-400" size={16} />
            Suppliers Master Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage comprehensive supplier profiles with GSTIN, address, contact persons, import/domestic classification, and remarks.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg font-semibold">
            Total: {suppliersMaster.length} Suppliers
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Column (5 cols on lg) */}
        <div
          id="supplier-form-container"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs lg:col-span-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  editingId ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {editingId ? <Edit2 size={16} /> : <Building2 size={16} />}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wide">
                  {editingId ? "Edit Supplier Record" : "Add New Supplier"}
                </h3>
                {editingId && (
                  <p className="text-[10px] text-amber-700 font-mono mt-0.5">
                    Modifying existing record
                  </p>
                )}
              </div>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-mono font-medium flex items-center gap-1 cursor-pointer"
              >
                <X size={12} /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-lg text-[11px] font-medium font-mono">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Supplier Name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase font-mono tracking-wide mb-1">
                Supplier Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={!isManagerOrAdmin}
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="e.g. Global Chemicals Ltd, Aura Enterprises"
                className="w-full text-xs border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 text-slate-800 disabled:opacity-50 font-medium"
              />
            </div>

            {/* Supplier GST & Import/ Domestic in Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase font-mono tracking-wide mb-1">
                  Supplier GST
                </label>
                <input
                  type="text"
                  disabled={!isManagerOrAdmin}
                  value={supplierGst}
                  onChange={(e) => setSupplierGst(e.target.value)}
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  className="w-full text-xs border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 text-slate-800 disabled:opacity-50 font-medium uppercase"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase font-mono tracking-wide mb-1">
                  Import / Domestic <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  disabled={!isManagerOrAdmin}
                  value={importDomestic}
                  onChange={(e) => setImportDomestic(e.target.value as any)}
                  className="w-full text-xs border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 disabled:opacity-50 cursor-pointer font-medium"
                >
                  <option value="Import">Import</option>
                  <option value="Domestic">Domestic</option>
                </select>
              </div>
            </div>

            {/* Supplier Address */}
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase font-mono tracking-wide mb-1">
                Supplier Address
              </label>
              <textarea
                rows={2}
                disabled={!isManagerOrAdmin}
                value={supplierAddress}
                onChange={(e) => setSupplierAddress(e.target.value)}
                placeholder="Enter complete physical address..."
                className="w-full text-xs border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 text-slate-800 disabled:opacity-50 font-medium resize-none"
              />
            </div>

            {/* Contact Person Name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase font-mono tracking-wide mb-1">
                Contact Person Name
              </label>
              <input
                type="text"
                disabled={!isManagerOrAdmin}
                value={contactPersonName}
                onChange={(e) => setContactPersonName(e.target.value)}
                placeholder="e.g. John Doe / Sales Manager"
                className="w-full text-xs border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 text-slate-800 disabled:opacity-50 font-medium"
              />
            </div>

            {/* Contact Person Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase font-mono tracking-wide mb-1">
                  Contact Person Email
                </label>
                <input
                  type="email"
                  disabled={!isManagerOrAdmin}
                  value={contactPersonEmail}
                  onChange={(e) => setContactPersonEmail(e.target.value)}
                  placeholder="contact@supplier.com"
                  className="w-full text-xs border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 text-slate-800 disabled:opacity-50 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase font-mono tracking-wide mb-1">
                  Contact Person Phone
                </label>
                <input
                  type="text"
                  disabled={!isManagerOrAdmin}
                  value={contactPersonPhone}
                  onChange={(e) => setContactPersonPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 text-slate-800 disabled:opacity-50 font-medium"
                />
              </div>
            </div>

            {/* Remarks / Description */}
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase font-mono tracking-wide mb-1">
                Remarks / Description
              </label>
              <textarea
                rows={2}
                disabled={!isManagerOrAdmin}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Additional notes or commercial terms..."
                className="w-full text-xs border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 text-slate-800 disabled:opacity-50 font-medium resize-none"
              />
            </div>

            {isManagerOrAdmin ? (
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2.5 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer font-mono"
                >
                  <Plus size={14} />
                  {editingId ? "Update Supplier" : "Add Supplier"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs py-2.5 px-3 rounded-xl transition-all cursor-pointer font-mono"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-center text-xs font-mono">
                🔒 Manager / Admin access required to modify suppliers.
              </div>
            )}
          </form>
        </div>

        {/* Table Column (7 cols on lg) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-3xs overflow-hidden lg:col-span-7 flex flex-col">
          {/* Search and Filters Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/70 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search suppliers..."
                className="w-full text-xs bg-white border border-slate-200 pl-9 pr-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 placeholder-slate-400 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-xs border border-slate-200 bg-white px-3 py-2 rounded-lg outline-none text-slate-700 font-medium cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="Import">Import</option>
                <option value="Domestic">Domestic</option>
              </select>

              {(searchQuery || filterType !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterType("all");
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-mono px-2 py-1 bg-slate-100 rounded-lg cursor-pointer"
                  title="Reset filters"
                >
                  <RotateCcw size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            {filteredSuppliers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-mono">
                No supplier records found.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold font-mono uppercase tracking-wider text-slate-600 dark:text-slate-200 sticky top-0 z-10">
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3">GSTIN</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Contact Person</th>
                    <th className="p-3">Email / Phone</th>
                    <th className="p-3">Address</th>
                    <th className="p-3">Remarks</th>
                    {isManagerOrAdmin && <th className="p-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredSuppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        editingId === supplier.id ? "bg-amber-50/60" : ""
                      }`}
                    >
                      <td className="p-3 font-semibold text-slate-800">
                        {supplier.supplierName}
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {supplier.supplierGst || "-"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                            supplier.importDomestic === "Import"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {supplier.importDomestic || "Import"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700">
                        {supplier.contactPersonName || "-"}
                      </td>
                      <td className="p-3 text-slate-600">
                        <div>{supplier.contactPersonEmail || "-"}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {supplier.contactPersonPhone || ""}
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 max-w-xs truncate" title={supplier.supplierAddress}>
                        {supplier.supplierAddress || "-"}
                      </td>
                      <td className="p-3 text-slate-500 italic max-w-xs truncate" title={supplier.remarks}>
                        {supplier.remarks || "-"}
                      </td>
                      {isManagerOrAdmin && (
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          {confirmDeleteId === supplier.id ? (
                            <div className="inline-flex items-center gap-1 bg-rose-50 p-1 rounded-lg border border-rose-200">
                              <span className="text-[10px] font-mono text-rose-700 px-1 font-bold">Delete?</span>
                              <button
                                onClick={() => {
                                  onDeleteSupplierMaster(supplier.id);
                                  setConfirmDeleteId(null);
                                  if (editingId === supplier.id) resetForm();
                                }}
                                className="bg-rose-600 hover:bg-rose-700 text-white p-1 rounded text-[10px] font-mono cursor-pointer"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-1 rounded text-[10px] font-mono cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(supplier)}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Supplier"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(supplier.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Supplier"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
