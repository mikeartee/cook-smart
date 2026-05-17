/**
 * Unit tests for the tiny HTTP helper at src/utils/httpClient.ts.
 *
 * Pins the contract that replaces axios in the codebase as part of issue #34.
 * Uses jest's mock for global.fetch so the tests don't make real network calls.
 */

import {httpGet, httpPost} from './httpClient';

const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>();
beforeAll(() => {
  // @ts-expect-error — jest.fn type doesn't perfectly match the real fetch
  global.fetch = fetchMock;
});

beforeEach(() => {
  fetchMock.mockReset();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {'content-type': 'application/json'},
  });
}

describe('httpGet', () => {
  it('returns parsed JSON, status, and statusText on a 200 response', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({hello: 'world'}));

    const res = await httpGet<{hello: string}>('https://example.test/x');

    expect(res.data).toEqual({hello: 'world'});
    expect(res.status).toBe(200);
    expect(typeof res.statusText).toBe('string');
  });

  it('appends query params to the URL', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}));

    await httpGet('https://example.test/x', {
      params: {foo: 'bar', n: 42, missing: undefined},
    });

    const calledUrl = fetchMock.mock.calls[0]?.[0] as string;
    expect(calledUrl).toBe('https://example.test/x?foo=bar&n=42');
  });

  it('preserves existing query string when adding params', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}));

    await httpGet('https://example.test/x?keep=1', {params: {add: '2'}});

    const calledUrl = fetchMock.mock.calls[0]?.[0] as string;
    expect(calledUrl).toBe('https://example.test/x?keep=1&add=2');
  });

  it('passes custom headers through', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}));

    await httpGet('https://example.test/x', {
      headers: {Authorization: 'Bearer token'},
    });

    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.headers).toEqual({Authorization: 'Bearer token'});
  });

  it('aborts the request when the timeout elapses', async () => {
    jest.useFakeTimers();

    let capturedSignal: AbortSignal | undefined;
    fetchMock.mockImplementationOnce(async (_url, init) => {
      capturedSignal = init?.signal as AbortSignal | undefined;
      return new Promise<Response>((_resolve, reject) => {
        capturedSignal?.addEventListener('abort', () =>
          reject(new Error('aborted')),
        );
      });
    });

    const promise = httpGet('https://example.test/x', {timeout: 100});
    jest.advanceTimersByTime(101);

    await expect(promise).rejects.toThrow();
    expect(capturedSignal?.aborted).toBe(true);

    jest.useRealTimers();
  });

  it('returns text for non-JSON responses', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('plain text', {
        status: 200,
        headers: {'content-type': 'text/plain'},
      }),
    );

    const res = await httpGet<string>('https://example.test/x');

    expect(res.data).toBe('plain text');
    expect(res.status).toBe(200);
  });
});

describe('httpPost', () => {
  it('JSON-encodes a plain object body and sets Content-Type', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ok: true}));

    await httpPost('https://example.test/x', {a: 1, b: 'two'});

    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(JSON.stringify({a: 1, b: 'two'}));
    expect((init?.headers as Record<string, string>)['Content-Type']).toBe(
      'application/json',
    );
  });

  it('passes a string body through unchanged', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ok: true}));

    await httpPost('https://example.test/x', 'raw=string', {
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    });

    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.body).toBe('raw=string');
    expect((init?.headers as Record<string, string>)['Content-Type']).toBe(
      'application/x-www-form-urlencoded',
    );
  });

  it('preserves caller-supplied Content-Type for JSON bodies', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}));

    await httpPost(
      'https://example.test/x',
      {x: 1},
      {headers: {'content-type': 'application/vnd.cook-smart+json'}},
    );

    const init = fetchMock.mock.calls[0]?.[1];
    expect((init?.headers as Record<string, string>)['content-type']).toBe(
      'application/vnd.cook-smart+json',
    );
  });

  it('sends no body and no JSON Content-Type when body is null (axios.post-with-params parity)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}));

    await httpPost('https://example.test/x', null, {
      params: {foo: 'bar'},
      headers: {Authorization: 'Bearer t'},
    });

    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.body).toBeUndefined();
    const headers = init?.headers as Record<string, string>;
    expect(headers['Content-Type']).toBeUndefined();
    expect(headers['content-type']).toBeUndefined();
    expect(headers.Authorization).toBe('Bearer t');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://example.test/x?foo=bar');
  });
});
