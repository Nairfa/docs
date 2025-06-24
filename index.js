require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 8080;

console.log("Project berhasil jalan 🎉");
console.log("Selamat datang di project ini!");
console.log("Silakan mulai dengan menjalankan perintah yang sesuai.");

// Gunakan token Telegram dari environment variable
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

app.use(bodyParser.json());

// Database sementara (nanti akan pindah ke Google Sheets)
let userData = {};
let registrationSteps = {};

// Database blacklist dan suspend (simulasi - nanti dari external database)
let blacklistData = {
  // Contoh data blacklist
  hp: ['081234567890', '087777777777'], // HP yang diblacklist
  nik: ['3271234567890123', '3271234567890124'], // NIK yang diblacklist
  suspend: ['081111111111', '3271234567890125'] // Data yang di-suspend
};

app.get('/', (req, res) => {
  res.send('App jalan di Railway! 🚀');
});

// Fungsi untuk kirim pesan ke Telegram
async function sendMessage(chatId, text) {
  try {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: text
    });
  } catch (error) {
    console.error('Error mengirim pesan:', error.response?.data || error.message);
  }
}

// Webhook endpoint dari Telegram
app.post(['/webhook', '/webhook/'], async (req, res) => {
  console.log('Webhook diterima 🚀', JSON.stringify(req.body, null, 2));

  const msg = req.body.message;

  if (!msg) return res.sendStatus(200);

  const chatId = msg.chat.id;
  const text = msg.text;
  const userId = msg.from.id;
  const userName = msg.from.first_name || "User";
  const photo = msg.photo; // Array foto dengan berbagai ukuran

  let reply = "";

  // START COMMAND
  if (text === '/start') {
    reply = `Halo ${userName}! 👋

🏗️ **Bot Manajemen Konstruksi**

Fitur yang tersedia:
/daftar - Registrasi sebagai pekerja
/info - Lihat data diri
/absen - Absensi harian
/help - Bantuan

Mulai dengan /daftar untuk mendaftar sebagai pekerja! 🚀`;
  }

  // HELP COMMAND
  else if (text === '/help') {
    reply = `📋 **Panduan Bot Konstruksi**

🔹 **/daftar** - Daftar sebagai pekerja baru
🔹 **/info** - Lihat profil dan data diri
🔹 **/absen** - Clock in/out untuk absensi
🔹 **/status** - Status project dan tim

⚡ Bot ini akan memandu kamu step by step untuk setiap proses!`;
  }

  // INFO COMMAND
  else if (text === '/info') {
    if (userData[userId]) {
      const user = userData[userId];
      reply = `👤 **Profil Kamu**

📱 **No HP:** ${user.nomor}
🆔 **NIK KTP:** ${user.nik}
📝 **Nama:** ${user.nama}
⚒️ **Posisi:** ${user.posisi}
📅 **Terdaftar:** ${user.tanggalDaftar}
📷 **Foto KTP:** ${user.fotoKtp ? '✅ Terupload' : '❌ Belum upload'}
🤳 **Foto Selfie:** ${user.fotoSelfie ? '✅ Terupload' : '❌ Belum upload'}

Status: ✅ Aktif`;
    } else {
      reply = "❌ Kamu belum terdaftar!\n\nKetik /daftar untuk registrasi terlebih dahulu.";
    }
  }

  // DAFTAR COMMAND - Multi Step Registration
  else if (text === '/daftar') {
    if (userData[userId]) {
      reply = `✅ Kamu sudah terdaftar!

No HP: ${userData[userId].nomor}
Nama: ${userData[userId].nama}
Posisi: ${userData[userId].posisi}

Ketik /info untuk lihat detail lengkap.`;
    } else {
      registrationSteps[userId] = { step: 'nomor' };
      reply = `🏗️ **Registrasi Pekerja Konstruksi**

Mari kita mulai proses registrasi!

**Step 1/6**: Masukkan nomor HP kamu

Contoh: 081234567890

*Sistem akan mengecek database untuk validasi...*`;
    }
  }

  // ABSEN COMMAND
  else if (text === '/absen') {
    if (!userData[userId]) {
      reply = "❌ Kamu belum terdaftar!\n\nKetik /daftar untuk registrasi terlebih dahulu.";
    } else {
      const now = new Date().toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      reply = `⏰ **Absensi Berhasil**

👤 **${userData[userId].nama}**
🕐 **Waktu:** ${now}
📍 **Lokasi:** Proyek Konstruksi

Status: ✅ Hadir

*Absensi telah tercatat di sistem.*`;
    }
  }

  // HANDLE REGISTRATION STEPS
  else if (registrationSteps[userId]) {
    const step = registrationSteps[userId];
    
    // Handle foto upload
    if (photo && (step.step === 'foto_ktp' || step.step === 'foto_selfie')) {
      // Ambil foto dengan kualitas terbaik (index terakhir)
      const bestPhoto = photo[photo.length - 1];
      const fileId = bestPhoto.file_id;
      
      if (step.step === 'foto_ktp') {
        step.fotoKtp = fileId;
        step.step = 'foto_selfie';
        reply = `✅ Foto KTP berhasil diterima!

**Step 6/6**: Upload Foto Selfie

🤳 Kirim foto selfie kamu yang jelas.

*Foto harus menunjukkan wajah dengan jelas (tidak pakai masker, kacamata hitam, dll)*`;
      } 
      else if (step.step === 'foto_selfie') {
        step.fotoSelfie = fileId;
        
        // Simpan ke database utama - REGISTRASI SELESAI
        userData[userId] = {
          nomor: step.nomor,
          nik: step.nik,
          nama: step.nama,
          posisi: step.posisi,
          fotoKtp: step.fotoKtp,
          fotoSelfie: step.fotoSelfie,
          tanggalDaftar: new Date().toLocaleDateString('id-ID'),
          telegramId: userId
        };
        
        // Hapus dari registrationSteps
        delete registrationSteps[userId];
        
        reply = `🎉 **Registrasi Berhasil!**

✅ **Data Lengkap Tersimpan:**
📱 **No HP:** ${step.nomor}
🆔 **NIK KTP:** ${step.nik}
👤 **Nama:** ${step.nama}
⚒️ **Posisi:** ${step.posisi}
📷 **Foto KTP:** ✅ Terupload
🤳 **Foto Selfie:** ✅ Terupload

Sekarang kamu bisa:
• /absen - untuk absensi harian
• /info - lihat profil lengkap

Selamat datang di tim! 🚀`;
      }
    }
    // Handle jika user kirim text saat diminta foto
    else if (text && (step.step === 'foto_ktp' || step.step === 'foto_selfie')) {
      const jenisPhoto = step.step === 'foto_ktp' ? 'Foto KTP' : 'Foto Selfie';
      reply = `❌ ${jenisPhoto} harus berupa gambar!

📷 Silakan kirim foto (bukan text) dengan menekan tombol attachment/camera di Telegram.`;
    }
    // Handle step text lainnya
    else if (text) {
    if (step.step === 'nama') {
      if (text.length < 3) {
        reply = "❌ Nama terlalu pendek!\n\nMasukkan nama lengkap kamu (minimal 3 karakter):";
      } else {
        step.nama = text;
        step.step = 'nik';
        reply = `✅ Nama: ${text}

**Step 2/6**: Masukkan NIK KTP (16 digit)

Contoh: 3271234567890123`;
      }
    }
    
    else if (step.step === 'nik') {
      if (!/^\d{16}$/.test(text)) {
        reply = "❌ NIK KTP harus 16 digit angka!\n\nContoh: 3271234567890123\n\nMasukkan NIK KTP yang benar:";
      } else {
        // Cek duplikat NIK
        const nikExists = Object.values(userData).some(user => user.nik === text);
        if (nikExists) {
          reply = "❌ NIK KTP sudah terdaftar di sistem!\n\nGunakan NIK lain atau hubungi admin jika ada kesalahan.";
        } else {
          step.nik = text;
          step.step = 'nomor';
          reply = `✅ NIK KTP: ${text}

**Step 3/6**: Masukkan nomor HP

Contoh: 081234567890`;
        }
      }
    }
    
    else if (step.step === 'nomor') {
      if (!/^08\d{8,11}$/.test(text)) {
        reply = "❌ Format nomor HP salah!\n\nGunakan format: 08xxxxxxxxxx\n\nContoh: 081234567890";
      } else {
        step.nomor = text;
        step.step = 'posisi';
        step.nomor = text;
        step.step = 'posisi';
        reply = `✅ No HP: ${text}

**Step 4/6**: Pilih posisi/jabatan kamu:

1️⃣ Mandor
2️⃣ Tukang Batu
3️⃣ Tukang Kayu
4️⃣ Tukang
5️⃣ Semi Tukang
6️⃣ Operator Alat Berat
7️⃣ Pekerja Umum (Kenek)
8️⃣ Supervisor
9️⃣ Quality Control

Ketik angka (1-9):`;
      }
    }
    
    else if (step.step === 'posisi') {
      const posisiMap = {
        '1': 'Mandor',
        '2': 'Tukang Batu', 
        '3': 'Tukang Kayu',
        '4': 'Tukang',
        '5': 'Semi Tukang',
        '6': 'Operator Alat Berat',
        '7': 'Pekerja Umum (Kenek)',
        '8': 'Supervisor',
        '9': 'Quality Control'
      };
      
      if (!posisiMap[text]) {
        reply = "❌ Pilihan tidak valid!\n\nKetik angka 1-9 sesuai posisi kamu:";
      } else {
        step.posisi = posisiMap[text];
        step.step = 'foto_ktp';
        reply = `✅ Posisi: ${step.posisi}

**Step 5/6**: Upload Foto KTP

📷 Kirim foto KTP kamu yang jelas dan bisa dibaca.

*Pastikan foto tidak blur dan semua text terlihat jelas.*`;
      }
    }
  }

  // DEFAULT RESPONSE (hanya jika ada text dan bukan dalam proses registrasi)
  else if (text) {
    reply = `Saya tidak paham perintah "${text}" 🤔

Ketik /help untuk melihat daftar perintah yang tersedia.`;
  }

  // Kirim balasan hanya jika ada reply
  if (reply) {
    await sendMessage(chatId, reply);
  }
  
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Server berjalan di port ${port} 🚀`);
});