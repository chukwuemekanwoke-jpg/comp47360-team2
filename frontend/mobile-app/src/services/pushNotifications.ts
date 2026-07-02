/**
 * STUB — push notifications are not implemented yet.
 *
 * This module marks the client-side integration point for offer push
 * notifications. See ../../push-notifications.md for the full plan
 * (Expo push tokens, backend storage, and the createCampaignOffers
 * trigger point on the server).
 *
 * Wiring this up for real requires:
 *   - adding the `expo-notifications` dependency
 *   - requesting notification permissions on-device
 *   - sending the resulting Expo push token to the backend
 *   - registering a notification-tap listener that deep-links into
 *     /tabs/InboxTab
 *
 * None of that is implemented — this only documents where the call
 * would go (see index.tsx, near dispatch(setUserId(...))).
 */
export async function registerForPushNotificationsAsync(userId: string): Promise<void> {
  console.log(
    `[stub] registerForPushNotificationsAsync(${userId}) — push notifications not implemented, see mobile-app/push-notifications.md`
  );
}
