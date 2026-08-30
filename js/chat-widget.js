// Customer Live Chat Widget for KHUN AU Mystery
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  increment 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDjp5b54yTDBjchJeJqEwcOXdpzl04Ov3g",
  authDomain: "khunaumystery-f0b63.firebaseapp.com",
  projectId: "khunaumystery-f0b63",
  storageBucket: "khunaumystery-f0b63.firebasestorage.app",
  messagingSenderId: "508588235711",
  appId: "1:508588235711:web:0455a68bbb795c46d95f0a",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentAuthUser = null;
let currentChatId = null;
let unsubsMessages = null;
let isChatOpen = false;

// Generate or restore Guest ID if not logged in
function getGuestUserId() {
  let guestId = localStorage.getItem('mkChatGuestId');
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('mkChatGuestId', guestId);
  }
  return guestId;
}

function getActiveUserId() {
  return currentAuthUser ? currentAuthUser.uid : getGuestUserId();
}

function getActiveUserName() {
  if (currentAuthUser) {
    return currentAuthUser.displayName || currentAuthUser.email.split('@')[0];
  }
  let guestName = localStorage.getItem('mkChatGuestName');
  return guestName || 'ลูกค้าทั่วไป';
}

function getActiveUserEmail() {
  if (currentAuthUser) {
    return currentAuthUser.email;
  }
  return localStorage.getItem('mkChatGuestEmail') || '';
}

