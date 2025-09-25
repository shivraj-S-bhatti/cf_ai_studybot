import { StudyBotAgent } from './agent';

export { StudyBotAgent };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Serve static files
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(await getStaticFile('index.html'), {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    if (url.pathname === '/styles.css') {
      return new Response(await getStaticFile('styles.css'), {
        headers: { 'Content-Type': 'text/css' }
      });
    }
    
    if (url.pathname === '/app.js') {
      return new Response(await getStaticFile('app.js'), {
        headers: { 'Content-Type': 'application/javascript' }
      });
    }
    
    // API routes - forward to Durable Object
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      const id = env.STUDYBOT_AGENT.idFromName('main');
      const obj = env.STUDYBOT_AGENT.get(id);
      return obj.fetch(request);
    }
    
    if (url.pathname === '/api/quiz/list' && request.method === 'GET') {
      const id = env.STUDYBOT_AGENT.idFromName('main');
      const obj = env.STUDYBOT_AGENT.get(id);
      return obj.fetch(request);
    }
    
    const quizMatch = url.pathname.match(/^\/api\/quiz\/([^/]+)$/);
    if (quizMatch && request.method === 'GET') {
      const id = env.STUDYBOT_AGENT.idFromName('main');
      const obj = env.STUDYBOT_AGENT.get(id);
      return obj.fetch(request);
    }
    
    const submitMatch = url.pathname.match(/^\/api\/quiz\/([^/]+)\/submit$/);
    if (submitMatch && request.method === 'POST') {
      const id = env.STUDYBOT_AGENT.idFromName('main');
      const obj = env.STUDYBOT_AGENT.get(id);
      return obj.fetch(request);
    }
    
    return new Response('Not found', { status: 404 });
  }
};

// Helper function to get static files
async function getStaticFile(filename: string): Promise<string> {
  // In a real deployment, these would be served from a CDN or static assets
  // For now, we'll return the file content directly
  const files: Record<string, string> = {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Study Buddy</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div class="app-container">
        <header class="app-header">
            <div class="header-content">
                <div class="logo">
                    <div class="logo-icon">📚</div>
                    <h1>Study Buddy</h1>
                </div>
                <div class="header-actions">
                    <div class="streak-badge" id="userStreak">
                        <span class="streak-icon">🔥</span>
                        <span class="streak-text">0 days</span>
                    </div>
                </div>
            </div>
        </header>
        <main class="chat-interface">
            <div class="chat-container">
                <div class="chat-messages" id="chatMessages">
                    <div class="welcome-message">
                        <div class="message-avatar">
                            <div class="avatar-icon">🤖</div>
                        </div>
                        <div class="message-content">
                            <div class="message-header">
                                <span class="sender-name">Study Buddy</span>
                                <span class="message-time" id="welcomeTime"></span>
                            </div>
                            <div class="message-text">
                                Hi! I'm your Study Buddy. I can help you:
                                <ul class="feature-list">
                                    <li>Summarize topics (try "summarize machine learning")</li>
                                    <li>Generate quizzes (try "quiz me on calculus")</li>
                                    <li>Track your study streak (try "show my progress")</li>
                                </ul>
                                What would you like to study today?
                            </div>
                        </div>
                    </div>
                </div>
                <div class="input-area">
                    <div class="quick-actions">
                        <button class="action-btn primary" data-action="summarize">
                            <span class="btn-icon">📚</span>
                            <span class="btn-text">Summarize</span>
                        </button>
                        <button class="action-btn primary" data-action="quiz">
                            <span class="btn-icon">🧠</span>
                            <span class="btn-text">Quiz Me</span>
                        </button>
                        <button class="action-btn secondary" data-action="progress">
                            <span class="btn-icon">📊</span>
                            <span class="btn-text">Progress</span>
                        </button>
                    </div>
                    <div class="quiz-actions">
                        <button class="quiz-btn" data-action="list-quizzes">
                            <span class="btn-icon">📝</span>
                            <span class="btn-text">List Quizzes</span>
                        </button>
                        <button class="quiz-btn" data-action="show-last-quiz">
                            <span class="btn-icon">👁️</span>
                            <span class="btn-text">Show Quiz</span>
                        </button>
                        <button class="quiz-btn" data-action="submit-answers">
                            <span class="btn-icon">✅</span>
                            <span class="btn-text">Submit</span>
                        </button>
                    </div>
                    <div class="input-container">
                        <div class="input-wrapper">
                            <input type="text" id="messageInput" placeholder="Ask me anything about your studies..." autocomplete="off">
                            <button id="sendButton" type="button" class="send-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
        <div class="status-indicator" id="connectionStatus">
            <div class="status-dot"></div>
            <span class="status-text">Connected</span>
        </div>
    </div>
    <script src="/app.js"></script>
</body>
</html>`,
    'styles.css': `/* Apple-Inspired Study Buddy UI */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    --primary-blue: #007AFF;
    --primary-blue-dark: #0056CC;
    --accent-green: #34C759;
    --accent-orange: #FF9500;
    --text-primary: #1D1D1F;
    --text-secondary: #86868B;
    --text-tertiary: #C7C7CC;
    --bg-primary: #FFFFFF;
    --bg-secondary: #F2F2F7;
    --bg-tertiary: #F9F9F9;
    --border-primary: #E5E5EA;
    --shadow-light: 0 1px 3px rgba(0, 0, 0, 0.1);
    --shadow-medium: 0 4px 12px rgba(0, 0, 0, 0.15);
    --space-sm: 8px;
    --space-md: 16px;
    --space-lg: 24px;
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-full: 50px;
    --font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

body {
    font-family: var(--font-family);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    background-attachment: fixed;
    min-height: 100vh;
    color: var(--text-primary);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

.app-container {
    max-width: 800px;
    margin: 0 auto;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-primary);
    box-shadow: var(--shadow-medium);
    position: relative;
    overflow: hidden;
}

.app-header {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border-primary);
    position: sticky;
    top: 0;
    z-index: 100;
}

.header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md) var(--space-lg);
}

