/**
 * MindGrace Trivia - Clinical Diagnostic Challenge
 * DSM-5-TR & ICD-11 Educational Platform
 * Created by Shirish, Mind Grace Neuropsychiatric Team
 */

// Game State
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let streak = 0;
let maxStreak = 0;
let correctAnswers = 0;
let sessionHistory = [];
let timer = null;
let timeRemaining = 30;
let hintsUsed = 0;
let isLearnMode = false;
let isTimedMode = true;

// DOM Elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');
const questionPrompt = document.getElementById('question-prompt');
const textInput = document.getElementById('text-input');
const submitBtn = document.getElementById('submit-btn');
const hintBtn = document.getElementById('hint-btn');
const feedbackContainer = document.getElementById('feedback-container');
const scoreDisplay = document.getElementById('score-display');
const streakDisplay = document.getElementById('streak-display');
const counterDisplay = document.getElementById('question-counter');
const timerDisplay = document.getElementById('timer-display');
const categoryFilter = document.getElementById('category-filter');
const difficultyFilter = document.getElementById('difficulty-filter');
const timedModeToggle = document.getElementById('timed-mode');
const learnModeToggle = document.getElementById('learn-mode');
const optionsContainer = document.getElementById('options-container');
const vignetteContainer = document.getElementById('vignette-container');
const inputContainer = document.getElementById('input-container');

