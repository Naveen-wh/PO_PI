/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Role {
  Admin = "Admin",
  SeniorManager = "Senior Manager",
  Manager = "Manager",
  TeamLead = "Team Lead",
  User = "User",
}

export enum AccessLevel {
  Editor = "Editor", // Add, View, Edit (Only self created)
  Contributor = "Contributor", // Add, View, Edit (self and its team)
  Manager = "Manager", // View, Edit, Delete (for all)
}

export type UserStatus = "active" | "pending" | "disabled";

export interface User {
  id: string;
  name: string;
  role: Role;
  accessLevel: AccessLevel;
  reportsTo?: string; // ID of the user they report to
  teamName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  targetQuota: number; // Monthly sales quota
  status?: UserStatus;
  requestedAt?: string;
}

export interface ClosedWonDetails {
  customerPoNumber: string;
  poDate: string;
  freightTerm: string;
  freightChargedInBill?: string;
  freightCostToAol?: string;
  cartageLabourCharges?: string;
  transporterName: string;
  deliveryTerm: string;
  destinationAddress: string;
  dispatchDate: string;
  dispatchLocation: string;
  warehouseManagedBy: string;
  poAttachmentUrl?: string;
}

export interface SalesLead {
  id: string;
  clientName: string;
  companyName: string;
  email: string;
  phone: string;
  status: "New" | "Contacted" | "Proposal" | "Negotiation" | "Closed Won" | "Closed Lost";
  value: number; // Deal value
  quantity: number;
  rate: number;
  amount: number;
  assignedToUserId: string;
  createdByUserId: string;
  projectId: string; // Belongs to a workflow project
  notes: string;
  createdAt: string;
  closedWonDetails?: ClosedWonDetails;
  procurementType?: "import" | "domestic" | "sales_st";
  importSubTab?: "procurement" | "clearing" | "payments" | "tpti" | "reports";
  domesticSubTab?: "procurement" | "payments" | "tptd" | "reports";
  salesStSubTab?: "sales" | "st" | "reports";

  // New import-specific fields
  aolBranchName?: string;
  indentor?: string;
  piNo?: string;
  piDate?: string;
  piExRate?: number;
  supplierName?: string;
  productNameCustom?: string;
  usdPmt?: number;
  purchase?: string;
  qty?: number;
  totalUsd?: number;
  mfg?: string;
  port?: string;
  paymentTerms?: string;
  remarks?: string;

  // LC Details fields
  lcType?: "LC" | "NON LC";
  lcAppSentToBank?: string;
  lcBankName?: string;
  lcNoRefNo?: string;
  lcDate?: string;
  lcUsanceAtSight?: "Usance" | "At Sight";
  lcUsanceDays?: number;
  lcLatestShipmentDate?: string;
  lcExpiryDate?: string;
  lcOpenExRate?: number;

  // ETA & ETD tracking fields
  etd?: string;
  eta?: string;
  etaRemark?: string;
  etaHistory?: Array<{
    id: string;
    etd: string;
    eta: string;
    remark: string;
    updatedAt: string;
  }>;

  // BE Details tracking fields
  beFobCif?: "FOB" | "CIF";
  beFreightUsd?: number;
  beInsuranceUsd?: number;
  beNo?: string;
  beDate?: string;
  beBoeExRate?: number;
  beQuery?: string;
  beInvoiceNumber?: string;
  beInvoiceDate?: string;
  beLotBatchNumber?: string;
  beBillOfLadingNo?: string;
  beBillOfLadingDate?: string;

  // Container Details fields
  containerProductName?: string;
  containerNo?: string;
  containerSize?: string;
  containerQty?: number;
  containerRemark?: string;

  // IGM & Item fields
  igmContainerNo?: string;
  igmNoDt?: string;
  igmItemNo?: string;
  igmChaSelfJobNo?: string;
  igmFinalInwardDate?: string;
  igmContainerGatedIn?: string;
  igmCfsLastDate?: string;
  igmMaterialMovedOutOfCfs?: string;
  igmFreeEmptyCtnrDetentionLastDt?: string;
  igmStatusRemark?: string;
  igmDuty?: string;
  igmShpLine?: string;
  igmStampDuty?: string;
  igmDo?: string;
  igmCfs?: string;
  igmOocStatus?: string;