.logo {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
}

.logo-icon {
    font-size: 24px;
    animation: float 3s ease-in-out infinite;
}

@keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-4px); }
}

.logo h1 {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.5px;
}

.streak-badge {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    background: linear-gradient(135deg, var(--accent-orange), #FF6B35);
    color: white;
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-full);
    font-size: 14px;
    font-weight: 500;
    box-shadow: var(--shadow-light);
    transition: all 0.25s ease;
}

.streak-badge:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-medium);
}

.chat-interface {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.chat-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: calc(100vh - 80px);
}

.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-lg);
    scroll-behavior: smooth;
    background: var(--bg-secondary);
}

.chat-messages::-webkit-scrollbar {
    width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
    background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
    background: var(--border-primary);
    border-radius: var(--radius-full);
}

.welcome-message {
    display: flex;
    gap: var(--space-md);
    margin-bottom: var(--space-lg);
    animation: slideInUp 0.6s ease-out;
}

@keyframes slideInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.message-avatar {
    flex-shrink: 0;
}

.avatar-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, var(--primary-blue), #5AC8FA);
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    box-shadow: var(--shadow-light);
}

.message-content {
    flex: 1;
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
    box-shadow: var(--shadow-light);
    border: 1px solid var(--border-primary);
}

.message-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-sm);
}

.sender-name {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 14px;
}

.message-time {
    font-size: 12px;
    color: var(--text-tertiary);
}

.message-text {
    color: var(--text-primary);
    line-height: 1.6;
}

.feature-list {
    margin: var(--space-md) 0;
    padding-left: var(--space-lg);
}

.feature-list li {
    margin: var(--space-sm) 0;
    color: var(--text-secondary);
}

.message {
    display: flex;
    gap: var(--space-md);
    margin-bottom: var(--space-lg);
    animation: messageSlide 0.4s ease-out;
}

@keyframes messageSlide {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.user-message {
    flex-direction: row-reverse;
}

.user-message .message-content {
    background: linear-gradient(135deg, var(--primary-blue), var(--primary-blue-dark));
    color: white;
    border: none;
}

.user-message .message-header {
    flex-direction: row-reverse;
}

.user-message .sender-name {
    color: rgba(255, 255, 255, 0.9);
}

.user-message .message-time {
    color: rgba(255, 255, 255, 0.7);
}

.input-area {
    background: var(--bg-primary);
    border-top: 1px solid var(--border-primary);
    padding: var(--space-lg);
}

.quick-actions {
    display: flex;
    gap: var(--space-sm);
    margin-bottom: var(--space-md);
    flex-wrap: wrap;
}

.action-btn {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    border: none;
    border-radius: var(--radius-full);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.25s ease;
    font-family: var(--font-family);
}

.action-btn.primary {
    background: var(--primary-blue);
    color: white;
    box-shadow: var(--shadow-light);
}

.action-btn.primary:hover {
    background: var(--primary-blue-dark);
    transform: translateY(-1px);
    box-shadow: var(--shadow-medium);
}

.action-btn.secondary {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border-primary);
}

