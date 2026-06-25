import { eventBus } from '../eventBus';

export function registerOnPaymentFailed(
  enqueueRetry: (payload: { userId: string; amount: number; reason: string }) => Promise<void>,
) {
  eventBus.on('payment.failed', async (payload) => {
    await enqueueRetry(payload);
  });
}
