const { createErrorMessage } = require('./utils')

const schema = {
  number: value => [
    typeof value === 'number',
    value,
    createErrorMessage('Number', value),
  ],

  string: value => [
    typeof value === 'string',
    value,
    createErrorMessage('String', value),
  ],

  boolean: value => [
    typeof value === 'boolean',
    value,
    createErrorMessage('Boolean', value),
  ],

  min: expectedValue => value => [
    value[0] === false ? false : value[1] >= expectedValue,
    value[1],
    createErrorMessage('min', value[1]),
  ],

  max: expectedValue => value => [
    value[0] === false ? false : value[1] <= expectedValue,
    value[1],
    createErrorMessage('max', value[1]),
  ],

  null: value => [value === null, value, createErrorMessage('null', value)],
}

module.exports = {
  schema,
}
