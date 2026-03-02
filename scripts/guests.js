#!/usr/bin/env node

const fetch = require('node-fetch');

const AUTH_TOKEN =
  'eyJhbGciOiJSUzI1NiIsImtpZCI6IjRiMTFjYjdhYjVmY2JlNDFlOTQ4MDk0ZTlkZjRjNWI1ZWNhMDAwOWUiLCJ0eXAiOiJKV1QifQ.eyJwaWN0dXJlIjoiaHR0cHM6Ly9maXJlYmFzZXN0b3JhZ2UuZ29vZ2xlYXBpcy5jb20vdjAvYi9nZXRwYXJ0aWZ1bC5hcHBzcG90LmNvbS9vL3Byb2ZpbGVJbWFnZXMlMkYwYTk0Y2E5Mi1kN2Q0LTQwMmUtYWI_YWx0PW1lZGlhJnRva2VuPTdkZTgwNzUxLWZlMTAtNDgwMC1hNDllLWI3M2JjOTI4MGM5NCIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9nZXRwYXJ0aWZ1bCIsImF1ZCI6ImdldHBhcnRpZnVsIiwiYXV0aF90aW1lIjoxNzcxMDI3NTczLCJ1c2VyX2lkIjoiSW4xV1JFQUZEZ2Z3YTN5NzgzNlhnYUdJRU52MSIsInN1YiI6IkluMVdSRUFGRGdmd2EzeTc4MzZYZ2FHSUVOdjEiLCJpYXQiOjE3NzEwMjc1NzMsImV4cCI6MTc3MTAzMTE3MywicGhvbmVfbnVtYmVyIjoiKzE4NTgyNjE4NzA2IiwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJwaG9uZSI6WyIrMTg1ODI2MTg3MDYiXX0sInNpZ25faW5fcHJvdmlkZXIiOiJjdXN0b20ifX0.kPs1UXQ5GidiFIFljdxkc9w3xT7vXpVESHl4WSDdvXJXbJJjFYPlGQUDgRMRh8pVeh5hD979VIaXPB4UPmNYhMJZQECHuOhGco7rNZeB-zEJF332h0J5DtfBvERZn8v_nxIw0-HCRWWJpOoe0Ko1snAaOUbjrte8jUPJqRSlXffXt7i7k4sXOs6fEDxsYtuAMZnSME4VzJh6mNwEKkI5px8leW7tm5eem7AQQJtPDxVQnW7hmf9VabJimAazZhnbeOoiptxFbhOesIm2-Pon8IjSP0l0dasbhGptGQciZyWSXwMPQYtaiR0aJgQOFHnT-NaGsx6VFo_OVNbHvroGBQ';

function extractEventId(input) {
  const match = input.match(/partiful\.com\/e\/([A-Za-z0-9]+)/);
  if (match) return match[1];
  return input;
}

async function getGuests(eventId) {
  const res = await fetch('https://api.partiful.com/getGuests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${AUTH_TOKEN}`,
      origin: 'https://partiful.com',
      referer: 'https://partiful.com/',
    },
    body: JSON.stringify({ data: { params: { eventId } } }),
  });
  const json = await res.json();
  if (!json.result || !json.result.data) {
    throw new Error('Failed to fetch guests: ' + JSON.stringify(json));
  }
  return json.result.data;
}

async function getUsers(ids) {
  const res = await fetch('https://api.partiful.com/getUsers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${AUTH_TOKEN}`,
      origin: 'https://partiful.com',
      referer: 'https://partiful.com/',
    },
    body: JSON.stringify({
      data: { params: { ids, includePartyStats: false }, userId: null },
    }),
  });
  const json = await res.json();
  if (!json.result || !json.result.data) {
    throw new Error('Failed to fetch users: ' + JSON.stringify(json));
  }
  return json.result.data;
}

function escapeCsv(val) {
  if (val == null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function getRsvpMessage(guest) {
  if (!guest.rsvpHistory || !guest.rsvpHistory.length) return '';
  // Get the latest non-null message from RSVP history
  for (let i = guest.rsvpHistory.length - 1; i >= 0; i--) {
    if (guest.rsvpHistory[i].message) return guest.rsvpHistory[i].message;
  }
  return '';
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: node scripts/guests.js <partiful-url-or-event-id>');
    process.exit(1);
  }

  const eventId = extractEventId(input);

  // 1. Get guest list
  const guests = await getGuests(eventId);
  process.stderr.write(`Fetched ${guests.length} guests\n`);

  const guestMap = {};
  for (const g of guests) {
    guestMap[g.userId] = g;
  }

  // 2. Get full user profiles
  const userIds = guests.map((g) => g.userId);
  const users = await getUsers(userIds);
  process.stderr.write(`Fetched ${users.length} user profiles\n`);

  // 3. Build CSV
  const headers = ['name', 'status', 'rsvp_date', 'rsvp_message', 'bio', 'instagram', 'twitter', 'snapchat', 'user_id'];
  const rows = [headers.join(',')];

  for (const user of users) {
    const guest = guestMap[user.id] || {};
    const row = [
      escapeCsv(user.name),
      escapeCsv(guest.status || ''),
      escapeCsv(guest.rsvpDate || ''),
      escapeCsv(getRsvpMessage(guest)),
      escapeCsv(user.bio?.value || ''),
      escapeCsv(user.socials?.instagram?.value || ''),
      escapeCsv(user.socials?.twitter?.value || ''),
      escapeCsv(user.socials?.snapchat?.value || ''),
      escapeCsv(user.id),
    ];
    rows.push(row.join(','));
  }

  console.log(rows.join('\n'));
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
