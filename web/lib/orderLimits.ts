// Shared between TierPicker.tsx (client-side UX cap on the +/- buttons) and
// actions.ts (the server-side enforcement) — one source of truth, so a
// direct-POST bypass of the UI can never be allowed more per tier than the
// UI itself permits.
export const PER_ORDER_MAX = 10
