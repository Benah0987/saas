const { schema } = require('src/index')

describe('Schema rules', () => {
  describe('number', () => {
    it('should correctly validate data', () => {
      expect(schema.number(1)).toEqual([true, 1, expect.any(Function)])
      expect(schema.number('foo')).toEqual([false, 'foo', expect.any(Function)])
    })
  })

  describe('string', () => {
    it('should correctly validate data', () => {
      expect(schema.string('foo')).toEqual([true, 'foo', expect.any(Function)])
      expect(schema.string(1)).toEqual([false, 1, expect.any(Function)])
    })
  })

  describe('boolean', () => {
    it('should correctly validate data', () => {
      expect(schema.boolean(true)).toEqual([true, true, expect.any(Function)])
      expect(schema.boolean(false)).toEqual([true, false, expect.any(Function)])
      expect(schema.boolean(1)).toEqual([false, 1, expect.any(Function)])
    })
  })

  describe('min', () => {
    it('should correctly validate data', () => {
      expect(schema.min(2)([true, 3, null])).toEqual([
        true,
        3,
        expect.any(Function),
      ])
      expect(schema.min(3)([true, 1, null])).toEqual([
        false,
        1,
        expect.any(Function),
      ])
    })
  })

  describe('max', () => {
    it('should correctly validate data', () => {
      expect(schema.max(5)([true, 3, null])).toEqual([
        true,
        3,
        expect.any(Function),
      ])
      expect(schema.max(3)([true, 5, null])).toEqual([
        false,
        5,
        expect.any(Function),
      ])
    })
  })

  describe('null', () => {
    it('should correctly validate data', () => {
      expect(schema.null(null)).toEqual([true, null, expect.any(Function)])
      expect(schema.null(1)).toEqual([false, 1, expect.any(Function)])
    })
  })
})
