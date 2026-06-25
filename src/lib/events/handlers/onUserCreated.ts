import { eventBus } from '../eventBus';

export function registerOnUserCreated(
  sendWelcome: (email: string) => Promise<void>,
  trackSignup: (userId: string) => Promise<void>,
) {
  eventBus.on('user.created', async ({ userId, email }) => {
    await sendWelcome(email);
    await trackSignup(userId);
  });
}
