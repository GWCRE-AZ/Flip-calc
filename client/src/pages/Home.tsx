import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SensitivityAnalysis } from "@/components/SensitivityAnalysis";
import { ComparisonMode } from "@/components/ComparisonMode";
import { RehabPresets, defaultPresets, RehabPreset } from "@/components/RehabPresets";
import { CompsIntegration, Comp, defaultComps } from "@/components/CompsIntegration";
import { BreakEvenAnalysis } from "@/components/BreakEvenAnalysis";
import { CostPerSqFt } from "@/components/CostPerSqFt";
import { ExitStrategiesTab } from "@/components/ExitStrategiesTab";
import { ClosingCostItemization, ClosingCostItems, defaultClosingCostItems } from "@/components/ClosingCostItemization";
import { PointsFeesComparison } from "@/components/PointsFeesComparison";
import { 
  CalculatorInputs, 
  CalculatorResults, 
  defaultInputs, 
  calculateResults,
  RehabCategory,
  RehabItem
} from "@/lib/calculator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Download, HelpCircle, AlertTriangle, Plus, Trash2, Info, ChevronDown, ChevronUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { nanoid } from 'nanoid';
import { exportToExcel } from "@/lib/excelExport";

// Helper for currency formatting
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

export default function Home() {
  const [inputs, setInputs] = useState<CalculatorInputs>(defaultInputs);
  const [results, setResults] = useState<CalculatorResults>(calculateResults(defaultInputs));
  const [activeScenario, setActiveScenario] = useState("1");
  const [rehabPresets, setRehabPresets] = useState<RehabPreset[]>(defaultPresets);
  const [squareFootage, setSquareFootage] = useState(0);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState("results");
  const [showComps, setShowComps] = useState(false);
  const [comps, setComps] = useState<Comp[]>(defaultComps);
  const [useItemizedClosing, setUseItemizedClosing] = useState(false);
  const [closingCostItems, setClosingCostItems] = useState<ClosingCostItems>(defaultClosingCostItems);

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    property: false,
    rehab: false,
    financing: false,
    holding: false,
  });
  
  // Loading state for calculations
  const [isCalculating, setIsCalculating] = useState(false);

  // Validation rules
  const validateInput = (field: string, value: any): string | null => {
    switch (field) {
      case 'purchasePrice':
        if (value <= 0) return 'Purchase price must be greater than $0';
        if (value > 100000000) return 'Purchase price seems unrealistic';
        break;
      case 'arv':
        if (value <= 0) return 'ARV must be greater than $0';
        if (value < inputs.purchasePrice) return 'ARV should typically be higher than purchase price';
        break;
      case 'downPaymentPercent':
        if (value < 0) return 'Down payment cannot be negative';
        if (value > 100) return 'Down payment cannot exceed 100%';
        break;
      case 'interestRate':
        if (value < 0) return 'Interest rate cannot be negative';
        if (value > 30) return 'Interest rate seems unusually high';
        break;
      case 'loanTermMonths':
        if (value < 1) return 'Loan term must be at least 1 month';
        if (value > 360) return 'Loan term cannot exceed 30 years';
        break;
      case 'originationPoints':
        if (value < 0) return 'Points cannot be negative';
        if (value > 10) return 'Points seem unusually high';
        break;
      case 'holdingPeriodMonths':
        if (value < 1) return 'Holding period must be at least 1 month';
        if (value > 60) return 'Holding period seems unusually long';
        break;
      case 'sellingCommissionPercent':
        if (value < 0) return 'Commission cannot be negative';
        if (value > 10) return 'Commission seems unusually high';
        break;
    }
    return null;
  };

  // Recalculate whenever inputs change
  useEffect(() => {
    setIsCalculating(true);
    // Small delay to show loading state for complex calculations
    const timer = setTimeout(() => {
      setResults(calculateResults(inputs));
      setIsCalculating(false);
    }, 50);
    return () => clearTimeout(timer);
  }, [inputs]);
  
  // Toggle section collapse
  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (field: keyof CalculatorInputs, value: any) => {
    // Validate the input
    const error = validateInput(field, value);
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[field] = error;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
    
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  // Rehab Item Handlers
  const updateRehabItemCost = (categoryId: string, itemId: string, newCost: number) => {
    setInputs(prev => ({
      ...prev,
      rehabCategories: prev.rehabCategories.map(cat => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          items: cat.items.map(item => 
            item.id === itemId ? { ...item, cost: newCost } : item
          )
        };
      })
    }));
  };

  const addCustomRehabItem = (categoryId: string) => {
    const newItem: RehabItem = {
      id: nanoid(),
      name: 'New Item',
      cost: 0
    };

    setInputs(prev => ({
      ...prev,
      rehabCategories: prev.rehabCategories.map(cat => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          items: [...cat.items, newItem]
        };
      })
    }));
  };

  const updateRehabItemName = (categoryId: string, itemId: string, newName: string) => {
    setInputs(prev => ({
      ...prev,
      rehabCategories: prev.rehabCategories.map(cat => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          items: cat.items.map(item => 
            item.id === itemId ? { ...item, name: newName } : item
          )
        };
      })
    }));
  };

  const removeRehabItem = (categoryId: string, itemId: string) => {
    setInputs(prev => ({
      ...prev,
      rehabCategories: prev.rehabCategories.map(cat => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          items: cat.items.filter(item => item.id !== itemId)
        };
      })
    }));
  };

  // Chart Data
  const costData = [
    { name: 'Purchase', value: inputs.purchasePrice, color: '#2B3E50' },
    { name: 'Rehab', value: results.totalRehabCost, color: '#C87533' },
    { name: 'Financing', value: results.totalFinancingCosts, color: '#34495E' },
    { name: 'Holding', value: results.totalHoldingCosts, color: '#566573' },
    { name: 'Selling', value: results.totalSellingCosts, color: '#C91B3C' },
  ].filter(item => item.value > 0);

  // Progress Calculation
  const formProgress = useMemo(() => {
    const sections = [
      { name: 'Property', completed: inputs.purchasePrice > 0 && inputs.arv > 0 },
      { name: 'Rehab', completed: results.totalRehabCost > 0 || inputs.rehabCategories.some(c => c.items.some(i => i.cost > 0)) },
      { name: 'Financing', completed: inputs.loanType === 'hard_money' || inputs.loanType === 'conventional' || inputs.loanType === 'cash' },
      { name: 'Holding', completed: inputs.holdingPeriodMonths > 0 },
      { name: 'Selling', completed: inputs.sellingCommissionPercent > 0 },
    ];
    const completedCount = sections.filter(s => s.completed).length;
    return {
      sections,
      completedCount,
      totalCount: sections.length,
      percentage: Math.round((completedCount / sections.length) * 100)
    };
  }, [inputs, results]);

  // Scenario Data
  const baseProfit = results.netProfit;
  const optimisticProfit = results.netProfit + (inputs.arv * 0.05);
  const pessimisticProfit = results.netProfit - (inputs.arv * 0.1);

  const scenarioData = [
    { name: 'Pessimistic', profit: pessimisticProfit, fill: '#C91B3C' },
    { name: 'Base Case', profit: baseProfit, fill: '#2B3E50' },
    { name: 'Optimistic', profit: optimisticProfit, fill: '#C87533' },
  ];

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 0;
    
    // Color palette
    const colors = {
      primary: [43, 62, 80] as [number, number, number],      // Navy
      secondary: [200, 117, 51] as [number, number, number],  // Gold/Orange
      accent: [52, 73, 94] as [number, number, number],       // Slate
      success: [39, 174, 96] as [number, number, number],     // Green
      danger: [231, 76, 60] as [number, number, number],      // Red
      light: [248, 249, 250] as [number, number, number],     // Light gray
      text: [33, 47, 60] as [number, number, number],         // Dark text
    };
    
    // Helper to check if we need a new page
    const checkNewPage = (neededSpace: number) => {
      if (currentY + neededSpace > pageHeight - 30) {
        doc.addPage();
        currentY = 20;
        return true;
      }
      return false;
    };
    
    // ===== PAGE 1: EXECUTIVE SUMMARY =====
    
    // Header Background with gradient effect
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    // Accent stripe
    doc.setFillColor(...colors.secondary);
    doc.rect(0, 50, pageWidth, 3, 'F');
    
    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text("CCRE FLIP ANALYZER", 15, 25);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Investment Analysis Report", 15, 35);
    
    // Report date on right
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - 15, 35, { align: 'right' });
    
    currentY = 65;
    
    // Property Address Banner
    doc.setFillColor(...colors.light);
    doc.roundedRect(15, currentY, pageWidth - 30, 25, 3, 3, 'F');
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, currentY, pageWidth - 30, 25, 3, 3, 'S');
    
    doc.setTextColor(...colors.text);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(inputs.address || "Property Address Not Specified", 25, currentY + 10);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Purchase: ${formatCurrency(inputs.purchasePrice)}  |  ARV: ${formatCurrency(inputs.arv)}  |  Rehab: ${formatCurrency(results.totalRehabCost)}`, 25, currentY + 19);
    
    currentY += 35;
    
    // Executive Summary Box
    doc.setFillColor(...colors.primary);
    doc.roundedRect(15, currentY, pageWidth - 30, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("EXECUTIVE SUMMARY", 20, currentY + 8);
    currentY += 17;
    
    // Key Metrics Grid (2x3)
    const metricBoxWidth = (pageWidth - 40) / 3;
    const metricBoxHeight = 35;
    
    const keyMetrics = [
      { label: 'NET PROFIT', value: formatCurrency(results.netProfit), color: results.netProfit >= 0 ? colors.success : colors.danger },
      { label: 'ROI', value: results.roi.toFixed(1) + '%', color: results.roi >= 15 ? colors.success : results.roi >= 0 ? colors.secondary : colors.danger },
      { label: 'CASH-ON-CASH', value: results.cashOnCash.toFixed(1) + '%', color: results.cashOnCash >= 20 ? colors.success : colors.secondary },
      { label: 'TOTAL CASH NEEDED', value: formatCurrency(results.totalCashNeeded), color: colors.primary },
      { label: '70% RULE', value: ((inputs.purchasePrice + results.totalRehabCost) / inputs.arv * 100).toFixed(1) + '%', color: ((inputs.purchasePrice + results.totalRehabCost) / inputs.arv * 100) <= 70 ? colors.success : colors.danger },
      { label: 'PROFIT MARGIN', value: results.profitMargin.toFixed(1) + '%', color: results.profitMargin >= 10 ? colors.success : colors.secondary },
    ];
    
    keyMetrics.forEach((metric, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = 15 + col * (metricBoxWidth + 5);
      const y = currentY + row * (metricBoxHeight + 5);
      
      // Box background
      doc.setFillColor(...colors.light);
      doc.roundedRect(x, y, metricBoxWidth, metricBoxHeight, 2, 2, 'F');
      
      // Top accent bar
      doc.setFillColor(...metric.color);
      doc.rect(x, y, metricBoxWidth, 3, 'F');
      
      // Label
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(metric.label, x + metricBoxWidth / 2, y + 12, { align: 'center' });
      
      // Value
      doc.setTextColor(...metric.color);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(metric.value, x + metricBoxWidth / 2, y + 27, { align: 'center' });
    });
    
    currentY += (metricBoxHeight * 2) + 20;
    
    // Cost Breakdown Table
    autoTable(doc, {
      startY: currentY,
      head: [['COST BREAKDOWN', 'AMOUNT', '% OF TOTAL']],
      body: [
        ['Purchase Price', formatCurrency(inputs.purchasePrice), ((inputs.purchasePrice / results.totalProjectCost) * 100).toFixed(1) + '%'],
        ['Purchase Closing Costs', formatCurrency(results.purchaseClosingCosts), ((results.purchaseClosingCosts / results.totalProjectCost) * 100).toFixed(1) + '%'],
        ['Rehab Costs', formatCurrency(results.totalRehabCost), ((results.totalRehabCost / results.totalProjectCost) * 100).toFixed(1) + '%'],
        ['Financing Costs', formatCurrency(results.totalFinancingCosts), ((results.totalFinancingCosts / results.totalProjectCost) * 100).toFixed(1) + '%'],
        ['Holding Costs', formatCurrency(results.totalHoldingCosts), ((results.totalHoldingCosts / results.totalProjectCost) * 100).toFixed(1) + '%'],
        ['Selling Costs', formatCurrency(results.totalSellingCosts), ((results.totalSellingCosts / results.totalProjectCost) * 100).toFixed(1) + '%'],
        [{ content: 'TOTAL PROJECT COST', styles: { fontStyle: 'bold', fillColor: colors.light } }, 
         { content: formatCurrency(results.totalProjectCost), styles: { fontStyle: 'bold', fillColor: colors.light } }, 
         { content: '100%', styles: { fontStyle: 'bold', fillColor: colors.light } }],
      ],
      headStyles: { fillColor: colors.secondary, textColor: 255, fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { textColor: 50, fontSize: 10 },
      alternateRowStyles: { fillColor: [252, 252, 252] },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 50, halign: 'right' },
        2: { cellWidth: 40, halign: 'right' },
      },
      theme: 'grid',
      margin: { left: 15, right: 15 },
    });
    
    // ===== PAGE 2: DETAILED ANALYSIS =====
    doc.addPage();
    currentY = 20;
    
    // Page 2 Header
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("CCRE FLIP ANALYZER - DETAILED ANALYSIS", 15, 10);
    doc.text(inputs.address || "Property Analysis", pageWidth - 15, 10, { align: 'right' });
    
    currentY = 25;
    
    // Financing Details Section
    doc.setFillColor(...colors.accent);
    doc.roundedRect(15, currentY, pageWidth - 30, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("FINANCING STRUCTURE", 20, currentY + 7);
    currentY += 15;
    
    if (inputs.loanType === 'cash') {
      autoTable(doc, {
        startY: currentY,
        body: [
          ['Financing Type', 'CASH PURCHASE'],
          ['Total Cash Required', formatCurrency(results.totalCashNeeded)],
          ['No Financing Costs', 'N/A'],
        ],
        bodyStyles: { textColor: 50, fontSize: 10 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: 80 } },
        theme: 'plain',
        margin: { left: 15, right: 15 },
      });
    } else {
      autoTable(doc, {
        startY: currentY,
        body: [
          ['Loan Type', inputs.loanType === 'hard_money' ? 'Hard Money Loan' : 'Conventional Loan'],
          ['Purchase Price', formatCurrency(inputs.purchasePrice)],
          ['Down Payment', `${formatCurrency(results.downPayment)} (${inputs.downPaymentPercent}%)`],
          ['Base Loan Amount', formatCurrency(results.baseLoanAmount)],
          ['Total Loan Amount', formatCurrency(results.totalLoanAmount)],
          ['Interest Rate', `${inputs.interestRate}% ${inputs.isInterestOnly ? '(Interest Only)' : '(Amortized)'}`],
          ['Loan Term', `${inputs.loanTermMonths} months`],
          ['Monthly Payment', formatCurrency(results.monthlyLoanPayment)],
          ['Total Interest', formatCurrency(results.totalLoanInterest)],
          ['Origination Points', `${inputs.originationPoints}% (${formatCurrency(results.totalOriginationPoints)})`],
          ['Total Financing Costs', formatCurrency(results.totalFinancingCosts)],
          ['Loan-to-ARV Ratio', `${((results.totalLoanAmount / inputs.arv) * 100).toFixed(1)}%`],
        ],
        bodyStyles: { textColor: 50, fontSize: 9 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 }, 1: { cellWidth: 70 } },
        theme: 'striped',
        margin: { left: 15 },
      });
      
      // Financed Items
      if (inputs.loanType === 'hard_money') {
        const financedItems = [
          inputs.includeRehabInLoan ? 'Rehab Costs' : null,
          inputs.includeClosingCostsInLoan ? 'Closing Costs' : null,
          inputs.includePointsInLoan ? 'Origination Points' : null,
        ].filter(Boolean);
        
        if (financedItems.length > 0) {
          doc.setTextColor(...colors.text);
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9);
          doc.text(`Items Financed: ${financedItems.join(', ')}`, 15, (doc as any).lastAutoTable.finalY + 5);
        }
      }
    }
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
    
    // Holding Costs Section
    doc.setFillColor(...colors.accent);
    doc.roundedRect(15, currentY, pageWidth - 30, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("HOLDING COSTS", 20, currentY + 7);
    currentY += 15;
    
    const monthlyHolding = inputs.monthlyPropertyTaxes + inputs.monthlyInsurance + inputs.monthlyUtilities + 
                           inputs.monthlyHOA + inputs.monthlyLawnCare + inputs.monthlyPoolMaintenance + 
                           inputs.monthlySecurityAlarm + inputs.monthlyVacancyInsurance + inputs.monthlyOther;
    
    autoTable(doc, {
      startY: currentY,
      head: [['Expense Category', 'Monthly', `Total (${inputs.holdingPeriodMonths} mo)`]],
      body: [
        ['Property Taxes', formatCurrency(inputs.monthlyPropertyTaxes), formatCurrency(inputs.monthlyPropertyTaxes * inputs.holdingPeriodMonths)],
        ['Insurance', formatCurrency(inputs.monthlyInsurance), formatCurrency(inputs.monthlyInsurance * inputs.holdingPeriodMonths)],
        ['Utilities', formatCurrency(inputs.monthlyUtilities), formatCurrency(inputs.monthlyUtilities * inputs.holdingPeriodMonths)],
        ['HOA Fees', formatCurrency(inputs.monthlyHOA), formatCurrency(inputs.monthlyHOA * inputs.holdingPeriodMonths)],
        ['Lawn Care', formatCurrency(inputs.monthlyLawnCare), formatCurrency(inputs.monthlyLawnCare * inputs.holdingPeriodMonths)],
        ['Pool Maintenance', formatCurrency(inputs.monthlyPoolMaintenance), formatCurrency(inputs.monthlyPoolMaintenance * inputs.holdingPeriodMonths)],
        ['Security/Alarm', formatCurrency(inputs.monthlySecurityAlarm), formatCurrency(inputs.monthlySecurityAlarm * inputs.holdingPeriodMonths)],
        ['Vacancy Insurance', formatCurrency(inputs.monthlyVacancyInsurance), formatCurrency(inputs.monthlyVacancyInsurance * inputs.holdingPeriodMonths)],
        ['Other', formatCurrency(inputs.monthlyOther), formatCurrency(inputs.monthlyOther * inputs.holdingPeriodMonths)],
        [{ content: 'TOTAL HOLDING', styles: { fontStyle: 'bold' } }, 
         { content: formatCurrency(monthlyHolding), styles: { fontStyle: 'bold' } }, 
         { content: formatCurrency(results.totalHoldingCosts), styles: { fontStyle: 'bold' } }],
      ],
      headStyles: { fillColor: colors.secondary, textColor: 255, fontSize: 9 },
      bodyStyles: { textColor: 50, fontSize: 9 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      theme: 'grid',
      margin: { left: 15, right: 15 },
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
    
    // Selling Costs Section
    doc.setFillColor(...colors.accent);
    doc.roundedRect(15, currentY, pageWidth - 30, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("SELLING COSTS", 20, currentY + 7);
    currentY += 15;
    
    if (inputs.useDetailedSellingCosts) {
      autoTable(doc, {
        startY: currentY,
        body: [
          ['Realtor Commission', `${inputs.sellingCommissionPercent}%`, formatCurrency(results.sellingCommission)],
          ['Title Insurance', '', formatCurrency(inputs.sellingTitleInsurance)],
          ['Escrow/Title Fees', '', formatCurrency(inputs.sellingEscrowFees)],
          ['Transfer Tax', '', formatCurrency(inputs.sellingTransferTax)],
          ['Attorney Fees', '', formatCurrency(inputs.sellingAttorneyFees)],
          ['Recording Fees', '', formatCurrency(inputs.sellingRecordingFees)],
          ['Home Warranty', '', formatCurrency(inputs.sellingHomeWarranty)],
          ['Other Costs', '', formatCurrency(inputs.sellingOtherSellingCosts)],
          ['Seller Concessions', '', formatCurrency(inputs.sellerConcessions || 0)],
          [{ content: 'TOTAL SELLING COSTS', styles: { fontStyle: 'bold' } }, '', { content: formatCurrency(results.totalSellingCosts), styles: { fontStyle: 'bold' } }],
        ],
        bodyStyles: { textColor: 50, fontSize: 9 },
        columnStyles: { 0: { cellWidth: 60 }, 2: { halign: 'right' } },
        theme: 'striped',
        margin: { left: 15, right: 15 },
      });
    } else {
      autoTable(doc, {
        startY: currentY,
        body: [
          ['Realtor Commission', `${inputs.sellingCommissionPercent}%`, formatCurrency(results.sellingCommission)],
          ['Closing Costs', `${inputs.sellingClosingCostPercent}%`, formatCurrency(results.sellingClosingCosts)],
          ['Seller Concessions', '', formatCurrency(inputs.sellerConcessions || 0)],
          [{ content: 'TOTAL SELLING COSTS', styles: { fontStyle: 'bold' } }, '', { content: formatCurrency(results.totalSellingCosts), styles: { fontStyle: 'bold' } }],
        ],
        bodyStyles: { textColor: 50, fontSize: 9 },
        columnStyles: { 0: { cellWidth: 60 }, 2: { halign: 'right' } },
        theme: 'striped',
        margin: { left: 15, right: 15 },
      });
    }
    
    // ===== PAGE 3: REHAB & SCENARIOS =====
    doc.addPage();
    currentY = 20;
    
    // Page 3 Header
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("CCRE FLIP ANALYZER - REHAB & SCENARIOS", 15, 10);
    doc.text(inputs.address || "Property Analysis", pageWidth - 15, 10, { align: 'right' });
    
    currentY = 25;
    
    // Rehab Breakdown Section
    doc.setFillColor(...colors.accent);
    doc.roundedRect(15, currentY, pageWidth - 30, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("REHAB COST BREAKDOWN", 20, currentY + 7);
    currentY += 15;
    
    if (inputs.useDetailedRehab) {
      const rehabBody: any[] = [];
      
      inputs.rehabCategories.forEach(cat => {
        const catTotal = cat.items.reduce((sum, item) => sum + item.cost, 0);
        if (catTotal > 0) {
          rehabBody.push([{ content: cat.name.toUpperCase(), colSpan: 2, styles: { fontStyle: 'bold', fillColor: colors.light, textColor: colors.primary } }]);
          cat.items.forEach(item => {
            if (item.cost > 0) {
              rehabBody.push([`   ${item.name}`, formatCurrency(item.cost)]);
            }
          });
          rehabBody.push([{ content: `Subtotal: ${cat.name}`, styles: { fontStyle: 'italic', textColor: [100, 100, 100] } }, 
                          { content: formatCurrency(catTotal), styles: { fontStyle: 'italic', textColor: [100, 100, 100] } }]);
        }
      });
      
      rehabBody.push([{ content: 'TOTAL REHAB COST', styles: { fontStyle: 'bold', fillColor: colors.secondary, textColor: [255, 255, 255] } }, 
                      { content: formatCurrency(results.totalRehabCost), styles: { fontStyle: 'bold', fillColor: colors.secondary, textColor: [255, 255, 255] } }]);
      
      autoTable(doc, {
        startY: currentY,
        body: rehabBody,
        bodyStyles: { textColor: 50, fontSize: 9 },
        columnStyles: { 0: { cellWidth: 100 }, 1: { halign: 'right' } },
        theme: 'plain',
        margin: { left: 15, right: 15 },
      });
    } else {
      autoTable(doc, {
        startY: currentY,
        body: [
          ['Estimated Rehab Cost (Simple)', formatCurrency(results.totalRehabCost)],
          ['Cost per Square Foot', squareFootage > 0 ? `${formatCurrency(results.totalRehabCost / squareFootage)}/sqft` : 'N/A'],
        ],
        bodyStyles: { textColor: 50, fontSize: 10 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 100 }, 1: { halign: 'right' } },
        theme: 'plain',
        margin: { left: 15, right: 15 },
      });
    }
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
    
    // Scenario Analysis Section
    doc.setFillColor(...colors.accent);
    doc.roundedRect(15, currentY, pageWidth - 30, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("SCENARIO ANALYSIS", 20, currentY + 7);
    currentY += 15;
    
    autoTable(doc, {
      startY: currentY,
      head: [['Scenario', 'ARV', 'Net Profit', 'ROI', 'Assessment']],
      body: [
        ['Pessimistic (-10%)', formatCurrency(inputs.arv * 0.9), formatCurrency(pessimisticProfit), 
         `${(pessimisticProfit / results.totalCashNeeded * 100).toFixed(1)}%`, 
         pessimisticProfit > 0 ? 'Still Profitable' : 'LOSS'],
        ['Base Case', formatCurrency(inputs.arv), formatCurrency(baseProfit), 
         `${results.roi.toFixed(1)}%`, 'Expected'],
        ['Optimistic (+5%)', formatCurrency(inputs.arv * 1.05), formatCurrency(optimisticProfit), 
         `${(optimisticProfit / results.totalCashNeeded * 100).toFixed(1)}%`, 'Best Case'],
      ],
      headStyles: { fillColor: colors.secondary, textColor: 255, fontSize: 9 },
      bodyStyles: { textColor: 50, fontSize: 9 },
      columnStyles: { 
        0: { cellWidth: 40 }, 
        1: { halign: 'right' }, 
        2: { halign: 'right' }, 
        3: { halign: 'right' },
        4: { halign: 'center' }
      },
      theme: 'grid',
      margin: { left: 15, right: 15 },
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
    
    // Exit Strategy Comparison
    doc.setFillColor(...colors.accent);
    doc.roundedRect(15, currentY, pageWidth - 30, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("EXIT STRATEGY COMPARISON", 20, currentY + 7);
    currentY += 15;
    
    // Calculate BRRRR and Wholesale estimates
    const brrrrRefinanceAmount = inputs.arv * 0.75;
    const brrrrCashLeftInDeal = results.totalCashNeeded - (brrrrRefinanceAmount - results.totalLoanAmount);
    const wholesaleAssignmentFee = inputs.arv * 0.70 - inputs.purchasePrice - results.totalRehabCost;
    
    autoTable(doc, {
      startY: currentY,
      head: [['Strategy', 'Potential Profit', 'Timeline', 'Best For']],
      body: [
        ['Fix & Flip', formatCurrency(results.netProfit), `${inputs.holdingPeriodMonths} months`, 'Quick cash, active investors'],
        ['BRRRR', `Cash left: ${formatCurrency(Math.max(0, brrrrCashLeftInDeal))}`, '6-12 months', 'Long-term wealth building'],
        ['Wholesale', formatCurrency(Math.max(0, wholesaleAssignmentFee)), '30-60 days', 'No capital needed'],
      ],
      headStyles: { fillColor: colors.secondary, textColor: 255, fontSize: 9 },
      bodyStyles: { textColor: 50, fontSize: 9 },
      theme: 'grid',
      margin: { left: 15, right: 15 },
    });
    
    // ===== PAGE 4: BREAK-EVEN & SENSITIVITY =====
    doc.addPage();
    currentY = 20;
    
    // Page 4 Header
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("CCRE FLIP ANALYZER - ADVANCED ANALYSIS", 15, 10);
    doc.text(inputs.address || "Property Analysis", pageWidth - 15, 10, { align: 'right' });
    
    currentY = 25;
    
    // Break-Even Analysis Section
    doc.setFillColor(...colors.accent);
    doc.roundedRect(15, currentY, pageWidth - 30, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("BREAK-EVEN ANALYSIS", 20, currentY + 7);
    currentY += 15;
    
    // Calculate break-even values
    const sellingRates = inputs.useDetailedSellingCosts 
      ? 0 
      : (inputs.sellingCommissionPercent + inputs.sellingClosingCostPercent) / 100;
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
    const breakEvenARV = inputs.useDetailedSellingCosts
      ? fixedCosts / (1 - inputs.sellingCommissionPercent / 100)
      : fixedCosts / (1 - sellingRates);
    const closingRate = inputs.usePurchaseClosingCostPercent ? inputs.purchaseClosingCostPercent / 100 : 0;
    const maxPurchaseFor25k = (
      inputs.arv * (1 - sellingRates) - 
      25000 - 
      results.totalRehabCost - 
      results.totalFinancingCosts - 
      results.totalHoldingCosts -
      (inputs.sellerConcessions || 0) -
      fixedSellingCosts
    ) / (1 + closingRate);
    
    autoTable(doc, {
      startY: currentY,
      body: [
        ['Break-Even ARV', formatCurrency(breakEvenARV), breakEvenARV <= inputs.arv ? 'Below Current ARV' : 'ABOVE Current ARV'],
        ['Current ARV', formatCurrency(inputs.arv), ''],
        ['ARV Cushion', formatCurrency(inputs.arv - breakEvenARV), inputs.arv > breakEvenARV ? 'Positive Buffer' : 'AT RISK'],
        ['', '', ''],
        ['Max Purchase for $25K Profit', formatCurrency(maxPurchaseFor25k), maxPurchaseFor25k >= inputs.purchasePrice ? 'Within Budget' : 'Over Budget'],
        ['Current Purchase Price', formatCurrency(inputs.purchasePrice), ''],
        ['Purchase Price Cushion', formatCurrency(maxPurchaseFor25k - inputs.purchasePrice), maxPurchaseFor25k >= inputs.purchasePrice ? 'Room to Negotiate' : 'Tight Margin'],
      ],
      bodyStyles: { textColor: 50, fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 }, 1: { halign: 'right', cellWidth: 50 }, 2: { halign: 'center', cellWidth: 50 } },
      theme: 'striped',
      margin: { left: 15, right: 15 },
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
    
    // Sensitivity Analysis Section
    doc.setFillColor(...colors.accent);
    doc.roundedRect(15, currentY, pageWidth - 30, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("SENSITIVITY ANALYSIS", 20, currentY + 7);
    currentY += 15;
    
    // ARV Sensitivity
    const arvSensitivity = [
      { change: '-20%', arv: inputs.arv * 0.8, profit: results.netProfit - (inputs.arv * 0.2) },
      { change: '-10%', arv: inputs.arv * 0.9, profit: results.netProfit - (inputs.arv * 0.1) },
      { change: 'Base', arv: inputs.arv, profit: results.netProfit },
      { change: '+10%', arv: inputs.arv * 1.1, profit: results.netProfit + (inputs.arv * 0.1) },
      { change: '+20%', arv: inputs.arv * 1.2, profit: results.netProfit + (inputs.arv * 0.2) },
    ];
    
    autoTable(doc, {
      startY: currentY,
      head: [['ARV Change', 'Adjusted ARV', 'Est. Profit', 'Status']],
      body: arvSensitivity.map(row => [
        row.change,
        formatCurrency(row.arv),
        formatCurrency(row.profit),
        row.profit > 0 ? 'Profitable' : 'LOSS'
      ]),
      headStyles: { fillColor: colors.secondary, textColor: 255, fontSize: 9 },
      bodyStyles: { textColor: 50, fontSize: 9 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'center' } },
      theme: 'grid',
      margin: { left: 15, right: 15 },
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 10;
    
    // Rehab Cost Sensitivity
    const rehabSensitivity = [
      { change: '-30%', rehab: results.totalRehabCost * 0.7, profit: results.netProfit + (results.totalRehabCost * 0.3) },
      { change: 'Base', rehab: results.totalRehabCost, profit: results.netProfit },
      { change: '+30%', rehab: results.totalRehabCost * 1.3, profit: results.netProfit - (results.totalRehabCost * 0.3) },
      { change: '+50%', rehab: results.totalRehabCost * 1.5, profit: results.netProfit - (results.totalRehabCost * 0.5) },
    ];
    
    autoTable(doc, {
      startY: currentY,
      head: [['Rehab Change', 'Adjusted Rehab', 'Est. Profit', 'Status']],
      body: rehabSensitivity.map(row => [
        row.change,
        formatCurrency(row.rehab),
        formatCurrency(row.profit),
        row.profit > 0 ? 'Profitable' : 'LOSS'
      ]),
      headStyles: { fillColor: colors.secondary, textColor: 255, fontSize: 9 },
      bodyStyles: { textColor: 50, fontSize: 9 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'center' } },
      theme: 'grid',
      margin: { left: 15, right: 15 },
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
    
    // Investment Metrics Summary
    doc.setFillColor(...colors.accent);
    doc.roundedRect(15, currentY, pageWidth - 30, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("INVESTMENT METRICS SUMMARY", 20, currentY + 7);
    currentY += 15;
    
    autoTable(doc, {
      startY: currentY,
      body: [
        ['Metric', 'Value', 'Assessment'],
        ['Net Profit', formatCurrency(results.netProfit), results.netProfit >= 25000 ? 'Excellent' : results.netProfit >= 15000 ? 'Good' : results.netProfit > 0 ? 'Marginal' : 'Poor'],
        ['ROI', results.roi.toFixed(1) + '%', results.roi >= 15 ? 'Excellent' : results.roi >= 10 ? 'Good' : results.roi > 0 ? 'Marginal' : 'Poor'],
        ['Cash-on-Cash Return', results.cashOnCash.toFixed(1) + '%', results.cashOnCash >= 20 ? 'Excellent' : results.cashOnCash >= 10 ? 'Good' : 'Marginal'],
        ['Annualized ROI', results.annualizedRoi.toFixed(1) + '%', results.annualizedRoi >= 30 ? 'Excellent' : results.annualizedRoi >= 15 ? 'Good' : 'Marginal'],
        ['Profit Margin', results.profitMargin.toFixed(1) + '%', results.profitMargin >= 15 ? 'Excellent' : results.profitMargin >= 10 ? 'Good' : 'Marginal'],
        ['70% Rule', ((inputs.purchasePrice + results.totalRehabCost) / inputs.arv * 100).toFixed(1) + '%', ((inputs.purchasePrice + results.totalRehabCost) / inputs.arv * 100) <= 70 ? 'Meets Rule' : 'Exceeds 70%'],
        ['Holding Period', inputs.holdingPeriodMonths + ' months', inputs.holdingPeriodMonths <= 6 ? 'Quick Flip' : inputs.holdingPeriodMonths <= 9 ? 'Standard' : 'Extended'],
      ],
      bodyStyles: { textColor: 50, fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { halign: 'right', cellWidth: 50 }, 2: { halign: 'center', cellWidth: 50 } },
      theme: 'striped',
      margin: { left: 15, right: 15 },
      didParseCell: function(data) {
        if (data.row.index === 0) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = colors.light;
        }
      }
    });
    
    // Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(...colors.primary);
      doc.setLineWidth(0.5);
      doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
      
      // Footer text
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.setFont("helvetica", "normal");
      doc.text('CCRE Flip Analyzer - Institutional Grade Investment Analysis', 15, pageHeight - 8);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, pageHeight - 8, { align: 'right' });
    }
    
    // Generate filename with property address
    const sanitizedAddress = (inputs.address || 'Property').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const filename = `CCRE_Analysis_${sanitizedAddress}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    doc.save(filename);
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 shadow-md">
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="w-32 flex justify-start">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Reset all form inputs to defaults
                        setInputs(defaultInputs);
                        setUseItemizedClosing(false);
                        setClosingCostItems(defaultClosingCostItems);
                        setSquareFootage(0);
                        setComps(defaultComps);
                        setShowComps(false);
                        // Reset validation errors
                        setValidationErrors({});
                        // Reset active tabs to defaults
                        setActiveAnalysisTab("results");
                        setActiveScenario("1");
                        // Reset rehab presets to defaults
                        setRehabPresets(defaultPresets);
                        // Recalculate results with default inputs
                        setResults(calculateResults(defaultInputs));
                      }}
                      className="text-primary-foreground/90 hover:text-primary-foreground hover:bg-primary-foreground/10 text-xs px-2 py-1 h-7"
                    >
                      Reset
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset all inputs to default values</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-center flex-1">House Flipping Scenario Analysis Calculator</h1>
            <div className="w-32 flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="text-primary-foreground/90 hover:text-primary-foreground hover:bg-primary-foreground/10 text-xs px-2 py-1 h-7"
                  >
                    Download
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem 
                    onClick={generatePDF}
                    className="cursor-pointer text-sm"
                  >
                    <Download className="mr-2 h-3.5 w-3.5" /> PDF Report
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => exportToExcel(inputs, results, 'flip')}
                    className="cursor-pointer text-sm"
                  >
                    Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: INPUTS */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Property & Purchase */}
            <div className="inst-card">
              <button 
                onClick={() => toggleSection('property')}
                className="inst-header w-full flex items-center justify-between cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <span>Property & Purchase Details</span>
                <div className="flex items-center gap-2">
                  {formProgress.sections[0]?.completed && (
                    <span className="text-xs bg-primary-foreground/20 px-2 py-0.5 rounded-full">Complete</span>
                  )}
                  {collapsedSections.property ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </div>
              </button>
              <div className={`p-6 space-y-4 transition-all duration-300 ${collapsedSections.property ? 'hidden' : ''}`}>
                <div>
                  <Label className="inst-label">Property Address</Label>
                  <Input 
                    className="inst-input" 
                    placeholder="123 Investment Way, Phoenix, AZ"
                    value={inputs.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="inst-label">Purchase Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">$</span>
                      <Input 
                        type="number" 
                        className={`inst-input pl-7 ${validationErrors.purchasePrice ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        value={inputs.purchasePrice}
                        onChange={(e) => handleInputChange('purchasePrice', Number(e.target.value))}
                      />
                    </div>
                    {validationErrors.purchasePrice && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {validationErrors.purchasePrice}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="inst-label">After Repair Value (ARV)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">$</span>
                      <Input 
                        type="number" 
                        className={`inst-input pl-7 ${validationErrors.arv ? 'border-amber-500 focus-visible:ring-amber-500' : ''}`}
                        value={inputs.arv}
                        onChange={(e) => handleInputChange('arv', Number(e.target.value))}
                      />
                    </div>
                    {validationErrors.arv && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {validationErrors.arv}
                      </p>
                    )}
                  </div>
                </div>

                <ClosingCostItemization
                  purchasePrice={inputs.purchasePrice}
                  useItemized={useItemizedClosing}
                  onUseItemizedChange={setUseItemizedClosing}
                  items={closingCostItems}
                  onItemsChange={(items) => {
                    setClosingCostItems(items);
                    // Update the calculator with total itemized costs
                    const total = Object.values(items).reduce((sum, val) => sum + val, 0);
                    handleInputChange('purchaseClosingCostAmount', total);
                    handleInputChange('usePurchaseClosingCostPercent', false);
                  }}
                  percentValue={inputs.purchaseClosingCostPercent}
                  onPercentChange={(val) => handleInputChange('purchaseClosingCostPercent', val)}
                  usePercent={inputs.usePurchaseClosingCostPercent}
                  onUsePercentChange={(c) => handleInputChange('usePurchaseClosingCostPercent', c)}
                />
              </div>
            </div>

            {/* Comps Integration - Optional */}
            <div className="inst-card">
              <div 
                className="inst-header cursor-pointer flex justify-between items-center"
                onClick={() => setShowComps(!showComps)}
              >
                <div className="flex items-center gap-2">
                  <span>ARV Validation (Comps)</span>
                  <span className="text-xs font-normal opacity-70">Optional</span>
                </div>
                <div className="flex items-center gap-2">
                  {comps.length > 0 && (
                    <span className="text-xs bg-[#C87533] text-white px-2 py-0.5 rounded-full">
                      {comps.length} comp{comps.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {showComps ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
              {showComps && (
                <div className="p-6">
                  <CompsIntegration
                    comps={comps}
                    onCompsChange={setComps}
                    subjectSquareFootage={squareFootage}
                    subjectARV={inputs.arv}
                  />
                </div>
              )}
            </div>

            {/* Rehab Costs */}
            <div className="inst-card">
              <button 
                onClick={() => toggleSection('rehab')}
                className="inst-header w-full flex items-center justify-between cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <span>Rehab Cost Estimator</span>
                <div className="flex items-center gap-2">
                  {formProgress.sections[1]?.completed && (
                    <span className="text-xs bg-primary-foreground/20 px-2 py-0.5 rounded-full">Complete</span>
                  )}
                  {collapsedSections.rehab ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </div>
              </button>
              <div className={`p-6 space-y-4 transition-all duration-300 ${collapsedSections.rehab ? 'hidden' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <Label className="inst-label mb-0">Estimation Method</Label>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${!inputs.useDetailedRehab ? 'font-bold text-primary' : 'text-muted-foreground'}`}>Simple</span>
                    <Switch 
                      checked={inputs.useDetailedRehab}
                      onCheckedChange={(c) => handleInputChange('useDetailedRehab', c)}
                    />
                    <span className={`text-sm ${inputs.useDetailedRehab ? 'font-bold text-primary' : 'text-muted-foreground'}`}>Detailed</span>
                  </div>
                </div>

                {!inputs.useDetailedRehab ? (
                  <div className="space-y-6">
                    <div>
                      <Label className="inst-label">Total Estimated Rehab Cost</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">$</span>
                        <Input 
                          type="number" 
                          className="inst-input pl-7"
                          value={inputs.rehabCostSimple}
                          onChange={(e) => handleInputChange('rehabCostSimple', Number(e.target.value))}
                        />
                      </div>
                    </div>

                    {/* Quick Preset Templates */}
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center gap-2 mb-4">
                        <Label className="inst-label mb-0">Quick Estimate Presets</Label>
                      </div>
                      <RehabPresets
                        squareFootage={squareFootage}
                        onSquareFootageChange={setSquareFootage}
                        onApplyPreset={(cost) => handleInputChange('rehabCostSimple', cost)}
                        presets={rehabPresets}
                        onPresetsChange={setRehabPresets}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Accordion type="single" collapsible className="w-full">
                      {inputs.rehabCategories.map((category) => {
                        const categoryTotal = category.items.reduce((sum, item) => sum + item.cost, 0);
                        return (
                          <AccordionItem key={category.id} value={category.id} className="border-border">
                            <AccordionTrigger className="hover:no-underline py-3">
                              <div className="flex justify-between w-full pr-4 items-center">
                                <span className="font-medium text-sm">{category.name}</span>
                                <span className="font-bold text-primary text-sm">{formatCurrency(categoryTotal)}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3 pt-2 pb-4 px-1">
                                {category.items.map((item) => (
                                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-7">
                                      <Input 
                                        className="h-8 text-xs"
                                        value={item.name}
                                        onChange={(e) => updateRehabItemName(category.id, item.id, e.target.value)}
                                      />
                                    </div>
                                    <div className="col-span-4 relative">
                                      <span className="absolute left-2 top-2 text-xs text-muted-foreground">$</span>
                                      <Input 
                                        type="number" 
                                        className="h-8 pl-6 text-xs"
                                        value={item.cost}
                                        onChange={(e) => updateRehabItemCost(category.id, item.id, Number(e.target.value))}
                                      />
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onClick={() => removeRehabItem(category.id, item.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full mt-2 h-8 text-xs border-dashed text-muted-foreground hover:text-primary hover:border-primary"
                                  onClick={() => addCustomRehabItem(category.id)}
                                >
                                  <Plus className="h-3 w-3 mr-1" /> Add Item
                                </Button>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                    
                    <div className="pt-4 mt-4 border-t border-border flex justify-between items-center bg-muted/30 p-3 rounded-sm">
                      <span className="font-bold text-primary">Total Rehab Budget:</span>
                      <span className="font-bold text-xl text-[#C87533]">{formatCurrency(results.totalRehabCost)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Financing */}
            <div className="inst-card">
              <button 
                onClick={() => toggleSection('financing')}
                className="inst-header w-full flex items-center justify-between cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <span>Financing Details</span>
                <div className="flex items-center gap-2">
                  {formProgress.sections[2]?.completed && (
                    <span className="text-xs bg-primary-foreground/20 px-2 py-0.5 rounded-full">Complete</span>
                  )}
                  {collapsedSections.financing ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </div>
              </button>
              <div className={`p-6 space-y-4 transition-all duration-300 ${collapsedSections.financing ? 'hidden' : ''}`}>
                <div>
                  <Label className="inst-label">Loan Type</Label>
                  <Select 
                    value={inputs.loanType} 
                    onValueChange={(v) => handleInputChange('loanType', v)}
                  >
                    <SelectTrigger className="inst-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash Purchase</SelectItem>
                      <SelectItem value="hard_money">Hard Money Loan</SelectItem>
                      <SelectItem value="conventional">Conventional Loan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Conventional Loan Section */}
                {inputs.loanType === 'conventional' && (
                  <>
                    {/* Conventional Loan Info Banner */}
                    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-md flex items-start space-x-2">
                      <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        <span className="font-bold">Conventional Loan:</span> 30-year fixed term with standard amortization. Closing costs, points, and rehab cannot be rolled into the loan.
                      </div>
                    </div>

                    {/* Loan Terms Group */}
                    <div className="input-group">
                      <div className="input-group-label">Loan Terms</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="inst-label">Down Payment (%)</Label>
                        <Input 
                          type="number" 
                          className={`inst-input ${validationErrors.downPaymentPercent ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                          value={inputs.downPaymentPercent}
                          onChange={(e) => handleInputChange('downPaymentPercent', Number(e.target.value))}
                        />
                        {validationErrors.downPaymentPercent && (
                          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {validationErrors.downPaymentPercent}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="inst-label">Interest Rate (%)</Label>
                        <Input 
                          type="number" 
                          className={`inst-input ${validationErrors.interestRate ? 'border-amber-500 focus-visible:ring-amber-500' : ''}`}
                          value={inputs.interestRate}
                          onChange={(e) => handleInputChange('interestRate', Number(e.target.value))}
                        />
                        {validationErrors.interestRate && (
                          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {validationErrors.interestRate}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label className="inst-label">Loan Term</Label>
                        <div className="inst-input bg-muted/50 flex items-center text-muted-foreground">
                          30 Years (360 Months)
                        </div>
                      </div>
                      <div>
                        <Label className="inst-label">Origination Points (%)</Label>
                        <Input 
                          type="number" 
                          className={`inst-input ${validationErrors.originationPoints ? 'border-amber-500 focus-visible:ring-amber-500' : ''}`}
                          value={inputs.originationPoints}
                          onChange={(e) => handleInputChange('originationPoints', Number(e.target.value))}
                        />
                        {validationErrors.originationPoints && (
                          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {validationErrors.originationPoints}
                          </p>
                        )}
                      </div>
                    </div>
                    </div>
                  </>
                )}

                {/* Hard Money Loan Section */}
                {inputs.loanType === 'hard_money' && (
                  <>
                    {/* Loan Terms Group */}
                    <div className="input-group">
                      <div className="input-group-label">Loan Terms</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="inst-label">Down Payment (%)</Label>
                        <Input 
                          type="number" 
                          className={`inst-input ${validationErrors.downPaymentPercent ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                          value={inputs.downPaymentPercent}
                          onChange={(e) => handleInputChange('downPaymentPercent', Number(e.target.value))}
                        />
                        {validationErrors.downPaymentPercent && (
                          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {validationErrors.downPaymentPercent}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="inst-label">Interest Rate (%)</Label>
                        <Input 
                          type="number" 
                          className={`inst-input ${validationErrors.interestRate ? 'border-amber-500 focus-visible:ring-amber-500' : ''}`}
                          value={inputs.interestRate}
                          onChange={(e) => handleInputChange('interestRate', Number(e.target.value))}
                        />
                        {validationErrors.interestRate && (
                          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {validationErrors.interestRate}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="inst-label">Loan Term (Months)</Label>
                        <Input 
                          type="number" 
                          className={`inst-input ${validationErrors.loanTermMonths ? 'border-amber-500 focus-visible:ring-amber-500' : ''}`}
                          value={inputs.loanTermMonths}
                          onChange={(e) => handleInputChange('loanTermMonths', Number(e.target.value))}
                        />
                        {validationErrors.loanTermMonths && (
                          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {validationErrors.loanTermMonths}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="inst-label">Origination Points (%)</Label>
                        <Input 
                          type="number" 
                          className={`inst-input ${validationErrors.originationPoints ? 'border-amber-500 focus-visible:ring-amber-500' : ''}`}
                          value={inputs.originationPoints}
                          onChange={(e) => handleInputChange('originationPoints', Number(e.target.value))}
                        />
                        {validationErrors.originationPoints && (
                          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {validationErrors.originationPoints}
                          </p>
                        )}
                      </div>
                    </div>
                    </div>

                    {/* Advanced Financing Options - Hard Money Only */}
                    <div className="pt-4 border-t border-border space-y-4">
                      <Label className="inst-label text-primary font-bold">Advanced Loan Options</Label>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={inputs.isInterestOnly}
                            onCheckedChange={(c) => handleInputChange('isInterestOnly', c)}
                          />
                          <Label className="text-sm">Interest Only Payments</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={inputs.includeRehabInLoan}
                            onCheckedChange={(c) => handleInputChange('includeRehabInLoan', c)}
                          />
                          <Label className="text-sm">Finance Rehab Costs</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={inputs.includeClosingCostsInLoan}
                            onCheckedChange={(c) => handleInputChange('includeClosingCostsInLoan', c)}
                          />
                          <Label className="text-sm">Roll Closing Costs into Loan</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={inputs.includePointsInLoan}
                            onCheckedChange={(c) => handleInputChange('includePointsInLoan', c)}
                          />
                          <Label className="text-sm">Roll Points into Loan</Label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <Label className="inst-label mb-0">Max Loan to ARV (%)</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="font-semibold">Maximum Loan-to-ARV</p>
                                  <p className="text-xs text-muted-foreground mt-1">Lenders cap total loan at 65-75% of ARV to protect against market drops. Hard money: 65-70%, conventional: 70-75%. Exceeding triggers higher down payment.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input 
                            type="number" 
                            className="inst-input"
                            value={inputs.maxLoanToARVPercent}
                            onChange={(e) => handleInputChange('maxLoanToARVPercent', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <Label className="inst-label mb-0">Interest Reserve (Months)</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="font-semibold">Interest Reserve</p>
                                  <p className="text-xs text-muted-foreground mt-1">Pre-paid interest added to loan balance. Reduces monthly out-of-pocket costs during rehab. Common with hard money loans (3-6 months typical).</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input 
                            type="number" 
                            className="inst-input"
                            value={inputs.interestReserveMonths}
                            onChange={(e) => handleInputChange('interestReserveMonths', Number(e.target.value))}
                          />
                        </div>
                      </div>

                      {results.isLoanCapped && (
                        <div className="bg-muted/50 border border-amber-500/50 p-4 rounded-lg">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground text-sm mb-1">Loan-to-Value Exceeds Limit</h4>
                              <p className="text-sm text-muted-foreground mb-3">
                                Your requested loan amount exceeds <span className="font-medium text-foreground">{inputs.maxLoanToARVPercent}%</span> of the ARV. 
                                Most lenders cap loans at 70-75% of ARV for fix & flip properties.
                              </p>
                              <div className="bg-card border border-border rounded-md p-3">
                                <p className="text-xs font-medium text-foreground mb-1">Recommended Action:</p>
                                <p className="text-xs text-muted-foreground">
                                  Increase down payment to <span className="font-medium text-primary">{Math.max(inputs.downPaymentPercent, 100 - inputs.maxLoanToARVPercent + 5)}%</span> or 
                                  reduce purchase price to meet lender requirements.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Holding & Selling */}
            <div className="inst-card">
              <button 
                onClick={() => toggleSection('holding')}
                className="inst-header w-full flex items-center justify-between cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <span>Holding & Selling Costs</span>
                <div className="flex items-center gap-2">
                  {formProgress.sections[3]?.completed && formProgress.sections[4]?.completed && (
                    <span className="text-xs bg-primary-foreground/20 px-2 py-0.5 rounded-full">Complete</span>
                  )}
                  {collapsedSections.holding ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </div>
              </button>
              <div className={`p-6 space-y-6 transition-all duration-300 ${collapsedSections.holding ? 'hidden' : ''}`}>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="inst-label mb-0">Holding Period</Label>
                    <span className="font-bold text-primary">{inputs.holdingPeriodMonths} Months</span>
                  </div>
                  <Slider 
                    value={[inputs.holdingPeriodMonths]} 
                    min={1} 
                    max={24} 
                    step={1}
                    onValueChange={(v) => handleInputChange('holdingPeriodMonths', v[0])}
                    className="py-2"
                  />
                </div>

                {/* Basic Holding Costs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="inst-label text-xs">Property Taxes /mo</Label>
                    <Input 
                      type="number" 
                      className="inst-input h-8"
                      value={inputs.monthlyPropertyTaxes}
                      onChange={(e) => handleInputChange('monthlyPropertyTaxes', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="inst-label text-xs">Insurance /mo</Label>
                    <Input 
                      type="number" 
                      className="inst-input h-8"
                      value={inputs.monthlyInsurance}
                      onChange={(e) => handleInputChange('monthlyInsurance', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="inst-label text-xs">Utilities /mo</Label>
                    <Input 
                      type="number" 
                      className="inst-input h-8"
                      value={inputs.monthlyUtilities}
                      onChange={(e) => handleInputChange('monthlyUtilities', Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Detailed Holding Costs Toggle */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Label className="inst-label mb-0 font-bold">Detailed Holding Costs</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Add HOA, lawn care, pool maintenance, security, and vacancy insurance for more accurate estimates.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Switch 
                      checked={inputs.useDetailedHoldingCosts}
                      onCheckedChange={(c) => handleInputChange('useDetailedHoldingCosts', c)}
                    />
                  </div>

                  {inputs.useDetailedHoldingCosts && (
                    <div className="space-y-4 bg-muted/30 p-4 rounded-md border border-border">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="inst-label text-xs">HOA Fees /mo</Label>
                          <Input 
                            type="number" 
                            className="inst-input h-9"
                            value={inputs.monthlyHOA}
                            onChange={(e) => handleInputChange('monthlyHOA', Number(e.target.value))}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label className="inst-label text-xs">Lawn Care /mo</Label>
                          <Input 
                            type="number" 
                            className="inst-input h-9"
                            value={inputs.monthlyLawnCare}
                            onChange={(e) => handleInputChange('monthlyLawnCare', Number(e.target.value))}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label className="inst-label text-xs">Pool Maintenance /mo</Label>
                          <Input 
                            type="number" 
                            className="inst-input h-9"
                            value={inputs.monthlyPoolMaintenance}
                            onChange={(e) => handleInputChange('monthlyPoolMaintenance', Number(e.target.value))}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label className="inst-label text-xs">Security/Alarm /mo</Label>
                          <Input 
                            type="number" 
                            className="inst-input h-9"
                            value={inputs.monthlySecurityAlarm}
                            onChange={(e) => handleInputChange('monthlySecurityAlarm', Number(e.target.value))}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label className="inst-label text-xs">Vacancy Insurance /mo</Label>
                          <Input 
                            type="number" 
                            className="inst-input h-9"
                            value={inputs.monthlyVacancyInsurance}
                            onChange={(e) => handleInputChange('monthlyVacancyInsurance', Number(e.target.value))}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label className="inst-label text-xs">Other Costs /mo</Label>
                          <Input 
                            type="number" 
                            className="inst-input h-9"
                            value={inputs.monthlyOther}
                            onChange={(e) => handleInputChange('monthlyOther', Number(e.target.value))}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      
                      <div className="pt-3 mt-3 border-t border-border flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Monthly Holding:</span>
                        <span className="font-bold text-[#C87533]">
                          {formatCurrency(
                            inputs.monthlyPropertyTaxes + 
                            inputs.monthlyInsurance + 
                            inputs.monthlyUtilities + 
                            inputs.monthlyHOA + 
                            inputs.monthlyLawnCare + 
                            inputs.monthlyPoolMaintenance + 
                            inputs.monthlySecurityAlarm + 
                            inputs.monthlyVacancyInsurance + 
                            inputs.monthlyOther
                          )}/mo
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Selling Costs */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="inst-label font-bold">Selling Costs</Label>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${!inputs.useDetailedSellingCosts ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>Simple</span>
                      <Switch
                        checked={inputs.useDetailedSellingCosts}
                        onCheckedChange={(checked) => handleInputChange('useDetailedSellingCosts', checked)}
                      />
                      <span className={`text-xs ${inputs.useDetailedSellingCosts ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>Itemized</span>
                    </div>
                  </div>
                  
                  {/* Realtor Commission - Always shown */}
                  <div className="mb-4">
                    <Label className="inst-label text-xs">Realtor Commission (%)</Label>
                    <Input 
                      type="number" 
                      className="inst-input"
                      value={inputs.sellingCommissionPercent}
                      onChange={(e) => handleInputChange('sellingCommissionPercent', Number(e.target.value))}
                    />
                    <span className="text-xs text-muted-foreground mt-1 block">
                      Estimated: {formatCurrency(inputs.arv * (inputs.sellingCommissionPercent / 100))}
                    </span>
                  </div>
                  
                  {!inputs.useDetailedSellingCosts ? (
                    // Simple Mode - Percentage based
                    <div>
                      <Label className="inst-label text-xs">Closing Costs (%)</Label>
                      <Input 
                        type="number" 
                        className="inst-input"
                        value={inputs.sellingClosingCostPercent}
                        onChange={(e) => handleInputChange('sellingClosingCostPercent', Number(e.target.value))}
                      />
                      <span className="text-xs text-muted-foreground mt-1 block">
                        Estimated: {formatCurrency(inputs.arv * (inputs.sellingClosingCostPercent / 100))}
                      </span>
                    </div>
                  ) : (
                    // Detailed Mode - Itemized costs
                    <div className="space-y-4">
                      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between text-sm font-medium text-muted-foreground border-b border-border pb-2">
                          <span>Itemized Closing Costs</span>
                          <span>Total: {formatCurrency(
                            inputs.sellingTitleInsurance +
                            inputs.sellingEscrowFees +
                            inputs.sellingTransferTax +
                            inputs.sellingAttorneyFees +
                            inputs.sellingRecordingFees +
                            inputs.sellingHomeWarranty +
                            inputs.sellingOtherSellingCosts
                          )}</span>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <Label className="inst-label text-xs">Title Insurance</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                              <Input 
                                type="number" 
                                className="inst-input pl-7"
                                value={inputs.sellingTitleInsurance}
                                onChange={(e) => handleInputChange('sellingTitleInsurance', Number(e.target.value))}
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="inst-label text-xs">Escrow/Title Fees</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                              <Input 
                                type="number" 
                                className="inst-input pl-7"
                                value={inputs.sellingEscrowFees}
                                onChange={(e) => handleInputChange('sellingEscrowFees', Number(e.target.value))}
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="inst-label text-xs">Transfer Tax</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                              <Input 
                                type="number" 
                                className="inst-input pl-7"
                                value={inputs.sellingTransferTax}
                                onChange={(e) => handleInputChange('sellingTransferTax', Number(e.target.value))}
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="inst-label text-xs">Attorney Fees</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                              <Input 
                                type="number" 
                                className="inst-input pl-7"
                                value={inputs.sellingAttorneyFees}
                                onChange={(e) => handleInputChange('sellingAttorneyFees', Number(e.target.value))}
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="inst-label text-xs">Recording Fees</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                              <Input 
                                type="number" 
                                className="inst-input pl-7"
                                value={inputs.sellingRecordingFees}
                                onChange={(e) => handleInputChange('sellingRecordingFees', Number(e.target.value))}
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="inst-label text-xs">Home Warranty</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                              <Input 
                                type="number" 
                                className="inst-input pl-7"
                                value={inputs.sellingHomeWarranty}
                                onChange={(e) => handleInputChange('sellingHomeWarranty', Number(e.target.value))}
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="inst-label text-xs">Other Costs</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                              <Input 
                                type="number" 
                                className="inst-input pl-7"
                                value={inputs.sellingOtherSellingCosts}
                                onChange={(e) => handleInputChange('sellingOtherSellingCosts', Number(e.target.value))}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: RESULTS */}
          <div className="lg:col-span-5">
            <div className="space-y-6">
              
              {/* Analysis Tabs */}
              <Tabs value={activeAnalysisTab} onValueChange={setActiveAnalysisTab} className="w-full">
                {/* Mobile Dropdown */}
                <div className="sm:hidden mb-4">
                  <Select value={activeAnalysisTab} onValueChange={setActiveAnalysisTab}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select view" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="results">Results</SelectItem>
                      <SelectItem value="sensitivity">Sensitivity</SelectItem>
                      <SelectItem value="compare">Compare</SelectItem>
                      <SelectItem value="breakeven">Break-Even</SelectItem>
                      <SelectItem value="persqft">$/SF</SelectItem>
                      <SelectItem value="lenders">Lenders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Desktop Tabs */}
                <TabsList className="hidden sm:flex flex-wrap w-full gap-1 mb-4 h-auto p-1 bg-muted/50">
                  <TabsTrigger value="results" className="flex-1 min-w-[70px] text-xs py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Results
                  </TabsTrigger>
                  <TabsTrigger value="sensitivity" className="flex-1 min-w-[70px] text-xs py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Sensitivity
                  </TabsTrigger>
                  <TabsTrigger value="compare" className="flex-1 min-w-[70px] text-xs py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Compare
                  </TabsTrigger>
                  <TabsTrigger value="breakeven" className="flex-1 min-w-[70px] text-xs py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Break-Even
                  </TabsTrigger>
                  <TabsTrigger value="persqft" className="flex-1 min-w-[70px] text-xs py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    $/SF
                  </TabsTrigger>
                  <TabsTrigger value="lenders" className="flex-1 min-w-[70px] text-xs py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Lenders
                  </TabsTrigger>
                </TabsList>

                {/* Results Tab */}
                <TabsContent value="results" className="space-y-6">
              {/* Key Metrics Dashboard */}
              <div className={`inst-card overflow-hidden ${isCalculating ? 'loading-shimmer' : ''}`}>
                <div className="inst-header flex justify-between items-center">
                  <span>Analysis Results</span>
                  <div className="flex items-center gap-2">
                    {isCalculating && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                    <span className="text-xs normal-case opacity-80">{isCalculating ? 'Calculating...' : 'Real-time Updates'}</span>
                  </div>
                </div>
                <div className={`p-6 transition-opacity duration-200 ${isCalculating ? 'opacity-70' : 'opacity-100'}`}>
                  <div className="mb-6 text-center">
                    <Label className="text-muted-foreground uppercase tracking-wider text-xs mb-1">Net Profit</Label>
                    <div className={`text-4xl font-bold ${results.netProfit >= 0 ? 'text-[#C87533]' : 'text-[#C91B3C]'}`}>
                      {formatCurrency(results.netProfit)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-muted/50 p-3 rounded-sm text-center border border-border cursor-help hover:bg-muted/70 transition-colors">
                            <Label className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                              ROI <HelpCircle className="h-3 w-3" />
                            </Label>
                            <span className={`text-xl font-bold ${results.roi >= 15 ? 'text-[#C87533]' : 'text-foreground'}`}>
                              {formatPercent(results.roi)}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p className="font-semibold">Return on Investment</p>
                          <p className="text-xs text-muted-foreground mt-1">Net Profit ÷ Total Project Cost. Measures overall profitability of the investment. Target: 15%+ for a good deal.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-muted/50 p-3 rounded-sm text-center border border-border cursor-help hover:bg-muted/70 transition-colors">
                            <Label className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                              Cash-on-Cash <HelpCircle className="h-3 w-3" />
                            </Label>
                            <span className={`text-xl font-bold ${results.cashOnCash >= 20 ? 'text-[#C87533]' : 'text-foreground'}`}>
                              {formatPercent(results.cashOnCash)}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p className="font-semibold">Cash-on-Cash Return</p>
                          <p className="text-xs text-muted-foreground mt-1">Net Profit ÷ Actual Cash Invested. Measures return on your out-of-pocket money. Higher leverage = higher CoC. Target: 20%+.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Total Project Cost</span>
                      <span className="font-medium">{formatCurrency(results.totalProjectCost)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Total Cash Needed</span>
                      <span className="font-medium">{formatCurrency(results.totalCashNeeded)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Total Loan Amount</span>
                      <span className="font-medium">{formatCurrency(results.totalLoanAmount)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">ARV</span>
                      <span className="font-medium">{formatCurrency(inputs.arv)}</span>
                    </div>
                    <div className="flex justify-between py-2 items-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-muted-foreground cursor-help flex items-center gap-1">
                              70% Rule Check <HelpCircle className="h-3 w-3" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs">
                            <p className="font-semibold">The 70% Rule</p>
                            <p className="text-xs text-muted-foreground mt-1">(Purchase + Rehab) ÷ ARV. Industry standard: stay under 70% to ensure profit margin. Green = good, Red = risky.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className={`font-bold ${
                        (inputs.purchasePrice + results.totalRehabCost) <= (inputs.arv * 0.7) 
                        ? 'text-green-600' 
                        : 'text-[#C91B3C]'
                      }`}>
                        {((inputs.purchasePrice + results.totalRehabCost) / inputs.arv * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visualizations */}
              <div className="inst-card">
                <div className="inst-header">Cost Breakdown</div>
                <div className="p-6">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          {/* Gradient definitions for pie chart segments */}
                          <linearGradient id="purchaseGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#3D5A73" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#2B3E50" stopOpacity={1}/>
                          </linearGradient>
                          <linearGradient id="rehabGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#E8A04C" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#C87533" stopOpacity={1}/>
                          </linearGradient>
                          <linearGradient id="financingGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#4A6178" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#34495E" stopOpacity={1}/>
                          </linearGradient>
                          <linearGradient id="holdingGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#7A8A99" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#566573" stopOpacity={1}/>
                          </linearGradient>
                          <linearGradient id="sellingGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#E74C3C" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#C91B3C" stopOpacity={1}/>
                          </linearGradient>
                          <filter id="pieShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.25"/>
                          </filter>
                        </defs>
                        <Pie
                          data={costData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={2}
                          dataKey="value"
                          animationBegin={0}
                          animationDuration={800}
                          animationEasing="ease-out"
                          label={({ name, percent, cx, cy, midAngle, innerRadius, outerRadius }) => {
                            if (percent < 0.05) return null;
                            const RADIAN = Math.PI / 180;
                            const radius = outerRadius + 28;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            return (
                              <text
                                x={x}
                                y={y}
                                fill="currentColor"
                                textAnchor={x > cx ? 'start' : 'end'}
                                dominantBaseline="central"
                                className="text-xs font-bold fill-foreground"
                                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                              >
                                {`${(percent * 100).toFixed(0)}%`}
                              </text>
                            );
                          }}
                          labelLine={({ cx, cy, midAngle, outerRadius, percent }) => {
                            if (percent < 0.05) return <line x1={0} y1={0} x2={0} y2={0} stroke="transparent" />;
                            const RADIAN = Math.PI / 180;
                            const startX = cx + outerRadius * Math.cos(-midAngle * RADIAN);
                            const startY = cy + outerRadius * Math.sin(-midAngle * RADIAN);
                            const endX = cx + (outerRadius + 20) * Math.cos(-midAngle * RADIAN);
                            const endY = cy + (outerRadius + 20) * Math.sin(-midAngle * RADIAN);
                            return (
                              <line
                                x1={startX}
                                y1={startY}
                                x2={endX}
                                y2={endY}
                                stroke="#9CA3AF"
                                strokeWidth={1.5}
                                strokeLinecap="round"
                              />
                            );
                          }}
                        >
                          {costData.map((entry, index) => {
                            const gradientMap: Record<string, string> = {
                              'Purchase': 'url(#purchaseGradient)',
                              'Rehab': 'url(#rehabGradient)',
                              'Financing': 'url(#financingGradient)',
                              'Holding': 'url(#holdingGradient)',
                              'Selling': 'url(#sellingGradient)',
                            };
                            return (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={gradientMap[entry.name] || entry.color}
                                stroke="rgba(255,255,255,0.8)"
                                strokeWidth={2}
                                filter="url(#pieShadow)"
                                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                              />
                            );
                          })}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: number, name: string) => [formatCurrency(value), name]}
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            borderColor: '#374151', 
                            borderRadius: '8px',
                            color: '#fff',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                            padding: '12px 16px'
                          }}
                          itemStyle={{ color: '#D1D5DB' }}
                          labelStyle={{ color: '#F9FAFB', fontWeight: 600, marginBottom: '4px' }}
                          cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 pt-4 border-t border-border">
                    {costData.map((entry, index) => {
                      const hoverColors: Record<string, string> = {
                        'Purchase': 'hover:bg-slate-50',
                        'Rehab': 'hover:bg-amber-50',
                        'Financing': 'hover:bg-slate-50',
                        'Holding': 'hover:bg-gray-50',
                        'Selling': 'hover:bg-red-50',
                      };
                      const textHoverColors: Record<string, string> = {
                        'Purchase': 'group-hover:text-slate-700',
                        'Rehab': 'group-hover:text-amber-700',
                        'Financing': 'group-hover:text-slate-600',
                        'Holding': 'group-hover:text-gray-600',
                        'Selling': 'group-hover:text-red-700',
                      };
                      const gradientClasses: Record<string, string> = {
                        'Purchase': 'bg-gradient-to-br from-[#3D5A73] to-[#2B3E50]',
                        'Rehab': 'bg-gradient-to-br from-[#E8A04C] to-[#C87533]',
                        'Financing': 'bg-gradient-to-br from-[#4A6178] to-[#34495E]',
                        'Holding': 'bg-gradient-to-br from-[#7A8A99] to-[#566573]',
                        'Selling': 'bg-gradient-to-br from-[#E74C3C] to-[#C91B3C]',
                      };
                      return (
                        <div 
                          key={index} 
                          className={`flex items-center justify-between p-2.5 rounded-lg transition-colors cursor-default group ${hoverColors[entry.name] || 'hover:bg-muted'}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div 
                              className={`w-3.5 h-3.5 rounded-sm shadow-sm ${gradientClasses[entry.name] || ''}`}
                              style={!gradientClasses[entry.name] ? { backgroundColor: entry.color } : {}}
                            />
                            <span className={`text-sm text-muted-foreground ${textHoverColors[entry.name] || ''}`}>{entry.name}</span>
                          </div>
                          <span className="text-sm font-bold text-foreground">{formatCurrency(entry.value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Scenario Analysis */}
              <div className="inst-card">
                <div className="inst-header">Scenario Analysis</div>
                <div className="p-6">
                  <div className="h-64 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={scenarioData} 
                        barCategoryGap="25%"
                        margin={{ top: 30, right: 30, left: 20, bottom: 10 }}
                      >
                        <defs>
                          <linearGradient id="pessimisticGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#E74C3C" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#C0392B" stopOpacity={1}/>
                          </linearGradient>
                          <linearGradient id="baseGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3498DB" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#2B3E50" stopOpacity={1}/>
                          </linearGradient>
                          <linearGradient id="optimisticGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#F39C12" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#C87533" stopOpacity={1}/>
                          </linearGradient>
                          <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.25"/>
                          </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.7} />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 600 }} 
                          axisLine={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                          tickLine={false}
                          dy={8}
                        />
                        <YAxis 
                          tickFormatter={(val) => `$${val/1000}k`} 
                          tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 500 }} 
                          axisLine={false}
                          tickLine={false}
                          width={55}
                        />
                        <RechartsTooltip 
                          formatter={(value: number) => [formatCurrency(value), 'Profit']}
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            borderColor: '#374151', 
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                            padding: '12px 16px'
                          }}
                          labelStyle={{ color: '#F9FAFB', fontWeight: 600, marginBottom: '4px' }}
                          itemStyle={{ color: '#D1D5DB' }}
                          cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                        />
                        <Bar 
                          dataKey="profit" 
                          radius={[8, 8, 0, 0]}
                          filter="url(#barShadow)"
                          animationDuration={800}
                          animationEasing="ease-out"
                          label={({ x, y, width, value }: any) => {
                            const isNegative = value < 0;
                            return (
                              <text
                                x={x + width / 2}
                                y={isNegative ? y + 20 : y - 8}
                                fill={isNegative ? '#fff' : '#374151'}
                                textAnchor="middle"
                                fontSize={11}
                                fontWeight={700}
                                style={{ textShadow: isNegative ? 'none' : '0 1px 2px rgba(0,0,0,0.1)' }}
                              >
                                {formatCurrency(value)}
                              </text>
                            );
                          }}
                        >
                          {scenarioData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={index === 0 ? 'url(#pessimisticGradient)' : index === 1 ? 'url(#baseGradient)' : 'url(#optimisticGradient)'}
                              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="space-y-2 pt-4 border-t border-border">
                    <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-red-50 transition-colors cursor-default group">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-[#E74C3C] to-[#C0392B]"></div>
                        <span className="text-muted-foreground group-hover:text-red-700">Pessimistic (-10% ARV)</span>
                      </div>
                      <span className={`font-bold ${pessimisticProfit >= 0 ? 'text-[#C87533]' : 'text-[#C91B3C]'}`}>
                        {formatCurrency(pessimisticProfit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-blue-50 transition-colors cursor-default group">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-[#3498DB] to-[#2B3E50]"></div>
                        <span className="text-muted-foreground group-hover:text-blue-700">Base Case</span>
                      </div>
                      <span className={`font-bold ${baseProfit >= 0 ? 'text-[#C87533]' : 'text-[#C91B3C]'}`}>
                        {formatCurrency(baseProfit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-amber-50 transition-colors cursor-default group">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-[#F39C12] to-[#C87533]"></div>
                        <span className="text-muted-foreground group-hover:text-amber-700">Optimistic (+5% ARV)</span>
                      </div>
                      <span className={`font-bold ${optimisticProfit >= 0 ? 'text-[#C87533]' : 'text-[#C91B3C]'}`}>
                        {formatCurrency(optimisticProfit)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
                </TabsContent>

                {/* Sensitivity Analysis Tab */}
                <TabsContent value="sensitivity">
                  <div className="inst-card">
                    <div className="inst-header">
                      <span>Sensitivity Analysis</span>
                    </div>
                    <div className="p-6">
                      <SensitivityAnalysis baseInputs={inputs} />
                    </div>
                  </div>
                </TabsContent>

                {/* Comparison Mode Tab */}
                <TabsContent value="compare">
                  <div className="inst-card">
                    <div className="inst-header">
                      <span>Property Comparison</span>
                    </div>
                    <div className="p-6">
                      <ComparisonMode currentInputs={inputs} />
                    </div>
                  </div>
                </TabsContent>

                {/* Break-Even Analysis Tab */}
                <TabsContent value="breakeven">
                  <div className="inst-card">
                    <div className="inst-header">
                      <span>Break-Even Analysis</span>
                    </div>
                    <div className="p-6">
                      <BreakEvenAnalysis inputs={inputs} results={results} />
                    </div>
                  </div>
                </TabsContent>

                {/* Cost Per Square Foot Tab */}
                <TabsContent value="persqft">
                  <div className="inst-card">
                    <div className="inst-header">
                      <span>Cost Per Square Foot</span>
                    </div>
                    <div className="p-6">
                      <CostPerSqFt 
                        inputs={inputs} 
                        results={results} 
                        squareFootage={squareFootage}
                        onSquareFootageChange={setSquareFootage}
                      />
                    </div>
                  </div>
                </TabsContent>



                {/* Lender Comparison Tab */}
                <TabsContent value="lenders">
                  <div className="inst-card">
                    <div className="inst-header">
                      <span>Points & Fees Comparison</span>
                    </div>
                    <div className="p-6">
                      <PointsFeesComparison inputs={inputs} results={results} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

            </div>
          </div>

        </div>

        {/* EXIT STRATEGIES SECTION - Dedicated prominent section */}
        <div className="mt-12">
          <div className="inst-card border-2 border-primary/20">
            <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    Exit Strategy Analysis
                  </h2>
                  <p className="text-primary-foreground/80 text-sm mt-1">
                    Compare Fix & Flip, BRRRR, and Wholesale strategies for this property
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-primary-foreground/70">Best ROI</div>
                    <div className="font-semibold">Wholesale</div>
                  </div>
                  <div className="text-center">
                    <div className="text-primary-foreground/70">Max Profit</div>
                    <div className="font-semibold">Fix & Flip</div>
                  </div>
                  <div className="text-center">
                    <div className="text-primary-foreground/70">Long-Term</div>
                    <div className="font-semibold">BRRRR</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <ExitStrategiesTab inputs={inputs} results={results} />
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
