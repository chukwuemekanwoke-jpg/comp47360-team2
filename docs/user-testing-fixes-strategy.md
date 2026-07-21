# User Testing Fixes — Strategy & Change Log

Strategy for the functionality gaps identified during user testing of the mobile app
(`frontend/mobile-app`). Each section states the issue, why it matters, and the
implementation approach. As work lands, a **Changes** list under each section records
which files were touched and what changed.

Build order (dependencies first): §8 theming → §5+§7 shared filtering → §4 collapsible
filters → §3 scroll-to-top → §6+§9 profile → §2 cuisine images → §1 Discover page.

---

## 1. Discover page

**Issue:** The app's four tabs (Map, Restaurants, Profile, Inbox) all assume the user
already knows what they want. There is no browsing surface — a user with no specific
intent gets a flat, unranked list.

**Why:** This is the "walk in the door" experience for new users, and a second consumer
of the desirability ranking built for the map markers.

**How:** New `DiscoverTab.tsx` in `src/app/tabs/`, registered in `_layout.tsx`. Feeds
entirely off the already-cached `useGetNearbyRestaurantsQuery` — no backend changes.
Sections as horizontal carousels: **Top picks** (reuse `desirabilityScore` from
`src/lib/mapDisplay.ts`), **Quiet right now** (lowest busyness), **Browse by cuisine**
(cuisine tiles using §2's images; tapping a tile applies the cuisine filter and jumps to
the Restaurants tab). Built last since it composes §2, §5 and §7.

**Changes:**

- `frontend/mobile-app/src/app/tabs/DiscoverTab.tsx` (new) — Discover page with
  three carousels over the cached nearby query: Top picks (desirability-ranked),
  Quiet right now (lowest busyness), Browse by cuisine (photo tiles). Tapping a
  restaurant tile sets the shared search query to its name and opens the
  Restaurants tab; tapping a cuisine tile replaces the cuisine filter and opens the
  Restaurants tab.
- `frontend/mobile-app/src/app/tabs/_layout.tsx` — registered the Discover tab
  (compass icon) between Map and Restaurants.
- `frontend/packages/shared/src/userSlice.ts` — added `setCuisines` reducer so the
  cuisine tiles can replace (not just toggle) the selection.

## 2. Generic cuisine photos

**Issue:** `RestaurantCard.tsx` renders a flat dark band with the restaurant's first
letter as a "photo".

**Why:** Food apps rely on visual scanning; a letter on a dark rectangle gives zero
signal and makes every card look identical.

**How:** One image per cuisine keyed by lowercase cuisine name in a new
`src/lib/cuisineImages.ts` with a generic fallback for unknown cuisines (the cuisine
lists in `PreferenceFilters` and onboarding are inconsistent, so key off backend
values). Render as a banner behind the card header with an overlay so the busyness
badge stays legible. Assets must stay small (bundled with the app).

**Changes:**

- `frontend/mobile-app/assets/cuisines/*.jpg` (new) — Unsplash-licensed 640×320
  photos for italian, indian, vietnamese, japanese, mexican, thai plus a generic
  restaurant-interior fallback (~340 KB total).
- `frontend/mobile-app/src/lib/cuisineImages.ts` (new) — lowercase cuisine →
  bundled image lookup with generic fallback.
- Follow-up (DB-driven coverage): queried the deployed API's Midtown neighbourhood
  (293 restaurants) for cuisine frequency — top gaps were american (131), coffee
  (18), pizza (10), asian (10), irish (8), steakhouse (7), bakery_products (7),
  chinese (6), frozen_desserts (5), donuts (5), seafood (4), french (4),
  sandwiches (4), juice (4). Added photos for all of these
  (`frontend/mobile-app/assets/cuisines/`, now ~944 KB total, every image
  visually verified); the old pizza photo moved from `italian.jpg` to `pizza.jpg`
  and Italian got a pasta shot. `cuisineImages.ts` maps all 20 cuisines and gained
  `formatCuisine()` (underscored keys like `bakery_products` → "bakery products"),
  now used by `RestaurantCard` and the Discover tiles.
- `frontend/mobile-app/src/components/RestaurantCard.tsx` — placeholder letter band
  replaced with the cuisine photo (`ImageBackground` + dark scrim), cuisine name
  overlaid, busyness badge kept legible on a dark pill.

## 3. Scroll-to-top button on restaurants view

**Issue:** `CardTab.tsx`'s FlatList can be dozens of cards long with no fast way back to
the top (where the sort bar lives).

**Why:** Cheap, pure quality-of-life; users who scroll deep have to flick repeatedly to
change sort.

