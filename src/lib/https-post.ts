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

const PROXY_SCRIPT = path.join(process.cwd(), 'src', 'lib', 'auth-proxy.js');

interface ProxyResponse {
  status: number;
  headers: Record<string, string>;
  bodyBase64: string;
  contentType: string;
  error?: string;
}

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
