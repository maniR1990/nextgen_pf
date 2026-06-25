import { eventBus } from '../eventBus';

export function registerOnFraudDetected(
  auditLog: (payload: { userId: string; transactionId: string }) => Promise<void>,
) {
  eventBus.on('fraud.detected', async (payload) => {
    await auditLog(payload);
  });
}
