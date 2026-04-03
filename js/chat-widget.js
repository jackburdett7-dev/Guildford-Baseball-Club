/* =============================================================
   Guildford Baseball Club — Custom Chat Widget
   Calls POST /chat on the Modal FastAPI backend.
   Replaces the old third-party widget entirely.
   ============================================================= */
(function () {
  if (!window.ChatbotConfig) return;

  const cfg = window.ChatbotConfig;
  const API = cfg.apiBase + '/chat';

  // Unique session ID per page load
  const SESSION_ID = 'gbsc_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now();

  /* ----------------------------------------------------------
     1. INJECT STYLES
  ---------------------------------------------------------- */
  const style = document.createElement('style');
  style.textContent = `
    /* Floating button */
    #gbsc-chat-btn {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9998;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #c80025;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(200,0,37,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    #gbsc-chat-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 28px rgba(200,0,37,0.55);
    }
    #gbsc-chat-btn svg { width: 26px; height: 26px; fill: #fff; }
    #gbsc-chat-btn .gbsc-unread {
      position: absolute;
      top: -3px; right: -3px;
      width: 14px; height: 14px;
      background: #d4a843;
      border-radius: 50%;
      border: 2px solid #fff;
      display: none;
    }

    /* Panel */
    #gbsc-chat-panel {
      position: fixed;
      bottom: 5rem;
      right: 1.5rem;
      z-index: 9999;
      width: 360px;
      max-height: 540px;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 12px 48px rgba(0,0,0,0.18);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: translateY(12px) scale(0.97);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.25s ease, opacity 0.25s ease;
    }
    #gbsc-chat-panel.gbsc-open {
      transform: translateY(0) scale(1);
      opacity: 1;
      pointer-events: all;
    }
    @media (max-width: 420px) {
      #gbsc-chat-panel {
        width: calc(100vw - 2rem);
        right: 1rem;
        left: 1rem;
        bottom: 4.5rem;
      }
    }

    /* Header */
    .gbsc-header {
      background: #0f1c2e;
      padding: 1rem 1.2rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
    }
    .gbsc-header__avatar {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #c80025, #d4a843);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; flex-shrink: 0;
    }
    .gbsc-header__info { flex: 1; }
    .gbsc-header__name {
      font-family: sans-serif;
      font-size: 0.88rem;
      font-weight: 700;
      color: #fff;
      line-height: 1.2;
    }
    .gbsc-header__status {
      font-family: sans-serif;
      font-size: 0.72rem;
      color: rgba(255,255,255,0.55);
      display: flex; align-items: center; gap: 0.3rem;
    }
    .gbsc-header__status::before {
      content: '';
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #4ade80;
      flex-shrink: 0;
    }
    .gbsc-close {
      background: none; border: none; cursor: pointer;
      color: rgba(255,255,255,0.5); font-size: 1.3rem;
      line-height: 1; padding: 0; transition: color 0.15s;
    }
    .gbsc-close:hover { color: #fff; }

    /* Messages */
    .gbsc-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      scroll-behavior: smooth;
    }
    .gbsc-messages::-webkit-scrollbar { width: 4px; }
    .gbsc-messages::-webkit-scrollbar-thumb { background: #e2e2e2; border-radius: 4px; }

    .gbsc-msg {
      max-width: 82%;
      font-family: sans-serif;
      font-size: 0.875rem;
      line-height: 1.55;
      padding: 0.65rem 0.9rem;
      border-radius: 12px;
      word-wrap: break-word;
    }
    .gbsc-msg--bot {
      background: #f3f4f6;
      color: #1a1a2e;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .gbsc-msg--user {
      background: #c80025;
      color: #fff;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .gbsc-msg--booking {
      background: rgba(212,168,67,0.12);
      border: 1px solid rgba(212,168,67,0.4);
      color: #1a1a2e;
      align-self: flex-start;
      max-width: 90%;
      font-size: 0.83rem;
    }
    .gbsc-msg--booking strong { color: #0f1c2e; }

    /* Typing indicator */
    .gbsc-typing {
      display: flex; gap: 4px; align-items: center;
      padding: 0.65rem 0.9rem;
      background: #f3f4f6;
      border-radius: 12px;
      border-bottom-left-radius: 4px;
      align-self: flex-start;
    }
    .gbsc-typing span {
      width: 7px; height: 7px; border-radius: 50%;
      background: #9ca3af;
      animation: gbsc-bounce 1.2s infinite;
    }
    .gbsc-typing span:nth-child(2) { animation-delay: 0.2s; }
    .gbsc-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes gbsc-bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-5px); }
    }

    /* Input */
    .gbsc-input-row {
      padding: 0.75rem;
      border-top: 1px solid #f0f0f0;
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
      background: #fff;
    }
    .gbsc-input {
      flex: 1;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 0.55rem 0.75rem;
      font-family: sans-serif;
      font-size: 0.88rem;
      color: #1a1a2e;
      outline: none;
      resize: none;
      max-height: 80px;
      transition: border-color 0.15s;
    }
    .gbsc-input:focus { border-color: #c80025; }
    .gbsc-input::placeholder { color: #9ca3af; }
    .gbsc-send {
      width: 38px; height: 38px;
      border-radius: 8px;
      background: #c80025;
      border: none;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s, transform 0.1s;
      align-self: flex-end;
    }
    .gbsc-send:hover { background: #a8001e; }
    .gbsc-send:active { transform: scale(0.94); }
    .gbsc-send:disabled { background: #d1d5db; cursor: not-allowed; }
    .gbsc-send svg { width: 18px; height: 18px; fill: #fff; }

    /* Powered by */
    .gbsc-footer {
      text-align: center;
      padding: 0.4rem;
      font-family: sans-serif;
      font-size: 0.68rem;
      color: #9ca3af;
      border-top: 1px solid #f0f0f0;
      flex-shrink: 0;
    }
  `;
  document.head.appendChild(style);

  /* ----------------------------------------------------------
     2. BUILD HTML
  ---------------------------------------------------------- */
  const btn = document.createElement('button');
  btn.id = 'gbsc-chat-btn';
  btn.setAttribute('aria-label', 'Open club chat assistant');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.1 21.5l4.5-1.312A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.955 7.955 0 01-4.065-1.113l-.29-.174-3.007.875.9-2.93-.19-.302A7.96 7.96 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z"/>
    </svg>
    <div class="gbsc-unread" id="gbsc-unread"></div>
  `;

  const panel = document.createElement('div');
  panel.id = 'gbsc-chat-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Club assistant chat');
  panel.innerHTML = `
    <div class="gbsc-header">
      <div class="gbsc-header__avatar">⚾</div>
      <div class="gbsc-header__info">
        <div class="gbsc-header__name">Guildford Baseball Assistant</div>
        <div class="gbsc-header__status">Online — typically replies instantly</div>
      </div>
      <button class="gbsc-close" id="gbsc-close" aria-label="Close chat">&times;</button>
    </div>
    <div class="gbsc-messages" id="gbsc-messages"></div>
    <div class="gbsc-input-row">
      <textarea class="gbsc-input" id="gbsc-input" placeholder="Ask anything about the club…" rows="1"></textarea>
      <button class="gbsc-send" id="gbsc-send" aria-label="Send message">
        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
      </button>
    </div>
    <div class="gbsc-footer">Guildford Mavericks · Powered by AI</div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  /* ----------------------------------------------------------
     3. REFERENCES
  ---------------------------------------------------------- */
  const messagesEl = document.getElementById('gbsc-messages');
  const inputEl    = document.getElementById('gbsc-input');
  const sendBtn    = document.getElementById('gbsc-send');
  const closeBtn   = document.getElementById('gbsc-close');
  const unreadDot  = document.getElementById('gbsc-unread');
  let isOpen = false;
  let isWaiting = false;

  /* ----------------------------------------------------------
     4. HELPERS
  ---------------------------------------------------------- */
  function addMessage(text, type) {
    // Remove typing indicator if present
    const typing = messagesEl.querySelector('.gbsc-typing');
    if (typing) typing.remove();

    const msg = document.createElement('div');
    msg.className = 'gbsc-msg gbsc-msg--' + type;
    msg.innerHTML = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return msg;
  }

  function showTyping() {
    const t = document.createElement('div');
    t.className = 'gbsc-typing';
    t.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(t);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function openPanel() {
    isOpen = true;
    panel.classList.add('gbsc-open');
    unreadDot.style.display = 'none';
    inputEl.focus();
    btn.setAttribute('aria-expanded', 'true');
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('gbsc-open');
    btn.setAttribute('aria-expanded', 'false');
  }

  /* ----------------------------------------------------------
     5. API CALL
  ---------------------------------------------------------- */
  async function sendMessage(text) {
    if (isWaiting || !text.trim()) return;
    isWaiting = true;
    sendBtn.disabled = true;

    addMessage(text, 'user');
    inputEl.value = '';
    inputEl.style.height = 'auto';
    showTyping();

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (cfg.apiKey) headers['Authorization'] = 'Bearer ' + cfg.apiKey;

      const res = await fetch(API, {
        method: 'POST',
        headers,
        body: JSON.stringify({ session_id: SESSION_ID, message: text })
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();

      addMessage(data.reply, 'bot');

      if (data.booking_submitted) {
        addMessage(
          `<strong>🎉 You're booked in!</strong><br>We've got your details and a confirmation email is on its way. See you on the diamond.`,
          'booking'
        );
      }
    } catch (err) {
      addMessage("Sorry, I'm having trouble connecting right now. Please email <a href='mailto:info@guildfordbaseball.co.uk' style='color:#c80025'>info@guildfordbaseball.co.uk</a> and we'll get back to you shortly.", 'bot');
    } finally {
      isWaiting = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  /* ----------------------------------------------------------
     6. EVENTS
  ---------------------------------------------------------- */
  btn.addEventListener('click', () => isOpen ? closePanel() : openPanel());
  closeBtn.addEventListener('click', closePanel);

  sendBtn.addEventListener('click', () => sendMessage(inputEl.value));

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputEl.value);
    }
  });

  // Auto-resize textarea
  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 80) + 'px';
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (isOpen && !panel.contains(e.target) && e.target !== btn) {
      closePanel();
    }
  });

  // Escape key closes
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closePanel();
  });

  /* ----------------------------------------------------------
     7. Expose global open function for main.js and inline use
  ---------------------------------------------------------- */
  window.gbscOpenChat = function () {
    openPanel();
    setTimeout(() => inputEl.focus(), 300);
  };

  /* ----------------------------------------------------------
     8. GREETING — show after short delay on first open
  ---------------------------------------------------------- */
  let greeted = false;
  btn.addEventListener('click', () => {
    if (!greeted && isOpen) {
      greeted = true;
      setTimeout(() => {
        if (messagesEl.children.length === 0) {
          addMessage("Hi! I'm the Guildford Baseball & Softball Club assistant. I can help with joining, training times, junior sessions, pricing, and anything else about the club. What would you like to know?", 'bot');
          if (!isOpen) unreadDot.style.display = 'block';
        }
      }, 400);
    }
  });

})();
