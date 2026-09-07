/**
 * Partner Share Allocation Rules:
 * - Partner (Rajshekar Reddy) has 50% share ONLY in:
 *   1. Custom Printed T-Shirts (Round Neck, Collar, etc.)
 *   2. ID Cards & Lanyards
 *   3. Custom Caps
 * - Partner has 0% share in:
 *   - Bouquets, Photo Frames, Custom Mugs, Personalized Albums,
 *   - Polaroid Prints, Calendars, Fridge Magnets, Gift Hampers, Photo Restoration, etc.
 * - Jashwanth Reddy (Owner) retains 100% of non-shared product profits + 50% of shared product profits.
 */

export const SHARED_PARTNER_CATEGORIES = [
  'Custom Printed T-Shirts (Round Neck & Collar)',
  'Custom Printed ID Cards & Lanyards',
  'Custom Caps'
] as const;

export const SOLE_OWNER_CATEGORIES = [
  'Photo Frames',
  'Bouquets & Flowers',
  'Custom Mugs & Drinkware',
  'Personalized Albums',
  'Polaroid Prints',
  'Customized Calendars',
  'Fridge Magnets',
  'Customized Gifts & Hampers',
  'Photo Restoration'
] as const;

export function isPartnerSharedProduct(
  productName?: string,
  isTshirt?: boolean | number,
  hasIdCards?: boolean | number
): boolean {
  if (Boolean(isTshirt) || Boolean(hasIdCards)) {
    return true;
  }

  const name = (productName || '').toLowerCase().trim();
  if (!name) return false;

  // Shared keywords
  if (
    name.includes('t-shirt') ||
    name.includes('t shirt') ||
    name.includes('tshirt') ||
    name.includes('tee') ||
    name.includes('polo') ||
    name.includes('collar') ||
    name.includes('round neck')
  ) {
    return true;
  }

  if (
    name.includes('id card') ||
    name.includes('idcard') ||
    name.includes('lanyard') ||
    name.includes('pvc card') ||
    name.includes('badge')
  ) {
    return true;
  }

  if (
    name.includes('cap') ||
    name.includes('caps') ||
    name.includes('hat')
  ) {
    return true;
  }

  // Non-shared items (Bouquets, Frames, Mugs, etc.)
  return false;
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

  // Use explicit is_partner_shared if present in DB, otherwise detect
  const isShared = order.is_partner_shared !== undefined
    ? Boolean(order.is_partner_shared)
    : isPartnerSharedProduct(order.product_name, order.is_tshirt, order.has_id_cards);

  if (isShared) {
    const half = Math.round(profit / 2);
    const otherHalf = profit - half;

    return {
      isShared: true,
      categoryTag: 'SHARED',
      scopeLabel: 'Shared Product (T-Shirts, ID Cards & Caps)',
      jashwanthShare: half,
      rajshekarShare: otherHalf,
      jashwanthPercentage: 50,
      rajshekarPercentage: 50,
      explanation: '50/50 equal partner profit share applies for T-Shirts, ID Cards & Caps.'
    };
  } else {
    return {
      isShared: false,
      categoryTag: 'SOLE',
      scopeLabel: 'Sole Product (Frames, Bouquets & Gifts)',
      jashwanthShare: profit,
      rajshekarShare: 0,
      jashwanthPercentage: 100,
      rajshekarPercentage: 0,
      explanation: '100% retained by Jashwanth Reddy. Bouquets, frames, mugs & gifts are excluded from partner share.'
    };
  }
}