// Inject CSS Styles
function injectChatStyles() {
  if (document.getElementById('khunauChatStyles')) return;
  const style = document.createElement('style');
  style.id = 'khunauChatStyles';
  style.textContent = `
    /* Floating Chat Bubble */
    .chat-float-bubble {
      position: fixed;
      bottom: calc(var(--bottom-nav-height, 68px) + 16px);
      right: 18px;
      width: 54px;
      height: 54px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FFD700 0%, #D3222A 100%);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      box-shadow: 0 8px 24px rgba(211, 34, 42, 0.55), 0 0 0 2px rgba(245, 200, 66, 0.4);
      cursor: pointer;
      z-index: 1500;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      user-select: none;
      animation: floatBubbleAnim 3.5s ease-in-out infinite;
    }
    .chat-float-bubble:hover {
      transform: scale(1.08) translateY(-3px);
      box-shadow: 0 12px 28px rgba(211, 34, 42, 0.7);
    }
    .chat-float-bubble:active {
      transform: scale(0.92);
    }
    @keyframes floatBubbleAnim {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    .chat-float-bubble .unread-badge {
      position: absolute;
      top: -3px;
      right: -3px;
      background: #FF0055;
      color: #fff;
      font-size: 11px;
      font-weight: 800;
      min-width: 20px;
      height: 20px;
      border-radius: 10px;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 0 5px;
      border: 2px solid #160508;
      box-shadow: 0 2px 6px rgba(0,0,0,0.5);
    }

    /* Chat Window Drawer / Modal */
    .chat-drawer {
      position: fixed;
      bottom: calc(var(--bottom-nav-height, 68px) + 8px);
      right: 16px;
      width: calc(100vw - 32px);
      max-width: 380px;
      height: 520px;
      max-height: calc(100vh - 120px);
      background: #1B070A;
      border: 1.5px solid rgba(245, 200, 66, 0.35);
      border-radius: 22px;
      box-shadow: 0 16px 45px rgba(0, 0, 0, 0.75);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 1600;
      animation: chatDrawerOpen 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      font-family: 'Prompt', sans-serif;
    }
    @keyframes chatDrawerOpen {
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .chat-drawer.active {
      display: flex;
    }

    /* Chat Header */
    .chat-header {
      padding: 14px 16px;
      background: linear-gradient(135deg, #2D0C10, #170407);
      border-bottom: 1px solid rgba(245, 200, 66, 0.25);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .chat-header-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .chat-avatar {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      background: linear-gradient(135deg, #D3222A, #8F0E14);
      border: 1px solid var(--gold);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--gold);
      font-size: 20px;
      box-shadow: 0 2px 8px rgba(211,34,42,0.4);
    }
    .chat-header-title {
      font-size: 14.5px;
      font-weight: 700;
      color: #FFFFFF;
      line-height: 1.2;
    }
    .chat-header-status {
      font-size: 11px;
      color: #10B981;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 2px;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10B981;
      box-shadow: 0 0 6px #10B981;
    }
    .chat-btn-close {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: none;
      color: rgba(255, 255, 255, 0.7);
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .chat-btn-close:hover {
      background: rgba(211, 34, 42, 0.3);
      color: #fff;
    }

    /* Message List */
    .chat-messages-container {
      flex: 1;
      padding: 14px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: radial-gradient(circle at top, #260A0E 0%, #140406 100%);
      scrollbar-width: thin;
      scrollbar-color: rgba(245, 200, 66, 0.2) transparent;
    }
    .chat-messages-container::-webkit-scrollbar {
      width: 4px;
    }
    .chat-messages-container::-webkit-scrollbar-thumb {
      background: rgba(245, 200, 66, 0.2);
      border-radius: 4px;
    }

    .chat-bubble-row {
      display: flex;
      flex-direction: column;
      max-width: 82%;
    }
    .chat-bubble-row.customer {
      align-self: flex-end;
      align-items: flex-end;
    }
    .chat-bubble-row.admin {
      align-self: flex-start;
      align-items: flex-start;
    }

    .chat-sender-name {
      font-size: 10.5px;
      color: var(--text-muted, #D1A8AC);
      margin-bottom: 3px;
      padding: 0 4px;
    }

    .chat-msg-bubble {
      padding: 9px 13px;
      border-radius: 16px;
      font-size: 13px;
      line-height: 1.4;
      word-break: break-word;
      position: relative;
    }
    .chat-bubble-row.customer .chat-msg-bubble {
      background: linear-gradient(135deg, #D3222A, #A51A20);
      color: #FFFFFF;
      border-bottom-right-radius: 4px;
      box-shadow: 0 3px 10px rgba(211, 34, 42, 0.3);
    }
    .chat-bubble-row.admin .chat-msg-bubble {
      background: rgba(255, 255, 255, 0.08);
      color: #FFFFFF;
      border: 1px solid rgba(245, 200, 66, 0.25);
      border-bottom-left-radius: 4px;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
    }

    .chat-time-tag {
      font-size: 9.5px;
      color: rgba(255, 255, 255, 0.45);
      margin-top: 3px;
      padding: 0 4px;
    }

    /* Quick Chips */
    .chat-chips-row {
      padding: 6px 12px;
      display: flex;
      gap: 6px;
      overflow-x: auto;
      background: #170407;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      scrollbar-width: none;
    }
    .chat-chips-row::-webkit-scrollbar {
      display: none;
    }
    .chat-chip {
      background: rgba(245, 200, 66, 0.1);
      border: 1px solid rgba(245, 200, 66, 0.25);
      color: #F5C842;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.2s;
    }
    .chat-chip:hover {
      background: rgba(245, 200, 66, 0.2);
    }

    /* Chat Input Area */
    .chat-input-bar {
      padding: 10px 12px;
      background: #170407;
      border-top: 1px solid rgba(245, 200, 66, 0.2);
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .chat-input-field {
      flex: 1;
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 20px;
      padding: 9px 14px;
      color: #FFFFFF;
      font-family: inherit;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s;
    }
    .chat-input-field:focus {
      border-color: #F5C842;
      background: rgba(255, 255, 255, 0.1);
    }
    .chat-btn-send {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FFD700, #E5A812);
      color: #3B2100;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 17px;
      cursor: pointer;
      box-shadow: 0 3px 10px rgba(245, 200, 66, 0.35);
      transition: transform 0.2s;
    }
    .chat-btn-send:active {
      transform: scale(0.9);
    }
  `;
  document.head.appendChild(style);
}