// Load questions from JSON
async function loadQuestions() {
    try {
        // Use absolute path to ensure it works whether opened via file:// or http://
        const basePath = window.location.protocol === 'file:' ? '' : '';
        const response = await fetch(basePath + '/data/trivia_questions.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        questions = data.questions || [];
        
        if (questions.length === 0) {
            throw new Error('No questions found in database');
        }
        
        console.log(`Loaded ${questions.length} questions successfully`);
        initializeFilters();
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Failed to load questions. Please ensure you are running this from a web server or check the console for details.');
    }
}

// Initialize filter dropdowns
function initializeFilters() {
    const categories = [...new Set(questions.map(q => q.category))];
    const difficulties = ['easy', 'medium', 'hard'];
    
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach(cat => {
        categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
    
    difficultyFilter.innerHTML = '<option value="all">All Difficulties</option>';
    difficulties.forEach(diff => {
        difficultyFilter.innerHTML += `<option value="${diff}">${diff.charAt(0).toUpperCase() + diff.slice(1)}</option>`;
    });
}

// Get filtered questions
function getFilteredQuestions() {
    let filtered = [...questions];
    
    const category = categoryFilter.value;
    if (category !== 'all') {
        filtered = filtered.filter(q => q.category === category);
    }
    
    const difficulty = difficultyFilter.value;
    if (difficulty !== 'all') {
        filtered = filtered.filter(q => q.difficulty === difficulty);
    }
    
    return filtered;
}

// Shuffle array (Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Start game
function startGame() {
    isLearnMode = learnModeToggle.checked;
    isTimedMode = timedModeToggle.checked;
    
    const filtered = getFilteredQuestions();
    if (filtered.length === 0) {
        alert('No questions match your filters. Please adjust filters and try again.');
        return;
    }
    
    questions = shuffleArray([...filtered]);
    currentQuestionIndex = 0;
    score = 0;
    streak = 0;
    maxStreak = 0;
    correctAnswers = 0;
    sessionHistory = [];
    hintsUsed = 0;
    
    startScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    endScreen.style.display = 'none';
    
    updateScore();
    showQuestion();
}

// Show current question
function showQuestion() {
    const question = questions[currentQuestionIndex];
    counterDisplay.textContent = `Question ${currentQuestionIndex + 1}/${questions.length}`;
    
    // Build question display based on type
    let questionHTML = `
        <div class="difficulty-badge ${question.difficulty}">${question.difficulty}</div>
        <span class="category-badge">${question.category}</span>
    `;
    
    // Handle vignette questions
    if (question.type === 'vignette' && question.vignette) {
        vignetteContainer.style.display = 'block';
        inputContainer.style.display = 'none';
        optionsContainer.style.display = 'grid';
        
        // Render vignette card
        const v = question.vignette;
        vignetteContainer.innerHTML = `
            <div class="vignette-card">
                <div class="vignette-section">
                    <span class="vignette-label">Chief Complaint</span>
                    <p class="vignette-text">${v.chiefComplaint}</p>
                </div>
                <div class="vignette-section">
                    <span class="vignette-label">History</span>
                    <p class="vignette-text">${v.history}</p>
                </div>
                <div class="vignette-section">
                    <span class="vignette-label">Mental Status</span>
                    <p class="vignette-text">${v.mentalStatus}</p>
                </div>
                <div class="vignette-section">
                    <span class="vignette-label">Duration</span>
                    <p class="vignette-text">${v.duration}</p>
                </div>
            </div>
            <p style="margin-top: 1rem; font-size: 1.1rem; color: var(--text-secondary);">What is the most likely diagnosis?</p>
        `;
        
        // Render multiple choice options
        optionsContainer.innerHTML = '';
        const shuffledOptions = shuffleArray([...question.options]);
        
        shuffledOptions.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = option;
            btn.onclick = () => checkAnswer(option);
            optionsContainer.appendChild(btn);
        });
        
    } else {
        // Standard text input question
        vignetteContainer.style.display = 'none';
        optionsContainer.style.display = 'none';
        inputContainer.style.display = 'flex';
        
        questionPrompt.innerHTML = `
            ${questionHTML}
            <p style="margin-top: 1rem; font-size: 1.2rem;">${question.prompt}</p>
        `;
        
        textInput.value = '';
        textInput.focus();
    }
    
    feedbackContainer.style.display = 'none';
    submitBtn.disabled = false;
    
    // Start timer if enabled
    if (isTimedMode && !isLearnMode) {
        startTimer();
    } else {
        timerDisplay.textContent = '--';
    }
}

// Start countdown timer
function startTimer() {
    timeRemaining = 30;
    timerDisplay.textContent = timeRemaining;
    timerDisplay.classList.remove('time-low', 'time-medium');
    timerDisplay.classList.add('time-high');
    
    clearInterval(timer);
    timer = setInterval(() => {
        timeRemaining--;
        timerDisplay.textContent = timeRemaining;
        
        // Update timer color
        timerDisplay.classList.remove('time-high', 'time-medium', 'time-low');
        if (timeRemaining > 15) {
            timerDisplay.classList.add('time-high');
        } else if (timeRemaining > 5) {
            timerDisplay.classList.add('time-medium');
        } else {
            timerDisplay.classList.add('time-low');
        }
        
        if (timeRemaining <= 0) {
            clearInterval(timer);
            handleTimeout();
        }
    }, 1000);
}

// Handle timeout
function handleTimeout() {
    const question = questions[currentQuestionIndex];
    streak = 0;
    updateScore();
    
    feedbackContainer.innerHTML = `
        <div class="feedback-timeout">
            <h3>⏱ Time's Up!</h3>
            <p>The correct answer was: <strong>${question.answer}</strong></p>
            <div class="code-badges">
                <span class="code-badge dsm">DSM-5-TR: ${question.dsmCode}</span>
                <span class="code-badge icd">ICD-11: ${question.icdCode}</span>
            </div>
            ${question.explanation ? `<div class="explanation-box"><strong>Clinical Pearl:</strong> ${question.clinicalPearl || question.explanation}</div>` : ''}
        </div>
    `;
    feedbackContainer.style.display = 'block';
    feedbackContainer.className = 'feedback incorrect';
    
    // Record in history
    sessionHistory.push({
        questionId: question.id,
        question: question.question,
        userAnswer: 'Time Out',
        correctAnswer: question.answer,
        isCorrect: false,
        timeSpent: 30,
        hintsUsed: 0
    });
    
    submitBtn.disabled = true;
    setTimeout(nextQuestion, 4000);
}

// Use hint
function useHint() {
    if (isLearnMode || !isTimedMode) {
        alert('Hints are only available in Timed Mode with scoring enabled.');
        return;
    }
    
    const question = questions[currentQuestionIndex];
    if (score < 5) {
        alert('Not enough points! You need at least 5 points to use a hint.');
        return;
    }
    
    // Deduct points
    score -= 5;
    hintsUsed++;
    updateScore();
    
    // Reveal first 3 characters of ICD code
    const hint = question.icdCode.substring(0, 3) + '...';
    alert(`💡 Hint: ICD-11 code starts with "${hint}"`);
}

// Check answer
function checkAnswer(userAnswer) {
    clearInterval(timer);
    
    const question = questions[currentQuestionIndex];
    const normalizedUser = (userAnswer || textInput.value).trim().toLowerCase();
    const normalizedCorrect = question.answer.toLowerCase();
    
    // Simple matching logic
    const isCorrect = normalizedUser === normalizedCorrect || 
                      normalizedUser.includes(normalizedCorrect.split(' ')[0].toLowerCase());
    
    const timeSpent = isTimedMode ? 30 - timeRemaining : 0;
    
    if (isCorrect) {
        correctAnswers++;
        streak++;
        if (streak > maxStreak) maxStreak = streak;
        
        // Calculate score
        let points = 10;
        if (isTimedMode && timeRemaining > 15) {
            points += 5; // Bonus for quick answer
        }
        score += points;
        
        feedbackContainer.innerHTML = `
            <h3>✅ Correct!</h3>
            <p><strong>${question.answer}</strong></p>
            <div class="code-badges">
                <span class="code-badge dsm">DSM-5-TR: ${question.dsmCode}</span>
                <span class="code-badge icd">ICD-11: ${question.icdCode}</span>
            </div>
            ${question.explanation ? `<div class="explanation-box"><strong>Clinical Pearl:</strong> ${question.clinicalPearl || question.explanation}</div>` : ''}
            ${question.reference ? `<div class="reference-box"><small>📚 ${question.reference}</small></div>` : ''}
        `;
        feedbackContainer.className = 'feedback correct';
    } else {
        streak = 0;
        feedbackContainer.innerHTML = `
            <h3>❌ Incorrect</h3>
            <p>The correct answer was: <strong>${question.answer}</strong></p>
            <div class="code-badges">
                <span class="code-badge dsm">DSM-5-TR: ${question.dsmCode}</span>
                <span class="code-badge icd">ICD-11: ${question.icdCode}</span>
            </div>
            ${question.explanation ? `<div class="explanation-box"><strong>Clinical Pearl:</strong> ${question.clinicalPearl || question.explanation}</div>` : ''}
        `;
        feedbackContainer.className = 'feedback incorrect';
    }
    
    feedbackContainer.style.display = 'block';
    updateScore();
    submitBtn.disabled = true;
    
    // Hide options after answering
    if (question.type === 'vignette' && question.options) {
        const optionBtns = optionsContainer.querySelectorAll('.option-btn');
        optionBtns.forEach(btn => btn.disabled = true);
    }
    
    // Record in history
    sessionHistory.push({
        questionId: question.id,
        question: question.question,
        userAnswer: userAnswer || textInput.value,
        correctAnswer: question.answer,
        isCorrect: isCorrect,
        timeSpent: timeSpent,
        hintsUsed: hintsUsed
    });
    
    setTimeout(nextQuestion, 4000);
}

// Next question
function nextQuestion() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex >= questions.length) {
        endGame();
    } else {
        showQuestion();
    }
}

