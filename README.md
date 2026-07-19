# QuizPro — Platform Quiz Pelatihan (Localhost)

Platform quiz interaktif berbasis web untuk pelatihan dan ujian lokal. Ringan, tanpa server backend, berjalan langsung di browser menggunakan `localStorage`.

## ✨ Fitur Utama

- **Login Admin & Peserta** — Sistem autentikasi berbasis username & access key
- **Manajemen Quiz** — Buat, edit, hapus quiz dengan berbagai tipe soal (Pilihan Ganda, Benar/Salah, Isian Singkat, Essay)
- **Manajemen Peserta** — Tambah, edit, hapus, aktifkan/nonaktifkan peserta
- **Import Soal via CSV** — Upload soal massal dari file CSV
- **Import Peserta via CSV** — Upload data peserta massal dari file CSV
- **Export Hasil** — Export ringkasan atau detail jawaban ke CSV
- **Anti-Cheat** — Deteksi alt-tab dan fullscreen saat quiz berlangsung
- **Timer Quiz** — Batas waktu opsional dengan countdown
- **Rekap Hasil** — Statistik per quiz dan per peserta

## 🚀 Cara Menjalankan

```bash
# Masuk ke folder project
cd quiz-pelatihan

# Jalankan local server (Python 3)
python -m http.server 8032

# Buka di browser
# http://localhost:8032
```

## 📁 Struktur File

| File | Deskripsi |
|------|-----------|
| `index.html` | Halaman utama SPA |
| `style.css` | Desain dan tema dark mode |
| `app.js` | Router, halaman login, halaman quiz peserta |
| `admin.js` | Panel admin, editor quiz, manajemen peserta & hasil |
| `quiz-engine.js` | Engine quiz (timer, scoring, session) |
| `storage.js` | Abstraksi localStorage (data persistence) |

## 📥 Format Import CSV

### Import Soal
```csv
type,text,option_a,option_b,option_c,option_d,correct_answer,points
multiple_choice,Apa ibukota Indonesia?,Jakarta,Bandung,Surabaya,Medan,0,1
true_false,Matahari terbit dari timur,,,,true,,1
short_answer,Apa rumus luas segitiga?,,,,alas x tinggi / 2,,2
essay,Jelaskan pengertian K3!,,,,,3
```

### Import Peserta
```csv
nama,email,password,nip,divisi
Budi Santoso,budi@email.com,pass123,12345,HRD
Siti Rahayu,siti@email.com,pass456,,IT
```

## 📤 Export Hasil
- **Export Ringkasan**: Nama, Email, Quiz, Nilai, Skor, Durasi, Waktu Submit
- **Export Detail Jawaban**: Termasuk teks soal, jawaban peserta, kunci jawaban, dan status per soal

## 🛠️ Teknologi
- HTML5, CSS3, JavaScript (Vanilla)
- LocalStorage (tanpa database)
- Python HTTP Server (untuk serve file statis)

## 📝 Lisensi
MIT License
