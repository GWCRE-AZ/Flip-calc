import { nanoid } from 'nanoid';

export type LoanType = 'cash' | 'hard_money' | 'conventional';

export interface RehabItem {
  id: string;
  name: string;
  cost: number;
}

export interface RehabCategory {
  id: string;
  name: string;
  items: RehabItem[];
}

export interface CalculatorInputs {
  // Property Details
  address: string;
  purchasePrice: number;
  arv: number;
  purchaseClosingCostPercent: number;
  purchaseClosingCostAmount: number;
  usePurchaseClosingCostPercent: boolean;

  // Rehab Costs
  rehabCostSimple: number;
  useDetailedRehab: boolean;
  rehabCategories: RehabCategory[];

  // Financing
  loanType: LoanType;
  downPaymentPercent: number;
  downPaymentAmount: number;
  useDownPaymentPercent: boolean;
  interestRate: number;
  loanTermMonths: number;
  originationPoints: number;
  isInterestOnly: boolean;
  
  // Advanced Financing
  includeRehabInLoan: boolean;
  includeClosingCostsInLoan: boolean; // Roll closing costs into loan
  includePointsInLoan: boolean; // Roll points into loan
  maxLoanToARVPercent: number; // Cap loan at % of ARV (e.g. 70%)
  interestReserveMonths: number; // Months of interest to finance upfront

  // Holding & Selling
  holdingPeriodMonths: number;
  monthlyPropertyTaxes: number;
  monthlyInsurance: number;
  monthlyUtilities: number;
  monthlyHOA: number;
  monthlyLawnCare: number;
  monthlyPoolMaintenance: number;
  monthlySecurityAlarm: number;
  monthlyVacancyInsurance: number;
  monthlyOther: number;
  useDetailedHoldingCosts: boolean;
  
  sellingCommissionPercent: number;
  sellingClosingCostPercent: number;
  sellerConcessions: number;
  
  // Detailed Selling Costs
  useDetailedSellingCosts: boolean;
  sellingTitleInsurance: number;
  sellingEscrowFees: number;
  sellingTransferTax: number;
  sellingAttorneyFees: number;
  sellingRecordingFees: number;
  sellingHomeWarranty: number;
  sellingOtherSellingCosts: number;
}

export interface CalculatorResults {
  purchaseClosingCosts: number;
  totalRehabCost: number;
  
  // Financing Results
  baseLoanAmount: number; // Purchase + Rehab (if applicable)
  totalLoanAmount: number; // Base + Rolled Costs
  downPayment: number;
  monthlyLoanPayment: number;
  totalLoanInterest: number;
  totalOriginationPoints: number;
  totalFinancingCosts: number;
  financedInterestReserve: number;
  
  totalHoldingCosts: number;
  sellingCommission: number;
  sellingClosingCosts: number;
  totalSellingCosts: number;
  
  totalProjectCost: number;
  totalCashNeeded: number;
  netProfit: number;
  roi: number;
  annualizedRoi: number;
  cashOnCash: number;
  profitMargin: number;
  
  // Validation
  isLoanCapped: boolean;
  maxLoanAmount: number;
}

