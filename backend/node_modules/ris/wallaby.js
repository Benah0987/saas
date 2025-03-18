module.exports = wallaby => {
  return {
    files: ['src/**/*.js', '__test__/__fixtures__/**/*'],
    tests: ['__test__/**/*.spec.js'],
    env: {
      type: 'node',
    },
    testFramework: 'jest',
  }
}
