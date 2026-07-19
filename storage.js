/* =====================================================
   storage.js — LocalStorage abstraction layer
   ===================================================== */

const DB_KEYS = {
  SETUP_DONE:   'qp_setup_done',
  ADMIN_HASH:   'qp_admin_hash',
  QUIZZES:      'qp_quizzes',
  SUBMISSIONS:  'qp_submissions',
  PARTICIPANTS: 'qp_participants',
  PART_SESSION: 'qp_participant_session',
};

// --- Simple hash (NOT crypto-secure, OK for local training use) ---
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36) + '_' + str.length;
}

// --- Generic storage helpers ---
const Store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(key);
  },

  // ─── Setup / Admin Auth ───────────────────────────────────
  isSetupDone() { return !!localStorage.getItem(DB_KEYS.SETUP_DONE); },
  setAdminPassword(password) {
    localStorage.setItem(DB_KEYS.ADMIN_HASH, simpleHash(password));
    localStorage.setItem(DB_KEYS.SETUP_DONE, '1');
  },
  verifyAdminPassword(password) {
    const stored = localStorage.getItem(DB_KEYS.ADMIN_HASH);
    return stored === simpleHash(password);
  },

  // ─── Quiz CRUD ────────────────────────────────────────────
  getQuizzes() { return this.get(DB_KEYS.QUIZZES, []); },
  saveQuizzes(quizzes) { this.set(DB_KEYS.QUIZZES, quizzes); },
  getQuiz(id) { return this.getQuizzes().find(q => q.id === id) || null; },
  createQuiz(data) {
    const quizzes = this.getQuizzes();
    const quiz = {
      id: 'q_' + Date.now(),
      createdAt: new Date().toISOString(),
      active: false,
      questions: [],
      allowRetake: false,
      showResultToParticipant: false,
      ...data
    };
    quizzes.push(quiz);
    this.saveQuizzes(quizzes);
    return quiz;
  },
  updateQuiz(id, data) {
    const quizzes = this.getQuizzes();
    const idx = quizzes.findIndex(q => q.id === id);
    if (idx === -1) return null;
    quizzes[idx] = { ...quizzes[idx], ...data, id };
    this.saveQuizzes(quizzes);
    return quizzes[idx];
  },
  deleteQuiz(id) {
    const quizzes = this.getQuizzes().filter(q => q.id !== id);
    this.saveQuizzes(quizzes);
    const subs = this.getSubmissions().filter(s => s.quizId !== id);
    this.set(DB_KEYS.SUBMISSIONS, subs);
  },
  toggleQuizActive(id) {
    const quiz = this.getQuiz(id);
    if (!quiz) return;
    this.updateQuiz(id, { active: !quiz.active });
  },

  // ─── Submissions ──────────────────────────────────────────
  getSubmissions() { return this.get(DB_KEYS.SUBMISSIONS, []); },
  getSubmissionsByQuiz(quizId) { return this.getSubmissions().filter(s => s.quizId === quizId); },
  getSubmissionsByParticipant(email) { return this.getSubmissions().filter(s => s.participantEmail === email); },
  addSubmission(data) {
    const subs = this.getSubmissions();
    const sub = {
      id: 's_' + Date.now(),
      submittedAt: new Date().toISOString(),
      ...data
    };
    subs.push(sub);
    this.set(DB_KEYS.SUBMISSIONS, subs);
    return sub;
  },
  deleteSubmission(id) {
    const subs = this.getSubmissions().filter(s => s.id !== id);
    this.set(DB_KEYS.SUBMISSIONS, subs);
  },
  hasParticipantSubmitted(quizId, email) {
    return this.getSubmissions().some(s => s.quizId === quizId && s.participantEmail === email);
  },

  // ─── Participant Accounts (admin-managed) ─────────────────
  getParticipants() { return this.get(DB_KEYS.PARTICIPANTS, []); },
  saveParticipants(list) { this.set(DB_KEYS.PARTICIPANTS, list); },
  getParticipantByEmail(email) {
    return this.getParticipants().find(p => p.email.toLowerCase() === email.toLowerCase()) || null;
  },
  createParticipant(data) {
    const list = this.getParticipants();
    if (list.find(p => p.email.toLowerCase() === data.email.toLowerCase())) {
      return { error: 'Email sudah terdaftar' };
    }
    const participant = {
      id: 'p_' + Date.now(),
      createdAt: new Date().toISOString(),
      active: true,
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: simpleHash(data.password),
      divisi: data.divisi || '',
      nip: data.nip || '',
    };
    list.push(participant);
    this.saveParticipants(list);
    return participant;
  },
  updateParticipant(id, data) {
    const list = this.getParticipants();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return null;
    if (data.password) {
      data.passwordHash = simpleHash(data.password);
      delete data.password;
    }
    list[idx] = { ...list[idx], ...data, id };
    this.saveParticipants(list);
    return list[idx];
  },
  deleteParticipant(id) {
    const list = this.getParticipants().filter(p => p.id !== id);
    this.saveParticipants(list);
  },
  verifyParticipant(email, password) {
    const p = this.getParticipantByEmail(email);
    if (!p || !p.active) return null;
    if (p.passwordHash !== simpleHash(password)) return null;
    return p;
  },

  // ─── Participant Session ──────────────────────────────────
  getParticipantSession() {
    try { return JSON.parse(sessionStorage.getItem(DB_KEYS.PART_SESSION)); }
    catch { return null; }
  },
  setParticipantSession(participant) {
    sessionStorage.setItem(DB_KEYS.PART_SESSION, JSON.stringify(participant));
  },
  clearParticipantSession() {
    sessionStorage.removeItem(DB_KEYS.PART_SESSION);
  },
};
