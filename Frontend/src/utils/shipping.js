const normalizeIdentifier = (value) => {
  if (!value) return ''
  if (typeof value === 'string' || typeof value === 'number') {
    return `${value}`
  }
  if (typeof value === 'object') {
    return (
      value._id ||
      value.id ||
      value.value ||
      value.providerId ||
      value.code ||
      value.slug ||
      value.name ||
      value.toString?.() ||
      ''
    )
  }
  return ''
}

const getRateProviderId = (rate) => {
  if (!rate) return ''
  return normalizeIdentifier(
    rate.providerId ||
    rate.provider?._id ||
    rate.provider?.id ||
    rate.provider ||
    rate.shippingProviderId ||
    rate.shippingProvider?._id
  )
}

const getRateUniqueId = (rate) => {
  if (!rate) return ''
  return normalizeIdentifier(rate._id || rate.id || rate.rateId || rate.code || rate.name)
}

const getRateMethodIdentifier = (rate) => {
  if (!rate) return ''
  const raw =
    rate.shippingMethod ||
    rate.method ||
    rate.code ||
    rate.provider?.code ||
    rate.name ||
    getRateUniqueId(rate)
  return raw ? `${raw}` : ''
}

const findBestShippingRate = (rates, options = {}) => {
  if (!Array.isArray(rates) || rates.length === 0) return null
  const {
    preferredMethod,
    preferredRateId,
    preferredProviders = []
  } = options

  const normalizedMethod = preferredMethod ? preferredMethod.toLowerCase() : null
  const normalizedPreferredRateId = normalizeIdentifier(preferredRateId)

  if (normalizedPreferredRateId) {
    const matchById = rates.find(
      (rate) => getRateUniqueId(rate) === normalizedPreferredRateId
    )
    if (matchById) return matchById
  }

  if (normalizedMethod) {
    const methodMatch = rates.find(
      (rate) => getRateMethodIdentifier(rate).toLowerCase() === normalizedMethod
    )
    if (methodMatch) return methodMatch
  }

  let candidateRates = rates
  const normalizedProviders = preferredProviders
    .map((id) => normalizeIdentifier(id))
    .filter(Boolean)

  if (normalizedProviders.length) {
    const providerMatches = rates.filter((rate) => {
      const providerId = getRateProviderId(rate)
      if (!providerId) return false
      return normalizedProviders.includes(providerId.toLowerCase())
    })
    if (providerMatches.length) {
      candidateRates = providerMatches
    }
  }

  const sorted = [...candidateRates].sort((a, b) => {
    const feeA =
      typeof a.shippingFee === 'number'
        ? a.shippingFee
        : a.isFree
          ? 0
          : Number.MAX_SAFE_INTEGER
    const feeB =
      typeof b.shippingFee === 'number'
        ? b.shippingFee
        : b.isFree
          ? 0
          : Number.MAX_SAFE_INTEGER
    if (feeA !== feeB) return feeA - feeB

    const etaA =
      a.estimatedDays?.min ??
      a.estimatedDays?.max ??
      Number.MAX_SAFE_INTEGER
    const etaB =
      b.estimatedDays?.min ??
      b.estimatedDays?.max ??
      Number.MAX_SAFE_INTEGER
    if (etaA !== etaB) return etaA - etaB

    return (a.shippingMethod || '').localeCompare(b.shippingMethod || '')
  })

  return sorted[0] || null
}

export {
  normalizeIdentifier,
  getRateProviderId,
  getRateUniqueId,
  getRateMethodIdentifier,
  findBestShippingRate
}
