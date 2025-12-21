import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CalculatorInputs, CalculatorResults, calculateResults } from "@/lib/calculator";
import { Scale, Plus, Trash2, Trophy, TrendingDown, DollarSign, Percent } from "lucide-react";

interface LenderScenario {
  id: string;
  name: string;
  interestRate: number;
  points: number;
  lenderFees: number;
}

interface PointsFeesComparisonProps {
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

export function PointsFeesComparison({ inputs, results }: PointsFeesComparisonProps) {
  const [scenarios, setScenarios] = useState<LenderScenario[]>([
    { id: '1', name: 'Lender A', interestRate: inputs.interestRate, points: inputs.originationPoints, lenderFees: 500 },
    { id: '2', name: 'Lender B', interestRate: inputs.interestRate + 1, points: Math.max(0, inputs.originationPoints - 1), lenderFees: 750 },
  ]);
  
  const addScenario = () => {
    if (scenarios.length >= 4) return;
    const newId = String(Date.now());
    setScenarios([...scenarios, {
      id: newId,
      name: `Lender ${String.fromCharCode(65 + scenarios.length)}`,
      interestRate: inputs.interestRate,
      points: inputs.originationPoints,
      lenderFees: 500,
    }]);
  };
  
  const removeScenario = (id: string) => {
    if (scenarios.length <= 2) return;
    setScenarios(scenarios.filter(s => s.id !== id));
  };
  
  const updateScenario = (id: string, field: keyof LenderScenario, value: any) => {
    setScenarios(scenarios.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };
  
  // Calculate results for each scenario
  const scenarioResults = scenarios.map(scenario => {
    // Calculate loan amount (same for all scenarios)
    const loanAmount = results.totalLoanAmount;
    
    // Points cost
    const pointsCost = loanAmount * (scenario.points / 100);
    
    // Monthly interest (interest-only for hard money)
    const monthlyInterest = loanAmount * (scenario.interestRate / 100 / 12);
    const totalInterest = monthlyInterest * inputs.holdingPeriodMonths;
    
    // Total financing cost for this scenario
    const totalFinancingCost = pointsCost + totalInterest + scenario.lenderFees;
    
    // Calculate adjusted results
    const adjustedInputs = {
      ...inputs,
      interestRate: scenario.interestRate,
      loanPoints: scenario.points,
    };
    const adjustedResults = calculateResults(adjustedInputs);
    
    // Upfront costs (points + fees)
    const upfrontCosts = pointsCost + scenario.lenderFees;
    
    return {
      ...scenario,
      loanAmount,
      pointsCost,
      monthlyInterest,
      totalInterest,
      totalFinancingCost,
      upfrontCosts,
      netProfit: adjustedResults.netProfit,
      cashNeeded: adjustedResults.totalCashNeeded,
    };
  });
  
  // Find best scenario for each metric
  const bestProfit = scenarioResults.reduce((a, b) => a.netProfit > b.netProfit ? a : b);
  const lowestUpfront = scenarioResults.reduce((a, b) => a.upfrontCosts < b.upfrontCosts ? a : b);
  const lowestTotal = scenarioResults.reduce((a, b) => a.totalFinancingCost < b.totalFinancingCost ? a : b);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-[#2B3E50]" />
          <span className="font-medium">Compare Lender Scenarios</span>
        </div>
        {scenarios.length < 4 && (
          <Button variant="outline" size="sm" onClick={addScenario}>
            <Plus className="w-4 h-4 mr-1" />
            Add Lender
          </Button>
        )}
      </div>
      
      {/* Scenario Inputs */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${scenarios.length}, 1fr)` }}>
        {scenarios.map((scenario, index) => (
          <div key={scenario.id} className="border border-slate-200 rounded-lg overflow-hidden">
            <div className={`px-3 py-2 flex items-center justify-between ${
              index === 0 ? 'bg-[#2B3E50] text-white' : 
              index === 1 ? 'bg-[#C87533] text-white' : 
              index === 2 ? 'bg-emerald-600 text-white' :
              'bg-purple-600 text-white'
            }`}>
              <Input
                value={scenario.name}
                onChange={(e) => updateScenario(scenario.id, 'name', e.target.value)}
                className="h-6 bg-transparent border-none text-white placeholder:text-white/70 font-medium p-0 text-sm"
              />
              {scenarios.length > 2 && (
                <button 
                  onClick={() => removeScenario(scenario.id)}
                  className="text-white/70 hover:text-white"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="p-3 space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Interest Rate (%)</Label>
                <Input
                  type="number"
                  step="0.25"
                  value={scenario.interestRate}
                  onChange={(e) => updateScenario(scenario.id, 'interestRate', Number(e.target.value) || 0)}
                  className="h-8 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Points (%)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={scenario.points}
                  onChange={(e) => updateScenario(scenario.id, 'points', Number(e.target.value) || 0)}
                  className="h-8 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Lender Fees ($)</Label>
                <Input
                  type="number"
                  value={scenario.lenderFees}
                  onChange={(e) => updateScenario(scenario.id, 'lenderFees', Number(e.target.value) || 0)}
                  className="h-8 mt-1"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Results Comparison */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
          <span className="font-medium text-sm">Cost Comparison</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Metric</th>
                {scenarioResults.map((s, i) => (
                  <th key={s.id} className={`text-right px-4 py-2 font-medium ${
                    i === 0 ? 'text-[#2B3E50]' : 
                    i === 1 ? 'text-[#C87533]' : 
                    i === 2 ? 'text-emerald-600' :
                    'text-purple-600'
                  }`}>
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="px-4 py-2 text-muted-foreground">Points Cost</td>
                {scenarioResults.map(s => (
                  <td key={s.id} className="text-right px-4 py-2 font-medium">
                    {formatCurrency(s.pointsCost)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-4 py-2 text-muted-foreground">Monthly Interest</td>
                {scenarioResults.map(s => (
                  <td key={s.id} className="text-right px-4 py-2 font-medium">
                    {formatCurrency(s.monthlyInterest)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-4 py-2 text-muted-foreground">Total Interest ({inputs.holdingPeriodMonths} mo)</td>
                {scenarioResults.map(s => (
                  <td key={s.id} className="text-right px-4 py-2 font-medium">
                    {formatCurrency(s.totalInterest)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-4 py-2 text-muted-foreground">Lender Fees</td>
                {scenarioResults.map(s => (
                  <td key={s.id} className="text-right px-4 py-2 font-medium">
                    {formatCurrency(s.lenderFees)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-slate-200 bg-slate-50">
                <td className="px-4 py-2 font-medium">Upfront Costs</td>
                {scenarioResults.map(s => (
                  <td key={s.id} className="text-right px-4 py-2 font-bold flex items-center justify-end gap-1">
                    {formatCurrency(s.upfrontCosts)}
                    {s.id === lowestUpfront.id && <Trophy className="w-4 h-4 text-amber-500" />}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-slate-200 bg-[#2B3E50] text-white">
                <td className="px-4 py-2 font-medium">Total Financing Cost</td>
                {scenarioResults.map(s => (
                  <td key={s.id} className="text-right px-4 py-2 font-bold">
                    <div className="flex items-center justify-end gap-1">
                      {formatCurrency(s.totalFinancingCost)}
                      {s.id === lowestTotal.id && <Trophy className="w-4 h-4 text-amber-400" />}
                    </div>
                  </td>
                ))}
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-4 py-2 text-muted-foreground">Cash Needed</td>
                {scenarioResults.map(s => (
                  <td key={s.id} className="text-right px-4 py-2 font-medium">
                    {formatCurrency(s.cashNeeded)}
                  </td>
                ))}
              </tr>
              <tr className="bg-green-50">
                <td className="px-4 py-2 font-medium text-green-800">Net Profit</td>
                {scenarioResults.map(s => (
                  <td key={s.id} className="text-right px-4 py-2 font-bold text-green-700">
                    <div className="flex items-center justify-end gap-1">
                      {formatCurrency(s.netProfit)}
                      {s.id === bestProfit.id && <Trophy className="w-4 h-4 text-amber-500" />}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Recommendation */}
      <div className="bg-gradient-to-r from-[#2B3E50] to-[#3d5a73] rounded-lg p-4 text-white">
        <div className="text-xs text-slate-300 uppercase tracking-wide mb-2">Recommendation</div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xs text-slate-300 mb-1">Lowest Upfront</div>
            <div className="font-bold text-amber-400">{lowestUpfront.name}</div>
            <div className="text-xs text-slate-400">{formatCurrency(lowestUpfront.upfrontCosts)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-300 mb-1">Lowest Total Cost</div>
            <div className="font-bold text-amber-400">{lowestTotal.name}</div>
            <div className="text-xs text-slate-400">{formatCurrency(lowestTotal.totalFinancingCost)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-300 mb-1">Highest Profit</div>
            <div className="font-bold text-amber-400">{bestProfit.name}</div>
            <div className="text-xs text-slate-400">{formatCurrency(bestProfit.netProfit)}</div>
          </div>
        </div>
      </div>
      
      {/* Tips */}
      <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="font-medium text-blue-800 mb-1">Points vs Rate Trade-off:</div>
        <ul className="text-blue-700 space-y-1">
          <li>• Higher points = lower rate = less interest over time</li>
          <li>• Lower points = higher rate = less cash needed upfront</li>
          <li>• For short holds (&lt;6 mo), lower points often wins</li>
          <li>• For longer holds, paying more points may save money</li>
        </ul>
      </div>
    </div>
  );
}