  // DEFERRED DUTY fields
  deferredBeNo?: string;
  deferredBeStatus?: string;
  deferredDuty?: string;
  deferredDutyAmt?: number;
  deferredPaymentDueDate?: string;
  deferredStampDutyAmount?: number;
  deferredStampDutyDate?: string;
  deferredStatusRemark?: string;

  // Multiple containers, IGM, LC, ETA, BE, Deferred Duty support
  containers?: ContainerDetail[];
  igmDetails?: IgmDetail[];
  lcDetail?: LcDetail;
  etaDetail?: EtaDetail;
  beDetail?: BeDetail;
  lcDetails?: LcDetail[];
  etaDetails?: EtaDetail[];
  beDetails?: BeDetail[];
  deferredDutyDetails?: DeferredDutyDetail[];
}

export interface DeferredDutyDetail {
  id: string;
  beNo: string;
  deferredBeStatus?: string;
  deferredDuty?: string;
  deferredDutyAmt?: number;
  deferredPaymentDueDate?: string;
  deferredStampDutyAmount?: number;
  deferredStampDutyDate?: string;
  deferredStatusRemark?: string;
}

export interface ContainerDetail {
  id: string;
  productName: string;
  containerNo: string;
  containerSize: string;
  containerQty: number;
  containerRemark: string;
}

export interface LcDetail {
  id: string;
  productName: string;
  lcType: "LC" | "NON LC";
  lcAppSentToBank: string;
  lcBankName: string;
  lcNoRefNo: string;
  lcDate: string;
  lcUsanceAtSight: "Usance" | "At Sight";
  lcUsanceDays: number;
  lcLatestShipmentDate: string;
  lcExpiryDate: string;
  lcOpenExRate: number;
}

export interface EtaDetail {
  id: string;
  productName: string;
  etd: string;
  eta: string;
  etaRemark: string;
  etaHistory?: Array<{ id: string; etd: string; eta: string; remark: string; updatedAt: string }>;
}

export interface BeDetail {
  id: string;
  productName: string;
  beFobCif: "FOB" | "CIF";
  beFreightUsd?: number;
  beInsuranceUsd?: number;
  beNo: string;
  beDate: string;
  beBoeExRate?: number;
  beQuery: string;
  beInvoiceNumber: string;
  beInvoiceDate: string;
  beLotBatchNumber: string;
  beBillOfLadingNo: string;
  beBillOfLadingDate: string;
}

