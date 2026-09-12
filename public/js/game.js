/**
 * MindGrace Trivia - Game Engine v3.0
 * Features: Persistence, Hints, Streaks, Analytics, Export
 * Created by Shirish | Mind Grace Neuropsychiatric Team
 */

// --- State Management ---
const GameState = {
    questions: [],
    currentQuestionIndex: 0,
    score: 0,
    streak: 0,
    maxStreak: 0,
    answeredCount: 0,
    correctCount: 0,
    timer: null,
    timeLeft: 30,
    isTimedMode: false,
    isLearnMode: false,
    hintsUsed: 0,
    sessionHistory: [], // Stores {question, userAnswer, correct, timeTaken}
    
    // Load persistent data
    loadProgress() {
        const saved = localStorage.getItem('mindgrace_progress');
        return saved ? JSON.parse(saved) : { totalQuestions: 0, totalCorrect: 0, highScore: 0, bestStreak: 0 };
    },
    
    // Save persistent data
    saveProgress(currentScore) {
        const progress = this.loadProgress();
        progress.totalQuestions += this.answeredCount;
        progress.totalCorrect += this.correctCount;
        progress.highScore = Math.max(progress.highScore, currentScore);
        progress.bestStreak = Math.max(progress.bestStreak, this.maxStreak);
        localStorage.setItem('mindgrace_progress', JSON.stringify(progress));
    }
};

// --- DOM Elements ---
const elements = {
    startScreen: document.getElementById('start-screen'),
    gameScreen: document.getElementById('game-screen'),
    endScreen: document.getElementById('end-screen'),
    categoryFilter: document.getElementById('category-filter'),
    difficultyFilter: document.getElementById('difficulty-filter'),
    timedToggle: document.getElementById('timed-mode'),
    learnToggle: document.getElementById('learn-mode'),
    startBtn: document.getElementById('start-btn'),
    questionText: document.getElementById('question-text'),
    difficultyBadge: document.getElementById('difficulty-badge'),
    optionsContainer: document.getElementById('options-container'),
    feedbackBox: document.getElementById('feedback-box'),
    nextBtn: document.getElementById('next-btn'),
    scoreDisplay: document.getElementById('score-display'),
    timerDisplay: document.getElementById('timer-display'),
    streakDisplay: document.getElementById('streak-display'),
    finalScore: document.getElementById('final-score'),
    finalStats: document.getElementById('final-stats'),
    restartBtn: document.getElementById('restart-btn'),
    homeBtn: document.getElementById('home-btn'),
    exportBtn: document.getElementById('export-btn'),
    hintBtn: document.getElementById('hint-btn')
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    await loadQuestions();
    setupEventListeners();
    updatePersistentStats();
});

async function loadQuestions() {
    try {
        const response = await fetch('data/trivia_questions.json');
        const data = await response.json();
        GameState.questions = data;
        console.log(`MindGrace: Loaded ${GameState.questions.length} questions.`);
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Failed to load question database. Please ensure trivia_questions.json exists.');
    }
}

function setupEventListeners() {
    elements.startBtn.addEventListener('click', startGame);
    elements.nextBtn.addEventListener('click', nextQuestion);
    elements.restartBtn.addEventListener('click', startGame);
    elements.homeBtn.addEventListener('click', () => location.reload());
    elements.exportBtn.addEventListener('click', exportSessionReport);
    
    if(elements.hintBtn) {
        elements.hintBtn.addEventListener('click', useHint);
    }
}

