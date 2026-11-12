/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Role, AccessLevel, ProjectWorkflow, SalesTask, ActionLog, TeamTabSettings, Client, Team, Product, OrderOffer, PaymentBank, ProductCategory, ProductGroup, Manufacturer, FreightTerm, TransporterName, WarehouseManagedBy, DispatchLocation, AolBranchName, SupplierName, ClearingCat, AolGodown, SupplierMasterRecord, PoRecord } from "../types";

import {
  auth,
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch
} from "../firebase";
import {
  INITIAL_USERS,
  INITIAL_WORKFLOWS,
  INITIAL_TASKS,
  INITIAL_LOGS,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS
} from "../data";

// --- Firestore Error Handling per Firebase Integration Skill ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('[Firestore Error] Structured Diagnostics:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recursively remove properties with undefined values from objects and arrays,
 * so Firestore doesn't throw unsupported field errors.
 */
export function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const val = (obj as Record<string, any>)[key];
      if (val !== undefined) {
        result[key] = cleanUndefined(val);
      }
    }
    return result as T;
  }
  return obj;
}

// Mapping from old string IDs to email keys to implement "role assigned to email id"
const ID_TO_EMAIL: Record<string, string> = {
  "admin-1": "robert.sterling@apex.com",
  "sr-mgr-1": "sarah.jenkins@apex.com",
  "mgr-1": "michael.chang@apex.com",
  "mgr-2": "elena.rostova@apex.com",
  "tl-1": "tina.lopez@apex.com",
  "tl-2": "tom.harris@apex.com",
  "user-1": "john.doe@apex.com",
  "user-2": "jane.smith@apex.com",
  "user-3": "jack.wilson@apex.com"
};

// Helper: map a user ID or email to email
export function mapIdToEmail(id: string): string {
  if (id.includes("@")) return id.toLowerCase();
  return (ID_TO_EMAIL[id] || id).toLowerCase();
}

export async function seedTeamsIfEmpty(): Promise<void> {
  try {
    const teamsSnap = await getDocs(collection(db, "teams"));
    if (!teamsSnap.empty) {
      return;
    }
    console.log("[FirebaseService] Seeding default teams...");
    const defaultTeams = [
      { name: "Executive", description: "Executive team and Board" },
      { name: "Enterprise Sales", description: "Enterprise clients management" },
      { name: "Mid-Market Team A", description: "Mid-market accounts - Area A" },
      { name: "Mid-Market Team B", description: "Mid-market accounts - Area B" },
      { name: "SME West Coast", description: "Small and medium business - West Coast" },
      { name: "SME East Coast", description: "Small and medium business - East Coast" }
    ];
    for (const team of defaultTeams) {
      const docId = team.name.toLowerCase().replace(/[^a-z0-9]/g, "-") || "default";
      const t: Team = {
        id: docId,
        name: team.name,
        description: team.description,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "teams", docId), cleanUndefined(t));
    }
    console.log("[FirebaseService] Teams seeding completed successfully.");
  } catch (err) {
    console.error("[FirebaseService] Error seeding teams:", err);
  }
}

export async function seedProductsIfEmpty(): Promise<void> {
  try {
    const productsSnap = await getDocs(collection(db, "products"));
    if (!productsSnap.empty) {
      return;
    }
    console.log("[FirebaseService] Seeding default products...");
    for (const p of INITIAL_PRODUCTS) {
      await setDoc(doc(db, "products", p.id), cleanUndefined(p));
    }
    console.log("[FirebaseService] Products seeding completed successfully.");
  } catch (err) {
    console.error("[FirebaseService] Error seeding products:", err);
  }
}