export interface IgmDetail {
  id: string;
  containerNo: string;
  igmNoDt: string;
  igmItemNo: string;
  igmChaSelfJobNo: string;
  igmFinalInwardDate: string;
  igmContainerGatedIn: string;
  igmCfsLastDate: string;
  igmMaterialMovedOutOfCfs: string;
  igmFreeEmptyCtnrDetentionLastDt: string;
  igmDuty: string;
  igmShpLine: string;
  igmStampDuty: string;
  igmDo: string;
  igmCfs: string;
  igmOocStatus: string;
  igmStatusRemark: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface PaymentBank {
  id: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  address: string;
  createdAt: string;
}

export interface BillingDetails {
  invoiceNumber: string;
  invoiceFileUrl?: string;
  invoiceFileName?: string;
  mappedAt?: string;
}

export interface OrderOffer {
  id: string;
  clientName: string;
  companyName: string;
  email: string;
  phone: string;
  status: "New" | "Contacted" | "Proposal" | "Negotiation" | "Closed Won" | "Closed Lost";
  totalValue: number;
  items: OrderItem[];
  payment: string;
  paymentBankId?: string;
  delivery: string;
  otherTerms: string;
  assignedToUserId: string;
  createdByUserId: string;
  notes: string;
  createdAt: string;
  closedWonDetails?: ClosedWonDetails;
  billingDetails?: BillingDetails;
}

export interface ProjectWorkflow {
  id: string;
  name: string;
  description: string;
  status: "Planning" | "Active" | "Completed" | "On Hold";
  clientName: string;
  leadsCount: number;
}

export interface SalesTask {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: "Low" | "Medium" | "High";
  status: "To Do" | "In Progress" | "Review" | "Completed";
  assignedToUserId: string;
  createdByUserId: string;
  projectId: string;
  leadId?: string; // Optional related lead
}

// Action log to show transparency of modifications
export interface ActionLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  actionType: "Create Lead" | "Edit Lead" | "Delete Lead" | "Update Lead" | "Create Task" | "Edit Task" | "Delete Task" | "Edit User" | "Delete User" | "Create Product" | "Edit Product" | "Delete Product" | "Bulk Import Products" | "Create Order" | "Edit Order" | "Delete Order" | "Create Category" | "Delete Category" | "Create Group" | "Delete Group" | "Create Manufacturer" | "Delete Manufacturer" | "Create Freight Term" | "Delete Freight Term" | "Create Transporter" | "Delete Transporter" | "Map Invoice" | "Update Invoice" | "Update Order Status" | "Map Customer PO" | "Update Google Drive Settings" | "Create Email Template" | "Update Email Template" | "Delete Email Template" | "Send Email" | "Create Domestic PD" | "Edit Domestic PD" | "Delete Domestic PD" | "Create PO" | "Edit PO" | "Delete PO" | "Create PI" | "Edit PI" | "Delete PI" | "Create Domestic TPT-D" | "Edit Domestic TPT-D" | "Delete Domestic TPT-D" | "Create Import TPT-I" | "Edit Import TPT-I" | "Delete Import TPT-I" | "Create Import CI" | "Edit Import CI" | "Delete Import CI" | "Edit PID Record" | "Create Accounts ST" | "Edit Accounts ST" | "Delete Accounts ST" | "Create Opening Stock" | "Edit Opening Stock" | "Delete Opening Stock" | "Bulk Import Opening Stock" | "Create Accounts Sales" | "Edit Accounts Sales" | "Delete Accounts Sales" | "Create Accounts Druming" | "Edit Accounts Druming" | "Delete Accounts Druming" | "Create Expense Ledger" | "Edit Expense Ledger" | "Delete Expense Ledger" | "Create Accounts Office Exp" | "Edit Accounts Office Exp" | "Delete Accounts Office Exp" | "Create Accounts MEIS" | "Edit Accounts MEIS" | "Delete Accounts MEIS" | "Create Other Income Ledger" | "Edit Other Income Ledger" | "Delete Other Income Ledger" | "Create Accounts Other Income" | "Edit Accounts Other Income" | "Delete Accounts Other Income" | "Create Accounts FDR" | "Edit Accounts FDR" | "Delete Accounts FDR" | "Create Accounts CSD & ISD" | "Edit Accounts CSD & ISD" | "Delete Accounts CSD & ISD" | "Create Accounts TPT-S" | "Edit Accounts TPT-S" | "Delete Accounts TPT-S" | "Create Ledger CR DR" | "Edit Ledger CR DR" | "Delete Ledger CR DR" | "Create Supplier CR/DR Note" | "Edit Supplier CR/DR Note" | "Delete Supplier CR/DR Note" | "Create Customer CR/DR Note" | "Edit Customer CR/DR Note" | "Delete Customer CR/DR Note";
  targetType: "Lead" | "Task" | "User" | "Product" | "Order" | "Category" | "Group" | "Manufacturer" | "Freight Term" | "Transporter" | "Settings" | "EmailTemplate" | "Domestic PD" | "PO" | "PI" | "Domestic TPT-D" | "Import TPT-I" | "Import CI" | "PID Record" | "Accounts ST" | "Opening Stock" | "Accounts Sales" | "Accounts Druming" | "Expense Ledger" | "Accounts Office Exp" | "Accounts MEIS" | "Other Income Ledger" | "Accounts Other Income" | "Accounts FDR" | "Accounts CSD & ISD" | "Accounts TPT-S" | "Ledger CR DR" | "Supplier CR/DR Note" | "Customer CR/DR Note";
  targetId: string;
  targetName: string;
  details: string;
}

export interface TeamTabSettings {
  id: string; // Document ID (usually the lowercase slugified teamName)
  teamName: string; // The team name like "SME West Coast"
  visibleTabs: string[]; // List of tab IDs like ["dashboard", "leads", "workflows", "products"]
  visibleSubTabs?: { [key: string]: string[] }; // Optional map of tab ID to visible sub-tab IDs
  visibleSubSubTabs?: { [key: string]: { [key: string]: string[] } }; // Optional map of tab ID to (subTab ID to visible subSubTab IDs)
  permissions?: { [key: string]: { view: boolean; add: boolean; edit: boolean } }; // Optional map of tab or tab/subTab to its View, Add, Edit permissions
}

export interface Client {
  id: string;
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  gst: string;
  city: string;
  pincode: string;
  address: string;
  createdAt: string;
  createdByUserId?: string;
  assignedToUserId?: string;
  teamName?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  createdAt: string;
}