.action-btn.secondary:hover {
    background: var(--bg-secondary);
    transform: translateY(-1px);
}

.quiz-actions {
    display: flex;
    gap: var(--space-sm);
    margin-bottom: var(--space-lg);
    flex-wrap: wrap;
    padding-top: var(--space-md);
    border-top: 1px solid var(--border-primary);
}

.quiz-btn {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-full);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.25s ease;
    font-family: var(--font-family);
}

.quiz-btn:hover {
    background: var(--bg-secondary);
    transform: translateY(-1px);
    box-shadow: var(--shadow-light);
}

.btn-icon {
    font-size: 16px;
}

.input-container {
    position: relative;
}

.input-wrapper {
    display: flex;
    align-items: center;
    background: var(--bg-secondary);
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-full);
    padding: var(--space-sm) var(--space-md);
    transition: all 0.25s ease;
}

.input-wrapper:focus-within {
    border-color: var(--primary-blue);
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

#messageInput {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-size: 16px;
    color: var(--text-primary);
    font-family: var(--font-family);
    padding: var(--space-sm) 0;
}

#messageInput::placeholder {
    color: var(--text-tertiary);
}

.send-btn {
    width: 36px;
    height: 36px;
    background: var(--primary-blue);
    color: white;
    border: none;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.25s ease;
    margin-left: var(--space-sm);
}

.send-btn:hover {
    background: var(--primary-blue-dark);
    transform: scale(1.05);
}

.send-btn:active {
    transform: scale(0.95);
}

.send-btn:disabled {
    background: var(--text-tertiary);
    cursor: not-allowed;
    transform: none;
}

.status-indicator {
    position: fixed;
    bottom: var(--space-lg);
    right: var(--space-lg);
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-full);
    font-size: 12px;
    color: var(--text-secondary);
    box-shadow: var(--shadow-medium);
    border: 1px solid var(--border-primary);
    z-index: 1000;
}

.status-indicator.connected {
    color: var(--accent-green);
}

.status-dot {
    width: 8px;
    height: 8px;
    background: var(--accent-green);
    border-radius: var(--radius-full);
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.typing-indicator {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    margin-bottom: var(--space-lg);
    animation: messageSlide 0.4s ease-out;
}

.typing-dots {
    display: flex;
    gap: 4px;
    margin-left: var(--space-sm);
}

.typing-dots span {
    width: 6px;
    height: 6px;
    background: var(--text-tertiary);
    border-radius: var(--radius-full);
    animation: typing 1.4s infinite;
}

.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30% { transform: translateY(-8px); opacity: 1; }
}

@media (max-width: 768px) {
    .app-container {
        margin: 0;
        border-radius: 0;
        box-shadow: none;
    }
    
    .header-content {
        padding: var(--space-md);
    }
    
    .chat-messages {
        padding: var(--space-md);
    }
    
    .input-area {
        padding: var(--space-md);
    }
    
    .quick-actions,
    .quiz-actions {
        gap: var(--space-sm);
    }
    
    .action-btn,
    .quiz-btn {
        padding: var(--space-sm);
        font-size: 12px;
    }
    
    .btn-text {
        display: none;
    }
    
    .status-indicator {
        bottom: var(--space-md);
        right: var(--space-md);
    }
}

@media (max-width: 480px) {
    .logo h1 {
        font-size: 18px;
    }
    
    .streak-badge {
        padding: var(--space-sm);
        font-size: 12px;
    }
    
    .message-content {
        padding: var(--space-md);
    }
    
    .input-wrapper {
        padding: var(--space-sm);
    }
    
    #messageInput {
        font-size: 14px;
    }
}`,
    'app.js': `// Study Buddy - Clean JavaScript (No Regex Issues!)
