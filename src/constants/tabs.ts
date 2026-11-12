export interface SubTabConfig {
  id: string;
  label: string;
}

export interface TabConfig {
  id: string;
  label: string;
  subTabs?: SubTabConfig[];
}

export const TABS_CONFIG: TabConfig[] = [
  {
    id: "po_module",
    label: "PO"
  },
  {
    id: "pi_module",
    label: "PI"
  },
  {
    id: "list_management",
    label: "List Management",
    subTabs: [
      { id: "products", label: "Product Catalog" },
      { id: "users", label: "User Management" },
      { id: "clients", label: "Client Management" },
      { id: "banks", label: "Payment Bank" },
      { id: "godowns", label: "Godowns" },
      { id: "suppliers", label: "Suppliers" },
      { id: "dropdowns", label: "Dropdowns" }
    ]
  },
  { id: "team", label: "Hierarchy & Team" },
];