export interface ProductGroup {
  id: string;
  name: string;
  createdAt: string;
}

export interface Manufacturer {
  id: string;
  name: string;
  createdAt: string;
}

export interface FreightTerm {
  id: string;
  name: string;
  createdAt: string;
}

export interface TransporterName {
  id: string;
  name: string;
  createdAt: string;
}

export interface WarehouseManagedBy {
  id: string;
  name: string;
  createdAt: string;
}

export interface DispatchLocation {
  id: string;
  name: string;
  createdAt: string;
}

export interface AolBranchName {
  id: string;
  name: string;
  createdAt: string;
}

export interface SupplierName {
  id: string;
  name: string;
  createdAt: string;
}

export interface ClearingCat {
  id: string;
  name: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  group: string;
  manufacturer: string;
  hsnCode?: string;
  teamName?: string; // For team segregation matching
  createdAt: string;
  createdByUserId?: string;
}

export interface AolGodown {
  id: string;
  name: string; // AOL Godown Name
  branchName?: string; // AOL Branch Name
  gstin?: string; // GSTIN
  address?: string; // Address
  dispatchLocation?: string; // Dispatch Location / City
  warehouseManager?: string; // Warehouse Manager
  contactEmail?: string; // Contact Email
  phoneNo?: string; // Phone No
  description?: string; // Description / Remarks
  createdAt: string;
}

export interface PoRecord {
  id?: string;
  createdAt?: string; // "Created_at"
  poDate: string; // "PO Date"
  poNumber: string; // "PO Number"
  supplierName: string; // "Supplier Name"
  supplierGstin: string; // "Supplier GSTIN"
  supplierAddress: string; // "Supplier Address"
  createEditDate: string; // "Create/Edit Date"
  cpName: string; // "CP Name"
  cpNumber: string; // "CP Number"
  cpEmailId: string; // "CP Email ID"
  deliveryLocation: string; // "Delivery Location"
  billingLocation: string; // "Billing Location"
  shipToAddress: string; // "Ship To Address"
  billToAddress: string; // "Bill To Address"
  shipToGst: string; // "Ship To GST"
  billToGst: string; // "Bill To GST"
  preparedBy: string; // "Prepared By"
  checkedBy: string; // "Checked By"
  spName: string; // "SP Name"
  spPhoneNumber: string; // "SP Phone Number"
  spEmailId: string; // "SP Email Id"
  paymentTerms: string; // "Payment Terms"
  deliveryTerms: string; // "Delivery Terms"
  otherTerms: string; // "Other Terms"
  currency: string; // "Currency"
  subTotal: number; // "Sub Total"
  gst: number; // "GST"
  totalInNum: number; // "Total (In Num)"
  totalInWord: string; // "Total (In Word)"
  poPdfUrl?: string; // "PDF File URLs"
  productDescription1: string; // "Product Description 1"
  packingKgs1: string; // "Packing/Kgs 1"
  packs1: number; // "Packs 1"
  totalQty1: number; // "Total Qty 1"
  rate1: number; // "Rate 1"
  amount1: number; // "Amount 1"

  productDescription2?: string; // "Product Description 2"
  packingKgs2?: string; // "Packing/Kgs 2"
  packs2?: number; // "Packs 2"
  totalQty2?: number; // "Total Qty 2"
  rate2?: number; // "Rate 2"
  amount2?: number; // "Amount 2"

  productDescription3?: string; // "Product Description 3"
  packingKgs3?: string; // "Packing/Kgs 3"
  packs3?: number; // "Packs 3"
  totalQty3?: number; // "Total Qty 3"
  rate3?: number; // "Rate 3"
  amount3?: number; // "Amount 3"

  productDescription4?: string; // "Product Description 4"
  packingKgs4?: string; // "Packing/Kgs 4"
  packs4?: number; // "Packs 4"
  totalQty4?: number; // "Total Qty 4"
  rate4?: number; // "Rate 4"
  amount4?: number; // "Amount 4"

  productDescription5?: string; // "Product Description 5"
  packingKgs5?: string; // "Packing/Kgs 5"
  packs5?: number; // "Packs 5"
  totalQty5?: number; // "Total Qty 5"
  rate5?: number; // "Rate 5"
  amount5?: number; // "Amount 5"