function updatePersistentStats() {
    const progress = GameState.loadProgress();
    const statsElement = document.getElementById('persistent-stats');
    if (statsElement) {
        statsElement.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">All-Time High Score</span>
                <span class="stat-value">${progress.highScore}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Total Questions Answered</span>
                <span class="stat-value">${progress.totalQuestions}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Best Streak</span>
                <span class="stat-value">${progress.bestStreak} 🔥</span>
            </div>
        `;
    }
}

// --- Game Logic ---

function startGame() {
    GameState.currentQuestionIndex = 0;
    GameState.score = 0;
    GameState.streak = 0;
    GameState.maxStreak = 0;
    GameState.answeredCount = 0;
    GameState.correctCount = 0;
    GameState.hintsUsed = 0;
    GameState.sessionHistory = [];
    GameState.isTimedMode = elements.timedToggle.checked;
    GameState.isLearnMode = elements.learnToggle.checked;

    const category = elements.categoryFilter.value;
    const difficulty = elements.difficultyFilter.value;
    
    let filtered = GameState.questions.filter(q => {
        const catMatch = category === 'all' || q.category === category;
        const diffMatch = difficulty === 'all' || q.difficulty === difficulty;
        return catMatch && diffMatch;
    });

    GameState.questions = shuffleArray(filtered);

    if (GameState.questions.length === 0) {
        alert('No questions found for this selection. Please adjust filters.');
        return;
    }

    elements.startScreen.classList.add('hidden');
    elements.endScreen.classList.add('hidden');
    elements.gameScreen.classList.remove('hidden');
    
    if(elements.hintBtn) {
        elements.hintBtn.style.display = GameState.isLearnMode ? 'none' : 'block';
        elements.hintBtn.disabled = false;
        elements.hintBtn.textContent = '💡 Use Hint (-5 pts)';
    }

    loadQuestion();
}

function loadQuestion() {
    clearInterval(GameState.timer);
    const q = GameState.questions[GameState.currentQuestionIndex];
    
    elements.questionText.textContent = q.question;
    elements.difficultyBadge.textContent = q.difficulty.toUpperCase();
    elements.difficultyBadge.className = `difficulty-badge ${q.difficulty}`;
    
    elements.feedbackBox.classList.add('hidden');
    elements.feedbackBox.className = 'feedback-box hidden';
    
    elements.optionsContainer.innerHTML = '';
    const options = shuffleArray([...q.options]);
    
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt;
        btn.onclick = () => handleAnswer(opt, q);
        elements.optionsContainer.appendChild(btn);
    });

    if (GameState.isTimedMode && !GameState.isLearnMode) {
        GameState.timeLeft = 30;
        elements.timerDisplay.textContent = `⏱ ${GameState.timeLeft}s`;
        elements.timerDisplay.style.color = '#fff';
        
        GameState.timer = setInterval(() => {
            GameState.timeLeft--;
            elements.timerDisplay.textContent = `⏱ ${GameState.timeLeft}s`;
            
            if (GameState.timeLeft <= 10) {
                elements.timerDisplay.style.color = '#ff4757';
            }
            
            if (GameState.timeLeft <= 0) {
                handleTimeout(q);
            }
        }, 1000);
    } else {
        elements.timerDisplay.textContent = GameState.isLearnMode ? '📖 Learn Mode' : '⏱ Off';
    }

    updateScoreBoard();
}

function useHint() {
    if (GameState.score < 5 || GameState.isLearnMode) return;
    
    const q = GameState.questions[GameState.currentQuestionIndex];
    const hintMsg = `💡 Hint: ICD-11 Code starts with "${q.icd11.substring(0, 3)}..."`;
    
    const hintBox = document.createElement('div');
    hintBox.className = 'feedback-box hint-box';
    hintBox.style.backgroundColor = '#2c3e50';
    hintBox.style.borderColor = '#f1c40f';
    hintBox.textContent = hintMsg;
    
    elements.optionsContainer.before(hintBox);
    
    GameState.score -= 5;
    GameState.hintsUsed++;
    updateScoreBoard();
    
    if(elements.hintBtn) elements.hintBtn.disabled = true;
    
    setTimeout(() => hintBox.remove(), 4000);
}

function handleAnswer(selected, question) {
    clearInterval(GameState.timer);
    GameState.answeredCount++;
    
    const isCorrect = selected === question.answer;
    const timeTaken = GameState.isTimedMode ? (30 - GameState.timeLeft) : 0;
    
    GameState.sessionHistory.push({
        question: question.question,
        userAnswer: selected,
        correctAnswer: question.answer,
        isCorrect,
        timeTaken
    });

    if (isCorrect) {
        GameState.correctCount++;
        GameState.streak++;
        if (GameState.streak > GameState.maxStreak) GameState.maxStreak = GameState.streak;
        
        let points = 10;
        if (GameState.isTimedMode && GameState.timeLeft > 15) points += 5;
        
        GameState.score += points;
        showFeedback(true, question, points);
    } else {
        GameState.streak = 0;
        showFeedback(false, question, 0);
    }

    updateScoreBoard();
    disableOptions();
}

function handleTimeout(question) {
    clearInterval(GameState.timer);
    GameState.streak = 0;
    GameState.answeredCount++;
    
    GameState.sessionHistory.push({
        question: question.question,
        userAnswer: 'Time Out',
        correctAnswer: question.answer,
        isCorrect: false,
        timeTaken: 30
    });
    
    showFeedback(false, question, 0, true);
    disableOptions();
    updateScoreBoard();
}

function showFeedback(isCorrect, question, points, isTimeout = false) {
    elements.feedbackBox.classList.remove('hidden');
    elements.feedbackBox.classList.add(isCorrect ? 'correct' : 'incorrect');
    
    let msg = isCorrect 
        ? `✅ Correct! +${points} points` 
        : (isTimeout ? "⏰ Time's Up!" : '❌ Incorrect');
        
    if (question.difficulty === 'hard' && isCorrect) msg += ' (Hard Question!)';

    elements.feedbackBox.innerHTML = `
        <div class="feedback-header">${msg}</div>
        <div class="explanation-box">
            <p><strong>Diagnosis:</strong> ${question.answer}</p>
            <p><strong>DSM-5-TR:</strong> ${question.dsm5}</p>
            <p><strong>ICD-11:</strong> ${question.icd11}</p>
            ${question.explanation ? `<p><em>${question.explanation}</em></p>` : ''}
            ${question.reference ? `<p class="reference"><small>Ref: ${question.reference}</small></p>` : ''}
        </div>
    `;
    
    elements.nextBtn.focus();
}

function disableOptions() {
    const btns = elements.optionsContainer.querySelectorAll('button');
    btns.forEach(b => b.disabled = true);
}

function updateScoreBoard() {
    elements.scoreDisplay.textContent = `Score: ${GameState.score}`;
    elements.streakDisplay.textContent = `🔥 ${GameState.streak}`;
}

function nextQuestion() {
    GameState.currentQuestionIndex++;
    if (elements.hintBtn) elements.hintBtn.disabled = false;
    
    if (GameState.currentQuestionIndex < GameState.questions.length) {
        loadQuestion();
    } else {
        endGame();
    }
}

function endGame() {
    clearInterval(GameState.timer);
    elements.gameScreen.classList.add('hidden');
    elements.endScreen.classList.remove('hidden');
    
    GameState.saveProgress(GameState.score);
    
    const accuracy = GameState.answeredCount > 0 
        ? Math.round((GameState.correctCount / GameState.answeredCount) * 100) 
        : 0;
    
    elements.finalScore.textContent = GameState.score;
    
    elements.finalStats.innerHTML = `
        <div class="stat-grid">
            <div class="stat-card">
                <div class="stat-value">${accuracy}%</div>
                <div class="stat-label">Accuracy</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${GameState.maxStreak} 🔥</div>
                <div class="stat-label">Best Streak</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${GameState.hintsUsed}</div>
                <div class="stat-label">Hints Used</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${GameState.correctCount}/${GameState.answeredCount}</div>
                <div class="stat-label">Questions</div>
            </div>
        </div>
        <p class="motivational-text">
            ${accuracy >= 80 ? "🌟 Outstanding! You're ready for rounds!" : 
              accuracy >= 50 ? "👍 Good effort! Keep studying the codes." : 
              "📚 Review the DSM-5-TR and ICD-11 manuals and try again!"}
        </p>
    `;
}

function exportSessionReport() {
    const date = new Date().toLocaleString();
    let report = `MINDGRACE TRIVIA SESSION REPORT\nGenerated: ${date}\nCreated by Shirish (Mind Grace Neuropsychiatric Team)\n\n`;
    report += `Final Score: ${GameState.score}\nAccuracy: ${Math.round((GameState.correctCount/GameState.answeredCount)*100) || 0}%\n\n`;
    report += `--- QUESTION LOG ---\n`;
    
    GameState.sessionHistory.forEach((item, idx) => {
        report += `${idx+1}. ${item.question}\n`;
        report += `   Your Answer: ${item.userAnswer}\n`;
        report += `   Correct: ${item.correctAnswer}\n`;
        report += `   Result: ${item.isCorrect ? '✅' : '❌'}\n\n`;
    });
    
    navigator.clipboard.writeText(report).then(() => {
        alert('Session report copied to clipboard! You can paste it into your notes.');
    }).catch(err => {
        console.error('Failed to copy', err);
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mindgrace-report-${Date.now()}.txt`;
        a.click();
    });
}

function shuffleArray(array) {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}