export async function seedDropdownsIfEmpty(): Promise<void> {
  try {
    // 1. Freight Terms
    const ftSnap = await getDocs(collection(db, "freight_terms"));
    if (ftSnap.empty) {
      const defaultFreightTerms = ["FOB (Free on Board)", "CIF (Cost, Insurance, Freight)", "EXW (Ex Works)", "DDP (Delivered Duty Paid)"];
      for (const [idx, term] of defaultFreightTerms.entries()) {
        await setDoc(doc(db, "freight_terms", `ft-${idx + 1}`), {
          id: `ft-${idx + 1}`,
          name: term,
          createdAt: new Date().toISOString()
        });
      }
    }

    // 2. Transporters
    const trSnap = await getDocs(collection(db, "transporters"));
    if (trSnap.empty) {
      const defaultTransporters = ["DHL Express", "FedEx", "UPS", "Apex Logistics"];
      for (const [idx, name] of defaultTransporters.entries()) {
        await setDoc(doc(db, "transporters", `tr-${idx + 1}`), {
          id: `tr-${idx + 1}`,
          name,
          createdAt: new Date().toISOString()
        });
      }
    }

    // 3. Warehouses
    const whSnap = await getDocs(collection(db, "warehouses"));
    if (whSnap.empty) {
      const defaultWarehouses = ["In-House Team", "Partner 3PL (Apex Hub)", "West Coast Fulfillment"];
      for (const [idx, name] of defaultWarehouses.entries()) {
        await setDoc(doc(db, "warehouses", `wh-${idx + 1}`), {
          id: `wh-${idx + 1}`,
          name,
          createdAt: new Date().toISOString()
        });
      }
    }

    // 4. Dispatch Locations
    const dlSnap = await getDocs(collection(db, "dispatch_locations"));
    if (dlSnap.empty) {
      const defaultDispatchLocations = ["Chicago Hub", "Los Angeles Facility", "New York Depot", "Dallas Distribution Center"];
      for (const [idx, name] of defaultDispatchLocations.entries()) {
        await setDoc(doc(db, "dispatch_locations", `dl-${idx + 1}`), {
          id: `dl-${idx + 1}`,
          name,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Also seed initial categories, groups, manufacturers if empty
    const pcSnap = await getDocs(collection(db, "product_categories"));
    if (pcSnap.empty) {
      const defaultCategories = ["Cloud Services", "Software", "AI Solutions", "Hardware"];
      for (const [idx, name] of defaultCategories.entries()) {
        await setDoc(doc(db, "product_categories", `cat-${idx + 1}`), {
          id: `cat-${idx + 1}`,
          name,
          createdAt: new Date().toISOString()
        });
      }
    }

    const pgSnap = await getDocs(collection(db, "product_groups"));
    if (pgSnap.empty) {
      const defaultGroups = ["Infrastructure", "Applications", "Analytics", "Devices"];
      for (const [idx, name] of defaultGroups.entries()) {
        await setDoc(doc(db, "product_groups", `grp-${idx + 1}`), {
          id: `grp-${idx + 1}`,
          name,
          createdAt: new Date().toISOString()
        });
      }
    }

    const mSnap = await getDocs(collection(db, "manufacturers"));
    if (mSnap.empty) {
      const defaultManufacturers = ["Apex Systems", "Apex AI Labs", "External Partner Corp"];
      for (const [idx, name] of defaultManufacturers.entries()) {
        await setDoc(doc(db, "manufacturers", `man-${idx + 1}`), {
          id: `man-${idx + 1}`,
          name,
          createdAt: new Date().toISOString()
        });
      }
    }

    // 5. AOL Branch Name
    const abSnap = await getDocs(collection(db, "aol_branches"));
    if (abSnap.empty) {
      const defaultBranches = ["Mumbai", "Chennai", "Silvassa", "Gujarat"];
      for (const [idx, name] of defaultBranches.entries()) {
        await setDoc(doc(db, "aol_branches", `br-${idx + 1}`), {
          id: `br-${idx + 1}`,
          name,
          createdAt: new Date().toISOString()
        });
      }
    }

    // 6. Supplier Name
    const sSnap = await getDocs(collection(db, "suppliers"));
    if (sSnap.empty) {
      const defaultSuppliers = ["Global Chemicals Ltd", "Aura Enterprises", "Super Poly Plast", "Vardhman Trading", "Unilink Impex"];
      for (const [idx, name] of defaultSuppliers.entries()) {
        await setDoc(doc(db, "suppliers", `sup-${idx + 1}`), {
          id: `sup-${idx + 1}`,
          name,
          createdAt: new Date().toISOString()
        });
      }
    }

    // 7. Clearing Cat
    const ccSnap = await getDocs(collection(db, "clearing_cats"));
    if (ccSnap.empty) {
      const defaultClearingCats = ["Standard Clearing", "Express Clearing", "Bonded Warehouse", "Special Clearance"];
      for (const [idx, name] of defaultClearingCats.entries()) {
        await setDoc(doc(db, "clearing_cats", `cc-${idx + 1}`), {
          id: `cc-${idx + 1}`,
          name,
          createdAt: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    console.error("[FirebaseService] Error seeding dropdowns:", err);
  }
}

/**
 * Seeds Database with initial mock data mapped to emails if users collection is empty.
 */
export async function seedDatabaseIfEmpty(): Promise<void> {
  const path = "users";
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    await seedDropdownsIfEmpty();
    if (!usersSnap.empty) {
      console.log("[FirebaseService] Database already seeded.");
      await seedTeamsIfEmpty();
      await seedProductsIfEmpty();
      return;
    }

    console.log("[FirebaseService] Database empty. Starting email-keyed data seed...");
    await seedTeamsIfEmpty();
    await seedProductsIfEmpty();

    // 1. Seed Users (document key is lowercase email)
    const seededUsers: User[] = INITIAL_USERS.map((user) => {
      const email = user.email.toLowerCase();
      return {
        ...user,
        id: email, // use email as ID
        email,
        status: "active" as const,
        reportsTo: user.reportsTo ? mapIdToEmail(user.reportsTo) : undefined
      };
    });

    for (const u of seededUsers) {
      await setDoc(doc(db, "users", u.email), cleanUndefined(u));
    }

    // 2. Seed Workflows
    for (const w of INITIAL_WORKFLOWS) {
      await setDoc(doc(db, "workflows", w.id), cleanUndefined(w));
    }

    // 4. Seed Tasks
    const seededTasks: SalesTask[] = INITIAL_TASKS.map((task) => ({
      ...task,
      assignedToUserId: mapIdToEmail(task.assignedToUserId),
      createdByUserId: mapIdToEmail(task.createdByUserId)
    }));

    for (const t of seededTasks) {
      await setDoc(doc(db, "tasks", t.id), cleanUndefined(t));
    }

    // 5. Seed Action Logs
    const seededLogs: ActionLog[] = INITIAL_LOGS.map((log) => ({
      ...log,
      userId: mapIdToEmail(log.userId)
    }));

    for (const log of seededLogs) {
      await setDoc(doc(db, "logs", log.id), cleanUndefined(log));
    }

    // 6. Seed Orders
    const seededOrders: OrderOffer[] = INITIAL_ORDERS.map((order) => ({
      ...order,
      assignedToUserId: mapIdToEmail(order.assignedToUserId),
      createdByUserId: mapIdToEmail(order.createdByUserId)
    }));

    for (const ord of seededOrders) {
      await setDoc(doc(db, "orders", ord.id), cleanUndefined(ord));
    }

    console.log("[FirebaseService] Seeding completed successfully!");
  } catch (err) {
    console.error("[FirebaseService] Error during seeding:", err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export const BOOTSTRAP_ADMIN_EMAILS = [
  "naveen@chsurya.in",
  "gcp@aromaorganic.in",
  "care@aromaorganic.in",
  "whirlpoolveen@gmail.com",
  "robert.sterling@apex.com"
];

/**
 * Create or merge user profile inside `/users/{email}`.
 * If user details are already present in Firestore (pre-created by Admin):
 *   - Load existing configuration (role, team, quota, access level).
 *   - If status is not explicitly 'pending' or 'disabled', grant active access.
 * If user details are NOT present in Firestore:
 *   - If bootstrap admin, grant Admin role with active status.
 *   - If newly registered user without pre-existing record, register with status: 'pending' to prevent unauthorized misuse.
 */
export async function syncUserProfile(email: string, displayName: string, avatarUrl?: string): Promise<User> {
  const normalizedEmail = email.toLowerCase().trim();
  let userRef = doc(db, "users", normalizedEmail);
  let snap;
  try {
    snap = await getDoc(userRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${normalizedEmail}`);
  }

  let existingUser: User | null = snap && snap.exists() ? (snap.data() as User) : null;

  // If not found by document ID, perform fallback query by email to catch any custom doc IDs created by admin
  if (!existingUser) {
    try {
      const q = query(collection(db, "users"), where("email", "==", normalizedEmail));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const foundDoc = querySnap.docs[0];
        existingUser = { id: foundDoc.id, ...foundDoc.data() } as User;
        userRef = doc(db, "users", foundDoc.id);
      }
    } catch (e) {
      console.warn("User lookup query fallback error:", e);
    }
  }

  const isBootstrapAdmin = BOOTSTRAP_ADMIN_EMAILS.includes(normalizedEmail);

  // Case 1: User details ARE present in the user table in Firestore
  if (existingUser) {
    let needsUpdate = false;
    let updated: User = { 
      ...existingUser,
      id: existingUser.id || normalizedEmail,
      // If status is omitted or undefined on a pre-existing admin-registered user, default to active
      status: existingUser.status || "active"
    };

    // If bootstrap admin, guarantee active admin clearance
    if (isBootstrapAdmin && (updated.role !== Role.Admin || updated.status !== "active")) {
      updated.role = Role.Admin;
      updated.accessLevel = AccessLevel.Manager;
      updated.teamName = updated.teamName || "Executive";
      updated.status = "active";
      needsUpdate = true;
    }

    // Keep avatar updated if provided
    if (avatarUrl && updated.avatarUrl !== avatarUrl) {
      updated.avatarUrl = avatarUrl;
      needsUpdate = true;
    }

    if (needsUpdate) {
      try {
        await setDoc(userRef, cleanUndefined(updated), { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${userRef.id}`);
      }
    }
    return updated;
  }

  // Case 2: User details are NOT in Firestore and is a bootstrap admin
  if (isBootstrapAdmin) {
    const newAdminUser: User = {
      id: normalizedEmail,
      name: displayName || normalizedEmail.split("@")[0],
      role: Role.Admin,
      accessLevel: AccessLevel.Manager,
      email: normalizedEmail,
      avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120",
      targetQuota: 250000,
      teamName: "Executive",
      status: "active"
    };

    try {
      await setDoc(userRef, cleanUndefined(newAdminUser));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${normalizedEmail}`);
    }
    return newAdminUser;
  }

  // Case 3: Newly registered user NOT present in Firestore user table:
  // Register them as "pending" with restricted permissions so they land on "Account Awaiting Administrator Activation" screen to prevent misuse.
  const newPendingUser: User = {
    id: normalizedEmail,
    name: displayName || normalizedEmail.split("@")[0],
    role: Role.User,
    accessLevel: AccessLevel.Editor,
    email: normalizedEmail,
    avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120",
    targetQuota: 0,
    teamName: "Unassigned",
    status: "pending",
    requestedAt: new Date().toISOString()
  };

  try {
    await setDoc(userRef, cleanUndefined(newPendingUser));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${normalizedEmail}`);
  }
  return newPendingUser;
}

// REST OF EVENT SUBSCRIPTIONS / WRITERS TO FIRESTORE

export function subscribeCollection<T>(
  colName: string,
  onUpdate: (data: T[]) => void,
  sortField?: string
) {
  const colRef = collection(db, colName);
  const q = sortField ? query(colRef, orderBy(sortField, "desc")) : colRef;
  return onSnapshot(q, (snapshot) => {
    const list: T[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as T);
    });
    onUpdate(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, colName);
  });
}

// Custom specialized writers/updaters

export async function saveTask(task: SalesTask): Promise<void> {
  try {
    await setDoc(doc(db, "tasks", task.id), cleanUndefined(task));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `tasks/${task.id}`);
  }
}

export async function deleteTaskDoc(taskId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "tasks", taskId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `tasks/${taskId}`);
  }
}

export async function saveWorkflow(workflow: ProjectWorkflow): Promise<void> {
  try {
    await setDoc(doc(db, "workflows", workflow.id), cleanUndefined(workflow));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `workflows/${workflow.id}`);
  }
}

export async function isAuditLogEnabled(): Promise<boolean> {
  try {
    const docSnap = await getDoc(doc(db, "settings", "auditLogStatus"));
    if (docSnap.exists()) {
      return !!docSnap.data().enabled;
    }
    return true;
  } catch (err) {
    return true;
  }
}

export async function setAuditLogEnabled(enabled: boolean): Promise<void> {
  try {
    await setDoc(doc(db, "settings", "auditLogStatus"), { enabled });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "settings/auditLogStatus");
  }
}

export async function saveLog(log: ActionLog): Promise<void> {
  try {
    const enabled = await isAuditLogEnabled();
    if (enabled) {
      await setDoc(doc(db, "logs", log.id), cleanUndefined(log));
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `logs/${log.id}`);
  }
}

export async function clearAllLogsInFirestore(logs: ActionLog[]): Promise<void> {
  for (const l of logs) {
    try {
      await deleteDoc(doc(db, "logs", l.id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `logs/${l.id}`);
    }
  }
}

export async function updateUserDetails(userId: string, updates: Partial<User>): Promise<void> {
  const userRef = doc(db, "users", userId.toLowerCase());
  try {
    await updateDoc(userRef, cleanUndefined(updates));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
  }
}

export async function saveUserDoc(user: User): Promise<void> {
  const docId = (user.email || user.id).toLowerCase();
  try {
    await setDoc(doc(db, "users", docId), cleanUndefined(user), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${docId}`);
  }
}

export async function deleteUserDoc(userId: string): Promise<void> {
  const cleanId = userId.trim();
  const lowerId = cleanId.toLowerCase();
  try {
    await deleteDoc(doc(db, "users", lowerId));
    if (cleanId !== lowerId) {
      await deleteDoc(doc(db, "users", cleanId)).catch(() => {});
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
    throw err;
  }
}

export async function saveTeamTabSettings(
  teamName: string,
  visibleTabs: string[],
  visibleSubTabs: { [key: string]: string[] },
  visibleSubSubTabs: { [key: string]: { [key: string]: string[] } },
  permissions?: { [key: string]: { view: boolean; add: boolean; edit: boolean } }
): Promise<void> {
  const docId = teamName.toLowerCase().replace(/[^a-z0-9]/g, "-") || "default";
  try {
    await setDoc(doc(db, "tabSettings", docId), {
      id: docId,
      teamName,
      visibleTabs,
      visibleSubTabs,
      visibleSubSubTabs,
      permissions: permissions || null
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `tabSettings/${docId}`);
  }
}

export async function saveClient(client: Client): Promise<void> {
  try {
    await setDoc(doc(db, "clients", client.id), cleanUndefined(client));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `clients/${client.id}`);
  }
}

export async function deleteClientDoc(clientId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "clients", clientId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `clients/${clientId}`);
  }
}

export async function saveTeam(team: Team): Promise<void> {
  try {
    await setDoc(doc(db, "teams", team.id), cleanUndefined(team));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `teams/${team.id}`);
  }
}

export async function deleteTeamDoc(teamId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "teams", teamId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `teams/${teamId}`);
    throw err;
  }
}

export async function saveProduct(product: Product): Promise<void> {
  try {
    await setDoc(doc(db, "products", product.id), cleanUndefined(product));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `products/${product.id}`);
  }
}

export async function deleteProductDoc(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "products", productId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `products/${productId}`);
  }
}

export async function saveOrder(order: OrderOffer): Promise<void> {
  try {
    await setDoc(doc(db, "orders", order.id), cleanUndefined(order));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `orders/${order.id}`);
  }
}

export async function deleteOrderDoc(orderId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "orders", orderId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`);
  }
}

export async function savePaymentBank(bank: PaymentBank): Promise<void> {
  try {
    await setDoc(doc(db, "payment_banks", bank.id), cleanUndefined(bank));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `payment_banks/${bank.id}`);
  }
}

export async function deletePaymentBankDoc(bankId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "payment_banks", bankId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `payment_banks/${bankId}`);
  }
}

