/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { TABS_CONFIG } from "./constants/tabs";
import {
  User,
  ProjectWorkflow,
  SalesTask,
  ActionLog,
  Role,
  AccessLevel,
  TeamTabSettings,
  Client,
  Team,
  Product,
  OrderOffer,
  PaymentBank,
  ProductCategory,
  ProductGroup,
  Manufacturer,
  FreightTerm,
  TransporterName,
  WarehouseManagedBy,
  DispatchLocation,
  AolBranchName,
  SupplierName,
  AolGodown,
  PoRecord,
  PiRecord,
  SupplierMasterRecord
} from "./types";


// Firebase imports
import { auth, signOut, onAuthStateChanged } from "./firebase";
import { 
  seedDatabaseIfEmpty, 
  subscribeCollection, 
  saveTask, 
  deleteTaskDoc, 
  updateUserDetails,
  saveUserDoc,
  deleteUserDoc,
  syncUserProfile,
  saveTeamTabSettings,
  saveClient,
  deleteClientDoc,
  saveTeam,
  deleteTeamDoc,
  saveProduct,
  deleteProductDoc,
  saveOrder,
  deleteOrderDoc,
  savePaymentBank,
  deletePaymentBankDoc,
  saveProductCategory,
  deleteProductCategoryDoc,
  saveProductGroup,
  deleteProductGroupDoc,
  saveManufacturer,
  deleteManufacturerDoc,
  saveFreightTerm,
  deleteFreightTermDoc,
  saveTransporter,
  deleteTransporterDoc,
  saveWarehouse,
  deleteWarehouseDoc,
  saveDispatchLocation,
  deleteDispatchLocationDoc,
  isAuditLogEnabled,
  setAuditLogEnabled,
  saveAolBranch,
  deleteAolBranchDoc,
  saveSupplier,
  deleteSupplierDoc,
  saveAolGodown,
  deleteAolGodownDoc,
  saveSupplierMaster,
  deleteSupplierMasterDoc,
  BOOTSTRAP_ADMIN_EMAILS
} from "./lib/firebaseService";

import {
  fetchOperationalSheetData,
  syncOperationalAction,
  // clearOperationalSheetRecords,
  OPERATIONAL_COLLECTIONS
} from "./lib/operationalSheetsService";

// Sub-components
import ListManagementView from "./components/List/ListManagementView";
import AuthScreen from "./components/AuthScreen";
import PendingApprovalScreen from "./components/List/PendingApprovalScreen";
import PoView from "./components/PO/PoView";
import PiView, { normalizePiRow } from "./components/PI/PiView";
import TeamDirectoryView from "./components/List/TeamDirectoryView";
import { FontSizeToggle } from "./components/Utility/FontSizeToggle";

// Lucide Icons
import {
  Folders,
  Users2,
  LogOut,
  Receipt,
  FileSpreadsheet,
  Sun,
  Moon,
  Loader2
} from "lucide-react";