export const defaultRehabCategories: RehabCategory[] = [
  {
    id: 'exterior',
    name: 'Exterior & Landscaping',
    items: [
      { id: 'roof', name: 'Roof Repair/Replace', cost: 0 },
      { id: 'siding', name: 'Siding/Stucco', cost: 0 },
      { id: 'windows', name: 'Windows', cost: 0 },
      { id: 'paint_ext', name: 'Exterior Paint', cost: 0 },
      { id: 'landscaping', name: 'Landscaping', cost: 0 },
      { id: 'driveway', name: 'Driveway/Concrete', cost: 0 },
      { id: 'deck', name: 'Deck/Patio', cost: 0 },
      { id: 'fencing', name: 'Fencing', cost: 0 },
    ]
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    items: [
      { id: 'cabinets', name: 'Cabinets', cost: 0 },
      { id: 'countertops', name: 'Countertops', cost: 0 },
      { id: 'appliances', name: 'Appliances', cost: 0 },
      { id: 'sink_faucet', name: 'Sink & Faucet', cost: 0 },
      { id: 'backsplash', name: 'Backsplash', cost: 0 },
      { id: 'flooring_kitchen', name: 'Flooring', cost: 0 },
      { id: 'lighting_kitchen', name: 'Lighting', cost: 0 },
    ]
  },
  {
    id: 'bathroom',
    name: 'Bathrooms',
    items: [
      { id: 'vanity', name: 'Vanity/Sink', cost: 0 },
      { id: 'toilet', name: 'Toilet', cost: 0 },
      { id: 'tub_shower', name: 'Tub/Shower', cost: 0 },
      { id: 'tile', name: 'Tile Work', cost: 0 },
      { id: 'fixtures', name: 'Plumbing Fixtures', cost: 0 },
      { id: 'mirror', name: 'Mirrors/Hardware', cost: 0 },
    ]
  },
  {
    id: 'interior',
    name: 'Interior General',
    items: [
      { id: 'paint_int', name: 'Interior Paint', cost: 0 },
      { id: 'flooring_gen', name: 'Flooring (Carpet/LVP)', cost: 0 },
      { id: 'doors', name: 'Doors & Trim', cost: 0 },
      { id: 'drywall', name: 'Drywall Repair', cost: 0 },
      { id: 'lighting_gen', name: 'Light Fixtures', cost: 0 },
      { id: 'hardware', name: 'Hardware/Doorknobs', cost: 0 },
    ]
  },
  {
    id: 'mechanical',
    name: 'Mechanical & Systems',
    items: [
      { id: 'hvac', name: 'HVAC System', cost: 0 },
      { id: 'electrical', name: 'Electrical Panel/Wiring', cost: 0 },
      { id: 'plumbing', name: 'Plumbing/Water Heater', cost: 0 },
      { id: 'foundation', name: 'Foundation Repair', cost: 0 },
      { id: 'insulation', name: 'Insulation', cost: 0 },
    ]
  },
  {
    id: 'other',
    name: 'Permits & Misc',
    items: [
      { id: 'permits', name: 'Permits & Fees', cost: 0 },
      { id: 'dumpster', name: 'Dumpster/Cleanup', cost: 0 },
      { id: 'staging', name: 'Staging', cost: 0 },
      { id: 'contingency', name: 'Contingency (10%)', cost: 0 },
    ]
  }
];

export const defaultInputs: CalculatorInputs = {
  address: '',
  purchasePrice: 250000,
  arv: 375000,
  purchaseClosingCostPercent: 3,
  purchaseClosingCostAmount: 0,
  usePurchaseClosingCostPercent: true,

  rehabCostSimple: 45000,
  useDetailedRehab: false,
  rehabCategories: defaultRehabCategories,

  loanType: 'hard_money',
  downPaymentPercent: 10,
  downPaymentAmount: 0,
  useDownPaymentPercent: true,
  interestRate: 10,
  loanTermMonths: 12,
  originationPoints: 2,
  isInterestOnly: true,
  
  includeRehabInLoan: true,
  includeClosingCostsInLoan: false,
  includePointsInLoan: false,
  maxLoanToARVPercent: 70,
  interestReserveMonths: 0,

  holdingPeriodMonths: 6,
  monthlyPropertyTaxes: 250,
  monthlyInsurance: 100,
  monthlyUtilities: 150,
  monthlyHOA: 0,
  monthlyLawnCare: 0,
  monthlyPoolMaintenance: 0,
  monthlySecurityAlarm: 0,
  monthlyVacancyInsurance: 0,
  monthlyOther: 0,
  useDetailedHoldingCosts: false,

  sellingCommissionPercent: 6,
  sellingClosingCostPercent: 1,
  sellerConcessions: 0,
  
  // Detailed Selling Costs
  useDetailedSellingCosts: false,
  sellingTitleInsurance: 1500,
  sellingEscrowFees: 1000,
  sellingTransferTax: 0,
  sellingAttorneyFees: 500,
  sellingRecordingFees: 150,
  sellingHomeWarranty: 500,
  sellingOtherSellingCosts: 0,
};

