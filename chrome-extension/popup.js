const statusEl = document.getElementById('status');
const exportBtn = document.getElementById('exportBtn');

function setStatus(text, className) {
  statusEl.textContent = text;
  statusEl.className = className || '';
}

// Listen for background status updates
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'status') {
    if (msg.state === 'error') {
      setStatus(msg.message, 'error');
      exportBtn.disabled = false;
    } else if (msg.state === 'done') {
      setStatus(msg.message, 'done');
      exportBtn.disabled = false;
    } else {
      setStatus(msg.message);
    }
  }
});

exportBtn.addEventListener('click', async () => {
  // Get current tab URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url || '';

  const match = url.match(/partiful\.com\/e\/([A-Za-z0-9]+)/);
  if (!match) {
    setStatus('Not on a Partiful event page.', 'error');
    return;
  }

  const eventId = match[1];
  exportBtn.disabled = true;
  setStatus('Starting export...');

  chrome.runtime.sendMessage(
    { type: 'export', eventId, eventSlug: eventId, tabId: tab.id },
    (response) => {
      if (response?.error) {
        setStatus(response.error, 'error');
        exportBtn.disabled = false;
      } else if (response?.started) {
        setStatus('Exporting in background — you can close this popup.');
      }
    }
  );
});