export async function saveProductCategory(category: ProductCategory): Promise<void> {
  try {
    await setDoc(doc(db, "product_categories", category.id), cleanUndefined(category));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `product_categories/${category.id}`);
  }
}

export async function deleteProductCategoryDoc(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "product_categories", id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `product_categories/${id}`);
  }
}

export async function saveProductGroup(group: ProductGroup): Promise<void> {
  try {
    await setDoc(doc(db, "product_groups", group.id), cleanUndefined(group));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `product_groups/${group.id}`);
  }
}

export async function deleteProductGroupDoc(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "product_groups", id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `product_groups/${id}`);
  }
}

export async function saveManufacturer(manufacturer: Manufacturer): Promise<void> {
  try {
    await setDoc(doc(db, "manufacturers", manufacturer.id), cleanUndefined(manufacturer));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `manufacturers/${manufacturer.id}`);
  }
}

export async function deleteManufacturerDoc(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "manufacturers", id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `manufacturers/${id}`);
  }
}

export async function saveFreightTerm(item: FreightTerm): Promise<void> {
  try {
    await setDoc(doc(db, "freight_terms", item.id), cleanUndefined(item));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `freight_terms/${item.id}`);
  }
}

export async function deleteFreightTermDoc(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "freight_terms", id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `freight_terms/${id}`);
  }
}

