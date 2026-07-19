/* =====================================================
   app.js — Main SPA Router & UI Controller
   ===================================================== */

// ─── Toast helper (global) ──────────────────────────────────────
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hiding');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3500);
}

// ─── Loading helper ────────────────────────────────────────────
function showLoading() { document.getElementById('loading-overlay')?.classList.remove('hidden'); }
function hideLoading() { document.getElementById('loading-overlay')?.classList.add('hidden'); }

// ─── Main App Controller ───────────────────────────────────────
const App = (() => {
  let currentPage = '';
  let adminAuthed = false;
  const SESSION_KEY = 'qp_admin_session';

  function isAdminAuthed() {
    return adminAuthed || sessionStorage.getItem(SESSION_KEY) === '1';
  }

  function setAdminAuthed(val) {
    adminAuthed = val;
    if (val) sessionStorage.setItem(SESSION_KEY, '1');
    else sessionStorage.removeItem(SESSION_KEY);
  }

  function navigate(page, param) {
    currentPage = page;

    // Setup check
    if (!Store.isSetupDone() && page !== 'setup') {
      render('setup');
      return;
    }

    // Admin auth guard
    const adminPages = ['admin-dashboard','admin-quizzes','admin-quiz-edit','admin-results','admin-participants','admin-settings'];
    if (adminPages.includes(page) && !isAdminAuthed()) {
      render('admin-login');
      return;
    }

    render(page, param);
  }

  function render(page, param) {
    const app = document.getElementById('app');
    if (!app) return;

    switch (page) {
      case 'setup':           app.innerHTML = renderSetupPage(); break;
      case 'home':            app.innerHTML = renderHomePage(); break;
      case 'admin-login':     app.innerHTML = renderAdminLoginPage(); break;
      case 'admin-dashboard': app.innerHTML = renderAdminLayout('dashboard', Admin.renderDashboard()); break;
      case 'admin-quizzes':   app.innerHTML = renderAdminLayout('quizzes', Admin.renderQuizList()); break;
      case 'admin-quiz-edit': app.innerHTML = renderAdminLayout('quizzes', Admin.renderQuizEditor(param)); break;
      case 'admin-results':   app.innerHTML = renderAdminLayout('results', Admin.renderResults()); break;
      case 'admin-participants': app.innerHTML = renderAdminLayout('participants', Admin.renderParticipants()); break;
      case 'admin-settings':  app.innerHTML = renderAdminLayout('settings', renderSettingsPage()); break;
      case 'participant-register': app.innerHTML = renderParticipantRegisterPage(param); break;
      case 'quiz-take':       app.innerHTML = renderQuizTakePage(param); break;
      case 'quiz-submitted':  app.innerHTML = renderSubmittedPage(param); break;
      default:                app.innerHTML = renderHomePage();
    }
  }

  // ─── SETUP PAGE ──────────────────────────────────────────────
  function renderSetupPage() {
    return `
    <div class="setup-page">
      <div class="setup-card">
        <span class="setup-icon">🔐</span>
        <h2>Selamat Datang di QuizPro</h2>
        <p>Atur password admin untuk mulai menggunakan aplikasi ini. Password ini akan digunakan untuk masuk ke panel admin.</p>

        <div class="form-group text-left">
          <label class="form-label">Password Admin <span class="required">*</span></label>
          <div class="input-password-wrapper">
            <input id="setup-password" class="form-input" type="password" placeholder="Buat password admin" autocomplete="new-password" oninput="checkSetupPasswordStrength(this.value)" />
            <button class="toggle-password" type="button" onclick="togglePasswordVisibility('setup-password', this)">👁️</button>
          </div>
          <div class="password-strength mt-8" id="strength-indicator">
            <div class="strength-bar"><div class="strength-fill" id="strength-fill"></div></div>
            <div class="strength-text text-muted" id="strength-text">Masukkan password</div>
          </div>
        </div>

        <div class="form-group text-left">
          <label class="form-label">Konfirmasi Password <span class="required">*</span></label>
          <div class="input-password-wrapper">
            <input id="setup-password-confirm" class="form-input" type="password" placeholder="Ulangi password" autocomplete="new-password" />
            <button class="toggle-password" type="button" onclick="togglePasswordVisibility('setup-password-confirm', this)">👁️</button>
          </div>
        </div>

        <button class="btn btn-primary btn-full btn-lg mt-8" id="setup-btn" onclick="handleSetup()">
          🚀 Mulai Gunakan QuizPro
        </button>
      </div>
    </div>`;
  }

  function checkSetupPasswordStrength(val) {
    const fill = document.getElementById('strength-fill');
    const text = document.getElementById('strength-text');
    const indicator = document.getElementById('strength-indicator');
    if (!fill) return;
    const len = val.length;
    const hasNum = /\d/.test(val);
    const hasUpper = /[A-Z]/.test(val);
    const hasSpecial = /[!@#$%^&*]/.test(val);
    let strength = 0;
    if (len >= 6) strength++;
    if (len >= 10 && (hasNum || hasUpper)) strength++;
    if (len >= 8 && hasNum && hasUpper && hasSpecial) strength = 3;

    indicator.className = 'password-strength mt-8 ' + (['', 'strength-weak', 'strength-medium', 'strength-strong'][strength] || '');
    text.textContent = ['Masukkan password', 'Lemah', 'Cukup', 'Kuat'][strength];
    text.style.color = ['var(--text-muted)', 'var(--danger)', 'var(--warning)', 'var(--success)'][strength];
  }

  window.checkSetupPasswordStrength = checkSetupPasswordStrength;

  function handleSetup() {
    const pw = document.getElementById('setup-password')?.value;
    const pw2 = document.getElementById('setup-password-confirm')?.value;
    if (!pw || pw.length < 6) { showToast('Password minimal 6 karakter', 'error'); return; }
    if (pw !== pw2) { showToast('Password tidak cocok', 'error'); return; }
    Store.setAdminPassword(pw);
    setAdminAuthed(true);
    showToast('Password berhasil dibuat! 🎉', 'success');
    navigate('admin-dashboard');
  }
  window.handleSetup = handleSetup;

  // ─── HOME PAGE ────────────────────────────────────────────────
  function renderHomePage() {
    const quizzes = Store.getQuizzes().filter(q => q.active);
    return `
    <div class="landing-page">
      <nav class="navbar">
        <div class="navbar-inner">
          <div class="navbar-brand">
            <div class="brand-icon">📝</div>
            QuizPro
          </div>
          <div class="navbar-actions">
            <button class="btn btn-ghost btn-sm" onclick="App.navigate('admin-login')">🔐 Admin</button>
          </div>
        </div>
      </nav>

      <div class="hero">
        <div class="container">
          <span class="hero-eyebrow">⚡ Platform Quiz Pelatihan</span>
          <h1 class="hero-title">Quiz Pelatihan<br/>Modern & Mudah</h1>
          <p class="hero-subtitle">Platform quiz interaktif untuk pelatihan dan sertifikasi. Buat, kelola, dan nilai quiz peserta dengan mudah.</p>
          <div class="hero-stats">
            <div class="stat-item">
              <div class="stat-value">${Store.getQuizzes().length}</div>
              <div class="stat-label">Total Quiz</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${Store.getSubmissions().length}</div>
              <div class="stat-label">Pengerjaan</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${Store.getParticipants().length}</div>
              <div class="stat-label">Peserta</div>
            </div>
          </div>
        </div>
      </div>

      <div class="quiz-list-section">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">📋 Quiz Tersedia</h2>
          </div>
          ${quizzes.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <h3>Belum ada quiz aktif</h3>
            <p>Admin belum mengaktifkan quiz. Silakan hubungi trainer Anda.</p>
          </div>` : `
          <div class="quiz-grid">
            ${quizzes.map(q => `
            <div class="quiz-card" onclick="App.navigate('participant-register', '${q.id}')">
              <div class="quiz-card-icon">📝</div>
              <div class="quiz-card-title">${escHtml(q.title)}</div>
              <div class="quiz-card-desc">${escHtml(q.description || 'Klik untuk mulai mengerjakan quiz ini.')}</div>
              <div class="quiz-card-meta">
                <span>❓ ${q.questions.length} soal</span>
                <span>⏱️ ${q.timeLimitMinutes ? q.timeLimitMinutes + ' menit' : 'Tidak terbatas'}</span>
              </div>
              <div class="quiz-card-footer">
                <span class="badge badge-success">● Tersedia</span>
                <button class="btn btn-primary btn-sm">Kerjakan →</button>
              </div>
            </div>`).join('')}
          </div>`}
        </div>
      </div>
    </div>`;
  }

  // ─── ADMIN LOGIN PAGE ─────────────────────────────────────────
  function renderAdminLoginPage() {
    return `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-card-header">
          <div class="auth-logo">🔐</div>
          <h2>Panel Admin</h2>
          <p>Masukkan password untuk mengakses panel admin</p>
        </div>
        <div class="form-group">
          <label class="form-label">Password Admin</label>
          <div class="input-password-wrapper">
            <input id="admin-password" class="form-input" type="password" placeholder="Masukkan password"
              onkeydown="if(event.key==='Enter') handleAdminLogin()" autocomplete="current-password" />
            <button class="toggle-password" type="button" onclick="togglePasswordVisibility('admin-password', this)">👁️</button>
          </div>
        </div>
        <button class="btn btn-primary btn-full" onclick="handleAdminLogin()">Masuk ke Admin →</button>
        <div class="text-center mt-16">
          <button class="btn btn-ghost btn-sm" onclick="App.navigate('home')">← Kembali ke Beranda</button>
        </div>
      </div>
    </div>`;
  }

  function handleAdminLogin() {
    const pw = document.getElementById('admin-password')?.value;
    if (!pw) { showToast('Masukkan password', 'warning'); return; }
    if (Store.verifyAdminPassword(pw)) {
      setAdminAuthed(true);
      showToast('Selamat datang, Admin! 🎉', 'success');
      navigate('admin-dashboard');
    } else {
      showToast('Password salah', 'error');
      document.getElementById('admin-password').value = '';
    }
  }
  window.handleAdminLogin = handleAdminLogin;

  // ─── ADMIN LAYOUT ─────────────────────────────────────────────
  function renderAdminLayout(activePage, content) {
    const navItems = [
      { id: 'dashboard', icon: '🏠', label: 'Dashboard', page: 'admin-dashboard' },
      { id: 'quizzes',   icon: '📋', label: 'Kelola Quiz', page: 'admin-quizzes' },
      { id: 'results',   icon: '📊', label: 'Hasil Quiz', page: 'admin-results' },
      { id: 'participants', icon: '👥', label: 'Peserta', page: 'admin-participants' },
      { id: 'settings',  icon: '⚙️', label: 'Pengaturan', page: 'admin-settings' },
    ];
    return `
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon">📝</div>
          QuizPro Admin
        </div>
        <nav class="sidebar-nav">
          ${navItems.map(item => `
          <div class="sidebar-nav-item ${activePage === item.id ? 'active' : ''}" onclick="App.navigate('${item.page}')">
            <span class="nav-icon">${item.icon}</span>
            ${item.label}
          </div>`).join('')}
        </nav>
        <div class="sidebar-footer">
          <button class="btn btn-ghost btn-sm btn-full" onclick="App.navigate('home')">🏠 Beranda</button>
          <button class="btn btn-danger btn-sm btn-full mt-8" onclick="App.adminLogout()">Keluar</button>
        </div>
      </aside>
      <main class="admin-main">
        ${content}
      </main>
    </div>`;
  }

  function adminLogout() {
    setAdminAuthed(false);
    showToast('Berhasil keluar', 'success');
    navigate('home');
  }

  // ─── SETTINGS PAGE ────────────────────────────────────────────
  function renderSettingsPage() {
    return `
    <div class="admin-header">
      <div class="admin-header-text"><h2>Pengaturan</h2><p>Konfigurasi aplikasi</p></div>
    </div>
    <div style="max-width:480px">
      <div class="section-card">
        <div class="section-card-header"><h4>🔐 Ubah Password Admin</h4></div>
        <div class="section-card-body">
          <div class="form-group">
            <label class="form-label">Password Baru <span class="required">*</span></label>
            <div class="input-password-wrapper">
              <input id="new-password" class="form-input" type="password" placeholder="Masukkan password baru" />
              <button class="toggle-password" type="button" onclick="togglePasswordVisibility('new-password', this)">👁️</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Konfirmasi Password Baru <span class="required">*</span></label>
            <div class="input-password-wrapper">
              <input id="new-password-confirm" class="form-input" type="password" placeholder="Ulangi password baru" />
              <button class="toggle-password" type="button" onclick="togglePasswordVisibility('new-password-confirm', this)">👁️</button>
            </div>
          </div>
          <button class="btn btn-primary" onclick="handleChangePassword()">💾 Simpan Password Baru</button>
        </div>
      </div>

      <div class="section-card mt-16">
        <div class="section-card-header"><h4>⚠️ Reset Data</h4></div>
        <div class="section-card-body">
          <p class="text-muted text-sm mb-16">Hapus semua data hasil quiz (quiz & soal tetap tersimpan).</p>
          <button class="btn btn-danger btn-sm" onclick="App.confirmClearSubmissions()">🗑️ Hapus Semua Hasil</button>
        </div>
      </div>
    </div>`;
  }

  function handleChangePassword() {
    const pw = document.getElementById('new-password')?.value;
    const pw2 = document.getElementById('new-password-confirm')?.value;
    if (!pw || pw.length < 6) { showToast('Password minimal 6 karakter', 'error'); return; }
    if (pw !== pw2) { showToast('Password tidak cocok', 'error'); return; }
    Store.setAdminPassword(pw);
    showToast('Password berhasil diubah! ✅', 'success');
    document.getElementById('new-password').value = '';
    document.getElementById('new-password-confirm').value = '';
  }
  window.handleChangePassword = handleChangePassword;

  function confirmClearSubmissions() {
    showModal(`
      <div class="modal-header"><h3>⚠️ Hapus Semua Hasil</h3><span class="modal-close" onclick="App.closeModal()">✕</span></div>
      <div class="modal-body"><p>Apakah Anda yakin ingin menghapus <strong>semua data hasil quiz</strong>? Tindakan ini tidak dapat dibatalkan.</p></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="App.closeModal()">Batal</button>
        <button class="btn btn-danger" onclick="App.clearSubmissions()">Hapus Semua</button>
      </div>`);
  }

  function clearSubmissions() {
    Store.set('qp_submissions', []);
    Store.set('qp_participants', []);
    closeModal();
    showToast('Semua data hasil telah dihapus', 'success');
  }

  // ─── PARTICIPANT REGISTER PAGE ────────────────────────────────
  function renderParticipantRegisterPage(quizId) {
    const quiz = Store.getQuiz(quizId);
    if (!quiz || !quiz.active) {
      return `<div class="result-page"><div class="result-card"><span class="result-icon">🚫</span><h2>Quiz Tidak Tersedia</h2><p>Quiz ini tidak aktif atau tidak ditemukan.</p><button class="btn btn-primary mt-16" onclick="App.navigate('home')">← Kembali</button></div></div>`;
    }
    return `
    <div class="register-page">
      <div class="register-card">
        <div class="text-center mb-24">
          <div class="auth-logo" style="background:linear-gradient(135deg,var(--primary),var(--secondary));margin:0 auto 16px">📝</div>
          <h2>${escHtml(quiz.title)}</h2>
          ${quiz.description ? `<p class="text-secondary text-sm mt-8">${escHtml(quiz.description)}</p>` : ''}
          <div class="d-flex gap-16 justify-center mt-12 flex-wrap">
            <span class="badge badge-primary">❓ ${quiz.questions.length} soal</span>
            ${quiz.timeLimitMinutes ? `<span class="badge badge-warning">⏱️ ${quiz.timeLimitMinutes} menit</span>` : '<span class="badge badge-secondary">⏱️ Tidak terbatas</span>'}
          </div>
        </div>

        <div class="divider"></div>

        <h4 class="mb-16">Login Peserta</h4>
        <div class="form-group">
          <label class="form-label">Username / Email <span class="required">*</span></label>
          <input id="p-email" class="form-input" type="text" placeholder="Masukkan username/email" autocomplete="email" />
        </div>
        <div class="form-group">
          <label class="form-label">Access Key / Password <span class="required">*</span></label>
          <div class="input-password-wrapper">
            <input id="p-password" class="form-input" type="password" placeholder="Masukkan access key" autocomplete="current-password" onkeydown="if(event.key==='Enter') handleStartQuiz('${quizId}')" />
            <button class="toggle-password" type="button" onclick="togglePasswordVisibility('p-password', this)">👁️</button>
          </div>
        </div>

        <div id="register-warning" class="hidden mt-12" style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:8px;padding:12px;font-size:0.85rem;color:#fbbf24"></div>

        <button class="btn btn-primary btn-full btn-lg mt-16" id="start-quiz-btn" onclick="handleStartQuiz('${quizId}')">
          Mulai Quiz →
        </button>
        <div class="text-center mt-12">
          <button class="btn btn-ghost btn-sm" onclick="App.navigate('home')">← Kembali ke Beranda</button>
        </div>
      </div>
    </div>`;
  }

  function handleStartQuiz(quizId) {
    const email = document.getElementById('p-email')?.value?.trim();
    const password = document.getElementById('p-password')?.value;
    const warning = document.getElementById('register-warning');

    if (!email) { showToast('Username/Email harus diisi', 'error'); return; }
    if (!password) { showToast('Access Key harus diisi', 'error'); return; }

    const participant = Store.verifyParticipant(email, password);
    if (!participant) {
      showToast('Username/Email atau Access Key salah', 'error');
      return;
    }

    const quiz = Store.getQuiz(quizId);
    if (!quiz) { showToast('Quiz tidak ditemukan', 'error'); return; }

    // Check if already submitted
    if (!quiz.allowRetake && Store.hasParticipantSubmitted(quizId, participant.email)) {
      warning.classList.remove('hidden');
      warning.innerHTML = '⚠️ Anda sudah pernah mengerjakan quiz ini.';
      return;
    }

    // Anti-cheat & Fullscreen
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => console.log('Error attempting to enable fullscreen:', err));
      }
    } catch(e) {}

    QuizEngine.startSession(quiz, participant);
    navigate('quiz-take', quizId);

    // Attach anti-cheat listeners
    window._antiCheatListener = function() {
      if (document.visibilityState === 'hidden') {
        showToast('⚠️ PERINGATAN: Anda terdeteksi keluar dari layar (Alt-Tab)!', 'error');
      }
    };
    
    window._fullscreenListener = function() {
      if (!document.fullscreenElement) {
        showToast('⚠️ PERINGATAN: Anda keluar dari layar penuh (Full Screen)!', 'error');
      }
    };

    document.addEventListener('visibilitychange', window._antiCheatListener);
    document.addEventListener('fullscreenchange', window._fullscreenListener);
  }
  window.handleStartQuiz = handleStartQuiz;

  // ─── QUIZ TAKE PAGE ───────────────────────────────────────────
  function renderQuizTakePage(quizId) {
    const session = QuizEngine.getSession();
    if (!session) {
      return `<div class="result-page"><div class="result-card"><span class="result-icon">⚠️</span><h2>Sesi Tidak Ditemukan</h2><button class="btn btn-primary mt-16" onclick="App.navigate('home')">← Beranda</button></div></div>`;
    }

    const quiz = session.quiz;
    const q = QuizEngine.getCurrentQuestion();
    const idx = session.currentIndex;
    const total = quiz.questions.length;

    // Setup timer callbacks
    QuizEngine.onTick((timeLeft) => {
      const timerEl = document.getElementById('quiz-timer');
      if (timerEl) {
        timerEl.textContent = '⏱️ ' + QuizEngine.formatTime(timeLeft);
        timerEl.className = 'quiz-timer' + (timeLeft <= 60 ? ' danger' : timeLeft <= 300 ? ' warning' : '');
      }
    });
    QuizEngine.onTimeUp(() => {
      showToast('Waktu habis! Quiz otomatis dikumpulkan.', 'warning');
      submitQuiz();
    });

    const progress = QuizEngine.getProgress();

    return `
    <div class="quiz-taker-layout">
      <header class="quiz-taker-header">
        <div>
          <div class="quiz-taker-title">${escHtml(quiz.title)}</div>
          <div class="text-xs text-muted">${escHtml(session.participant.name)}</div>
        </div>
        ${quiz.timeLimitMinutes ? `<div class="quiz-timer" id="quiz-timer">⏱️ ${QuizEngine.formatTime(session.timeLeft)}</div>` : ''}
        <div class="d-flex gap-8">
          <button class="btn btn-ghost" onclick="abortQuiz()">Keluar</button>
          <button class="btn btn-success" onclick="confirmSubmit()">📤 Kumpulkan</button>
        </div>
      </header>

      <div class="quiz-taker-body">
        <!-- Question Navigator -->
        <aside class="question-nav-sidebar">
          <div class="question-nav-title">Navigasi Soal</div>
          <div class="question-nav-grid" id="q-nav-grid">
            ${quiz.questions.map((q, i) => `
            <button class="q-nav-btn ${i === idx ? 'current' : ''} ${QuizEngine.isAnswered(q.id) ? 'answered' : ''}"
              onclick="navigateToQuestion(${i})">${i + 1}</button>`).join('')}
          </div>
          <div class="quiz-progress-bar-wrapper">
            <div class="quiz-progress-label">
              <span>Dijawab</span>
              <span id="progress-text">${progress.answered}/${progress.total}</span>
            </div>
            <div class="quiz-progress-track">
              <div class="quiz-progress-fill" id="progress-fill" style="width:${progress.percent}%"></div>
            </div>
          </div>
          <div class="mt-16 text-xs text-muted">
            <div class="d-flex gap-8 align-center mb-4"><span class="q-nav-btn answered" style="width:18px;height:18px;font-size:0.6rem;display:inline-flex"></span> Sudah dijawab</div>
            <div class="d-flex gap-8 align-center"><span class="q-nav-btn current" style="width:18px;height:18px;font-size:0.6rem;display:inline-flex"></span> Soal aktif</div>
          </div>
        </aside>

        <!-- Question Display -->
        <div class="quiz-question-area">
          <div id="question-display-area">
            ${renderQuestionDisplay(q, idx, total, session)}
          </div>
        </div>
      </div>
    </div>`;
  }

  function renderQuestionDisplay(q, idx, total, session) {
    if (!q) return '<p class="text-muted text-center">Tidak ada soal</p>';
    const optionLetters = ['A','B','C','D','E','F'];
    let answerHtml = '';

    if (q.type === 'multiple_choice') {
      const opts = q.options || [];
      const selected = QuizEngine.getAnswer(q.id);
      answerHtml = `<div class="answer-options">
        ${opts.map((opt, i) => `
        <div class="answer-option ${String(selected) === String(i) ? 'selected' : ''}" onclick="selectAnswer('${q.id}', ${i}, this)">
          <span class="option-letter">${optionLetters[i]}</span>
          <span class="option-text">${escHtml(opt)}</span>
        </div>`).join('')}
      </div>`;
    } else if (q.type === 'true_false') {
      const selected = QuizEngine.getAnswer(q.id);
      answerHtml = `<div class="answer-options">
        <div class="answer-option ${selected === 'true' ? 'selected' : ''}" onclick="selectTFAnswer('${q.id}', 'true', this)">
          <span class="option-letter">T</span>
          <span class="option-text">✓ BENAR</span>
        </div>
        <div class="answer-option ${selected === 'false' ? 'selected' : ''}" onclick="selectTFAnswer('${q.id}', 'false', this)">
          <span class="option-letter">F</span>
          <span class="option-text">✗ SALAH</span>
        </div>
      </div>`;
    } else if (q.type === 'short_answer') {
      const val = QuizEngine.getAnswer(q.id) || '';
      answerHtml = `<input class="short-answer-input" type="text" placeholder="Tulis jawaban Anda di sini..." value="${escHtml(val)}"
        oninput="QuizEngine.setAnswer('${q.id}', this.value); updateProgress()" />`;
    } else {
      const val = QuizEngine.getAnswer(q.id) || '';
      answerHtml = `<textarea class="essay-textarea" placeholder="Tulis jawaban essay Anda di sini..."
        oninput="QuizEngine.setAnswer('${q.id}', this.value); updateProgress()">${escHtml(val)}</textarea>`;
    }

    return `
    <div class="question-display-card">
      <div class="question-display-header">
        <div class="question-number-badge">Soal ${idx + 1} dari ${total}</div>
        <div class="question-text">${escHtml(q.text)}</div>
        <div class="question-points text-muted text-sm">Poin: ${q.points || 1}</div>
      </div>
      ${answerHtml}
      <div class="question-nav-controls">
        <button class="btn btn-secondary" onclick="goToPrev()" ${idx === 0 ? 'disabled' : ''}>← Sebelumnya</button>
        <span class="text-muted text-sm">${idx + 1} / ${total}</span>
        ${idx < total - 1
          ? `<button class="btn btn-primary" onclick="goToNext()">Berikutnya →</button>`
          : `<button class="btn btn-success" onclick="confirmSubmit()">📤 Kumpulkan</button>`}
      </div>
    </div>`;
  }

  // ─── SUBMITTED PAGE ───────────────────────────────────────────
  function renderSubmittedPage(submission) {
    return `
    <div class="result-page">
      <div class="result-card">
        <div class="checkmark-circle"><span class="checkmark">✓</span></div>
        <h2>Quiz Berhasil Dikumpulkan!</h2>
        <p>Terima kasih, <strong>${escHtml(submission.participantName)}</strong>.<br/>
        Jawaban Anda telah berhasil disimpan.</p>
        <div class="result-note">
          📋 <strong>Informasi Pengerjaan</strong><br/>
          Quiz: <strong>${escHtml(submission.quizTitle)}</strong><br/>
          Durasi: <strong>${formatDuration(submission.durationSeconds)}</strong><br/>
          Waktu submit: <strong>${formatDate(submission.submittedAt)}</strong>
          <div class="divider"></div>
          🔒 Nilai Anda akan diinformasikan oleh trainer setelah semua peserta selesai mengerjakan.
        </div>
        <button class="btn btn-primary btn-full mt-24" onclick="App.navigate('home')">🚪 Keluar ke Dashboard</button>
      </div>
    </div>`;
  }

  // ─── MODAL HELPERS ────────────────────────────────────────────
  function showModal(html) {
    const overlay = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container');
    if (!overlay || !container) return;
    container.innerHTML = html;
    overlay.classList.remove('hidden');
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
  }

  function closeModal() {
    document.getElementById('modal-overlay')?.classList.add('hidden');
  }

  return {
    navigate, render, adminLogout, isAdminAuthed,
    showModal, closeModal, confirmClearSubmissions, clearSubmissions,
  };
})();

// ─── Quiz Take Interactivity ───────────────────────────────────

function selectAnswer(qid, idx, el) {
  QuizEngine.setAnswer(qid, idx);
  el.closest('.answer-options').querySelectorAll('.answer-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  updateProgress();
}
window.selectAnswer = selectAnswer;

function selectTFAnswer(qid, val, el) {
  QuizEngine.setAnswer(qid, val);
  el.closest('.answer-options').querySelectorAll('.answer-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  updateProgress();
}
window.selectTFAnswer = selectTFAnswer;

function goToNext() {
  const session = QuizEngine.getSession();
  if (!session) return;
  QuizEngine.goToQuestion(session.currentIndex + 1);
  refreshQuestionArea();
}
window.goToNext = goToNext;

function goToPrev() {
  const session = QuizEngine.getSession();
  if (!session) return;
  QuizEngine.goToQuestion(session.currentIndex - 1);
  refreshQuestionArea();
}
window.goToPrev = goToPrev;

function navigateToQuestion(idx) {
  QuizEngine.goToQuestion(idx);
  refreshQuestionArea();
}
window.navigateToQuestion = navigateToQuestion;

function refreshQuestionArea() {
  const session = QuizEngine.getSession();
  if (!session) return;
  const q = QuizEngine.getCurrentQuestion();
  const area = document.getElementById('question-display-area');
  if (area) area.innerHTML = App_renderQuestionDisplay(q, session.currentIndex, session.quiz.questions.length, session);

  // Update nav grid
  const navGrid = document.getElementById('q-nav-grid');
  if (navGrid) {
    navGrid.querySelectorAll('.q-nav-btn').forEach((btn, i) => {
      const qid = session.quiz.questions[i]?.id;
      btn.className = 'q-nav-btn' +
        (i === session.currentIndex ? ' current' : '') +
        (QuizEngine.isAnswered(qid) ? ' answered' : '');
    });
  }
  updateProgress();
}

// Expose internal render function for refresh
function App_renderQuestionDisplay(q, idx, total, session) {
  const optionLetters = ['A','B','C','D','E','F'];
  if (!q) return '';
  let answerHtml = '';

  if (q.type === 'multiple_choice') {
    const opts = q.options || [];
    const selected = QuizEngine.getAnswer(q.id);
    answerHtml = `<div class="answer-options">
      ${opts.map((opt, i) => `
      <div class="answer-option ${String(selected) === String(i) ? 'selected' : ''}" onclick="selectAnswer('${q.id}', ${i}, this)">
        <span class="option-letter">${optionLetters[i]}</span>
        <span class="option-text">${escHtml(opt)}</span>
      </div>`).join('')}
    </div>`;
  } else if (q.type === 'true_false') {
    const sel = QuizEngine.getAnswer(q.id);
    answerHtml = `<div class="answer-options">
      <div class="answer-option ${sel === 'true' ? 'selected' : ''}" onclick="selectTFAnswer('${q.id}', 'true', this)">
        <span class="option-letter">T</span><span class="option-text">✓ BENAR</span>
      </div>
      <div class="answer-option ${sel === 'false' ? 'selected' : ''}" onclick="selectTFAnswer('${q.id}', 'false', this)">
        <span class="option-letter">F</span><span class="option-text">✗ SALAH</span>
      </div>
    </div>`;
  } else if (q.type === 'short_answer') {
    const val = QuizEngine.getAnswer(q.id) || '';
    answerHtml = `<input class="short-answer-input" type="text" placeholder="Tulis jawaban Anda di sini..." value="${escHtml(val)}"
      oninput="QuizEngine.setAnswer('${q.id}', this.value); updateProgress()" />`;
  } else {
    const val = QuizEngine.getAnswer(q.id) || '';
    answerHtml = `<textarea class="essay-textarea" placeholder="Tulis jawaban essay Anda di sini..."
      oninput="QuizEngine.setAnswer('${q.id}', this.value); updateProgress()">${escHtml(val)}</textarea>`;
  }

  return `
  <div class="question-display-card">
    <div class="question-display-header">
      <div class="question-number-badge">Soal ${idx + 1} dari ${total}</div>
      <div class="question-text">${escHtml(q.text)}</div>
      <div class="question-points text-muted text-sm">Poin: ${q.points || 1}</div>
    </div>
    ${answerHtml}
    <div class="question-nav-controls">
      <button class="btn btn-secondary" onclick="goToPrev()" ${idx === 0 ? 'disabled' : ''}>← Sebelumnya</button>
      <span class="text-muted text-sm">${idx + 1} / ${total}</span>
      ${idx < total - 1
        ? `<button class="btn btn-primary" onclick="goToNext()">Berikutnya →</button>`
        : `<button class="btn btn-success" onclick="confirmSubmit()">📤 Kumpulkan</button>`}
    </div>
  </div>`;
}

function updateProgress() {
  const p = QuizEngine.getProgress();
  const text = document.getElementById('progress-text');
  const fill = document.getElementById('progress-fill');
  if (text) text.textContent = `${p.answered}/${p.total}`;
  if (fill) fill.style.width = p.percent + '%';
}
window.updateProgress = updateProgress;

function confirmSubmit() {
  const session = QuizEngine.getSession();
  if (!session) return;
  const progress = QuizEngine.getProgress();
  const unanswered = progress.total - progress.answered;

  App.showModal(`
    <div class="modal-header"><h3>📤 Kumpulkan Quiz</h3><span class="modal-close" onclick="App.closeModal()">✕</span></div>
    <div class="modal-body">
      <div class="submit-summary">
        <div class="submit-summary-row"><span>Total Soal</span><span class="font-bold">${progress.total}</span></div>
        <div class="submit-summary-row"><span>Sudah Dijawab</span><span class="font-bold text-success">${progress.answered}</span></div>
        <div class="submit-summary-row"><span>Belum Dijawab</span><span class="font-bold ${unanswered > 0 ? 'text-warning' : 'text-success'}">${unanswered}</span></div>
      </div>
      ${unanswered > 0 ? `<div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:12px;font-size:0.85rem;color:#fbbf24">⚠️ Masih ada ${unanswered} soal yang belum dijawab. Anda tetap bisa mengumpulkan.</div>` : `<div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:8px;padding:12px;font-size:0.85rem;color:#34d399">✅ Semua soal telah dijawab. Siap untuk dikumpulkan.</div>`}
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="App.closeModal()">Kembali</button>
      <button class="btn btn-success" onclick="submitQuiz()">📤 Kumpulkan Sekarang</button>
    </div>`);
}
window.confirmSubmit = confirmSubmit;

function submitQuiz() {
  App.closeModal();
  const submission = QuizEngine.submitSession();

  // Cleanup anti-cheat & fullscreen
  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  } catch(e) {}
  
  if (window._antiCheatListener) {
    document.removeEventListener('visibilitychange', window._antiCheatListener);
    window._antiCheatListener = null;
  }
  if (window._fullscreenListener) {
    document.removeEventListener('fullscreenchange', window._fullscreenListener);
    window._fullscreenListener = null;
  }

  if (submission) {
    showToast('Quiz berhasil dikumpulkan!', 'success');
    App.navigate('home');
  }
}
window.submitQuiz = submitQuiz;

function abortQuiz() {
  App.showModal(`
    <div class="modal-header"><h3>⚠️ Keluar dari Quiz</h3><span class="modal-close" onclick="App.closeModal()">✕</span></div>
    <div class="modal-body"><p>Apakah Anda yakin ingin keluar? Jawaban Anda tidak akan tersimpan.</p></div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="App.closeModal()">Batal</button>
      <button class="btn btn-danger" onclick="doAbortQuiz()">Ya, Keluar</button>
    </div>`);
}
window.abortQuiz = abortQuiz;

function doAbortQuiz() {
  App.closeModal();
  QuizEngine.clearSession();
  
  // Cleanup anti-cheat & fullscreen
  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  } catch(e) {}
  if (window._antiCheatListener) {
    document.removeEventListener('visibilitychange', window._antiCheatListener);
    window._antiCheatListener = null;
  }
  if (window._fullscreenListener) {
    document.removeEventListener('fullscreenchange', window._fullscreenListener);
    window._fullscreenListener = null;
  }

  App.navigate('home');
}
window.doAbortQuiz = doAbortQuiz;

// ─── Utility ──────────────────────────────────────────────────
function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; }
  else { input.type = 'password'; btn.textContent = '👁️'; }
}
window.togglePasswordVisibility = togglePasswordVisibility;

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  App.navigate('home');
});
