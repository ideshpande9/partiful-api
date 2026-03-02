// Read Firebase auth token from IndexedDB
function getFirebaseToken() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('firebaseLocalStorageDb');
    req.onerror = () => reject(new Error('Cannot open firebaseLocalStorageDb'));
    req.onsuccess = (event) => {
      const db = event.target.result;
      try {
        const tx = db.transaction('firebaseLocalStorage', 'readonly');
        const store = tx.objectStore('firebaseLocalStorage');
        const getAll = store.getAll();
        getAll.onsuccess = () => {
          const entries = getAll.result || [];
          for (const entry of entries) {
            const token =
              entry?.value?.stsTokenManager?.accessToken ||
              entry?.stsTokenManager?.accessToken;
            if (token) {
              resolve(token);
              return;
            }
          }
          reject(new Error('No Firebase token found in IndexedDB'));
        };
        getAll.onerror = () => reject(new Error('Failed to read firebaseLocalStorage'));
      } catch (e) {
        reject(e);
      }
    };
  });
}

// Respond to requests from background script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'getFirebaseToken') {
    getFirebaseToken()
      .then((token) => sendResponse({ token }))
      .catch((err) => sendResponse({ error: err.message }));
    return true; // async response
  }
});

// Also proactively send the token on page load
getFirebaseToken()
  .then((token) => {
    chrome.runtime.sendMessage({ type: 'firebaseToken', token });
  })
  .catch(() => {
    // silently fail — token may not be available yet
  });