const CHECK_DIGIT_MULTIPLIERS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]

// Mirrors espera-backend's shared/utils/cuit.ts (isValidCuit) so the
// frontend can reject an invalid CUIT before a round-trip, not just check
// that something was typed — keep both in sync if the algorithm ever moves.
export function isValidCuit(value) {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 11) return false

  const nums = digits.split('').map(Number)
  const sum = CHECK_DIGIT_MULTIPLIERS.reduce((acc, multiplier, i) => acc + multiplier * nums[i], 0)
  const remainder = sum % 11
  const checkDigit = remainder === 0 ? 0 : 11 - remainder

  if (checkDigit === 10) return false
  return checkDigit === nums[10]
}