export async function saveTransporter(item: TransporterName): Promise<void> {
  try {
    await setDoc(doc(db, "transporters", item.id), cleanUndefined(item));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `transporters/${item.id}`);
  }
}

export async function deleteTransporterDoc(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "transporters", id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `transporters/${id}`);
  }
}

export async function saveWarehouse(item: WarehouseManagedBy): Promise<void> {
  try {
    await setDoc(doc(db, "warehouses", item.id), cleanUndefined(item));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `warehouses/${item.id}`);
  }
}

export async function deleteWarehouseDoc(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "warehouses", id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `warehouses/${id}`);
  }
}

export async function saveDispatchLocation(item: DispatchLocation): Promise<void> {
  try {
    await setDoc(doc(db, "dispatch_locations", item.id), cleanUndefined(item));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `dispatch_locations/${item.id}`);
  }
}

export async function deleteDispatchLocationDoc(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "dispatch_locations", id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `dispatch_locations/${id}`);
  }
}

export async function saveAolBranch(item: AolBranchName): Promise<void> {
  try {
    await setDoc(doc(db, "aol_branches", item.id), cleanUndefined(item));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `aol_branches/${item.id}`);
  }
}

export async function deleteAolBranchDoc(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "aol_branches", id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `aol_branches/${id}`);
  }
}

