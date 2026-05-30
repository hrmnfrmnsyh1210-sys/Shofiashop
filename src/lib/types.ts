export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'CASHIER';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  customDomain: string | null;
  description: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  logoUrl: string | null;
  bankInfo: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { users: number; products: number };
}

export interface PublicStore {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  logoUrl: string | null;
  bankInfo: string | null;
  customDomain: string | null;
}

export interface AuthSession {
  user: AuthUser;
  tenant: { id: string; name: string; slug: string } | null;
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser extends Omit<User, 'tenantId'> {
  tenantId: string | null;
}

export type TransactionStatus = 'PENDING' | 'PAID' | 'VOIDED' | 'REFUNDED';
export type TransactionChannel = 'POS' | 'ONLINE';
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'EWALLET' | 'QRIS' | 'OTHER';
export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN';
export type OnlineOrderStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  imageUrl: string | null;
  price: string;
  costPrice: string;
  stock: number;
  minStock: number;
  unit: string;
  isActive: boolean;
  showOnline: boolean;
  categoryId: string | null;
  category?: Category | null;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  points: number;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: string;
  unitCost: string;
  discount: string;
  subtotal: string;
}

export interface Transaction {
  id: string;
  transactionNumber: string;
  channel: TransactionChannel;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  cashierId: string | null;
  memberId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  onlineStatus: OnlineOrderStatus | null;
  subtotal: string;
  discount: string;
  tax: string;
  shippingFee: string;
  total: string;
  paymentAmount: string;
  changeAmount: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items?: TransactionItem[];
  member?: Pick<Member, 'id' | 'name' | 'phone'> | null;
  cashier?: Pick<User, 'id' | 'name'> | null;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reference: string | null;
  transactionId: string | null;
  userId: string | null;
  note: string | null;
  createdAt: string;
  product?: Pick<Product, 'id' | 'name' | 'sku'>;
  user?: Pick<User, 'id' | 'name'> | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CatalogProduct {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  imageUrl: string | null;
  price: string;
  unit: string;
  stock: number;
  category: { id: string; name: string; slug: string } | null;
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface CheckoutResponse {
  orderNumber: string;
  total: string;
  status: TransactionStatus;
  onlineStatus: OnlineOrderStatus | null;
}

export interface AuthResponse {
  user: User;
  tenant?: { id: string; name: string; slug: string } | null;
  accessToken: string;
  refreshToken: string;
}

export interface ReportSummary {
  transactionCount: number;
  subtotal: string;
  discount: string;
  tax: string;
  shippingFee: string;
  total: string;
  cogs: string;
  grossProfit: string;
}

export interface TopProduct {
  product?: { id: string; name: string; sku: string; imageUrl: string | null };
  quantity: number;
  revenue: string;
}

export interface DailySalesPoint {
  date: string;
  count: number;
  total: string;
}

export interface DailySalesResponse {
  from: string;
  to: string;
  series: DailySalesPoint[];
}

export interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  minStock: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  summary: string;
  metadata: string | null;
  ipAddress: string | null;
  createdAt: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  userRole: UserRole | null;
  tenantId: string | null;
  tenantName: string | null;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  tenantName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SuperRecentTransaction {
  id: string;
  transactionNumber: string;
  total: string;
  status: TransactionStatus;
  channel: TransactionChannel;
  createdAt: string;
  tenantId: string;
  tenantName: string | null;
}

export interface SuperOverview {
  tenants: { total: number; active: number };
  users: { total: number };
  products: { total: number };
  recentTransactions: SuperRecentTransaction[];
}
