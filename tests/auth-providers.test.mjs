import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appOrigin, googleProfile, newPasswordSchema, resetLink, sendResetEmail } from '../src/server/auth-providers.ts';

test('passwords respect bcrypt UTF-8 byte limit', () => {
  assert.equal(newPasswordSchema.safeParse('x'.repeat(72)).success, true);
  assert.equal(newPasswordSchema.safeParse('x'.repeat(73)).success, false);
  assert.equal(newPasswordSchema.safeParse('é'.repeat(37)).success, false);
});

test('canonical origin is validated and reset token remains in fragment', () => {
  assert.equal(appOrigin('https://example.com'), 'https://example.com');
  assert.equal(appOrigin('http://example.com'), null);
  assert.equal(appOrigin('https://evil@example.com'), null);
  assert.equal(appOrigin('https://example.com/path'), null);
  assert.equal(appOrigin(undefined), null);
  const url = new URL(resetLink('https://example.com', 'a'.repeat(64)));
  assert.equal(url.search, '');
  assert.equal(new URLSearchParams(url.hash.slice(1)).get('reset_token'), 'a'.repeat(64));
});

test('Google code exchange uses the expected endpoints and rejects unverified identity', async () => {
  const original = globalThis.fetch; const requests = [];
  try {
    globalThis.fetch = async (url, options) => { requests.push([url, options]); return new Response(JSON.stringify(requests.length === 1 ? { access_token: 'test-token' } : { sub: 'google-sub', email: 'user@example.com', email_verified: true, name: 'User' }), {status:200}); };
    const profile = await googleProfile('code', 'id', 'secret', 'https://example.com');
    assert.equal(profile.sub, 'google-sub');
    assert.equal(requests[0][0], 'https://oauth2.googleapis.com/token');
    assert.equal(requests[0][1].body.get('redirect_uri'), 'https://example.com/api/v1/auth/google/callback');
    assert.equal(requests[1][0], 'https://openidconnect.googleapis.com/v1/userinfo');
    assert.equal(requests[1][1].headers.Authorization, 'Bearer test-token');
    globalThis.fetch = async url => new Response(JSON.stringify(url.includes('/token') ? {access_token:'token'} : {sub:'same-email-different-sub', email:'user@example.com', email_verified:false}), {status:200});
    await assert.rejects(googleProfile('code','id','secret','https://example.com'));
    globalThis.fetch = async () => new Response('{}', {status:400});
    await assert.rejects(googleProfile('code','id','secret','https://example.com'));
  } finally { globalThis.fetch = original; }
});

test('Resend request includes fragment link and fails closed on provider errors', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => { assert.equal(url, 'https://api.resend.com/emails'); assert.equal(options.headers.Authorization, 'Bearer api-key'); const body = JSON.parse(options.body); assert.deepEqual(body.to, ['user@example.com']); assert.match(body.text, /#reset_token=/); return new Response('{}', {status:200}); };
    await sendResetEmail('api-key','test@example.com','user@example.com',resetLink('https://example.com','a'.repeat(64)));
    globalThis.fetch = async () => new Response('{}', {status:503});
    await assert.rejects(sendResetEmail('api-key','test@example.com','user@example.com','https://example.com/reset#reset_token=x'));
  } finally { globalThis.fetch = original; }
});
