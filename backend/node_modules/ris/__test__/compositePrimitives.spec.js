const { schema, validate } = require('src/index')

describe('composition with default value', () => {
  it('should replace failed', () => {
    const primitivesSchema = {
      foo: [schema.string, 'bar'],
    }

    expect(
      validate(primitivesSchema, {
        foo: null,
      }),
    ).toEqual({
      foo: 'bar',
    })
  })

  it('should replace multiple failed', () => {
    const primitivesSchema = {
      foo: [schema.string, 'bar'],
      beep: [schema.number, 1],
    }

    expect(
      validate(primitivesSchema, {
        foo: null,
        beep: undefined,
      }),
    ).toEqual({
      foo: 'bar',
      beep: 1,
    })
  })
})

describe('composition with meta rules', () => {
  it('should correctly validate max and min numbers', () => {
    const compositeSchema = {
      foo: [schema.number, schema.min(2), schema.max(5)],
    }

    expect(
      validate(compositeSchema, {
        foo: 3,
      }),
    ).toEqual({
      foo: 3,
    })
    expect(() =>
      validate(compositeSchema, {
        foo: 8,
      }),
    ).toThrow()
    expect(() =>
      validate(compositeSchema, {
        foo: 1,
      }),
    ).toThrowErrorMatchingSnapshot()
  })
})
