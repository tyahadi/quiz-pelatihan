/* =====================================================
   quiz-engine.js — Scoring, Timer, and Session logic
   ===================================================== */

const QuizEngine = (() => {
  // Active session state
  let session = null;
  let timerInterval = null;
  let onTickCallback = null;
  let onTimeUpCallback = null;

  function startSession(quiz, participant) {
    session = {
      quiz,
      participant,
      answers: {}, // { questionId: answerValue }
      currentIndex: 0,
      startedAt: Date.now(),
      timeLeft: quiz.timeLimitMinutes ? quiz.timeLimitMinutes * 60 : null,
    };

    if (session.timeLeft !== null) {
      startTimer();
    }
    return session;
  }

  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (!session) return;
      session.timeLeft--;
      if (onTickCallback) onTickCallback(session.timeLeft);
      if (session.timeLeft <= 0) {
        clearInterval(timerInterval);
        if (onTimeUpCallback) onTimeUpCallback();
      }
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
  }

  function setAnswer(questionId, value) {
    if (!session) return;
    session.answers[questionId] = value;
  }

  function getAnswer(questionId) {
    return session ? (session.answers[questionId] ?? null) : null;
  }

  function goToQuestion(index) {
    if (!session) return;
    const maxIdx = session.quiz.questions.length - 1;
    session.currentIndex = Math.max(0, Math.min(maxIdx, index));
  }

  function getCurrentQuestion() {
    if (!session) return null;
    return session.quiz.questions[session.currentIndex];
  }

  function getProgress() {
    if (!session) return { answered: 0, total: 0, percent: 0 };
    const answered = Object.keys(session.answers).length;
    const total = session.quiz.questions.length;
    return { answered, total, percent: total ? Math.round((answered / total) * 100) : 0 };
  }

  function isAnswered(questionId) {
    if (!session) return false;
    const ans = session.answers[questionId];
    return ans !== null && ans !== undefined && String(ans).trim() !== '';
  }

  /**
   * Compute score for a submission's answers against a quiz's answer key.
   * Returns { total, earned, percentage, breakdown[] }
   */
  function computeScore(quiz, answers) {
    let total = 0;
    let earned = 0;
    const breakdown = quiz.questions.map(q => {
      const points = Number(q.points) || 1;
      total += points;
      const userAnswer = answers[q.id];
      let correct = false;

      if (q.type === 'multiple_choice') {
        correct = String(userAnswer).trim() === String(q.correctAnswer).trim();
      } else if (q.type === 'true_false') {
        correct = String(userAnswer) === String(q.correctAnswer);
      } else if (q.type === 'short_answer') {
        // case-insensitive, trimmed match
        const ua = String(userAnswer || '').trim().toLowerCase();
        const ca = String(q.correctAnswer || '').trim().toLowerCase();
        correct = ua === ca && ua !== '';
      } else {
        // Essay: not auto-graded, flagged for manual review
        correct = null;
      }

      if (correct === true) earned += points;

      return {
        questionId: q.id,
        questionText: q.text,
        type: q.type,
        userAnswer,
        correctAnswer: q.correctAnswer,
        correct,
        points,
        earned: correct === true ? points : 0,
      };
    });

    const percentage = total > 0 ? Math.round((earned / total) * 100) : 0;
    return { total, earned, percentage, breakdown };
  }

  function submitSession() {
    if (!session) return null;
    stopTimer();

    const quiz = session.quiz;
    const score = computeScore(quiz, session.answers);
    const durationSeconds = Math.round((Date.now() - session.startedAt) / 1000);

    const submission = Store.addSubmission({
      quizId: quiz.id,
      quizTitle: quiz.title,
      participantName: session.participant.name,
      participantEmail: session.participant.email,
      answers: session.answers,
      score: score.earned,
      totalPoints: score.total,
      percentage: score.percentage,
      breakdown: score.breakdown,
      durationSeconds,
      hasEssay: quiz.questions.some(q => q.type === 'essay'),
    });

    session = null;
    return submission;
  }

  function formatTime(seconds) {
    if (seconds === null || seconds === undefined) return '--:--';
    const m = Math.floor(Math.abs(seconds) / 60);
    const s = Math.abs(seconds) % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function getSession() { return session; }
  function clearSession() { stopTimer(); session = null; }

  return {
    startSession, submitSession, clearSession, getSession,
    setAnswer, getAnswer, isAnswered,
    goToQuestion, getCurrentQuestion, getProgress,
    computeScore, formatTime, stopTimer,
    onTick(cb) { onTickCallback = cb; },
    onTimeUp(cb) { onTimeUpCallback = cb; },
  };
})();
