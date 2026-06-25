export interface AppEvents {
  'user.created': { userId: string; email: string };
  'payment.failed': { userId: string; amount: number; reason: string };
  'fraud.detected': { userId: string; transactionId: string };
  'report.generated': { userId: string; reportUrl: string };
}
