/**
 * Mind Grace Neuropsychiatric - ICD-11 & DSM-5-TR Trivia Game
 * Created by Shirish from the Mind Grace Neuropsychiatric team
 * 
 * A fully client-side trivia game that loads questions from JSON
 * and provides interactive learning for mental health classification systems.
 */

class TriviaGame {
  constructor() {
    this.questions = [];
    this.currentIndex = 0;
    this.score = 0;
    this.correctAnswers = 0;
    this.incorrectAnswers = 0;
    this.selectedCategory = 'all';
    this.filteredQuestions = [];
    this.gameActive = false;
    
    this.init();
  }

  async init() {
    try {
      await this.loadQuestions();
      this.setupEventListeners();
      this.renderStats();
      this.renderCategoryFilters();
      this.showStartScreen();
    } catch (error) {
      console.error('Failed to initialize game:', error);
      this.showError('Failed to load questions. Please refresh the page.');
    }
  }

  async loadQuestions() {
    const response = await fetch('data/trivia_questions.json');
    if (!response.ok) {
      throw new Error('Failed to load questions');
    }
    const data = await response.json();
    this.questions = data.questions;
    this.filteredQuestions = [...this.questions];
  }

  setupEventListeners() {
    // Start game button
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startGame());
    }

    // Next question button
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextQuestion());
    }

    // Restart game button
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.restartGame());
    }
  }

  getCategories() {
    const categories = new Set(this.questions.map(q => q.category));
    return ['all', ...Array.from(categories)];
  }

  renderCategoryFilters() {
    const filterContainer = document.getElementById('category-filters');
    if (!filterContainer) return;

    const categories = this.getCategories();
    filterContainer.innerHTML = categories.map(cat => `
      <button 
        class="filter-btn ${cat === 'all' ? 'active' : ''}" 
        data-category="${cat}"
      >
        ${cat === 'all' ? 'All Categories' : cat}
      </button>
    `).join('');

    // Add click listeners to filter buttons
    filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.filterByCategory(e.target.dataset.category);
        
        // Update active state
        filterContainer.querySelectorAll('.filter-btn').forEach(b => {
          b.classList.remove('active');
        });
        e.target.classList.add('active');
      });
    });
  }

  filterByCategory(category) {
    this.selectedCategory = category;
    
    if (category === 'all') {
      this.filteredQuestions = [...this.questions];
    } else {
      this.filteredQuestions = this.questions.filter(q => q.category === category);
    }

    // Shuffle filtered questions
    this.shuffleArray(this.filteredQuestions);
    this.currentIndex = 0;
    
    // Reset stats
    this.score = 0;
    this.correctAnswers = 0;
    this.incorrectAnswers = 0;
    
    this.renderStats();
    
    if (this.gameActive) {
      this.renderQuestion();
    }
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  showStartScreen() {
    const gameArea = document.getElementById('game-area');
    const startScreen = document.getElementById('start-screen');
    
    if (startScreen) startScreen.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    
    this.gameActive = false;
  }

  startGame() {
    const startScreen = document.getElementById('start-screen');
    const gameArea = document.getElementById('game-area');
    
    if (startScreen) startScreen.classList.add('hidden');
    if (gameArea) gameArea.classList.remove('hidden');
    
    // Shuffle questions at game start
    this.shuffleArray(this.filteredQuestions);
    this.currentIndex = 0;
    this.score = 0;
    this.correctAnswers = 0;
    this.incorrectAnswers = 0;
    
    this.gameActive = true;
    this.renderStats();
    this.renderQuestion();
  }

  renderQuestion() {
    const questionArea = document.getElementById('question-area');
    if (!questionArea || this.currentIndex >= this.filteredQuestions.length) {
      this.endGame();
      return;
    }

    const question = this.filteredQuestions[this.currentIndex];
    
    questionArea.innerHTML = `
      <div class="question-counter">
        <span class="counter-label">Question</span>
        <span class="counter-value">${this.currentIndex + 1} / ${this.filteredQuestions.length}</span>
      </div>
      
      <h3 class="question-text">${question.question}</h3>
      
      <div class="options-grid" id="options-container">
        ${question.options.map((option, index) => `
          <button 
            class="option-btn" 
            data-index="${index}"
            onclick="game.selectAnswer(${index})"
          >
            ${option}
          </button>
        `).join('')}
      </div>
      
      <div id="feedback-area" class="hidden"></div>
      
      <div class="controls">
        <button id="next-btn" class="btn btn-primary hidden">
          Next Question →
        </button>
      </div>
    `;

    // Re-attach next button listener
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextQuestion());
    }
  }

  selectAnswer(selectedIndex) {
    if (!this.gameActive) return;
    
    const question = this.filteredQuestions[this.currentIndex];
    const optionsContainer = document.getElementById('options-container');
    const feedbackArea = document.getElementById('feedback-area');
    const nextBtn = document.getElementById('next-btn');
    
    // Disable all option buttons
    const optionButtons = optionsContainer.querySelectorAll('.option-btn');
    optionButtons.forEach(btn => {
      btn.disabled = true;
      const index = parseInt(btn.dataset.index);
      
      if (index === question.correct) {
        btn.classList.add('correct');
      } else if (index === selectedIndex && index !== question.correct) {
        btn.classList.add('incorrect');
      }
    });

    // Update score
    if (selectedIndex === question.correct) {
      this.score += 10;
      this.correctAnswers++;
    } else {
      this.incorrectAnswers++;
    }

    this.renderStats();

    // Show feedback
    feedbackArea.classList.remove('hidden');
    feedbackArea.innerHTML = `
      <div class="feedback">
        <h4 class="feedback-title">
          ${selectedIndex === question.correct ? '✓ Correct!' : '✗ Incorrect'}
        </h4>
        <p class="feedback-text">
          ${selectedIndex === question.correct 
            ? 'Excellent! You\'ve identified the correct diagnosis.' 
            : `The correct answer is: <strong>${question.options[question.correct]}</strong>`
          }
        </p>
        ${question.explanation ? `
          <div class="explanation-box">
            <strong style="color: var(--accent-cyan); font-size: 0.875rem;">Explanation:</strong>
            <p style="margin-top: 0.5rem; font-size: 0.95rem; color: var(--text-secondary); line-height: 1.6;">${question.explanation}</p>
          </div>
        ` : ''}
        <div class="code-reference">
          <span class="code-badge dsm">
            📖 DSM-5-TR: ${question.dsm5tr_code}
          </span>
          <span class="code-badge icd">
            🌐 ICD-11: ${question.icd11_code}
          </span>
          ${question.reference ? `
            <span class="code-badge reference">
              📚 ${question.reference}
            </span>
          ` : ''}
        </div>
      </div>
    `;

    // Show next button
    if (nextBtn) {
      nextBtn.classList.remove('hidden');
    }
  }

  nextQuestion() {
    this.currentIndex++;
    this.renderQuestion();
  }

  endGame() {
    this.gameActive = false;
    
    const questionArea = document.getElementById('question-area');
    const endScreen = document.getElementById('end-screen');
    
    if (questionArea) questionArea.classList.add('hidden');
    if (endScreen) endScreen.classList.remove('hidden');

    const percentage = this.filteredQuestions.length > 0 
      ? Math.round((this.correctAnswers / this.filteredQuestions.length) * 100) 
      : 0;

    let message = '';
    if (percentage >= 90) {
      message = 'Outstanding! You\'re a diagnostic expert! 🏆';
    } else if (percentage >= 70) {
      message = 'Great job! You have solid knowledge! 🎯';
    } else if (percentage >= 50) {
      message = 'Good effort! Keep studying! 📚';
    } else {
      message = 'Keep learning! Practice makes perfect! 💪';
    }

    const endContent = document.getElementById('end-content');
    if (endContent) {
      endContent.innerHTML = `
        <h2>Game Complete!</h2>
        <div class="final-score">${this.score}</div>
        <p class="score-message">${message}</p>
        
        <div class="stats-bar" style="margin-bottom: 2rem;">
          <div class="stat-card">
            <div class="stat-value">${this.correctAnswers}</div>
            <div class="stat-label">Correct</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.incorrectAnswers}</div>
            <div class="stat-label">Incorrect</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${percentage}%</div>
            <div class="stat-label">Accuracy</div>
          </div>
        </div>
        
        <div class="controls" style="justify-content: center;">
          <button id="restart-btn" class="btn btn-primary">
            🔄 Play Again
          </button>
          <button onclick="game.showStartScreen()" class="btn btn-secondary">
            📋 Change Category
          </button>
        </div>
      `;
    }

    // Re-attach restart button listener
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.restartGame());
    }
  }

  restartGame() {
    const endScreen = document.getElementById('end-screen');
    const gameArea = document.getElementById('game-area');
    
    if (endScreen) endScreen.classList.add('hidden');
    if (gameArea) gameArea.classList.remove('hidden');
    
    this.shuffleArray(this.filteredQuestions);
    this.currentIndex = 0;
    this.score = 0;
    this.correctAnswers = 0;
    this.incorrectAnswers = 0;
    
    this.gameActive = true;
    this.renderStats();
    this.renderQuestion();
  }

  renderStats() {
    const statsBar = document.getElementById('stats-bar');
    if (!statsBar) return;

    statsBar.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${this.score}</div>
        <div class="stat-label">Score</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${this.correctAnswers}</div>
        <div class="stat-label">Correct</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${this.incorrectAnswers}</div>
        <div class="stat-label">Incorrect</div>
      </div>
    `;
  }

  showError(message) {
    const gameArea = document.getElementById('game-area');
    if (gameArea) {
      gameArea.innerHTML = `
        <div class="game-card">
          <p class="text-error">${message}</p>
          <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 1rem;">
            Refresh Page
          </button>
        </div>
      `;
    }
  }
}

// Initialize game when DOM is ready
let game;
document.addEventListener('DOMContentLoaded', () => {
  game = new TriviaGame();
});
