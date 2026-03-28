import { spawn } from 'child_process';
import path from 'path';

/**
 * Make an HTTPS request by spawning a separate Node.js process.
 * 
 * Next.js 16 patches the `https` module in the main process, stripping headers.
 * `curl` child process proved unreliable (401 errors).
 * Solution: Spawn a vanilla Node.js child process running `src/lib/auth-proxy.js`
 * which uses an unpatched `https` module.
 */

// Point to the public script which is a static asset, avoiding bundling
const scriptPath = ['public', 'scripts', 'auth-proxy.js'];
const PROXY_SCRIPT = path.join(process.cwd(), ...scriptPath);

interface ProxyResponse {
  status: number;
  headers: Record<string, string>;
  bodyBase64: string;
  contentType: string;
  error?: string;
}

interface StreamProxyMeta {
  type: 'meta';
  status: number;
  headers: Record<string, string>;
  contentType: string;
}

interface StreamProxyChunk {
  type: 'chunk';
  dataBase64: string;
}

interface StreamProxyEnd {
  type: 'end';
}

interface StreamProxyError {
  type: 'error';
  error: string;
}

type StreamProxyMessage = StreamProxyMeta | StreamProxyChunk | StreamProxyEnd | StreamProxyError;

function runNodeProxy(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: string
): Promise<{ status: number; body: string; buffer: Buffer; contentType: string }> {
  return new Promise((resolve, reject) => {
    // Prepare input JSON
    const inputPayload = JSON.stringify({
      url,
      method,
      headers,
      body 
    });

    const child = spawn('node', [PROXY_SCRIPT]);

    child.stdin.write(inputPayload);
    child.stdin.end();

    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', c => stdoutData += c);
    child.stderr.on('data', c => stderrData += c);

    child.on('close', (code) => {
      if (code !== 0) {
        console.error('[NodeProxy] Exited with code', code, stderrData);
        return reject(new Error(`Proxy process exited with code ${code}: ${stderrData}`));
      }

      try {
        const result: ProxyResponse = JSON.parse(stdoutData);
        
        if (result.error) {
          return reject(new Error(`Proxy Internal Error: ${result.error}`));
        }

        const buffer = Buffer.from(result.bodyBase64, 'base64');
        const bodyStr = buffer.toString('utf-8');

        resolve({
          status: result.status,
          body: bodyStr,
          buffer: buffer,
          contentType: result.contentType
        });
      } catch (e) {
        console.error('[NodeProxy] Invalid JSON output:', stdoutData);
        reject(new Error('Invalid output from proxy'));
      }
    });

    child.on('error', (err) => reject(err));
  });
}

export async function httpsPost(
  url: string,
  headers: Record<string, string>,
  body: string
): Promise<{ status: number; body: string }> {
  const res = await runNodeProxy('POST', url, headers, body);
  return { status: res.status, body: res.body };
}

export async function httpsGet(
  url: string,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: string }> {
  const res = await runNodeProxy('GET', url, headers);
  return { status: res.status, body: res.body };
}

export async function httpsFetchBinary(
  url: string,
  headers: Record<string, string> = {}
): Promise<{ status: number; buffer: Buffer; contentType: string }> {
  const res = await runNodeProxy('GET', url, headers);
  return { status: res.status, buffer: res.buffer, contentType: res.contentType };
}

export async function httpsFetchBinaryPost(
  url: string,
  headers: Record<string, string> = {},
  body: string
): Promise<{ status: number; buffer: Buffer; contentType: string }> {
  const res = await runNodeProxy('POST', url, headers, body);
  return { status: res.status, buffer: res.buffer, contentType: res.contentType };
}

export async function httpsPostStream(
  url: string,
  headers: Record<string, string>,
  body: string,
): Promise<{ status: number; headers: Record<string, string>; stream: ReadableStream<Uint8Array> }> {
  const inputPayload = JSON.stringify({
    url,
    method: 'POST',
    headers,
    body,
    stream: true,
  });

  const child = spawn('node', [PROXY_SCRIPT]);
  child.stdin.write(inputPayload);
  child.stdin.end();

  let stderrData = '';
  child.stderr.on('data', (chunk) => {
    stderrData += chunk.toString();
  });

  const stdout = child.stdout;
  if (!stdout) {
    throw new Error('Streaming proxy stdout is unavailable');
  }

  let buffer = '';
  let meta: StreamProxyMeta | null = null;
  const pendingChunks: Uint8Array[] = [];
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;
  let streamClosed = false;
  let metaResolved = false;

  const closeStream = () => {
    if (streamClosed) return;
    streamClosed = true;
    controllerRef?.close();
  };

  const errorStream = (error: Error) => {
    if (streamClosed) return;
    streamClosed = true;
    controllerRef?.error(error);
  };

  const pushChunk = (chunk: Uint8Array) => {
    if (streamClosed) return;
    if (controllerRef) {
      controllerRef.enqueue(chunk);
      return;
    }
    pendingChunks.push(chunk);
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;
      while (pendingChunks.length > 0) {
        const nextChunk = pendingChunks.shift();
        if (nextChunk) controller.enqueue(nextChunk);
      }
    },
    cancel() {
      if (!child.killed) {
        child.kill();
      }
    },
  });

  const handleMessage = (message: StreamProxyMessage) => {
    if (message.type === 'meta') {
      meta = message;
      metaResolved = true;
      return;
    }

    if (message.type === 'chunk') {
      pushChunk(Buffer.from(message.dataBase64, 'base64'));
      return;
    }

    if (message.type === 'end') {
      closeStream();
      return;
    }

    if (message.type === 'error') {
      const error = new Error(`Proxy Internal Error: ${message.error}`);
      metaResolved = true;
      errorStream(error);
    }
  };

  const metaPromise = new Promise<StreamProxyMeta>((resolve, reject) => {
    stdout.on('data', (chunk: Buffer | string) => {
      buffer += chunk.toString();

      let newlineIndex = buffer.indexOf('\n');
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (line) {
          try {
            const parsed = JSON.parse(line) as StreamProxyMessage;
            handleMessage(parsed);
            if (parsed.type === 'meta' && meta) {
              resolve(meta);
            } else if (parsed.type === 'error') {
              reject(new Error(`Proxy Internal Error: ${parsed.error}`));
            }
          } catch (error) {
            reject(new Error(`Invalid output from streaming proxy: ${String(error)}`));
          }
        }

        newlineIndex = buffer.indexOf('\n');
      }
    });

    child.on('close', (code) => {
      if (!metaResolved && code !== 0) {
        reject(new Error(`Proxy process exited with code ${code}: ${stderrData}`));
      } else {
        closeStream();
      }
    });

    child.on('error', (err) => {
      reject(err);
      errorStream(err);
    });
  });

  const resolvedMeta = await metaPromise;
  return { status: resolvedMeta.status, headers: resolvedMeta.headers, stream };
}