class StudyBuddyApp {
    constructor() {
        this.baseUrl = window.location.origin;
        this.userId = this.getUserId();
        this.initializeElements();
        this.attachEventListeners();
        this.loadUserProgress();
        this.updateConnectionStatus('Connected', true);
    }

    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.userStreak = document.getElementById('userStreak');
    }

    attachEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Quick action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Quiz action buttons
        document.querySelectorAll('.quiz-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuizAction(action);
            });
        });
    }

    getUserId() {
        let userId = localStorage.getItem('studyBuddyUserId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('studyBuddyUserId', userId);
        }
        return userId;
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
            if (!message) return;
            
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.sendButton.disabled = true;

        this.showTypingIndicator();

        try {
            const response = await fetch(this.baseUrl + '/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, userId: this.userId })
            });

            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }

            const data = await response.json();
            this.hideTypingIndicator();
            this.addMessage(data.response, 'bot');
            this.updateUserProgress(data);
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered an error: ' + error.message, 'bot');
            this.updateConnectionStatus('Error', false);
        } finally {
            this.sendButton.disabled = false;
        }
    }

    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ' + sender + '-message';

        // Create avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        const avatarIcon = document.createElement('div');
        avatarIcon.className = 'avatar-icon';
        avatarIcon.textContent = sender === 'user' ? '👤' : '🤖';
        avatarDiv.appendChild(avatarIcon);

        // Create message content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Create message header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';
        
        const senderName = document.createElement('span');
        senderName.className = 'sender-name';
        senderName.textContent = sender === 'user' ? 'You' : 'Study Buddy';
        
        const timeDiv = document.createElement('span');
        timeDiv.className = 'message-time';
        timeDiv.textContent = this.formatTime(new Date());
        
        headerDiv.appendChild(senderName);
        headerDiv.appendChild(timeDiv);
        
        // Create message text
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.textContent = content;
        
        contentDiv.appendChild(headerDiv);
        contentDiv.appendChild(textDiv);
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typingIndicator';
        
        // Create avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        const avatarIcon = document.createElement('div');
        avatarIcon.className = 'avatar-icon';
        avatarIcon.textContent = '🤖';
        avatarDiv.appendChild(avatarIcon);
        
        // Create message content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Create message header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';
        
        const senderName = document.createElement('span');
        senderName.className = 'sender-name';
        senderName.textContent = 'Study Buddy';
        
        headerDiv.appendChild(senderName);
        
        // Create typing dots
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.innerHTML = 'Typing';
        
        const dotsDiv = document.createElement('div');
        dotsDiv.className = 'typing-dots';
        dotsDiv.innerHTML = '<span></span><span></span><span></span>';
        
        contentDiv.appendChild(headerDiv);
        contentDiv.appendChild(textDiv);
        contentDiv.appendChild(dotsDiv);
        
        typingDiv.appendChild(avatarDiv);
        typingDiv.appendChild(contentDiv);
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    async handleQuickAction(action) {
        let message = '';
        switch (action) {
            case 'summarize':
                const topic = prompt('What topic would you like me to summarize?');
                if (topic) message = 'summarize ' + topic;
                break;
            case 'quiz':
                const quizTopic = prompt('What topic would you like a quiz on?');
                if (quizTopic) message = 'quiz me on ' + quizTopic;
                break;
            case 'progress':
                message = 'show my progress';
                break;
        }
        
        if (message) {
            this.messageInput.value = message;
            await this.sendMessage();
        }
    }

    async handleQuizAction(action) {
        switch (action) {
            case 'list-quizzes':
                this.messageInput.value = 'list quizzes';
                await this.sendMessage();
                break;
            case 'show-last-quiz':
                this.messageInput.value = 'show last quiz';
                await this.sendMessage();
                break;
            case 'submit-answers':
                const answers = prompt('Enter your answers separated by commas (e.g., A,B,C):');
                if (answers) {
                    this.messageInput.value = 'answer ' + answers;
                    await this.sendMessage();
                }
                break;
        }
    }

    formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    updateConnectionStatus(status, connected) {
        const statusText = this.connectionStatus.querySelector('.status-text');
        if (statusText) {
            statusText.textContent = status;
        }
        this.connectionStatus.className = connected ? 'status-indicator connected' : 'status-indicator';
    }

    updateUserProgress(data) {
        // Extract streak from response if available
        const streakMatch = data.response && data.response.match(/streak is now (\\d+)/);
        if (streakMatch) {
            const streakText = this.userStreak.querySelector('.streak-text');
            if (streakText) {
                streakText.textContent = streakMatch[1] + ' days';
            }
        }
    }

    async loadUserProgress() {
        // This would typically load user progress from the API
        // For now, we'll just show a default streak
        const streakText = this.userStreak.querySelector('.streak-text');
        if (streakText) {
            streakText.textContent = '0 days';
        }
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new StudyBuddyApp();
});`
  };
  
  return files[filename] || '';
}