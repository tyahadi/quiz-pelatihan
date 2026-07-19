/* =====================================================
   admin.js — Admin panel rendering & quiz management
   ===================================================== */

const Admin = (() => {

  // ========== DASHBOARD ==========
  function renderDashboard() {
    const quizzes      = Store.getQuizzes();
    const submissions  = Store.getSubmissions();
    const participants = Store.getParticipants();
    const activeQuizzes = quizzes.filter(q => q.active).length;

    return `
    <div class="admin-header">
      <div class="admin-header-text">
        <h2>Dashboard</h2>
        <p>Selamat datang di panel admin QuizPro</p>
      </div>
      <button class="btn btn-primary" onclick="Admin.showCreateQuizModal()">➕ Buat Quiz Baru</button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card-header"><span class="stat-card-icon">📋</span></div>
        <div class="stat-card-value">${quizzes.length}</div>
        <div class="stat-card-label">Total Quiz</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><span class="stat-card-icon">✅</span></div>
        <div class="stat-card-value">${activeQuizzes}</div>
        <div class="stat-card-label">Quiz Aktif</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><span class="stat-card-icon">📝</span></div>
        <div class="stat-card-value">${submissions.length}</div>
        <div class="stat-card-label">Total Pengerjaan</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><span class="stat-card-icon">👥</span></div>
        <div class="stat-card-value">${participants.length}</div>
        <div class="stat-card-label">Peserta Terdaftar</div>
      </div>
    </div>

    ${renderRecentActivity(submissions)}`;
  }

  function renderRecentActivity(submissions) {
    if (submissions.length === 0) {
      return `<div class="empty-state"><div class="empty-state-icon">📊</div><h3>Belum ada aktivitas</h3><p>Aktivitas pengerjaan quiz akan muncul di sini.</p></div>`;
    }
    const recent = [...submissions].sort((a,b) => new Date(b.submittedAt)-new Date(a.submittedAt)).slice(0, 8);
    return `
    <div class="data-table-wrapper">
      <div class="data-table-header"><h4>Aktivitas Terbaru</h4></div>
      <table>
        <thead><tr><th>Peserta</th><th>Quiz</th><th>Nilai</th><th>Waktu</th></tr></thead>
        <tbody>
          ${recent.map(s => `<tr>
            <td>
              <div class="font-semibold">${escHtml(s.participantName)}</div>
              <div class="text-xs text-muted">${escHtml(s.participantEmail)}</div>
            </td>
            <td>${escHtml(s.quizTitle)}</td>
            <td><span class="score-display">${s.percentage}%</span> <span class="text-muted text-xs">(${s.score}/${s.totalPoints})</span></td>
            <td class="text-xs text-muted">${formatDate(s.submittedAt)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  }

  // ========== QUIZ LIST ==========
  function renderQuizList() {
    const quizzes = Store.getQuizzes();
    return `
    <div class="admin-header">
      <div class="admin-header-text"><h2>Daftar Quiz</h2><p>Kelola semua quiz pelatihan</p></div>
      <button class="btn btn-primary" onclick="Admin.showCreateQuizModal()">➕ Buat Quiz Baru</button>
    </div>
    ${quizzes.length === 0 ? `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <h3>Belum ada quiz</h3>
        <p>Klik tombol "Buat Quiz Baru" untuk membuat quiz pertama Anda.</p>
        <button class="btn btn-primary mt-16" onclick="Admin.showCreateQuizModal()">➕ Buat Quiz Baru</button>
      </div>` : `
    <div class="data-table-wrapper">
      <table>
        <thead><tr><th>Nama Quiz</th><th>Soal</th><th>Waktu</th><th>Pengerjaan</th><th>Status</th><th>Aksi</th></tr></thead>
        <tbody>
          ${quizzes.map(quiz => {
            const subs = Store.getSubmissionsByQuiz(quiz.id);
            return `<tr>
              <td>
                <div class="font-semibold">${escHtml(quiz.title)}</div>
                <div class="text-xs text-muted">${escHtml(quiz.description || '—')}</div>
              </td>
              <td>${quiz.questions.length} soal</td>
              <td>${quiz.timeLimitMinutes ? quiz.timeLimitMinutes + ' mnt' : 'Tidak terbatas'}</td>
              <td>${subs.length}x</td>
              <td><span class="badge ${quiz.active ? 'badge-success' : 'badge-secondary'}">${quiz.active ? '● Aktif' : '○ Nonaktif'}</span></td>
              <td>
                <div class="td-actions">
                  <button class="btn btn-secondary btn-sm" onclick="App.navigate('admin-quiz-edit', '${quiz.id}')">✏️</button>
                  <button class="btn btn-secondary btn-sm" onclick="Admin.toggleActive('${quiz.id}')">${quiz.active ? '⏸️' : '▶️'}</button>
                  <button class="btn btn-danger btn-sm" onclick="Admin.confirmDeleteQuiz('${quiz.id}')">🗑️</button>
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`}`;
  }

  // ========== QUIZ EDITOR ==========
  function renderQuizEditor(quizId) {
    const quiz = quizId ? Store.getQuiz(quizId) : null;
    const isEdit = !!quiz;
    const q = quiz || { title:'', description:'', timeLimitMinutes:'', questions:[], allowRetake:false };
    return `
    <div class="admin-header">
      <div class="admin-header-text">
        <h2>${isEdit ? 'Edit Quiz' : 'Buat Quiz Baru'}</h2>
        <p>${isEdit ? `Mengedit: ${escHtml(q.title)}` : 'Isi detail dan tambahkan soal'}</p>
      </div>
      <div class="d-flex gap-12">
        <button class="btn btn-ghost" onclick="App.navigate('admin-quizzes')">← Kembali</button>
        <button class="btn btn-primary" onclick="Admin.saveQuiz('${quizId || ''}')">💾 Simpan Quiz</button>
      </div>
    </div>
    <div class="quiz-form-page">
      <div class="section-card">
        <div class="section-card-header"><h4>ℹ️ Informasi Quiz</h4></div>
        <div class="section-card-body">
          <div class="form-group">
            <label class="form-label">Nama Quiz <span class="required">*</span></label>
            <input id="quiz-title" class="form-input" type="text" placeholder="contoh: Quiz K3 Batch 3" value="${escHtml(q.title)}" />
          </div>
          <div class="form-group">
            <label class="form-label">Deskripsi</label>
            <textarea id="quiz-description" class="form-input" placeholder="Deskripsi singkat tentang quiz ini...">${escHtml(q.description||'')}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Batas Waktu (menit)</label>
            <input id="quiz-time" class="form-input" type="number" placeholder="kosongkan = tidak terbatas" min="1" max="300" value="${q.timeLimitMinutes||''}" style="max-width:200px" />
            <div class="form-hint">Isi angka untuk countdown timer, kosongkan jika tanpa batas waktu.</div>
          </div>
          <div class="form-group">
            <label class="form-label">
              <input type="checkbox" id="quiz-retake" ${q.allowRetake?'checked':''} style="margin-right:8px;accent-color:var(--primary)" />
              Izinkan peserta mengerjakan ulang
            </label>
          </div>
        </div>
      </div>
      <div class="section-card">
        <div class="section-card-header">
          <h4>📝 Daftar Soal <span class="badge badge-primary" id="q-count-badge">${q.questions.length}</span></h4>
          <div class="d-flex gap-8" style="flex-wrap:wrap">
            <select id="add-question-type" class="form-input" style="width:auto;padding:8px 12px;font-size:0.85rem">
              <option value="multiple_choice">Pilihan Ganda</option>
              <option value="true_false">Benar / Salah</option>
              <option value="short_answer">Isian Singkat</option>
              <option value="essay">Essay</option>
            </select>
            <button class="btn btn-secondary btn-sm" onclick="Admin.addQuestion()">+ Tambah Soal</button>
            <button class="btn btn-secondary btn-sm" onclick="Admin.showImportQuestionsModal()">📥 Import Soal CSV</button>
          </div>
        </div>
        <div class="section-card-body">
          <div id="questions-container">
            ${q.questions.map((question, idx) => renderQuestionCard(question, idx)).join('')}
          </div>
          ${q.questions.length===0 ? `<div class="empty-state" style="padding:32px 0" id="empty-questions-msg"><div class="empty-state-icon">❓</div><p>Belum ada soal. Klik "+ Tambah Soal" untuk menambahkan.</p></div>` : ''}
        </div>
      </div>
      <div class="d-flex gap-12 justify-between mt-8" style="flex-wrap:wrap">
        <button class="btn btn-ghost" onclick="App.navigate('admin-quizzes')">← Batal</button>
        <button class="btn btn-primary" onclick="Admin.saveQuiz('${quizId||''}')">💾 Simpan Quiz</button>
      </div>
    </div>
    <script>window._editingQuiz = ${JSON.stringify(quiz||{questions:[]})};</script>`;
  }

  function renderQuestionCard(q, idx) {
    const typeLabel = {multiple_choice:'Pilihan Ganda',true_false:'Benar/Salah',short_answer:'Isian Singkat',essay:'Essay'}[q.type]||q.type;
    return `
    <div class="question-card" id="qcard-${q.id}" data-qid="${q.id}">
      <div class="question-card-header" onclick="Admin.toggleQuestion('${q.id}')">
        <span class="question-card-handle">☰</span>
        <span class="question-number">${idx+1}</span>
        <div class="question-preview" style="flex:1">
          <div class="question-preview-text">${escHtml(q.text||'(belum diisi)')}</div>
          <div class="question-preview-type">${typeLabel} · ${q.points||1} poin</div>
        </div>
        <div class="td-actions">
          <button class="btn btn-danger btn-sm btn-icon" onclick="event.stopPropagation();Admin.removeQuestion('${q.id}')">🗑️</button>
          <span style="color:var(--text-muted);font-size:1.2rem;padding:4px">▾</span>
        </div>
      </div>
      <div class="question-card-body">${renderQuestionEditor(q)}</div>
    </div>`;
  }

  function renderQuestionEditor(q) {
    const optionLetters = ['A','B','C','D','E','F'];
    let answersHtml = '';
    if (q.type==='multiple_choice') {
      const opts = q.options||['','','',''];
      answersHtml = `
      <div class="form-group mt-12">
        <label class="form-label">Pilihan Jawaban <span class="text-muted text-xs">(● = jawaban benar)</span></label>
        <div class="options-list" id="opts-${q.id}">
          ${opts.map((opt,i)=>`
          <div class="option-item">
            <input type="radio" class="option-correct-radio" name="correct-${q.id}" value="${i}" ${q.correctAnswer==i?'checked':''} onchange="Admin.setCorrectAnswer('${q.id}',this.value)" />
            <span style="color:var(--text-muted);font-size:0.8rem;font-weight:700;width:20px;text-align:center">${optionLetters[i]}</span>
            <input type="text" class="option-input" placeholder="Pilihan ${optionLetters[i]}" value="${escHtml(opt)}" onchange="Admin.updateOption('${q.id}',${i},this.value)" />
            <button class="option-remove-btn" onclick="Admin.removeOption('${q.id}',${i})">✕</button>
          </div>`).join('')}
        </div>
        <button class="btn btn-ghost btn-sm" onclick="Admin.addOption('${q.id}')">+ Tambah Pilihan</button>
      </div>`;
    } else if (q.type==='true_false') {
      answersHtml = `
      <div class="form-group mt-12">
        <label class="form-label">Jawaban Benar</label>
        <div class="tf-options">
          <div class="tf-option ${q.correctAnswer==='true'?'selected-true':''}" onclick="Admin.setCorrectAnswer('${q.id}','true');this.parentElement.querySelectorAll('.tf-option').forEach(el=>el.className='tf-option');this.className='tf-option selected-true'">✓ BENAR</div>
          <div class="tf-option ${q.correctAnswer==='false'?'selected-false':''}" onclick="Admin.setCorrectAnswer('${q.id}','false');this.parentElement.querySelectorAll('.tf-option').forEach(el=>el.className='tf-option');this.className='tf-option selected-false'">✗ SALAH</div>
        </div>
      </div>`;
    } else if (q.type==='short_answer') {
      answersHtml = `
      <div class="form-group mt-12">
        <label class="form-label">Jawaban Benar (tidak sensitif huruf besar/kecil)</label>
        <input type="text" class="form-input" placeholder="Jawaban yang benar" value="${escHtml(q.correctAnswer||'')}" onchange="Admin.setCorrectAnswer('${q.id}',this.value)" />
      </div>`;
    } else {
      answersHtml = `<p class="text-muted text-sm mt-12">📝 Essay dinilai secara manual oleh admin di halaman Hasil.</p>`;
    }
    return `
    <div class="form-group">
      <label class="form-label">Teks Soal <span class="required">*</span></label>
      <textarea class="form-input" placeholder="Tulis soal di sini..." onchange="Admin.updateQuestionText('${q.id}',this.value)">${escHtml(q.text||'')}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Poin</label>
      <div class="point-input-wrapper">
        <input type="number" class="point-input form-input" min="0" max="100" value="${q.points||1}" onchange="Admin.updatePoints('${q.id}',this.value)" style="width:80px" />
        <span class="text-muted text-sm">poin</span>
      </div>
    </div>
    ${answersHtml}`;
  }

  // ========== PARTICIPANT MANAGEMENT ==========
  function renderParticipants() {
    const participants = Store.getParticipants();
    const submissions  = Store.getSubmissions();
    return `
    <div class="admin-header">
      <div class="admin-header-text">
        <h2>Manajemen Peserta</h2>
        <p>Tambah dan kelola akun peserta</p>
      </div>
      <button class="btn btn-primary" onclick="Admin.showAddParticipantModal()">➕ Tambah Peserta</button>
    </div>

    ${participants.length === 0 ? `
    <div class="empty-state">
      <div class="empty-state-icon">👥</div>
      <h3>Belum ada peserta terdaftar</h3>
      <p>Tambahkan peserta agar mereka bisa login dan mengerjakan quiz.</p>
      <button class="btn btn-primary mt-16" onclick="Admin.showAddParticipantModal()">➕ Tambah Peserta</button>
    </div>` : `
    <div class="data-table-wrapper">
      <div class="data-table-header">
        <h4>Daftar Peserta (${participants.length})</h4>
        <div class="d-flex gap-8">
          <button class="btn btn-secondary btn-sm" onclick="Admin.showImportParticipantsModal()">📥 Import CSV</button>
          <button class="btn btn-secondary btn-sm" onclick="Admin.exportParticipantsCSV()">📤 Export</button>
        </div>
      </div>
      <table>
        <thead>
          <tr><th>Nama</th><th>Email</th><th>NIP</th><th>Divisi</th><th>Status</th><th>Quiz Dikerjakan</th><th>Aksi</th></tr>
        </thead>
        <tbody>
          ${participants.map(p => {
            const pSubs = submissions.filter(s => s.participantEmail === p.email);
            return `<tr>
              <td class="font-semibold">${escHtml(p.name)}</td>
              <td class="text-muted text-sm">${escHtml(p.email)}</td>
              <td class="text-muted text-sm">${escHtml(p.nip||'—')}</td>
              <td class="text-muted text-sm">${escHtml(p.divisi||'—')}</td>
              <td><span class="badge ${p.active?'badge-success':'badge-danger'}">${p.active?'Aktif':'Nonaktif'}</span></td>
              <td>${pSubs.length}x</td>
              <td>
                <div class="td-actions">
                  <button class="btn btn-secondary btn-sm" onclick="Admin.showEditParticipantModal('${p.id}')" title="Edit">✏️</button>
                  <button class="btn btn-secondary btn-sm" onclick="Admin.toggleParticipantActive('${p.id}')" title="${p.active?'Nonaktifkan':'Aktifkan'}">${p.active?'⏸️':'▶️'}</button>
                  <button class="btn btn-danger btn-sm" onclick="Admin.confirmDeleteParticipant('${p.id}')" title="Hapus">🗑️</button>
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`}`;
  }

  function showAddParticipantModal() {
    App.showModal(`
      <div class="modal-header"><h3>➕ Tambah Peserta</h3><span class="modal-close" onclick="App.closeModal()">✕</span></div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Nama Lengkap <span class="required">*</span></label>
          <input id="p-add-name" class="form-input" type="text" placeholder="Nama lengkap peserta" />
        </div>
        <div class="form-group">
          <label class="form-label">Email <span class="required">*</span></label>
          <input id="p-add-email" class="form-input" type="email" placeholder="email@contoh.com" />
        </div>
        <div class="form-group">
          <label class="form-label">Password <span class="required">*</span></label>
          <div class="input-password-wrapper">
            <input id="p-add-password" class="form-input" type="password" placeholder="Buat password untuk peserta" />
            <button class="toggle-password" type="button" onclick="togglePasswordVisibility('p-add-password',this)">👁️</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">NIP</label>
          <input id="p-add-nip" class="form-input" type="text" placeholder="NIP (opsional)" />
        </div>
        <div class="form-group">
          <label class="form-label">Divisi / Unit Kerja</label>
          <input id="p-add-divisi" class="form-input" type="text" placeholder="Divisi (opsional)" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="App.closeModal()">Batal</button>
        <button class="btn btn-primary" onclick="Admin.doAddParticipant()">Simpan Peserta</button>
      </div>`);
  }

  function doAddParticipant() {
    const name     = document.getElementById('p-add-name')?.value?.trim();
    const email    = document.getElementById('p-add-email')?.value?.trim();
    const password = document.getElementById('p-add-password')?.value;
    const nip      = document.getElementById('p-add-nip')?.value?.trim();
    const divisi   = document.getElementById('p-add-divisi')?.value?.trim();
    if (!name)  { showToast('Nama wajib diisi','error'); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Format email tidak valid','error'); return; }
    if (!password || password.length < 6) { showToast('Password minimal 6 karakter','error'); return; }
    const result = Store.createParticipant({ name, email, password, nip, divisi });
    if (result.error) { showToast(result.error, 'error'); return; }
    App.closeModal();
    showToast(`Peserta "${name}" berhasil ditambahkan! ✅`,'success');
    App.navigate('admin-participants');
  }

  function showEditParticipantModal(id) {
    const p = Store.getParticipants().find(x => x.id === id);
    if (!p) return;
    App.showModal(`
      <div class="modal-header"><h3>✏️ Edit Peserta</h3><span class="modal-close" onclick="App.closeModal()">✕</span></div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Nama Lengkap <span class="required">*</span></label>
          <input id="p-edit-name" class="form-input" type="text" value="${escHtml(p.name)}" />
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-input" type="email" value="${escHtml(p.email)}" disabled style="opacity:0.5" />
          <div class="form-hint">Email tidak dapat diubah.</div>
        </div>
        <div class="form-group">
          <label class="form-label">Password Baru <span class="text-muted text-xs">(kosongkan jika tidak diubah)</span></label>
          <div class="input-password-wrapper">
            <input id="p-edit-password" class="form-input" type="password" placeholder="Password baru (opsional)" />
            <button class="toggle-password" type="button" onclick="togglePasswordVisibility('p-edit-password',this)">👁️</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">NIP</label>
          <input id="p-edit-nip" class="form-input" type="text" value="${escHtml(p.nip||'')}" />
        </div>
        <div class="form-group">
          <label class="form-label">Divisi / Unit Kerja</label>
          <input id="p-edit-divisi" class="form-input" type="text" value="${escHtml(p.divisi||'')}" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="App.closeModal()">Batal</button>
        <button class="btn btn-primary" onclick="Admin.doEditParticipant('${id}')">Simpan Perubahan</button>
      </div>`);
  }

  function doEditParticipant(id) {
    const name     = document.getElementById('p-edit-name')?.value?.trim();
    const password = document.getElementById('p-edit-password')?.value;
    const nip      = document.getElementById('p-edit-nip')?.value?.trim();
    const divisi   = document.getElementById('p-edit-divisi')?.value?.trim();
    if (!name) { showToast('Nama wajib diisi','error'); return; }
    if (password && password.length < 6) { showToast('Password minimal 6 karakter','error'); return; }
    const data = { name, nip, divisi };
    if (password) data.password = password;
    Store.updateParticipant(id, data);
    App.closeModal();
    showToast('Data peserta berhasil diperbarui ✅','success');
    App.navigate('admin-participants');
  }

  function toggleParticipantActive(id) {
    const p = Store.getParticipants().find(x => x.id === id);
    if (!p) return;
    Store.updateParticipant(id, { active: !p.active });
    showToast(p.active ? 'Peserta dinonaktifkan' : 'Peserta diaktifkan ✅', p.active ? 'warning' : 'success');
    App.navigate('admin-participants');
  }

  function confirmDeleteParticipant(id) {
    const p = Store.getParticipants().find(x => x.id === id);
    if (!p) return;
    App.showModal(`
      <div class="modal-header"><h3>🗑️ Hapus Peserta</h3><span class="modal-close" onclick="App.closeModal()">✕</span></div>
      <div class="modal-body"><p>Hapus peserta <strong>"${escHtml(p.name)}"</strong>? Data login peserta ini akan dihapus, namun riwayat jawaban tetap tersimpan.</p></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="App.closeModal()">Batal</button>
        <button class="btn btn-danger" onclick="Admin.doDeleteParticipant('${id}')">Hapus</button>
      </div>`);
  }

  function doDeleteParticipant(id) {
    Store.deleteParticipant(id);
    App.closeModal();
    showToast('Peserta dihapus','success');
    App.navigate('admin-participants');
  }

  function showImportParticipantsModal() {
    App.showModal(`
      <div class="modal-header"><h3>📥 Import Peserta via CSV</h3><span class="modal-close" onclick="App.closeModal()">✕</span></div>
      <div class="modal-body">
        <p class="text-muted text-sm mb-16">Upload file CSV dengan format kolom: <strong>nama, email, password, nip, divisi</strong></p>
        <div style="background:var(--bg-input);border:1px solid var(--border);border-radius:8px;padding:12px;font-size:0.8rem;color:var(--text-muted);margin-bottom:16px;font-family:monospace">
          nama,email,password,nip,divisi<br/>
          Budi Santoso,budi@email.com,pass123,12345,HRD<br/>
          Siti Rahayu,siti@email.com,pass456,,IT
        </div>
        <input type="file" id="csv-import-file" accept=".csv" class="form-input" />
        <div id="import-preview" class="mt-12"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="App.closeModal()">Batal</button>
        <button class="btn btn-primary" onclick="Admin.doImportCSV()">Import Peserta</button>
      </div>`);
    document.getElementById('csv-import-file').addEventListener('change', previewCSV);
  }

  function previewCSV(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split('\n').filter(l=>l.trim()).slice(1);
      const preview = document.getElementById('import-preview');
      if (!preview) return;
      preview.innerHTML = `<div class="text-sm text-muted mb-8">Preview: ${lines.length} peserta akan diimport</div>
        <div style="max-height:160px;overflow-y:auto;font-size:0.78rem;background:var(--bg-input);border-radius:6px;padding:8px">
          ${lines.slice(0,5).map(l=>{const c=l.split(',');return `<div style="padding:2px 0">${escHtml(c[0]||'')} — ${escHtml(c[1]||'')}</div>`;}).join('')}
          ${lines.length>5?`<div class="text-muted">...dan ${lines.length-5} lainnya</div>`:''}
        </div>`;
    };
    reader.readAsText(file);
  }

  function doImportCSV() {
    const file = document.getElementById('csv-import-file')?.files[0];
    if (!file) { showToast('Pilih file CSV terlebih dahulu','warning'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split('\n').filter(l=>l.trim()).slice(1);
      let added=0, skipped=0;
      lines.forEach(line => {
        const [name,email,password,nip,divisi] = line.split(',').map(s=>s.trim().replace(/^"|"$/g,''));
        if (!name||!email||!password) { skipped++; return; }
        const result = Store.createParticipant({name,email,password,nip:nip||'',divisi:divisi||''});
        if (result.error) skipped++; else added++;
      });
      App.closeModal();
      showToast(`Import selesai: ${added} berhasil, ${skipped} dilewati`,'success');
      App.navigate('admin-participants');
    };
    reader.readAsText(file);
  }

  function exportParticipantsCSV() {
    const participants = Store.getParticipants();
    if (participants.length===0) { showToast('Tidak ada peserta untuk diekspor','warning'); return; }
    const headers = ['Nama','Email','NIP','Divisi','Status'];
    const rows = participants.map(p=>[p.name,p.email,p.nip||'',p.divisi||'',p.active?'Aktif':'Nonaktif']);
    const csv = [headers,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`peserta-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast('File CSV peserta diunduh 📥','success');
  }

  // ========== RESULTS PAGE ==========
  function renderResults() {
    const quizzes     = Store.getQuizzes();
    const submissions = Store.getSubmissions();
    const participants = Store.getParticipants();
    return `
    <div class="admin-header">
      <div class="admin-header-text"><h2>Rekap Hasil Quiz</h2><p>Nilai dan detail jawaban semua peserta</p></div>
      <div class="d-flex gap-8">
        <button class="btn btn-secondary" onclick="Admin.exportCSV()">📥 Export Ringkasan</button>
        <button class="btn btn-primary" onclick="Admin.exportDetailedCSV()">📊 Export Detail Jawaban</button>
      </div>
    </div>

    <!-- Tab navigation -->
    <div class="results-tabs mb-24">
      <button class="results-tab active" id="tab-rekap" onclick="Admin.switchTab('rekap')">📊 Rekap Per Quiz</button>
      <button class="results-tab" id="tab-peserta" onclick="Admin.switchTab('peserta')">👤 Rekap Per Peserta</button>
    </div>

    <!-- Filters -->
    <div class="results-filters" id="results-filters">
      <select class="filter-select" id="filter-quiz" onchange="Admin.filterResults()">
        <option value="">Semua Quiz</option>
        ${quizzes.map(q=>`<option value="${q.id}">${escHtml(q.title)}</option>`).join('')}
      </select>
      <select class="filter-select" id="filter-sort" onchange="Admin.filterResults()">
        <option value="newest">Terbaru</option>
        <option value="oldest">Terlama</option>
        <option value="score_high">Nilai Tertinggi</option>
        <option value="score_low">Nilai Terendah</option>
      </select>
    </div>

    <div id="results-table-container">
      ${renderResultsTable(submissions, quizzes)}
    </div>

    <div id="participant-results-container" class="hidden">
      ${renderParticipantResults(participants, submissions, quizzes)}
    </div>`;
  }

  function switchTab(tab) {
    const rekapContainer = document.getElementById('results-table-container');
    const pesertaContainer = document.getElementById('participant-results-container');
    const filters = document.getElementById('results-filters');
    const tabRekap = document.getElementById('tab-rekap');
    const tabPeserta = document.getElementById('tab-peserta');
    if (tab === 'rekap') {
      rekapContainer?.classList.remove('hidden');
      pesertaContainer?.classList.add('hidden');
      filters?.classList.remove('hidden');
      tabRekap?.classList.add('active');
      tabPeserta?.classList.remove('active');
    } else {
      rekapContainer?.classList.add('hidden');
      pesertaContainer?.classList.remove('hidden');
      filters?.classList.add('hidden');
      tabRekap?.classList.remove('active');
      tabPeserta?.classList.add('active');
    }
  }

  function renderResultsTable(submissions, quizzes) {
    if (submissions.length===0) {
      return `<div class="empty-state"><div class="empty-state-icon">📊</div><h3>Belum ada hasil</h3><p>Belum ada peserta yang mengerjakan quiz.</p></div>`;
    }
    const avg = Math.round(submissions.reduce((s,r)=>s+r.percentage,0)/submissions.length);
    const max = Math.max(...submissions.map(r=>r.percentage));
    const min = Math.min(...submissions.map(r=>r.percentage));
    return `
    <div class="stats-grid mb-24">
      <div class="stat-card"><div class="stat-card-value">${avg}%</div><div class="stat-card-label">Rata-rata Nilai</div></div>
      <div class="stat-card"><div class="stat-card-value">${max}%</div><div class="stat-card-label">Nilai Tertinggi</div></div>
      <div class="stat-card"><div class="stat-card-value">${min}%</div><div class="stat-card-label">Nilai Terendah</div></div>
      <div class="stat-card"><div class="stat-card-value">${submissions.length}</div><div class="stat-card-label">Total Pengerjaan</div></div>
    </div>
    <div class="data-table-wrapper">
      <table>
        <thead><tr><th>#</th><th>Peserta</th><th>Quiz</th><th>Nilai</th><th>Durasi</th><th>Waktu Submit</th><th>Aksi</th></tr></thead>
        <tbody>
          ${submissions.map((s,i)=>`<tr>
            <td class="text-muted text-sm">${i+1}</td>
            <td>
              <div class="font-semibold">${escHtml(s.participantName)}</div>
              <div class="text-xs text-muted">${escHtml(s.participantEmail)}</div>
            </td>
            <td>${escHtml(s.quizTitle)}</td>
            <td>
              <span class="score-display">${s.percentage}%</span>
              <span class="text-muted text-xs">${s.score}/${s.totalPoints}</span>
              ${s.hasEssay?'<span class="badge badge-warning" style="margin-left:6px">essay</span>':''}
            </td>
            <td class="text-muted text-sm">${formatDuration(s.durationSeconds)}</td>
            <td class="text-muted text-sm">${formatDate(s.submittedAt)}</td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="Admin.showAnswerDetail('${s.id}')">👁️ Detail</button>
              <button class="btn btn-danger btn-sm" onclick="Admin.confirmDeleteSubmission('${s.id}')">🗑️</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  }

  function renderParticipantResults(participants, submissions, quizzes) {
    if (participants.length === 0) {
      return `<div class="empty-state"><div class="empty-state-icon">👥</div><h3>Belum ada peserta</h3><p>Tambahkan peserta terlebih dahulu.</p></div>`;
    }
    return `
    <div class="data-table-wrapper">
      <div class="data-table-header"><h4>Rekap Per Peserta</h4></div>
      <table>
        <thead>
          <tr><th>Peserta</th><th>Divisi</th><th>Quiz Dikerjakan</th><th>Rata-rata Nilai</th><th>Nilai Terbaik</th><th>Detail</th></tr>
        </thead>
        <tbody>
          ${participants.map(p => {
            const pSubs = submissions.filter(s => s.participantEmail === p.email);
            const avg   = pSubs.length ? Math.round(pSubs.reduce((a,s)=>a+s.percentage,0)/pSubs.length) : null;
            const best  = pSubs.length ? Math.max(...pSubs.map(s=>s.percentage)) : null;
            return `<tr>
              <td>
                <div class="font-semibold">${escHtml(p.name)}</div>
                <div class="text-xs text-muted">${escHtml(p.email)}</div>
                ${p.nip?`<div class="text-xs text-muted">NIP: ${escHtml(p.nip)}</div>`:''}
              </td>
              <td class="text-muted text-sm">${escHtml(p.divisi||'—')}</td>
              <td>${pSubs.length > 0 ? `<span class="font-bold">${pSubs.length}</span>x` : '<span class="text-muted">—</span>'}</td>
              <td>${avg !== null ? `<span class="score-display">${avg}%</span>` : '<span class="text-muted">—</span>'}</td>
              <td>${best !== null ? `<span class="score-display">${best}%</span>` : '<span class="text-muted">—</span>'}</td>
              <td>
                ${pSubs.length > 0
                  ? `<button class="btn btn-secondary btn-sm" onclick="Admin.showParticipantHistory('${p.id}')">📋 Riwayat</button>`
                  : '<span class="text-muted text-xs">Belum mengerjakan</span>'}
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
  }

  function showParticipantHistory(participantId) {
    const p = Store.getParticipants().find(x => x.id === participantId);
    if (!p) return;
    const subs = Store.getSubmissionsByParticipant(p.email)
                      .sort((a,b) => new Date(b.submittedAt)-new Date(a.submittedAt));
    App.showModal(`
      <div class="modal-header">
        <div>
          <h3>📋 Riwayat Quiz</h3>
          <p class="text-sm text-muted mt-4">${escHtml(p.name)} · ${escHtml(p.email)}</p>
        </div>
        <span class="modal-close" onclick="App.closeModal()">✕</span>
      </div>
      <div class="modal-body">
        ${subs.length === 0
          ? '<p class="text-muted text-center">Belum ada riwayat quiz.</p>'
          : `<div style="display:flex;flex-direction:column;gap:12px;max-height:420px;overflow-y:auto">
            ${subs.map(s=>`
            <div style="background:var(--bg-input);border:1px solid var(--border);border-radius:10px;padding:16px">
              <div class="d-flex justify-between align-center flex-wrap gap-8">
                <div>
                  <div class="font-semibold">${escHtml(s.quizTitle)}</div>
                  <div class="text-xs text-muted mt-4">${formatDate(s.submittedAt)} · Durasi ${formatDuration(s.durationSeconds)}</div>
                </div>
                <div class="text-right">
                  <div class="score-display font-bold" style="font-size:1.3rem">${s.percentage}%</div>
                  <div class="text-xs text-muted">${s.score}/${s.totalPoints} poin</div>
                </div>
              </div>
              <div class="mt-12">
                <button class="btn btn-secondary btn-sm" onclick="Admin.showAnswerDetail('${s.id}')">👁️ Lihat Detail Jawaban</button>
              </div>
            </div>`).join('')}
          </div>`}
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="App.closeModal()">Tutup</button>
      </div>`);
  }

  function showAnswerDetail(submissionId) {
    const s = Store.getSubmissions().find(x => x.id === submissionId);
    if (!s) return;
    const breakdownHtml = (s.breakdown||[]).map((b,i)=>{
      const typeLabel={multiple_choice:'PG',true_false:'B/S',short_answer:'Isian',essay:'Essay'}[b.type]||b.type;
      let badge = b.correct===true?'<span class="badge badge-success">✓ Benar</span>':b.correct===false?'<span class="badge badge-danger">✗ Salah</span>':'<span class="badge badge-warning">📝 Manual</span>';
      return `<div class="answer-item">
        <div class="d-flex justify-between align-center mb-8">
          <span class="text-xs text-muted">Soal ${i+1} · ${typeLabel} · ${b.points} poin</span>${badge}
        </div>
        <div class="font-semibold mb-8" style="font-size:0.9rem">${escHtml(b.questionText)}</div>
        <div class="text-sm"><span class="text-muted">Jawaban: </span>${escHtml(String(b.userAnswer??'(tidak dijawab)'))}</div>
        ${b.type!=='essay'?`<div class="text-sm mt-4"><span class="text-muted">Kunci: </span><span class="answer-item-correct">${escHtml(String(b.correctAnswer??'—'))}</span></div>`:''}
      </div>`;
    }).join('');
    App.showModal(`
      <div class="modal-header">
        <div>
          <h3>Detail Jawaban</h3>
          <p class="text-sm text-muted mt-4">${escHtml(s.participantName)} · ${escHtml(s.quizTitle)}</p>
        </div>
        <span class="modal-close" onclick="App.closeModal()">✕</span>
      </div>
      <div class="modal-body">
        <div class="d-flex gap-16 mb-16" style="flex-wrap:wrap">
          <div><span class="text-muted text-sm">Nilai: </span><span class="score-display font-bold">${s.percentage}% (${s.score}/${s.totalPoints})</span></div>
          <div><span class="text-muted text-sm">Durasi: </span><span class="text-sm">${formatDuration(s.durationSeconds)}</span></div>
          <div><span class="text-muted text-sm">Submit: </span><span class="text-sm">${formatDate(s.submittedAt)}</span></div>
        </div>
        <div style="max-height:400px;overflow-y:auto">${breakdownHtml||'<p class="text-muted text-center">Tidak ada data</p>'}</div>
      </div>
      <div class="modal-footer"><button class="btn btn-ghost" onclick="App.closeModal()">Tutup</button></div>`);
  }

  // ========== QUIZ ACTIONS ==========
  function showCreateQuizModal() { App.navigate('admin-quiz-edit',''); }

  function confirmDeleteQuiz(quizId) {
    const quiz=Store.getQuiz(quizId); if(!quiz) return;
    const subs=Store.getSubmissionsByQuiz(quizId).length;
    App.showModal(`
      <div class="modal-header"><h3>🗑️ Hapus Quiz</h3><span class="modal-close" onclick="App.closeModal()">✕</span></div>
      <div class="modal-body">
        <p>Hapus quiz <strong>"${escHtml(quiz.title)}"</strong>?</p>
        ${subs>0?`<div class="mt-12" style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:12px;font-size:0.85rem;color:#f87171">⚠️ ${subs} data pengerjaan juga akan dihapus.</div>`:''}
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="App.closeModal()">Batal</button>
        <button class="btn btn-danger" onclick="Admin.deleteQuiz('${quizId}')">Hapus</button>
      </div>`);
  }

  function deleteQuiz(quizId) {
    Store.deleteQuiz(quizId); App.closeModal();
    showToast('Quiz dihapus','success'); App.navigate('admin-quizzes');
  }

  function toggleActive(quizId) {
    Store.toggleQuizActive(quizId);
    const quiz=Store.getQuiz(quizId);
    showToast(quiz.active?'Quiz diaktifkan ✅':'Quiz dinonaktifkan',quiz.active?'success':'warning');
    App.navigate('admin-quizzes');
  }

  function confirmDeleteSubmission(subId) {
    App.showModal(`
      <div class="modal-header"><h3>🗑️ Hapus Data</h3><span class="modal-close" onclick="App.closeModal()">✕</span></div>
      <div class="modal-body"><p>Hapus data pengerjaan ini? Tidak dapat dibatalkan.</p></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="App.closeModal()">Batal</button>
        <button class="btn btn-danger" onclick="Admin.deleteSubmission('${subId}')">Hapus</button>
      </div>`);
  }

  function deleteSubmission(id) {
    Store.deleteSubmission(id); App.closeModal();
    showToast('Data dihapus','success'); Admin.filterResults();
  }

  function filterResults() {
    const quizFilter=document.getElementById('filter-quiz')?.value;
    const sortFilter=document.getElementById('filter-sort')?.value||'newest';
    let subs=Store.getSubmissions();
    if(quizFilter) subs=subs.filter(s=>s.quizId===quizFilter);
    subs.sort((a,b)=>{
      if(sortFilter==='newest') return new Date(b.submittedAt)-new Date(a.submittedAt);
      if(sortFilter==='oldest') return new Date(a.submittedAt)-new Date(b.submittedAt);
      if(sortFilter==='score_high') return b.percentage-a.percentage;
      if(sortFilter==='score_low') return a.percentage-b.percentage;
    });
    const container=document.getElementById('results-table-container');
    if(container) container.innerHTML=renderResultsTable(subs,Store.getQuizzes());
  }

  function exportCSV() {
    const subs=Store.getSubmissions();
    if(subs.length===0){showToast('Tidak ada data','warning');return;}
    const headers=['Nama','Email','Quiz','Nilai (%)','Skor','Total Poin','Durasi','Waktu Submit'];
    const rows=subs.map(s=>[s.participantName,s.participantEmail,s.quizTitle,s.percentage,s.score,s.totalPoints,formatDuration(s.durationSeconds),s.submittedAt]);
    const csv=[headers,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=`hasil-quiz-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();URL.revokeObjectURL(url);
    showToast('File CSV diunduh 📥','success');
  }

  // ========== IMPORT QUESTIONS ==========
  function showImportQuestionsModal() {
    App.showModal(`
      <div class="modal-header"><h3>📥 Import Soal via CSV</h3><span class="modal-close" onclick="App.closeModal()">✕</span></div>
      <div class="modal-body">
        <p class="text-muted text-sm mb-16">Upload file CSV dengan format kolom:<br/><strong>type, text, option_a, option_b, option_c, option_d, correct_answer, points</strong></p>
        <div style="background:var(--bg-input);border:1px solid var(--border);border-radius:8px;padding:12px;font-size:0.78rem;color:var(--text-muted);margin-bottom:16px;font-family:monospace;line-height:1.6;overflow-x:auto">
          type,text,option_a,option_b,option_c,option_d,correct_answer,points<br/>
          multiple_choice,Apa ibukota Indonesia?,Jakarta,Bandung,Surabaya,Medan,0,1<br/>
          true_false,Matahari terbit dari timur,,,,true,,1<br/>
          short_answer,Apa rumus luas segitiga?,,,,alas x tinggi / 2,,2<br/>
          essay,Jelaskan pengertian K3!,,,,,3
        </div>
        <div style="background:rgba(96,165,250,0.08);border:1px solid rgba(96,165,250,0.25);border-radius:8px;padding:12px;font-size:0.82rem;color:#93c5fd;margin-bottom:16px">
          <strong>📌 Keterangan:</strong><br/>
          • <strong>type</strong>: multiple_choice / true_false / short_answer / essay<br/>
          • <strong>correct_answer</strong>: Untuk PG isi index (0=A, 1=B, 2=C, 3=D). Untuk B/S isi true/false. Untuk isian singkat isi teks jawaban.<br/>
          • <strong>option_a~d</strong>: Hanya untuk PG, kosongkan untuk tipe lain.<br/>
          • <strong>points</strong>: Opsional, default 1.
        </div>
        <input type="file" id="csv-import-questions-file" accept=".csv" class="form-input" />
        <div id="import-questions-preview" class="mt-12"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="App.closeModal()">Batal</button>
        <button class="btn btn-primary" onclick="Admin.doImportQuestions()">Import Soal</button>
      </div>`);
    document.getElementById('csv-import-questions-file')?.addEventListener('change', function(e) {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const lines = ev.target.result.split('\n').filter(l=>l.trim()).slice(1);
        const preview = document.getElementById('import-questions-preview');
        if (!preview) return;
        preview.innerHTML = `<div class="text-sm text-muted mb-8">Preview: ${lines.length} soal akan diimport</div>
          <div style="max-height:160px;overflow-y:auto;font-size:0.78rem;background:var(--bg-input);border-radius:6px;padding:8px">
            ${lines.slice(0,5).map((l,i)=>{const c=parseCSVLine(l);return `<div style="padding:2px 0">${i+1}. [${escHtml(c[0]||'')}] ${escHtml(c[1]||'')}</div>`;}).join('')}
            ${lines.length>5?`<div class="text-muted">...dan ${lines.length-5} soal lainnya</div>`:''}
          </div>`;
      };
      reader.readAsText(file);
    });
  }

  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i+1] === '"') { current += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { current += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ',') { result.push(current.trim()); current = ''; }
        else { current += ch; }
      }
    }
    result.push(current.trim());
    return result;
  }

  function doImportQuestions() {
    const file = document.getElementById('csv-import-questions-file')?.files[0];
    if (!file) { showToast('Pilih file CSV terlebih dahulu','warning'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split('\n').filter(l=>l.trim()).slice(1);
      if (!window._editingQuiz) window._editingQuiz = { questions: [] };
      let added = 0, skipped = 0;
      lines.forEach(line => {
        const cols = parseCSVLine(line);
        const [type, text, optA, optB, optC, optD, correctAnswer, pointsStr] = cols;
        if (!type || !text) { skipped++; return; }
        const validTypes = ['multiple_choice','true_false','short_answer','essay'];
        if (!validTypes.includes(type)) { skipped++; return; }
        const q = {
          id: 'qid_' + Date.now() + '_' + Math.random().toString(36).substr(2,5),
          type,
          text,
          points: parseInt(pointsStr) || 1,
        };
        if (type === 'multiple_choice') {
          q.options = [optA||'', optB||'', optC||'', optD||''].filter(o=>o);
          if (q.options.length < 2) q.options = ['',''];
          q.correctAnswer = parseInt(correctAnswer) || 0;
        } else if (type === 'true_false') {
          q.correctAnswer = (correctAnswer||'').toLowerCase() === 'false' ? 'false' : 'true';
        } else if (type === 'short_answer') {
          q.correctAnswer = correctAnswer || '';
        }
        // essay has no correct answer
        window._editingQuiz.questions.push(q);
        added++;
      });
      App.closeModal();
      refreshQuestionsDOM();
      showToast(`Import soal selesai: ${added} berhasil, ${skipped} dilewati`, 'success');
    };
    reader.readAsText(file);
  }

  // ========== EXPORT DETAILED RESULTS ==========
  function exportDetailedCSV() {
    const subs = Store.getSubmissions();
    if (subs.length === 0) { showToast('Tidak ada data hasil','warning'); return; }
    // Find max number of questions across all submissions
    let maxQ = 0;
    subs.forEach(s => { if (s.breakdown && s.breakdown.length > maxQ) maxQ = s.breakdown.length; });
    // Build headers
    const headers = ['Nama','Email','Quiz','Nilai (%)','Skor','Total Poin','Durasi','Waktu Submit'];
    for (let i = 1; i <= maxQ; i++) {
      headers.push(`Soal_${i}_Teks`, `Soal_${i}_Jawaban`, `Soal_${i}_Kunci`, `Soal_${i}_Hasil`, `Soal_${i}_Poin`);
    }
    // Build rows
    const rows = subs.map(s => {
      const row = [
        s.participantName, s.participantEmail, s.quizTitle,
        s.percentage, s.score, s.totalPoints,
        formatDuration(s.durationSeconds), s.submittedAt
      ];
      for (let i = 0; i < maxQ; i++) {
        const b = s.breakdown?.[i];
        if (b) {
          row.push(b.questionText || '');
          row.push(String(b.userAnswer ?? ''));
          row.push(String(b.correctAnswer ?? ''));
          row.push(b.correct === true ? 'Benar' : b.correct === false ? 'Salah' : 'Manual');
          row.push(b.earned ?? 0);
        } else {
          row.push('','','','','');
        }
      }
      return row;
    });
    const csv = [headers,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `hasil-detail-quiz-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast('File CSV detail jawaban diunduh 📊','success');
  }

  // ========== QUESTION EDITOR INTERNALS ==========
  function toggleQuestion(qid) {
    document.getElementById('qcard-'+qid)?.classList.toggle('expanded');
  }
  function addQuestion() {
    const type=document.getElementById('add-question-type')?.value||'multiple_choice';
    if(!window._editingQuiz) window._editingQuiz={questions:[]};
    const q={id:'qid_'+Date.now(),type,text:'',points:1,
      options:type==='multiple_choice'?['','','','']:undefined,
      correctAnswer:type==='multiple_choice'?0:type==='true_false'?'true':''};
    window._editingQuiz.questions.push(q);
    refreshQuestionsDOM();
  }
  function removeQuestion(qid) {
    if(!window._editingQuiz) return;
    window._editingQuiz.questions=window._editingQuiz.questions.filter(q=>q.id!==qid);
    refreshQuestionsDOM(); showToast('Soal dihapus','warning');
  }
  function updateQuestionText(qid,value) { const q=findQ(qid);if(q){q.text=value;updatePreview(qid);} }
  function updatePoints(qid,value) { const q=findQ(qid);if(q) q.points=Math.max(0,parseInt(value)||1); }
  function setCorrectAnswer(qid,value) { const q=findQ(qid);if(q) q.correctAnswer=value; }
  function updateOption(qid,idx,value) { const q=findQ(qid);if(q&&q.options) q.options[idx]=value; }
  function addOption(qid) {
    const q=findQ(qid);if(!q||!q.options) return;
    if(q.options.length>=6){showToast('Maksimal 6 pilihan','warning');return;}
    q.options.push(''); refreshQuestionsDOM();
  }
  function removeOption(qid,idx) {
    const q=findQ(qid);if(!q||!q.options||q.options.length<=2){showToast('Minimal 2 pilihan','warning');return;}
    q.options.splice(idx,1);if(q.correctAnswer>=q.options.length) q.correctAnswer=0;
    refreshQuestionsDOM();
  }
  function updatePreview(qid) {
    const el=document.querySelector(`#qcard-${qid} .question-preview-text`);
    const q=findQ(qid); if(el&&q) el.textContent=q.text||'(belum diisi)';
  }
  function findQ(qid) { return window._editingQuiz?.questions.find(q=>q.id===qid); }
  function refreshQuestionsDOM() {
    const container=document.getElementById('questions-container');
    const badge=document.getElementById('q-count-badge');
    if(!container) return;
    const qs=window._editingQuiz?.questions||[];
    container.innerHTML=qs.map((q,i)=>renderQuestionCard(q,i)).join('');
    if(badge) badge.textContent=qs.length;
    if(qs.length>0) document.getElementById('qcard-'+qs[qs.length-1].id)?.classList.add('expanded');
  }

  function saveQuiz(quizId) {
    const title=document.getElementById('quiz-title')?.value?.trim();
    const description=document.getElementById('quiz-description')?.value?.trim();
    const timeInput=document.getElementById('quiz-time')?.value?.trim();
    const allowRetake=document.getElementById('quiz-retake')?.checked;
    if(!title){showToast('Nama quiz tidak boleh kosong','error');return;}
    const questions=window._editingQuiz?.questions||[];
    for(const q of questions){
      if(!q.text?.trim()){showToast('Ada soal yang belum diisi teksnya','error');return;}
      if(q.type==='multiple_choice'&&(!q.options||q.options.some(o=>!o.trim()))){showToast('Semua pilihan jawaban harus diisi','error');return;}
    }
    const data={title,description,timeLimitMinutes:timeInput?parseInt(timeInput):null,allowRetake,questions};
    if(quizId){Store.updateQuiz(quizId,data);showToast('Quiz diperbarui! ✅','success');}
    else{Store.createQuiz(data);showToast('Quiz dibuat! 🎉','success');}
    App.navigate('admin-quizzes');
  }

  return {
    renderDashboard, renderQuizList, renderQuizEditor,
    renderResults, renderParticipants, switchTab,
    // participant management
    showAddParticipantModal, doAddParticipant,
    showEditParticipantModal, doEditParticipant,
    toggleParticipantActive, confirmDeleteParticipant, doDeleteParticipant,
    showImportParticipantsModal, doImportCSV, exportParticipantsCSV,
    showParticipantHistory,
    // import questions
    showImportQuestionsModal, doImportQuestions,
    // results
    filterResults, exportCSV, exportDetailedCSV, showAnswerDetail,
    confirmDeleteSubmission, deleteSubmission,
    // quiz
    showCreateQuizModal, confirmDeleteQuiz, deleteQuiz, toggleActive,
    // question editor
    toggleQuestion, addQuestion, removeQuestion,
    updateQuestionText, updatePoints, setCorrectAnswer,
    updateOption, addOption, removeOption, saveQuiz,
  };
})();

function formatDate(iso) {
  if(!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
}
function formatDuration(sec) {
  if(!sec) return '—';
  const m=Math.floor(sec/60),s=sec%60;
  return m>0?`${m} mnt ${s} dtk`:`${s} dtk`;
}
