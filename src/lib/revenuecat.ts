/**
 * Web Platform RevenueCat Stub
 * Since native RevenueCat SDK is removed for PWA, this stub provides safe fallbacks.
 */

export interface CustomerInfo {
  activeSubscriptions: string[];
  allPurchasedProductIdentifiers: string[];
  latestExpirationDate?: string | null;
  entitlements: {
    active: Record<string, { identifier: string; isActive: boolean; expirationDate?: string | null }>;
  };
}

export const isCapacitorNative = (): boolean => false;

export async function initRevenueCat(_userId?: string | null): Promise<void> {
  // Web stub - no native RevenueCat SDK on PWA
}

export async function identifyUserInRevenueCat(_userId: string): Promise<void> {
  // Web stub
}

export async function logoutUserInRevenueCat(): Promise<void> {
  // Web stub
}

export async function checkProStatus(): Promise<boolean> {
  return false;
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  return null;
}

export async function purchasePackage(_packageIdentifier: string): Promise<{ success: boolean; isPro: boolean; message: string }> {
  return {
    success: false,
    isPro: false,
    message: 'Web platformunda satın alma işlemleri sınırlıdır. Lütfen VOX iOS uygulamasını indirin.'
  };
}

export async function restorePurchases(): Promise<{ success: boolean; isPro: boolean; message: string }> {
  return {
    success: false,
    isPro: false,
    message: 'Geri yüklenen web aboneliği bulunamadı.'
  };
}

export async function presentRevenueCatPaywall(): Promise<boolean> {
  return false;
}

export async function presentRevenueCatCustomerCenter(): Promise<boolean> {
  return false;
}
