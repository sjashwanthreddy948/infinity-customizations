/**
 * Partner Share Allocation Rules:
 * - Infinity Customizations is dedicated exclusively to:
 *   1. Custom Printed T-Shirts & Apparel (Round Neck, Collar, Oversized, Hoodies)
 *   2. Custom ID Cards & Lanyards
 *   3. Custom Caps & Headwear
 * - Both partners (Jashwanth Reddy & Rajshekar Reddy) share all order profits equally (50/50 split).
 */

export const SHARED_PARTNER_CATEGORIES = [
  'Custom Printed T-Shirts (Round Neck, Collar & Hoodies)',
  'Custom Printed ID Cards & Lanyards',
  'Custom Caps & Headwear'
] as const;

export function isPartnerSharedProduct(
  _productName?: string,
  _isTshirt?: boolean | number,
  _hasIdCards?: boolean | number
): boolean {
  // In this system, all merchandise (T-Shirts, ID Cards, Caps) is shared 50/50
  return true;
}

export interface PartnerShareAllocation {
  isShared: boolean;
  categoryTag: string;
  scopeLabel: string;
  jashwanthShare: number;
  rajshekarShare: number;
  jashwanthPercentage: number;
  rajshekarPercentage: number;
  explanation: string;
}

export function calculateOrderPartnerShare(order: {
  profit: number;
  product_name?: string;
  is_tshirt?: boolean | number;
  has_id_cards?: boolean | number;
  is_partner_shared?: number;
}): PartnerShareAllocation {
  const profit = Math.round(Number(order.profit) || 0);
  const half = Math.round(profit / 2);
  const otherHalf = profit - half;

  return {
    isShared: true,
    categoryTag: 'SHARED',
    scopeLabel: 'T-Shirts, ID Cards & Caps (50/50 Split)',
    jashwanthShare: half,
    rajshekarShare: otherHalf,
    jashwanthPercentage: 50,
    rajshekarPercentage: 50,
    explanation: '50/50 partnership profit share applies for T-Shirts, ID Cards & Caps.'
  };
}

