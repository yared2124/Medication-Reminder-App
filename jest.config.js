module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '\\.(mp3|wav|ogg|png|jpg|jpeg|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
};
