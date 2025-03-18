const primitivesValidData = {
  foo: 'bar',
  bar: 1,
  baz: true,
  boop: false,
  beep: null,
}

const primitivesInvalidData = {
  foo: 'bar',
  bar: 1,
  baz: true,
  boop: 'foo',
  beep: 1,
}

module.exports = {
  primitivesInvalidData,
  primitivesValidData,
}
