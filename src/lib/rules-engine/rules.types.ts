export interface FraudFacts {
  amount: number;
  accountAgeDays: number;
  countryMatch: boolean;
  txType?: string;
}
