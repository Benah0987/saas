const err = (property, expectedType, actualValue) =>
  `Validation error: ${property} expected ${expectedType} got ${actualValue}`

const createErrorMessage = (expectedType, actualValue) => property =>
  err(property, expectedType, actualValue)

const isNil = value => value === null || value === undefined

const compose = funs => value =>
  funs.reduce((acc, fun, i) => {
    if (i === 0) {
      return fun(value)
    }

    return fun(acc)
  }, null)

const getDefaultValue = entry => {
  if (Array.isArray(entry)) {
    const lastElement = entry[entry.length - 1]

    return lastElement instanceof Function ? null : lastElement
  }

  return null
}

module.exports = {
  err,
  createErrorMessage,
  isNil,
  compose,
  getDefaultValue,
}
