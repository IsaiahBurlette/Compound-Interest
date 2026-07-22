export type Frequency = 'day' | 'week' | 'month';

export interface CompoundInputs {
  amount: number;
  frequency: Frequency;
  years: number;
  annualRatePct: number;
}

export interface MonthPoint {
  month: number;
  invested: number;
  contributed: number;
}

export interface CompoundResult {
  points: MonthPoint[];
  totalContributed: number;
  finalInvested: number;
  growth: number;
  dailyAmount: number;
  monthlyContribution: number;
}

const DAYS_PER_YEAR = 365.25;
const DAYS_PER_MONTH = DAYS_PER_YEAR / 12;

const PERIODS_PER_YEAR: Record<Frequency, number> = {
  day: DAYS_PER_YEAR,
  week: DAYS_PER_YEAR / 7,
  month: 12,
};

export function toDailyAmount(amount: number, frequency: Frequency): number {
  return (amount * PERIODS_PER_YEAR[frequency]) / DAYS_PER_YEAR;
}

export function calculateCompoundGrowth({
  amount,
  frequency,
  years,
  annualRatePct,
}: CompoundInputs): CompoundResult {
  const dailyAmount = toDailyAmount(amount, frequency);
  const monthlyContribution = dailyAmount * DAYS_PER_MONTH;
  const monthlyRate = annualRatePct / 100 / 12;
  const totalMonths = Math.max(1, Math.round(years * 12));

  const points: MonthPoint[] = [{ month: 0, invested: 0, contributed: 0 }];
  let balance = 0;
  let contributed = 0;

  for (let m = 1; m <= totalMonths; m++) {
    balance = (balance + monthlyContribution) * (1 + monthlyRate);
    contributed += monthlyContribution;
    points.push({ month: m, invested: balance, contributed });
  }

  return {
    points,
    totalContributed: contributed,
    finalInvested: balance,
    growth: balance - contributed,
    dailyAmount,
    monthlyContribution,
  };
}

export function formatCurrency(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits,
  }).format(value);
}
