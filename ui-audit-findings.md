# Comprehensive UI Audit Findings

## Icons to Remove

### Home.tsx
1. Line 51: DollarSign icons in input fields (remove from Purchase Price, ARV, Rehab Cost inputs)
2. Line 51: AlertTriangle icons in validation messages (keep - important for UX)
3. Line 579: MapPin icon in ARV Validation header
4. Line 649-650: Zap icon in Quick Estimate Presets
5. Line 1106-1171: HomeIcon, Leaf, Droplets, Shield, Info, DollarSign icons in detailed holding costs
6. Line 51: ChevronDown/ChevronUp icons in collapsible sections (keep - functional)

### ExitStrategiesTab.tsx
1. Line 288-291: TrendingUp, Home, RefreshCw, Handshake icons in tab triggers
2. Line 298-335: Home, RefreshCw, Handshake icons in overview cards
3. Line 305: Trophy icon for best profit
4. Line 310, 343: Star emoji for lowest cash
5. Line 411, 622: Info icons in info boxes
6. Line 420, 460, 545, 610, 642: RefreshCw, Building2, DollarSign, Users icons in section headers
7. Line 444, 653: AlertTriangle, CheckCircle2 icons in warnings/success messages
8. Line 529, 627: ChevronUp/ChevronDown icons in buttons

## Cramped Layouts to Fix

### Home.tsx - Side-by-side that need stacking on mobile:
1. Lines 513-550: Purchase Price + ARV (grid-cols-2) - OK on desktop, needs single column on mobile
2. Lines 809-831: Loan Term + Origination Points (grid-cols-2) - cramped on mobile
3. Lines 842-903: Hard Money loan inputs (4 fields in grid-cols-2) - cramped
4. Lines 910-942: Advanced Loan Options switches (grid-cols-2) - cramped on mobile
5. Lines 944-1000: Max Loan to ARV + Interest Reserve (grid-cols-2) - cramped
6. Lines 1044-1077: Property Taxes + Insurance + Utilities (grid-cols-3) - very cramped on mobile
7. Lines 1103-1182: Detailed holding costs (grid-cols-2) - cramped with icons

### ExitStrategiesTab.tsx - Side-by-side that need stacking:
1. Lines 296-350: Overview cards (grid-cols-3) - very cramped on mobile
2. Lines 423-439: BRRRR summary metrics (grid-cols-4) - cramped
3. Lines 461-491: Refinance Details inputs (grid-cols-4) - very cramped
4. Lines 496-516: DSCR inputs (grid-cols-3) - cramped
5. Lines 534-541: Refinance costs itemization (grid-cols-3) - cramped
6. Lines 546-550: Operating expenses (grid-cols-4) - very cramped
7. Lines 594-607: Wholesale summary metrics (grid-cols-4) - cramped
8. Lines 611-619: Wholesale deal setup (grid-cols-4) - cramped
9. Lines 631-636: Wholesale closing costs (grid-cols-4) - cramped
10. Lines 643-645: End buyer analysis (grid-cols-2) - cramped
11. Lines 647-650: End buyer summary (grid-cols-3) - cramped

## Recommended Changes

### Mobile Breakpoint Strategy:
- Change all `grid-cols-4` to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- Change all `grid-cols-3` to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Keep `grid-cols-2` as `grid-cols-1 md:grid-cols-2`

### Icon Removal Priority:
1. Remove decorative icons from input labels (DollarSign, HomeIcon, Leaf, etc.)
2. Remove icons from tab triggers (use text only)
3. Remove icons from section headers
4. Keep functional icons (ChevronUp/Down for collapse, AlertTriangle for warnings)