export async function saveSupplier(item: SupplierName): Promise<void> {
  try {
    await setDoc(doc(db, "suppliers", item.id), cleanUndefined(item));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `suppliers/${item.id}`);
  }
}

export async function deleteSupplierDoc(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "suppliers", id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `suppliers/${id}`);
  }
}

export async function saveClearingCat(item: ClearingCat): Promise<void> {
  try {
    await setDoc(doc(db, "clearing_cats", item.id), cleanUndefined(item));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `clearing_cats/${item.id}`);
  }
}

export async function deleteClearingCatDoc(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "clearing_cats", id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `clearing_cats/${id}`);
  }
}

export async function saveAolGodown(item: AolGodown): Promise<void> {
  try {
    await setDoc(doc(db, "aol_godowns", item.id), cleanUndefined(item));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `aol_godowns/${item.id}`);
  }
}

export async function deleteAolGodownDoc(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "aol_godowns", id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `aol_godowns/${id}`);
  }
}

/**
 * Generic save function used by Admin Google Sheets Sync to set/update records in any collection.
 */
export async function saveGenericCollectionRecord(collectionKey: string, record: any): Promise<void> {
  try {
    const cleanRec = cleanUndefined(record);
    if (!cleanRec.id) {
      throw new Error(`Record missing required 'id' field for collection ${collectionKey}`);
    }
    await setDoc(doc(db, collectionKey, cleanRec.id), cleanRec, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${collectionKey}/${record?.id || "unknown"}`);
  }
}

export async function bulkSaveGenericCollectionRecords(collectionKey: string, records: any[]): Promise<number> {
  if (!records || records.length === 0) return 0;
  let savedCount = 0;
  const chunkSize = 400; // safe batch chunk size under Firestore 500 limit
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    for (const record of chunk) {
      const cleanRec = cleanUndefined(record);
      if (!cleanRec.id) {
        cleanRec.id = `${collectionKey.replace(/_/g, "")}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      }
      const docRef = doc(db, collectionKey, cleanRec.id);
      batch.set(docRef, cleanRec, { merge: true });
      savedCount++;
    }
    await batch.commit();
  }
  return savedCount;
}

