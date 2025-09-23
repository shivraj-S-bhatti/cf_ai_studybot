class StudyBuddyApp {
    constructor() {
        this.ws = null;
        this.userId = this.getUserId();
        this.isConnected = false;
        this.retryCount = 0;
        this.maxRetries = 5;
        
        this.initializeElements();
        this.setupEventListeners();
        this.connect();
    }

    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.userStreak = document.getElementById('userStreak');
    }

    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Quick action buttons
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    getUserId() {
        let userId = localStorage.getItem('studyBuddyUserId');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('studyBuddyUserId', userId);
        }
        return userId;
    }

    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('Connected to Study Buddy Agent');
                this.isConnected = true;
                this.retryCount = 0;
                this.updateConnectionStatus('Connected', true);
                this.loadUserProgress();
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            };

            this.ws.onclose = () => {
                console.log('Disconnected from Study Buddy Agent');
                this.isConnected = false;
                this.updateConnectionStatus('Disconnected', false);
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus('Error', false);
            };

        } catch (error) {
            console.error('Failed to connect:', error);
            this.updateConnectionStatus('Connection Failed', false);
            this.attemptReconnect();
        }
    }

    attemptReconnect() {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            const delay = Math.min(1000 * Math.pow(2, this.retryCount), 10000);
            
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
            
            setTimeout(() => {
                this.connect();
            }, delay);
        } else {
            this.updateConnectionStatus('Connection Failed', false);
        }
    }

    sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || !this.isConnected) return;

        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.sendButton.disabled = true;

        // Show typing indicator
        this.showTypingIndicator();

        // Send message via WebSocket
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                message: message,
                userId: this.userId
            }));
        } else {
            // Fallback to HTTP API
            this.sendMessageHTTP(message);
        }
    }

    async sendMessageHTTP(message) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    userId: this.userId
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.hideTypingIndicator();
                this.addMessage(data.response, 'bot');
                this.updateUserProgress(data);
            } else {
                throw new Error('HTTP request failed');
            }
        } catch (error) {
            console.error('HTTP request failed:', error);
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
        } finally {
            this.sendButton.disabled = false;
        }
    }

    handleMessage(data) {
        this.hideTypingIndicator();
        this.sendButton.disabled = false;

        if (data.error) {
            this.addMessage(data.error, 'bot');
        } else if (data.response) {
            this.addMessage(data.response, 'bot');
            this.updateUserProgress(data);
        }
    }

    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (sender === 'user') {
            contentDiv.innerHTML = `<strong>You:</strong> ${this.escapeHtml(content)}`;
        } else {
            contentDiv.innerHTML = this.formatBotMessage(content);
        }

        messageDiv.appendChild(contentDiv);
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatBotMessage(content) {
        // Convert markdown-like formatting to HTML
        let formatted = this.escapeHtml(content);
        
        // Bold text
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Italic text
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Line breaks
        formatted = formatted.replace(/\n/g, '<br>');
        
        // Lists
        formatted = formatted.replace(/^• (.*$)/gm, '<li>$1</li>');
        formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        return `<strong>Study Buddy:</strong> ${formatted}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="message-content">
                <strong>Study Buddy:</strong> 
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    handleQuickAction(action) {
        const actions = {
            summarize: 'summarize ',
            quiz: 'quiz me on ',
            progress: 'show my progress'
        };

        if (actions[action]) {
            this.messageInput.value = actions[action];
            this.messageInput.focus();
        }
    }

    updateConnectionStatus(status, connected) {
        this.connectionStatus.textContent = status;
        this.connectionStatus.className = connected ? 'connected' : '';
    }

    updateUserProgress(data) {
        // Extract streak from response if available
        const streakMatch = data.response?.match(/streak is now (\d+)/);
        if (streakMatch) {
            this.userStreak.textContent = `Streak: ${streakMatch[1]} days`;
        }
    }

    async loadUserProgress() {
        // This would typically load user progress from the API
        // For now, we'll just show a default streak
        this.userStreak.textContent = 'Streak: 0 days';
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new StudyBuddyApp();
});
