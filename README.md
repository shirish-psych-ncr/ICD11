# MindGrace Trivia - DSM-5-TR & ICD-11 Diagnostic Challenge

## A Mental Health Classification Learning Game

**Created by Shirish from the Mind Grace Neuropsychiatric Team**

### Overview

This is an interactive educational trivia game designed to help mental health professionals, students, and enthusiasts test and improve their knowledge of psychiatric diagnoses using both DSM-5-TR and ICD-11 classification systems.

### Features

- **20+ Clinical Questions**: Covering major diagnostic categories including:
  - Depressive Disorders
  - Anxiety Disorders
  - Personality Disorders
  - Trauma-Related Disorders
  - Bipolar Disorders
  - Neurodevelopmental Disorders
  - And more...

- **Dual Classification System**: Each question displays both:
  - DSM-5-TR codes
  - ICD-11 codes

- **Category Filtering**: Focus on specific diagnostic categories or play with all questions

- **Instant Feedback**: Learn from each question with detailed explanations

- **Score Tracking**: Monitor your progress with real-time statistics

- **No Paywalls**: Completely free and open for educational use

- **Responsive Design**: Works on desktop, tablet, and mobile devices

### Technology Stack

- Pure HTML5, CSS3, and Vanilla JavaScript
- No external dependencies or frameworks
- JSON-based question database
- Client-side only (no server required)

### File Structure

```
/workspace
├── index.html              # Main game page
├── data/
│   └── trivia_questions.json  # Question database
├── public/
│   ├── css/
│   │   └── styles.css      # Game styles
│   └── js/
│       └── game.js         # Game logic
└── README.md               # This file
```

### How to Use

1. **Open the Game**: Simply open `index.html` in any modern web browser
2. **Start Playing**: Click "Start Game" to begin
3. **Answer Questions**: Select the correct answer from multiple choices
4. **Learn**: Review feedback and diagnostic codes after each question
5. **Filter by Category**: Optionally filter questions by diagnostic category

### Adding More Questions

To add more questions, edit `data/trivia_questions.json`. Each question should follow this format:

```json
{
  "id": 21,
  "question": "Your question here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": 0,
  "category": "Category Name",
  "dsm5tr_code": "XXX.XX (FXX.X)",
  "icd11_code": "XXXX"
}
```

### Disclaimer

This trivia game is for **educational purposes only**. It is not a clinical or diagnostic tool. Always refer to official DSM-5-TR and ICD-11 documentation for clinical decision-making.

### Credits

- **Developer**: Shirish
- **Team**: Mind Grace Neuropsychiatric Team
- **Purpose**: Educational resource for mental health professionals and students

### License

This project is provided as-is for educational use.

---

*Last Updated: January 2026* 
