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
export interface Product {
    id: bigint;
    name: string;
    size: string;
    salePrice: bigint;
    image: ExternalBlob;
}
export interface InventoryItem {
    id: bigint;
    reject: bigint;
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
export interface DashboardSummary {
    paymentMethodTotals: PaymentMethodTotals;
    todayRevenue: bigint;
    totalQuantitySold: bigint;
}
export interface UserProfile {
    name: string;
}
export interface SaleItem {
    productId: bigint;
    quantity: bigint;
    unitPrice: bigint;
}
export enum PaymentMethod {
    trf = "trf",
    tunai = "tunai",
    dana = "dana",
    qris = "qris"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addInventoryItem(itemName: string, category: string, size: string, unit: string, initialStock: bigint, reject: bigint, finalStock: bigint): Promise<bigint | null>;
    addProduct(name: string, size: string, salePrice: bigint, image: ExternalBlob): Promise<bigint>;
    adjustInventoryStock(itemId: bigint, quantity: bigint, isAddition: boolean): Promise<boolean>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    fetchDashboardSummary(): Promise<DashboardSummary>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listInventoryItems(): Promise<Array<InventoryItem>>;
    listProducts(): Promise<Array<Product>>;
    recordSale(items: Array<SaleItem>, paymentMethod: PaymentMethod): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateInventoryItem(id: bigint, itemName: string, category: string, size: string, unit: string, initialStock: bigint, reject: bigint, finalStock: bigint): Promise<boolean>;
}
