const userStates = {}; // Menyimpan status sementara user
const userData = {};   // Menyimpan data hasil input user
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 8080;

console.log("Project berhasil jalan 🎉");
console.log("Selamat datang di project ini!");
console.log("Silakan mulai dengan menjalankan perintah yang sesuai.");
// Pastikan environment variable TELEGRAM_TOKEN sudah diatur


// Gunakan token Telegram dari environment variable
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('App jalan di Railway! 🚀');
});
// Middleware untuk normalisasi URL (hapus double slash)
app.use((req, res, next) => {
  req.url = req.url.replace(/\/+/g, '/');
  next();
});
// Endpoint untuk mengatur webhook Telegram
app.post('/setWebhook', async (req, res) => {
  try {
    const response = await axios.post(`${TELEGRAM_API}/setWebhook`, {
      url: `${process.env.APP_URL}/webhook`
    });
    res.send(response.data);
  } catch (error) {
    console.error('Gagal mengatur webhook:', error.message);
    res.sendStatus(500);
  }
});

const userStates = {}; // Menyimpan status sementara user
const userData = {};   // Menyimpan data hasil input user
// Fungsi untuk mengirim pesan ke Telegram
async function sendMessage(chatId, text) {
  try {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Gagal mengirim pesan ke Telegram:', error.message);
  }
}

// Webhook endpoint dari Telegram
app.post('/webhook', async (req, res) => {
  const msg = req.body.message;
  if (!msg || !msg.text) return res.sendStatus(200);

  const chatId = msg.chat.id;
  const text = msg.text.trim();

  // 1. Mulai proses daftar
  if (text === '/daftar') {
    userStates[chatId] = 'menunggu_nama';
    userData[chatId] = {};
    return sendMessage(chatId, 'Silakan kirim *nama lengkap* kamu:');
  }

  // 2. Step: nama
  if (userStates[chatId] === 'menunggu_nama') {
    userData[chatId].nama = text;
    userStates[chatId] = 'menunggu_nomor';
    return sendMessage(chatId, 'Sekarang kirim *nomor HP* kamu:');
  }

  // 3. Step: nomor HP
  if (userStates[chatId] === 'menunggu_nomor') {
    userData[chatId].nomor = text;
    userStates[chatId] = 'menunggu_nik';
    return sendMessage(chatId, 'Terakhir, kirim *NIK* atau ID kamu:');
  }

  // 4. Step: NIK
  if (userStates[chatId] === 'menunggu_nik') {
    userData[chatId].nik = text;
    userStates[chatId] = null; // Reset status user

    const data = userData[chatId];
    console.log('User daftar:', data);

    return sendMessage(chatId,
      `✅ *Data kamu sudah tercatat:*\n\n` +
      `*Nama:* ${data.nama}\n` +
      `*No HP:* ${data.nomor}\n` +
      `*NIK:* ${data.nik}`
    );
  }

  // 5. Default /start
  if (text === '/start') {
    return sendMessage(chatId, 'Halo! Bot Telegram sudah aktif 🚀\nGunakan /daftar untuk mulai.');
  }

  res.sendStatus(200);
});
  console.log('Webhook diterima 🚀', JSON.stringify(req.body, null, 2));

  const msg = req.body.message;

  if (!msg || !msg.text) return res.sendStatus(200);

  const chatId = msg.chat.id;
  const text = msg.text;

  let reply = "Saya tidak paham";

  if (text === '/start') {
    reply = "Halo! Bot Telegram sudah aktif 🚀";
  }

  try {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: reply
    });
  } catch (err) {
    console.error('Gagal mengirim pesan ke Telegram:', err.message);
  }

  res.sendStatus(200);
  // Fungsi untuk mengirim pesan ke Telegram
app.listen(port, () => {
  console.log(`Server jalan di port ${port}`);
});
