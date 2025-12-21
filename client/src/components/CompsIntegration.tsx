import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Plus, Trash2, Info, MapPin, DollarSign, Ruler, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { nanoid } from "nanoid";

export interface Comp {
  id: string;
  address: string;
  salePrice: number;
  squareFootage: number;
  saleDate: string;
  bedrooms: number;
  bathrooms: number;
  condition: 'inferior' | 'similar' | 'superior';
  locationAdjustment: number; // +/- percentage
  conditionAdjustment: number; // +/- percentage
  sizeAdjustment: number; // +/- percentage
  otherAdjustment: number; // +/- dollar amount
}

export interface CompsIntegrationProps {
  comps: Comp[];
  onCompsChange: (comps: Comp[]) => void;
  subjectSquareFootage: number;
  subjectARV: number;
}

const defaultComp: Omit<Comp, 'id'> = {
  address: '',
  salePrice: 0,
  squareFootage: 0,
  saleDate: '',
  bedrooms: 3,
  bathrooms: 2,
  condition: 'similar',
  locationAdjustment: 0,
  conditionAdjustment: 0,
  sizeAdjustment: 0,
  otherAdjustment: 0,
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number) => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

export function CompsIntegration({ comps, onCompsChange, subjectSquareFootage, subjectARV }: CompsIntegrationProps) {
  const [expandedComp, setExpandedComp] = useState<string | null>(null);

  const addComp = () => {
    const newComp: Comp = {
      ...defaultComp,
      id: nanoid(),
    };
    onCompsChange([...comps, newComp]);
    setExpandedComp(newComp.id);
  };

  const removeComp = (id: string) => {
    onCompsChange(comps.filter(c => c.id !== id));
  };

  const updateComp = (id: string, field: keyof Comp, value: any) => {
    onCompsChange(comps.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  // Calculate adjusted price for a comp
  const calculateAdjustedPrice = (comp: Comp): number => {
    const locationAdj = comp.salePrice * (comp.locationAdjustment / 100);
    const conditionAdj = comp.salePrice * (comp.conditionAdjustment / 100);
    const sizeAdj = comp.salePrice * (comp.sizeAdjustment / 100);
    return comp.salePrice + locationAdj + conditionAdj + sizeAdj + comp.otherAdjustment;
  };

  // Calculate price per square foot
  const calculatePricePerSqFt = (price: number, sqft: number): number => {
    if (sqft <= 0) return 0;
    return price / sqft;
  };

  // Calculate suggested ARV based on comps
  const calculateSuggestedARV = (): { value: number; confidence: 'high' | 'medium' | 'low' } => {
    const validComps = comps.filter(c => c.salePrice > 0 && c.squareFootage > 0);
    if (validComps.length === 0) return { value: 0, confidence: 'low' };

    const adjustedPrices = validComps.map(calculateAdjustedPrice);
    const avgAdjustedPrice = adjustedPrices.reduce((a, b) => a + b, 0) / adjustedPrices.length;

    // Confidence based on number of comps and variance
    const variance = adjustedPrices.reduce((sum, price) => {
      return sum + Math.pow(price - avgAdjustedPrice, 2);
    }, 0) / adjustedPrices.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / avgAdjustedPrice) * 100;

    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (validComps.length >= 3 && coefficientOfVariation < 10) {
      confidence = 'high';
    } else if (validComps.length >= 2 && coefficientOfVariation < 20) {
      confidence = 'medium';
    }

    return { value: avgAdjustedPrice, confidence };
  };

  const suggestedARV = calculateSuggestedARV();
  const arvDifference = subjectARV > 0 ? ((suggestedARV.value - subjectARV) / subjectARV) * 100 : 0;
  const validComps = comps.filter(c => c.salePrice > 0);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      {validComps.length > 0 && (
        <Card className="bg-muted/30 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-primary flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Comps Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-background rounded-md border border-border">
                <div className="text-xs text-muted-foreground mb-1">Comps Used</div>
                <div className="text-xl font-bold text-primary">{validComps.length}</div>
              </div>
              <div className="text-center p-3 bg-background rounded-md border border-border">
                <div className="text-xs text-muted-foreground mb-1">Suggested ARV</div>
                <div className="text-xl font-bold text-[#C87533]">
                  {formatCurrency(suggestedARV.value)}
                </div>
              </div>
              <div className="text-center p-3 bg-background rounded-md border border-border">
                <div className="text-xs text-muted-foreground mb-1">Your ARV</div>
                <div className="text-xl font-bold text-primary">
                  {formatCurrency(subjectARV)}
                </div>
              </div>
              <div className="text-center p-3 bg-background rounded-md border border-border">
                <div className="text-xs text-muted-foreground mb-1">Difference</div>
                <div className={`text-xl font-bold ${Math.abs(arvDifference) <= 5 ? 'text-green-600' : Math.abs(arvDifference) <= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {arvDifference >= 0 ? '+' : ''}{arvDifference.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Confidence Indicator */}
            <div className="flex items-center justify-between p-3 rounded-md border border-border bg-background">
              <div className="flex items-center gap-2">
                {suggestedARV.confidence === 'high' && (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-600">High Confidence</span>
                  </>
                )}
                {suggestedARV.confidence === 'medium' && (
                  <>
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-600">Medium Confidence</span>
                  </>
                )}
                {suggestedARV.confidence === 'low' && (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium text-red-600">Low Confidence</span>
                  </>
                )}
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Confidence is based on number of comps and price consistency. High: 3+ comps with &lt;10% variance. Medium: 2+ comps with &lt;20% variance.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* ARV Validation Message */}
            {subjectARV > 0 && suggestedARV.value > 0 && (
              <div className={`p-3 rounded-md border ${
                Math.abs(arvDifference) <= 5 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : Math.abs(arvDifference) <= 10 
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                    : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="text-sm">
                  {Math.abs(arvDifference) <= 5 && (
                    <span>✓ Your ARV estimate is well-supported by the comparable sales data.</span>
                  )}
                  {Math.abs(arvDifference) > 5 && Math.abs(arvDifference) <= 10 && (
                    <span>⚠ Your ARV estimate differs slightly from comps. Consider reviewing your assumptions.</span>
                  )}
                  {Math.abs(arvDifference) > 10 && arvDifference > 0 && (
                    <span>⚠ Your ARV may be conservative. Comps suggest a higher value of {formatCurrency(suggestedARV.value)}.</span>
                  )}
                  {Math.abs(arvDifference) > 10 && arvDifference < 0 && (
                    <span>⚠ Your ARV may be aggressive. Comps suggest a lower value of {formatCurrency(suggestedARV.value)}.</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Comps List */}
      <div className="space-y-3">
        {comps.map((comp, index) => (
          <Card key={comp.id} className="border-border overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedComp(expandedComp === comp.id ? null : comp.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {comp.address || `Comp #${index + 1}`}
                  </div>
                  {comp.salePrice > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(comp.salePrice)} • {comp.squareFootage > 0 ? `${comp.squareFootage} sq ft` : 'No size'}
                      {comp.salePrice > 0 && comp.squareFootage > 0 && (
                        <span className="ml-2 text-[#C87533]">
                          ({formatCurrency(calculatePricePerSqFt(comp.salePrice, comp.squareFootage))}/sq ft)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {comp.salePrice > 0 && (
                  <div className="text-right mr-2">
                    <div className="text-xs text-muted-foreground">Adjusted</div>
                    <div className="font-bold text-[#C87533]">{formatCurrency(calculateAdjustedPrice(comp))}</div>
                  </div>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeComp(comp.id);
                  }}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {expandedComp === comp.id && (
              <CardContent className="pt-0 pb-4 border-t border-border bg-muted/20">
                <div className="space-y-4 pt-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <MapPin className="h-3 w-3" /> Address
                      </Label>
                      <Input
                        placeholder="123 Main St, City, State"
                        value={comp.address}
                        onChange={(e) => updateComp(comp.id, 'address', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Sale Date</Label>
                      <Input
                        type="date"
                        value={comp.saleDate}
                        onChange={(e) => updateComp(comp.id, 'saleDate', e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <DollarSign className="h-3 w-3" /> Sale Price
                      </Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={comp.salePrice || ''}
                        onChange={(e) => updateComp(comp.id, 'salePrice', Number(e.target.value))}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <Ruler className="h-3 w-3" /> Square Feet
                      </Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={comp.squareFootage || ''}
                        onChange={(e) => updateComp(comp.id, 'squareFootage', Number(e.target.value))}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Bedrooms</Label>
                      <Input
                        type="number"
                        value={comp.bedrooms}
                        onChange={(e) => updateComp(comp.id, 'bedrooms', Number(e.target.value))}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Bathrooms</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={comp.bathrooms}
                        onChange={(e) => updateComp(comp.id, 'bathrooms', Number(e.target.value))}
                        className="h-9"
                      />
                    </div>
                  </div>

                  {/* Adjustments */}
                  <div className="pt-3 border-t border-border">
                    <Label className="text-xs font-bold text-primary mb-3 block flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" /> Adjustments
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Positive adjustments increase the comp's value (comp is inferior). Negative adjustments decrease it (comp is superior).</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Location (%)</Label>
                        <Input
                          type="number"
                          value={comp.locationAdjustment}
                          onChange={(e) => updateComp(comp.id, 'locationAdjustment', Number(e.target.value))}
                          className="h-9"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Condition (%)</Label>
                        <Input
                          type="number"
                          value={comp.conditionAdjustment}
                          onChange={(e) => updateComp(comp.id, 'conditionAdjustment', Number(e.target.value))}
                          className="h-9"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Size (%)</Label>
                        <Input
                          type="number"
                          value={comp.sizeAdjustment}
                          onChange={(e) => updateComp(comp.id, 'sizeAdjustment', Number(e.target.value))}
                          className="h-9"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Other ($)</Label>
                        <Input
                          type="number"
                          value={comp.otherAdjustment}
                          onChange={(e) => updateComp(comp.id, 'otherAdjustment', Number(e.target.value))}
                          className="h-9"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Adjusted Price Summary */}
                  {comp.salePrice > 0 && (
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md border border-border">
                      <span className="text-sm text-muted-foreground">Total Adjustments:</span>
                      <span className={`font-bold ${calculateAdjustedPrice(comp) - comp.salePrice >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(calculateAdjustedPrice(comp) - comp.salePrice)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Add Comp Button */}
      <Button
        variant="outline"
        onClick={addComp}
        className="w-full border-dashed border-2 hover:border-[#C87533] hover:text-[#C87533]"
      >
        <Plus className="h-4 w-4 mr-2" /> Add Comparable Sale
      </Button>

      {/* Help Text */}
      {comps.length === 0 && (
        <div className="text-center p-6 bg-muted/30 rounded-md border border-dashed border-border">
          <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Add comparable sales to validate your ARV estimate. Include recent sales of similar properties in the same area.
          </p>
        </div>
      )}
    </div>
  );
}

export const defaultComps: Comp[] = [];
