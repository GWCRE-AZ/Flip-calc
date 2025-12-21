import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CalculatorInputs, CalculatorResults, defaultInputs, calculateResults } from "@/lib/calculator";
import { Plus, Trash2, DollarSign, Home, Trophy, AlertTriangle } from "lucide-react";

interface PropertyData {
  id: string;
  name: string;
  inputs: CalculatorInputs;
  results: CalculatorResults;
}

interface ComparisonModeProps {
  currentInputs: CalculatorInputs;
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

export function ComparisonMode({ currentInputs }: ComparisonModeProps) {
  const [properties, setProperties] = useState<PropertyData[]>([
    {
      id: '1',
      name: 'Property A',
      inputs: { ...currentInputs, address: currentInputs.address || 'Property A' },
      results: calculateResults(currentInputs),
    }
  ]);

  const addProperty = () => {
    if (properties.length >= 3) return;
    
    const newId = String(properties.length + 1);
    const letter = String.fromCharCode(65 + properties.length); // A, B, C
    
    setProperties([...properties, {
      id: newId,
      name: `Property ${letter}`,
      inputs: { ...defaultInputs, address: `Property ${letter}` },
      results: calculateResults(defaultInputs),
    }]);
  };

  const removeProperty = (id: string) => {
    if (properties.length <= 1) return;
    setProperties(properties.filter(p => p.id !== id));
  };

  const updateProperty = (id: string, field: keyof CalculatorInputs, value: any) => {
    setProperties(properties.map(p => {
      if (p.id !== id) return p;
      const newInputs = { ...p.inputs, [field]: value };
      return {
        ...p,
        inputs: newInputs,
        results: calculateResults(newInputs),
      };
    }));
  };

  const updatePropertyName = (id: string, name: string) => {
    setProperties(properties.map(p => 
      p.id === id ? { ...p, name } : p
    ));
  };

  // Find the best property for each metric
  const bestProfit = useMemo(() => {
    return properties.reduce((best, p) => 
      p.results.netProfit > best.results.netProfit ? p : best
    , properties[0]);
  }, [properties]);

  const bestROI = useMemo(() => {
    return properties.reduce((best, p) => 
      p.results.roi > best.results.roi ? p : best
    , properties[0]);
  }, [properties]);

  const bestCashOnCash = useMemo(() => {
    return properties.reduce((best, p) => 
      p.results.cashOnCash > best.results.cashOnCash ? p : best
    , properties[0]);
  }, [properties]);

  const lowestCashNeeded = useMemo(() => {
    return properties.reduce((best, p) => 
      p.results.totalCashNeeded < best.results.totalCashNeeded ? p : best
    , properties[0]);
  }, [properties]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Compare up to 3 properties side-by-side
        </div>
        {properties.length < 3 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addProperty}
            className="border-dashed"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Property
          </Button>
        )}
      </div>

