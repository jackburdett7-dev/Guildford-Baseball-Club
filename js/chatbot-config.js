// Chatbot configuration — do not commit this file
// Generated from .env — update values here after changing .env

window.ChatbotConfig = {
  apiBase: 'https://jackburdett7-dev--guildford-chatbot-fastapi-app.modal.run',
  apiKey: 'ak-dlpjzRJkBYJrfkaOBBjltY',
  clubName: 'Guildford Baseball & Softball Club',
  primaryColor: '#c80025',
  logoUrl: 'https://jackburdett7-dev--guildford-chatbot-fastapi-app.modal.run/static/brand/GB%20logo.png'
};

// Auto-load the chat widget
(function () {
  const s = document.createElement('script');
  const base = document.currentScript
    ? document.currentScript.src.replace('chatbot-config.js', '')
    : 'js/';
  s.src = base + 'chat-widget.js';
  s.defer = true;
  document.head.appendChild(s);
})();