// Inject HTML UI
function injectChatUI() {
  if (document.getElementById('customerChatWidget')) return;
  const container = document.createElement('div');
  container.id = 'customerChatWidget';
  container.innerHTML = `
    <!-- Floating Button -->
    <div class="chat-float-bubble" id="chatFloatBubble" title="แชทติดต่อแอดมิน">
      <i class="ph ph-chat-teardrop-dots"></i>
      <span class="unread-badge" id="chatBubbleUnreadBadge">0</span>
    </div>

    <!-- Chat Window -->
    <div class="chat-drawer" id="customerChatDrawer">
      <!-- Header -->
      <div class="chat-header">
        <div class="chat-header-info">
          <div class="chat-avatar">
            <i class="ph ph-headset"></i>
          </div>
          <div>
            <div class="chat-header-title">ติดต่อแอดมิน KHUN AU</div>
            <div class="chat-header-status">
              <span class="status-dot"></span> ออนไลน์พร้อมตอบ
            </div>
          </div>
        </div>
        <button class="chat-btn-close" id="chatBtnClose" aria-label="ปิดแชท">
          <i class="ph ph-x"></i>
        </button>
      </div>

      <!-- Messages Body -->
      <div class="chat-messages-container" id="chatMessagesContainer">
        <div class="chat-bubble-row admin">
          <span class="chat-sender-name"> แอดมิน</span>
          <div class="chat-msg-bubble">
            สวัสดีครับยินดีต้อนรับสู่ KHUN AU Mystery! 🎁✨<br>มีข้อสงสัยเกี่ยวกับสินค้า โค้ดส่วนลด หรือสถานะพัสดุ สอบถามได้เลยครับ
          </div>
          <span class="chat-time-tag">ตอนนี้</span>
        </div>
      </div>

      <!-- Quick Chips -->
      <div class="chat-chips-row">
        <span class="chat-chip" onclick="window.sendQuickChat('📦 สอบถามสถานะพัสดุ')">📦 ตามพัสดุ</span>
        <span class="chat-chip" onclick="window.sendQuickChat('🛍️ มีสินค้าพร้อมส่งไหมครับ')">🛍️ เช็คสินค้า</span>
        <span class="chat-chip" onclick="window.sendQuickChat('🚚 โค้ดส่งฟรียังใช้ได้ไหม')">🚚 โค้ดส่งฟรี</span>
      </div>

      <!-- Input Bar -->
      <form class="chat-input-bar" id="chatInputForm" onsubmit="event.preventDefault(); window.sendCustomerChatMessage();">
        <input type="text" id="chatInputField" class="chat-input-field" placeholder="พิมพ์ข้อความที่นี่..." autocomplete="off">
        <button type="submit" class="chat-btn-send" id="chatBtnSend">
          <i class="ph ph-paper-plane-right"></i>
        </button>
      </form>
    </div>
  `;
  document.body.appendChild(container);

  // Setup Event Listeners
  document.getElementById('chatFloatBubble').addEventListener('click', toggleChat);
  document.getElementById('chatBtnClose').addEventListener('click', toggleChat);
}

// Toggle Chat Window
function toggleChat() {
  const drawer = document.getElementById('customerChatDrawer');
  isChatOpen = !isChatOpen;
  if (isChatOpen) {
    drawer.classList.add('active');
    initChatConversation();
    clearCustomerUnreadBadge();
  } else {
    drawer.classList.remove('active');
  }
}

