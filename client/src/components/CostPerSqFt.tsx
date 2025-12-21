import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalculatorInputs, CalculatorResults } from "@/lib/calculator";
import { Ruler, DollarSign, TrendingUp, Home } from "lucide-react";

interface CostPerSqFtProps {
  inputs: CalculatorInputs;
  results: CalculatorResults;
  squareFootage: number;
  onSquareFootageChange: (sqft: number) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatCurrencyDecimal = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export function CostPerSqFt({ inputs, results, squareFootage, onSquareFootageChange }: CostPerSqFtProps) {
  const sqft = squareFootage || 0;
  
  // Calculate per square foot metrics
  const purchasePricePerSqFt = sqft > 0 ? inputs.purchasePrice / sqft : 0;
  const arvPerSqFt = sqft > 0 ? inputs.arv / sqft : 0;
  const rehabPerSqFt = sqft > 0 ? results.totalRehabCost / sqft : 0;
  const totalProjectCostPerSqFt = sqft > 0 ? results.totalProjectCost / sqft : 0;
  const profitPerSqFt = sqft > 0 ? results.netProfit / sqft : 0;
  
  // Calculate value-add per sqft (ARV - Purchase)
  const valueAddPerSqFt = arvPerSqFt - purchasePricePerSqFt;
  
  // Calculate all-in cost (purchase + rehab + closing)
  const allInCost = inputs.purchasePrice + results.totalRehabCost + results.purchaseClosingCosts;
  const allInCostPerSqFt = sqft > 0 ? allInCost / sqft : 0;
  
  return (
    <div className="space-y-6">
      {/* Square Footage Input */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Ruler className="w-4 h-4 text-[#2B3E50]" />
          <Label className="font-medium text-sm">Property Square Footage</Label>
        </div>
        <Input
          type="number"
          placeholder="Enter square footage"
          value={squareFootage || ''}
          onChange={(e) => onSquareFootageChange(Number(e.target.value) || 0)}
          className="h-10"
        />
        {sqft === 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Enter square footage to see per-sqft metrics
          </p>
        )}
      </div>
      
      {sqft > 0 && (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Home className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Purchase $/SF</span>
              </div>
              <div className="text-2xl font-bold text-blue-800">{formatCurrencyDecimal(purchasePricePerSqFt)}</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-700 uppercase tracking-wide">ARV $/SF</span>
              </div>
              <div className="text-2xl font-bold text-green-800">{formatCurrencyDecimal(arvPerSqFt)}</div>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-medium text-amber-700 uppercase tracking-wide">Rehab $/SF</span>
              </div>
              <div className="text-2xl font-bold text-amber-800">{formatCurrencyDecimal(rehabPerSqFt)}</div>
            </div>
            
            <div className={`rounded-lg p-4 border ${profitPerSqFt >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className={`w-4 h-4 ${profitPerSqFt >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                <span className={`text-xs font-medium uppercase tracking-wide ${profitPerSqFt >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>Profit $/SF</span>
              </div>
              <div className={`text-2xl font-bold ${profitPerSqFt >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                {formatCurrencyDecimal(profitPerSqFt)}
              </div>
            </div>
          </div>
          
          {/* Detailed Breakdown Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
              <span className="font-medium text-sm">Detailed Per Square Foot Breakdown</span>
            </div>
            <div className="divide-y divide-slate-100">
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">Purchase Price</span>
                <div className="text-right">
                  <span className="font-medium">{formatCurrencyDecimal(purchasePricePerSqFt)}</span>
                  <span className="text-muted-foreground text-xs ml-2">({formatCurrency(inputs.purchasePrice)})</span>
                </div>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">Closing Costs</span>
                <div className="text-right">
                  <span className="font-medium">{formatCurrencyDecimal(sqft > 0 ? results.purchaseClosingCosts / sqft : 0)}</span>
                  <span className="text-muted-foreground text-xs ml-2">({formatCurrency(results.purchaseClosingCosts)})</span>
                </div>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">Rehab Costs</span>
                <div className="text-right">
                  <span className="font-medium">{formatCurrencyDecimal(rehabPerSqFt)}</span>
                  <span className="text-muted-foreground text-xs ml-2">({formatCurrency(results.totalRehabCost)})</span>
                </div>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm bg-slate-50">
                <span className="font-medium">All-In Cost</span>
                <div className="text-right">
                  <span className="font-bold text-[#2B3E50]">{formatCurrencyDecimal(allInCostPerSqFt)}</span>
                  <span className="text-muted-foreground text-xs ml-2">({formatCurrency(allInCost)})</span>
                </div>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">Financing Costs</span>
                <div className="text-right">
                  <span className="font-medium">{formatCurrencyDecimal(sqft > 0 ? results.totalFinancingCosts / sqft : 0)}</span>
                  <span className="text-muted-foreground text-xs ml-2">({formatCurrency(results.totalFinancingCosts)})</span>
                </div>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">Holding Costs</span>
                <div className="text-right">
                  <span className="font-medium">{formatCurrencyDecimal(sqft > 0 ? results.totalHoldingCosts / sqft : 0)}</span>
                  <span className="text-muted-foreground text-xs ml-2">({formatCurrency(results.totalHoldingCosts)})</span>
                </div>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">Selling Costs</span>
                <div className="text-right">
                  <span className="font-medium">{formatCurrencyDecimal(sqft > 0 ? results.totalSellingCosts / sqft : 0)}</span>
                  <span className="text-muted-foreground text-xs ml-2">({formatCurrency(results.totalSellingCosts)})</span>
                </div>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm bg-[#2B3E50] text-white">
                <span className="font-medium">Total Project Cost</span>
                <div className="text-right">
                  <span className="font-bold">{formatCurrencyDecimal(totalProjectCostPerSqFt)}</span>
                  <span className="text-slate-300 text-xs ml-2">({formatCurrency(results.totalProjectCost)})</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Value Add Summary */}
          <div className="bg-gradient-to-r from-[#2B3E50] to-[#3d5a73] rounded-lg p-4 text-white">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-slate-300 uppercase tracking-wide mb-1">Value Creation Per SF</div>
                <div className="text-2xl font-bold">{formatCurrencyDecimal(valueAddPerSqFt)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-300 uppercase tracking-wide mb-1">Total Value Add</div>
                <div className="text-2xl font-bold">{formatCurrency(inputs.arv - inputs.purchasePrice)}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