// Update score display
function updateScore() {
    scoreDisplay.textContent = score;
    streakDisplay.textContent = streak;
}

// End game
function endGame() {
    gameScreen.style.display = 'none';
    endScreen.style.display = 'block';
    
    const totalQuestions = questions.length;
    const accuracy = ((correctAnswers / totalQuestions) * 100).toFixed(1);
    
    // Save to localStorage
    saveProgress(accuracy);
    
    // Generate motivational message
    let message = '';
    if (accuracy >= 80) {
        message = '🏆 Outstanding! You\'re ready for clinical rotations!';
    } else if (accuracy >= 50) {
        message = '👍 Good effort! Keep studying and you\'ll master this.';
    } else {
        message = '📚 Keep practicing! Review the DSM-5-TR and ICD-11 criteria.';
    }
    
    document.getElementById('final-score').textContent = `${score} points`;
    document.getElementById('final-accuracy').textContent = `${accuracy}% (${correctAnswers}/${totalQuestions})`;
    document.getElementById('final-streak').textContent = maxStreak;
    document.getElementById('motivational-msg').textContent = message;
    
    // Generate export data
    window.sessionExport = {
        date: new Date().toISOString(),
        score: score,
        accuracy: accuracy,
        totalQuestions: totalQuestions,
        correctAnswers: correctAnswers,
        maxStreak: maxStreak,
        hintsUsed: hintsUsed,
        history: sessionHistory
    };
}

