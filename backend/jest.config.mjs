export default {
  "testTimeout": 60000000,
  "testEnvironment": "node",
  "moduleFileExtensions": ["ts", "tsx", "js", "json", "node"],
  roots: ['test'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest']
  },
  bail: 1,
  verbose: true,

  // ESM transformation config
  // https://kulshekhar.github.io/ts-jest/docs/guides/esm-support#examples
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true
      }
    ]
  }
}
