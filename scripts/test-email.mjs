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

function fromEnv(key, fallback) {
  const value = process.env[key] ?? fallback[key];
  return typeof value === 'string' ? value.trim() : '';
}

function hasSuspiciousWhitespace(value) {
  return /[\u00A0\u2000-\u200B\u202F\u205F\u3000]/.test(value);
}

async function main() {
  const projectRoot = process.cwd();
  const envFile = path.join(projectRoot, '.env');
  const envFromFile = parseDotenv(envFile);

  const projectUrl = fromEnv('SUPABASE_PROJECT_URL', envFromFile).replace(/\/+$/, '');
  const anonKey = fromEnv('SUPABASE_ANON_KEY', envFromFile);
  const ownerEmail = fromEnv('EMAIL_OWNER', envFromFile);
  const emailPassword = fromEnv('EMAIL_PASSWORD', envFromFile);

  const missing = [];
  if (!projectUrl) missing.push('SUPABASE_PROJECT_URL');
  if (!anonKey) missing.push('SUPABASE_ANON_KEY');
  if (!ownerEmail) missing.push('EMAIL_OWNER');

  if (missing.length) {
    console.error(`Missing required env values: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (emailPassword && hasSuspiciousWhitespace(emailPassword)) {
    console.warn(
      'Warning: EMAIL_PASSWORD contains non-standard whitespace. This often breaks Gmail SMTP auth.',
    );
  }

  const endpoint = `${projectUrl}/functions/v1/send-email`;
  const now = new Date().toISOString();

  console.log(`Testing Edge Function endpoint: ${endpoint}`);
  console.log(`Using owner email: ${ownerEmail}`);

  const sendPayload = {
    action: 'send',
    to: ownerEmail,
    subject: `[Shotcount email test] ${now}`,
    html: `<p>Email system test sent at <strong>${now}</strong>.</p>`,
  };

  const summaryPayload = {
    action: 'chat-summary',
    leadName: 'Test Lead',
    leadPhone: '000-000-0000',
    leadEmail: 'test@example.com',
    leadType: 'Homeowner',
    roomTypes: ['Living Room'],
    projectType: 'Feature wall',
    timeline: 'Next month',
    budget: '$500-$1000',
    hasWallpaper: 'No',
    tags: ['test'],
    messages: [
      { sender: 'user', text: 'I need wallpaper installed in one room.' },
      { sender: 'bot', text: 'Great. Do you have a timeline?' },
      { sender: 'user', text: 'Next month ideally.' },
    ],
  };

  const tests = [
    { label: 'send', payload: sendPayload },
    { label: 'chat-summary', payload: summaryPayload },
  ];

  for (const test of tests) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify(test.payload),
    });

    const bodyText = await response.text();
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch {
      body = bodyText;
    }

    if (!response.ok) {
      console.error(
        `Email test FAILED for "${test.label}" (${response.status} ${response.statusText})`,
      );
      console.error('Response:', body);

      if (response.status === 401) {
        console.error('Likely issue: invalid auth token or function JWT verification mismatch.');
      } else if (response.status === 404) {
        console.error('Likely issue: send-email function is not deployed to this project.');
      } else if (response.status >= 500) {
        console.error('Likely issue: runtime error in Edge Function or missing function secrets.');
      }

      process.exit(1);
    }

    console.log(`Email test PASSED for "${test.label}".`);
    console.log('Response:', body);
  }
}

main().catch((err) => {
  console.error('Email test crashed:', err);
  process.exit(1);
});
