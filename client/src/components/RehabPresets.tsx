import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Paintbrush, Hammer, HardHat, Settings, DollarSign, Ruler, Save, Edit2 } from "lucide-react";

export interface RehabPreset {
  id: string;
  name: string;
  description: string;
  costPerSqFt: number;
  icon: 'light' | 'medium' | 'full';
  isConfigured: boolean;
}

interface RehabPresetsProps {
  squareFootage: number;
  onSquareFootageChange: (sqft: number) => void;
  onApplyPreset: (totalCost: number) => void;
  presets: RehabPreset[];
  onPresetsChange: (presets: RehabPreset[]) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

const PresetIcon = ({ type, className }: { type: 'light' | 'medium' | 'full'; className?: string }) => {
  switch (type) {
    case 'light':
      return <Paintbrush className={className} />;
    case 'medium':
      return <Hammer className={className} />;
    case 'full':
      return <HardHat className={className} />;
    default:
      return <Hammer className={className} />;
  }
};

export const defaultPresets: RehabPreset[] = [
  {
    id: 'light',
    name: 'Light Cosmetic',
    description: 'Paint, flooring, fixtures, minor repairs',
    costPerSqFt: 0,
    icon: 'light',
    isConfigured: false,
  },
  {
    id: 'medium',
    name: 'Medium Rehab',
    description: 'Kitchen/bath updates, some systems work',
    costPerSqFt: 0,
    icon: 'medium',
    isConfigured: false,
  },
  {
    id: 'full',
    name: 'Full Gut',
    description: 'Complete renovation, new everything',
    costPerSqFt: 0,
    icon: 'full',
    isConfigured: false,
  },
];

export function RehabPresets({ 
  squareFootage, 
  onSquareFootageChange, 
  onApplyPreset,
  presets,
  onPresetsChange 
}: RehabPresetsProps) {
  const [editingPreset, setEditingPreset] = useState<RehabPreset | null>(null);
  const [tempCostPerSqFt, setTempCostPerSqFt] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleEditPreset = (preset: RehabPreset) => {
    setEditingPreset(preset);
    setTempCostPerSqFt(preset.costPerSqFt);
    setDialogOpen(true);
  };

  const handleSavePreset = () => {
    if (!editingPreset) return;
    
    const updatedPresets = presets.map(p => 
      p.id === editingPreset.id 
        ? { ...p, costPerSqFt: tempCostPerSqFt, isConfigured: tempCostPerSqFt > 0 }
        : p
    );
    onPresetsChange(updatedPresets);
    setDialogOpen(false);
    setEditingPreset(null);
  };

  const handleApplyPreset = (preset: RehabPreset) => {
    if (!preset.isConfigured || squareFootage <= 0) return;
    const totalCost = Math.round(preset.costPerSqFt * squareFootage);
    onApplyPreset(totalCost);
  };

  return (
    <div className="space-y-4">
      {/* Square Footage Input */}
      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border">
        <Ruler className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">Property Square Footage</Label>
          <Input
            type="number"
            value={squareFootage || ''}
            onChange={(e) => onSquareFootageChange(Number(e.target.value))}
            placeholder="Enter square footage"
            className="h-9 mt-1"
          />
        </div>
      </div>

      {/* Preset Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {presets.map((preset) => {
          const estimatedCost = preset.isConfigured && squareFootage > 0 
            ? preset.costPerSqFt * squareFootage 
            : 0;
          
          return (
            <Card 
              key={preset.id} 
              className={`p-4 relative transition-all ${
                preset.isConfigured 
                  ? 'border-primary/50 bg-card hover:border-primary cursor-pointer' 
                  : 'border-dashed border-muted-foreground/30 bg-muted/20'
              }`}
            >
              {/* Configure Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-primary"
                onClick={() => handleEditPreset(preset)}
              >
                {preset.isConfigured ? <Edit2 className="h-3 w-3" /> : <Settings className="h-3 w-3" />}
              </Button>

              <div className="text-center space-y-2">
                <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center ${
                  preset.isConfigured ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <PresetIcon 
                    type={preset.icon} 
                    className={`h-5 w-5 ${preset.isConfigured ? 'text-primary' : 'text-muted-foreground'}`} 
                  />
                </div>
                
                <div>
                  <h4 className={`font-medium text-sm ${preset.isConfigured ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {preset.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {preset.description}
                  </p>
                </div>

                {preset.isConfigured ? (
                  <div className="pt-2 space-y-2">
                    <div className="text-xs text-muted-foreground">
                      ${preset.costPerSqFt}/sq ft
                    </div>
                    {squareFootage > 0 && (
                      <>
                        <div className="text-lg font-bold text-[#C87533]">
                          {formatCurrency(estimatedCost)}
                        </div>
                        <Button
                          size="sm"
                          className="w-full h-7 text-xs"
                          onClick={() => handleApplyPreset(preset)}
                        >
                          Apply Estimate
                        </Button>
                      </>
                    )}
                    {squareFootage <= 0 && (
                      <div className="text-xs text-muted-foreground italic">
                        Enter sq ft above
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 mx-auto border-dashed"
                      onClick={() => handleEditPreset(preset)}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Info Text */}
      <p className="text-xs text-muted-foreground text-center">
        Configure your own $/sq ft values based on your market. Click a preset to apply the estimate.
      </p>

      {/* Edit Preset Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingPreset && <PresetIcon type={editingPreset.icon} className="h-5 w-5 text-primary" />}
              Configure {editingPreset?.name}
            </DialogTitle>
            <DialogDescription>
              Set your cost per square foot for this rehab level based on your local market.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm">Cost Per Square Foot</Label>
              <div className="relative mt-2">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={tempCostPerSqFt || ''}
                  onChange={(e) => setTempCostPerSqFt(Number(e.target.value))}
                  placeholder="e.g., 25"
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {editingPreset?.description}
              </p>
            </div>

            {tempCostPerSqFt > 0 && squareFootage > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Estimated Total:</span>
                  <span className="text-lg font-bold text-[#C87533]">
                    {formatCurrency(tempCostPerSqFt * squareFootage)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Based on {squareFootage.toLocaleString()} sq ft
                </div>
              </div>
            )}


          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset}>
              <Save className="h-4 w-4 mr-1" /> Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
