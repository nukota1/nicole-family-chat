let roomId = "default";
const roomInput = document.getElementById('room-id-input');
const changeRoomBtn = document.getElementById('change-room');
const currentRoomLabel = document.getElementById('current-room-label');

function updateRoomLabel() {
  currentRoomLabel.textContent = `現在の部屋: ${roomId}`;
}

changeRoomBtn.addEventListener('click', () => {
  const newId = roomInput.value.trim();
  if (newId && newId !== roomId) {
    roomId = newId;
    messages = [];
    renderMessages();
    fetchHistory();
    updateRoomLabel();
  }
});

updateRoomLabel();

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
    const data = await res.json();
    // Durable Objectにも履歴を保存
    try {
      await fetch(`https://ai-chat-backend.nukota19880615.workers.dev/api/room/history?roomId=${encodeURIComponent(roomId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: 'You', text, timestamp: Date.now() })
      });
    } catch (e) {
      // 履歴保存失敗時は無視
      console.log('履歴保存失敗:', e);

    }    
      if (data && data.reply) {
        messages.push({ user: 'AI', text: data.reply });
        renderMessages();
      }
    } catch (err) {
      messages.push({ user: 'AI', text: '（エラー: サーバーに接続できませんでした）' + err });
      renderMessages();
    } finally {
      input.disabled = false;
      input.focus();
    }
});

renderMessages();
