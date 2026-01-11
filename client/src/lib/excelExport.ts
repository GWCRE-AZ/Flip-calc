import * as XLSX from 'xlsx';
import { CalculatorInputs, CalculatorResults } from './calculator';

export function exportToExcel(
  inputs: CalculatorInputs,
  results: CalculatorResults,
  strategy: 'flip' | 'brrrr' | 'wholesale',
  brrrrData?: {
    monthlyRent: number;
    monthlyExpenses: number;
    refinanceLTV: number;
    refinanceRate: number;
    refinanceTerm: number;
  },
  wholesaleData?: {
    assignmentFee: number;
    endBuyerProfit: number;
  }
) {
  const workbook = XLSX.utils.book_new();

  // ===== SHEET 1: EXECUTIVE SUMMARY =====
  const summaryData = [
    ['Flip Analysis'],
    [''],
    ['Report Generated:', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
    ['Property Address:', inputs.address || 'Not specified'],
    ['Analysis Strategy:', strategy === 'flip' ? 'Fix & Flip' : strategy === 'brrrr' ? 'BRRRR' : 'Wholesale'],
    [''],
    ['═══════════════════════════════════════════════════════════════'],
    ['EXECUTIVE SUMMARY'],
    ['═══════════════════════════════════════════════════════════════'],
    [''],
    ['KEY METRICS', 'VALUE', 'ASSESSMENT'],
    ['Net Profit', formatCurrency(results.netProfit), results.netProfit > 0 ? '✓ PROFITABLE' : '✗ LOSS'],
    ['Return on Investment (ROI)', formatPercent(results.roi), results.roi >= 15 ? '✓ EXCELLENT' : results.roi >= 10 ? '○ GOOD' : '△ LOW'],
    ['Cash-on-Cash Return', formatPercent(results.cashOnCash), results.cashOnCash >= 20 ? '✓ EXCELLENT' : '○ ACCEPTABLE'],
    ['Annualized ROI', formatPercent(results.annualizedRoi), ''],
    ['Profit Margin', formatPercent(results.profitMargin), results.profitMargin >= 10 ? '✓ HEALTHY' : '△ THIN'],
    [''],
    ['INVESTMENT OVERVIEW', 'VALUE', ''],
    ['Purchase Price', formatCurrency(inputs.purchasePrice), ''],
    ['After Repair Value (ARV)', formatCurrency(inputs.arv), ''],
    ['Total Rehab Cost', formatCurrency(results.totalRehabCost), ''],
    ['Total Project Cost', formatCurrency(results.totalProjectCost), ''],
    ['Total Cash Needed', formatCurrency(results.totalCashNeeded), ''],
    [''],
    ['DEAL ANALYSIS', 'VALUE', 'TARGET'],
    ['70% Rule Check', formatPercent((inputs.purchasePrice + results.totalRehabCost) / inputs.arv * 100), '< 70%'],
    ['Loan-to-ARV Ratio', formatPercent((results.totalLoanAmount / inputs.arv) * 100), '< 75%'],
    ['Equity at Purchase', formatCurrency(inputs.arv - inputs.purchasePrice - results.totalRehabCost), ''],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  setColumnWidths(summarySheet, [35, 20, 20]);
  applyHeaderStyle(summarySheet, 0);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');

  // ===== SHEET 2: PROPERTY DETAILS =====
  const propertyData = [
    ['PROPERTY DETAILS'],
    [''],
    ['Basic Information', ''],
    ['Property Address', inputs.address || 'Not specified'],
    ['Purchase Price', formatCurrency(inputs.purchasePrice)],
    ['After Repair Value (ARV)', formatCurrency(inputs.arv)],
    ['Square Footage', 'See calculator for details'],
    [''],
    ['Purchase Costs', ''],
    ['Purchase Price', formatCurrency(inputs.purchasePrice)],
    ['Closing Cost Rate', inputs.usePurchaseClosingCostPercent ? formatPercent(inputs.purchaseClosingCostPercent) : 'Fixed Amount'],
    ['Purchase Closing Costs', formatCurrency(results.purchaseClosingCosts)],
    ['Total Purchase Cost', formatCurrency(inputs.purchasePrice + results.purchaseClosingCosts)],
    [''],
    ['ARV Analysis', ''],
    ['After Repair Value', formatCurrency(inputs.arv)],
    ['Equity After Rehab', formatCurrency(inputs.arv - inputs.purchasePrice - results.totalRehabCost)],
    ['Price per Square Foot (ARV)', 'See calculator for details'],
  ];

  const propertySheet = XLSX.utils.aoa_to_sheet(propertyData);
  setColumnWidths(propertySheet, [35, 25]);
  XLSX.utils.book_append_sheet(workbook, propertySheet, 'Property Details');

  // ===== SHEET 3: FINANCING =====
  const financingData = [
    ['FINANCING STRUCTURE'],
    [''],
    ['Loan Configuration', ''],
    ['Loan Type', getLoanTypeName(inputs.loanType)],
    [''],
  ];

  if (inputs.loanType === 'cash') {
    financingData.push(
      ['Cash Purchase', ''],
      ['Total Cash Required', formatCurrency(results.totalCashNeeded)],
      ['No Financing Costs', '$0'],
    );
  } else {
    financingData.push(
      ['Loan Details', ''],
      ['Purchase Price', formatCurrency(inputs.purchasePrice)],
      ['Down Payment Percentage', formatPercent(inputs.downPaymentPercent)],
      ['Down Payment Amount', formatCurrency(results.downPayment)],
      ['Base Loan Amount', formatCurrency(results.baseLoanAmount)],
      [''],
      ['Interest & Terms', ''],
      ['Interest Rate', formatPercent(inputs.interestRate)],
      ['Loan Term', `${inputs.loanTermMonths} months`],
      ['Payment Type', inputs.isInterestOnly ? 'Interest Only' : 'Amortized'],
      ['Monthly Payment', formatCurrency(results.monthlyLoanPayment)],
      [''],
      ['Financing Costs', ''],
      ['Origination Points', formatPercent(inputs.originationPoints)],
      ['Origination Fee', formatCurrency(results.totalOriginationPoints)],
      ['Total Interest', formatCurrency(results.totalLoanInterest)],
      ['Total Financing Costs', formatCurrency(results.totalFinancingCosts)],
      [''],
      ['Loan Summary', ''],
      ['Total Loan Amount', formatCurrency(results.totalLoanAmount)],
      ['Loan-to-Value (LTV)', formatPercent((results.totalLoanAmount / inputs.purchasePrice) * 100)],
      ['Loan-to-ARV', formatPercent((results.totalLoanAmount / inputs.arv) * 100)],
    );

    if (inputs.loanType === 'hard_money') {
      financingData.push(
        [''],
        ['Items Financed in Loan', ''],
        ['Rehab Costs Financed', inputs.includeRehabInLoan ? 'Yes' : 'No'],
        ['Closing Costs Financed', inputs.includeClosingCostsInLoan ? 'Yes' : 'No'],
        ['Points Financed', inputs.includePointsInLoan ? 'Yes' : 'No'],
        ['Interest Reserve', inputs.interestReserveMonths > 0 ? `${inputs.interestReserveMonths} months` : 'No'],
      );
    }
  }

  const financingSheet = XLSX.utils.aoa_to_sheet(financingData);
  setColumnWidths(financingSheet, [35, 25]);
  XLSX.utils.book_append_sheet(workbook, financingSheet, 'Financing');

  // ===== SHEET 4: REHAB COSTS =====
  const rehabData = [
    ['REHAB COST BREAKDOWN'],
    [''],
    ['Rehab Summary', ''],
    ['Total Rehab Cost', formatCurrency(results.totalRehabCost)],
    ['Rehab Mode', inputs.useDetailedRehab ? 'Detailed Itemization' : 'Simple Estimate'],
    [''],
  ];

  if (inputs.useDetailedRehab) {
    rehabData.push(['DETAILED REHAB BREAKDOWN', '']);
    rehabData.push(['']);
    
    inputs.rehabCategories.forEach(category => {
      const categoryTotal = category.items.reduce((sum, item) => sum + item.cost, 0);
      if (categoryTotal > 0) {
        rehabData.push([category.name.toUpperCase(), '']);
        category.items.forEach(item => {
          if (item.cost > 0) {
            rehabData.push([`   ${item.name}`, formatCurrency(item.cost)]);
          }
        });
        rehabData.push([`   Subtotal: ${category.name}`, formatCurrency(categoryTotal)]);
        rehabData.push(['', '']);
      }
    });
    
    rehabData.push(['TOTAL REHAB COST', formatCurrency(results.totalRehabCost)]);
  } else {
    rehabData.push(['Simple Estimate', formatCurrency(inputs.rehabCostSimple)]);
  }

  const rehabSheet = XLSX.utils.aoa_to_sheet(rehabData);
  setColumnWidths(rehabSheet, [40, 20]);
  XLSX.utils.book_append_sheet(workbook, rehabSheet, 'Rehab Costs');

  // ===== SHEET 5: HOLDING COSTS =====
  const holdingData = [
    ['HOLDING COSTS'],
    [''],
    ['Holding Period', `${inputs.holdingPeriodMonths} months`],
    [''],
    ['MONTHLY EXPENSES', 'MONTHLY', 'TOTAL'],
    ['Property Taxes', formatCurrency(inputs.monthlyPropertyTaxes), formatCurrency(inputs.monthlyPropertyTaxes * inputs.holdingPeriodMonths)],
    ['Insurance', formatCurrency(inputs.monthlyInsurance), formatCurrency(inputs.monthlyInsurance * inputs.holdingPeriodMonths)],
    ['Utilities', formatCurrency(inputs.monthlyUtilities), formatCurrency(inputs.monthlyUtilities * inputs.holdingPeriodMonths)],
    ['HOA Fees', formatCurrency(inputs.monthlyHOA), formatCurrency(inputs.monthlyHOA * inputs.holdingPeriodMonths)],
    ['Lawn Care', formatCurrency(inputs.monthlyLawnCare), formatCurrency(inputs.monthlyLawnCare * inputs.holdingPeriodMonths)],
    ['Pool Maintenance', formatCurrency(inputs.monthlyPoolMaintenance), formatCurrency(inputs.monthlyPoolMaintenance * inputs.holdingPeriodMonths)],
    ['Security/Alarm', formatCurrency(inputs.monthlySecurityAlarm), formatCurrency(inputs.monthlySecurityAlarm * inputs.holdingPeriodMonths)],
    ['Vacancy Insurance', formatCurrency(inputs.monthlyVacancyInsurance), formatCurrency(inputs.monthlyVacancyInsurance * inputs.holdingPeriodMonths)],
    ['Other Expenses', formatCurrency(inputs.monthlyOther), formatCurrency(inputs.monthlyOther * inputs.holdingPeriodMonths)],
    [''],
    ['TOTAL HOLDING COSTS', '', formatCurrency(results.totalHoldingCosts)],
  ];

  const holdingSheet = XLSX.utils.aoa_to_sheet(holdingData);
  setColumnWidths(holdingSheet, [25, 15, 15]);
  XLSX.utils.book_append_sheet(workbook, holdingSheet, 'Holding Costs');

  // ===== SHEET 6: SELLING COSTS =====
  const sellingData = [
    ['SELLING COSTS'],
    [''],
    ['Sale Price (ARV)', formatCurrency(inputs.arv)],
    [''],
    ['SELLING EXPENSES', 'RATE', 'AMOUNT'],
    ['Realtor Commission', formatPercent(inputs.sellingCommissionPercent), formatCurrency(results.sellingCommission)],
  ];

  if (inputs.useDetailedSellingCosts) {
    sellingData.push(
      ['Title Insurance', '', formatCurrency(inputs.sellingTitleInsurance)],
      ['Escrow/Title Fees', '', formatCurrency(inputs.sellingEscrowFees)],
      ['Transfer Tax', '', formatCurrency(inputs.sellingTransferTax)],
      ['Attorney Fees', '', formatCurrency(inputs.sellingAttorneyFees)],
      ['Recording Fees', '', formatCurrency(inputs.sellingRecordingFees)],
      ['Home Warranty', '', formatCurrency(inputs.sellingHomeWarranty)],
      ['Other Selling Costs', '', formatCurrency(inputs.sellingOtherSellingCosts)],
    );
  } else {
    sellingData.push(
      ['Closing Costs', formatPercent(inputs.sellingClosingCostPercent), formatCurrency(results.sellingClosingCosts)],
    );
  }

  sellingData.push(
    ['Seller Concessions', '', formatCurrency(inputs.sellerConcessions || 0)],
    [''],
    ['TOTAL SELLING COSTS', '', formatCurrency(results.totalSellingCosts)],
    [''],
    ['NET PROCEEDS', '', formatCurrency(inputs.arv - results.totalSellingCosts)],
  );

  const sellingSheet = XLSX.utils.aoa_to_sheet(sellingData);
  setColumnWidths(sellingSheet, [25, 15, 15]);
  XLSX.utils.book_append_sheet(workbook, sellingSheet, 'Selling Costs');

  // ===== SHEET 7: PROFIT ANALYSIS =====
  const profitData = [
    ['PROFIT ANALYSIS'],
    [''],
    ['REVENUE', ''],
    ['Sale Price (ARV)', formatCurrency(inputs.arv)],
    ['Less: Selling Costs', formatCurrency(-results.totalSellingCosts)],
    ['Net Sale Proceeds', formatCurrency(inputs.arv - results.totalSellingCosts)],
    [''],
    ['TOTAL COSTS', ''],
    ['Purchase Price', formatCurrency(inputs.purchasePrice)],
    ['Purchase Closing Costs', formatCurrency(results.purchaseClosingCosts)],
    ['Rehab Costs', formatCurrency(results.totalRehabCost)],
    ['Financing Costs', formatCurrency(results.totalFinancingCosts)],
    ['Holding Costs', formatCurrency(results.totalHoldingCosts)],
    ['Selling Costs', formatCurrency(results.totalSellingCosts)],
    ['Total Project Cost', formatCurrency(results.totalProjectCost)],
    [''],
    ['PROFITABILITY', ''],
    ['Net Profit', formatCurrency(results.netProfit)],
    ['Return on Investment (ROI)', formatPercent(results.roi)],
    ['Cash-on-Cash Return', formatPercent(results.cashOnCash)],
    ['Annualized ROI', formatPercent(results.annualizedRoi)],
    ['Profit Margin', formatPercent(results.profitMargin)],
    [''],
    ['CASH FLOW', ''],
    ['Total Cash Invested', formatCurrency(results.totalCashNeeded)],
    ['Total Loan Amount', formatCurrency(results.totalLoanAmount)],
    ['Loan Payoff at Sale', formatCurrency(results.totalLoanAmount)],
    ['Cash Returned at Sale', formatCurrency(results.netProfit + results.totalCashNeeded)],
  ];

  const profitSheet = XLSX.utils.aoa_to_sheet(profitData);
  setColumnWidths(profitSheet, [30, 20]);
  XLSX.utils.book_append_sheet(workbook, profitSheet, 'Profit Analysis');

  // ===== SHEET 8: SCENARIO ANALYSIS =====
  const baseProfit = results.netProfit;
  const optimisticARV = inputs.arv * 1.05;
  const pessimisticARV = inputs.arv * 0.9;
  const optimisticSellingCosts = optimisticARV * (inputs.sellingCommissionPercent / 100) + (inputs.useDetailedSellingCosts ? 
    (inputs.sellingTitleInsurance + inputs.sellingEscrowFees + inputs.sellingTransferTax + inputs.sellingAttorneyFees + inputs.sellingRecordingFees + inputs.sellingHomeWarranty + inputs.sellingOtherSellingCosts) :
    optimisticARV * (inputs.sellingClosingCostPercent / 100));
  const pessimisticSellingCosts = pessimisticARV * (inputs.sellingCommissionPercent / 100) + (inputs.useDetailedSellingCosts ? 
    (inputs.sellingTitleInsurance + inputs.sellingEscrowFees + inputs.sellingTransferTax + inputs.sellingAttorneyFees + inputs.sellingRecordingFees + inputs.sellingHomeWarranty + inputs.sellingOtherSellingCosts) :
    pessimisticARV * (inputs.sellingClosingCostPercent / 100));
  const optimisticProfit = optimisticARV - optimisticSellingCosts - results.totalProjectCost + results.totalSellingCosts;
  const pessimisticProfit = pessimisticARV - pessimisticSellingCosts - results.totalProjectCost + results.totalSellingCosts;

  // Calculate break-even ARV correctly
  const fixedCostsExcludingSelling = results.totalProjectCost - results.totalSellingCosts;
  const sellingRates = inputs.useDetailedSellingCosts
    ? inputs.sellingCommissionPercent / 100  // Only commission is ARV-based in detailed mode
    : (inputs.sellingCommissionPercent + inputs.sellingClosingCostPercent) / 100;
  const fixedSellingCosts = inputs.useDetailedSellingCosts
    ? (inputs.sellingTitleInsurance + inputs.sellingEscrowFees + inputs.sellingTransferTax +
       inputs.sellingAttorneyFees + inputs.sellingRecordingFees + inputs.sellingHomeWarranty +
       inputs.sellingOtherSellingCosts + (inputs.sellerConcessions || 0))
    : (inputs.sellerConcessions || 0);
  const breakEvenARV = sellingRates < 1
    ? (fixedCostsExcludingSelling + fixedSellingCosts) / (1 - sellingRates)
    : 0;

  const scenarioData = [
    ['SCENARIO ANALYSIS'],
    [''],
    ['What-If Analysis Based on ARV Variations'],
    [''],
    ['SCENARIO', 'ARV', 'NET PROFIT', 'ROI', 'ASSESSMENT'],
    ['Pessimistic (-10%)', formatCurrency(pessimisticARV), formatCurrency(pessimisticProfit), formatPercent((pessimisticProfit / results.totalCashNeeded) * 100), pessimisticProfit > 0 ? 'Still Profitable' : 'LOSS'],
    ['Base Case', formatCurrency(inputs.arv), formatCurrency(baseProfit), formatPercent(results.roi), 'Expected Outcome'],
    ['Optimistic (+5%)', formatCurrency(optimisticARV), formatCurrency(optimisticProfit), formatPercent((optimisticProfit / results.totalCashNeeded) * 100), 'Best Case'],
    [''],
    ['RISK ASSESSMENT', ''],
    ['Downside Risk', formatCurrency(baseProfit - pessimisticProfit)],
    ['Upside Potential', formatCurrency(optimisticProfit - baseProfit)],
    ['Break-Even ARV', formatCurrency(breakEvenARV)],
  ];

  const scenarioSheet = XLSX.utils.aoa_to_sheet(scenarioData);
  setColumnWidths(scenarioSheet, [20, 18, 18, 15, 20]);
  XLSX.utils.book_append_sheet(workbook, scenarioSheet, 'Scenarios');

  // ===== SHEET 9: EXIT STRATEGIES =====
  const brrrrRefinanceAmount = inputs.arv * 0.75;
  const brrrrCashLeftInDeal = results.totalCashNeeded - (brrrrRefinanceAmount - results.totalLoanAmount);
  const wholesaleAssignmentFee = inputs.arv * 0.70 - inputs.purchasePrice - results.totalRehabCost;

  const exitData = [
    ['EXIT STRATEGY COMPARISON'],
    [''],
    ['STRATEGY', 'POTENTIAL RETURN', 'TIMELINE', 'CAPITAL REQUIRED', 'BEST FOR'],
    ['Fix & Flip', formatCurrency(results.netProfit), `${inputs.holdingPeriodMonths} months`, formatCurrency(results.totalCashNeeded), 'Quick profit, active investors'],
    ['BRRRR', `Cash left: ${formatCurrency(Math.max(0, brrrrCashLeftInDeal))}`, '6-12 months', formatCurrency(results.totalCashNeeded), 'Long-term wealth, rental income'],
    ['Wholesale', formatCurrency(Math.max(0, wholesaleAssignmentFee)), '30-60 days', 'Minimal (EMD only)', 'No capital, quick turnaround'],
    [''],
    [''],
    ['FIX & FLIP DETAILS', ''],
    ['Net Profit', formatCurrency(results.netProfit)],
    ['ROI', formatPercent(results.roi)],
    ['Holding Period', `${inputs.holdingPeriodMonths} months`],
    [''],
    ['BRRRR ESTIMATE (75% LTV Refinance)', ''],
    ['Refinance Amount', formatCurrency(brrrrRefinanceAmount)],
    ['Cash Returned', formatCurrency(brrrrRefinanceAmount - results.totalLoanAmount)],
    ['Cash Left in Deal', formatCurrency(Math.max(0, brrrrCashLeftInDeal))],
    [''],
    ['WHOLESALE ESTIMATE', ''],
    ['Contract Price', formatCurrency(inputs.purchasePrice)],
    ['Est. Assignment Fee (70% ARV)', formatCurrency(Math.max(0, wholesaleAssignmentFee))],
    ['End Buyer Price', formatCurrency(inputs.purchasePrice + Math.max(0, wholesaleAssignmentFee))],
  ];

  // Add BRRRR data if provided
  if (strategy === 'brrrr' && brrrrData) {
    exitData.push(
      [''],
      ['BRRRR RENTAL ANALYSIS', ''],
      ['Monthly Rent', formatCurrency(brrrrData.monthlyRent)],
      ['Monthly Expenses', formatCurrency(brrrrData.monthlyExpenses)],
      ['Monthly Cash Flow', formatCurrency(brrrrData.monthlyRent - brrrrData.monthlyExpenses)],
      ['Annual Cash Flow', formatCurrency((brrrrData.monthlyRent - brrrrData.monthlyExpenses) * 12)],
      ['Refinance LTV', formatPercent(brrrrData.refinanceLTV)],
      ['Refinance Rate', formatPercent(brrrrData.refinanceRate)],
      ['Refinance Term', `${brrrrData.refinanceTerm} years`],
    );
  }

  // Add Wholesale data if provided
  if (strategy === 'wholesale' && wholesaleData) {
    exitData.push(
      [''],
      ['WHOLESALE DEAL DETAILS', ''],
      ['Assignment Fee', formatCurrency(wholesaleData.assignmentFee)],
      ['End Buyer Potential Profit', formatCurrency(wholesaleData.endBuyerProfit)],
    );
  }

  const exitSheet = XLSX.utils.aoa_to_sheet(exitData);
  setColumnWidths(exitSheet, [35, 20, 15, 20, 30]);
  XLSX.utils.book_append_sheet(workbook, exitSheet, 'Exit Strategies');

  // ===== SHEET 10: RAW DATA (for charts) =====
  const chartData = [
    ['COST BREAKDOWN DATA (for charts)'],
    [''],
    ['Category', 'Amount', 'Percentage'],
    ['Purchase Price', inputs.purchasePrice, (inputs.purchasePrice / results.totalProjectCost * 100).toFixed(1) + '%'],
    ['Closing Costs', results.purchaseClosingCosts, (results.purchaseClosingCosts / results.totalProjectCost * 100).toFixed(1) + '%'],
    ['Rehab Costs', results.totalRehabCost, (results.totalRehabCost / results.totalProjectCost * 100).toFixed(1) + '%'],
    ['Financing Costs', results.totalFinancingCosts, (results.totalFinancingCosts / results.totalProjectCost * 100).toFixed(1) + '%'],
    ['Holding Costs', results.totalHoldingCosts, (results.totalHoldingCosts / results.totalProjectCost * 100).toFixed(1) + '%'],
    ['Selling Costs', results.totalSellingCosts, (results.totalSellingCosts / results.totalProjectCost * 100).toFixed(1) + '%'],
    [''],
    ['SCENARIO DATA', ''],
    ['Scenario', 'Profit'],
    ['Pessimistic', pessimisticProfit],
    ['Base Case', baseProfit],
    ['Optimistic', optimisticProfit],
  ];

  const chartSheet = XLSX.utils.aoa_to_sheet(chartData);
  setColumnWidths(chartSheet, [25, 15, 15]);
  XLSX.utils.book_append_sheet(workbook, chartSheet, 'Chart Data');

  // Generate filename
  const address = inputs.address || 'Property';
  const sanitizedAddress = address.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const filename = `CCRE_Analysis_${sanitizedAddress}_${new Date().toISOString().split('T')[0]}.xlsx`;

  // Download
  XLSX.writeFile(workbook, filename);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function getLoanTypeName(loanType: string): string {
  switch (loanType) {
    case 'cash': return 'Cash Purchase';
    case 'hard_money': return 'Hard Money Loan';
    case 'conventional': return 'Conventional Loan';
    case 'private_money': return 'Private Money';
    default: return loanType;
  }
}

function setColumnWidths(sheet: XLSX.WorkSheet, widths: number[]) {
  sheet['!cols'] = widths.map(w => ({ wch: w }));
}

function applyHeaderStyle(sheet: XLSX.WorkSheet, row: number) {
  // Note: xlsx-js-style would be needed for full styling
  // This function is a placeholder for future styling enhancements
}
