import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FileText, DollarSign } from "lucide-react";

export interface ClosingCostItems {
  titleInsurance: number;
  appraisal: number;
  attorneyFees: number;
  recordingFees: number;
  transferTaxes: number;
  lenderFees: number;
  escrowFees: number;
  inspections: number;
  other: number;
}

export const defaultClosingCostItems: ClosingCostItems = {
  titleInsurance: 2000,
  appraisal: 500,
  attorneyFees: 1500,
  recordingFees: 250,
  transferTaxes: 2500,
  lenderFees: 500,
  escrowFees: 500,
  inspections: 500,
  other: 0,
};

interface ClosingCostItemizationProps {
  purchasePrice: number;
  useItemized: boolean;
  onUseItemizedChange: (value: boolean) => void;
  items: ClosingCostItems;
  onItemsChange: (items: ClosingCostItems) => void;
  percentValue: number;
  onPercentChange: (value: number) => void;
  usePercent: boolean;
  onUsePercentChange: (value: boolean) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

export function ClosingCostItemization({
  purchasePrice,
  useItemized,
  onUseItemizedChange,
  items,
  onItemsChange,
  percentValue,
  onPercentChange,
  usePercent,
  onUsePercentChange,
}: ClosingCostItemizationProps) {
  const totalItemized = Object.values(items).reduce((sum, val) => sum + val, 0);
  const percentTotal = purchasePrice * (percentValue / 100);
  
  const handleItemChange = (key: keyof ClosingCostItems, value: number) => {
    onItemsChange({ ...items, [key]: value });
  };
  
  const itemLabels: Record<keyof ClosingCostItems, string> = {
    titleInsurance: 'Title Insurance',
    appraisal: 'Appraisal',
    attorneyFees: 'Attorney Fees',
    recordingFees: 'Recording Fees',
    transferTaxes: 'Transfer Taxes',
    lenderFees: 'Lender Fees',
    escrowFees: 'Escrow/Title Fees',
    inspections: 'Inspections',
    other: 'Other',
  };
  
  return (
    <div className="space-y-4">
      {/* Toggle between Simple and Itemized */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Purchase Closing Costs</Label>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${!useItemized ? 'text-[#2B3E50] font-medium' : 'text-muted-foreground'}`}>Simple</span>
          <Switch
            checked={useItemized}
            onCheckedChange={onUseItemizedChange}
          />
          <span className={`text-xs ${useItemized ? 'text-[#2B3E50] font-medium' : 'text-muted-foreground'}`}>Itemized</span>
        </div>
      </div>
      
      {!useItemized ? (
        /* Simple Mode */
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                type="number"
                value={percentValue}
                onChange={(e) => onPercentChange(Number(e.target.value) || 0)}
                className="h-9"
              />
            </div>
            <span className="text-muted-foreground">%</span>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${usePercent ? 'text-[#2B3E50] font-medium' : 'text-muted-foreground'}`}>Use Percentage</span>
              <Switch
                checked={usePercent}
                onCheckedChange={onUsePercentChange}
              />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Estimated: {formatCurrency(percentTotal)}
          </div>
        </div>
      ) : (
        /* Itemized Mode */
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-[#2B3E50]" />
              <span className="font-medium text-sm">Itemized Closing Costs</span>
            </div>
            
            <div className="space-y-3">
              {(Object.keys(items) as Array<keyof ClosingCostItems>).map((key) => (
                <div key={key}>
                  <Label className="text-xs text-muted-foreground block mb-1">
                    {itemLabels[key]}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      type="number"
                      value={items[key]}
                      onChange={(e) => handleItemChange(key, Number(e.target.value) || 0)}
                      className="h-9 pl-7"
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center">
              <span className="font-medium text-sm">Total Closing Costs</span>
              <span className="font-bold text-[#2B3E50] text-lg">{formatCurrency(totalItemized)}</span>
            </div>
            
            <div className="mt-2 text-xs text-muted-foreground">
              {((totalItemized / purchasePrice) * 100).toFixed(2)}% of purchase price
            </div>
          </div>
          
          {/* Quick Reference */}
          <div className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="font-medium text-amber-800 mb-1">Typical Ranges:</div>
            <div className="space-y-1 text-amber-700">
              <div>• Title Insurance: 0.5-1% of price</div>
              <div>• Transfer Taxes: Varies by state</div>
              <div>• Attorney: $500-$2,000</div>
              <div>• Recording: $100-$500</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
