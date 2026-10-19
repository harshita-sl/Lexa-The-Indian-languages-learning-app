import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { gnaniTTS, gnaniSTT, gnaniConfigured, gnaniLangCode } from './gnani';

const realFetch = globalThis.fetch;

beforeEach(() => {
  vi.stubEnv('GNANI_API_KEY', 'test-key-123');
  vi.stubEnv('GNANI_BASE_URL', 'https://api.vachana.ai');
});

afterEach(() => {
  globalThis.fetch = realFetch;
  vi.unstubAllEnvs();
});

describe('gnaniConfigured / gnaniLangCode', () => {
  it('is configured only when the key is set', () => {
    expect(gnaniConfigured()).toBe(true);
    vi.unstubAllEnvs();
    vi.stubEnv('GNANI_API_KEY', '');
    expect(gnaniConfigured()).toBe(false);
  });

  it('maps languages to BCP-47', () => {
    expect(gnaniLangCode('Telugu')).toBe('te-IN');
    expect(gnaniLangCode('kannada')).toBe('kn-IN');
    expect(gnaniLangCode('unknown')).toBe('hi-IN');
  });
});

describe('gnaniTTS', () => {
  it('POSTs to the inference endpoint with key header and returns audio', async () => {
    const audio = new Uint8Array([82, 73, 70, 70]).buffer;
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(audio, {
        status: 200,
        headers: { 'content-type': 'audio/wav' },
      })
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const res = await gnaniTTS('నమస్కారం', 'telugu');
    expect(res.audio.byteLength).toBe(4);
    expect(res.contentType).toBe('audio/wav');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.vachana.ai/api/v1/tts/inference');
    const headers = init.headers as Record<string, string>;
    expect(headers['X-API-Key-ID']).toBe('test-key-123');
    const body = JSON.parse(init.body as string);
    expect(body.text).toBe('నమస్కారం');
    expect(body.language).toBe('te-IN');
    expect(body.model).toBe('timbre-v3.0');
  });

  it('throws on non-OK responses', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response('unauthorized', { status: 401 })) as unknown as typeof fetch;
    await expect(gnaniTTS('hi', 'telugu')).rejects.toThrow(/401/);
  });
});

describe('gnaniSTT', () => {
  it('POSTs multipart form and returns the transcript', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          request_id: 'req_1',
          transcript: 'నమస్కారం',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const res = await gnaniSTT(Buffer.from([1, 2, 3]), 'telugu');
    expect(res.transcript).toBe('నమస్కారం');
    expect(res.requestId).toBe('req_1');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.vachana.ai/stt/v3');
    const headers = init.headers as Record<string, string>;
    expect(headers['X-API-Key-ID']).toBe('test-key-123');
    const form = init.body as FormData;
    expect(form.get('language_code')).toBe('te-IN');
    expect(form.get('audio_file')).toBeTruthy();
  });

  it('throws on empty transcript and on errors', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, transcript: '' }), { status: 200 })
    ) as unknown as typeof fetch;
    await expect(gnaniSTT(Buffer.from([1]), 'telugu')).rejects.toThrow(/empty/i);

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response('x', { status: 503 })) as unknown as typeof fetch;
    await expect(gnaniSTT(Buffer.from([1]), 'telugu')).rejects.toThrow(/503/);
  });

  it('throws when unconfigured instead of sending a request', async () => {
    vi.unstubAllEnvs();
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    await expect(gnaniTTS('x', 'telugu')).rejects.toThrow(/not configured/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
