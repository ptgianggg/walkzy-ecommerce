// Centralized order/shipping status definitions and allowed transitions
const ORDER_STATUSES = [
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'completed',
    'cancelled',
    'refunded',
    'returned',
    'failed',
    'return_requested'
]

// Allowed forward transitions for order statuses (single source of truth)
const ALLOWED_ORDER_TRANSITIONS = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
shipped: ['delivered', 'returned', 'failed'],
    delivered: ['completed', 'returned', 'return_requested'],
    completed: [],
    cancelled: ['refunded'],
    refunded: [],
    returned: ['refunded'],
    failed: ['returned', 'cancelled'],
    return_requested: ['returned', 'refunded', 'delivered']
}

// Allowed forward transitions for shipping statuses
const ALLOWED_SHIPPING_TRANSITIONS = {
  pending: ['picked_up'],
  picked_up: ['in_transit'],
  in_transit: ['out_for_delivery'],
  out_for_delivery: ['delivered', 'failed'],
  delivered: [],
  failed: ['returned'],
  returned: [],
  cancelled: []
}


const isOrderTransitionAllowed = (from, to) => {
    if (!from) return true // allow when unknown
    if (from === to) return true // allow updates (e.g. shippingStatus change) without changing main status
    const allowed = ALLOWED_ORDER_TRANSITIONS[from]
    if (!allowed) return false
    return allowed.includes(to)
}

const isShippingTransitionAllowed = (from, to) => {
    if (!from) return true
    if (from === to) return false
    const allowed = ALLOWED_SHIPPING_TRANSITIONS[from]
    if (!allowed) return false
    return allowed.includes(to)
}

module.exports = {
    ORDER_STATUSES,
    ALLOWED_ORDER_TRANSITIONS,
    ALLOWED_SHIPPING_TRANSITIONS,
    isOrderTransitionAllowed,
    isShippingTransitionAllowed
}