// Initialize Chat Conversation in Firestore
async function initChatConversation() {
  const userId = getActiveUserId();
  currentChatId = `chat_${userId}`;

  // Ensure parent conversation document exists
  const chatRef = doc(db, 'chats', currentChatId);
  try {
    await setDoc(chatRef, {
      userId: userId,
      userName: getActiveUserName(),
      userEmail: getActiveUserEmail(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn("Init chat error:", err);
  }

  listenToMessages();
}

// Listen to messages in Firestore
function listenToMessages() {
  if (unsubsMessages) unsubsMessages();
  if (!currentChatId) return;

  const msgsQuery = query(
    collection(db, 'chats', currentChatId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  unsubsMessages = onSnapshot(msgsQuery, (snapshot) => {
    const container = document.getElementById('chatMessagesContainer');
    if (!container) return;

    let unreadCount = 0;
    let html = `
      <div class="chat-bubble-row admin">
        <span class="chat-sender-name">แอดมิน</span>
        <div class="chat-msg-bubble">
          สวัสดีครับยินดีต้อนรับสู่ KHUN AU Mystery! 🎁✨<br>มีข้อสงสัยเกี่ยวกับสินค้า โค้ดส่วนลด หรือสถานะพัสดุ สอบถามได้เลยครับ
        </div>
        <span class="chat-time-tag">ตอนนี้</span>
      </div>
    `;

    snapshot.docs.forEach(docSnap => {
      const msg = docSnap.data();
      const isCustomer = (msg.senderRole === 'user');
      const timeStr = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '';
      
      if (!isCustomer && !msg.read) {
        unreadCount++;
      }

      html += `
        <div class="chat-bubble-row ${isCustomer ? 'customer' : 'admin'}">
          <span class="chat-sender-name">${isCustomer ? 'ฉัน' : 'แอดมิน'}</span>
          <div class="chat-msg-bubble">${escapeHtml(msg.text)}</div>
          <span class="chat-time-tag">${timeStr}</span>
        </div>
      `;
    });

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;

    // Update unread badge on floating button
    const badge = document.getElementById('chatBubbleUnreadBadge');
    if (badge) {
      if (unreadCount > 0 && !isChatOpen) {
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }, (err) => {
    console.warn("Message sync error:", err);
  });
}

// Send Chat Message
window.sendCustomerChatMessage = async function() {
  const input = document.getElementById('chatInputField');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';

  const userId = getActiveUserId();
  if (!currentChatId) currentChatId = `chat_${userId}`;

  const messageData = {
    chatId: currentChatId,
    senderId: userId,
    senderRole: 'user',
    senderName: getActiveUserName(),
    text: text,
    createdAt: new Date().toISOString(),
    read: false
  };

  try {
    // 1. Add to messages subcollection
    await addDoc(collection(db, 'chats', currentChatId, 'messages'), messageData);

    // 2. Update parent conversation metadata
    const chatRef = doc(db, 'chats', currentChatId);
    await setDoc(chatRef, {
      userId: userId,
      userName: getActiveUserName(),
      userEmail: getActiveUserEmail(),
      lastMessage: text,
      lastMessageAt: new Date().toISOString(),
      unreadByAdmin: increment(1),
      updatedAt: new Date().toISOString()
    }, { merge: true });

  } catch (e) {
    console.error("Error sending message:", e);
  }
};

window.sendQuickChat = function(text) {
  const input = document.getElementById('chatInputField');
  if (input) {
    input.value = text;
    window.sendCustomerChatMessage();
  }
};

async function clearCustomerUnreadBadge() {
  const badge = document.getElementById('chatBubbleUnreadBadge');
  if (badge) badge.style.display = 'none';

  if (!currentChatId) return;
  try {
    await updateDoc(doc(db, 'chats', currentChatId), {
      unreadByUser: 0
    });
  } catch (e) {}
}

function escapeHtml(text) {
  return (text || '')
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");
}

// Initialize on DOM Ready
function initChatWidget() {
  injectChatStyles();
  injectChatUI();

  onAuthStateChanged(auth, user => {
    currentAuthUser = user;
    if (currentChatId) {
      initChatConversation();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatWidget);
} else {
  initChatWidget();
}

export default { toggleChat };
