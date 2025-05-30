let roomId = "default";
const roomInput = document.getElementById('room-id-input');
const changeRoomBtn = document.getElementById('change-room');
const currentRoomLabel = document.getElementById('current-room-label');
const messagesDiv = document.getElementById('messages');
const inputForm = document.getElementById('chat-form');
const input = document.getElementById('user-input');

let messages = [];

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

// Durable Objectの履歴取得
async function fetchHistory() {
  try {
    const res = await fetch(`https://ai-chat-backend.nukota19880615.workers.dev/api/room/history?roomId=${encodeURIComponent(roomId)}`);
    if (res.ok) {
      const history = await res.json();
      // 取得した履歴をmessagesに反映
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

function renderMessages() {
  messagesDiv.innerHTML = '';
  messages.forEach(msg => {
    const isAI = msg.user === 'ニコル';
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ' + (isAI ? 'ai' : 'user');

    // 仮アイコン画像
    const iconUrl = isAI
      ? './icon/nicole.jpg'
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

let initialInnerHeight = window.innerHeight;

// 初回ロード時の高さを記録
window.addEventListener('load', () => {
  initialInnerHeight = window.innerHeight;
});
//画面リサイズ時にも高さを調整
window.addEventListener('resize', () => {
  if (document.activeElement !== input) {
    initialInnerHeight = window.innerHeight;
  }
});

// スクロール位置の調整
function scrollInputIntoView() {
  setTimeout(() => {
    const currentHeight = window.innerHeight;
    const keyboardHeight = window.visualViewport
    ? initialInnerHeight - window.visualViewport.height
    : initialInnerHeight - window.innerHeight;
  
    // スクロール位置を調整（messagesの最下部へ）
    if (keyboardHeight > 0) {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, 100); // 遅延を入れてkeyboard表示が完了するのを待つ
}

// メッセージ送信処理
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

// イベント登録
input.addEventListener('focus', scrollInputIntoView);

//部屋名更新
updateRoomLabel();
// ページロード時に履歴取得
fetchHistory();
// メッセージをレンダリング
renderMessages();