export default function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [activeUserId, setActiveUserId] = useState<string>("");
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Theme state (dark / light mode) with localStorage persistence
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const savedTheme = localStorage.getItem("app_theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        return savedTheme;
      }
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    try {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("app_theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("app_theme", "light");
      }
    } catch (e) {
      console.error("Theme sync error:", e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Collection states
  const [users, setUsers] = useState<User[]>([]);
  const [workflows, setWorkflows] = useState<ProjectWorkflow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tasks, setTasks] = useState<SalesTask[]>([]);
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [tabSettings, setTabSettings] = useState<TeamTabSettings[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [orders, setOrders] = useState<OrderOffer[]>([]);
  const [paymentBanks, setPaymentBanks] = useState<PaymentBank[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [freightTerms, setFreightTerms] = useState<FreightTerm[]>([]);
  const [transporters, setTransporters] = useState<TransporterName[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseManagedBy[]>([]);
  const [dispatchLocations, setDispatchLocations] = useState<DispatchLocation[]>([]);
  const [aolBranches, setAolBranches] = useState<AolBranchName[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierName[]>([]);
  const [aolGodowns, setAolGodowns] = useState<AolGodown[]>([]);
  const [suppliersMaster, setSuppliersMaster] = useState<SupplierMasterRecord[]>([]);
  const [poRecords, setPoRecords] = useState<PoRecord[]>([]);
  const [piRecords, setPiRecords] = useState<PiRecord[]>([]);
  const [activeTab, setActiveTab] = useState<string>("po_module");
  const [isAuditLogEnabledState, setIsAuditLogEnabledState] = useState<boolean>(true);

  useEffect(() => {
    async function fetchStatus() {
      const enabled = await isAuditLogEnabled();
      setIsAuditLogEnabledState(enabled);
    }
    fetchStatus();
  }, []);

  const handleToggleAuditLog = async (enabled: boolean) => {
    await setAuditLogEnabled(enabled);
    setIsAuditLogEnabledState(enabled);
  };

  // Action Audit Log - saved and synced to Google Sheets via Apps Script deployed URL
  const saveLog = async (logData: ActionLog) => {
    if (!isAuditLogEnabledState) return;
    setLogs((prev) => [logData, ...prev.filter((l) => l.id !== logData.id)]);
    syncOperationalAction("ADD", "logs", logData, "Audit Logs", "audit_logs_apps_script", activeUser.email,activeUser.name);
  };

  // Initial Seed & Auth Connection
  useEffect(() => {
    const handleAuthSetup = async () => {
      setAuthLoading(true);

      const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser?.email) {
          try {
            // Seed firestore if empty (safely checks first, fully authenticated now)
            await seedDatabaseIfEmpty();

            const profile = await syncUserProfile(
              firebaseUser.email,
              firebaseUser.displayName || "",
              firebaseUser.photoURL || undefined
            );
            setActiveUserId(profile.id);
            setFirestoreError(null);
            setIsAuthenticated(true);
          } catch (err: any) {
            console.error("Error establishing authenticated profile user:", err);
            setFirestoreError(err?.message || String(err));
            setIsAuthenticated(false);
          } finally {
            setAuthLoading(false);
          }
        } else {
          setIsAuthenticated(false);
          setActiveUserId("");
          setAuthLoading(false);
        }
      });

      return unsubscribeAuth;
    };

    let unsubAuthPromise = handleAuthSetup();

    // Fallback safety timer to ensure auth loading never hangs indefinitely
    const fallbackTimer = setTimeout(() => {
      setAuthLoading((loading) => {
        if (loading) {
          console.warn("[Firebase] Auth state listener timeout fallback triggered.");
          return false;
        }
        return false;
      });
    }, 2500);

    return () => {
      clearTimeout(fallbackTimer);
      unsubAuthPromise.then((unsub) => {
        if (unsub) unsub();
      });
    };
  }, []);

  // State to track Google Sheets initial load status
  const [isSheetsInitialLoading, setIsSheetsInitialLoading] = useState(false);
  const [sheetsLoadMessage, setSheetsLoadMessage] = useState<string>("");

  // Function to load all operational data from Google Sheets via Apps Script deployed URL
  const loadAllOperationalDataFromGoogleSheets = React.useCallback(async (): Promise<void> => {
    setIsSheetsInitialLoading(true);
    setSheetsLoadMessage("Connecting to Google Sheets via Apps Script...");

    try {
      const [loadedPoRecords, loadedPiRecords] = await Promise.all([
        fetchOperationalSheetData(
          "purchase_orders",
          "PO",
          "purchase_orders_apps_script"
        ),
        fetchOperationalSheetData(
          "proforma_invoices",
          "PI",
          "proforma_invoices_apps_script"
        ),
      ]);

      if (Array.isArray(loadedPoRecords) && loadedPoRecords.length > 0) {
        setPoRecords(loadedPoRecords);
      }
      if (Array.isArray(loadedPiRecords) && loadedPiRecords.length > 0) {
        setPiRecords(
          loadedPiRecords.map((row) => normalizePiRow(row, "System"))
        );
      }

      setSheetsLoadMessage("Purchase Orders & Proforma Invoices synchronized from Google Sheets");
    } catch (err: any) {
      console.warn("Failed loading data from Google Sheets:", err);
      setSheetsLoadMessage(`Google Sheets load note: ${err?.message || "Using current data"}`);
    } finally {
      setIsSheetsInitialLoading(false);
    }
  }, []);

  // Setup Firestore listener subscriptions for Settings, Users, Workflows, and List Management master tables
  useEffect(() => {
    if (!isAuthenticated) return;

    console.log("[Firebase] Setting up Firestore subscriptions for Users, Settings & Master Lists...");
    const unsubUsers = subscribeCollection<User>("users", setUsers);
    const unsubWorkflows = subscribeCollection<ProjectWorkflow>("workflows", setWorkflows);
    const unsubProducts = subscribeCollection<Product>("products", setProducts, "createdAt");
    const unsubTasks = subscribeCollection<SalesTask>("tasks", setTasks);
    const unsubTabSettings = subscribeCollection<TeamTabSettings>("tabSettings", setTabSettings);
    const unsubClients = subscribeCollection<Client>("clients", setClients, "createdAt");
    const unsubTeams = subscribeCollection<Team>("teams", setTeams, "createdAt");
    const unsubPaymentBanks = subscribeCollection<PaymentBank>("payment_banks", setPaymentBanks, "createdAt");
    const unsubProductCategories = subscribeCollection<ProductCategory>("product_categories", setProductCategories, "createdAt");
    const unsubProductGroups = subscribeCollection<ProductGroup>("product_groups", setProductGroups, "createdAt");
    const unsubManufacturers = subscribeCollection<Manufacturer>("manufacturers", setManufacturers, "createdAt");
    const unsubFreightTerms = subscribeCollection<FreightTerm>("freight_terms", setFreightTerms, "createdAt");
    const unsubTransporters = subscribeCollection<TransporterName>("transporters", setTransporters, "createdAt");
    const unsubWarehouses = subscribeCollection<WarehouseManagedBy>("warehouses", setWarehouses, "createdAt");
    const unsubDispatchLocations = subscribeCollection<DispatchLocation>("dispatch_locations", setDispatchLocations, "createdAt");
    const unsubAolBranches = subscribeCollection<AolBranchName>("aol_branches", setAolBranches, "createdAt");
    const unsubSuppliers = subscribeCollection<SupplierName>("suppliers", setSuppliers, "createdAt");
    const unsubAolGodowns = subscribeCollection<AolGodown>("aol_godowns", setAolGodowns, "createdAt");
    const unsubSuppliersMaster = subscribeCollection<SupplierMasterRecord>("suppliers_master", setSuppliersMaster, "createdAt");

    // Load operational data from Google Sheets right after Firestore users/settings
    loadAllOperationalDataFromGoogleSheets();

    return () => {
      unsubUsers();
      unsubWorkflows();
      unsubProducts();
      unsubTasks();
      unsubTabSettings();
      unsubClients();
      unsubTeams();
      unsubPaymentBanks();
      unsubProductCategories();
      unsubProductGroups();
      unsubManufacturers();
      unsubFreightTerms();
      unsubTransporters();
      unsubWarehouses();
      unsubDispatchLocations();
      unsubAolBranches();
      unsubSuppliers();
      unsubAolGodowns();
      unsubSuppliersMaster();
    };
  }, [isAuthenticated]);

  // Derive current user reference object
  const activeUser = users.find((u) => 
    u.id.toLowerCase() === activeUserId.toLowerCase() ||
    (u.email && u.email.toLowerCase() === activeUserId.toLowerCase())
  ) || {
    id: activeUserId || "unknown",
    name: "Standard Contributor",
    role: Role.User,
    accessLevel: AccessLevel.Editor,
    email: activeUserId || "",
    teamName: "Sales Development",
    targetQuota: 30000,
    avatarUrl: "",
    status: BOOTSTRAP_ADMIN_EMAILS.some(a => a.toLowerCase() === activeUserId.toLowerCase()) ? "active" : "pending"
  };

  // Tab permissions configuration matching
  const isUserAdmin = activeUser.role === Role.Admin;
  const userTeamSetting = tabSettings.find(
    (s) => s.teamName.toLowerCase() === activeUser.teamName.toLowerCase()
  );

  const allTabs = [
    { id: "po_module", label: "PO", icon: Receipt },
    { id: "pi_module", label: "PI", icon: FileSpreadsheet },
    { id: "list_management", label: "List Management", icon: Folders },
    { id: "team", label: "Hierarchy & Team", icon: Users2 },
  ];

  const allCollectionsData = React.useMemo(() => ({
    purchase_orders: poRecords,
    proforma_invoices: piRecords,
    logs: logs,
    users,
    clients,
    products,
    teams
  }), [poRecords, piRecords, logs, users, clients, products, teams]);

  const getTabPermission = React.useCallback((tabId: string, permissionType: "view" | "add" | "edit"): boolean => {
    if (isUserAdmin) return true;
    if (!userTeamSetting) return true;

    if (tabId.includes("/")) {
      const [parent, child] = tabId.split("/");
      const isParentVisible = userTeamSetting.visibleTabs.includes(parent);
      const isParentPermitted = userTeamSetting.permissions?.[parent]?.view !== false;
      if (!isParentVisible || !isParentPermitted) return false;

      const isChildInSubTabs = userTeamSetting.visibleSubTabs?.[parent]
        ? userTeamSetting.visibleSubTabs[parent].includes(child)
        : true;
      const isChildPermitted = userTeamSetting.permissions?.[tabId]?.[permissionType] !== undefined
        ? userTeamSetting.permissions[tabId][permissionType]
        : true;

      return isChildInSubTabs && isChildPermitted;
    } else {
      const isParentVisible = userTeamSetting.visibleTabs.includes(tabId);
      const isParentPermitted = userTeamSetting.permissions?.[tabId]?.[permissionType] !== undefined
        ? userTeamSetting.permissions[tabId][permissionType]
        : true;

      if (permissionType === "view") {
        if (!isParentVisible || !isParentPermitted) return false;
        const tabConfig = TABS_CONFIG.find((t) => t.id === tabId);
        if (tabConfig?.subTabs && tabConfig.subTabs.length > 0) {
          const hasAnySubTabVisible = tabConfig.subTabs.some((st) => {
            const subId = `${tabId}/${st.id}`;
            const subInSubTabs = userTeamSetting.visibleSubTabs?.[tabId]
              ? userTeamSetting.visibleSubTabs[tabId].includes(st.id)
              : true;
            const subPermitted = userTeamSetting.permissions?.[subId]?.view !== false;
            return subInSubTabs && subPermitted;
          });
          if (!hasAnySubTabVisible) return false;
        }
      }

      return isParentVisible && isParentPermitted;
    }
  }, [isUserAdmin, userTeamSetting]);

  const visibleTabs = allTabs.filter((tab) => {
    if (isUserAdmin) return true;
    return getTabPermission(tab.id, "view");
  });

  const effectiveVisibleSubTabs = React.useMemo(() => {
    if (isUserAdmin || !userTeamSetting) return undefined;
    const result: { [key: string]: string[] } = {};
    TABS_CONFIG.forEach((tab) => {
      if (tab.subTabs) {
        result[tab.id] = tab.subTabs
          .filter((st) => getTabPermission(`${tab.id}/${st.id}`, "view"))
          .map((st) => st.id);
      }
    });
    return result;
  }, [isUserAdmin, userTeamSetting, getTabPermission]);

  // Safe redirect if on an unauthorized tab
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some((t) => t.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);

  // Sign out handle
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setActiveUserId("");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // State handlers for orders
  const handleAddOrder = async (newOrderData: Omit<OrderOffer, "id" | "createdAt" | "createdByUserId">) => {
    const orderId = `order-${Date.now()}`;
    const newOrder: OrderOffer = {
      ...newOrderData,
      id: orderId,
      createdAt: new Date().toISOString(),
      createdByUserId: activeUser.id,
    };
    
    await saveOrder(newOrder);
    
    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Create Order",
      targetType: "Order",
      targetId: orderId,
      targetName: newOrder.companyName,
      details: `${activeUser.name} created sales order/offer for client "${newOrder.clientName}" at "${newOrder.companyName}" with total value of $${newOrder.totalValue.toLocaleString()}`
    });
  };

  const handleEditOrder = async (updatedOrder: OrderOffer) => {
    const oldOrder = orders.find((o) => o.id === updatedOrder.id);
    await saveOrder(updatedOrder);

    let details = `${activeUser.name} modified order for "${updatedOrder.companyName}"`;
    let actionType: ActionLog["actionType"] = "Edit Order";

    if (oldOrder) {
      const oldInvoice = oldOrder.billingDetails?.invoiceNumber;
      const newInvoice = updatedOrder.billingDetails?.invoiceNumber;
      const oldFile = oldOrder.billingDetails?.invoiceFileUrl;
      const newFile = updatedOrder.billingDetails?.invoiceFileUrl;

      if (!oldInvoice && newInvoice) {
        actionType = "Map Invoice";
        details = `${activeUser.name} mapped invoice #${newInvoice} and uploaded file "${updatedOrder.billingDetails?.invoiceFileName || 'invoice'}" for order of "${updatedOrder.companyName}"`;
      } else if (oldInvoice && newInvoice && (oldInvoice !== newInvoice || oldFile !== newFile)) {
        actionType = "Update Invoice";
        details = `${activeUser.name} updated mapped invoice for "${updatedOrder.companyName}" to #${newInvoice}`;
      } else if (oldOrder.status !== updatedOrder.status) {
        actionType = "Update Order Status";
        details = `${activeUser.name} modified order status to "${updatedOrder.status}" for "${updatedOrder.companyName}"`;
      } else if (JSON.stringify(oldOrder.closedWonDetails) !== JSON.stringify(updatedOrder.closedWonDetails)) {
        actionType = "Map Customer PO";
        details = `${activeUser.name} mapped customer PO details for "${updatedOrder.companyName}" (PO: ${updatedOrder.closedWonDetails?.customerPoNumber || 'N/A'})`;
      }
    }

    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType,
      targetType: "Order",
      targetId: updatedOrder.id,
      targetName: updatedOrder.companyName,
      details
    });
  };

  const handleDeleteOrder = async (orderId: string) => {
    const orderToDelete = orders.find((o) => o.id === orderId);
    if (!orderToDelete) return;

    await deleteOrderDoc(orderId);

    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Delete Order",
      targetType: "Order",
      targetId: orderId,
      targetName: orderToDelete.companyName,
      details: `${activeUser.name} deleted sales order "${orderToDelete.companyName}"`
    });
  };

  const handleAddProductCategory = async (data: Omit<ProductCategory, "id" | "createdAt">) => {
    const categoryId = `cat-${Date.now()}`;
    await saveProductCategory({ ...data, id: categoryId, createdAt: new Date().toISOString() });
    
    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Create Category",
      targetType: "Category",
      targetId: categoryId,
      targetName: data.name,
      details: `${activeUser.name} added new product category: "${data.name}"`
    });
  };
  const handleDeleteProductCategory = async (id: string) => {
    const category = productCategories.find(c => c.id === id);
    await deleteProductCategoryDoc(id);
    
    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Delete Category",
      targetType: "Category",
      targetId: id,
      targetName: category?.name || id,
      details: `${activeUser.name} deleted product category: "${category?.name || id}"`
    });
  };
  const handleAddProductGroup = async (data: Omit<ProductGroup, "id" | "createdAt">) => {
    const groupId = `grp-${Date.now()}`;
    await saveProductGroup({ ...data, id: groupId, createdAt: new Date().toISOString() });
    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Create Group",
      targetType: "Group",
      targetId: groupId,
      targetName: data.name,
      details: `${activeUser.name} added new product group: "${data.name}"`
    });
  };
  const handleDeleteProductGroup = async (id: string) => {
    const group = productGroups.find(c => c.id === id);
    await deleteProductGroupDoc(id);
    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Delete Group",
      targetType: "Group",
      targetId: id,
      targetName: group?.name || id,
      details: `${activeUser.name} deleted product group: "${group?.name || id}"`
    });
  };
  const handleAddManufacturer = async (data: Omit<Manufacturer, "id" | "createdAt">) => {
    const manId = `man-${Date.now()}`;
    await saveManufacturer({ ...data, id: manId, createdAt: new Date().toISOString() });
    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Create Manufacturer",
      targetType: "Manufacturer",
      targetId: manId,
      targetName: data.name,
      details: `${activeUser.name} added new manufacturer: "${data.name}"`
    });
  };
  const handleDeleteManufacturer = async (id: string) => {
    const man = manufacturers.find(c => c.id === id);
    await deleteManufacturerDoc(id);
    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Delete Manufacturer",
      targetType: "Manufacturer",
      targetId: id,
      targetName: man?.name || id,
      details: `${activeUser.name} deleted manufacturer: "${man?.name || id}"`
    });
  };
  const handleAddFreightTerm = async (data: Omit<FreightTerm, "id" | "createdAt">) => {
    const termId = `frt-${Date.now()}`;
    await saveFreightTerm({ ...data, id: termId, createdAt: new Date().toISOString() });
    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Create Freight Term",
      targetType: "Freight Term",
      targetId: termId,
      targetName: data.name,
      details: `${activeUser.name} added new freight term: "${data.name}"`
    });
  };
  const handleDeleteFreightTerm = async (id: string) => {
    const term = freightTerms.find(c => c.id === id);
    await deleteFreightTermDoc(id);
    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Delete Freight Term",
      targetType: "Freight Term",
      targetId: id,
      targetName: term?.name || id,
      details: `${activeUser.name} deleted freight term: "${term?.name || id}"`
    });
  };
  const handleAddTransporter = async (data: Omit<TransporterName, "id" | "createdAt">) => {
    const transId = `trn-${Date.now()}`;
    await saveTransporter({ ...data, id: transId, createdAt: new Date().toISOString() });
    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Create Transporter",
      targetType: "Transporter",
      targetId: transId,
      targetName: data.name,
      details: `${activeUser.name} added new transporter: "${data.name}"`
    });
  };
  const handleDeleteTransporter = async (id: string) => {
    const trans = transporters.find(c => c.id === id);
    await deleteTransporterDoc(id);
    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Delete Transporter",
      targetType: "Transporter",
      targetId: id,
      targetName: trans?.name || id,
      details: `${activeUser.name} deleted transporter: "${trans?.name || id}"`
    });
  };
  const handleAddWarehouse = async (data: Omit<WarehouseManagedBy, "id" | "createdAt">) => {
    await saveWarehouse({ ...data, id: `whs-${Date.now()}`, createdAt: new Date().toISOString() });
  };
  const handleDeleteWarehouse = async (id: string) => {
    await deleteWarehouseDoc(id);
  };
  const handleAddDispatchLocation = async (data: Omit<DispatchLocation, "id" | "createdAt">) => {
    await saveDispatchLocation({ ...data, id: `dsp-${Date.now()}`, createdAt: new Date().toISOString() });
  };
  const handleDeleteDispatchLocation = async (id: string) => {
    await deleteDispatchLocationDoc(id);
  };
  const handleAddAolBranch = async (data: Omit<AolBranchName, "id" | "createdAt">) => {
    await saveAolBranch({ ...data, id: `br-${Date.now()}`, createdAt: new Date().toISOString() });
  };
  const handleDeleteAolBranch = async (id: string) => {
    await deleteAolBranchDoc(id);
  };
  const handleAddSupplier = async (data: Omit<SupplierName, "id" | "createdAt">) => {
    await saveSupplier({ ...data, id: `sup-${Date.now()}`, createdAt: new Date().toISOString() });
  };
  const handleDeleteSupplier = async (id: string) => {
    await deleteSupplierDoc(id);
  };

  const handleEditProductCategory = async (id: string, data: Omit<ProductCategory, "id" | "createdAt">) => {
    const existing = productCategories.find(c => c.id === id);
    await saveProductCategory({ id, name: data.name, createdAt: existing?.createdAt || new Date().toISOString() });
  };
  const handleEditProductGroup = async (id: string, data: Omit<ProductGroup, "id" | "createdAt">) => {
    const existing = productGroups.find(c => c.id === id);
    await saveProductGroup({ id, name: data.name, createdAt: existing?.createdAt || new Date().toISOString() });
  };
  const handleEditManufacturer = async (id: string, data: Omit<Manufacturer, "id" | "createdAt">) => {
    const existing = manufacturers.find(c => c.id === id);
    await saveManufacturer({ id, name: data.name, createdAt: existing?.createdAt || new Date().toISOString() });
  };
  const handleEditFreightTerm = async (id: string, data: Omit<FreightTerm, "id" | "createdAt">) => {
    const existing = freightTerms.find(c => c.id === id);
    await saveFreightTerm({ id, name: data.name, createdAt: existing?.createdAt || new Date().toISOString() });
  };
  const handleEditTransporter = async (id: string, data: Omit<TransporterName, "id" | "createdAt">) => {
    const existing = transporters.find(c => c.id === id);
    await saveTransporter({ id, name: data.name, createdAt: existing?.createdAt || new Date().toISOString() });
  };
  const handleEditWarehouse = async (id: string, data: Omit<WarehouseManagedBy, "id" | "createdAt">) => {
    const existing = warehouses.find(c => c.id === id);
    await saveWarehouse({ id, name: data.name, createdAt: existing?.createdAt || new Date().toISOString() });
  };
  const handleEditDispatchLocation = async (id: string, data: Omit<DispatchLocation, "id" | "createdAt">) => {
    const existing = dispatchLocations.find(c => c.id === id);
    await saveDispatchLocation({ id, name: data.name, createdAt: existing?.createdAt || new Date().toISOString() });
  };
  const handleEditAolBranch = async (id: string, data: Omit<AolBranchName, "id" | "createdAt">) => {
    const existing = aolBranches.find(c => c.id === id);
    await saveAolBranch({ id, name: data.name, createdAt: existing?.createdAt || new Date().toISOString() });
  };
  const handleEditSupplier = async (id: string, data: Omit<SupplierName, "id" | "createdAt">) => {
    const existing = suppliers.find(c => c.id === id);
    await saveSupplier({ id, name: data.name, createdAt: existing?.createdAt || new Date().toISOString() });
  };
  const handleAddAolGodown = async (data: Omit<AolGodown, "id" | "createdAt">) => {
    const id = `godown-${Date.now()}`;
    await saveAolGodown({ ...data, id, createdAt: new Date().toISOString() });
  };
  const handleEditAolGodown = async (id: string, data: Omit<AolGodown, "id" | "createdAt">) => {
    await saveAolGodown({ ...data, id, createdAt: new Date().toISOString() });
  };
  const handleDeleteAolGodown = async (id: string) => {
    await deleteAolGodownDoc(id);
  };

  const buildPoSheetRow = (rec: Partial<PoRecord>) => {
    const row: any = {
      id: rec.id || "",
      Created_at: rec.createdAt || "",
      "PO Date": rec.poDate || "",
      "PO Number": rec.poNumber || "",
      "Supplier Name": rec.supplierName || "",
      "Supplier GSTIN": rec.supplierGstin || "",
      "Supplier Address": rec.supplierAddress || "",
      "Create/Edit Date": rec.createEditDate || "",
      "CP Name": rec.cpName || "",
      "CP Number": rec.cpNumber || "",
      "CP Email ID": rec.cpEmailId || "",
      "Delivery Location": rec.deliveryLocation || "",
      "Billing Location": rec.billingLocation || "",
      "Ship To Address": rec.shipToAddress || "",
      "Bill To Address": rec.billToAddress || "",
      "Ship To GST": rec.shipToGst || "",
      "Bill To GST": rec.billToGst || "",
      "Prepared By": rec.preparedBy || "",
      "Checked By": rec.checkedBy || "",
      "SP Name": rec.spName || "",
      "SP Phone Number": rec.spPhoneNumber || "",
      "SP Email Id": rec.spEmailId || "",
      "Payment Terms": rec.paymentTerms || "",
      "Delivery Terms": rec.deliveryTerms || "",
      "Other Terms": rec.otherTerms || "",
      Currency: rec.currency || "INR",
      "Sub Total": rec.subTotal || 0,
      GST:
        (rec.currency || "INR").toUpperCase() === "INR" ? rec.gst || 0 : "",
      "Total (In Num)":
        (rec.currency || "INR").toUpperCase() === "INR"
          ? rec.totalInNum || 0
          : rec.subTotal || 0,
      "Total (In Word)": rec.totalInWord || "",
      "Created By": rec.createdBy || "",
      "Edit By": rec.editBy || "",
      "Edit Timestamp": rec.editTimestamp || "",
      "PDF File URLs": rec.poPdfUrl || "",
    };

    for (let i = 1; i <= 7; i++) {
      row[`Product Description ${i}`] =
        (rec as any)[`productDescription${i}`] || "";
      row[`Packing/Kgs ${i}`] = (rec as any)[`packingKgs${i}`] || "";
      row[`Packs ${i}`] = (rec as any)[`packs${i}`] ?? "";
      row[`Total Qty ${i}`] = (rec as any)[`totalQty${i}`] ?? "";
      row[`Rate ${i}`] = (rec as any)[`rate${i}`] ?? "";
      row[`Amount ${i}`] = (rec as any)[`amount${i}`] ?? "";
    }
    return row;
  };

  const handleAddPo = async (
    record: Omit<PoRecord, "id" | "createdAt">,
  ): Promise<boolean> => {
    const newItem: PoRecord = {
      ...record,
    };

    const sheetRecord = buildPoSheetRow(newItem);

    // 1. AWAIT the remote write action to Google Sheets FIRST
    const res = await syncOperationalAction(
      "ADD",
      "purchase_orders",
      sheetRecord,
      "PO",
      "purchase_orders_apps_script",
      activeUser.email,
      activeUser.name
    );

    // 2. Check if Google Sheets save failed or was skipped
    if (res.status !== "success") {
      alert(
        `Failed to save Purchase Order to Google Sheet: ${res.message || "Unknown error"}`,
      );
      return false; // Signal failure to PoView
    }


    // 4. Extract backend-assigned ID and timestamp from response
    const serverId = res.id || res.data?.id;
    const serverCreatedAt = res.data?.["created_at"] || new Date().toISOString();
    const serverPoDate = res.data?.["PO Date"];
    const serverPoNum = res.data?.["PO Number"];
    const serverPoPdfUrl = res.data?.["PDF File URLs"] || res.data?.poPdfUrl || record.poPdfUrl || "";

    const newItemafteradd: PoRecord = {
      ...record,
      id: serverId, // Set official server ID
      createdAt: serverCreatedAt,
      poDate: serverPoDate, // "PO Date"
      poNumber : serverPoNum,
      poPdfUrl: serverPoPdfUrl,
      createdByUserId: activeUser.id,
      createdBy: record.createdBy || activeUser.name,
      editBy: "",
      editTimestamp: "",
    };

    // 5. Update React UI State with backend-stamped record
    setPoRecords((prev) => [newItemafteradd, ...prev]);

    // 3. Update React UI State ONLY AFTER successful response from Sheets
    // setPoRecords((prev) => [newItem, ...prev.filter((p) => p.id !== id)]);

    // 4. Save Audit Log
    // await saveLog({
    //   id: `log-${Date.now()}`,
    //   timestamp: new Date().toISOString(),
    //   userId: activeUser.id,
    //   userName: activeUser.name,
    //   actionType: "Create PO",
    //   targetType: "PO",
    //   targetId: id,
    //   targetName: newItem.poNumber || newItem.productDescription1,
    //   details: `${activeUser.name} created Purchase Order "${newItem.poNumber}" for supplier "${newItem.supplierName}"`,
    // });

    return true; // Signal success to PoView
  };

  const handleUpdatePo = async (record: PoRecord): Promise<boolean> => {
    // When a record is edited, reset its PDF URL so that a fresh PDF can be generated with updated data
    const recordToSave: PoRecord = {
      ...record,
      poPdfUrl: "",
    };
    const sheetRecord = buildPoSheetRow(recordToSave);
    setPoRecords((prev) => prev.map((p) => (p.id === record.id ? recordToSave : p)));

    // 1. AWAIT the remote write action to Google Sheets FIRST
    const res = await syncOperationalAction(
      "EDIT",
      "purchase_orders",
      sheetRecord,
      "PO",
      "purchase_orders_apps_script",
      activeUser.email,
      activeUser.name
    );

    // 2. Check if Google Sheets save failed or was skipped
    if (res.status !== "success") {
      alert(
        `Failed to update Purchase Order to Google Sheet: ${res.message || "Unknown error"}`,
      );
      return false; // Signal failure to PoView
    }

    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Edit PO",
      targetType: "PO",
      targetId: record.id,
      targetName: record.poNumber,
      details: `${activeUser.name} updated Purchase Order "${record.poNumber}"`,
    });
    return true; // Signal success to PoView
  };

  // Generate Po file function
  const handleGeneratePdf = async (rec: PoRecord, sheetName?: string): Promise<string | null> => {
    const recId = rec.id || rec.poNumber;
    if (!recId) {
      alert("Cannot generate PDF: Purchase Order record ID or PO number is missing.");
      return null;
    }

    // Determine target sheet: use caller's sheetName, or fallback to "PO"
    const targetSheet = sheetName || "PO";

    // Build the full sheet row object with explicit id, recordId, and poNumber
    const sheetRecord = {
      ...buildPoSheetRow(rec),
      id: rec.id || rec.poNumber,
      recordId: rec.id || rec.poNumber,
      poNumber: rec.poNumber || "",
      "PO Number": rec.poNumber || "",
      sheetName: targetSheet,
    };

    const res = await syncOperationalAction(
      "GENERATE",
      "purchase_orders",
      sheetRecord,
      targetSheet,
      "purchase_orders_apps_script",
      activeUser.email,
      activeUser.name
    );

    if (res.status === "warning") {
      alert(`Google Sheet Note: ${res.message || "Failed to generate PDF"}`);
      return null;
    }

    // Extract PDF URL from various potential response formats
    const generatedPdfUrl =
      res.data?.["PDF File URLs"] ||
      res.data?.poPdfUrl ||
      res.data?.pdfUrl ||
      res.data?.pdf_url ||
      res.data?.fileUrl ||
      res.data?.file_url ||
      res.data?.url ||
      (typeof res.id === "string" && res.id.startsWith("http") ? res.id : "") ||
      "";

    if (generatedPdfUrl) {
      setPoRecords((prev) =>
        prev.map((p) =>
          p.id === rec.id || p.poNumber === rec.poNumber
            ? { ...p, poPdfUrl: generatedPdfUrl }
            : p
        )
      );
    }

    // Refresh all records from sheet to ensure latest backend updates are loaded
    await loadAllOperationalDataFromGoogleSheets();

    return generatedPdfUrl || null;
  };

  const handleDeletePo = async (id: string) => {
    const poToDelete = poRecords.find((p) => p.id === id);
    setPoRecords((prev) => prev.filter((p) => p.id !== id));

    if (poToDelete) {
      syncOperationalAction("DELETE", "purchase_orders", poToDelete, "PO", "purchase_orders_apps_script",activeUser.email,
      activeUser.name);
      await saveLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: activeUser.id,
        userName: activeUser.name,
        actionType: "Delete PO",
        targetType: "PO",
        targetId: id,
        targetName: poToDelete.poNumber || id,
        details: `${activeUser.name} deleted Purchase Order "${poToDelete.poNumber || id}"`
      });
    }
  };

  // ==================== PROFORMA INVOICE (PI) HANDLERS ====================
  const buildPiSheetRow = (rec: Partial<PiRecord>) => {
    const row: any = {
      id: rec.id || "",
      Created_at: rec.createdAt || "",
      "PI Date": rec.piDate || "",
      "PI Number": rec.piNumber || "",
      "Create/Edit Date": rec.createEditDate || "",
      "Order Placed by (Customer Dealing Person Name)": rec.orderPlacedBy || "",
      "Mobile Number (Customer Dealing Person)": rec.customerMobileNumber || "",
      "E-Mail ID (Customer Dealing Person)": rec.customerEmailId || "",
      "Company Name (Bill To - Customer Billing Name": rec.billToCompanyName || "",
      "Company Address (Bill To) - Customer Billing Address": rec.billToAddress || "",
      "Company Name (Ship To) - Company Delivery Name / Location": rec.shipToCompanyName || "",
      "Company Shipping Address (Ship To) - Company Delivery Address": rec.shipToAddress || "",
      "Buyer's Order Number": rec.buyersOrderNumber || "",
      "PAYMENT TERM'S": rec.paymentTerms || "",
      "OTHER TERM'S / TERMS OF DELIVERY": rec.otherTerms || "",
      "IN WHICH AOL BANK ACCOUNT YOU WANT TO RECIVED PAYMENT": rec.aolBankAccount || "",
      "Account No": rec.accountNo || "",
      "IFSC Code": rec.ifscCode || "",
      "AOL BRANCH/ GODOWN": rec.aolBranchGodown || "",
      "Address": rec.aolBranchAddress || "",
      "GSTIN": rec.aolBranchGstin || "",
      "AOL Sales Person Name": rec.aolSalesPersonName || "",
      "Email Address": rec.aolSalesPersonEmail || "",

      // Product 1 (exact header names)
      "Product Name 1": rec.productName1 || "",
      "Product 1 Quantity": rec.productQty1 ?? "",
      "Product 1 Rate": rec.productRate1 ?? "",
      "Amount 1": rec.amount1 ?? "",

      // Products 2..4 (exact header names)
      "Product Name 2": rec.productName2 || "",
      "Product Quantity 2": rec.productQty2 ?? "",
      "Product Rate 2": rec.productRate2 ?? "",
      "Amount 2": rec.amount2 ?? "",

      "Product Name 3": rec.productName3 || "",
      "Product Quantity 3": rec.productQty3 ?? "",
      "Product Rate 3": rec.productRate3 ?? "",
      "Amount 3": rec.amount3 ?? "",

      "Product Name 4": rec.productName4 || "",
      "Product Quantity 4": rec.productQty4 ?? "",
      "Product Rate 4": rec.productRate4 ?? "",
      "Amount 4": rec.amount4 ?? "",

      "Freight Charges": rec.freightCharges ?? 0,
      "Terms of Delivery or Delivery Note": rec.deliveryNoteTerms || "",
      "Any Note or Remark for the party": rec.partyRemark || "",
      "Sub Total": rec.subTotal || 0,
      GST: rec.gst || 0,
      "Total (In Num)": rec.totalInNum || 0,
      "Amount in Word": rec.amountInWord || "",
      "Created By": rec.createdBy || "",
      "Edit By": rec.editBy || "",
      "Edit Timestamp": rec.editTimestamp || "",
      "PDF File URLs": rec.piPdfUrl || "",
    };
    return row;
  };

  const handleAddPi = async (
    record: Omit<PiRecord, "id" | "createdAt">,
  ): Promise<boolean> => {
    const newItem: PiRecord = {
      ...record,
    };
    const sheetRecord = buildPiSheetRow(newItem);

    const res = await syncOperationalAction(
      "ADD",
      "proforma_invoices",
      sheetRecord,
      "PI",
      "proforma_invoices_apps_script",
      activeUser.email,
      activeUser.name
    );

    if (res.status !== "success") {
      alert(
        `Failed to save Proforma Invoice to Google Sheet: ${res.message || "Unknown error"}`,
      );
      return false;
    }

    const serverId = res.id || res.data?.id || `pi-${Date.now()}`;
    const serverCreatedAt =
      res.data?.["created_at"] || res.data?.["Created_at"] || new Date().toISOString();
    const serverPiDate = res.data?.["PI Date"] || record.piDate || "";
    const serverPiNum = res.data?.["PI Number"] || record.piNumber || serverId;
    const serverPiPdfUrl =
      res.data?.["PDF File URLs"] || res.data?.piPdfUrl || record.piPdfUrl || "";

    const newItemAfterAdd: PiRecord = {
      ...record,
      id: serverId,
      createdAt: serverCreatedAt,
      piDate: serverPiDate,
      piNumber: serverPiNum,
      piPdfUrl: serverPiPdfUrl,
      createdByUserId: activeUser.id,
      createdBy: record.createdBy || activeUser.name,
      editBy: "",
      editTimestamp: "",
    };

    setPiRecords((prev) => [newItemAfterAdd, ...prev]);

    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Create PI",
      targetType: "PI",
      targetId: serverId,
      targetName: newItemAfterAdd.piNumber || newItemAfterAdd.billToCompanyName,
      details: `${activeUser.name} created Proforma Invoice "${newItemAfterAdd.piNumber || serverId}" for customer "${newItemAfterAdd.billToCompanyName}"`,
    });

    return true;
  };

  const handleUpdatePi = async (record: PiRecord): Promise<boolean> => {
    const recordToSave: PiRecord = {
      ...record,
      piPdfUrl: "",
    };
    const sheetRecord = buildPiSheetRow(recordToSave);
    setPiRecords((prev) =>
      prev.map((p) => (p.id === record.id ? recordToSave : p)),
    );

    const res = await syncOperationalAction(
      "EDIT",
      "proforma_invoices",
      sheetRecord,
      "PI",
      "proforma_invoices_apps_script",
      activeUser.email,
      activeUser.name
    );

    if (res.status !== "success") {
      alert(
        `Failed to update Proforma Invoice to Google Sheet: ${res.message || "Unknown error"}`,
      );
      return false;
    }

    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Edit PI",
      targetType: "PI",
      targetId: record.id || record.piNumber || "",
      targetName: record.piNumber || record.id || "",
      details: `${activeUser.name} updated Proforma Invoice "${record.piNumber || record.id}"`,
    });
    return true;
  };

  const handleGeneratePiPdf = async (
    rec: PiRecord,
    sheetName?: string,
  ): Promise<string | null> => {
    const recId = rec.id || rec.piNumber;
    if (!recId) {
      alert(
        "Cannot generate PDF: Proforma Invoice record ID or PI number is missing.",
      );
      return null;
    }

    const targetSheet = sheetName || "PI";
    const sheetRecord = {
      ...buildPiSheetRow(rec),
      id: rec.id || rec.piNumber,
      recordId: rec.id || rec.piNumber,
      piNumber: rec.piNumber || "",
      "PI Number": rec.piNumber || "",
      sheetName: targetSheet,
    };

    const res = await syncOperationalAction(
      "GENERATE",
      "proforma_invoices",
      sheetRecord,
      targetSheet,
      "proforma_invoices_apps_script",
      activeUser.email,
      activeUser.name
    );

    if (res.status === "warning") {
      alert(`Google Sheet Note: ${res.message || "Failed to generate PDF"}`);
      return null;
    }

    const generatedPdfUrl =
      res.data?.["PDF File URLs"] ||
      res.data?.piPdfUrl ||
      res.data?.pdfUrl ||
      res.data?.pdf_url ||
      res.data?.fileUrl ||
      res.data?.file_url ||
      res.data?.url ||
      (typeof res.id === "string" && res.id.startsWith("http") ? res.id : "") ||
      "";

    if (generatedPdfUrl) {
      setPiRecords((prev) =>
        prev.map((p) =>
          p.id === rec.id || p.piNumber === rec.piNumber
            ? { ...p, piPdfUrl: generatedPdfUrl }
            : p,
        ),
      );
    }

    await loadAllOperationalDataFromGoogleSheets();

    return generatedPdfUrl || null;
  };

  const handleDeletePi = async (id: string) => {
    const piToDelete = piRecords.find((p) => p.id === id);
    setPiRecords((prev) => prev.filter((p) => p.id !== id));

    if (piToDelete) {
      syncOperationalAction(
        "DELETE",
        "proforma_invoices",
        piToDelete,
        "PI",
        "proforma_invoices_apps_script",
        activeUser.email,
        activeUser.name
      );
      await saveLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: activeUser.id,
        userName: activeUser.name,
        actionType: "Delete PI",
        targetType: "PI",
        targetId: id,
        targetName: piToDelete.piNumber || id,
        details: `${activeUser.name} deleted Proforma Invoice "${piToDelete.piNumber || id}"`,
      });
    }
  };



  const handleAddSupplierMaster = async (data: Omit<SupplierMasterRecord, "id" | "createdAt">) => {
    const id = `sup-m-${Date.now()}`;
    const newItem: SupplierMasterRecord = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    await saveSupplierMaster(newItem);
    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Create Supplier Master" as any,
      targetType: "SUPPLIER_MASTER" as any,
      targetId: id,
      targetName: newItem.supplierName,
      details: `${activeUser.name} created Supplier Master "${newItem.supplierName}"`,
    });
  };

  const handleEditSupplierMaster = async (id: string, data: Omit<SupplierMasterRecord, "id" | "createdAt">) => {
    const existing = suppliersMaster.find((s) => s.id === id);
    const updated: SupplierMasterRecord = {
      ...existing,
      ...data,
      id,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    await saveSupplierMaster(updated);
    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Edit Supplier Master" as any,
      targetType: "SUPPLIER_MASTER" as any,
      targetId: id,
      targetName: updated.supplierName,
      details: `${activeUser.name} updated Supplier Master "${updated.supplierName}"`,
    });
  };

  const handleDeleteSupplierMaster = async (id: string) => {
    const target = suppliersMaster.find((s) => s.id === id);
    await deleteSupplierMasterDoc(id);
    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Delete Supplier Master" as any,
      targetType: "SUPPLIER_MASTER" as any,
      targetId: id,
      targetName: target?.supplierName || id,
      details: `${activeUser.name} deleted Supplier Master "${target?.supplierName || id}"`,
    });
  };









  const handleAddPaymentBank = async (newBankData: Omit<PaymentBank, "id" | "createdAt">) => {
    const bankId = `bank-${Date.now()}`;
    const newBank: PaymentBank = {
      ...newBankData,
      id: bankId,
      createdAt: new Date().toISOString(),
    };
    
    await savePaymentBank(newBank);
    
    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Create Order",
      targetType: "Order",
      targetId: bankId,
      targetName: newBank.bankName,
      details: `${activeUser.name} added new bank: "${newBank.bankName}"`
    });
  };
  const handleSaveTeam = async (team: Team) => {
    await saveTeam(team);
  };

  const handleDeleteTeam = async (teamId: string) => {
    await deleteTeamDoc(teamId);
  };

  const handleDeletePaymentBank = async (id: string) => {
    await deletePaymentBankDoc(id);
  };
  const handleEditPaymentBank = async (id: string, updatedBankData: Omit<PaymentBank, "id" | "createdAt">) => {
    const updatedBank: PaymentBank = {
      ...updatedBankData,
      id,
      createdAt: paymentBanks.find(b => b.id === id)?.createdAt || new Date().toISOString()
    };
    await savePaymentBank(updatedBank);
  };

  // State handlers for clients
  const handleAddClient = async (newClientData: Omit<Client, "id" | "createdAt">) => {
    const clientId = `client-${Date.now()}`;
    const newClient: Client = {
      ...newClientData,
      id: clientId,
      createdAt: new Date().toISOString(),
      createdByUserId: activeUser.id
    };
    await saveClient(newClient);
    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Create Lead",
      targetType: "User",
      targetId: clientId,
      targetName: newClient.companyName,
      details: `${activeUser.name} registered new client profile for "${newClient.fullName}" at "${newClient.companyName}"`
    });
  };

  const handleDeleteClient = async (clientId: string) => {
    const clientToDelete = clients.find((c) => c.id === clientId);
    if (!clientToDelete) return;
    await deleteClientDoc(clientId);
    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Delete Lead",
      targetType: "User",
      targetId: clientId,
      targetName: clientToDelete.companyName,
      details: `${activeUser.name} deleted client profile of "${clientToDelete.fullName}" at "${clientToDelete.companyName}"`
    });
  };

  const handleEditClient = async (clientId: string, updatedData: Partial<Omit<Client, "id" | "createdAt" | "createdByUserId">>) => {
    const targetClient = clients.find((c) => c.id === clientId);
    if (!targetClient) return;

    const updatedClient: Client = {
      ...targetClient,
      ...updatedData
    };

    await saveClient(updatedClient);

    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Edit Lead",
      targetType: "User",
      targetId: clientId,
      targetName: updatedClient.companyName,
      details: `${activeUser.name} edited client profile for "${updatedClient.fullName}" at "${updatedClient.companyName}"`
    });
  };

  // State handlers for products
  const handleAddProduct = async (newProductData: Omit<Product, "id" | "createdAt">) => {
    const productId = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...newProductData,
      id: productId,
      createdAt: new Date().toISOString(),
      createdByUserId: activeUser.id
    };
    await saveProduct(newProduct);
    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Create Product",
      targetType: "Product",
      targetId: productId,
      targetName: newProduct.name,
      details: `${activeUser.name} registered new product entry "${newProduct.name}" in catalog`
    });
  };

  const handleBulkAddProducts = async (newProductsData: (Omit<Product, "id" | "createdAt"> & { id?: string })[]) => {
    const timestamp = new Date().toISOString();
    for (let i = 0; i < newProductsData.length; i++) {
      const item = newProductsData[i];
      const prodId = item.id || `prod-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
      const newProduct: Product = {
        ...item,
        id: prodId,
        createdAt: timestamp,
        createdByUserId: activeUser.id,
      };
      await saveProduct(newProduct);
    }
    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Bulk Import Products",
      targetType: "Product",
      targetId: `bulk-products-${Date.now()}`,
      targetName: `${newProductsData.length} Products`,
      details: `${activeUser.name} bulk imported ${newProductsData.length} products into the catalog`
    });
  };

  const handleEditProduct = async (productId: string, updatedData: Partial<Omit<Product, "id" | "createdAt" | "createdByUserId">>) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;
    const updatedProduct: Product = {
      ...targetProduct,
      ...updatedData
    };
    await saveProduct(updatedProduct);
    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Edit Product",
      targetType: "Product",
      targetId: productId,
      targetName: updatedProduct.name,
      details: `${activeUser.name} modified properties of product "${updatedProduct.name}"`
    });
  };

  const handleDeleteProduct = async (productId: string) => {
    const productToDelete = products.find((p) => p.id === productId);
    if (!productToDelete) return;
    await deleteProductDoc(productId);
    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Delete Product",
      targetType: "Product",
      targetId: productId,
      targetName: productToDelete.name,
      details: `${activeUser.name} deleted product entry of "${productToDelete.name}"`
    });
  };

  // State handlers for tasks
  const handleAddTask = async (newTaskData: Omit<SalesTask, "id">) => {
    const taskId = `task-${Date.now()}`;
    const newTask: SalesTask = {
      ...newTaskData,
      id: taskId,
    };
    
    await saveTask(newTask);

    const assigneeName = users.find((u) => u.id === newTask.assignedToUserId)?.name || "Unassigned";
    
    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Create Task",
      targetType: "Task",
      targetId: taskId,
      targetName: newTask.title,
      details: `${activeUser.name} assigned task "${newTask.title}" to "${assigneeName}" (Priority: ${newTask.priority})`
    });
  };

  const handleToggleTaskComplete = async (taskId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const updatedStatus: SalesTask["status"] = targetTask.status === "Completed" ? "In Progress" : "Completed";
    const updatedTask = { ...targetTask, status: updatedStatus };

    await saveTask(updatedTask);

    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Edit Task",
      targetType: "Task",
      targetId: taskId,
      targetName: targetTask.title,
      details: `${activeUser.name} toggled completion status of task "${targetTask.title}" to "${updatedStatus}"`
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    const taskToDelete = tasks.find((t) => t.id === taskId);
    if (!taskToDelete) return;

    await deleteTaskDoc(taskId);

    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Delete Task",
      targetType: "Task",
      targetId: taskId,
      targetName: taskToDelete.title,
      details: `${activeUser.name} deleted task "${taskToDelete.title}"`
    });
  };

  // Clear log state via Google Sheets
  // Don't want to use it
  // const handleClearLogs = async () => {
  //   setLogs([]);
  //   await clearOperationalSheetRecords("logs", "Audit Logs", "audit_logs_apps_script");
  // };

  // Admin hierarchy editor
  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      await updateUserDetails(userId, updates);
      
      const targetUser = users.find((u) => u.id === userId);
      const targetName = targetUser?.name || userId;

      await saveLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: activeUser.id,
        userName: activeUser.name,
        actionType: "Edit User",
        targetType: "User",
        targetId: userId,
        targetName,
        details: `ADMIN ACTION: ${activeUser.name} updated structural properties of individual ${targetName} (${userId}). Updates: ${Object.keys(updates).map(k => `${k} to "${(updates as any)[k]}"`).join(", ")}`
      });
    } catch (err) {
      console.error("Hierarchy change failed:", err);
    }
  };

  const handleAddUser = async (user: User) => {
    await saveUserDoc(user);
    await saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      actionType: "Edit User",
      targetType: "User",
      targetId: user.id,
      targetName: user.name,
      details: `ADMIN ACTION: ${activeUser.name} registered new user: "${user.name}" (${user.email})`
    });
  };

  const handleDeleteUser = async (userId: string) => {
    const targetUser = users.find(u => u.id === userId || (u.email && u.email.toLowerCase() === userId.toLowerCase()));
    const targetName = targetUser?.name || userId;
    const targetEmail = targetUser?.email || userId;
    
    // Optimistic UI state removal
    setUsers(prev => prev.filter(u => u.id !== userId && (!targetEmail || u.email?.toLowerCase() !== targetEmail.toLowerCase())));

    try {
      await deleteUserDoc(userId);
      if (targetEmail && targetEmail.toLowerCase() !== userId.toLowerCase()) {
        await deleteUserDoc(targetEmail);
      }
      await saveLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: activeUser.id,
        userName: activeUser.name,
        actionType: "Delete User",
        targetType: "User",
        targetId: userId,
        targetName: targetName,
        details: `ADMIN ACTION: ${activeUser.name} deleted user: "${targetName}" (${targetEmail})`
      });
    } catch (err) {
      console.error("Error deleting user:", err);
      throw err;
    }
  };

  // Admin tab visibility updater
  const handleUpdateTabSettings = async (
    teamName: string, 
    visibleTabs: string[], 
    visibleSubTabs: { [key: string]: string[] }, 
    visibleSubSubTabs: { [key: string]: { [key: string]: string[] } },
    permissions?: { [key: string]: { view: boolean; add: boolean; edit: boolean } }
  ) => {
    try {
      await saveTeamTabSettings(teamName, visibleTabs, visibleSubTabs, visibleSubSubTabs, permissions);

      await saveLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: activeUser.id,
        userName: activeUser.name,
        actionType: "Edit User",
        targetType: "User",
        targetId: teamName,
        targetName: teamName,
        details: `ADMIN ACTION: ${activeUser.name} updated Tab Visibilities & Permissions for Team "${teamName}".`
      });
    } catch (err) {
      console.error("Updating tab visibilities failed:", err);
    }
  };

  // Splendid full screen loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <div className="text-center space-y-1">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-emerald-400 block">
            Loading Access clearance...
          </span>
          <p className="text-[11px] text-slate-400 font-mono">
            Verifying profile credentials and department clearance...
          </p>
        </div>

        <button
          onClick={handleSignOut}
          className="mt-4 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-mono font-bold px-4 py-2 rounded-lg transition shadow-md flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut size={13} />
          <span>Logout & Return to Login Page</span>
        </button>
      </div>
    );
  }

  // Intercept authentication flow
  if (!isAuthenticated || !activeUserId) {
    return (
      <AuthScreen 
        onAuthSuccess={() => setIsAuthenticated(true)} 
        externalError={firestoreError}
        onClearExternalError={() => setFirestoreError(null)}
      />
    );
  }

  // Intercept unapproved / pending registration accounts
  // This security screen is ONLY shown to newly registered users whose details are not yet present/configured in the Firestore user table (or whose status is explicitly set to 'pending' or 'disabled').
  const isBootstrapAdmin = BOOTSTRAP_ADMIN_EMAILS.some(
    (adm) => adm.toLowerCase() === activeUserId.toLowerCase()
  );
  const foundUserInDirectory = users.find(
    (u) => u.id.toLowerCase() === activeUserId.toLowerCase() ||
           (u.email && u.email.toLowerCase() === activeUserId.toLowerCase())
  );
  
  const isAccountActive = isBootstrapAdmin || 
    activeUser.role === Role.Admin || 
    (foundUserInDirectory ? (foundUserInDirectory.status !== "pending" && foundUserInDirectory.status !== "disabled") : (activeUser.status === "active"));

  if (!isAccountActive) {
    return (
      <PendingApprovalScreen
        user={activeUser}
        onSignOut={handleSignOut}
        onRefreshStatus={async () => {
          if (auth.currentUser?.email) {
            await syncUserProfile(
              auth.currentUser.email,
              auth.currentUser.displayName || "",
              auth.currentUser.photoURL || undefined
            );
          }
        }}
      />
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800 antialiased font-sans flex flex-col">
      {/* Dynamic Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-[96%] mx-auto px-3 sm:px-4 lg:px-5 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-white dark:bg-white border border-slate-200/80 dark:border-slate-700 px-1.5 py-0.5 rounded-md shadow-xs flex items-center justify-center shrink-0">
              <img
                src="/assets/aistudio/AOL_Logo_Mark-01_64b455c0.png"
                alt="AOL Logo"
                className="h-8 w-auto object-contain"
              />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-none">
                Company Management Portal
              </h1>
              <p className="text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                Hierarchical Role & Permission Matrix Console
              </p>
            </div>
          </div>

          {/* Header Controls: Theme Mode Toggle, Font Size Toggle, Authenticated Profile Pill & Signout */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Single Button for Toggle between Dark and Light Mode */}
            <button
              onClick={toggleTheme}
              id="theme-toggle-button"
              className="p-1.5 rounded-md border transition-all duration-200 cursor-pointer shadow-2xs bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-amber-300 dark:border-slate-700 flex items-center justify-center"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? (
                <Sun size={15} className="text-amber-400" />
              ) : (
                <Moon size={15} className="text-slate-600 dark:text-slate-300" />
              )}
            </button>

            {/* Font Size Changer just right to mode icon */}
            <FontSizeToggle idPrefix="header" />

            {/* Connected Authenticated Profile Pill */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 p-1 pl-1.5 pr-2.5 rounded-md shadow-2xs">
              <img
                src={activeUser.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=60"}
                alt={activeUser.name}
                className="w-6 h-6 rounded-md object-cover border border-slate-200 dark:border-slate-600"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-900 dark:text-slate-100 leading-none block">
                  {activeUser.name}
                </span>
                <span className="text-[8px] font-mono text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                  {activeUser.role} • {activeUser.accessLevel}
                </span>
              </div>
            </div>

            {/* Logout trigger */}
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center text-slate-400 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 p-1.5 rounded border border-transparent hover:border-rose-100 dark:hover:border-rose-800/70 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
              title="Sign Out of Portal"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[96%] w-full mx-auto px-3 sm:px-4 lg:px-5 py-3">
        
        {/* Tab Selection Row */}
        <div className="flex border-b border-slate-200/85 dark:border-slate-800 mb-3 overflow-x-auto gap-1 pb-0.5 scrollbar-thin">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold font-mono uppercase tracking-wider border-b-2 transition-all whitespace-nowrap -mb-0.5 cursor-pointer ${
                  active
                    ? "border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Icon size={12} className={active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active Tab Screen Render */}
        <div className="animate-fade-in">
          {activeTab === "po_module" && (
            <PoView
              activeUserId={activeUserId}
              activeUser={activeUser}
              users={users}
              poRecords={poRecords}
              suppliers={suppliers}
              // domesticSuppliers={domesticSuppliers}
              aolBranches={aolBranches}
              aolGodowns={aolGodowns}
              dispatchLocations={dispatchLocations}
              warehouses={warehouses}
              products={products}
              freightTerms={freightTerms}
              onAddPo={handleAddPo}
              onUpdatePo={handleUpdatePo}
              onGeneratePdf={handleGeneratePdf}
              onDeletePo={handleDeletePo}
              onAddSupplier={handleAddSupplier}
              // onAddDomesticSupplier={handleAddDomesticSupplier}
              onAddProduct={handleAddProduct}
              suppliersMaster={suppliersMaster}
              onAddSupplierMaster={handleAddSupplierMaster}
              canAdd={getTabPermission("po_module", "add")}
              canEdit={getTabPermission("po_module", "edit")}
              onRefreshPoRecords={loadAllOperationalDataFromGoogleSheets}
            />
          )}

          {activeTab === "pi_module" && (
            <PiView
              activeUserId={activeUserId}
              activeUser={activeUser}
              users={users}
              piRecords={piRecords}
              clients={clients}
              paymentBanks={paymentBanks}
              aolGodowns={aolGodowns}
              products={products}
              freightTerms={freightTerms}
              onAddPi={handleAddPi}
              onUpdatePi={handleUpdatePi}
              onGeneratePdf={handleGeneratePiPdf}
              onDeletePi={handleDeletePi}
              canAdd={getTabPermission("pi_module", "add")}
              canEdit={getTabPermission("pi_module", "edit")}
              onRefreshPiRecords={loadAllOperationalDataFromGoogleSheets}
            />
          )}

          {activeTab === "list_management" && (
            <ListManagementView
              activeUserId={activeUserId}
              aolGodowns={aolGodowns}
              suppliersMaster={suppliersMaster}
              onAddAolGodown={handleAddAolGodown}
              onEditAolGodown={handleEditAolGodown}
              onDeleteAolGodown={handleDeleteAolGodown}
              onAddSupplierMaster={handleAddSupplierMaster}
              onEditSupplierMaster={handleEditSupplierMaster}
              onDeleteSupplierMaster={handleDeleteSupplierMaster}
              users={users}
              products={products}
              clients={clients}
              teams={teams}
              paymentBanks={paymentBanks}
              categories={productCategories}
              groups={productGroups}
              manufacturers={manufacturers}
              freightTerms={freightTerms}
              transporters={transporters}
              warehouses={warehouses}
              dispatchLocations={dispatchLocations}
              aolBranches={aolBranches}
              suppliers={suppliers}
              workflows={workflows}
              tasks={tasks}
              onAddProduct={handleAddProduct}
              onEditProduct={handleEditProduct}
              onBulkAddProducts={handleBulkAddProducts}
              onDeleteProduct={handleDeleteProduct}
              onAddCategory={handleAddProductCategory}
              onEditCategory={handleEditProductCategory}
              onDeleteCategory={handleDeleteProductCategory}
              onAddGroup={handleAddProductGroup}
              onEditGroup={handleEditProductGroup}
              onDeleteGroup={handleDeleteProductGroup}
              onAddManufacturer={handleAddManufacturer}
              onEditManufacturer={handleEditManufacturer}
              onDeleteManufacturer={handleDeleteManufacturer}
              onAddFreightTerm={handleAddFreightTerm}
              onEditFreightTerm={handleEditFreightTerm}
              onDeleteFreightTerm={handleDeleteFreightTerm}
              onAddTransporter={handleAddTransporter}
              onEditTransporter={handleEditTransporter}
              onDeleteTransporter={handleDeleteTransporter}
              onAddWarehouse={handleAddWarehouse}
              onEditWarehouse={handleEditWarehouse}
              onDeleteWarehouse={handleDeleteWarehouse}
              onAddDispatchLocation={handleAddDispatchLocation}
              onEditDispatchLocation={handleEditDispatchLocation}
              onDeleteDispatchLocation={handleDeleteDispatchLocation}
              onAddAolBranch={handleAddAolBranch}
              onEditAolBranch={handleEditAolBranch}
              onDeleteAolBranch={handleDeleteAolBranch}
              onAddSupplier={handleAddSupplier}
              onEditSupplier={handleEditSupplier}
              onDeleteSupplier={handleDeleteSupplier}
              onAddClient={handleAddClient}
              onEditClient={handleEditClient}
              onDeleteClient={handleDeleteClient}
              onAddTask={handleAddTask}
              onToggleTaskComplete={handleToggleTaskComplete}
              onDeleteTask={handleDeleteTask}
              onAddPaymentBank={handleAddPaymentBank}
              onDeletePaymentBank={handleDeletePaymentBank}
              onEditPaymentBank={handleEditPaymentBank}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              visibleSubTabs={effectiveVisibleSubTabs}
              visibleSubSubTabs={userTeamSetting?.visibleSubSubTabs}
            />
          )}


          {activeTab === "team" && (
            <TeamDirectoryView
              users={users}
              activeUserId={activeUserId}
              onUpdateUser={handleUpdateUser}
              onSaveUser={handleAddUser}
              onDeleteUser={handleDeleteUser}
              tabSettings={tabSettings}
              onUpdateTabSettings={handleUpdateTabSettings}
              teams={teams}
              onSaveTeam={handleSaveTeam}
              onDeleteTeam={handleDeleteTeam}
            />
          )}


        </div>
      </main>

      {/* Footer credits bar */}
      <footer className="bg-white border-t border-slate-200 py-3 mt-4 shrink-0">
        <div className="max-w-[96%] mx-auto px-3 sm:px-4 lg:px-5 flex flex-col md:flex-row items-center justify-between text-[10px] text-slate-400 gap-1.5">
          <span>
            Company Management Portal • Powered securely by Cloud Firebase Authentication & Firestore NoSQL Data Storage
          </span>
          <div className="flex items-center gap-1 text-slate-400 font-mono">
            <span className="h-1 w-1 bg-emerald-500 rounded-full"></span>
            <span>Real-time Permission Authorization Locked</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
