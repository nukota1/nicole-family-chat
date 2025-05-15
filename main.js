let roomId = "default";
const roomInput = document.getElementById('room-id-input');
const changeRoomBtn = document.getElementById('change-room');
const currentRoomLabel = document.getElementById('current-room-label');

function getJSTDate(dateInput = Date.now()) {
  try {
    const date = new Date(dateInput);

    if (isNaN(date.getTime())) {
      throw new Error("Invalid date input");
    }

    // UTC -> JST (+9時間)
    const jstTime = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    return jstTime;
  } catch (error) {
    console.warn('日付変換に失敗しました。現在日時を使用します:', error.message);
    return new Date(Date.now() + 9 * 60 * 60 * 1000);
  }
}


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
    const res = await fetch(`https://ai-chat-backend.nukota19880615.workers.dev/api/room/history?roomId=${encodeURIComponent(roomId)}`);
    if (res.ok) {
      const history = await res.json();
      // 取得した履歴をmessagesに反映
      /*
      messages = history.map(msg => ({
        user: msg.user || 'User',
        text: msg.text,
        timestamp: msg.timestamp
      }));
      */
      messages = history.map(msg => ({
        user: msg.user,
        text: msg.text,
        timestamp: getJSTDate(msg.timestamp)
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
const inputForm = document.getElementById('chat-form');
const input = document.getElementById('user-input');

let messages = [];

function renderMessages() {
  messagesDiv.innerHTML = '';
  messages.forEach(msg => {
    const isAI = msg.user === 'ニコル';
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ' + (isAI ? 'ai' : 'user');

    // 仮アイコン画像
    const iconUrl = isAI
      ? 'https://via.placeholder.com/40/43a047/ffffff?text=AI'
      : 'https://via.placeholder.com/40/9eea6a/222222?text=U';
    const icon = document.createElement('img');
    icon.className = 'icon';
    icon.src = iconUrl;
    icon.alt = isAI ? 'AI' : 'User';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = msg.text;

    if (isAI) {
      messageDiv.appendChild(icon);
      messageDiv.appendChild(bubble);
    } else {
      messageDiv.appendChild(bubble);
      messageDiv.appendChild(icon);
    }
    messagesDiv.appendChild(messageDiv);
  });
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

inputForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  messages.push({ user: 'アリス', text });
  renderMessages();
  input.value = '';
  input.disabled = true;



  try {


    const res = await fetch(`https://ai-chat-backend.nukota19880615.workers.dev/api/message?roomId=${encodeURIComponent(roomId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomid: roomId, user: 'アリス', text: text, timestamp: Date.now() + 9 * 60 * 60 * 1000 })
    });


    const data = await res.json();


    if (data && data.reply) {
      messages.push({ user: data.reply.name, text: data.reply.message + '（' + data.reply.countenance + '）' });
      renderMessages();
    }
  } catch (err) {
    messages.push({ user: 'System', text: '（エラー: サーバーに接続できませんでした）' + err });
    renderMessages();
  } finally {
    input.disabled = false;
    input.focus();
  }
});

renderMessages();
