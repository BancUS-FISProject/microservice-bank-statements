module.exports = {
    testEnvironment: 'node',
    testTimeout: 20000,
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/db/models/**',
        '!src/lib/scheduler/**',
    ],
    testMatch: [
        '**/test/**/*.test.js',
    ],
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
};
