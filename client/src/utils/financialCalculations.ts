/**
 * Centralized Financial Calculation Engine for Infinity Customizations
 * Single source of truth for:
 * Customer Total, Product Cost, Printing Cost, Delivery/Rapido Cost,
 * Other Cost, Total Cost, Profit, Profit Margin %, Payment Received,
 * Payment Pending, Available Amount, and Payment Status.
 */

export interface FinancialInput {
  sellingPrice: number;
  productCost?: number;
  printingCost?: number;
  deliveryCost?: number;
  tshirtRapidoCost?: number;
  printRapidoCost?: number;
  rapidoCost?: number;
  otherCost?: number;
  paymentReceived?: number;
}

export interface FinancialSummary {
  sellingPrice: number;
  productCost: number;
  printingCost: number;
  deliveryCost: number;
  rapidoCost: number;
  otherCost: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  paymentReceived: number;
  paymentPending: number;
  availableAmount: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING';
  formatted: {
    sellingPrice: string;
    totalCost: string;
    profit: string;
    profitMargin: string;
    paymentReceived: string;
    paymentPending: string;
    availableAmount: string;
  };
}

export function calculateOrderFinancials(input: FinancialInput): FinancialSummary {
  const sellingPrice = Math.max(0, Math.round(Number(input.sellingPrice) || 0));
  const productCost = Math.max(0, Math.round(Number(input.productCost) || 0));
  const printingCost = Math.max(0, Math.round(Number(input.printingCost) || 0));
  const deliveryCost = Math.max(0, Math.round(Number(input.deliveryCost) || 0));
  
  const rapidoCost = Math.max(
    0,
    Math.round(
      Number(input.rapidoCost ?? ((Number(input.tshirtRapidoCost) || 0) + (Number(input.printRapidoCost) || 0))) || 0
    )
  );
  
  const otherCost = Math.max(0, Math.round(Number(input.otherCost) || 0));
  const paymentReceived = Math.max(0, Math.round(Number(input.paymentReceived) || 0));

  const totalCost = productCost + printingCost + deliveryCost + rapidoCost + otherCost;
  const profit = sellingPrice - totalCost;
  const profitMargin = sellingPrice > 0 ? parseFloat(((profit / sellingPrice) * 100).toFixed(1)) : 0;
  const paymentPending = Math.max(0, sellingPrice - paymentReceived);
  const availableAmount = paymentReceived - totalCost;

  let paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING' = 'PENDING';
  if (sellingPrice > 0 && paymentPending === 0) {
    paymentStatus = 'PAID';
  } else if (paymentReceived > 0) {
    paymentStatus = 'PARTIAL';
  }

  return {
    sellingPrice,
    productCost,
    printingCost,
    deliveryCost,
    rapidoCost,
    otherCost,
    totalCost,
    profit,
    profitMargin,
    paymentReceived,
    paymentPending,
    availableAmount,
    paymentStatus,
    formatted: {
      sellingPrice: `₹${sellingPrice.toLocaleString('en-IN')}`,
      totalCost: `₹${totalCost.toLocaleString('en-IN')}`,
      profit: `₹${profit.toLocaleString('en-IN')}`,
      profitMargin: `${profitMargin}%`,
      paymentReceived: `₹${paymentReceived.toLocaleString('en-IN')}`,
      paymentPending: `₹${paymentPending.toLocaleString('en-IN')}`,
      availableAmount: `₹${availableAmount.toLocaleString('en-IN')}`
    }
  };
}
