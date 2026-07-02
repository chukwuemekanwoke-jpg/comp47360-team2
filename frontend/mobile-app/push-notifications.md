# Push notifications (not yet implemented)

InboxTab currently polls `GET /users/me/offers` every 30s instead of
receiving offers via push. Stub markers for where this would be wired in:
`src/services/pushNotifications.ts`, `src/app/index.tsx`, `InboxTab.tsx`,
`backend/api-gateway/src/services/createCampaignOffers.js`.

## Client
- Add `expo-notifications`. Requires a dev-client/standalone build —
  Android push tokens don't work in Expo Go on SDK 53+.
- Request permission + get Expo push token after
  `dispatch(setUserId(realUserId))` in `src/app/index.tsx`
  (`registerForPushNotificationsAsync` is stubbed there, currently a no-op).
- Send the token to the backend.
- On receipt: refetch the offers query instead of waiting for the poll.
- On tap: deep-link to `/tabs/InboxTab`.

## Backend
- Add `expo_push_token` column to `users` (new migration).
- Add endpoint to store the token (e.g. extend `updatePreferences` or add
  `PATCH /users/me/push-token`).
- Trigger point: `createCampaignOffers.js`, right after
  `insertOffersForUsers` — look up matched users' tokens and POST to
  `https://exp.host/--/api/v2/push/send` with `{ type: "offer_created", offerId }`.

## Out of scope
- Expiry-reminder / booking-confirmation notifications.
- Notification preference/opt-out UI.
- Delivery-receipt handling.
