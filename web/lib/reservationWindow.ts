// How long a buyer has to pay once seats are reserved. Sets SumUp's
// checkout valid_until, after which the hosted page can no longer take a
// payment (including retries after a declined attempt).
export const CHECKOUT_VALID_MINUTES = 15

// Derived, never set independently: the sweep must only release a pending
// order's seats once SumUp can no longer accept payment for it, or a late
// payment could land on seats already resold. The margin covers the gap
// between the order insert and the checkout's creation, plus a payment
// still settling at the moment valid_until passes.
const SWEEP_MARGIN_MINUTES = 5
export const RESERVATION_HOLD_MINUTES = CHECKOUT_VALID_MINUTES + SWEEP_MARGIN_MINUTES
