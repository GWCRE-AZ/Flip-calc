import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Handshake, 
  DollarSign, 
  TrendingUp, 
  Users,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Target,
  Calculator
} from 'lucide-react';
import { CalculatorInputs, CalculatorResults } from '@/lib/calculator';

interface WholesaleAnalysisProps {
  inputs: CalculatorInputs;
  results: CalculatorResults;
}

type DealType = 'assignment' | 'double_close';
type InvestorStrategy = 'flip' | 'brrrr' | 'rental';

interface WholesalerClosingCosts {
  titleEscrowFees: number;
  recordingFees: number;
  attorneyFees: number;
  otherCosts: number;
}

interface EndBuyerAnalysis {
  purchasePrice: number;
  closingCostPercent: number;
  expectedRehab: number;
  expectedARV: number;
  holdingMonths: number;
  sellingCostPercent: number;
}

const defaultWholesalerCosts: WholesalerClosingCosts = {
  titleEscrowFees: 1500,
  recordingFees: 250,
  attorneyFees: 500,
  otherCosts: 250
};

const defaultEndBuyerAnalysis: EndBuyerAnalysis = {
  purchasePrice: 0, // Will be calculated
  closingCostPercent: 3,
  expectedRehab: 45000,
  expectedARV: 375000,
  holdingMonths: 6,
  sellingCostPercent: 8
};