export interface GoogleSheetsConfigDoc {
  spreadsheetIds?: { [moduleId: string]: string };
  appsScriptUrl?: string;
  updatedAt?: string;
}

// Have to reamove later we don't need it in future
export async function getGoogleSheetsSettings(): Promise<GoogleSheetsConfigDoc> {
  try {
    const docSnap = await getDoc(doc(db, "settings", "google_sheets"));
    if (docSnap.exists()) {
      return docSnap.data() as GoogleSheetsConfigDoc;
    }
  } catch (err) {
    console.warn("Could not load Google Sheets settings from Firestore:", err);
  }
  return { spreadsheetIds: {} };
}

export async function saveGoogleSheetsSettings(config: GoogleSheetsConfigDoc): Promise<void> {
  try {
    await setDoc(doc(db, "settings", "google_sheets"), {
      ...config,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "settings/google_sheets");
  }
}

export interface AppsScriptConfigDoc {
  appsScriptUrl?: string;
  spreadsheetId?: string;
  sheetName?: string;
  autoSync?: boolean;
  autoSaveFetchedToDb?: boolean;
  autoReadFromSheet?: boolean;
  updatedAt?: string;
  updatedByName?: string;
}

export async function getSharedImportAppsScriptUrl(): Promise<string> {
  return "";
}

export async function saveSharedImportAppsScriptUrl(
  _url: string,
  _applyToAllTabs: boolean = false,
  _updatedByName?: string
): Promise<void> {
  // No-op to prevent cross-tab pollution since each sub-tab uses its own separate spreadsheet and script
}

// Use to fetch Apps Script config from firebase 
export async function getAppsScriptConfig(configKey: string, defaultSheetName: string): Promise<AppsScriptConfigDoc> {
  try {
    const docSnap = await getDoc(doc(db, "settings", configKey));
    if (docSnap.exists()) {
      return docSnap.data() as AppsScriptConfigDoc;
    }
  } catch (err) {
    console.warn(`Could not load ${configKey} settings from Firestore:`, err);
  }
  return { sheetName: defaultSheetName, autoSync: true };
}

// I will change with it later
// export async function getAppsScriptConfig(
//   configKey: string, 
//   defaultSheetName: string
// ): Promise<AppsScriptConfigDoc> {
//   try {
//     const docSnap = await getDoc(doc(db, "settings", configKey));
//     if (docSnap.exists()) {
//       return docSnap.data() as AppsScriptConfigDoc;
//     }
//   } catch (err) {
//     console.warn(`Could not load ${configKey} settings from Firestore:`, err);
//     throw new Error(`Kindly save config first for ${configKey}`);
//   }

//   // If document does not exist in Firestore
//   throw new Error("Kindly save config first");
// }

export async function saveAppsScriptConfig(configKey: string, config: AppsScriptConfigDoc): Promise<void> {
  try {
    await setDoc(doc(db, "settings", configKey), {
      ...config,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `settings/${configKey}`);
  }
}

export function subscribeAppsScriptConfig(configKey: string, defaultSheetName: string, onUpdate: (config: AppsScriptConfigDoc) => void) {
  const docRef = doc(db, "settings", configKey);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as AppsScriptConfigDoc);
    } else {
      onUpdate({ sheetName: defaultSheetName, autoSync: true });
    }
  }, (error) => {
    console.warn(`Listener error for ${configKey}:`, error);
  });
}

export type ImportPiAppsScriptConfig = AppsScriptConfigDoc;

export async function getImportPiAppsScriptConfig(): Promise<ImportPiAppsScriptConfig> {
  return getAppsScriptConfig("import_pi_config", "Import PIs");
}

export async function saveImportPiAppsScriptConfig(config: ImportPiAppsScriptConfig): Promise<void> {
  return saveAppsScriptConfig("import_pi_config", config);
}

export async function saveSupplierMaster(item: SupplierMasterRecord): Promise<void> {
  try {
    await setDoc(doc(db, "suppliers_master", item.id), cleanUndefined(item));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `suppliers_master/${item.id}`);
  }
}

export async function deleteSupplierMasterDoc(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "suppliers_master", id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `suppliers_master/${id}`);
  }
}








