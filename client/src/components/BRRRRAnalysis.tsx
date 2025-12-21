import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Home, 
  DollarSign, 
  Percent, 
  TrendingUp, 
  Building2, 
  Calculator,
  ChevronDown,
  ChevronUp,
  Info,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { CalculatorInputs, CalculatorResults } from '@/lib/calculator';

interface BRRRRAnalysisProps {
  inputs: CalculatorInputs;
  results: CalculatorResults;
}

type RefinanceLoanType = '15_year' | '30_year' | 'dscr';

interface RefinanceCosts {
  loanPoints: number;
  appraisalFee: number;
  titleInsurance: number;
  recordingFees: number;
  attorneyFees: number;
  otherCosts: number;
}

interface OperatingExpenses {
  propertyTaxes: number;
  insurance: number;
  maintenance: number;
  propertyManagement: number;
  capEx: number;
  vacancyRate: number;
  hoaFees: number;
  utilities: number;
}

interface DSCRInputs {
  grossMonthlyRent: number;
  interestRate: number;
  loanTerm: number;
  downPayment: number;
  interestOnly: boolean;
}

const defaultRefinanceCosts: RefinanceCosts = {
  loanPoints: 1,
  appraisalFee: 500,
  titleInsurance: 1500,
  recordingFees: 250,
  attorneyFees: 750,
  otherCosts: 500
};

const defaultOperatingExpenses: OperatingExpenses = {
  propertyTaxes: 250,
  insurance: 100,
  maintenance: 0, // Will be calculated as % of rent
  propertyManagement: 0, // Will be calculated as % of rent
  capEx: 0, // Will be calculated as % of rent
  vacancyRate: 8,
  hoaFees: 0,
  utilities: 0
};

const defaultDSCRInputs: DSCRInputs = {
  grossMonthlyRent: 2000,
  interestRate: 8,
  loanTerm: 30,
  downPayment: 25,
  interestOnly: false
};