**How:** `useRef<FlatList>` plus a throttled `onScroll` handler that shows a floating
circular button (Ionicons `chevron-up`, absolute bottom-right) once offset passes
~400 px; button calls `scrollToOffset({ offset: 0, animated: true })`.

**Changes:**

- `frontend/mobile-app/src/app/tabs/CardTab.tsx` — added FlatList ref, throttled
  `onScroll` threshold tracking, and a themed floating chevron-up button that scrolls
  back to the top.

## 4. Collapsible filters on the restaurant card view

**Issue:** `PreferenceFilters` is only mounted on the Map tab. The filters *do* apply to
the card list (redux state, filtered in `CardTab`), but users can't see or change them
from the list — results are silently filtered by something invisible.

**Why:** Silent filtering is a trust problem, not just a convenience one.

**How:** Extract the "Filters button + collapsible panel" pattern MapTab already
implements into a reusable `CollapsibleFilters` component and mount it in CardTab
alongside the sort bar. Show an active-filter count badge on the toggle so filtering is
never invisible.

**Changes:**

- `frontend/mobile-app/src/components/CollapsibleFilters.tsx` (new) — search bar +
  filters toggle row with active-filter badge, expanding (LayoutAnimation) into the
  preference panel; accepts children for extra rows (used for map location controls).
- `frontend/mobile-app/src/app/tabs/CardTab.tsx` — mounted `CollapsibleFilters` above
  the sort bar; added an empty-state message for when filters/search match nothing.
- `frontend/mobile-app/src/app/tabs/MapTab.native.tsx` /
  `frontend/mobile-app/src/app/tabs/MapTab.web.tsx` — replaced each tab's bespoke
  filters button + panel with the shared `CollapsibleFilters`, so both views present
  filters identically.

## 5. Search on both views

**Issue:** No free-text search anywhere; the only narrowing tools are cuisine chips and
sort.

**Why:** "I'm looking for that place called…" is unservable; flagged on both views in
testing, so users expect it as shared state.

**How:** Add `searchQuery: string` to the `filters` object in the shared `userSlice` so
it is shared across tabs like cuisines are. New themed `SearchBar` component (TextInput
plus clear button). Create one shared `applyRestaurantFilters(list, filters)` helper in
the shared package handling search (case-insensitive name/cuisine/neighborhood match) +
cuisine + busyness (§7), replacing the filter logic duplicated across CardTab and both
MapTabs. All client-side over the cached query — no extra backend requests.

**Changes:**

- `frontend/packages/shared/src/userSlice.ts` — added `searchQuery` and `maxBusyness`
  to `UserFilters` with `setSearchQuery` / `setMaxBusyness` reducers.
- `frontend/packages/shared/src/restaurantFilters.ts` (new) —
  `applyRestaurantFilters` (search + cuisine + busyness pipeline), shared
  `busynessLabel`/`busynessColor`, and `activeFilterCount` for filter badges.
- `frontend/packages/shared/src/index.ts` — export the new module.
- `frontend/mobile-app/src/components/SearchBar.tsx` (new) — themed search input
  bound to the shared `searchQuery` state, with a clear button.
- `frontend/mobile-app/src/app/tabs/CardTab.tsx` — replaced the local cuisine-only
  filter with `applyRestaurantFilters` (search + cuisine + busyness).
- `frontend/mobile-app/src/app/tabs/MapTab.native.tsx` /
  `frontend/mobile-app/src/app/tabs/MapTab.web.tsx` — same pipeline swap, so map
  markers and the nearby list respond to search and busyness filters too.

## 6. Expand the bookings area on the profile page

**Issue:** `ProfileTab.tsx` is a fixed non-scrolling `flex-1` view with four cards
stacked above `<BookingsProfile/>` (itself a FlatList). Bookings get whatever sliver of
height is left — on small screens almost nothing — and the page cannot scroll.

**Why:** Bookings are the most actionable content on the profile (cancel, check time)
and currently the least visible.

**How:** Invert the structure: make BookingsProfile's FlatList *the* page scroller and
move the profile header, preference cards and sign-out button into its
`ListHeaderComponent` / `ListFooterComponent`. Bookings get unlimited room, the whole
profile scrolls, and no nested-VirtualizedList warning.

**Changes:**

- `frontend/mobile-app/src/components/BookingProfile.tsx` — accepts
  `ListHeaderComponent`/`ListFooterComponent` props so its FlatList is the page
  scroller; adds a "Your Bookings" section title; loading spinner moved into
  `ListEmptyComponent` so the profile header never disappears while bookings load.
- `frontend/mobile-app/src/app/tabs/ProfileTab.tsx` — restructured: profile header,
  preference cards and stats now live in the bookings list header, sign-out in the
  footer, so the entire page scrolls and bookings get full height.

