module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'], rootDir: '.', testRegex: 'test/.*\\.spec\\.ts$', testEnvironment: 'node',
  // otplib dùng các gói ESM → cho ts-jest biên dịch lại
  transform: { '^.+\\.[tj]s$': ['ts-jest', { diagnostics: false, tsconfig: { allowJs: true, esModuleInterop: true, module: 'commonjs', target: 'ES2022', experimentalDecorators: true, emitDecoratorMetadata: true } }] },
  transformIgnorePatterns: ['/node_modules/(?!(@scure|@noble|@otplib|otplib)/)'],
};
