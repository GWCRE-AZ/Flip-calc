# Test Findings - Visual Edit Requests

## Features Tested Successfully

### 1. DSCR Ratio Input with LTV Notice ✅
- **Location**: BRRRR tab > Refinance Details > DSCR Loan type
- **New Fields Added**:
  - Target DSCR Ratio input (default: 1.25)
  - Calculated DSCR display (shows actual ratio based on rent/debt service)
  - Recommended Down Payment display (based on DSCR ratio)
  - "Lender minimum: typically 1.0-1.25" helper text

- **LTV Notice Popup**: When LTV exceeds 75%, a professional popup appears with:
  - Title: "DSCR Loan Down Payment Notice"
  - Warning about exceeding 75% threshold
  - Industry Standard DSCR Loan Requirements breakdown:
    - Standard LTV: 75-80% max, 20-25% down required
    - DSCR ≥ 1.25: May qualify for 80% LTV (20% down)
    - DSCR 1.0-1.24: Typically requires 75% LTV (25% down)
    - DSCR 0.75-0.99: May require 70% LTV (30% down)
    - DSCR < 0.75: Most lenders require 65% LTV (35%+ down)
  - Note about requirements varying by lender
  - Two buttons: "Set to 75% LTV" and "Keep Current LTV"

### 2. Detailed Closing Costs Toggle for BRRRR ✅
- **Location**: BRRRR tab > Refinance Details > "Itemize Refinance Costs" accordion
- **Fields when expanded**:
  - Loan Points (%)
  - Appraisal Fee
  - Title Insurance
  - Recording Fees
  - Attorney Fees
  - Other Costs
- **Shows running total**: "Total: $6,688" (updates dynamically)

### 3. Improved Scenario Analysis Bar Chart ✅
- **Enhancements**:
  - Gradient fills for bars (red gradient for pessimistic, blue for base, amber for optimistic)
  - Drop shadow filter for depth
  - Improved tooltip styling (dark background, rounded corners)
  - Hover effects on legend items
  - Color-coded legend indicators with gradient squares
  - Smoother animations (800ms ease-out)
  - Better axis styling and spacing

## All Features Working Correctly