## 7. Busyness filter in preferences

**Issue:** Busyness is the app's headline data point (shown on every card, marker and
callout) but users cannot filter by it.

**Why:** "Find me somewhere quiet" is the core promise of a busyness-aware app; flagged
directly in testing.

**How:** Add `maxBusyness: number | null` to userSlice filters with a chip row in
`PreferenceFilters` — Quiet (≤0.4), Moderate (≤0.7), Any (null) — matching existing
`busynessLabel` thresholds. Enforce inside the shared `applyRestaurantFilters` helper
(§5). Consolidate the `busynessLabel`/`busynessColor` functions currently duplicated in
four files (web MapTab even uses a ×100 scale variant) into one shared module.

**Changes:**

- `frontend/packages/shared/src/userSlice.ts` — `maxBusyness` filter state +
  `setMaxBusyness` reducer (see §5).
- `frontend/mobile-app/src/components/PreferenceFilters.tsx` — added a Busyness chip
  row (Quiet ≤0.4 / Moderate ≤0.7 / Any) wired to `setMaxBusyness`.
- `frontend/packages/shared/src/restaurantFilters.ts` — busyness enforcement lives in
  `applyRestaurantFilters`; canonical `busynessLabel`/`busynessColor` exported here.
- `frontend/mobile-app/src/components/RestaurantCard.tsx`,
  `frontend/mobile-app/src/app/tabs/MapTab.native.tsx`,
  `frontend/mobile-app/src/app/tabs/MapTab.web.tsx` — removed duplicated local
  busyness helpers in favour of the shared ones (including the web ×100 variant).

## 8. Light theme on preferences

**Issue:** The `Chip` in `PreferenceFilters.tsx` hardcodes dark-palette hexes (`#27272a`
border, `#09090b` background, `#a1a1aa` text) instead of theme classes — in light mode
the chips render near-black on a white card. `SettingsModal`'s switch colors have the
same problem.

**Why:** Visible bug in the just-shipped light mode, and every new filter UI from §4/§5/§7
inherits whatever pattern this component uses — fix before multiplying it.

**How:** Replace hardcoded hexes with the existing `table-*` tailwind classes (they flip
automatically via `themeVars` in `src/theme.ts`). For style-prop cases that cannot use
classes (accent tints, switch tracks), read from `navColors[theme]`; add accent colors
to `navColors` since `#00f2fe` is hardcoded in many places.

**Changes:**

- `frontend/mobile-app/src/theme.ts` — added `interactive`, `offer` and `live` hex
  colors to `navColors` for both palettes so accents can be theme-resolved in style
  props.
- `frontend/mobile-app/src/components/PreferenceFilters.tsx` — replaced hardcoded
  dark-palette hexes in `Chip` with `table-*` tailwind classes (inactive state) and
  theme-resolved accents from `navColors` (active state).
- `frontend/mobile-app/src/components/SettingsModal.tsx` — switch track/thumb colors
  now come from `navColors[theme]` instead of hardcoded dark hexes.

## 9. Editable profile

**Issue:** Preferences are set once during onboarding and `ProfileTab` renders them
read-only. Changing your mind means making a new account.

**Why:** The backend already supports this — `updatePreferences` exists in the shared
`apiSlice` and onboarding calls it. This is purely a missing frontend surface over a
working endpoint.

**How:** Extract onboarding's pickers (cuisines, budget tier, dining style) into a
reusable `PreferenceEditor` component used by onboarding and a new "Edit preferences"
modal sheet on ProfileTab (consistent with SettingsModal). Prefill by reversing the
`dietaryTags` split ProfileTab already performs, save via `updatePreferences`, and
invalidate the profile query tag so the page refreshes (the mutation already
invalidates the `User` tag — no apiSlice change needed).

**Changes:**

- `frontend/mobile-app/src/components/PreferenceEditor.tsx` (new) — controlled
  cuisine/budget/dining-style pickers plus the shared vocabulary
  (`PREFERENCE_CUISINES`, `DINING_STYLES`, budget-tier mapping, `formatDiningStyle`);
  renders all sections (profile edit) or one per step (onboarding).
- `frontend/mobile-app/src/components/EditPreferencesModal.tsx` (new) — bottom sheet
  prefilled from the fetched profile, saving via `updatePreferences`.
- `frontend/mobile-app/src/app/tabs/ProfileTab.tsx` — "Edit" button on the cuisines
  card opens the modal (remounted per open so it prefills fresh values).
- `frontend/mobile-app/src/app/onboarding.tsx` — steps now render `PreferenceEditor`
  sections instead of duplicated picker markup; budget-tier mapping imported from the
  shared editor (also fixes a hardcoded dark-theme accent).
