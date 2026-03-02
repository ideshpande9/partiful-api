// Auth token state
let authToken = null;

// Accept token pushed from content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'firebaseToken' && msg.token) {
    authToken = msg.token;
    chrome.storage.local.set({ authToken });
    return;
  }

  if (msg.type === 'export') {
    const { eventId, eventSlug, tabId } = msg;

    // Try to grab token from content script first, then export
    resolveToken(tabId)
      .then(() => {
        if (!authToken) {
          sendResponse({
            error:
              'Not able to find bearer token, try refreshing your screen.',
          });
          return;
        }
        sendResponse({ started: true });
        exportGuests(eventId, eventSlug)
          .then(() => broadcastStatus('done', 'CSV downloaded!'))
          .catch((err) => broadcastStatus('error', err.message));
      })
      .catch(() => {
        sendResponse({
          error:
            'Not able to find bearer token, try refreshing your screen.',
        });
      });

    return true; // async sendResponse
  }

  if (msg.type === 'checkToken') {
    sendResponse({ hasToken: !!authToken });
    return;
  }
});

// Restore token from storage on startup
chrome.storage.local.get('authToken', (data) => {
  if (data.authToken) authToken = data.authToken;
});

// --- Token resolution ---

async function resolveToken(tabId) {
  // If we already have a token, use it
  if (authToken) return;

  // Try to get it from the content script on the active tab
  if (tabId) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'getFirebaseToken',
      });
      if (response?.token) {
        authToken = response.token;
        chrome.storage.local.set({ authToken });
      }
    } catch {
      // content script not injected or tab not accessible
    }
  }

  // Last resort: check storage
  if (!authToken) {
    const data = await chrome.storage.local.get('authToken');
    if (data.authToken) authToken = data.authToken;
  }
}

// --- API helpers ---

async function getGuests(eventId) {
  const res = await fetch('https://api.partiful.com/getGuests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ data: { params: { eventId } } }),
  });
  const json = await res.json();
  if (!json.result?.data) throw new Error('Failed to fetch guests');
  return json.result.data;
}

async function getUsers(ids) {
  const res = await fetch('https://api.partiful.com/getUsers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      data: { params: { ids, includePartyStats: false }, userId: null },
    }),
  });
  const json = await res.json();
  if (!json.result?.data) throw new Error('Failed to fetch users');
  return json.result.data;
}

// --- CSV helpers ---

function escapeCsv(val) {
  if (val == null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function buildCsv(guests, users) {
  const guestMap = {};
  for (const g of guests) {
    guestMap[g.userId] = g;
  }

  const headers = ['name', 'bio', 'instagram', 'x'];
  const rows = [headers.join(',')];

  for (const user of users) {
    const ig = user.socials?.instagram?.value || '';
    const x = user.socials?.twitter?.value || '';

    const row = [
      escapeCsv(user.name),
      escapeCsv(user.bio?.value || ''),
      escapeCsv(ig ? `https://instagram.com/${ig}` : ''),
      escapeCsv(x ? `https://x.com/${x}` : ''),
    ];
    rows.push(row.join(','));
  }

  return rows.join('\n');
}

// --- Main export logic ---

async function exportGuests(eventId, eventSlug) {
  broadcastStatus('fetching', 'Fetching guests...');

  const guests = await getGuests(eventId);
  broadcastStatus('fetching', `Found ${guests.length} guests. Fetching profiles...`);

  const userIds = guests.map((g) => g.userId);
  const users = await getUsers(userIds);
  broadcastStatus('building', `Building CSV for ${users.length} guests...`);

  const csv = buildCsv(guests, users);

  // Download via chrome.downloads API (works even if popup is closed)
  const blob = new Blob([csv], { type: 'text/csv' });
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onloadend = () => {
      const dataUrl = reader.result;
      const filename = `partiful-guests-${eventSlug || eventId}.csv`;
      chrome.downloads.download(
        { url: dataUrl, filename, saveAs: false },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(downloadId);
          }
        }
      );
    };
    reader.onerror = () => reject(new Error('Failed to create download'));
    reader.readAsDataURL(blob);
  });
}

// --- Messaging ---

function broadcastStatus(state, message) {
  chrome.runtime.sendMessage({ type: 'status', state, message }).catch(() => {
    // popup may be closed, that's fine
  });
}