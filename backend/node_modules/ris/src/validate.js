const { compose, getDefaultValue } = require('./utils')

const validate = (schema, data) => {
  const newData = Object.assign({}, data)
  const errors = []

  Object.keys(newData).forEach(key => {
    if (newData[key] instanceof Object) {
      try {
        const res = validate(schema[key], newData[key])

        console.log(res)
      } catch (err) {
        console.log(err.message)
      }
    } else {
      const defaultValue = getDefaultValue(schema[key])
      const rules = [].concat(schema[key])
      const result = compose(
        defaultValue ? rules.slice(0, rules.length - 1) : rules,
      )(newData[key])

      if (!result[0] && defaultValue) {
        Object.assign(newData, {
          [key]: defaultValue,
        })
      } else if (!result[0]) {
        errors.push(result[2](key))
      }
    }
  })

  if (errors.length > 0) {
    throw new Error(errors.join('\n'))
  }

  return newData
}

module.exports = {
  validate,
}