// Save progress to localStorage
function saveProgress(accuracy) {
    const saved = JSON.parse(localStorage.getItem('mindgrace_progress') || '{}');
    
    saved.totalSessions = (saved.totalSessions || 0) + 1;
    saved.totalQuestions = (saved.totalQuestions || 0) + questions.length;
    saved.totalCorrect = (saved.totalCorrect || 0) + correctAnswers;
    
    if (!saved.highScore || score > saved.highScore) {
        saved.highScore = score;
    }
    
    if (!saved.bestStreak || maxStreak > saved.bestStreak) {
        saved.bestStreak = maxStreak;
    }
    
    if (!saved.bestAccuracy || parseFloat(accuracy) > parseFloat(saved.bestAccuracy || 0)) {
        saved.bestAccuracy = accuracy;
    }
    
    localStorage.setItem('mindgrace_progress', JSON.stringify(saved));
    updatePersistentStats();
}

// Update persistent stats display
function updatePersistentStats() {
    const saved = JSON.parse(localStorage.getItem('mindgrace_progress') || '{}');
    
    if (saved.highScore !== undefined) {
        document.getElementById('stat-highscore').textContent = saved.highScore;
    }
    if (saved.totalQuestions !== undefined) {
        document.getElementById('stat-total').textContent = saved.totalQuestions;
    }
    if (saved.bestStreak !== undefined) {
        document.getElementById('stat-streak').textContent = saved.bestStreak;
    }
    if (saved.bestAccuracy !== undefined) {
        document.getElementById('stat-accuracy').textContent = `${saved.bestAccuracy}%`;
    }
}

// Export session report
function exportReport() {
    if (!window.sessionExport) return;
    
    const report = `MindGrace Trivia Session Report
Generated: ${new Date(window.sessionExport.date).toLocaleString()}

=== SUMMARY ===
Score: ${window.sessionExport.score} points
Accuracy: ${window.sessionReport.accuracy}% (${window.sessionExport.correctAnswers}/${window.sessionExport.totalQuestions})
Max Streak: ${window.sessionExport.maxStreak}
Hints Used: ${window.sessionExport.hintsUsed}

=== QUESTION LOG ===
${window.sessionExport.history.map((item, idx) => `
Q${idx + 1}: ${item.question.substring(0, 60)}...
Your Answer: ${item.userAnswer}
Correct: ${item.correctAnswer}
Result: ${item.isCorrect ? '✓' : '✗'}
Time: ${item.timeSpent}s
`).join('\n')}

---
Created by Shirish | Mind Grace Neuropsychiatric Team
`;
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindgrace-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// Event Listeners
submitBtn.addEventListener('click', () => {
    if (textInput.value.trim()) {
        checkAnswer();
    }
});

hintBtn.addEventListener('click', useHint);

textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && textInput.value.trim()) {
        checkAnswer();
    }
});

// Filter change handlers
categoryFilter.addEventListener('change', () => {
    // Reset game when filters change
    if (gameScreen.style.display === 'block') {
        alert('Filters changed. Start a new game to apply changes.');
    }
});

difficultyFilter.addEventListener('change', () => {
    if (gameScreen.style.display === 'block') {
        alert('Filters changed. Start a new game to apply changes.');
    }
});

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    loadQuestions();
    updatePersistentStats();
});
