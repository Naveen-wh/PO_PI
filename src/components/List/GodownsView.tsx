import React, { useState } from "react";
import {
  Warehouse,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  AlertCircle,
  Building2,
  MapPin,
  User as UserIcon,
  Mail,
  Phone,
  FileText,
  Check,
  RotateCcw,
  Receipt,
} from "lucide-react";
import { User, AolGodown, AolBranchName, DispatchLocation } from "../../types";

interface GodownsViewProps {
  activeUserId: string;
  users: User[];
  aolGodowns: AolGodown[];
  aolBranches: AolBranchName[];
  dispatchLocations?: DispatchLocation[];
  onAddAolGodown: (data: Omit<AolGodown, "id" | "createdAt">) => void;
  onEditAolGodown: (id: string, data: Omit<AolGodown, "id" | "createdAt">) => void;
  onDeleteAolGodown: (id: string) => void;
}

export default function GodownsView({
  activeUserId,
  users,
  aolGodowns,
  aolBranches,
  dispatchLocations = [],
  onAddAolGodown,
  onEditAolGodown,
  onDeleteAolGodown,
}: GodownsViewProps) {
  const activeUser = users.find((u) => u.id === activeUserId);
  const isManagerOrAdmin =
    activeUser?.accessLevel === "Manager" || activeUser?.role === "Admin";

  const [searchQuery, setSearchQuery] = useState("");
  const [filterBranch, setFilterBranch] = useState("all");

  // Form Fields as requested:
  // 1. "AOL Godown Name"
  // 2. "AOL Branch Name"
  // 3. "GSTIN"
  // 4. "Address"
  // 5. "Dispatch Location / City"
  // 6. "Warehouse Manager"
  // 7. "Contact Email"
  // 8. "Phone No"
  // 9. "Description / Remarks"
  const [godownName, setGodownName] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [gstin, setGstin] = useState("");
  const [address, setAddress] = useState("");
  const [dispatchLocation, setDispatchLocation] = useState("");
  const [warehouseManager, setWarehouseManager] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [description, setDescription] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setGodownName("");
    setSelectedBranch("");
    setGstin("");
    setAddress("");
    setDispatchLocation("");
    setWarehouseManager("");
    setContactEmail("");
    setPhoneNo("");
    setDescription("");
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManagerOrAdmin) return;

    if (!godownName.trim()) {
      setError("AOL Godown Name is required.");
      return;
    }

    if (!selectedBranch.trim()) {
      setError("Please select or enter an AOL Branch Name.");
      return;
    }

    // Check for duplicate godown name (case-insensitive)
    const isDuplicate = aolGodowns.some(
      (g) =>
        g.name.trim().toLowerCase() === godownName.trim().toLowerCase() &&
        g.id !== editingId
    );

    if (isDuplicate) {
      setError(`A godown named "${godownName.trim()}" already exists.`);
      return;
    }

    setError(null);

    const payload: Omit<AolGodown, "id" | "createdAt"> = {
      name: godownName.trim(),
      branchName: selectedBranch.trim(),
      gstin: gstin.trim().toUpperCase(),
      address: address.trim(),
      dispatchLocation: dispatchLocation.trim(),
      warehouseManager: warehouseManager.trim(),
      contactEmail: contactEmail.trim(),
      phoneNo: phoneNo.trim(),
      description: description.trim(),
    };

    if (editingId) {
      onEditAolGodown(editingId, payload);
    } else {
      onAddAolGodown(payload);
    }

    resetForm();
  };

  const handleStartEdit = (godown: AolGodown) => {
    setEditingId(godown.id);
    setGodownName(godown.name || "");
    setSelectedBranch(godown.branchName || "");
    setGstin(godown.gstin || "");
    setAddress(godown.address || "");
    setDispatchLocation(godown.dispatchLocation || "");
    setWarehouseManager(godown.warehouseManager || "");
    setContactEmail(godown.contactEmail || "");
    setPhoneNo(godown.phoneNo || "");
    setDescription(godown.description || "");
    setConfirmDeleteId(null);
    setError(null);

    // Scroll smoothly to form
    const formElement = document.getElementById("godown-form-container");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  // Filter godowns based on search query and branch filter
  const filteredGodowns = aolGodowns.filter((g) => {
    const term = searchQuery.toLowerCase().trim();
    const branchFilterMatch =
      filterBranch === "all" ||
      (g.branchName || "").toLowerCase() === filterBranch.toLowerCase();

    if (!branchFilterMatch) return false;
    if (!term) return true;

    const nameMatch = (g.name || "").toLowerCase().includes(term);
    const branchMatch = (g.branchName || "").toLowerCase().includes(term);
    const gstinMatch = (g.gstin || "").toLowerCase().includes(term);
    const addressMatch = (g.address || "").toLowerCase().includes(term);
    const locationMatch = (g.dispatchLocation || "").toLowerCase().includes(term);
    const managerMatch = (g.warehouseManager || "").toLowerCase().includes(term);
    const emailMatch = (g.contactEmail || "").toLowerCase().includes(term);
    const phoneMatch = (g.phoneNo || "").toLowerCase().includes(term);
    const descMatch = (g.description || "").toLowerCase().includes(term);

    return (
      nameMatch ||
      branchMatch ||
      gstinMatch ||
      addressMatch ||
      locationMatch ||
      managerMatch ||
      emailMatch ||
      phoneMatch ||
      descMatch
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Information Header */}
      <div className="bg-slate-50/70 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase font-mono tracking-wider flex items-center gap-2">
            <Warehouse className="text-emerald-600 dark:text-emerald-400" size={16} />
            Godowns & Warehouses Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage company godowns with AOL Branch mapping, GSTIN, physical address, dispatch locations, warehouse managers, and contact details.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg font-semibold">
            Total: {aolGodowns.length} Godowns
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Column (5 cols on lg) */}
        <div
          id="godown-form-container"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs lg:col-span-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  editingId ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {editingId ? <Edit2 size={16} /> : <Warehouse size={16} />}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wide">
                  {editingId ? "Edit AOL Godown" : "Add New AOL Godown"}
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

            {/* 1. AOL Godown Name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase font-mono tracking-wide mb-1">
                AOL Godown Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  disabled={!isManagerOrAdmin}
                  value={godownName}
                  onChange={(e) => setGodownName(e.target.value)}
                  placeholder="e.g. Bhiwandi Central Godown, Sonipat WH-1"
                  className="w-full text-xs border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 text-slate-800 disabled:opacity-50 font-medium"
                />
              </div>
            </div>

            {/* 2. AOL Branch Name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase font-mono tracking-wide mb-1">
                AOL Branch Name <span className="text-rose-500">*</span>
              </label>
              <select
                required
                disabled={!isManagerOrAdmin}
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full text-xs border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 disabled:opacity-50 cursor-pointer font-medium"
              >
                <option value="">-- Select AOL Branch Name --</option>
                {aolBranches.map((branch) => (
                  <option key={branch.id} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2-Column Grid for GSTIN & Dispatch Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 3. GSTIN */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase font-mono tracking-wide mb-1">
                  GSTIN
                </label>
                <input
                  type="text"
                  disabled={!isManagerOrAdmin}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="e.g. 27AAACA1234A1Z5"
                  maxLength={15}
                  className="w-full text-xs border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 text-slate-800 font-mono disabled:opacity-50 uppercase"
                />
              </div>

              {/* 5. Dispatch Location / City */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase font-mono tracking-wide mb-1">
                  Dispatch Location / City
                </label>
                <input
                  type="text"
                  list="dispatch-locations-datalist"
                  disabled={!isManagerOrAdmin}
                  value={dispatchLocation}
                  onChange={(e) => setDispatchLocation(e.target.value)}
                  placeholder="e.g. Bhiwandi, Mumbai..."
                  className="w-full text-xs border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 text-slate-800 disabled:opacity-50"
                />
                <datalist id="dispatch-locations-datalist">
                  {dispatchLocations.map((loc) => (
                    <option key={loc.id} value={loc.name} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* 4. Address */}
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase font-mono tracking-wide mb-1">
                Address
              </label>
              <textarea
                disabled={!isManagerOrAdmin}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full physical godown / warehouse address with landmark & pincode"
                rows={2}
                className="w-full text-xs border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 text-slate-800 disabled:opacity-50 resize-none"
              />
            </div>

            {/* 6. Warehouse Manager */}
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase font-mono tracking-wide mb-1">
                Warehouse Manager
              </label>
              <input
                type="text"
                disabled={!isManagerOrAdmin}
                value={warehouseManager}
                onChange={(e) => setWarehouseManager(e.target.value)}
                placeholder="e.g. Ramesh Sharma"
                className="w-full text-xs border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 text-slate-800 disabled:opacity-50"
              />
            </div>

            {/* 2-Column Grid for Contact Email & Phone No */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 7. Contact Email */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase font-mono tracking-wide mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  disabled={!isManagerOrAdmin}
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. godown@aromaorganic.in"
                  className="w-full text-xs border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 text-slate-800 disabled:opacity-50 font-mono text-[11px]"
                />
              </div>

              {/* 8. Phone No */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase font-mono tracking-wide mb-1">
                  Phone No
                </label>
                <input
                  type="tel"
                  disabled={!isManagerOrAdmin}
                  value={phoneNo}
                  onChange={(e) => setPhoneNo(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full text-xs border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 text-slate-800 disabled:opacity-50 font-mono"
                />
              </div>
            </div>

            {/* 9. Description / Remarks */}
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase font-mono tracking-wide mb-1">
                Description / Remarks
              </label>
              <textarea
                disabled={!isManagerOrAdmin}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Storage capacity, working hours, specialized handling, key notes..."
                rows={2}
                className="w-full text-xs border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 text-slate-800 disabled:opacity-50 resize-none"
              />
            </div>

            {/* Submit & Reset Buttons */}
            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={!isManagerOrAdmin}
                className={`flex-1 text-white text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-2xs ${
                  editingId
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                } disabled:bg-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed`}
              >
                {editingId ? (
                  <>
                    <Check size={14} /> Update AOL Godown
                  </>
                ) : (
                  <>
                    <Plus size={14} /> Add AOL Godown
                  </>
                )}
              </button>

              {editingId ? (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-all"
                >
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resetForm}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg cursor-pointer transition-all"
                  title="Reset fields"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List / Table Column (7 cols on lg) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs lg:col-span-7 flex flex-col h-full">
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wide">
                Current Godowns ({filteredGodowns.length}
                {filteredGodowns.length !== aolGodowns.length && ` of ${aolGodowns.length}`})
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Configured Godowns mapped across branches
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Branch Filter */}
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="text-xs border border-slate-200 bg-slate-50 px-2.5 py-1.5 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 font-medium"
              >
                <option value="all">All Branches</option>
                {aolBranches.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>

              {/* Search Input */}
              <div className="relative max-w-xs w-full sm:w-52">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search all fields..."
                  className="w-full text-xs border border-slate-200 bg-slate-50 pl-8 pr-7 py-1.5 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 text-slate-800"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto max-h-[640px] pr-1 space-y-3">
            {filteredGodowns.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                <Warehouse size={28} className="mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="font-semibold text-slate-600">No Godowns found</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {searchQuery || filterBranch !== "all"
                    ? "Try adjusting search or branch filter"
                    : "Add your first AOL Godown using the form on the left"}
                </p>
              </div>
            ) : (
              filteredGodowns.map((godown) => {
                const isConfirmingDelete = confirmDeleteId === godown.id;
                const isCurrentEditing = editingId === godown.id;

                return (
                  <div
                    key={godown.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isCurrentEditing
                        ? "bg-amber-50/60 border-amber-300 ring-1 ring-amber-400"
                        : "bg-slate-50/70 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    {isConfirmingDelete ? (
                      <div className="flex items-center justify-between w-full bg-rose-50 p-2.5 rounded-lg border border-rose-200 animate-fade-in">
                        <span className="text-[11px] text-rose-800 font-bold font-mono">
                          Delete "{godown.name}" Godown record?
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              onDeleteAolGodown(godown.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2.5 py-1 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700 cursor-pointer"
                          >
                            Yes, Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-[10px] font-bold hover:bg-slate-300 cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Header: Name, Branch, GSTIN & Actions */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="p-2 bg-emerald-100/70 text-emerald-800 rounded-lg shrink-0 mt-0.5">
                              <Warehouse size={16} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-bold text-slate-900 truncate">
                                  {godown.name}
                                </h4>
                                {godown.branchName && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0 font-mono">
                                    Branch: {godown.branchName}
                                  </span>
                                )}
                                {godown.gstin && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                                    <Receipt size={10} />
                                    {godown.gstin}
                                  </span>
                                )}
                              </div>

                              {godown.dispatchLocation && (
                                <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-1 font-medium">
                                  <MapPin size={11} className="text-emerald-600 shrink-0" />
                                  <span className="text-slate-400 font-mono text-[10px]">Location / City:</span>
                                  <span>{godown.dispatchLocation}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            {isManagerOrAdmin ? (
                              <>
                                <button
                                  onClick={() => handleStartEdit(godown)}
                                  className="text-slate-400 hover:text-amber-600 p-1.5 rounded-lg hover:bg-amber-50 transition-all cursor-pointer"
                                  title={`Edit ${godown.name}`}
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(godown.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                                  title={`Delete ${godown.name}`}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">View Only</span>
                            )}
                          </div>
                        </div>

                        {/* Address */}
                        {godown.address && (
                          <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100 flex items-start gap-1.5">
                            <Building2 size={12} className="text-slate-400 shrink-0 mt-0.5" />
                            <span className="break-words line-clamp-2">{godown.address}</span>
                          </div>
                        )}

                        {/* Manager, Email & Phone Row */}
                        {(godown.warehouseManager || godown.contactEmail || godown.phoneNo) && (
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                            {godown.warehouseManager && (
                              <span className="inline-flex items-center gap-1">
                                <UserIcon size={11} className="text-slate-400" />
                                <span className="font-semibold text-slate-800">
                                  {godown.warehouseManager}
                                </span>
                              </span>
                            )}
                            {godown.contactEmail && (
                              <a
                                href={`mailto:${godown.contactEmail}`}
                                className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-mono text-[10px]"
                              >
                                <Mail size={11} className="text-slate-400" />
                                {godown.contactEmail}
                              </a>
                            )}
                            {godown.phoneNo && (
                              <a
                                href={`tel:${godown.phoneNo}`}
                                className="inline-flex items-center gap-1 text-slate-700 hover:underline font-mono text-[10px]"
                              >
                                <Phone size={11} className="text-slate-400" />
                                {godown.phoneNo}
                              </a>
                            )}
                          </div>
                        )}

                        {/* Description / Remarks */}
                        {godown.description && (
                          <p className="text-[10px] text-slate-500 italic flex items-start gap-1 pt-0.5">
                            <FileText size={10} className="text-slate-400 shrink-0 mt-0.5" />
                            <span>{godown.description}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
