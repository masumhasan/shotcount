import fs from 'node:fs';
import path from 'node:path';

function parseDotenv(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const text = fs.readFileSync(filePath, 'utf8');
  const out = {};

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;

    const key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    out[key] = value;
  }

  return out;
}

function maskKey(key) {
  if (!key) return '(empty)';
  if (key.length <= 12) return `${key.slice(0, 4)}…`;
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

async function main() {
  const projectRoot = process.cwd();
  const envFile = path.join(projectRoot, '.env');
  const envFromFile = parseDotenv(envFile);

  const apiKey = (process.env.OPENAI_API_KEY ?? envFromFile.OPENAI_API_KEY ?? '').trim();

  if (!apiKey) {
    console.error('Missing OPENAI_API_KEY (process.env and .env both empty).');
    console.error(
      'For production (Netlify): set OPENAI_API_KEY in the site env vars and trigger a rebuild so Vite can embed it.',
    );
    process.exit(1);
  }

  console.log(`Using OPENAI_API_KEY: ${maskKey(apiKey)} (length ${apiKey.length})`);

  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a test harness. Reply with exactly: OK' },
      { role: 'user', content: 'ping' },
    ],
    max_tokens: 16,
    temperature: 0,
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  if (!res.ok) {
    console.error(`OpenAI request FAILED: ${res.status} ${res.statusText}`);
    if (json?.error?.message) console.error('API error message:', json.error.message);
    else console.error('Raw response (truncated):', text.slice(0, 500));
    process.exit(1);
  }

  const content = json?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    console.error('OpenAI returned 200 but no message content in choices[0].');
    console.error('Parsed keys:', json && typeof json === 'object' ? Object.keys(json) : typeof json);
    process.exit(1);
  }

  console.log('OpenAI request PASSED.');
  console.log('Assistant reply:', content);
}

main().catch((err) => {
  console.error('OpenAI test crashed:', err);
  process.exit(1);
});