  productDescription6?: string; // "Product Description 6"
  packingKgs6?: string; // "Packing/Kgs 6"
  packs6?: number; // "Packs 6"
  totalQty6?: number; // "Total Qty 6"
  rate6?: number; // "Rate 6"
  amount6?: number; // "Amount 6"

  productDescription7?: string; // "Product Description 7"
  packingKgs7?: string; // "Packing/Kgs 7"
  packs7?: number; // "Packs 7"
  totalQty7?: number; // "Total Qty 7"
  rate7?: number; // "Rate 7"
  amount7?: number; // "Amount 7"

  createdBy: string; // "Created By"
  editBy?: string; // "Edit By"
  editTimestamp?: string; // "Edit Timestamp"
  createdByUserId?: string;
}

export interface SupplierMasterRecord {
  id: string;
  supplierName: string;         // Supplier Name
  supplierGst?: string;         // Supplier GST
  supplierAddress?: string;     // Supplier Address
  contactPersonName?: string;   // Contact Person Name
  contactPersonEmail?: string;  // Contact Person Email
  contactPersonPhone?: string;  // Contact Person Phone
  importDomestic?: "Import" | "Domestic" | string; // Import/ Domestic
  remarks?: string;             // Remarks
  createdAt: string;
}

export interface PiRecord {
  id?: string;
  createdAt?: string; // "Created_at"
  piDate: string; // "PI Date"
  piNumber: string; // "PI Number"
  createEditDate: string; // "Create/Edit Date"

  // Customer & Billing / Shipping Details
  orderPlacedBy: string; // "Order Placed by (Customer Dealing Person Name)"
  customerMobileNumber: string; // "Mobile Number (Customer Dealing Person)"
  customerEmailId: string; // "E-Mail ID (Customer Dealing Person)"
  billToCompanyName: string; // "Company Name (Bill To - Customer Billing Name"
  billToAddress: string; // "Company Address (Bill To) - Customer Billing Address"
  shipToCompanyName: string; // "Company Name (Ship To) - Company Delivery Name / Location"
  shipToAddress: string; // "Company Shipping Address (Ship To) - Company Delivery Address"
  buyersOrderNumber: string; // "Buyer's Order Number"

  // Terms & Bank & AOL Branch & Sales Person Details
  paymentTerms: string; // "PAYMENT TERM'S"
  otherTerms: string; // "OTHER TERM'S / TERMS OF DELIVERY"
  aolBankAccount: string; // "IN WHICH AOL BANK ACCOUNT YOU WANT TO RECIVED PAYMENT"
  accountNo: string; // "Account No"
  ifscCode: string; // "IFSC Code"
  aolBranchGodown: string; // "AOL BRANCH/ GODOWN"
  aolBranchAddress: string; // "Address"
  aolBranchGstin: string; // "GSTIN"
  aolSalesPersonName: string; // "AOL Sales Person Name"
  aolSalesPersonEmail: string; // "Email Address"

  // Products 1 to 4 (INR only)
  productName1: string; // "Product Name 1"
  productQty1: number; // "Product 1 Quantity"
  productRate1: number; // "Product 1 Rate"
  amount1: number; // "Amount 1"

  productName2?: string; // "Product Name 2"
  productQty2?: number; // "Product Quantity 2"
  productRate2?: number; // "Product Rate 2"
  amount2?: number; // "Amount 2"

  productName3?: string; // "Product Name 3"
  productQty3?: number; // "Product Quantity 3"
  productRate3?: number; // "Product Rate 3"
  amount3?: number; // "Amount 3"

  productName4?: string; // "Product Name 4"
  productQty4?: number; // "Product Quantity 4"
  productRate4?: number; // "Product Rate 4"
  amount4?: number; // "Amount 4"

  // Freight, Remarks & Totals (INR only)
  freightCharges: number; // "Freight Charges"
  deliveryNoteTerms: string; // "Terms of Delivery or Delivery Note"
  partyRemark: string; // "Any Note or Remark for the party"
  subTotal: number; // "Sub Total"
  gst: number; // "GST"
  totalInNum: number; // "Total (In Num)"
  amountInWord: string; // "Amount in Word"

  piPdfUrl?: string; // "PDF File URLs"
  createdBy: string; // "Created By"
  editBy?: string; // "Edit By"
  editTimestamp?: string; // "Edit Timestamp"
  createdByUserId?: string;
}













