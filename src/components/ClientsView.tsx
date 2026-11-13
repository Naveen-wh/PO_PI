import React, { useState } from "react";
import { User, Client, Team, Product, SalesLead, ProjectWorkflow, SalesTask } from "../types";
import { Briefcase, Plus, Search, Edit2, Trash2, X, Building2, Mail, Phone, MapPin, Hash, Upload } from "lucide-react";
import ClientBulkImportModal, { BulkClientImportItem } from "./List/ClientBulkImportModal";

interface ClientsViewProps {
  activeUserId: string;
  users: User[];
  clients: Client[];
  teams: Team[];
  onAddClient?: (client: Omit<Client, "id" | "createdAt">) => Promise<void> | void;
  onEditClient?: (clientId: string, client: Partial<Client>) => Promise<void> | void;
  onDeleteClient?: (clientId: string) => Promise<void> | void;
  onBulkImportClients?: (records: BulkClientImportItem[]) => Promise<void> | void;
  leads?: SalesLead[];
  workflows?: ProjectWorkflow[];
  products?: Product[];
  tasks?: SalesTask[];
  onAddTask?: (task: Omit<SalesTask, "id">) => Promise<void> | void;
  onToggleTaskComplete?: (taskId: string) => Promise<void> | void;
  onDeleteTask?: (taskId: string) => Promise<void> | void;
}

export default function ClientsView({
  clients = [],
  onAddClient,
  onEditClient,
  onDeleteClient,
  onBulkImportClients,
}: ClientsViewProps) {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gst, setGst] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");

  const filteredClients = clients.filter(
    (c) =>
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingClient(null);
    setFullName("");
    setCompanyName("");
    setEmail("");
    setPhone("");
    setGst("");
    setCity("");
    setPincode("");
    setAddress("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFullName(client.fullName || "");
    setCompanyName(client.companyName || "");
    setEmail(client.email || "");
    setPhone(client.phone || "");
    setGst(client.gst || "");
    setCity(client.city || "");
    setPincode(client.pincode || "");
    setAddress(client.address || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      if (onEditClient) {
        await onEditClient(editingClient.id, {
          fullName,
          companyName,
          email,
          phone,
          gst,
          city,
          pincode,
          address,
        });
      }
    } else {
      if (onAddClient) {
        await onAddClient({
          fullName,
          companyName,
          email,
          phone,
          gst,
          city,
          pincode,
          address,
        });
      }
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase font-mono tracking-wider flex items-center gap-2">
            <Briefcase size={16} className="text-emerald-600" />
            Client Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">
            Manage customer accounts, tax credentials & billing contacts
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48 font-medium"
            />
          </div>
          {(onAddClient || onBulkImportClients) && (
            <button
              type="button"
              onClick={() => setIsBulkImportOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-3xs transition-all"
            >
              <Upload size={14} /> Import CSV / Sheet
            </button>
          )}
          {onAddClient && (
            <button
              onClick={handleOpenAdd}
              className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus size={14} /> Add Client
            </button>
          )}
        </div>
      </div>

      {/* Clients grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredClients.map((client) => (
          <div
            key={client.id}
            className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 hover:border-slate-300 transition shadow-2xs"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{client.companyName || client.fullName}</h3>
                {client.fullName && client.companyName && (
                  <p className="text-xs text-slate-500 font-medium">{client.fullName}</p>
                )}
              </div>
              <div className="flex gap-1">
                {onEditClient && (
                  <button
                    onClick={() => handleOpenEdit(client)}
                    className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-50"
                  >
                    <Edit2 size={13} />
                  </button>
                )}
                {onDeleteClient && (
                  <button
                    onClick={() => onDeleteClient(client.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-50"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5 text-xs font-mono text-slate-600 pt-1 border-t border-slate-100">
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail size={12} className="text-slate-400 shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={12} className="text-slate-400 shrink-0" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.gst && (
                <div className="flex items-center gap-2">
                  <Hash size={12} className="text-slate-400 shrink-0" />
                  <span>GST: {client.gst}</span>
                </div>
              )}
              {(client.city || client.address) && (
                <div className="flex items-center gap-2">
                  <MapPin size={12} className="text-slate-400 shrink-0" />
                  <span className="truncate">{[client.city, client.address].filter(Boolean).join(", ")}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="col-span-full py-8 text-center text-slate-400 font-mono text-xs bg-white rounded-xl border border-slate-200">
            No clients found.
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 font-mono">
                {editingClient ? "Edit Client" : "Add New Client"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase font-mono text-slate-600 block mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase font-mono text-slate-600 block mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase font-mono text-slate-600 block mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase font-mono text-slate-600 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase font-mono text-slate-600 block mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={gst}
                    onChange={(e) => setGst(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase font-mono text-slate-600 block mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase font-mono text-slate-600 block mb-1">Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      <ClientBulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        existingClients={clients}
        onAddClient={onAddClient}
        onEditClient={onEditClient}
        onBulkImportClients={onBulkImportClients}
      />
    </div>
  );
}
