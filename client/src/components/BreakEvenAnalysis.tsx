import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalculatorInputs, CalculatorResults, calculateResults } from "@/lib/calculator";
import { Target, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface BreakEvenAnalysisProps {
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

export function BreakEvenAnalysis({ inputs, results }: BreakEvenAnalysisProps) {
  const [targetProfit, setTargetProfit] = useState(25000);
  
  // Calculate Break-Even ARV (minimum ARV needed to break even, i.e., profit = 0)
  // Net Profit = ARV - Total Project Cost
  // At break-even: ARV = Total Project Cost
  // But Total Project Cost includes selling costs which depend on ARV
  // Total Project Cost = Purchase + Closing + Rehab + Financing + Holding + Selling
  // Selling = ARV * (commissionRate + closingRate) + concessions
  // So: ARV = Purchase + Closing + Rehab + Financing + Holding + ARV * sellingRates + concessions
  // ARV - ARV * sellingRates = Purchase + Closing + Rehab + Financing + Holding + concessions
  // ARV * (1 - sellingRates) = fixedCosts
  // ARV = fixedCosts / (1 - sellingRates)
  
  // Calculate selling rates - use actual selling costs from results for accuracy
  const sellingRates = inputs.useDetailedSellingCosts 
    ? 0 // When using detailed costs, we use fixed amounts not percentages
    : (inputs.sellingCommissionPercent + inputs.sellingClosingCostPercent) / 100;
  
  // Fixed selling costs when using detailed mode
  const fixedSellingCosts = inputs.useDetailedSellingCosts 
    ? (inputs.sellingTitleInsurance || 0) + (inputs.sellingEscrowFees || 0) + 
      (inputs.sellingTransferTax || 0) + (inputs.sellingAttorneyFees || 0) + 
      (inputs.sellingRecordingFees || 0) + (inputs.sellingHomeWarranty || 0) + 
      (inputs.sellingOtherSellingCosts || 0)
    : 0;
  
  const fixedCosts = inputs.purchasePrice + 
    results.purchaseClosingCosts + 
    results.totalRehabCost + 
    results.totalFinancingCosts + 
    results.totalHoldingCosts + 
    (inputs.sellerConcessions || 0) +
    fixedSellingCosts;
  
  // Break-even ARV calculation
  // For percentage-based: ARV = fixedCosts / (1 - sellingRates)
  // For detailed costs: ARV = fixedCosts + commission (still percentage-based)
  const breakEvenARV = inputs.useDetailedSellingCosts
    ? fixedCosts / (1 - inputs.sellingCommissionPercent / 100)
    : fixedCosts / (1 - sellingRates);
  
  // Calculate Maximum Purchase Price for Target Profit
  // Net Profit = ARV - Total Project Cost
  // Target Profit = ARV - (Purchase + Closing + Rehab + Financing + Holding + Selling)
  // For simplicity, we'll assume closing costs scale with purchase price
  // This is an iterative calculation, but we can approximate:
  // Purchase = ARV - Target Profit - (ARV * sellingRates) - Rehab - Financing - Holding - (Purchase * closingRate)
  // Purchase * (1 + closingRate) = ARV * (1 - sellingRates) - Target Profit - Rehab - Financing - Holding
  // Purchase = (ARV * (1 - sellingRates) - Target Profit - Rehab - Financing - Holding - concessions) / (1 + closingRate)
  
  const closingRate = inputs.usePurchaseClosingCostPercent ? inputs.purchaseClosingCostPercent / 100 : 0;
  const maxPurchaseForTargetProfit = (
    inputs.arv * (1 - sellingRates) - 
    targetProfit - 
    results.totalRehabCost - 
    results.totalFinancingCosts - 
    results.totalHoldingCosts -
    (inputs.sellerConcessions || 0) -
    fixedSellingCosts
  ) / (1 + closingRate);
  
  // Calculate ARV needed for target profit
  const arvForTargetProfit = inputs.useDetailedSellingCosts
    ? (fixedCosts + targetProfit) / (1 - inputs.sellingCommissionPercent / 100)
    : (fixedCosts + targetProfit) / (1 - sellingRates);
  
  // Calculate profit margin at break-even
  const currentProfitMargin = results.netProfit / inputs.arv * 100;
  
  // Calculate how much cushion/buffer exists
  const arvCushion = inputs.arv - breakEvenARV;
  const arvCushionPercent = (arvCushion / inputs.arv) * 100;
  
  return (
    <div className="space-y-6">
      {/* Break-Even Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-[#2B3E50]" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Break-Even ARV</span>
          </div>
          <div className="text-2xl font-bold text-[#2B3E50]">{formatCurrency(breakEvenARV)}</div>
          <div className="text-xs text-muted-foreground mt-1">Minimum ARV to avoid loss</div>
        </div>
        
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ARV Cushion</span>
          </div>
          <div className={`text-2xl font-bold ${arvCushion >= 0 ? 'text-green-600' : 'text-[#C91B3C]'}`}>
            {formatCurrency(arvCushion)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {arvCushionPercent.toFixed(1)}% buffer above break-even
          </div>
        </div>
      </div>
      
      {/* Target Profit Calculator */}
      <div className="border border-slate-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-[#C87533]" />
          <span className="font-medium text-sm">Target Profit Calculator</span>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Target Profit Amount</Label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground">$</span>
              <Input
                type="number"
                value={targetProfit}
                onChange={(e) => setTargetProfit(Number(e.target.value) || 0)}
                className="h-9"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <div className="text-xs text-amber-700 font-medium mb-1">Max Purchase Price</div>
              <div className="text-lg font-bold text-amber-800">
                {maxPurchaseForTargetProfit > 0 ? formatCurrency(maxPurchaseForTargetProfit) : '$0'}
              </div>
              <div className="text-xs text-amber-600 mt-1">
                {maxPurchaseForTargetProfit > 0 
                  ? `${formatCurrency(inputs.purchasePrice - maxPurchaseForTargetProfit)} ${inputs.purchasePrice > maxPurchaseForTargetProfit ? 'over' : 'under'} current`
                  : 'Target not achievable'}
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="text-xs text-blue-700 font-medium mb-1">Required ARV</div>
              <div className="text-lg font-bold text-blue-800">{formatCurrency(arvForTargetProfit)}</div>
              <div className="text-xs text-blue-600 mt-1">
                {formatCurrency(arvForTargetProfit - inputs.arv)} {arvForTargetProfit > inputs.arv ? 'above' : 'below'} current
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Reference Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
          <span className="font-medium text-sm">Quick Reference</span>
        </div>
        <div className="divide-y divide-slate-100">
          <div className="flex justify-between px-4 py-2 text-sm">
            <span className="text-muted-foreground">Current ARV</span>
            <span className="font-medium">{formatCurrency(inputs.arv)}</span>
          </div>
          <div className="flex justify-between px-4 py-2 text-sm">
            <span className="text-muted-foreground">Break-Even ARV</span>
            <span className="font-medium">{formatCurrency(breakEvenARV)}</span>
          </div>
          <div className="flex justify-between px-4 py-2 text-sm">
            <span className="text-muted-foreground">Current Profit</span>
            <span className={`font-medium ${results.netProfit >= 0 ? 'text-green-600' : 'text-[#C91B3C]'}`}>
              {formatCurrency(results.netProfit)}
            </span>
          </div>
          <div className="flex justify-between px-4 py-2 text-sm">
            <span className="text-muted-foreground">Profit Margin</span>
            <span className={`font-medium ${currentProfitMargin >= 0 ? 'text-green-600' : 'text-[#C91B3C]'}`}>
              {currentProfitMargin.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between px-4 py-2 text-sm bg-slate-50">
            <span className="text-muted-foreground">Safety Buffer</span>
            <span className={`font-medium ${arvCushionPercent >= 10 ? 'text-green-600' : arvCushionPercent >= 5 ? 'text-amber-600' : 'text-[#C91B3C]'}`}>
              {arvCushionPercent.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
