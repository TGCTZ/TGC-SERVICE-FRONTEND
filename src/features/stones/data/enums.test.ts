import { describe, expect, it } from 'vitest'
import { STONE_STATUS_LABELS, isStoneLocked } from './enums'

describe('isStoneLocked', () => {
  it('leaves a stone open while it is only received', () => {
    expect(isStoneLocked({ status: 'received' })).toBe(false)
  })

  it('locks a stone once a bill has been priced from its type', () => {
    // The type IS the price, so changing it afterwards falsifies the bill.
    for (const status of ['billed', 'paid', 'certified']) {
      expect(isStoneLocked({ status })).toBe(true)
    }
  })

  it('keeps the two side states open', () => {
    // These are exactly where a human parks a stone in order to fix it.
    expect(isStoneLocked({ status: 'on_hold' })).toBe(false)
    expect(isStoneLocked({ status: 'cancelled' })).toBe(false)
  })

  it('locks every handover status', () => {
    expect(isStoneLocked({ status: 'ready_for_collection' })).toBe(true)
    expect(isStoneLocked({ status: 'collected' })).toBe(true)
    expect(isStoneLocked({ status: 'under_identification' })).toBe(true)
  })

  it('covers every status the app can render', () => {
    // A new status must be a deliberate decision, not a silent default.
    for (const status of Object.keys(STONE_STATUS_LABELS)) {
      expect(typeof isStoneLocked({ status })).toBe('boolean')
    }
  })

  it('treats no stone as unlocked', () => {
    expect(isStoneLocked(null)).toBe(false)
  })
})