export function WholesaleAnalysis({ inputs, results }: WholesaleAnalysisProps) {
  const [dealType, setDealType] = useState<DealType>('assignment');
  const [investorStrategy, setInvestorStrategy] = useState<InvestorStrategy>('flip');
  const [assignmentFee, setAssignmentFee] = useState(10000);
  const [earnestMoneyDeposit, setEarnestMoneyDeposit] = useState(1000);
  const [marketingCosts, setMarketingCosts] = useState(500);
  const [showWholesalerCosts, setShowWholesalerCosts] = useState(false);
  const [wholesalerCosts, setWholesalerCosts] = useState<WholesalerClosingCosts>(defaultWholesalerCosts);
  const [endBuyer, setEndBuyer] = useState<EndBuyerAnalysis>({
    ...defaultEndBuyerAnalysis,
    purchasePrice: inputs.purchasePrice + 10000,
    expectedRehab: inputs.rehabCostSimple,
    expectedARV: inputs.arv
  });
  
  // BRRRR-specific inputs for end buyer
  const [brrrMonthlyRent, setBrrrMonthlyRent] = useState(2000);
  const [brrrRefinanceLTV, setBrrrRefinanceLTV] = useState(75);
  
  // Rental-specific inputs for end buyer
  const [rentalMonthlyRent, setRentalMonthlyRent] = useState(2000);
  const [rentalCapRate, setRentalCapRate] = useState(8);

  // Calculate wholesale deal analysis
  const wholesaleAnalysis = useMemo(() => {
    const contractPrice = inputs.purchasePrice;
    const salePrice = endBuyer.purchasePrice;
    
    // Assignment fee is the difference between contract and sale price
    const calculatedAssignmentFee = dealType === 'assignment' 
      ? assignmentFee 
      : salePrice - contractPrice;
    
    // Wholesaler's costs
    let totalWholesalerCosts = earnestMoneyDeposit + marketingCosts;
    
    if (dealType === 'double_close') {
      // Add closing costs for double close
      totalWholesalerCosts += 
        wholesalerCosts.titleEscrowFees +
        wholesalerCosts.recordingFees +
        wholesalerCosts.attorneyFees +
        wholesalerCosts.otherCosts;
      
      // For double close, also need to account for purchase closing costs
      const purchaseClosingCosts = contractPrice * 0.02; // Estimate 2%
      totalWholesalerCosts += purchaseClosingCosts;
    }
    
    // Net profit
    const grossProfit = calculatedAssignmentFee;
    const netProfit = grossProfit - totalWholesalerCosts + earnestMoneyDeposit; // EMD is returned at closing
    
    // ROI
    const cashInvested = dealType === 'assignment' 
      ? earnestMoneyDeposit + marketingCosts 
      : totalWholesalerCosts;
    const roi = (netProfit / cashInvested) * 100;
    
    // Deal viability
    let viability: 'excellent' | 'good' | 'marginal' | 'poor';
    let viabilityMessage: string;
    
    if (netProfit >= 15000 && roi >= 200) {
      viability = 'excellent';
      viabilityMessage = 'Excellent deal - Strong profit margin and ROI';
    } else if (netProfit >= 10000 && roi >= 100) {
      viability = 'good';
      viabilityMessage = 'Good deal - Solid profit potential';
    } else if (netProfit >= 5000 && roi >= 50) {
      viability = 'marginal';
      viabilityMessage = 'Marginal deal - Consider negotiating better terms';
    } else {
      viability = 'poor';
      viabilityMessage = 'Poor deal - May not be worth the effort';
    }
    
    return {
      contractPrice,
      salePrice,
      assignmentFee: calculatedAssignmentFee,
      totalWholesalerCosts,
      grossProfit,
      netProfit,
      cashInvested,
      roi,
      viability,
      viabilityMessage
    };
  }, [inputs, endBuyer, dealType, assignmentFee, earnestMoneyDeposit, marketingCosts, wholesalerCosts]);

  // Calculate end buyer analysis
  const endBuyerAnalysis = useMemo(() => {
    const purchasePrice = endBuyer.purchasePrice;
    const closingCosts = purchasePrice * (endBuyer.closingCostPercent / 100);
    const rehab = endBuyer.expectedRehab;
    const arv = endBuyer.expectedARV;
    const holdingCosts = (purchasePrice * 0.01) * endBuyer.holdingMonths; // Estimate 1% per month
    const sellingCosts = arv * (endBuyer.sellingCostPercent / 100);
    
    const totalInvestment = purchasePrice + closingCosts + rehab + holdingCosts;
    const netProceeds = arv - sellingCosts;
    const netProfit = netProceeds - totalInvestment;
    const roi = (netProfit / totalInvestment) * 100;
    
    // 70% Rule check
    const maxAllowableOffer = (arv * 0.70) - rehab;
    const meetsRule = purchasePrice <= maxAllowableOffer;
    
    // BRRRR analysis for end buyer
    let brrrAnalysis = null;
    if (investorStrategy === 'brrrr') {
      const refinanceLoanAmount = arv * (brrrRefinanceLTV / 100);
      const cashOut = refinanceLoanAmount - (purchasePrice + closingCosts + rehab) * 0.95; // Assume 95% of costs financed
      const cashLeftInDeal = Math.max(0, totalInvestment - refinanceLoanAmount);
      const monthlyPayment = refinanceLoanAmount * (0.07 / 12); // Assume 7% rate
      const monthlyCashFlow = brrrMonthlyRent - monthlyPayment - (purchasePrice * 0.01 / 12); // Rough estimate
      
      brrrAnalysis = {
        refinanceLoanAmount,
        cashOut,
        cashLeftInDeal,
        monthlyCashFlow,
        annualCashFlow: monthlyCashFlow * 12
      };
    }
    
    // Rental analysis for end buyer
    let rentalAnalysis = null;
    if (investorStrategy === 'rental') {
      const annualRent = rentalMonthlyRent * 12;
      const operatingExpenses = annualRent * 0.40; // 40% expense ratio
      const noi = annualRent - operatingExpenses;
      const actualCapRate = (noi / totalInvestment) * 100;
      const cashFlow = rentalMonthlyRent - (totalInvestment * 0.006); // Rough monthly cost estimate
      
      rentalAnalysis = {
        annualRent,
        noi,
        actualCapRate,
        monthlyCashFlow: cashFlow
      };
    }
    
    return {
      purchasePrice,
      closingCosts,
      rehab,
      holdingCosts,
      sellingCosts,
      totalInvestment,
      netProceeds,
      netProfit,
      roi,
      maxAllowableOffer,
      meetsRule,
      brrrAnalysis,
      rentalAnalysis
    };
  }, [endBuyer, investorStrategy, brrrMonthlyRent, brrrRefinanceLTV, rentalMonthlyRent, rentalCapRate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
            <Handshake className="h-5 w-5" />
            Wholesale Strategy Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-700 mb-4">
            Analyze wholesale deals from both the wholesaler's and end buyer's perspective.
          </p>
          
          <Tabs defaultValue="deal" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="deal">Deal Setup</TabsTrigger>
              <TabsTrigger value="buyer">End Buyer</TabsTrigger>
              <TabsTrigger value="results">Analysis</TabsTrigger>
            </TabsList>
            
            {/* Deal Setup Tab */}
            <TabsContent value="deal" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-600">Deal Type</Label>
                  <Select value={dealType} onValueChange={(v) => setDealType(v as DealType)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="double_close">Double Close</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs text-gray-600">Contract Price (to Seller)</Label>
                  <Input
                    type="number"
                    value={inputs.purchasePrice}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                
                {dealType === 'assignment' ? (
                  <div>
                    <Label className="text-xs text-gray-600">Assignment Fee</Label>
                    <Input
                      type="number"
                      value={assignmentFee}
                      onChange={(e) => setAssignmentFee(Number(e.target.value))}
                      className="bg-white"
                    />
                  </div>
                ) : (
                  <div>
                    <Label className="text-xs text-gray-600">Sale Price (to Investor)</Label>
                    <Input
                      type="number"
                      value={endBuyer.purchasePrice}
                      onChange={(e) => setEndBuyer({...endBuyer, purchasePrice: Number(e.target.value)})}
                      className="bg-white"
                    />
                  </div>
                )}
                
                <div>
                  <Label className="text-xs text-gray-600">Earnest Money Deposit</Label>
                  <Input
                    type="number"
                    value={earnestMoneyDeposit}
                    onChange={(e) => setEarnestMoneyDeposit(Number(e.target.value))}
                    className="bg-white"
                  />
                </div>
                
                <div>
                  <Label className="text-xs text-gray-600">Marketing Costs</Label>
                  <Input
                    type="number"
                    value={marketingCosts}
                    onChange={(e) => setMarketingCosts(Number(e.target.value))}
                    className="bg-white"
                  />
                </div>
              </div>
              
              {/* Deal Type Info */}
              <div className={`p-3 rounded-lg ${dealType === 'assignment' ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {dealType === 'assignment' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                  )}
                  <span className="font-medium text-sm">
                    {dealType === 'assignment' ? 'Assignment Contract' : 'Double Close Transaction'}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  {dealType === 'assignment' 
                    ? 'You assign your contract rights to the end buyer for a fee. Minimal closing costs, but your profit is visible to all parties.'
                    : 'You purchase the property and immediately resell it. Higher closing costs, but your profit remains private.'}
                </p>
              </div>
              
              {/* Double Close Costs */}
              {dealType === 'double_close' && (
                <div className="border-t pt-4">
                  <button
                    onClick={() => setShowWholesalerCosts(!showWholesalerCosts)}
                    className="flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-800"
                  >
                    {showWholesalerCosts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    Itemize Closing Costs
                  </button>
                  
                  {showWholesalerCosts && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <Label className="text-xs text-gray-600">Title/Escrow Fees</Label>
                        <Input
                          type="number"
                          value={wholesalerCosts.titleEscrowFees}
                          onChange={(e) => setWholesalerCosts({...wholesalerCosts, titleEscrowFees: Number(e.target.value)})}
                          className="bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Recording Fees</Label>
                        <Input
                          type="number"
                          value={wholesalerCosts.recordingFees}
                          onChange={(e) => setWholesalerCosts({...wholesalerCosts, recordingFees: Number(e.target.value)})}
                          className="bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Attorney Fees</Label>
                        <Input
                          type="number"
                          value={wholesalerCosts.attorneyFees}
                          onChange={(e) => setWholesalerCosts({...wholesalerCosts, attorneyFees: Number(e.target.value)})}
                          className="bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Other Costs</Label>
                        <Input
                          type="number"
                          value={wholesalerCosts.otherCosts}
                          onChange={(e) => setWholesalerCosts({...wholesalerCosts, otherCosts: Number(e.target.value)})}
                          className="bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            {/* End Buyer Tab */}
            <TabsContent value="buyer" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-600">Investor Strategy</Label>
                  <Select value={investorStrategy} onValueChange={(v) => setInvestorStrategy(v as InvestorStrategy)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flip">Fix & Flip</SelectItem>
                      <SelectItem value="brrrr">BRRRR</SelectItem>
                      <SelectItem value="rental">Buy & Hold Rental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs text-gray-600">End Buyer's Purchase Price</Label>
                  <Input
                    type="number"
                    value={endBuyer.purchasePrice}
                    onChange={(e) => setEndBuyer({...endBuyer, purchasePrice: Number(e.target.value)})}
                    className="bg-white"
                  />
                </div>
                
                <div>
                  <Label className="text-xs text-gray-600">Expected Rehab Cost</Label>
                  <Input
                    type="number"
                    value={endBuyer.expectedRehab}
                    onChange={(e) => setEndBuyer({...endBuyer, expectedRehab: Number(e.target.value)})}
                    className="bg-white"
                  />
                </div>
                
                <div>
                  <Label className="text-xs text-gray-600">Expected ARV</Label>
                  <Input
                    type="number"
                    value={endBuyer.expectedARV}
                    onChange={(e) => setEndBuyer({...endBuyer, expectedARV: Number(e.target.value)})}
                    className="bg-white"
                  />
                </div>
                
                {investorStrategy === 'flip' && (
                  <>
                    <div>
                      <Label className="text-xs text-gray-600">Holding Period (Months)</Label>
                      <Input
                        type="number"
                        value={endBuyer.holdingMonths}
                        onChange={(e) => setEndBuyer({...endBuyer, holdingMonths: Number(e.target.value)})}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Selling Costs %</Label>
                      <Input
                        type="number"
                        value={endBuyer.sellingCostPercent}
                        onChange={(e) => setEndBuyer({...endBuyer, sellingCostPercent: Number(e.target.value)})}
                        className="bg-white"
                      />
                    </div>
                  </>
                )}
                
                {investorStrategy === 'brrrr' && (
                  <>
                    <div>
                      <Label className="text-xs text-gray-600">Expected Monthly Rent</Label>
                      <Input
                        type="number"
                        value={brrrMonthlyRent}
                        onChange={(e) => setBrrrMonthlyRent(Number(e.target.value))}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Refinance LTV %</Label>
                      <Input
                        type="number"
                        value={brrrRefinanceLTV}
                        onChange={(e) => setBrrrRefinanceLTV(Number(e.target.value))}
                        className="bg-white"
                      />
                    </div>
                  </>
                )}
                
                {investorStrategy === 'rental' && (
                  <>
                    <div>
                      <Label className="text-xs text-gray-600">Expected Monthly Rent</Label>
                      <Input
                        type="number"
                        value={rentalMonthlyRent}
                        onChange={(e) => setRentalMonthlyRent(Number(e.target.value))}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Target Cap Rate %</Label>
                      <Input
                        type="number"
                        value={rentalCapRate}
                        onChange={(e) => setRentalCapRate(Number(e.target.value))}
                        className="bg-white"
                      />
                    </div>
                  </>
                )}
              </div>
              
              {/* 70% Rule Check */}
              <div className={`p-3 rounded-lg ${endBuyerAnalysis.meetsRule ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {endBuyerAnalysis.meetsRule ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium text-sm">70% Rule Check</span>
                </div>
                <div className="text-xs text-gray-600">
                  <p>Max Allowable Offer: {formatCurrency(endBuyerAnalysis.maxAllowableOffer)}</p>
                  <p>End Buyer's Price: {formatCurrency(endBuyer.purchasePrice)}</p>
                  <p className={endBuyerAnalysis.meetsRule ? 'text-green-600' : 'text-red-600'}>
                    {endBuyerAnalysis.meetsRule 
                      ? '✓ Price meets 70% rule - attractive to investors'
                      : '✗ Price exceeds 70% rule - may be harder to sell'}
                  </p>
                </div>
              </div>
            </TabsContent>
            
            {/* Results Tab */}
            <TabsContent value="results" className="space-y-4">
              {/* Wholesaler's Analysis */}
              <div className="p-4 bg-white rounded-lg border">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-800">
                  <DollarSign className="h-4 w-4" />
                  Your Wholesale Profit
                </h4>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <div className="text-xs text-amber-600 uppercase">Assignment Fee</div>
                    <div className="text-xl font-bold text-amber-700">{formatCurrency(wholesaleAnalysis.assignmentFee)}</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-xs text-green-600 uppercase">Net Profit</div>
                    <div className="text-xl font-bold text-green-700">{formatCurrency(wholesaleAnalysis.netProfit)}</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-blue-600 uppercase">Cash Invested</div>
                    <div className="text-xl font-bold text-blue-700">{formatCurrency(wholesaleAnalysis.cashInvested)}</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-xs text-purple-600 uppercase">ROI</div>
                    <div className="text-xl font-bold text-purple-700">{formatPercent(wholesaleAnalysis.roi)}</div>
                  </div>
                </div>
                
                {/* Deal Viability */}
                <div className={`p-3 rounded-lg ${
                  wholesaleAnalysis.viability === 'excellent' ? 'bg-green-100 border border-green-300' :
                  wholesaleAnalysis.viability === 'good' ? 'bg-blue-100 border border-blue-300' :
                  wholesaleAnalysis.viability === 'marginal' ? 'bg-yellow-100 border border-yellow-300' :
                  'bg-red-100 border border-red-300'
                }`}>
                  <div className="flex items-center gap-2">
                    {wholesaleAnalysis.viability === 'excellent' || wholesaleAnalysis.viability === 'good' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    )}
                    <span className="font-semibold capitalize">{wholesaleAnalysis.viability} Deal</span>
                  </div>
                  <p className="text-sm mt-1">{wholesaleAnalysis.viabilityMessage}</p>
                </div>
              </div>
              
              {/* End Buyer's Analysis */}
              <div className="p-4 bg-white rounded-lg border">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-800">
                  <Users className="h-4 w-4" />
                  End Buyer's Potential ({investorStrategy === 'flip' ? 'Fix & Flip' : investorStrategy === 'brrrr' ? 'BRRRR' : 'Rental'})
                </h4>
                
                {investorStrategy === 'flip' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-gray-500">Total Investment</span>
                        <div className="font-semibold">{formatCurrency(endBuyerAnalysis.totalInvestment)}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Net Proceeds (after sale)</span>
                        <div className="font-semibold">{formatCurrency(endBuyerAnalysis.netProceeds)}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Expected Profit</span>
                        <div className={`font-semibold ${endBuyerAnalysis.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(endBuyerAnalysis.netProfit)}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Expected ROI</span>
                        <div className={`font-semibold ${endBuyerAnalysis.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(endBuyerAnalysis.roi)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {investorStrategy === 'brrrr' && endBuyerAnalysis.brrrAnalysis && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-gray-500">Refinance Loan</span>
                        <div className="font-semibold">{formatCurrency(endBuyerAnalysis.brrrAnalysis.refinanceLoanAmount)}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Cash Left in Deal</span>
                        <div className="font-semibold">{formatCurrency(endBuyerAnalysis.brrrAnalysis.cashLeftInDeal)}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Monthly Cash Flow</span>
                        <div className={`font-semibold ${endBuyerAnalysis.brrrAnalysis.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(endBuyerAnalysis.brrrAnalysis.monthlyCashFlow)}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Annual Cash Flow</span>
                        <div className={`font-semibold ${endBuyerAnalysis.brrrAnalysis.annualCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(endBuyerAnalysis.brrrAnalysis.annualCashFlow)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {investorStrategy === 'rental' && endBuyerAnalysis.rentalAnalysis && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-gray-500">Annual Rent</span>
                        <div className="font-semibold">{formatCurrency(endBuyerAnalysis.rentalAnalysis.annualRent)}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">NOI</span>
                        <div className="font-semibold">{formatCurrency(endBuyerAnalysis.rentalAnalysis.noi)}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Cap Rate</span>
                        <div className="font-semibold">{formatPercent(endBuyerAnalysis.rentalAnalysis.actualCapRate)}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Monthly Cash Flow</span>
                        <div className={`font-semibold ${endBuyerAnalysis.rentalAnalysis.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(endBuyerAnalysis.rentalAnalysis.monthlyCashFlow)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-3">
                  * End buyer analysis helps you market the deal to investors by showing their potential returns.
                </p>
              </div>
              
              {/* Suggested Offer Price */}
              <div className="p-4 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg border border-amber-300">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Suggested Pricing
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Your Contract Price:</span>
                    <div className="font-bold text-lg">{formatCurrency(inputs.purchasePrice)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Sell to Investor at:</span>
                    <div className="font-bold text-lg">{formatCurrency(endBuyer.purchasePrice)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Your Spread:</span>
                    <div className="font-bold text-lg text-green-600">{formatCurrency(wholesaleAnalysis.assignmentFee)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Investor's MAO:</span>
                    <div className="font-bold text-lg">{formatCurrency(endBuyerAnalysis.maxAllowableOffer)}</div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
