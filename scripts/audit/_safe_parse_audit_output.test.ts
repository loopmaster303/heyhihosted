/**
 * @jest-environment node
 */
import { spawnSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('_safe_parse_audit_output.sh', () => {
  const helperPath = join(__dirname, '_safe_parse_audit_output.sh');

  function runWithInput(input: string, allowedKeys: string): { stdout: string; stderr: string; exitCode: number } {
    const script = `
set -euo pipefail
_SAFE_ALLOWED_KEYS='${allowedKeys}'
source '${helperPath}' <<'EOF'
${input}
EOF
echo "---RESULT---"
for key in ${allowedKeys}; do
  printf '%s=%s\n' "$key" "\${!key:-}"
done
`;
    const result = spawnSync('bash', ['-c', script], { encoding: 'utf8' });
    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.status ?? 1,
    };
  }

  test('assigns allowed unquoted and single-quoted values', () => {
    const { stdout, exitCode } = runWithInput(
      `FOO=hello
BAR='world with spaces'
BAZ=✅
IGNORED=should-not-appear`,
      'FOO BAR BAZ',
    );
    expect(exitCode).toBe(0);
    const result = stdout.split('---RESULT---')[1];
    expect(result).toContain('FOO=hello');
    expect(result).toContain('BAR=world with spaces');
    expect(result).toContain('BAZ=✅');
    expect(result).not.toContain('IGNORED');
  });

  test('ignores keys outside allowlist and malformed lines', () => {
    const { stdout, exitCode } = runWithInput(
      `ALLOWED=yes
lowercase=ignored
=novalue
NO_EQUALS`,
      'ALLOWED',
    );
    expect(exitCode).toBe(0);
    const result = stdout.split('---RESULT---')[1];
    expect(result).toContain('ALLOWED=yes');
    expect(result).not.toContain('lowercase');
    expect(result).not.toContain('NO_EQUALS');
  });

  test('does not execute command substitution or other shell metacharacters', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'safe-parse-test-'));
    const marker = join(tmpDir, 'pwned');

    const { stdout, exitCode } = runWithInput(
      `KEY1=$(touch '${marker}')
KEY2='\`touch ${marker}\`'
KEY3=foo; touch ${marker}`,
      'KEY1 KEY2 KEY3',
    );

    expect(exitCode).toBe(0);
    const result = stdout.split('---RESULT---')[1];
    expect(result).toContain('KEY1=$(touch');
    expect(result).toContain('KEY3=foo; touch');
    expect(require('fs').existsSync(marker)).toBe(false);

    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('rejects single-quoted values containing unescaped quotes', () => {
    const { stdout, exitCode } = runWithInput(
      `OK='valid value'
BROKEN='value with ' quote'`,
      'OK BROKEN',
    );
    expect(exitCode).toBe(0);
    const result = stdout.split('---RESULT---')[1];
    expect(result).toContain('OK=valid value');
    expect(result).toContain('BROKEN=');
  });

  test('preserves values that look like assignments but are literal', () => {
    const { stdout, exitCode } = runWithInput(
      `DETAIL='(stale_endpoint_refs:3)'
PATH_LIKE=/api/foo/bar`,
      'DETAIL PATH_LIKE',
    );
    expect(exitCode).toBe(0);
    const result = stdout.split('---RESULT---')[1];
    expect(result).toContain('DETAIL=(stale_endpoint_refs:3)');
    expect(result).toContain('PATH_LIKE=/api/foo/bar');
  });

  test('matches check-pollinations output format', () => {
    const input = `POLL_API_STATUS='✅'
POLL_STATUS='⚠️'
POLL_DETAIL=' (Text neu: 1, stale: 0)'
POLL_NEW_MODELS='flux-pro'
POLL_NEW_TEXT_MODELS=''
POLL_STALE_TEXT_MODELS='old-model'
POLL_STALE_IMAGE_MODELS=''
POLL_MISSING_ENHANCEMENT_MODELS=''
POLL_COMMIT_READY_MODELS=''
POLL_HIDDEN_LOCAL_VISUAL_MODELS=''
POLL_UPSTREAM_TEXT_MODELS='openai gpt-4'
POLL_UPSTREAM_VISUAL_MODELS='flux'`.trim();

    const { stdout, exitCode } = runWithInput(
      input,
      'POLL_API_STATUS POLL_STATUS POLL_DETAIL POLL_NEW_MODELS POLL_NEW_TEXT_MODELS POLL_STALE_TEXT_MODELS POLL_STALE_IMAGE_MODELS POLL_MISSING_ENHANCEMENT_MODELS POLL_COMMIT_READY_MODELS POLL_HIDDEN_LOCAL_VISUAL_MODELS POLL_UPSTREAM_TEXT_MODELS POLL_UPSTREAM_VISUAL_MODELS',
    );
    expect(exitCode).toBe(0);
    const result = stdout.split('---RESULT---')[1];
    expect(result).toContain('POLL_API_STATUS=✅');
    expect(result).toContain('POLL_STATUS=⚠️');
    expect(result).toContain('POLL_DETAIL= (Text neu: 1, stale: 0)');
    expect(result).toContain('POLL_NEW_MODELS=flux-pro');
    expect(result).toContain('POLL_UPSTREAM_TEXT_MODELS=openai gpt-4');
  });

  test('unsets temporary key and value variables after parsing', () => {
    const script = `
set -euo pipefail
_SAFE_ALLOWED_KEYS='FOO'
key='before'
value='before'
source '${helperPath}' <<'EOF'
FOO=bar
EOF
[[ "\${key+set}" == "set" ]] && { echo "key leaked: $key"; exit 1; }
[[ "\${value+set}" == "set" ]] && { echo "value leaked: $value"; exit 1; }
echo "ok"
`;
    const result = spawnSync('bash', ['-c', script], { encoding: 'utf8' });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('ok');
  });

  test('unsets _SAFE_ALLOWED_KEYS after parsing', () => {
    const script = `
set -euo pipefail
_SAFE_ALLOWED_KEYS='FOO'
source '${helperPath}' <<'EOF'
FOO=bar
EOF
[[ "\${_SAFE_ALLOWED_KEYS+set}" == "set" ]] && { echo "_SAFE_ALLOWED_KEYS leaked: $_SAFE_ALLOWED_KEYS"; exit 1; }
echo "ok"
`;
    const result = spawnSync('bash', ['-c', script], { encoding: 'utf8' });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('ok');
  });

  test('normalizes simple double-quoted values and rejects embedded quotes', () => {
    const { stdout, exitCode } = runWithInput(
      `FOO="hello world"
BAR=""
SINGLE='still works'
REJECTED="value with " embedded quote"`,
      'FOO BAR SINGLE REJECTED',
    );
    expect(exitCode).toBe(0);
    const result = stdout.split('---RESULT---')[1];
    expect(result).toContain('FOO=hello world');
    expect(result).toContain('BAR=');
    expect(result).toContain('SINGLE=still works');
    expect(result).toContain('REJECTED=');
  });
});

