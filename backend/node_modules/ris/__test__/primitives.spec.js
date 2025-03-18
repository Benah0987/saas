const { schema, validate } = require('src/index')
const {
  primitivesInvalidData,
  primitivesValidData,
} = require('__fixtures__/data/primitive')

describe('validate', () => {
  const primitivesSchema = {
    foo: schema.string,
    bar: schema.number,
    baz: schema.boolean,
    boop: schema.boolean,
    beep: schema.null,
  }

  it('should returns data if it is fully match to scheme', () => {
    expect(validate(primitivesSchema, primitivesValidData)).toEqual(
      primitivesValidData,
    )
  })

  it('should throw error with reason if data not match to scheme', () => {
    expect(() =>
      validate(primitivesSchema, primitivesInvalidData),
    ).toThrowErrorMatchingSnapshot()
  })
})
