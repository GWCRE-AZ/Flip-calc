# Calculation Verification - Sample Data

## Input Values (Default)
- Purchase Price: $250,000
- ARV: $375,000
- Rehab Cost: $45,000
- Purchase Closing Costs: 3% = $7,500
- Loan Type: Hard Money
- Down Payment: 10%
- Interest Rate: 10%
- Loan Term: 12 months
- Points: 2%
- Interest Only: Yes
- Finance Rehab: Yes
- Holding Period: 6 months
- Monthly Holding: $500/mo (taxes $250 + insurance $100 + utilities $150)
- Selling Commission: 6%
- Selling Closing: 1%

## Displayed Results
- Net Profit: $24,665
- ROI: 7.0%
- Cash-on-Cash: 42.1%
- Total Project Cost: $350,335
- Total Cash Needed: $58,585
- Total Loan Amount: $265,500

## Cost Breakdown
- Purchase: $250,000
- Rehab: $45,000
- Financing: $18,585
- Holding: $3,000
- Selling: $26,250

## Manual Verification

### Loan Calculation
- Amount to finance: $250,000 + $45,000 = $295,000
- Down payment (10%): $29,500
- Base loan: $265,500 ✓ CORRECT
- Points (2%): $5,310
- Monthly interest (10%/12): $2,212.50
- 6 months interest: $13,275
- Total financing: $13,275 + $5,310 = $18,585 ✓ CORRECT

### Holding Costs
- Monthly: $500
- 6 months: $3,000 ✓ CORRECT

### Selling Costs
- Commission (6% of $375,000): $22,500
- Closing (1% of $375,000): $3,750
- Total: $26,250 ✓ CORRECT

### Total Project Cost
- Purchase: $250,000
- Closing: $7,500
- Rehab: $45,000
- Financing: $18,585
- Holding: $3,000
- Selling: $26,250
- Total: $350,335 ✓ CORRECT

### Cash Needed
- Down payment: $29,500
- Purchase closing: $7,500
- Points: $5,310
- Holding: $3,000
- Interest (6 mo): $13,275
- Total: $58,585 ✓ CORRECT

### Net Profit
- ARV: $375,000
- Total Cost: $350,335
- Net Profit: $24,665 ✓ CORRECT

## Exit Strategy Values (from page)
- Fix & Flip: Net Profit $24,665, Cash Needed $58,585
- BRRRR: Annual Cash Flow -$9,374, Cash Left in Deal $76,585
- Wholesale: Net Profit $9,500, Cash Needed $1,500

## BRRRR Bug Verification
- Total Project Cost (includes selling): $350,335
- Selling costs included: $26,250
- BRRRR should NOT include selling costs
- Correct BRRRR cost basis: $350,335 - $26,250 = $324,085
- Max loan at 75% LTV: $375,000 * 0.75 = $281,250
- Refinance costs (2%): $7,500
- Cash out: $281,250 - $7,500 = $273,750
- CORRECT Cash Left: $324,085 - $273,750 = $50,335
- DISPLAYED Cash Left: $76,585 (WRONG - includes selling costs)
- **BUG CONFIRMED: ~$26,250 difference**

## Wholesale Bug Verification
- Assignment Fee: $10,000
- EMD: $1,000
- Marketing: $500
- Total Costs (assignment): $1,000 + $500 = $1,500
- Current formula: $10,000 - $1,500 + $1,000 = $9,500
- CORRECT formula: $10,000 - $500 = $9,500 (EMD returned at closing)
- Result happens to be same because EMD is added back
- **BUG EXISTS but result is coincidentally correct for this case**


## POST-FIX VERIFICATION

### BRRRR Cash Left in Deal - FIXED
- Before fix: $76,585 (included selling costs)
- After fix: $50,335 (correct - excludes selling costs)
- Expected: $324,085 (cost basis) - $273,750 (cash out) = $50,335 ✓ CORRECT

### Wholesale Net Profit - Verified
- Assignment fee: $10,000
- Marketing costs: $500
- Net profit: $10,000 - $500 = $9,500 ✓ CORRECT
- (EMD is returned at closing, not a cost)

### All Fixes Verified Successfully
