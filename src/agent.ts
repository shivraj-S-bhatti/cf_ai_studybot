/**
 * Study Buddy Agent - Clean Durable Object Implementation
 * 
 * This Durable Object implements a comprehensive study assistant using:
 * - Cloudflare Workers AI (Llama 3.1) for natural language processing
 * - D1 Database for persistent storage of user state and quizzes
 * - WebSocket support for real-time chat
 * - Intelligent command parsing for different study features
 */

export interface UserState {
  userId: string;
  streak: number;
  lastTopic?: string;
  lastActive: string;
  quizzes: Quiz[];
}

export interface Quiz {
  id: string;
  topic: string;
  questions: Question[];
  createdAt: string;
}

export interface Question {
  id: string;
  question: string;
  answer: string;
  options?: string[];
}

export class StudyBotAgent {
  private db: D1Database;
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.db = env.DB;
    this.env = env;
  }

  async initialize() {
    // Initialize database schema
    await this.db.exec(`CREATE TABLE IF NOT EXISTS user_states (user_id TEXT PRIMARY KEY, streak INTEGER DEFAULT 0, last_topic TEXT, last_active TEXT, data TEXT)`);
    await this.db.exec(`CREATE TABLE IF NOT EXISTS quizzes (id TEXT PRIMARY KEY, user_id TEXT, topic TEXT, questions TEXT, created_at TEXT)`);
    await this.db.exec(`CREATE TABLE IF NOT EXISTS quiz_results (id TEXT PRIMARY KEY, quiz_id TEXT, user_id TEXT, answers TEXT, score INTEGER, total_questions INTEGER, created_at TEXT)`);
  }

  async chat(message: string, userId: string = 'default'): Promise<string> {
    try {
      await this.initialize();
      
      const userState = await this.getUserState(userId);
      await this.updateUserState(userId, { lastActive: new Date().toISOString() });
      
      const intent = this.parseIntent(message);
      
      switch (intent.type) {
        case 'summarize':
          return await this.summarizeTopic(intent.topic || 'general knowledge', userState);
        case 'quiz_generate':
          return await this.generateQuiz(intent.topic || 'general knowledge', userId);
        case 'quiz_list':
          return await this.listQuizzes(userId);
        case 'quiz_show':
          return await this.showQuiz(userId, intent.quizId || '');
        case 'quiz_answer':
          return await this.submitQuizAnswers(userId, intent.answers || []);
        case 'progress':
          return this.getProgressMessage(userState);
        case 'general':
        default:
          return await this.handleGeneralQuestion(message, userState);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      return `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  async summarizeTopic(topic: string, userState: UserState): Promise<string> {
    try {
      const prompt = `Provide a concise, educational summary of "${topic}". Include:
1. Key concepts and definitions
2. 2-3 practical examples
3. Why it's important to understand

Keep it under 300 words and make it engaging for a student.`;

      const response = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7
      });

      const summary = response.response || 'Sorry, I couldn\'t generate a summary right now.';
      
      await this.updateUserState(userState.userId, { 
        lastTopic: topic,
        streak: userState.streak + 1
      });

      return `📚 **Summary of ${topic}**\n\n${summary}\n\n💡 *Great job! Your study streak is now ${userState.streak + 1} days.*`;
    } catch (error) {
      console.error('Error summarizing topic:', error);
      return 'Sorry, I encountered an error while generating the summary. Please try again.';
    }
  }

  async generateQuiz(topic: string, userId: string): Promise<string> {
    try {
      const prompt = `Create a 3-question quiz about "${topic}". For each question:
1. Write a clear, specific question
2. Provide the correct answer
3. Include 3 plausible wrong options

Format as JSON with this structure:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text?",
      "answer": "Correct answer",
      "options": ["Option A", "Option B", "Option C", "Option D"]
    }
  ]
}`;

      const response = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.8
      });

      const responseText = response.response || '{}';
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)```/i) || responseText.match(/\{[\s\S]*\}/);
      const quizData = jsonMatch ? JSON.parse(jsonMatch[1] || jsonMatch[0]) : null;
      
      if (quizData?.questions?.length > 0) {
        const quizId = `quiz_${Date.now()}`;
        const quiz: Quiz = {
          id: quizId,
          topic,
          questions: quizData.questions,
          createdAt: new Date().toISOString()
        };

        await this.storeQuiz(userId, quiz);
        
        let quizText = `🧠 **Quiz: ${topic}**\n\n`;
        quiz.questions.forEach((q, index) => {
          quizText += `**Question ${index + 1}:** ${q.question}\n`;
          q.options?.forEach((option, i) => {
            quizText += `${String.fromCharCode(65 + i)}. ${option}\n`;
          });
          quizText += '\n';
        });
        
        quizText += '💡 *Answer the questions and I\'ll check them for you!*';
        return quizText;
      } else {
        return 'Sorry, I couldn\'t generate a proper quiz. Please try again with a different topic.';
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      return 'Sorry, I encountered an error while generating the quiz. Please try again.';
    }
  }

  getProgressMessage(userState: UserState): string {
    return `📊 **Your Study Progress**\n\n` +
           `🔥 Study Streak: ${userState.streak} days\n` +
           `📚 Last Topic: ${userState.lastTopic || 'None yet'}\n` +
           `📝 Quizzes Taken: ${userState.quizzes.length}\n\n` +
           `Keep up the great work! 🎉`;
  }

  async listQuizzes(userId: string): Promise<string> {
    const quizzes = await this.getUserQuizzes(userId);
    
    if (quizzes.length === 0) {
      return '📝 **Your Quizzes**\n\nNo quizzes yet! Try creating one with "quiz me on [topic]".';
    }
    
    let response = '📝 **Your Recent Quizzes**\n\n';
    quizzes.slice(0, 5).forEach((quiz, index) => {
      const date = new Date(quiz.createdAt).toLocaleDateString();
      response += `${index + 1}. **${quiz.topic}** (${quiz.questions.length} questions) - ${date}\n`;
      response += `   ID: \`${quiz.id}\`\n\n`;
    });
    
    response += '💡 Use "show quiz [ID]" to view a specific quiz, or "answer A,B,C" to submit answers.';
    return response;
  }

  async showQuiz(userId: string, quizId: string): Promise<string> {
    const quiz = await this.getQuiz(userId, quizId);
    
    if (!quiz) {
      return '❌ Quiz not found. Use "list quizzes" to see your available quizzes.';
    }
    
    let response = `🧠 **Quiz: ${quiz.topic}**\n\n`;
    quiz.questions.forEach((question, index) => {
      response += `**Question ${index + 1}:** ${question.question}\n`;
      if (question.options) {
        question.options.forEach((option, i) => {
          response += `${String.fromCharCode(65 + i)}. ${option}\n`;
        });
      }
      response += '\n';
    });
    
    response += '💡 Use "answer A,B,C" to submit your answers.';
    return response;
  }

  async submitQuizAnswers(userId: string, answers: string[]): Promise<string> {
    const quizzes = await this.getUserQuizzes(userId);
    
    if (quizzes.length === 0) {
      return '❌ No quizzes available to answer. Create a quiz first!';
    }
    
    const latestQuiz = quizzes[0];
    const result = await this.gradeQuiz(userId, latestQuiz.id, answers);
    
    if (result.error) {
      return `❌ ${result.error}`;
    }
    
    const emoji = result.percentage >= 80 ? '🎉' : result.percentage >= 60 ? '👍' : '📚';
    return `${emoji} **Quiz Results**\n\n` +
           `📊 Score: ${result.score}/${result.total} (${result.percentage}%)\n` +
           `🔥 Your study streak is now ${(await this.getUserState(userId)).streak} days!\n\n` +
           `${result.percentage >= 80 ? 'Excellent work!' : result.percentage >= 60 ? 'Good job!' : 'Keep studying!'}`;
  }

  async handleGeneralQuestion(message: string, userState: UserState): Promise<string> {
    try {
      const prompt = `You are Study Buddy, an AI-powered study companion. The user asked: "${message}". 
      
Respond as a friendly, helpful study assistant. Keep your response concise (under 100 words) and encourage them to use your study features like:
- Topic summarization
- Quiz generation  
- Progress tracking

Be encouraging and mention their current study streak of ${userState.streak} days if it's greater than 0.`;

      const response = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7
      });

      const aiResponse = response.response || 'Hello! I\'m Study Buddy, your AI study companion.';
      
      await this.updateUserState(userState.userId, { 
        lastActive: new Date().toISOString(),
        streak: userState.streak + 1
      });

      return aiResponse;
    } catch (error) {
      console.error('Error handling general question:', error);
      return `Hello! I'm Study Buddy, your AI study companion. I can help you with topic summaries, quizzes, and tracking your study progress. What would you like to study today?`;
    }
  }

  private parseIntent(message: string): { type: string; topic?: string; quizId?: string; answers?: string[] } {
    const m = message.toLowerCase();
    
    if (m.startsWith('summarize ') || m.startsWith('explain ')) {
      return { type: 'summarize', topic: message.replace(/^(summarize|explain)\s+/i, '') };
    }
    
    if (m.startsWith('quiz me on ') || m.includes('generate quiz') || m.includes('create quiz')) {
      const topic = m.startsWith('quiz me on ') 
        ? message.replace(/^quiz me on\s+/i, '')
        : this.extractTopic(message);
      return { type: 'quiz_generate', topic };
    }
    
    if (/^list quizzes/i.test(message)) {
      return { type: 'quiz_list' };
    }
    
    const showMatch = message.match(/^show quiz\s+(\S+)/i);
    if (showMatch) {
      return { type: 'quiz_show', quizId: showMatch[1] };
    }
    
    if (/^answer[:\s]/i.test(message)) {
      const answers = message.replace(/^answer[:\s]/i, '').split(/[,\s]+/).filter(Boolean);
      return { type: 'quiz_answer', answers };
    }
    
    if (/progress|streak/i.test(m)) {
      return { type: 'progress' };
    }
    
    return { type: 'general' };
  }

  private extractTopic(message: string): string {
    const match = message.match(/(?:summarize|explain|quiz me|generate quiz|create quiz)\s+(.+)/i);
    return match ? match[1].trim() : 'general knowledge';
  }

  private async getUserState(userId: string): Promise<UserState> {
    const result = await this.db.prepare(
      'SELECT * FROM user_states WHERE user_id = ?'
    ).bind(userId).first();

    if (result) {
      return {
        userId,
        streak: (result.streak as number) || 0,
        lastTopic: result.last_topic as string | undefined,
        lastActive: (result.last_active as string) || new Date().toISOString(),
        quizzes: await this.getUserQuizzes(userId)
      };
    }

    return {
      userId,
      streak: 0,
      lastActive: new Date().toISOString(),
      quizzes: []
    };
  }

  private async updateUserState(userId: string, updates: Partial<UserState>): Promise<void> {
    const current = await this.db.prepare(
      'SELECT * FROM user_states WHERE user_id = ?'
    ).bind(userId).first();

    const merged = {
      streak: updates.streak ?? (current?.streak ?? 0),
      lastTopic: updates.lastTopic ?? (current?.last_topic ?? null),
      lastActive: updates.lastActive ?? (current?.last_active ?? new Date().toISOString()),
      data: current?.data ?? null
    };

    await this.db.prepare(`
      INSERT INTO user_states (user_id, streak, last_topic, last_active, data)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        streak = excluded.streak,
        last_topic = excluded.last_topic,
        last_active = excluded.last_active,
        data = excluded.data
    `).bind(
      userId,
      merged.streak,
      merged.lastTopic,
      merged.lastActive,
      merged.data
    ).run();
  }

  private async getUserQuizzes(userId: string): Promise<Quiz[]> {
    const result = await this.db.prepare(
      'SELECT * FROM quizzes WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(userId).all();

    return result.results?.map((row: any) => ({
      id: row.id as string,
      topic: row.topic as string,
      questions: JSON.parse((row.questions as string) || '[]'),
      createdAt: row.created_at as string
    })) || [];
  }

  private async storeQuiz(userId: string, quiz: Quiz): Promise<void> {
    await this.db.prepare(`
      INSERT INTO quizzes (id, user_id, topic, questions, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      quiz.id,
      userId,
      quiz.topic,
      JSON.stringify(quiz.questions),
      quiz.createdAt
    ).run();
  }

  private async getQuiz(userId: string, quizId: string): Promise<Quiz | null> {
    const row = await this.db.prepare(
      'SELECT * FROM quizzes WHERE id = ? AND user_id = ?'
    ).bind(quizId, userId).first();

    if (!row) return null;

    return {
      id: row.id as string,
      topic: row.topic as string,
      questions: JSON.parse((row.questions as string) || '[]'),
      createdAt: row.created_at as string
    };
  }

  private async gradeQuiz(userId: string, quizId: string, answers: string[]): Promise<any> {
    const quiz = await this.getQuiz(userId, quizId);
    if (!quiz) {
      return { error: 'Quiz not found' };
    }

    let score = 0;
    
    quiz.questions.forEach((question, index) => {
      const userAnswer = (answers[index] || '').trim().toUpperCase();
      const correctAnswer = question.answer?.trim();
      
      if (question.options && correctAnswer) {
        const correctIndex = question.options.findIndex(option => option.trim() === correctAnswer);
        const correctLetter = String.fromCharCode(65 + correctIndex);
        
        if (userAnswer === correctLetter) {
          score++;
        }
      }
    });

    const resultId = `result_${Date.now()}`;
    await this.db.prepare(`
      INSERT INTO quiz_results (id, quiz_id, user_id, answers, score, total_questions, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      resultId,
      quizId,
      userId,
      JSON.stringify(answers),
      score,
      quiz.questions.length,
      new Date().toISOString()
    ).run();

    const userState = await this.getUserState(userId);
    await this.updateUserState(userId, { 
      streak: userState.streak + 1, 
      lastActive: new Date().toISOString() 
    });

    return {
      quizId,
      score,
      total: quiz.questions.length,
      resultId,
      percentage: Math.round((score / quiz.questions.length) * 100)
    };
  }

  async fetch(request: Request): Promise<Response> {
    try {
      if (request.headers.get('Upgrade') === 'websocket') {
        const { 0: client, 1: server } = new WebSocketPair();
        
        this.handleWebSocket(server);
        
        return new Response(null, {
          status: 101,
          webSocket: client,
        });
      }

      const url = new URL(request.url);
      
      if (url.pathname === '/api/chat' && request.method === 'POST') {
        const { message, userId } = await request.json() as { message: string; userId: string };
        const response = await this.chat(message, userId);
        
        return new Response(JSON.stringify({ response }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (url.pathname === '/api/quiz/list' && request.method === 'GET') {
        const userId = url.searchParams.get('userId') ?? 'default';
        const quizzes = await this.getUserQuizzes(userId);
        return new Response(JSON.stringify({ quizzes }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const quizMatch = url.pathname.match(/^\/api\/quiz\/([^/]+)$/);
      if (quizMatch && request.method === 'GET') {
        const userId = url.searchParams.get('userId') ?? 'default';
        const quiz = await this.getQuiz(userId, quizMatch[1]);
        if (!quiz) {
          return new Response(JSON.stringify({ error: 'Quiz not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return new Response(JSON.stringify({ quiz }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const submitMatch = url.pathname.match(/^\/api\/quiz\/([^/]+)\/submit$/);
      if (submitMatch && request.method === 'POST') {
        const { userId, answers } = await request.json() as { userId: string; answers: string[] };
        const result = await this.gradeQuiz(userId, submitMatch[1], answers);
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response('Not found', { status: 404 });
    } catch (error) {
      console.error('Error in fetch:', error);
      return new Response(JSON.stringify({ 
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private handleWebSocket(webSocket: WebSocket) {
    webSocket.accept();
    
    webSocket.addEventListener('message', async (event) => {
      try {
        const { message, userId } = JSON.parse(event.data);
        const response = await this.chat(message, userId);
        
        webSocket.send(JSON.stringify({ response }));
      } catch (error) {
        console.error('WebSocket error:', error);
        webSocket.send(JSON.stringify({ 
          error: 'Sorry, something went wrong. Please try again.' 
        }));
      }
    });
  }
}
