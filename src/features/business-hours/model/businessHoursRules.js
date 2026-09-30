export function isValidHourRange(hour) {
  return hour.opensAt < hour.closesAt
}

export function hasOverlappingRanges(ranges) {
  return ranges.some((range, index) =>
    ranges.some((other, otherIndex) =>
      index !== otherIndex &&
      range.dayOfWeek === other.dayOfWeek &&
      range.opensAt < other.closesAt &&
      other.opensAt < range.closesAt
    )
  )
}
