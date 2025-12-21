import { useState, useEffect, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CalculatorInputs, calculateResults } from "@/lib/calculator";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SensitivityAnalysisProps {
  baseInputs: CalculatorInputs;
  onInputsChange?: (inputs: CalculatorInputs) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

export function SensitivityAnalysis({ baseInputs, onInputsChange }: SensitivityAnalysisProps) {
  // Sensitivity adjustments as percentages
  const [arvAdjustment, setArvAdjustment] = useState(0); // -20% to +20%
  const [rehabAdjustment, setRehabAdjustment] = useState(0); // -30% to +50%
  const [holdingAdjustment, setHoldingAdjustment] = useState(0); // -50% to +100% (in months)

  // Calculate adjusted values
  const adjustedInputs = useMemo(() => {
    const baseRehab = baseInputs.useDetailedRehab 
      ? baseInputs.rehabCategories.reduce((total, cat) => 
          total + cat.items.reduce((sum, item) => sum + item.cost, 0), 0)
      : baseInputs.rehabCostSimple;

    // When adjusting rehab in sensitivity mode, temporarily switch to simple mode
    // with the adjusted value to ensure calculations work correctly
    const adjustedRehabCost = Math.round(baseRehab * (1 + rehabAdjustment / 100));
    
    return {
      ...baseInputs,
      arv: Math.round(baseInputs.arv * (1 + arvAdjustment / 100)),
      // Force simple mode for sensitivity calculations with adjusted value
      useDetailedRehab: false,
      rehabCostSimple: adjustedRehabCost,
      holdingPeriodMonths: Math.max(1, Math.round(baseInputs.holdingPeriodMonths * (1 + holdingAdjustment / 100))),
    };
  }, [baseInputs, arvAdjustment, rehabAdjustment, holdingAdjustment]);

  // Calculate results for base and adjusted scenarios
  const baseResults = useMemo(() => calculateResults(baseInputs), [baseInputs]);
  const adjustedResults = useMemo(() => calculateResults(adjustedInputs), [adjustedInputs]);

  // Calculate profit change
  const profitChange = adjustedResults.netProfit - baseResults.netProfit;
  const profitChangePercent = baseResults.netProfit !== 0 
    ? (profitChange / Math.abs(baseResults.netProfit)) * 100 
    : 0;

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-500";
    if (change < 0) return "text-red-500";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground mb-4">
        Drag the sliders to see how changes in key variables impact your profit in real-time.
      </div>

      {/* ARV Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium">After Repair Value (ARV)</Label>
          <div className="text-right">
            <span className={`text-sm font-bold ${arvAdjustment !== 0 ? getChangeColor(arvAdjustment) : ''}`}>
              {formatCurrency(adjustedInputs.arv)}
            </span>
            {arvAdjustment !== 0 && (
              <span className={`text-xs ml-2 ${getChangeColor(arvAdjustment)}`}>
                ({arvAdjustment > 0 ? '+' : ''}{arvAdjustment}%)
              </span>
            )}
          </div>
        </div>
        <Slider
          value={[arvAdjustment]}
          min={-20}
          max={20}
          step={1}
          onValueChange={(v) => setArvAdjustment(v[0])}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>-20%</span>
          <span className="font-medium">Base: {formatCurrency(baseInputs.arv)}</span>
          <span>+20%</span>
        </div>
      </div>

      {/* Rehab Cost Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium">Rehab Cost</Label>
          <div className="text-right">
            <span className={`text-sm font-bold ${rehabAdjustment !== 0 ? getChangeColor(-rehabAdjustment) : ''}`}>
              {formatCurrency(
                baseInputs.useDetailedRehab 
                  ? baseInputs.rehabCategories.reduce((total, cat) => 
                      total + cat.items.reduce((sum, item) => sum + item.cost, 0), 0) * (1 + rehabAdjustment / 100)
                  : adjustedInputs.rehabCostSimple
              )}
            </span>
            {rehabAdjustment !== 0 && (
              <span className={`text-xs ml-2 ${getChangeColor(-rehabAdjustment)}`}>
                ({rehabAdjustment > 0 ? '+' : ''}{rehabAdjustment}%)
              </span>
            )}
          </div>
        </div>
        <Slider
          value={[rehabAdjustment]}
          min={-30}
          max={50}
          step={5}
          onValueChange={(v) => setRehabAdjustment(v[0])}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>-30%</span>
          <span className="font-medium">Base: {formatCurrency(
            baseInputs.useDetailedRehab 
              ? baseInputs.rehabCategories.reduce((total, cat) => 
                  total + cat.items.reduce((sum, item) => sum + item.cost, 0), 0)
              : baseInputs.rehabCostSimple
          )}</span>
          <span>+50%</span>
        </div>
      </div>

      {/* Holding Period Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium">Holding Period</Label>
          <div className="text-right">
            <span className={`text-sm font-bold ${holdingAdjustment !== 0 ? getChangeColor(-holdingAdjustment) : ''}`}>
              {adjustedInputs.holdingPeriodMonths} months
            </span>
            {holdingAdjustment !== 0 && (
              <span className={`text-xs ml-2 ${getChangeColor(-holdingAdjustment)}`}>
                ({holdingAdjustment > 0 ? '+' : ''}{holdingAdjustment}%)
              </span>
            )}
          </div>
        </div>
        <Slider
          value={[holdingAdjustment]}
          min={-50}
          max={100}
          step={10}
          onValueChange={(v) => setHoldingAdjustment(v[0])}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>-50%</span>
          <span className="font-medium">Base: {baseInputs.holdingPeriodMonths} mo</span>
          <span>+100%</span>
        </div>
      </div>

      {/* Impact Summary */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <Label className="text-xs text-muted-foreground block mb-1">Base Profit</Label>
            <span className={`text-lg font-bold ${baseResults.netProfit >= 0 ? 'text-[#C87533]' : 'text-[#C91B3C]'}`}>
              {formatCurrency(baseResults.netProfit)}
            </span>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <Label className="text-xs text-muted-foreground block mb-1">Adjusted Profit</Label>
            <span className={`text-lg font-bold ${adjustedResults.netProfit >= 0 ? 'text-[#C87533]' : 'text-[#C91B3C]'}`}>
              {formatCurrency(adjustedResults.netProfit)}
            </span>
          </div>
        </div>

        <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getTrendIcon(profitChange)}
              <span className="text-sm font-medium">Profit Impact</span>
            </div>
            <div className="text-right">
              <span className={`text-lg font-bold ${getChangeColor(profitChange)}`}>
                {profitChange >= 0 ? '+' : ''}{formatCurrency(profitChange)}
              </span>
              <span className={`text-xs ml-2 ${getChangeColor(profitChange)}`}>
                ({profitChangePercent >= 0 ? '+' : ''}{profitChangePercent.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Adjusted ROI</span>
            <span className={`font-medium ${adjustedResults.roi >= 15 ? 'text-green-500' : ''}`}>
              {formatPercent(adjustedResults.roi)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Adjusted Cash-on-Cash</span>
            <span className={`font-medium ${adjustedResults.cashOnCash >= 20 ? 'text-green-500' : ''}`}>
              {formatPercent(adjustedResults.cashOnCash)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Adjusted 70% Rule</span>
            <span className={`font-medium ${
              (adjustedInputs.purchasePrice + adjustedResults.totalRehabCost) <= (adjustedInputs.arv * 0.7) 
                ? 'text-green-500' 
                : 'text-[#C91B3C]'
            }`}>
              {((adjustedInputs.purchasePrice + adjustedResults.totalRehabCost) / adjustedInputs.arv * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
