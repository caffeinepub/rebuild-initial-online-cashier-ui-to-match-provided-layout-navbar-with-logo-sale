import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface UserProfile {
    name: string;
}
export type Time = bigint;
export interface ExpenseRecord {
    id: bigint;
    total: bigint;
    nominalAmount: bigint;
    date: string;
    item: string;
    createdAt: Time;
    picName: string;
    quantity: bigint;
    category: string;
    monthYear: string;
}
export interface DashboardSummary {
    paymentMethodTotals: PaymentMethodTotals;
    todayRevenue: bigint;
    totalQuantitySold: bigint;
}
export interface CashTransaction {
    id: bigint;
    transactionType: TransactionType;
    description: string;
    timestamp: Time;
    amount: bigint;
}
export interface InventoryItem {
    id: bigint;
    reject: bigint;
    minimumStock: bigint;
    initialStock: bigint;
    size: string;
    unit: string;
    itemName: string;
    category: string;
    finalStock: bigint;
}
export interface PaymentMethodTotals {
    trf: bigint;
    tunai: bigint;
    dana: bigint;
    qris: bigint;
}
export interface SaleRecord {
    id: bigint;
    paymentMethod: PaymentMethod;
    totalTax: bigint;
    timestamp: Time;
    items: Array<SaleItem>;
    amount: bigint;
    totalQuantity: bigint;
}
export interface InventoryReportEntry {
    description: string;
    timestamp: Time;
    itemName: string;
    itemSize: string;
    quantity: bigint;
}
export interface SaleItem {
    cogs: bigint;
    productId: bigint;
    productName: string;
    quantity: bigint;
    unitPrice: bigint;
}
export interface Product {
    id: bigint;
    hpp: bigint;
    name: string;
    size: string;
    category: string;
    salePrice: bigint;
    image: ExternalBlob;
}
export enum PaymentMethod {
    trf = "trf",
    tunai = "tunai",
    dana = "dana",
    qris = "qris"
}
export enum TransactionType {
    expense = "expense",
    income = "income"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCashTransaction(amount: bigint, transactionType: TransactionType, description: string): Promise<bigint>;
    addExpenseRecord(date: string, monthYear: string, item: string, category: string, nominalAmount: bigint, quantity: bigint, total: bigint, picName: string): Promise<bigint>;
    addInventoryItem(itemName: string, category: string, size: string, unit: string, initialStock: bigint, reject: bigint, finalStock: bigint, minimumStock: bigint): Promise<bigint | null>;
    addProduct(name: string, size: string, category: string, salePrice: bigint, hpp: bigint, image: ExternalBlob): Promise<bigint>;
    adjustInventoryStock(itemId: bigint, quantity: bigint, isAddition: boolean, description: string): Promise<boolean>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteCashTransaction(id: bigint): Promise<boolean>;
    deleteSale(id: bigint): Promise<boolean>;
    fetchDashboardSummary(): Promise<DashboardSummary>;
    getAllCashTransactions(): Promise<Array<CashTransaction>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCashBalance(): Promise<bigint>;
    getCashTransactionsByDate(startDate: Time, endDate: Time): Promise<Array<CashTransaction>>;
    getExpenseRecords(): Promise<Array<ExpenseRecord>>;
    getInventoryReports(filter: string | null, daysBack: bigint | null): Promise<Array<InventoryReportEntry>>;
    getInventoryUsageStats(category: string | null, size: string | null, fromTimestamp: Time | null, toTimestamp: Time | null): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isInventoryLow(): Promise<boolean>;
    listInventoryItems(): Promise<Array<InventoryItem>>;
    listProducts(): Promise<Array<Product>>;
    querySales(fromTimestamp: Time, toTimestamp: Time): Promise<Array<SaleRecord>>;
    recordSale(items: Array<SaleItem>, paymentMethod: PaymentMethod, totalTax: bigint): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateCashTransaction(id: bigint, amount: bigint, transactionType: TransactionType, description: string): Promise<boolean>;
    updateInventoryItem(id: bigint, itemName: string, category: string, size: string, unit: string, initialStock: bigint, reject: bigint, finalStock: bigint, minimumStock: bigint): Promise<boolean>;
    updateSale(id: bigint, items: Array<SaleItem>, paymentMethod: PaymentMethod, totalTax: bigint): Promise<boolean>;
}
