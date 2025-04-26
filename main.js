// Durable Objectの履歴取得
async function fetchHistory() {
  try {
    const res = await fetch('https://ai-chat-backend.nukota19880615.workers.dev/api/room/history');
    if (res.ok) {
      const history = await res.json();
      // 取得した履歴をmessagesに反映
      messages = history.map(msg => ({
        user: msg.user || 'User',
        text: msg.text,
        timestamp: msg.timestamp
      }));
      renderMessages();
    }
  } catch (e) {
    // 履歴取得失敗時は何もしない
  }
}

// ページロード時に履歴取得
fetchHistory();

const messagesDiv = document.getElementById('messages');
const inputForm = document.getElementById('input-area');
const input = document.getElementById('input');

let messages = [];

function renderMessages() {
  messagesDiv.innerHTML = '';
  messages.forEach(msg => {
    const div = document.createElement('div');
    div.className = 'message ' + (msg.user === 'AI' ? 'ai' : 'user');
    div.textContent = `${msg.user}: ${msg.text}`;
    messagesDiv.appendChild(div);
  });
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

inputForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  messages.push({ user: 'You', text });
  renderMessages();
  input.value = '';
  input.disabled = true;

  // バックエンドに送信
  try {
    const res = await fetch('https://ai-chat-backend.nukota19880615.workers.dev/api/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await r
  // Durable Objectにも履歴を保存
  try {
    await fetch('https://ai-chat-backend.nukota19880615.workers.dev/api/room/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: 'You', text, timestamp: Date.now() })
    });
  } catch (e) {/* 無視 */}    if (data && data.reply) {
      messages.push({ user: 'AI', text: data.reply });
      renderMessages();
    }
  } catch (err) {
    messages.push({ user: 'AI', text: '（エラー: サーバーに接続できませんでした）' + err.message });
    renderMessages();
  } finally {
    input.disabled = false;
    input.focus();
  }
});

renderMessages();
