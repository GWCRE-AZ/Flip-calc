import { describe, expect, it } from 'vitest';
import { calculateResults, defaultInputs } from './calculator';

describe('calculateResults', () => {
  it('does not include detailed holding line items when detailed mode is disabled', () => {
    const results = calculateResults({
      ...defaultInputs,
      useDetailedHoldingCosts: false,
      monthlyHOA: 300,
      monthlyLawnCare: 150,
      monthlyPoolMaintenance: 75,
      monthlySecurityAlarm: 25,
      monthlyVacancyInsurance: 60,
      monthlyOther: 40,
      holdingPeriodMonths: 6,
    });

    // Only taxes + insurance + utilities should count in basic mode
    expect(results.totalHoldingCosts).toBe((250 + 100 + 150) * 6);
  });

  it('applies ARV cap to funded loan amount and tracks shortfall as cash needed', () => {
    const results = calculateResults({
      ...defaultInputs,
      purchasePrice: 300000,
      arv: 350000,
      downPaymentPercent: 10,
      includeRehabInLoan: true,
      rehabCostSimple: 45000,
      includeClosingCostsInLoan: true,
      includePointsInLoan: true,
      maxLoanToARVPercent: 60,
      useDetailedRehab: false,
      holdingPeriodMonths: 1,
      interestReserveMonths: 0,
    });

    expect(results.isLoanCapped).toBe(true);
    expect(results.totalLoanAmount).toBe(results.maxLoanAmount);
    expect(results.loanCapShortfall).toBeGreaterThan(0);
    expect(results.totalCashNeeded).toBeGreaterThan(results.downPayment);
  });

  it('adds financed interest reserve into total loan amount', () => {
    const base = calculateResults({
      ...defaultInputs,
      interestReserveMonths: 0,
      maxLoanToARVPercent: 100,
    });

    const withReserve = calculateResults({
      ...defaultInputs,
      interestReserveMonths: 3,
      maxLoanToARVPercent: 100,
    });

    expect(withReserve.financedInterestReserve).toBeGreaterThan(0);
    expect(withReserve.totalLoanAmount).toBeGreaterThan(base.totalLoanAmount);
  });
});
