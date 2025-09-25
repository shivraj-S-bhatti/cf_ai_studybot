// Study Buddy Agent - Frontend JavaScript
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
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, userId: this.userId })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.hideTypingIndicator();
            this.addMessage(data.response, 'bot');
            this.updateUserProgress(data);
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage(`Sorry, I encountered an error: ${error.message}`, 'bot');
            this.updateConnectionStatus('Error', false);
        } finally {
            this.sendButton.disabled = false;
        }
    }

    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

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
        
        if (sender === 'user') {
            textDiv.innerHTML = this.escapeHtml(content);
        } else {
            textDiv.innerHTML = this.formatBotMessage(content);
        }
        
        contentDiv.appendChild(headerDiv);
        contentDiv.appendChild(textDiv);
        
        messageDiv.appendChild(avatarDiv);
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
        
        // Code blocks
        formatted = formatted.replace(/```([\\s\\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        // Inline code
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Line breaks
        formatted = formatted.replace(/\\n/g, '<br>');
        
        return formatted;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
                if (topic) message = `summarize ${topic}`;
                break;
            case 'quiz':
                const quizTopic = prompt('What topic would you like a quiz on?');
                if (quizTopic) message = `quiz me on ${quizTopic}`;
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
                await this.listQuizzes();
                break;
            case 'show-last-quiz':
                await this.showLastQuiz();
                break;
            case 'submit-answers':
                await this.submitAnswers();
                break;
        }
    }

    async listQuizzes() {
        try {
            const response = await fetch(`${this.baseUrl}/api/quiz/list?userId=${this.userId}`);
            const data = await response.json();
            
            if (data.quizzes && data.quizzes.length > 0) {
                let message = '📝 **Your Recent Quizzes**\\n\\n';
                data.quizzes.slice(0, 5).forEach((quiz, index) => {
                    const date = new Date(quiz.createdAt).toLocaleDateString();
                    message += `${index + 1}. **${quiz.topic}** (${quiz.questions.length} questions) - ${date}\\n`;
                    message += `   ID: \`${quiz.id}\`\\n\\n`;
                });
                message += '💡 Use "show quiz [ID]" to view a specific quiz, or "answer A,B,C" to submit answers.';
                this.addMessage(message, 'bot');
            } else {
                this.addMessage('📝 **Your Quizzes**\\n\\nNo quizzes yet! Try creating one with "quiz me on [topic]".', 'bot');
            }
        } catch (error) {
            this.addMessage(`Error loading quizzes: ${error.message}`, 'bot');
        }
    }

    async showLastQuiz() {
        try {
            const response = await fetch(`${this.baseUrl}/api/quiz/list?userId=${this.userId}`);
            const data = await response.json();
            
            if (data.quizzes && data.quizzes.length > 0) {
                const quiz = data.quizzes[0];
                const quizResponse = await fetch(`${this.baseUrl}/api/quiz/${quiz.id}?userId=${this.userId}`);
                const quizData = await quizResponse.json();
                
                if (quizData.quiz) {
                    let message = `🧠 **Quiz: ${quizData.quiz.topic}**\\n\\n`;
                    quizData.quiz.questions.forEach((question, index) => {
                        message += `**Question ${index + 1}:** ${question.question}\\n`;
                        if (question.options) {
                            question.options.forEach((option, i) => {
                                message += `${String.fromCharCode(65 + i)}. ${option}\\n`;
                            });
                        }
                        message += '\\n';
                    });
                    message += '💡 Use "answer A,B,C" to submit your answers.';
                    this.addMessage(message, 'bot');
                } else {
                    this.addMessage('Quiz not found.', 'bot');
                }
            } else {
                this.addMessage('No quizzes available. Create a quiz first!', 'bot');
            }
        } catch (error) {
            this.addMessage(`Error loading quiz: ${error.message}`, 'bot');
        }
    }

    async submitAnswers() {
        const answers = prompt('Enter your answers separated by commas (e.g., A,B,C):');
        if (!answers) return;

        try {
            const response = await fetch(`${this.baseUrl}/api/quiz/list?userId=${this.userId}`);
            const data = await response.json();
            
            if (data.quizzes && data.quizzes.length > 0) {
                const quiz = data.quizzes[0];
                const answerArray = answers.split(/[,\\s]+/).filter(Boolean);
                
                const submitResponse = await fetch(`${this.baseUrl}/api/quiz/${quiz.id}/submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: this.userId, answers: answerArray })
                });
                
                const result = await submitResponse.json();
                
                if (result.error) {
                    this.addMessage(`❌ ${result.error}`, 'bot');
                } else {
                    const emoji = result.percentage >= 80 ? '🎉' : result.percentage >= 60 ? '👍' : '📚';
                    const message = `${emoji} **Quiz Results**\\n\\n` +
                                 `📊 Score: ${result.score}/${result.total} (${result.percentage}%)\\n` +
                                 `${result.percentage >= 80 ? 'Excellent work!' : result.percentage >= 60 ? 'Good job!' : 'Keep studying!'}`;
                    this.addMessage(message, 'bot');
                }
            } else {
                this.addMessage('No quizzes available to answer. Create a quiz first!', 'bot');
            }
        } catch (error) {
            this.addMessage(`Error submitting answers: ${error.message}`, 'bot');
        }
    }

    formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    updateConnectionStatus(status, connected) {
        this.connectionStatus.textContent = status;
        this.connectionStatus.className = connected ? 'connected' : '';
    }

    updateUserProgress(data) {
        // Extract streak from response if available
        const streakMatch = data.response?.match(/streak is now (\\d+)/);
        if (streakMatch) {
            const streakText = this.userStreak.querySelector('.streak-text');
            if (streakText) {
                streakText.textContent = `${streakMatch[1]} days`;
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
});
