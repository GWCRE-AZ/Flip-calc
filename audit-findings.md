# Calculator Audit Findings

## calculator.ts Review

### Potential Issues Found:

1. **Line 331 - Total Loan Interest Calculation Bug**
   - Current: `totalLoanInterest = monthlyLoanPayment * inputs.holdingPeriodMonths;`
   - Issue: This calculates total PAYMENTS during holding period, not just interest
   - For interest-only loans, this is correct (payment = interest)
   - For amortized loans, this includes principal, overstating interest cost
   - **SEVERITY: MEDIUM** - Affects amortized loan calculations

2. **Line 335 - Cash Purchase Down Payment**
   - Current: `downPayment = inputs.purchasePrice + totalRehabCost;`
   - This is correct for cash purchases (all cash needed upfront)

3. **Line 429-430 - ROI and Cash-on-Cash**
   - ROI = netProfit / totalProjectCost - CORRECT
   - Cash-on-Cash = netProfit / totalCashNeeded - CORRECT

4. **Selling Costs - Seller Concessions**
   - Line 368: `totalSellingCosts = sellingCommission + sellingClosingCosts + inputs.sellerConcessions;`
   - Note: sellerConcessions is in the interface but not in the UI input fields
   - **SEVERITY: LOW** - Feature exists but not exposed in UI

### Calculations Verified as Correct:
- Purchase closing costs calculation
- Rehab costs (simple and detailed modes)
- Down payment calculation
- Monthly payment (interest-only and amortized)
- Holding costs calculation
- Selling commission calculation
- Detailed selling costs itemization
- Net profit calculation
- Profit margin calculation

### Next: Review ExitStrategiesTab.tsx for BRRRR/Wholesale calculations


## ExitStrategiesTab.tsx Review

### BRRRR Calculations (Lines 103-161)

**Potential Issues Found:**

1. **Line 111-112 - Cash Left in Deal Calculation**
   - Current: `cashLeftInDeal = results.totalProjectCost - cashOut;`
   - Issue: Uses `results.totalProjectCost` which includes selling costs
   - For BRRRR, you're NOT selling, so selling costs shouldn't be included
   - **SEVERITY: HIGH** - Overstates cash left in deal by ~$26,000 (selling costs)
   - **FIX NEEDED**: Should use purchase + closing + rehab + financing + holding costs only

2. **Line 127-128 - Operating Expenses Missing Items**
   - Current: Only includes taxes, insurance, maintenance, management, capEx
   - Missing: HOA fees (if applicable) from inputs.monthlyHOA
   - **SEVERITY: LOW** - HOA is in inputs but not used in BRRRR OpEx

3. **Line 201 - BRRRR Cash Needed**
   - Current: Uses `results.totalCashNeeded` from main calculator
   - Issue: This is the Fix & Flip cash needed, not BRRRR-specific
   - **SEVERITY: MEDIUM** - Should calculate BRRRR-specific cash needed

### Wholesale Calculations (Lines 163-191)

**Potential Issues Found:**

1. **Line 172 - Net Profit Calculation Bug**
   - Current: `netProfit = assignmentFee - totalWholesalerCosts + earnestMoneyDeposit;`
   - Issue: Adds earnestMoneyDeposit back, but EMD is already subtracted in totalWholesalerCosts
   - For assignment: totalWholesalerCosts = EMD + marketing
   - Net profit should be: assignmentFee - marketing (EMD is returned at closing)
   - **SEVERITY: HIGH** - Double-counts EMD, inflating profit

2. **Line 173 - Cash Invested for Assignment**
   - Current: `cashInvested = dealType === 'assignment' ? earnestMoneyDeposit + marketingCosts : totalWholesalerCosts;`
   - This is correct - EMD + marketing is the actual cash at risk

3. **Line 176 - End Buyer All-In Cost**
   - Current: `endBuyerAllIn = endBuyerPrice + endBuyerClosingCosts + endBuyerRehab + (endBuyerPrice * 0.01 * 6);`
   - The `(endBuyerPrice * 0.01 * 6)` appears to be 6 months of 1% holding costs
   - This is a reasonable estimate but uses endBuyerPrice instead of loan amount
   - **SEVERITY: LOW** - Approximation is acceptable

### Summary of Bugs to Fix:

| Bug | Location | Severity | Description |
|-----|----------|----------|-------------|
| 1 | ExitStrategiesTab:111 | HIGH | BRRRR cash left includes selling costs |
| 2 | ExitStrategiesTab:172 | HIGH | Wholesale profit double-counts EMD |
| 3 | calculator.ts:331 | MEDIUM | Interest calc includes principal for amortized loans |
| 4 | ExitStrategiesTab:127 | LOW | BRRRR OpEx missing HOA |
