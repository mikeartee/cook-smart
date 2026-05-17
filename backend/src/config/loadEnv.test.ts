/**
 * Tests for the environment loader at `backend/load-env.js`.
 *
 * Pins the post-#23 contract: when no `.env` / `.env.secure` file exists,
 * the loader must NOT call `process.exit(1)`. It must emit a warning so the
 * missing-env case is obvious, then return so the caller (`server.ts`) can
 * surface clearer per-feature errors when specific env vars are missing.
 *
 * Test shape: mock `fs.existsSync` and `dotenv.config`, capture console
 * output, call `loadEnvironment()`, assert.
 */

import * as fs from 'fs';

jest.mock('fs');
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

const fsMock = fs as jest.Mocked<typeof fs>;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenvMock = require('dotenv') as {config: jest.Mock};

// Import after mocks are registered.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {loadEnvironment} = require('../../load-env') as {
  loadEnvironment: () => void;
};

describe('loadEnvironment (issue #23)', () => {
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    // Spy on process.exit and throw, so any accidental exit calls turn into
    // visible test failures rather than terminating Jest.
    processExitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((code?: string | number | null | undefined) => {
        throw new Error(`process.exit(${code}) was called unexpectedly`);
      });
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('does not call process.exit when neither .env.secure nor .env exists', () => {
    fsMock.existsSync.mockReturnValue(false);

    expect(() => loadEnvironment()).not.toThrow();
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('emits a warn-level log when neither .env.secure nor .env exists', () => {
    fsMock.existsSync.mockReturnValue(false);

    loadEnvironment();

    // We accept either console.warn or console.error as a "warn-level" signal,
    // as long as something visible is emitted that names the missing-env case.
    const allWarnings = [
      ...consoleWarnSpy.mock.calls.flat(),
      ...consoleErrorSpy.mock.calls.flat(),
    ].filter((arg): arg is string => typeof arg === 'string');

    expect(allWarnings.length).toBeGreaterThan(0);
    const combined = allWarnings.join(' ').toLowerCase();
    expect(combined).toContain('no environment file');
  });

  it('loads .env when present (happy-path regression guard)', () => {
    // .env.secure missing, .env present.
    fsMock.existsSync.mockImplementation((p: fs.PathLike) =>
      String(p).endsWith('.env'),
    );

    loadEnvironment();

    expect(dotenvMock.config).toHaveBeenCalledTimes(1);
    const callArgs = dotenvMock.config.mock.calls[0]?.[0] as
      | {path?: string}
      | undefined;
    expect(callArgs?.path).toMatch(/\.env$/);
  });

  it('prefers .env.secure over .env when both exist (happy-path regression guard)', () => {
    fsMock.existsSync.mockReturnValue(true);

    loadEnvironment();

    expect(dotenvMock.config).toHaveBeenCalledTimes(1);
    const callArgs = dotenvMock.config.mock.calls[0]?.[0] as
      | {path?: string}
      | undefined;
    expect(callArgs?.path).toMatch(/\.env\.secure$/);
  });
});