      {/* Property Input Cards */}
      <div className={`grid gap-4 grid-cols-1 ${properties.length === 2 ? 'md:grid-cols-2' : properties.length === 3 ? 'md:grid-cols-3' : ''}`}>
        {properties.map((property, index) => (
          <Card key={property.id} className="p-4 space-y-4 bg-card border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-primary" />
                <Input
                  value={property.name}
                  onChange={(e) => updatePropertyName(property.id, e.target.value)}
                  className="h-7 text-sm font-medium w-28 border-none bg-transparent p-0 focus-visible:ring-0"
                />
              </div>
              {properties.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => removeProperty(property.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Purchase Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                  <Input
                    type="number"
                    value={property.inputs.purchasePrice}
                    onChange={(e) => updateProperty(property.id, 'purchasePrice', Number(e.target.value))}
                    className="h-8 pl-6 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">ARV</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                  <Input
                    type="number"
                    value={property.inputs.arv}
                    onChange={(e) => updateProperty(property.id, 'arv', Number(e.target.value))}
                    className="h-8 pl-6 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Rehab Cost</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                  <Input
                    type="number"
                    value={property.inputs.rehabCostSimple}
                    onChange={(e) => updateProperty(property.id, 'rehabCostSimple', Number(e.target.value))}
                    className="h-8 pl-6 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Holding (months)</Label>
                <Input
                  type="number"
                  value={property.inputs.holdingPeriodMonths}
                  onChange={(e) => updateProperty(property.id, 'holdingPeriodMonths', Number(e.target.value))}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Comparison Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 font-medium text-muted-foreground">Metric</th>
              {properties.map(p => (
                <th key={p.id} className="text-right py-3 px-2 font-medium">{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="py-3 px-2 text-muted-foreground">Net Profit</td>
              {properties.map(p => (
                <td key={p.id} className="py-3 px-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {bestProfit.id === p.id && properties.length > 1 && (
                      <Trophy className="h-3 w-3 text-[#C87533]" />
                    )}
                    <span className={`font-bold ${p.results.netProfit >= 0 ? 'text-[#C87533]' : 'text-[#C91B3C]'}`}>
                      {formatCurrency(p.results.netProfit)}
                    </span>
                  </div>
                </td>
              ))}
            </tr>
            <tr className="border-b border-border">
              <td className="py-3 px-2 text-muted-foreground">ROI</td>
              {properties.map(p => (
                <td key={p.id} className="py-3 px-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {bestROI.id === p.id && properties.length > 1 && (
                      <Trophy className="h-3 w-3 text-[#C87533]" />
                    )}
                    <span className={`font-medium ${p.results.roi >= 15 ? 'text-green-500' : ''}`}>
                      {formatPercent(p.results.roi)}
                    </span>
                  </div>
                </td>
              ))}
            </tr>
            <tr className="border-b border-border">
              <td className="py-3 px-2 text-muted-foreground">Cash-on-Cash</td>
              {properties.map(p => (
                <td key={p.id} className="py-3 px-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {bestCashOnCash.id === p.id && properties.length > 1 && (
                      <Trophy className="h-3 w-3 text-[#C87533]" />
                    )}
                    <span className={`font-medium ${p.results.cashOnCash >= 20 ? 'text-green-500' : ''}`}>
                      {formatPercent(p.results.cashOnCash)}
                    </span>
                  </div>
                </td>
              ))}
            </tr>
            <tr className="border-b border-border">
              <td className="py-3 px-2 text-muted-foreground">Cash Needed</td>
              {properties.map(p => (
                <td key={p.id} className="py-3 px-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {lowestCashNeeded.id === p.id && properties.length > 1 && (
                      <Trophy className="h-3 w-3 text-[#C87533]" />
                    )}
                    <span className="font-medium">{formatCurrency(p.results.totalCashNeeded)}</span>
                  </div>
                </td>
              ))}
            </tr>
            <tr className="border-b border-border">
              <td className="py-3 px-2 text-muted-foreground">Total Project Cost</td>
              {properties.map(p => (
                <td key={p.id} className="py-3 px-2 text-right font-medium">
                  {formatCurrency(p.results.totalProjectCost)}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border">
              <td className="py-3 px-2 text-muted-foreground">70% Rule</td>
              {properties.map(p => {
                const rulePercent = (p.inputs.purchasePrice + p.results.totalRehabCost) / p.inputs.arv * 100;
                const passes = rulePercent <= 70;
                return (
                  <td key={p.id} className="py-3 px-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!passes && <AlertTriangle className="h-3 w-3 text-[#C91B3C]" />}
                      <span className={`font-medium ${passes ? 'text-green-500' : 'text-[#C91B3C]'}`}>
                        {rulePercent.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="py-3 px-2 text-muted-foreground">Annualized ROI</td>
              {properties.map(p => (
                <td key={p.id} className="py-3 px-2 text-right font-medium">
                  {formatPercent(p.results.annualizedRoi)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Winner Summary */}
      {properties.length > 1 && (
        <div className="p-4 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-5 w-5 text-[#C87533]" />
            <span className="font-bold text-primary">Best Performers</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Highest Profit:</span>
              <span className="ml-2 font-medium">{bestProfit.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Best ROI:</span>
              <span className="ml-2 font-medium">{bestROI.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Best Cash-on-Cash:</span>
              <span className="ml-2 font-medium">{bestCashOnCash.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Lowest Cash Needed:</span>
              <span className="ml-2 font-medium">{lowestCashNeeded.name}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
