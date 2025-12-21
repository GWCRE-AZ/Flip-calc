import { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';
import { CalculatorInputs, CalculatorResults } from '@/lib/calculator';

interface ExitStrategiesTabProps {
  inputs: CalculatorInputs;
  results: CalculatorResults;
}

type RefinanceLoanType = '15_year' | '30_year' | 'dscr';
type DealType = 'assignment' | 'double_close';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number) => {
  return value.toFixed(1) + '%';
};

export function ExitStrategiesTab({ inputs, results }: ExitStrategiesTabProps) {
  const [activeStrategy, setActiveStrategy] = useState('overview');
  
  // BRRRR STATE
  const [refinanceLoanType, setRefinanceLoanType] = useState<RefinanceLoanType>('30_year');
  const [refinanceLTV, setRefinanceLTV] = useState(75);
  const [refinanceRate, setRefinanceRate] = useState(7);
  const [monthlyRent, setMonthlyRent] = useState(2000);
  const [showRefinanceCosts, setShowRefinanceCosts] = useState(false);
  const [refinanceCosts, setRefinanceCosts] = useState({
    loanPoints: 1, appraisalFee: 500, titleInsurance: 1500,
    recordingFees: 250, attorneyFees: 750, otherCosts: 500
  });
  const [maintenancePercent, setMaintenancePercent] = useState(5);
  const [managementPercent, setManagementPercent] = useState(10);
  const [capExPercent, setCapExPercent] = useState(5);
  const [vacancyRate, setVacancyRate] = useState(8);
  const [additionalDownPayment, setAdditionalDownPayment] = useState(0);
  const [hasPMI, setHasPMI] = useState(false);
  const [pmiRate, setPmiRate] = useState(0.5);
  const [dscrRate, setDscrRate] = useState(8);
  const [targetDSCR, setTargetDSCR] = useState(1.25);
  const [showLTVNotice, setShowLTVNotice] = useState(false);
  
  // WHOLESALE STATE
  const [dealType, setDealType] = useState<DealType>('assignment');
  const [assignmentFee, setAssignmentFee] = useState(10000);
  const [earnestMoneyDeposit, setEarnestMoneyDeposit] = useState(1000);
  const [marketingCosts, setMarketingCosts] = useState(500);
  const [showWholesaleCosts, setShowWholesaleCosts] = useState(false);
  const [wholesaleCosts, setWholesaleCosts] = useState({
    titleEscrowFees: 1500, recordingFees: 250, attorneyFees: 500, otherCosts: 250
  });
  const [endBuyerRehab, setEndBuyerRehab] = useState(inputs.rehabCostSimple);
  
  // Sync endBuyerRehab when inputs change
  useEffect(() => {
    setEndBuyerRehab(inputs.rehabCostSimple);
  }, [inputs.rehabCostSimple]);
  
  // FIX & FLIP CALCULATIONS
  const flipAnalysis = useMemo(() => ({
    netProfit: results.netProfit,
    roi: results.roi,
    cashOnCash: results.cashOnCash,
    timeframe: inputs.holdingPeriodMonths,
    cashNeeded: results.totalCashNeeded,
    totalProjectCost: results.totalProjectCost
  }), [results, inputs]);
  
  // Check if LTV notice should be shown (when LTV > 75% with DSCR loan)
  const shouldShowLTVNotice = refinanceLoanType === 'dscr' && refinanceLTV > 75;
  
  // Handle LTV change with notice trigger
  const handleLTVChange = (newLTV: number) => {
    setRefinanceLTV(newLTV);
    if (refinanceLoanType === 'dscr' && newLTV > 75) {
      setShowLTVNotice(true);
    }
  };
  
  // BRRRR CALCULATIONS
  const brrrrAnalysis = useMemo(() => {
    const arv = inputs.arv;
    const maxLoanAmount = arv * (refinanceLTV / 100);
    const totalRefinanceCosts = showRefinanceCosts ? (
      (maxLoanAmount * refinanceCosts.loanPoints / 100) + refinanceCosts.appraisalFee +
      refinanceCosts.titleInsurance + refinanceCosts.recordingFees +
      refinanceCosts.attorneyFees + refinanceCosts.otherCosts
    ) : (arv * 0.02);
    const cashOut = maxLoanAmount - totalRefinanceCosts;
    
    // Calculate BRRRR cost basis (excludes selling costs since we're keeping the property)
    // Cost basis = Purchase + Closing + Rehab + Financing + Holding (NO selling costs)
    const brrrrCostBasis = results.totalProjectCost - results.totalSellingCosts;
    let cashLeftInDeal = brrrrCostBasis - cashOut;
    const needsAdditionalDownPayment = cashLeftInDeal > 0;
    if (cashLeftInDeal > 0 && additionalDownPayment > 0) {
      cashLeftInDeal = Math.max(0, cashLeftInDeal - additionalDownPayment);
    }
    const loanTermMonths = refinanceLoanType === '15_year' ? 180 : 360;
    const rate = refinanceLoanType === 'dscr' ? dscrRate : refinanceRate;
    const monthlyRate = rate / 100 / 12;
    const monthlyPI = maxLoanAmount * (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) / 
                      (Math.pow(1 + monthlyRate, loanTermMonths) - 1);
    const monthlyPMI = hasPMI && refinanceLTV > 80 ? (maxLoanAmount * pmiRate / 100 / 12) : 0;
    const maintenanceCost = monthlyRent * maintenancePercent / 100;
    const managementCost = monthlyRent * managementPercent / 100;
    const capExCost = monthlyRent * capExPercent / 100;
    const vacancyLoss = monthlyRent * vacancyRate / 100;
    const totalOperatingExpenses = inputs.monthlyPropertyTaxes + inputs.monthlyInsurance +
      inputs.monthlyHOA + maintenanceCost + managementCost + capExCost;
    const effectiveGrossIncome = monthlyRent - vacancyLoss;
    const noi = effectiveGrossIncome - totalOperatingExpenses;
    const totalDebtService = monthlyPI + monthlyPMI;
    const monthlyCashFlow = noi - totalDebtService;
    const annualCashFlow = monthlyCashFlow * 12;
    const actualCashInDeal = Math.max(cashLeftInDeal, 1);
    const cashOnCash = (annualCashFlow / actualCashInDeal) * 100;
    const equityPosition = arv - maxLoanAmount;
    const dscr = noi / totalDebtService;
    let dscrStatus: 'excellent' | 'good' | 'marginal' | 'poor';
    if (dscr >= 1.25) dscrStatus = 'excellent';
    else if (dscr >= 1.0) dscrStatus = 'good';
    else if (dscr >= 0.75) dscrStatus = 'marginal';
    else dscrStatus = 'poor';
    
    // Calculate required down payment based on DSCR
    let recommendedDownPayment = 20; // Default 20%
    if (refinanceLoanType === 'dscr') {
      if (dscr >= 1.25) recommendedDownPayment = 20;
      else if (dscr >= 1.0) recommendedDownPayment = 25;
      else if (dscr >= 0.75) recommendedDownPayment = 30;
      else recommendedDownPayment = 35;
    }
    
    return {
      maxLoanAmount, totalRefinanceCosts, cashOut, cashLeftInDeal: Math.max(0, cashLeftInDeal),
      needsAdditionalDownPayment, monthlyPI, monthlyPMI, totalDebtService, totalOperatingExpenses,
      effectiveGrossIncome, noi, monthlyCashFlow, annualCashFlow, cashOnCash, equityPosition,
      dscr, dscrStatus, vacancyLoss, maintenanceCost, managementCost, capExCost, recommendedDownPayment
    };
  }, [inputs, results, refinanceLTV, refinanceRate, monthlyRent, refinanceCosts, maintenancePercent,
      managementPercent, capExPercent, vacancyRate, showRefinanceCosts, additionalDownPayment,
      refinanceLoanType, hasPMI, pmiRate, dscrRate]);
  
  // WHOLESALE CALCULATIONS
  const wholesaleAnalysis = useMemo(() => {
    const contractPrice = inputs.purchasePrice;
    const endBuyerPrice = contractPrice + assignmentFee;
    
    // Calculate costs based on deal type
    // For assignments: EMD is returned at closing, only marketing is a true cost
    // For double close: All costs are incurred
    let totalWholesalerCosts = marketingCosts; // Marketing is always a cost
    
    if (dealType === 'double_close') {
      // Double close: EMD + closing costs + transactional funding costs
      totalWholesalerCosts += earnestMoneyDeposit + wholesaleCosts.titleEscrowFees + 
        wholesaleCosts.recordingFees + wholesaleCosts.attorneyFees + 
        wholesaleCosts.otherCosts + (contractPrice * 0.02); // 2% transactional funding
    }
    // For assignment deals, EMD is returned at closing so it's not a cost
    
    const netProfit = assignmentFee - totalWholesalerCosts;
    const cashInvested = dealType === 'assignment' ? earnestMoneyDeposit + marketingCosts : totalWholesalerCosts;
    const roi = (netProfit / cashInvested) * 100;
    const endBuyerClosingCosts = endBuyerPrice * 0.03;
    const endBuyerAllIn = endBuyerPrice + endBuyerClosingCosts + endBuyerRehab + (endBuyerPrice * 0.01 * 6);
    const endBuyerSellingCosts = inputs.arv * 0.08;
    const endBuyerProfit = inputs.arv - endBuyerAllIn - endBuyerSellingCosts;
    const maxAllowableOffer = (inputs.arv * 0.70) - endBuyerRehab;
    const meetsRule = endBuyerPrice <= maxAllowableOffer;
    let viability: 'excellent' | 'good' | 'marginal' | 'poor';
    if (netProfit >= 15000 && roi >= 200) viability = 'excellent';
    else if (netProfit >= 10000 && roi >= 100) viability = 'good';
    else if (netProfit >= 5000 && roi >= 50) viability = 'marginal';
    else viability = 'poor';
    return {
      contractPrice, endBuyerPrice, assignmentFee, totalWholesalerCosts, netProfit,
      cashInvested, roi, viability, endBuyerClosingCosts, endBuyerAllIn, endBuyerSellingCosts,
      endBuyerProfit, maxAllowableOffer, meetsRule
    };
  }, [inputs, assignmentFee, earnestMoneyDeposit, marketingCosts, dealType, wholesaleCosts, endBuyerRehab]);
  
  const bestMetrics = useMemo(() => {
    const profits = [
      { strategy: 'flip', value: flipAnalysis.netProfit },
      { strategy: 'brrrr', value: brrrrAnalysis.annualCashFlow * 5 + brrrrAnalysis.equityPosition },
      { strategy: 'wholesale', value: wholesaleAnalysis.netProfit }
    ];
    const cashNeeded = [
      { strategy: 'flip', value: flipAnalysis.cashNeeded },
      { strategy: 'brrrr', value: results.totalCashNeeded },
      { strategy: 'wholesale', value: wholesaleAnalysis.cashInvested }
    ];
    return {
      bestProfit: profits.reduce((a, b) => a.value > b.value ? a : b).strategy,
      lowestCash: cashNeeded.reduce((a, b) => a.value < b.value ? a : b).strategy
    };
  }, [flipAnalysis, brrrrAnalysis, wholesaleAnalysis, results]);

  return (
    <div className="space-y-6">
      {/* LTV Notice Modal */}
      {showLTVNotice && shouldShowLTVNotice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg mx-4 overflow-hidden">
            <div className="bg-amber-500 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">DSCR Loan Down Payment Notice</span>
              </div>
              <button onClick={() => setShowLTVNotice(false)} className="hover:bg-amber-600 rounded p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong>Important:</strong> You have selected an LTV of {refinanceLTV}%, which exceeds the standard 75% threshold for DSCR loans.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
                <h4 className="font-semibold text-amber-800 mb-2">Industry Standard DSCR Loan Requirements:</h4>
                <ul className="space-y-2 text-amber-700">
                  <li className="flex items-start gap-2">
                    <span className="font-medium">•</span>
                    <span><strong>Standard LTV:</strong> Most DSCR lenders cap at 75-80% LTV, requiring 20-25% down payment regardless of DSCR ratio.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">•</span>
                    <span><strong>DSCR ≥ 1.25:</strong> May qualify for 80% LTV (20% down) with excellent terms.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">•</span>
                    <span><strong>DSCR 1.0-1.24:</strong> Typically requires 75% LTV (25% down) with slightly higher rates.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">•</span>
                    <span><strong>DSCR 0.75-0.99:</strong> May require 70% LTV (30% down) with premium pricing.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">•</span>
                    <span><strong>DSCR &lt; 0.75:</strong> Most lenders require 65% LTV (35%+ down) or may decline.</span>
                  </li>
                </ul>
              </div>
              <p className="text-xs text-gray-500">
                Note: Requirements vary by lender. Some lenders offer up to 85% LTV for exceptional borrowers with strong DSCR ratios, reserves, and credit profiles. Always verify with your specific lender.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => {
                  setRefinanceLTV(75);
                  setShowLTVNotice(false);
                }}>
                  Set to 75% LTV
                </Button>
                <Button onClick={() => setShowLTVNotice(false)}>
                  Keep Current LTV
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeStrategy} onValueChange={setActiveStrategy} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="flip" className="text-xs">Fix & Flip</TabsTrigger>
          <TabsTrigger value="brrrr" className="text-xs">BRRRR</TabsTrigger>
          <TabsTrigger value="wholesale" className="text-xs">Wholesale</TabsTrigger>
        </TabsList>
        
        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-slate-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveStrategy('flip')}>
              <div className="bg-[#2B3E50] text-white px-4 py-3">
                <span className="font-medium text-sm">Fix & Flip</span>
              </div>
              <div className="p-4 space-y-3">
                <div><div className="text-xs text-muted-foreground">Net Profit</div>
                  <div className={`text-lg font-bold ${flipAnalysis.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(flipAnalysis.netProfit)}
                    {bestMetrics.bestProfit === 'flip' && <span className="text-xs text-amber-500 ml-1">Best</span>}
                  </div></div>
                <div><div className="text-xs text-muted-foreground">Cash Needed</div>
                  <div className="text-lg font-bold text-[#2B3E50] flex items-center gap-1">
                    {formatCurrency(flipAnalysis.cashNeeded)}
                    {bestMetrics.lowestCash === 'flip' && <span className="text-xs text-amber-500">★</span>}
                  </div></div>
                <div><div className="text-xs text-muted-foreground">Timeframe</div>
                  <div className="text-lg font-bold text-[#2B3E50]">{flipAnalysis.timeframe} mo</div></div>
                <div><div className="text-xs text-muted-foreground">Cash-on-Cash</div>
                  <div className="text-lg font-bold text-[#C87533]">{formatPercent(flipAnalysis.cashOnCash)}</div></div>
              </div>
            </div>
            <div className="border border-slate-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveStrategy('brrrr')}>
              <div className="bg-[#C87533] text-white px-4 py-3">
                <span className="font-medium text-sm">BRRRR</span>
              </div>
              <div className="p-4 space-y-3">
                <div><div className="text-xs text-muted-foreground">Annual Cash Flow</div>
                  <div className={`text-lg font-bold ${brrrrAnalysis.annualCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(brrrrAnalysis.annualCashFlow)}</div></div>
                <div><div className="text-xs text-muted-foreground">Cash Left in Deal</div>
                  <div className="text-lg font-bold text-[#2B3E50]">{formatCurrency(brrrrAnalysis.cashLeftInDeal)}</div></div>
                <div><div className="text-xs text-muted-foreground">Equity Position</div>
                  <div className="text-lg font-bold text-[#2B3E50]">{formatCurrency(brrrrAnalysis.equityPosition)}</div></div>
                <div><div className="text-xs text-muted-foreground">Cash-on-Cash</div>
                  <div className="text-lg font-bold text-[#C87533]">{brrrrAnalysis.cashOnCash === Infinity ? '∞' : formatPercent(brrrrAnalysis.cashOnCash)}</div></div>
              </div>
            </div>
            <div className="border border-slate-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveStrategy('wholesale')}>
              <div className="bg-emerald-600 text-white px-4 py-3">
                <span className="font-medium text-sm">Wholesale</span>
              </div>
              <div className="p-4 space-y-3">
                <div><div className="text-xs text-muted-foreground">Net Profit</div>
                  <div className={`text-lg font-bold ${wholesaleAnalysis.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(wholesaleAnalysis.netProfit)}</div></div>
                <div><div className="text-xs text-muted-foreground">Cash Needed</div>
                  <div className="text-lg font-bold text-[#2B3E50] flex items-center gap-1">
                    {formatCurrency(wholesaleAnalysis.cashInvested)}
                    {bestMetrics.lowestCash === 'wholesale' && <span className="text-xs text-amber-500">★</span>}
                  </div></div>
                <div><div className="text-xs text-muted-foreground">Timeframe</div>
                  <div className="text-lg font-bold text-[#2B3E50]">1 mo</div></div>
                <div><div className="text-xs text-muted-foreground">ROI</div>
                  <div className="text-lg font-bold text-[#C87533]">{formatPercent(wholesaleAnalysis.roi)}</div></div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 text-white rounded-lg p-4">
            <h4 className="font-medium text-sm mb-3 uppercase tracking-wide">Strategy Recommendation</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-slate-700 rounded-lg">
                <div className="text-slate-400 text-xs mb-1">Best for Quick Cash</div>
                <div className="font-bold text-emerald-400">Wholesale</div>
                <div className="text-xs text-slate-400 mt-1">~1 month, minimal capital</div>
              </div>
              <div className="text-center p-3 bg-slate-700 rounded-lg">
                <div className="text-slate-400 text-xs mb-1">Best for Max Profit</div>
                <div className="font-bold text-blue-400">Fix & Flip</div>
                <div className="text-xs text-slate-400 mt-1">{formatCurrency(flipAnalysis.netProfit)} potential</div>
              </div>
              <div className="text-center p-3 bg-slate-700 rounded-lg">
                <div className="text-slate-400 text-xs mb-1">Best for Long-Term</div>
                <div className="font-bold text-[#C87533]">BRRRR</div>
                <div className="text-xs text-slate-400 mt-1">{formatCurrency(brrrrAnalysis.monthlyCashFlow)}/mo cash flow</div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* FIX & FLIP TAB */}
        <TabsContent value="flip" className="space-y-4">
          <div className="inst-card">
            <div className="inst-header">Fix & Flip Analysis</div>
            <div className="p-6 space-y-6">
              <p className="text-sm text-muted-foreground">Traditional fix and flip strategy - buy, renovate, and sell for profit.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-muted-foreground">Net Profit</div>
                  <div className={`text-xl font-bold ${flipAnalysis.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(flipAnalysis.netProfit)}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-muted-foreground">ROI</div>
                  <div className="text-xl font-bold text-[#2B3E50]">{formatPercent(flipAnalysis.roi)}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-muted-foreground">Cash-on-Cash</div>
                  <div className="text-xl font-bold text-[#C87533]">{formatPercent(flipAnalysis.cashOnCash)}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-muted-foreground">Cash Needed</div>
                  <div className="text-xl font-bold text-[#2B3E50]">{formatCurrency(flipAnalysis.cashNeeded)}</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-3">Cost Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Purchase Price</span><span>{formatCurrency(inputs.purchasePrice)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Purchase Closing Costs</span><span>{formatCurrency(results.purchaseClosingCosts)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Rehab Costs</span><span>{formatCurrency(results.totalRehabCost)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Financing Costs</span><span>{formatCurrency(results.totalFinancingCosts)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Holding Costs</span><span>{formatCurrency(results.totalHoldingCosts)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Selling Costs</span><span>{formatCurrency(results.totalSellingCosts)}</span></div>
                  <div className="border-t pt-2 flex justify-between font-medium"><span>Total Project Cost</span><span>{formatCurrency(flipAnalysis.totalProjectCost)}</span></div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <Info className="h-4 w-4 inline mr-2" />Adjust the main calculator inputs on the left to update this analysis.
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* BRRRR TAB */}
        <TabsContent value="brrrr" className="space-y-4">
          <div className="inst-card">
            <div className="inst-header">BRRRR Strategy Analysis</div>
            <div className="p-6 space-y-6">
              <p className="text-sm text-muted-foreground">Buy, Rehab, Rent, Refinance, Repeat - Analyze the complete BRRRR lifecycle.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-muted-foreground">Monthly Cash Flow</div>
                  <div className={`text-xl font-bold ${brrrrAnalysis.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(brrrrAnalysis.monthlyCashFlow)}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-muted-foreground">Cash Left in Deal</div>
                  <div className="text-xl font-bold text-[#2B3E50]">{formatCurrency(brrrrAnalysis.cashLeftInDeal)}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-muted-foreground">Equity Position</div>
                  <div className="text-xl font-bold text-[#2B3E50]">{formatCurrency(brrrrAnalysis.equityPosition)}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-muted-foreground">Cash-on-Cash</div>
                  <div className="text-xl font-bold text-[#C87533]">{brrrrAnalysis.cashOnCash === Infinity ? '∞' : formatPercent(brrrrAnalysis.cashOnCash)}</div>
                </div>
              </div>
              {brrrrAnalysis.needsAdditionalDownPayment && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-amber-800">Insufficient Equity for Full Cash-Out</div>
                      <p className="text-sm text-amber-700 mt-1">You'll have {formatCurrency(brrrrAnalysis.cashLeftInDeal)} left in the deal after refinance.</p>
                      <div className="mt-3">
                        <Label className="text-xs text-amber-700">Additional Down Payment</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-amber-700">$</span>
                          <Input type="number" value={additionalDownPayment} onChange={(e) => setAdditionalDownPayment(Number(e.target.value) || 0)} className="h-8 w-40 bg-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-4">Refinance Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Loan Type</Label>
                    <Select value={refinanceLoanType} onValueChange={(v) => setRefinanceLoanType(v as RefinanceLoanType)}>
                      <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15_year">15-Year Fixed</SelectItem>
                        <SelectItem value="30_year">30-Year Fixed</SelectItem>
                        <SelectItem value="dscr">DSCR Loan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Refinance LTV (%)</Label>
                    <Input type="number" value={refinanceLTV} onChange={(e) => handleLTVChange(Number(e.target.value) || 0)} className="h-9 mt-1" />
                    {refinanceLoanType === 'dscr' && refinanceLTV > 80 && (
                      <div className="text-xs text-amber-600 mt-1">⚠️ Above typical max</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Interest Rate (%)</Label>
                    <Input type="number" value={refinanceLoanType === 'dscr' ? dscrRate : refinanceRate}
                      onChange={(e) => refinanceLoanType === 'dscr' ? setDscrRate(Number(e.target.value) || 0) : setRefinanceRate(Number(e.target.value) || 0)} className="h-9 mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Monthly Rent</Label>
                    <div className="flex items-center gap-1 mt-1"><span className="text-muted-foreground text-sm">$</span>
                      <Input type="number" value={monthlyRent} onChange={(e) => setMonthlyRent(Number(e.target.value) || 0)} className="h-9" />
                    </div>
                  </div>
                </div>
                
                {/* DSCR Ratio Input - Only shown when DSCR loan is selected */}
                {refinanceLoanType === 'dscr' && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Target DSCR Ratio</Label>
                        <Input type="number" value={targetDSCR} onChange={(e) => setTargetDSCR(Number(e.target.value) || 1.0)} className="h-9 mt-1" step="0.05" min="0.5" max="2.0" />
                        <div className="text-xs text-muted-foreground mt-1">Lender minimum: typically 1.0-1.25</div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Calculated DSCR</Label>
                        <div className={`h-9 mt-1 flex items-center font-bold text-lg ${brrrrAnalysis.dscrStatus === 'excellent' ? 'text-green-600' : brrrrAnalysis.dscrStatus === 'good' ? 'text-blue-600' : brrrrAnalysis.dscrStatus === 'marginal' ? 'text-amber-600' : 'text-red-600'}`}>
                          {brrrrAnalysis.dscr.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Recommended Down Payment</Label>
                        <div className="h-9 mt-1 flex items-center font-bold text-lg text-[#2B3E50]">
                          {brrrrAnalysis.recommendedDownPayment}%
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Based on DSCR ratio</div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mt-4">
                  <Switch checked={hasPMI} onCheckedChange={setHasPMI} />
                  <Label className="text-sm">Include PMI/Mortgage Insurance</Label>
                  {hasPMI && (<div className="flex items-center gap-1 ml-4">
                    <Input type="number" value={pmiRate} onChange={(e) => setPmiRate(Number(e.target.value) || 0)} className="h-7 w-16 text-xs" step="0.1" />
                    <span className="text-xs text-muted-foreground">% annual</span>
                  </div>)}
                </div>
                <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={() => setShowRefinanceCosts(!showRefinanceCosts)} className="text-xs">
                    {showRefinanceCosts ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}Itemize Refinance Costs
                  </Button>
                  <span className="text-xs text-muted-foreground ml-2">Total: {formatCurrency(brrrrAnalysis.totalRefinanceCosts)}</span>
                </div>
                {showRefinanceCosts && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-3 p-3 bg-slate-50 rounded-lg">
                    <div><Label className="text-xs">Loan Points (%)</Label><Input type="number" value={refinanceCosts.loanPoints} onChange={(e) => setRefinanceCosts({...refinanceCosts, loanPoints: Number(e.target.value) || 0})} className="h-8 mt-1" step="0.25" /></div>
                    <div><Label className="text-xs">Appraisal Fee</Label><Input type="number" value={refinanceCosts.appraisalFee} onChange={(e) => setRefinanceCosts({...refinanceCosts, appraisalFee: Number(e.target.value) || 0})} className="h-8 mt-1" /></div>
                    <div><Label className="text-xs">Title Insurance</Label><Input type="number" value={refinanceCosts.titleInsurance} onChange={(e) => setRefinanceCosts({...refinanceCosts, titleInsurance: Number(e.target.value) || 0})} className="h-8 mt-1" /></div>
                    <div><Label className="text-xs">Recording Fees</Label><Input type="number" value={refinanceCosts.recordingFees} onChange={(e) => setRefinanceCosts({...refinanceCosts, recordingFees: Number(e.target.value) || 0})} className="h-8 mt-1" /></div>
                    <div><Label className="text-xs">Attorney Fees</Label><Input type="number" value={refinanceCosts.attorneyFees} onChange={(e) => setRefinanceCosts({...refinanceCosts, attorneyFees: Number(e.target.value) || 0})} className="h-8 mt-1" /></div>
                    <div><Label className="text-xs">Other Costs</Label><Input type="number" value={refinanceCosts.otherCosts} onChange={(e) => setRefinanceCosts({...refinanceCosts, otherCosts: Number(e.target.value) || 0})} className="h-8 mt-1" /></div>
                  </div>
                )}
              </div>
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-4">Operating Expenses (Monthly)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div><Label className="text-xs text-muted-foreground">Vacancy Rate (%)</Label><Input type="number" value={vacancyRate} onChange={(e) => setVacancyRate(Number(e.target.value) || 0)} className="h-9 mt-1" /><div className="text-xs text-muted-foreground mt-1">= {formatCurrency(brrrrAnalysis.vacancyLoss)}/mo</div></div>
                  <div><Label className="text-xs text-muted-foreground">Maintenance (%)</Label><Input type="number" value={maintenancePercent} onChange={(e) => setMaintenancePercent(Number(e.target.value) || 0)} className="h-9 mt-1" /><div className="text-xs text-muted-foreground mt-1">= {formatCurrency(brrrrAnalysis.maintenanceCost)}/mo</div></div>
                  <div><Label className="text-xs text-muted-foreground">Property Mgmt (%)</Label><Input type="number" value={managementPercent} onChange={(e) => setManagementPercent(Number(e.target.value) || 0)} className="h-9 mt-1" /><div className="text-xs text-muted-foreground mt-1">= {formatCurrency(brrrrAnalysis.managementCost)}/mo</div></div>
                  <div><Label className="text-xs text-muted-foreground">CapEx Reserve (%)</Label><Input type="number" value={capExPercent} onChange={(e) => setCapExPercent(Number(e.target.value) || 0)} className="h-9 mt-1" /><div className="text-xs text-muted-foreground mt-1">= {formatCurrency(brrrrAnalysis.capExCost)}/mo</div></div>
                </div>
              </div>
              {refinanceLoanType === 'dscr' && (
                <div className={`rounded-lg p-4 ${brrrrAnalysis.dscrStatus === 'excellent' ? 'bg-green-50 border-green-200' : brrrrAnalysis.dscrStatus === 'good' ? 'bg-blue-50 border-blue-200' : brrrrAnalysis.dscrStatus === 'marginal' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'} border`}>
                  <div className="flex items-center gap-2">

                    <div>
                      <div className="font-medium">DSCR: {brrrrAnalysis.dscr.toFixed(2)} | Recommended LTV: {100 - brrrrAnalysis.recommendedDownPayment}% ({brrrrAnalysis.recommendedDownPayment}% down)</div>
                      <div className="text-sm text-muted-foreground">
                        {brrrrAnalysis.dscrStatus === 'excellent' && 'Excellent - Should qualify easily with 20% down and standard terms'}
                        {brrrrAnalysis.dscrStatus === 'good' && 'Good - Should qualify with 25% down, may have slightly higher rate'}
                        {brrrrAnalysis.dscrStatus === 'marginal' && 'Marginal - May qualify with 30% down and premium pricing'}
                        {brrrrAnalysis.dscrStatus === 'poor' && 'Poor - May need 35%+ down or may not qualify for DSCR loan'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-3">Monthly Cash Flow Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Gross Rent</span><span>{formatCurrency(monthlyRent)}</span></div>
                  <div className="flex justify-between text-red-600"><span>- Vacancy ({vacancyRate}%)</span><span>-{formatCurrency(brrrrAnalysis.vacancyLoss)}</span></div>
                  <div className="flex justify-between font-medium border-t pt-2"><span>Effective Gross Income</span><span>{formatCurrency(brrrrAnalysis.effectiveGrossIncome)}</span></div>
                  <div className="flex justify-between text-red-600"><span>- Operating Expenses</span><span>-{formatCurrency(brrrrAnalysis.totalOperatingExpenses)}</span></div>
                  <div className="flex justify-between font-medium border-t pt-2"><span>Net Operating Income (NOI)</span><span>{formatCurrency(brrrrAnalysis.noi)}</span></div>
                  <div className="flex justify-between text-red-600"><span>- Debt Service (P&I + PMI)</span><span>-{formatCurrency(brrrrAnalysis.totalDebtService)}</span></div>
                  <div className={`flex justify-between font-bold border-t pt-2 ${brrrrAnalysis.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}><span>Monthly Cash Flow</span><span>{formatCurrency(brrrrAnalysis.monthlyCashFlow)}</span></div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* WHOLESALE TAB */}
        <TabsContent value="wholesale" className="space-y-4">
          <div className="inst-card">
            <div className="inst-header">Wholesale Strategy Analysis</div>
            <div className="p-6 space-y-6">
              <p className="text-sm text-muted-foreground">Analyze wholesale deals from both the wholesaler's and end buyer's perspective.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-muted-foreground">Net Profit</div>
                  <div className={`text-xl font-bold ${wholesaleAnalysis.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(wholesaleAnalysis.netProfit)}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-muted-foreground">Cash Invested</div>
                  <div className="text-xl font-bold text-[#2B3E50]">{formatCurrency(wholesaleAnalysis.cashInvested)}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-muted-foreground">ROI</div>
                  <div className="text-xl font-bold text-[#C87533]">{formatPercent(wholesaleAnalysis.roi)}</div>
                </div>
                <div className={`rounded-lg p-4 text-center ${wholesaleAnalysis.viability === 'excellent' ? 'bg-green-50' : wholesaleAnalysis.viability === 'good' ? 'bg-blue-50' : wholesaleAnalysis.viability === 'marginal' ? 'bg-amber-50' : 'bg-red-50'}`}>
                  <div className="text-xs text-muted-foreground">Deal Rating</div>
                  <div className={`text-xl font-bold capitalize ${wholesaleAnalysis.viability === 'excellent' ? 'text-green-600' : wholesaleAnalysis.viability === 'good' ? 'text-blue-600' : wholesaleAnalysis.viability === 'marginal' ? 'text-amber-600' : 'text-red-600'}`}>{wholesaleAnalysis.viability}</div>
                </div>
              </div>
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-4">Deal Setup</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div><Label className="text-xs text-muted-foreground">Deal Type</Label>
                    <Select value={dealType} onValueChange={(v) => setDealType(v as DealType)}>
                      <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="assignment">Assignment</SelectItem><SelectItem value="double_close">Double Close</SelectItem></SelectContent>
                    </Select></div>
                  <div><Label className="text-xs text-muted-foreground">Assignment Fee</Label><div className="flex items-center gap-1 mt-1"><span className="text-muted-foreground text-sm">$</span><Input type="number" value={assignmentFee} onChange={(e) => setAssignmentFee(Number(e.target.value) || 0)} className="h-9" /></div></div>
                  <div><Label className="text-xs text-muted-foreground">Earnest Money</Label><div className="flex items-center gap-1 mt-1"><span className="text-muted-foreground text-sm">$</span><Input type="number" value={earnestMoneyDeposit} onChange={(e) => setEarnestMoneyDeposit(Number(e.target.value) || 0)} className="h-9" /></div></div>
                  <div><Label className="text-xs text-muted-foreground">Marketing Costs</Label><div className="flex items-center gap-1 mt-1"><span className="text-muted-foreground text-sm">$</span><Input type="number" value={marketingCosts} onChange={(e) => setMarketingCosts(Number(e.target.value) || 0)} className="h-9" /></div></div>
                </div>
                <div className={`mt-4 p-3 rounded-lg text-sm ${dealType === 'assignment' ? 'bg-blue-50 text-blue-800' : 'bg-amber-50 text-amber-800'}`}>
                  <Info className="h-4 w-4 inline mr-2" />
                  {dealType === 'assignment' ? 'Assignment: You assign your contract rights to the end buyer for a fee. Minimal closing costs, but your profit is visible to all parties.' : 'Double Close: You close on the property then immediately sell to the end buyer. Higher closing costs, but your profit remains private.'}
                </div>
                {dealType === 'double_close' && (
                  <div className="mt-4">
                    <Button variant="outline" size="sm" onClick={() => setShowWholesaleCosts(!showWholesaleCosts)} className="text-xs">
                      {showWholesaleCosts ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}Itemize Closing Costs
                    </Button>
                    {showWholesaleCosts && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-3 p-3 bg-slate-50 rounded-lg">
                        <div><Label className="text-xs">Title/Escrow Fees</Label><Input type="number" value={wholesaleCosts.titleEscrowFees} onChange={(e) => setWholesaleCosts({...wholesaleCosts, titleEscrowFees: Number(e.target.value) || 0})} className="h-8 mt-1" /></div>
                        <div><Label className="text-xs">Recording Fees</Label><Input type="number" value={wholesaleCosts.recordingFees} onChange={(e) => setWholesaleCosts({...wholesaleCosts, recordingFees: Number(e.target.value) || 0})} className="h-8 mt-1" /></div>
                        <div><Label className="text-xs">Attorney Fees</Label><Input type="number" value={wholesaleCosts.attorneyFees} onChange={(e) => setWholesaleCosts({...wholesaleCosts, attorneyFees: Number(e.target.value) || 0})} className="h-8 mt-1" /></div>
                        <div><Label className="text-xs">Other Costs</Label><Input type="number" value={wholesaleCosts.otherCosts} onChange={(e) => setWholesaleCosts({...wholesaleCosts, otherCosts: Number(e.target.value) || 0})} className="h-8 mt-1" /></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-4">End Buyer Analysis</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div><Label className="text-xs text-muted-foreground">End Buyer's Purchase Price</Label><div className="text-lg font-bold text-[#2B3E50]">{formatCurrency(wholesaleAnalysis.endBuyerPrice)}</div><div className="text-xs text-muted-foreground">Contract: {formatCurrency(wholesaleAnalysis.contractPrice)} + Fee: {formatCurrency(assignmentFee)}</div></div>
                  <div><Label className="text-xs text-muted-foreground">End Buyer's Expected Rehab</Label><div className="flex items-center gap-1 mt-1"><span className="text-muted-foreground text-sm">$</span><Input type="number" value={endBuyerRehab} onChange={(e) => setEndBuyerRehab(Number(e.target.value) || 0)} className="h-9" /></div></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-slate-50 rounded-lg">
                  <div className="text-center"><div className="text-xs text-muted-foreground">End Buyer's All-In</div><div className="font-bold">{formatCurrency(wholesaleAnalysis.endBuyerAllIn)}</div></div>
                  <div className="text-center"><div className="text-xs text-muted-foreground">End Buyer's Profit</div><div className={`font-bold ${wholesaleAnalysis.endBuyerProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(wholesaleAnalysis.endBuyerProfit)}</div></div>
                  <div className="text-center"><div className="text-xs text-muted-foreground">70% Rule MAO</div><div className="font-bold">{formatCurrency(wholesaleAnalysis.maxAllowableOffer)}</div></div>
                </div>
                <div className={`mt-3 p-3 rounded-lg text-sm ${wholesaleAnalysis.meetsRule ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {wholesaleAnalysis.meetsRule ? <>End buyer's price meets the 70% rule - attractive deal for investors</> : <>End buyer's price exceeds the 70% rule MAO - may be harder to sell</>}
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-3">Your Wholesale Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Contract Price (to Seller)</span><span>{formatCurrency(wholesaleAnalysis.contractPrice)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">+ Assignment Fee</span><span className="text-green-600">+{formatCurrency(assignmentFee)}</span></div>
                  <div className="flex justify-between font-medium border-t pt-2"><span>End Buyer Pays</span><span>{formatCurrency(wholesaleAnalysis.endBuyerPrice)}</span></div>
                  <div className="flex justify-between text-red-600"><span>- Your Costs (EMD + Marketing{dealType === 'double_close' ? ' + Closing' : ''})</span><span>-{formatCurrency(wholesaleAnalysis.totalWholesalerCosts - earnestMoneyDeposit)}</span></div>
                  <div className={`flex justify-between font-bold border-t pt-2 ${wholesaleAnalysis.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}><span>Your Net Profit</span><span>{formatCurrency(wholesaleAnalysis.netProfit)}</span></div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
