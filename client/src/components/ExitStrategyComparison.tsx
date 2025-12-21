import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalculatorInputs, CalculatorResults } from "@/lib/calculator";
import { Home, RefreshCw, Handshake, Trophy, TrendingUp, DollarSign, Clock, Percent } from "lucide-react";

interface ExitStrategyComparisonProps {
  inputs: CalculatorInputs;
  results: CalculatorResults;
}

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

export function ExitStrategyComparison({ inputs, results }: ExitStrategyComparisonProps) {
  // BRRRR-specific inputs
  const [monthlyRent, setMonthlyRent] = useState(2000);
  const [refinanceLTV, setRefinanceLTV] = useState(75);
  const [refinanceRate, setRefinanceRate] = useState(7);
  
  // Wholesale-specific inputs
  const [assignmentFee, setAssignmentFee] = useState(15000);
  const [wholesaleClosingCosts, setWholesaleClosingCosts] = useState(2000);
  
  // ===== FIX & FLIP CALCULATIONS =====
  const flipProfit = results.netProfit;
  const flipROI = results.roi;
  const flipCashOnCash = results.cashOnCash;
  const flipTimeframe = inputs.holdingPeriodMonths;
  const flipCashNeeded = results.totalCashNeeded;
  
  // ===== BRRRR CALCULATIONS =====
  // After rehab, refinance at LTV% of ARV
  const refinanceLoanAmount = inputs.arv * (refinanceLTV / 100);
  const monthlyRefiPayment = refinanceLoanAmount * (refinanceRate / 100 / 12) * 
    Math.pow(1 + refinanceRate / 100 / 12, 360) / 
    (Math.pow(1 + refinanceRate / 100 / 12, 360) - 1);
  
  // Monthly expenses (taxes, insurance, maintenance, vacancy, property management)
  const monthlyExpenses = inputs.monthlyPropertyTaxes + 
    inputs.monthlyInsurance + 
    (monthlyRent * 0.08) + // 8% vacancy
    (monthlyRent * 0.10) + // 10% property management
    (monthlyRent * 0.05);  // 5% maintenance/capex
  
  const monthlyCashFlow = monthlyRent - monthlyRefiPayment - monthlyExpenses;
  const annualCashFlow = monthlyCashFlow * 12;
  
  // Cash left in deal after refinance
  const totalInvestment = inputs.purchasePrice + results.purchaseClosingCosts + results.totalRehabCost + results.totalFinancingCosts + results.totalHoldingCosts;
  const cashOutFromRefi = refinanceLoanAmount - (results.totalLoanAmount > 0 ? results.totalLoanAmount : 0);
  const cashLeftInDeal = Math.max(0, results.totalCashNeeded - cashOutFromRefi);
  
  // BRRRR Cash-on-Cash (based on cash left in deal)
  const brrrrCashOnCash = cashLeftInDeal > 0 ? (annualCashFlow / cashLeftInDeal) * 100 : Infinity;
  
  // Equity position
  const equityPosition = inputs.arv - refinanceLoanAmount;
  
  // ===== WHOLESALE CALCULATIONS =====
  // Wholesale: You put property under contract and assign to end buyer
  const wholesaleProfit = assignmentFee - wholesaleClosingCosts;
  const wholesaleCashNeeded = wholesaleClosingCosts + 1000; // Earnest money + closing
  const wholesaleROI = wholesaleCashNeeded > 0 ? (wholesaleProfit / wholesaleCashNeeded) * 100 : 0;
  const wholesaleTimeframe = 1; // Typically 30 days or less
  
  // End buyer analysis
  const endBuyerPrice = inputs.purchasePrice + assignmentFee;
  const endBuyerAllIn = endBuyerPrice + results.totalRehabCost + (endBuyerPrice * 0.03); // 3% closing
  const endBuyerProfit = inputs.arv - endBuyerAllIn - (inputs.arv * 0.07); // 7% selling costs
  
  // Determine best strategy for each metric
  const profits = [
    { strategy: 'flip', value: flipProfit },
    { strategy: 'brrrr', value: annualCashFlow * 5 + equityPosition }, // 5-year value
    { strategy: 'wholesale', value: wholesaleProfit }
  ];
  const bestProfit = profits.reduce((a, b) => a.value > b.value ? a : b).strategy;
  
  const cashNeeded = [
    { strategy: 'flip', value: flipCashNeeded },
    { strategy: 'brrrr', value: results.totalCashNeeded },
    { strategy: 'wholesale', value: wholesaleCashNeeded }
  ];
  const lowestCash = cashNeeded.reduce((a, b) => a.value < b.value ? a : b).strategy;
  
  const timeframes = [
    { strategy: 'flip', value: flipTimeframe },
    { strategy: 'brrrr', value: flipTimeframe + 2 }, // +2 months for refi
    { strategy: 'wholesale', value: wholesaleTimeframe }
  ];
  const fastestTime = timeframes.reduce((a, b) => a.value < b.value ? a : b).strategy;
  
  return (
    <div className="space-y-6">
      {/* Strategy Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Fix & Flip */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-[#2B3E50] text-white px-4 py-3 flex items-center gap-2">
            <Home className="w-4 h-4" />
            <span className="font-medium text-sm">Fix & Flip</span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">Net Profit</div>
              <div className={`text-lg font-bold flex items-center gap-1 ${flipProfit >= 0 ? 'text-green-600' : 'text-[#C91B3C]'}`}>
                {formatCurrency(flipProfit)}
                {bestProfit === 'flip' && <Trophy className="w-4 h-4 text-amber-500" />}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Cash Needed</div>
              <div className="text-lg font-bold text-[#2B3E50] flex items-center gap-1">
                {formatCurrency(flipCashNeeded)}
                {lowestCash === 'flip' && <Trophy className="w-4 h-4 text-amber-500" />}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Timeframe</div>
              <div className="text-lg font-bold text-[#2B3E50] flex items-center gap-1">
                {flipTimeframe} mo
                {fastestTime === 'flip' && <Trophy className="w-4 h-4 text-amber-500" />}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Cash-on-Cash</div>
              <div className="text-lg font-bold text-[#C87533]">{formatPercent(flipCashOnCash)}</div>
            </div>
          </div>
        </div>
        
        {/* BRRRR */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-[#C87533] text-white px-4 py-3 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span className="font-medium text-sm">BRRRR</span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">Annual Cash Flow</div>
              <div className={`text-lg font-bold ${annualCashFlow >= 0 ? 'text-green-600' : 'text-[#C91B3C]'}`}>
                {formatCurrency(annualCashFlow)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Cash Left in Deal</div>
              <div className="text-lg font-bold text-[#2B3E50] flex items-center gap-1">
                {formatCurrency(cashLeftInDeal)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Equity Position</div>
              <div className="text-lg font-bold text-[#2B3E50]">{formatCurrency(equityPosition)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Cash-on-Cash</div>
              <div className="text-lg font-bold text-[#C87533]">
                {brrrrCashOnCash === Infinity ? '∞' : formatPercent(brrrrCashOnCash)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Wholesale */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-emerald-600 text-white px-4 py-3 flex items-center gap-2">
            <Handshake className="w-4 h-4" />
            <span className="font-medium text-sm">Wholesale</span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">Assignment Fee</div>
              <div className="text-lg font-bold text-green-600 flex items-center gap-1">
                {formatCurrency(wholesaleProfit)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Cash Needed</div>
              <div className="text-lg font-bold text-[#2B3E50] flex items-center gap-1">
                {formatCurrency(wholesaleCashNeeded)}
                {lowestCash === 'wholesale' && <Trophy className="w-4 h-4 text-amber-500" />}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Timeframe</div>
              <div className="text-lg font-bold text-[#2B3E50] flex items-center gap-1">
                {wholesaleTimeframe} mo
                {fastestTime === 'wholesale' && <Trophy className="w-4 h-4 text-amber-500" />}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">ROI</div>
              <div className="text-lg font-bold text-[#C87533]">{formatPercent(wholesaleROI)}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* BRRRR Inputs */}
      <div className="border border-slate-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="w-4 h-4 text-[#C87533]" />
          <span className="font-medium text-sm">BRRRR Assumptions</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Monthly Rent</Label>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(Number(e.target.value) || 0)}
                className="h-8"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Refinance LTV (%)</Label>
            <Input
              type="number"
              value={refinanceLTV}
              onChange={(e) => setRefinanceLTV(Number(e.target.value) || 0)}
              className="h-8 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Refinance Rate (%)</Label>
            <Input
              type="number"
              value={refinanceRate}
              onChange={(e) => setRefinanceRate(Number(e.target.value) || 0)}
              className="h-8 mt-1"
            />
          </div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Monthly: {formatCurrency(monthlyCashFlow)} cash flow | Refi Loan: {formatCurrency(refinanceLoanAmount)} | Payment: {formatCurrency(monthlyRefiPayment)}/mo
        </div>
      </div>
      
      {/* Wholesale Inputs */}
      <div className="border border-slate-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Handshake className="w-4 h-4 text-emerald-600" />
          <span className="font-medium text-sm">Wholesale Assumptions</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Assignment Fee</Label>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                value={assignmentFee}
                onChange={(e) => setAssignmentFee(Number(e.target.value) || 0)}
                className="h-8"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Your Closing Costs</Label>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                value={wholesaleClosingCosts}
                onChange={(e) => setWholesaleClosingCosts(Number(e.target.value) || 0)}
                className="h-8"
              />
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          End Buyer Price: {formatCurrency(endBuyerPrice)} | End Buyer Potential Profit: {formatCurrency(endBuyerProfit)}
        </div>
      </div>
      
      {/* Summary Recommendation */}
      <div className="bg-gradient-to-r from-[#2B3E50] to-[#3d5a73] rounded-lg p-4 text-white">
        <div className="text-xs text-slate-300 uppercase tracking-wide mb-2">Strategy Summary</div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-slate-300">Best for Quick Cash</div>
            <div className="font-bold text-amber-400">Wholesale</div>
          </div>
          <div>
            <div className="text-xs text-slate-300">Best for Max Profit</div>
            <div className="font-bold text-amber-400">Fix & Flip</div>
          </div>
          <div>
            <div className="text-xs text-slate-300">Best for Long-Term</div>
            <div className="font-bold text-amber-400">BRRRR</div>
          </div>
        </div>
      </div>
    </div>
  );
}
