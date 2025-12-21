# Bug Audit Findings

## Home.tsx Review

### Potential Issues Found:

1. **POTENTIAL BUG: Reset button doesn't reset validation errors**
   - Location: Lines 428-436
   - Issue: When clicking Reset, `validationErrors` state is not cleared
   - Impact: Old validation errors may persist after reset
   - Fix: Add `setValidationErrors({})` to reset handler

2. **POTENTIAL BUG: Reset button doesn't reset collapsedSections**
   - Location: Lines 428-436
   - Issue: Collapsed sections remain collapsed after reset
   - Impact: User may not see all inputs after resetting
   - Fix: Add `setCollapsedSections({ property: false, rehab: false, financing: false, holding: false })` to reset handler

3. **POTENTIAL BUG: Reset button doesn't reset rehabPresets**
   - Location: Lines 428-436
   - Issue: Custom rehab presets are not reset to defaults
   - Impact: User's custom presets persist after reset
   - Fix: Add `setRehabPresets(defaultPresets)` to reset handler

4. **POTENTIAL BUG: Validation warning for ARV < Purchase Price is too strict**
   - Location: Lines 109-111
   - Issue: Shows warning when ARV equals purchase price, but some deals (wholesale) may have ARV = purchase price
   - Impact: False positive warning for valid scenarios
   - Severity: Low - just a warning, not blocking

5. **NO BUG: State management looks correct**
   - useEffect properly recalculates when inputs change
   - Event handlers correctly update state
   - Collapsible sections work properly

6. **NO BUG: Form progress calculation is correct**
   - Properly checks each section for completion

7. **NO BUG: PDF generation looks correct**
   - All data is properly formatted and included

## Still Need to Check:
- ExitStrategiesTab.tsx
- SensitivityAnalysis.tsx
- ComparisonMode.tsx
- BreakEvenAnalysis.tsx
- CostPerSqFt.tsx
- calculator.ts edge cases


## ExitStrategiesTab.tsx Review

### Potential Issues Found:

1. **POTENTIAL BUG: endBuyerRehab not synced with inputs**
   - Location: Line 70
   - Issue: `endBuyerRehab` is initialized from `inputs.rehabCostSimple` but doesn't update when inputs change
   - Impact: If user changes rehab cost in main calculator, wholesale analysis uses stale value
   - Fix: Add useEffect to sync endBuyerRehab with inputs.rehabCostSimple

2. **NO BUG: BRRRR calculations look correct**
   - Cost basis properly excludes selling costs
   - DSCR calculation is correct (NOI / Debt Service)
   - Cash-on-Cash calculation is correct

3. **NO BUG: Wholesale calculations look correct**
   - Assignment vs double close properly handled
   - EMD correctly returned for assignments

4. **NO BUG: LTV notice modal works correctly**
   - Triggers when DSCR loan and LTV > 75%

## Still Need to Check:
- SensitivityAnalysis.tsx
- ComparisonMode.tsx
- BreakEvenAnalysis.tsx
- CostPerSqFt.tsx
- Browser edge case testing


## SensitivityAnalysis.tsx Review

### No Bugs Found
- Calculations are correct
- Sliders properly adjust values
- Profit impact calculation is accurate
- Color coding for positive/negative changes works correctly

## BreakEvenAnalysis.tsx Review

### POTENTIAL BUG: Break-even calculation doesn't account for detailed selling costs
- Location: Line 34
- Issue: `sellingRates` only uses percentage-based selling costs, not itemized costs
- Impact: If user has `useDetailedSellingCosts` enabled, break-even calculation may be inaccurate
- Fix: Should check `inputs.useDetailedSellingCosts` and calculate actual selling costs accordingly

### POTENTIAL BUG: Seller concessions included in fixed costs
- Location: Line 40
- Issue: `inputs.sellerConcessions` is included but this field doesn't exist in the current interface
- Impact: May cause undefined value in calculation
- Severity: Low - will default to 0 if undefined

### No Other Bugs Found
- Max purchase price calculation is correct
- ARV cushion calculation is correct
- Quick reference table displays correct values


## Browser Edge Case Testing

### Test 1: Purchase Price = 0
- **Result:** Validation message appears correctly ("Purchase price must be greater than $0")
- **Issue Found:** Calculations still run with $0 purchase price, showing unrealistic results (ROI 386.5%, Cash-on-Cash 2,882.6%)
- **BUG:** Calculator should not process calculations when purchase price is 0 or invalid
- **Severity:** Medium - misleading results displayed

### Test 2: Reset Button
- **Result:** Reset button works correctly, restores default values

### Additional Bugs Found During Testing:
1. **BRRRR Cash-on-Cash shows -937395.9%** when purchase price is 0 - division by zero or near-zero issue
2. **70% Rule shows 12.0%** which is technically correct ($0 + $45,000) / $375,000 but misleading

## Summary of All Bugs Found:

| Bug | Location | Severity | Description |
|-----|----------|----------|-------------|
| 1 | Home.tsx | Medium | Calculator processes invalid inputs (0 purchase price) showing unrealistic results |
| 2 | ExitStrategiesTab.tsx | Low | endBuyerRehab not synced with inputs.rehabCostSimple when changed |
| 3 | BreakEvenAnalysis.tsx | Low | Break-even doesn't account for detailed selling costs mode |
| 4 | ExitStrategiesTab.tsx | Medium | BRRRR Cash-on-Cash shows extreme values with edge case inputs |
