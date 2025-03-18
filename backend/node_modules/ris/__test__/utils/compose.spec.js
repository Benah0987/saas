const { compose } = require('src/utils/index')

describe('compose', () => {
  it('should call given functions in sequence and pass result to next', () => {
    const foo = value => value + 1
    const bar = value => value + 2

    const res = compose([foo, bar])(1)

    expect(res).toBe(4)
  })
})