export function calculateResults(inputs: CalculatorInputs): CalculatorResults {
  // Validate inputs - return zero results for invalid inputs
  if (inputs.purchasePrice <= 0 || inputs.arv <= 0) {
    return {
      purchaseClosingCosts: 0,
      totalRehabCost: 0,
      baseLoanAmount: 0,
      totalLoanAmount: 0,
      downPayment: 0,
      monthlyLoanPayment: 0,
      totalLoanInterest: 0,
      totalOriginationPoints: 0,
      financedInterestReserve: 0,
      isLoanCapped: false,
      maxLoanAmount: 0,
      totalFinancingCosts: 0,
      totalHoldingCosts: 0,
      sellingCommission: 0,
      sellingClosingCosts: 0,
      totalSellingCosts: 0,
      totalProjectCost: 0,
      netProfit: 0,
      roi: 0,
      annualizedRoi: 0,
      totalCashNeeded: 0,
      cashOnCash: 0,
      profitMargin: 0,
    };
  }

  // 1. Purchase Costs
  const purchaseClosingCosts = inputs.usePurchaseClosingCostPercent
    ? inputs.purchasePrice * (inputs.purchaseClosingCostPercent / 100)
    : inputs.purchaseClosingCostAmount;

  // 2. Rehab Costs
  const totalRehabCost = inputs.useDetailedRehab
    ? inputs.rehabCategories.reduce((total, category) => {
        return total + category.items.reduce((catTotal, item) => catTotal + item.cost, 0);
      }, 0)
    : inputs.rehabCostSimple;

  // 3. Financing Logic
  let baseLoanAmount = 0;
  let totalLoanAmount = 0;
  let downPayment = 0;
  let monthlyLoanPayment = 0;
  let totalLoanInterest = 0;
  let totalOriginationPoints = 0;
  let financedInterestReserve = 0;
  let isLoanCapped = false;
  const maxLoanAmount = inputs.arv * (inputs.maxLoanToARVPercent / 100);

  if (inputs.loanType !== 'cash') {
    // Determine loan-specific constraints
    const isConventional = inputs.loanType === 'conventional';
    
    // For conventional loans: no rehab financing, no cost rolling, fixed 30-year term
    const canFinanceRehab = !isConventional && inputs.includeRehabInLoan;
    const canRollClosingCosts = !isConventional && inputs.includeClosingCostsInLoan;
    const canRollPoints = !isConventional && inputs.includePointsInLoan;
    const canUseInterestOnly = !isConventional && inputs.isInterestOnly;
    const canUseInterestReserve = !isConventional && inputs.interestReserveMonths > 0;
    const loanTermMonths = isConventional ? 360 : inputs.loanTermMonths; // 30 years for conventional
    
    // Determine what is being financed
    let amountToFinance = inputs.purchasePrice;
    
    if (canFinanceRehab) {
      amountToFinance += totalRehabCost;
    }

    // Calculate Down Payment
    downPayment = inputs.useDownPaymentPercent
      ? amountToFinance * (inputs.downPaymentPercent / 100)
      : inputs.downPaymentAmount;
    
    // Base Loan (Purchase + Rehab - Down Payment)
    baseLoanAmount = Math.max(0, amountToFinance - downPayment);
    
    // Calculate Points (based on base loan usually)
    totalOriginationPoints = baseLoanAmount * (inputs.originationPoints / 100);
    
    // Start building Total Loan Amount
    totalLoanAmount = baseLoanAmount;

    // Roll in Costs if selected (Hard Money only)
    if (canRollClosingCosts) {
      totalLoanAmount += purchaseClosingCosts;
    }
    
    if (canRollPoints) {
      totalLoanAmount += totalOriginationPoints;
    }

    // Check against ARV Cap (Hard Money only - conventional doesn't use this)
    if (!isConventional && totalLoanAmount > maxLoanAmount) {
      isLoanCapped = true;
    }

    // Calculate Monthly Payment
    const monthlyRate = inputs.interestRate / 100 / 12;
    
    if (canUseInterestOnly) {
      monthlyLoanPayment = totalLoanAmount * monthlyRate;
    } else {
      // Amortized payment formula
      if (monthlyRate > 0) {
        monthlyLoanPayment = (totalLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) / 
                             (Math.pow(1 + monthlyRate, loanTermMonths) - 1);
      } else {
        monthlyLoanPayment = totalLoanAmount / loanTermMonths;
      }
    }

    // Interest Reserve Logic (Hard Money only)
    if (canUseInterestReserve) {
      financedInterestReserve = monthlyLoanPayment * inputs.interestReserveMonths;
    }

    // Total Interest Paid
    // If reserve is used, those months are paid from reserve (already financed or held back)
    // We count total interest cost regardless of source
    if (canUseInterestOnly) {
      // For interest-only loans, monthly payment IS interest
      totalLoanInterest = monthlyLoanPayment * inputs.holdingPeriodMonths;
    } else {
      // For amortized loans, calculate actual interest paid during holding period
      // Using the standard amortization interest calculation
      let remainingBalance = totalLoanAmount;
      let interestPaid = 0;
      for (let month = 0; month < inputs.holdingPeriodMonths; month++) {
        const monthlyInterest = remainingBalance * monthlyRate;
        interestPaid += monthlyInterest;
        const principalPaid = monthlyLoanPayment - monthlyInterest;
        remainingBalance -= principalPaid;
      }
      totalLoanInterest = interestPaid;
    }

  } else {
    // Cash purchase - all costs are out of pocket
    downPayment = inputs.purchasePrice + totalRehabCost;
  }

  const totalFinancingCosts = totalLoanInterest + totalOriginationPoints;

  // 4. Holding Costs
  const monthlyHoldingCosts = 
    inputs.monthlyPropertyTaxes +
    inputs.monthlyInsurance +
    inputs.monthlyUtilities +
    inputs.monthlyHOA +
    inputs.monthlyLawnCare +
    inputs.monthlyPoolMaintenance +
    inputs.monthlySecurityAlarm +
    inputs.monthlyVacancyInsurance +
    inputs.monthlyOther;
  
  const totalHoldingCosts = monthlyHoldingCosts * inputs.holdingPeriodMonths;

  // 5. Selling Costs
  const sellingCommission = inputs.arv * (inputs.sellingCommissionPercent / 100);
  
  // Calculate selling closing costs - either percentage-based or detailed itemization
  const sellingClosingCosts = inputs.useDetailedSellingCosts
    ? inputs.sellingTitleInsurance +
      inputs.sellingEscrowFees +
      inputs.sellingTransferTax +
      inputs.sellingAttorneyFees +
      inputs.sellingRecordingFees +
      inputs.sellingHomeWarranty +
      inputs.sellingOtherSellingCosts
    : inputs.arv * (inputs.sellingClosingCostPercent / 100);
  
  const totalSellingCosts = sellingCommission + sellingClosingCosts + inputs.sellerConcessions;

  // 6. Totals & Metrics
  const totalProjectCost = 
    inputs.purchasePrice + 
    purchaseClosingCosts + 
    totalRehabCost + 
    totalFinancingCosts + 
    totalHoldingCosts + 
    totalSellingCosts;

  // Cash Needed Calculation
  // Start with Down Payment
  let cashNeeded = downPayment;
  
  // Determine loan-specific constraints for cash needed
  const isConventionalLoan = inputs.loanType === 'conventional';
  const canRollClosingCostsForCash = !isConventionalLoan && inputs.includeClosingCostsInLoan;
  const canRollPointsForCash = !isConventionalLoan && inputs.includePointsInLoan;
  const canFinanceRehabForCash = !isConventionalLoan && inputs.includeRehabInLoan;
  const canUseInterestReserveForCash = !isConventionalLoan && inputs.interestReserveMonths > 0;
  
  // Add Closing Costs (conventional: always out of pocket, hard money: if not rolled in)
  if (!canRollClosingCostsForCash) {
    cashNeeded += purchaseClosingCosts;
  }

  // Add Rehab Costs (conventional: always out of pocket, hard money: if not financed)
  // For cash purchases, rehab is already included in downPayment
  if (inputs.loanType !== 'cash' && !canFinanceRehabForCash) {
    cashNeeded += totalRehabCost;
  }

  // Add Points (conventional: always out of pocket, hard money: if not rolled in)
  if (!canRollPointsForCash) {
    cashNeeded += totalOriginationPoints;
  }

  // Add Holding Costs (paid monthly out of pocket)
  // For cash purchases, just add holding costs directly
  if (inputs.loanType === 'cash') {
    cashNeeded += totalHoldingCosts;
  } else {
    // For loans, add holding costs plus interest paid out of pocket
    // Interest reserve only applies to hard money loans
    const interestReserveMonths = canUseInterestReserveForCash ? inputs.interestReserveMonths : 0;
    const interestCoveredByReserve = Math.min(interestReserveMonths, inputs.holdingPeriodMonths) * monthlyLoanPayment;
    const interestPaidOutOfPocket = totalLoanInterest - interestCoveredByReserve;
    cashNeeded += totalHoldingCosts + interestPaidOutOfPocket;
  }

  // Note: If interest reserve is financed (added to loan), it's not cash needed.
  // If it's held back from loan proceeds, it reduces the "net" loan to borrower, 
  // effectively meaning the borrower might need to bring more cash if the loan doesn't cover purchase fully.
  // For this calculator, we assume "Interest Reserve" means the lender adds it to the loan balance or holds it from a loan that covers 100% of needs.
  // Simplified: Cash Needed = Upfront Cash + Holding Costs paid during project.

  const totalCashNeeded = cashNeeded;

  const netProfit = inputs.arv - totalProjectCost;
  
  const roi = totalProjectCost > 0 ? (netProfit / totalProjectCost) * 100 : 0;
  const cashOnCash = totalCashNeeded > 0 ? (netProfit / totalCashNeeded) * 100 : 0;
  
  const annualizedRoi = inputs.holdingPeriodMonths > 0 
    ? roi * (12 / inputs.holdingPeriodMonths) 
    : 0;

  const profitMargin = inputs.arv > 0 ? (netProfit / inputs.arv) * 100 : 0;

  return {
    purchaseClosingCosts,
    totalRehabCost,
    baseLoanAmount,
    totalLoanAmount,
    downPayment,
    monthlyLoanPayment,
    totalLoanInterest,
    totalOriginationPoints,
    totalFinancingCosts,
    financedInterestReserve,
    totalHoldingCosts,
    sellingCommission,
    sellingClosingCosts,
    totalSellingCosts,
    totalProjectCost,
    totalCashNeeded,
    netProfit,
    roi,
    annualizedRoi,
    cashOnCash,
    profitMargin,
    isLoanCapped,
    maxLoanAmount
  };
}