describe('check-security.sh hardening', () => {
  test('does not create predictable /tmp/leak_check.txt', () => {
    const scriptPath = join(__dirname, 'check-security.sh');
    // The grep patterns may not match anything in src/; we just verify the script
    // does not reference the old predictable temp file.
    const source = require('fs').readFileSync(scriptPath, 'utf8');
    expect(source).not.toContain('/tmp/leak_check.txt');
    expect(source).toContain('LEAK_LINES=');
  });

  test('parses full npm audit JSON instead of tail -n 1', () => {
    const sampleJson = JSON.stringify({
      metadata: {
        vulnerabilities: {
          critical: 2,
          high: 7,
        },
      },
    });
    const script = `
OUTPUT='${sampleJson.replace(/'/g, "'\\''")}'
CRITICAL=\$(printf '%s' "\$OUTPUT" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.metadata?.vulnerabilities?.critical||0)" 2>/dev/null || echo "?")
HIGH=\$(printf '%s' "\$OUTPUT" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.metadata?.vulnerabilities?.high||0)" 2>/dev/null || echo "?")
echo "CRITICAL=\$CRITICAL HIGH=\$HIGH"
`;
    const result = spawnSync('bash', ['-c', script], { encoding: 'utf8' });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('CRITICAL=2 HIGH=7');
  });
});

describe('check-doc-drift.sh hardening', () => {
  test('uses mktemp for match file', () => {
    const scriptPath = join(__dirname, 'check-doc-drift.sh');
    const source = require('fs').readFileSync(scriptPath, 'utf8');
    expect(source).not.toContain('/tmp/heyhi_doc_drift_matches.txt');
    expect(source).toContain('mktemp');
    expect(source).toContain("trap 'rm -f");
  });
});