export function BRRRRAnalysis({ inputs, results }: BRRRRAnalysisProps) {
  const [refinanceLoanType, setRefinanceLoanType] = useState<RefinanceLoanType>('30_year');
  const [refinanceLTV, setRefinanceLTV] = useState(75);
  const [refinanceRate, setRefinanceRate] = useState(7);
  const [monthlyRent, setMonthlyRent] = useState(2000);
  const [showRefinanceCosts, setShowRefinanceCosts] = useState(false);
  const [refinanceCosts, setRefinanceCosts] = useState<RefinanceCosts>(defaultRefinanceCosts);
  const [operatingExpenses, setOperatingExpenses] = useState<OperatingExpenses>(defaultOperatingExpenses);
  const [maintenancePercent, setMaintenancePercent] = useState(5);
  const [managementPercent, setManagementPercent] = useState(10);
  const [capExPercent, setCapExPercent] = useState(5);
  const [dscrInputs, setDSCRInputs] = useState<DSCRInputs>(defaultDSCRInputs);
  const [additionalDownPayment, setAdditionalDownPayment] = useState(0);
  const [showOperatingExpenses, setShowOperatingExpenses] = useState(false);
  const [pmiRate, setPmiRate] = useState(0.5);
  const [hasPMI, setHasPMI] = useState(false);

  // Calculate refinance loan details
  const refinanceAnalysis = useMemo(() => {
    const arv = inputs.arv;
    const maxLoanAmount = arv * (refinanceLTV / 100);
    
    // Total investment before refinance
    const totalInvestment = results.totalProjectCost;
    
    // Calculate refinance costs
    const totalRefinanceCosts = showRefinanceCosts ? (
      (maxLoanAmount * refinanceCosts.loanPoints / 100) +
      refinanceCosts.appraisalFee +
      refinanceCosts.titleInsurance +
      refinanceCosts.recordingFees +
      refinanceCosts.attorneyFees +
      refinanceCosts.otherCosts
    ) : (arv * 0.02); // Default 2% of ARV if not itemized
    
    // Cash out from refinance
    const cashOut = maxLoanAmount - totalRefinanceCosts;
    
    // Cash left in deal
    let cashLeftInDeal = totalInvestment - cashOut;
    
    // If cash left is negative, we got all our money back plus extra
    const needsAdditionalDownPayment = cashLeftInDeal < 0 ? false : cashLeftInDeal > 0;
    
    // If equity is insufficient, add additional down payment
    if (cashLeftInDeal > 0 && additionalDownPayment > 0) {
      cashLeftInDeal = Math.max(0, cashLeftInDeal - additionalDownPayment);
    }
    
    // Calculate loan term in months
    const loanTermMonths = refinanceLoanType === '15_year' ? 180 : 360;
    const monthlyRate = refinanceRate / 100 / 12;
    
    // Monthly P&I payment (amortized)
    const monthlyPI = maxLoanAmount * (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) / 
                      (Math.pow(1 + monthlyRate, loanTermMonths) - 1);
    
    // PMI if applicable (typically when LTV > 80%)
    const monthlyPMI = hasPMI && refinanceLTV > 80 ? (maxLoanAmount * pmiRate / 100 / 12) : 0;
    
    // Operating expenses
    const maintenanceCost = monthlyRent * maintenancePercent / 100;
    const managementCost = monthlyRent * managementPercent / 100;
    const capExCost = monthlyRent * capExPercent / 100;
    const vacancyLoss = monthlyRent * operatingExpenses.vacancyRate / 100;
    
    const totalOperatingExpenses = 
      operatingExpenses.propertyTaxes +
      operatingExpenses.insurance +
      maintenanceCost +
      managementCost +
      capExCost +
      operatingExpenses.hoaFees +
      operatingExpenses.utilities;
    
    // Net Operating Income (NOI)
    const effectiveGrossIncome = monthlyRent - vacancyLoss;
    const noi = effectiveGrossIncome - totalOperatingExpenses;
    
    // Monthly cash flow
    const totalDebtService = monthlyPI + monthlyPMI;
    const monthlyCashFlow = noi - totalDebtService;
    const annualCashFlow = monthlyCashFlow * 12;
    
    // Cash-on-Cash Return (based on cash left in deal)
    const actualCashInDeal = Math.max(cashLeftInDeal, 1); // Avoid division by zero
    const cashOnCash = (annualCashFlow / actualCashInDeal) * 100;
    
    // Equity position
    const equityPosition = arv - maxLoanAmount;
    
    // DSCR calculation
    const dscr = noi / totalDebtService;
    
    return {
      maxLoanAmount,
      totalRefinanceCosts,
      cashOut,
      cashLeftInDeal: Math.max(0, cashLeftInDeal),
      needsAdditionalDownPayment,
      monthlyPI,
      monthlyPMI,
      totalDebtService,
      totalOperatingExpenses,
      effectiveGrossIncome,
      noi,
      monthlyCashFlow,
      annualCashFlow,
      cashOnCash,
      equityPosition,
      dscr,
      vacancyLoss,
      maintenanceCost,
      managementCost,
      capExCost
    };
  }, [
    inputs, results, refinanceLTV, refinanceRate, monthlyRent, 
    refinanceCosts, operatingExpenses, maintenancePercent, 
    managementPercent, capExPercent, showRefinanceCosts,
    additionalDownPayment, refinanceLoanType, hasPMI, pmiRate
  ]);

  // DSCR-specific calculations
  const dscrAnalysis = useMemo(() => {
    if (refinanceLoanType !== 'dscr') return null;
    
    const arv = inputs.arv;
    const loanAmount = arv * (1 - dscrInputs.downPayment / 100);
    const monthlyRate = dscrInputs.interestRate / 100 / 12;
    const loanTermMonths = dscrInputs.loanTerm * 12;
    
    // Monthly payment
    let monthlyPayment: number;
    if (dscrInputs.interestOnly) {
      monthlyPayment = loanAmount * monthlyRate;
    } else {
      monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) / 
                       (Math.pow(1 + monthlyRate, loanTermMonths) - 1);
    }
    
    // Total debt service (PITIA)
    const totalDebtService = monthlyPayment + 
                            operatingExpenses.propertyTaxes + 
                            operatingExpenses.insurance + 
                            operatingExpenses.hoaFees;
    
    // DSCR
    const dscr = dscrInputs.grossMonthlyRent / totalDebtService;
    
    // Qualification status
    let qualificationStatus: 'excellent' | 'good' | 'marginal' | 'difficult';
    let qualificationMessage: string;
    
    if (dscr >= 1.25) {
      qualificationStatus = 'excellent';
      qualificationMessage = 'Excellent - Should qualify easily with standard terms';
    } else if (dscr >= 1.0) {
      qualificationStatus = 'good';
      qualificationMessage = 'Good - Should qualify, may need slightly higher rate';
    } else if (dscr >= 0.75) {
      qualificationStatus = 'marginal';
      qualificationMessage = 'Marginal - May qualify with 25-30% down payment and higher rate';
    } else {
      qualificationStatus = 'difficult';
      qualificationMessage = 'Difficult - May need 35%+ down payment or may not qualify';
    }
    
    return {
      loanAmount,
      monthlyPayment,
      totalDebtService,
      dscr,
      qualificationStatus,
      qualificationMessage,
      downPaymentAmount: arv * dscrInputs.downPayment / 100
    };
  }, [dscrInputs, operatingExpenses, inputs.arv, refinanceLoanType]);

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
      {/* BRRRR Overview */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
            <Building2 className="h-5 w-5" />
            BRRRR Strategy Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-700 mb-4">
            Buy, Rehab, Rent, Refinance, Repeat - Analyze the complete BRRRR lifecycle from acquisition through long-term hold.
          </p>
          
          <Tabs defaultValue="refinance" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="refinance">Refinance</TabsTrigger>
              <TabsTrigger value="rental">Rental Income</TabsTrigger>
              <TabsTrigger value="results">Analysis</TabsTrigger>
            </TabsList>
            
            {/* Refinance Tab */}
            <TabsContent value="refinance" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-600">Refinance Loan Type</Label>
                  <Select value={refinanceLoanType} onValueChange={(v) => setRefinanceLoanType(v as RefinanceLoanType)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15_year">15-Year Fixed</SelectItem>
                      <SelectItem value="30_year">30-Year Fixed</SelectItem>
                      <SelectItem value="dscr">DSCR Loan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {refinanceLoanType !== 'dscr' ? (
                  <>
                    <div>
                      <Label className="text-xs text-gray-600">Refinance LTV %</Label>
                      <Input
                        type="number"
                        value={refinanceLTV}
                        onChange={(e) => setRefinanceLTV(Number(e.target.value))}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Interest Rate %</Label>
                      <Input
                        type="number"
                        step="0.125"
                        value={refinanceRate}
                        onChange={(e) => setRefinanceRate(Number(e.target.value))}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Monthly Rent</Label>
                      <Input
                        type="number"
                        value={monthlyRent}
                        onChange={(e) => setMonthlyRent(Number(e.target.value))}
                        className="bg-white"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-xs text-gray-600">Gross Monthly Rent</Label>
                      <Input
                        type="number"
                        value={dscrInputs.grossMonthlyRent}
                        onChange={(e) => setDSCRInputs({...dscrInputs, grossMonthlyRent: Number(e.target.value)})}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Down Payment %</Label>
                      <Input
                        type="number"
                        value={dscrInputs.downPayment}
                        onChange={(e) => setDSCRInputs({...dscrInputs, downPayment: Number(e.target.value)})}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Interest Rate %</Label>
                      <Input
                        type="number"
                        step="0.125"
                        value={dscrInputs.interestRate}
                        onChange={(e) => setDSCRInputs({...dscrInputs, interestRate: Number(e.target.value)})}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Loan Term (Years)</Label>
                      <Select 
                        value={dscrInputs.loanTerm.toString()} 
                        onValueChange={(v) => setDSCRInputs({...dscrInputs, loanTerm: Number(v)})}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 Years</SelectItem>
                          <SelectItem value="20">20 Years</SelectItem>
                          <SelectItem value="25">25 Years</SelectItem>
                          <SelectItem value="30">30 Years</SelectItem>
                          <SelectItem value="40">40 Years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <Switch
                        checked={dscrInputs.interestOnly}
                        onCheckedChange={(checked) => setDSCRInputs({...dscrInputs, interestOnly: checked})}
                      />
                      <Label className="text-xs text-gray-600">Interest-Only Payments</Label>
                    </div>
                  </>
                )}
              </div>
              
              {/* PMI Option */}
              {refinanceLoanType !== 'dscr' && refinanceLTV > 80 && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">LTV &gt; 80% - PMI May Apply</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch checked={hasPMI} onCheckedChange={setHasPMI} />
                      <Label className="text-xs">Include PMI</Label>
                    </div>
                    {hasPMI && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">PMI Rate %</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={pmiRate}
                          onChange={(e) => setPmiRate(Number(e.target.value))}
                          className="w-20 h-8 bg-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Refinance Costs Toggle */}
              <div className="border-t pt-4">
                <button
                  onClick={() => setShowRefinanceCosts(!showRefinanceCosts)}
                  className="flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  {showRefinanceCosts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  Itemize Refinance Costs
                </button>
                
                {showRefinanceCosts && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <Label className="text-xs text-gray-600">Loan Points %</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={refinanceCosts.loanPoints}
                        onChange={(e) => setRefinanceCosts({...refinanceCosts, loanPoints: Number(e.target.value)})}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Appraisal Fee</Label>
                      <Input
                        type="number"
                        value={refinanceCosts.appraisalFee}
                        onChange={(e) => setRefinanceCosts({...refinanceCosts, appraisalFee: Number(e.target.value)})}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Title Insurance</Label>
                      <Input
                        type="number"
                        value={refinanceCosts.titleInsurance}
                        onChange={(e) => setRefinanceCosts({...refinanceCosts, titleInsurance: Number(e.target.value)})}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Recording Fees</Label>
                      <Input
                        type="number"
                        value={refinanceCosts.recordingFees}
                        onChange={(e) => setRefinanceCosts({...refinanceCosts, recordingFees: Number(e.target.value)})}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Attorney Fees</Label>
                      <Input
                        type="number"
                        value={refinanceCosts.attorneyFees}
                        onChange={(e) => setRefinanceCosts({...refinanceCosts, attorneyFees: Number(e.target.value)})}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Other Costs</Label>
                      <Input
                        type="number"
                        value={refinanceCosts.otherCosts}
                        onChange={(e) => setRefinanceCosts({...refinanceCosts, otherCosts: Number(e.target.value)})}
                        className="bg-white"
                      />
                    </div>
                  </div>
                )}
                
                <div className="mt-3 p-2 bg-white rounded text-sm">
                  <span className="text-gray-600">Total Refinance Costs: </span>
                  <span className="font-semibold">{formatCurrency(refinanceAnalysis.totalRefinanceCosts)}</span>
                </div>
              </div>
              
              {/* Additional Down Payment for Insufficient Equity */}
              {refinanceAnalysis.needsAdditionalDownPayment && (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Insufficient Equity for Full Cash-Out</span>
                  </div>
                  <p className="text-xs text-orange-700 mb-2">
                    You'll have {formatCurrency(refinanceAnalysis.cashLeftInDeal)} left in the deal after refinance.
                    Add additional down payment to reduce cash left in deal.
                  </p>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Additional Down Payment</Label>
                    <Input
                      type="number"
                      value={additionalDownPayment}
                      onChange={(e) => setAdditionalDownPayment(Number(e.target.value))}
                      className="w-32 h-8 bg-white"
                    />
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Rental Income Tab */}
            <TabsContent value="rental" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-600">Monthly Rent</Label>
                  <Input
                    type="number"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(Number(e.target.value))}
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Vacancy Rate %</Label>
                  <Input
                    type="number"
                    value={operatingExpenses.vacancyRate}
                    onChange={(e) => setOperatingExpenses({...operatingExpenses, vacancyRate: Number(e.target.value)})}
                    className="bg-white"
                  />
                </div>
              </div>
              
              {/* Operating Expenses Toggle */}
              <div className="border-t pt-4">
                <button
                  onClick={() => setShowOperatingExpenses(!showOperatingExpenses)}
                  className="flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  {showOperatingExpenses ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  Itemize Operating Expenses
                </button>
                
                {showOperatingExpenses && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <Label className="text-xs text-gray-600">Property Taxes /mo</Label>
                      <Input
                        type="number"
                        value={operatingExpenses.propertyTaxes}
                        onChange={(e) => setOperatingExpenses({...operatingExpenses, propertyTaxes: Number(e.target.value)})}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Insurance /mo</Label>
                      <Input
                        type="number"
                        value={operatingExpenses.insurance}
                        onChange={(e) => setOperatingExpenses({...operatingExpenses, insurance: Number(e.target.value)})}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Maintenance % of Rent</Label>
                      <Input
                        type="number"
                        value={maintenancePercent}
                        onChange={(e) => setMaintenancePercent(Number(e.target.value))}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Property Mgmt % of Rent</Label>
                      <Input
                        type="number"
                        value={managementPercent}
                        onChange={(e) => setManagementPercent(Number(e.target.value))}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">CapEx % of Rent</Label>
                      <Input
                        type="number"
                        value={capExPercent}
                        onChange={(e) => setCapExPercent(Number(e.target.value))}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">HOA Fees /mo</Label>
                      <Input
                        type="number"
                        value={operatingExpenses.hoaFees}
                        onChange={(e) => setOperatingExpenses({...operatingExpenses, hoaFees: Number(e.target.value)})}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Utilities /mo (if owner-paid)</Label>
                      <Input
                        type="number"
                        value={operatingExpenses.utilities}
                        onChange={(e) => setOperatingExpenses({...operatingExpenses, utilities: Number(e.target.value)})}
                        className="bg-white"
                      />
                    </div>
                  </div>
                )}
                
                <div className="mt-3 p-3 bg-white rounded space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Gross Rent:</span>
                    <span className="font-medium">{formatCurrency(monthlyRent)}/mo</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Vacancy Loss ({operatingExpenses.vacancyRate}%):</span>
                    <span className="font-medium text-red-600">-{formatCurrency(refinanceAnalysis.vacancyLoss)}/mo</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Operating Expenses:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(refinanceAnalysis.totalOperatingExpenses)}/mo</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t pt-1">
                    <span>Net Operating Income (NOI):</span>
                    <span className={refinanceAnalysis.noi >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(refinanceAnalysis.noi)}/mo
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Results Tab */}
            <TabsContent value="results" className="space-y-4">
              {/* DSCR Analysis (if DSCR loan selected) */}
              {refinanceLoanType === 'dscr' && dscrAnalysis && (
                <div className={`p-4 rounded-lg border ${
                  dscrAnalysis.qualificationStatus === 'excellent' ? 'bg-green-50 border-green-200' :
                  dscrAnalysis.qualificationStatus === 'good' ? 'bg-blue-50 border-blue-200' :
                  dscrAnalysis.qualificationStatus === 'marginal' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {dscrAnalysis.qualificationStatus === 'excellent' || dscrAnalysis.qualificationStatus === 'good' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    )}
                    <span className="font-semibold">DSCR: {dscrAnalysis.dscr.toFixed(2)}</span>
                  </div>
                  <p className="text-sm">{dscrAnalysis.qualificationMessage}</p>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                    <div>
                      <span className="text-gray-600">Loan Amount:</span>
                      <span className="font-medium ml-2">{formatCurrency(dscrAnalysis.loanAmount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Down Payment:</span>
                      <span className="font-medium ml-2">{formatCurrency(dscrAnalysis.downPaymentAmount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Monthly Payment:</span>
                      <span className="font-medium ml-2">{formatCurrency(dscrAnalysis.monthlyPayment)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Debt Service:</span>
                      <span className="font-medium ml-2">{formatCurrency(dscrAnalysis.totalDebtService)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-xs text-gray-500 uppercase">Refinance Loan</div>
                  <div className="text-xl font-bold text-blue-600">{formatCurrency(refinanceAnalysis.maxLoanAmount)}</div>
                  <div className="text-xs text-gray-500">{refinanceLTV}% LTV of {formatCurrency(inputs.arv)} ARV</div>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-xs text-gray-500 uppercase">Cash Out</div>
                  <div className="text-xl font-bold text-green-600">{formatCurrency(refinanceAnalysis.cashOut)}</div>
                  <div className="text-xs text-gray-500">After refinance costs</div>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-xs text-gray-500 uppercase">Cash Left in Deal</div>
                  <div className={`text-xl font-bold ${refinanceAnalysis.cashLeftInDeal <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                    {formatCurrency(refinanceAnalysis.cashLeftInDeal)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {refinanceAnalysis.cashLeftInDeal <= 0 ? 'All money recovered!' : 'Still invested'}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-xs text-gray-500 uppercase">Equity Position</div>
                  <div className="text-xl font-bold text-purple-600">{formatCurrency(refinanceAnalysis.equityPosition)}</div>
                  <div className="text-xs text-gray-500">{formatPercent((refinanceAnalysis.equityPosition / inputs.arv) * 100)} of ARV</div>
                </div>
              </div>
              
              {/* Cash Flow Analysis */}
              <div className="p-4 bg-white rounded-lg border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Cash Flow Analysis
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Monthly P&I Payment:</span>
                    <span className="font-medium">{formatCurrency(refinanceAnalysis.monthlyPI)}</span>
                  </div>
                  {refinanceAnalysis.monthlyPMI > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Monthly PMI:</span>
                      <span className="font-medium">{formatCurrency(refinanceAnalysis.monthlyPMI)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Debt Service:</span>
                    <span className="font-medium">{formatCurrency(refinanceAnalysis.totalDebtService)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">NOI:</span>
                    <span className="font-medium">{formatCurrency(refinanceAnalysis.noi)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t pt-2">
                    <span>Monthly Cash Flow:</span>
                    <span className={refinanceAnalysis.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(refinanceAnalysis.monthlyCashFlow)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Annual Cash Flow:</span>
                    <span className={refinanceAnalysis.annualCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(refinanceAnalysis.annualCashFlow)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Returns */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <h4 className="font-semibold mb-3 text-green-800">Investment Returns</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-green-600 uppercase">Cash-on-Cash Return</div>
                    <div className={`text-2xl font-bold ${refinanceAnalysis.cashOnCash >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {refinanceAnalysis.cashLeftInDeal > 0 ? formatPercent(refinanceAnalysis.cashOnCash) : '∞'}
                    </div>
                    <div className="text-xs text-green-600">Annual return on cash invested</div>
                  </div>
                  <div>
                    <div className="text-xs text-green-600 uppercase">DSCR</div>
                    <div className={`text-2xl font-bold ${refinanceAnalysis.dscr >= 1.25 ? 'text-green-700' : refinanceAnalysis.dscr >= 1 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {refinanceAnalysis.dscr.toFixed(2)}
                    </div>
                    <div className="text-xs text-green-600">Debt Service Coverage Ratio</div>
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
