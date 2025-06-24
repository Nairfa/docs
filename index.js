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


// Endpoint untuk mendapatkan informasi bot
app.get('/getMe', async (req, res) => {
  try {
    const response = await axios.get(`${TELEGRAM_API}/getMe`);
    res.send(response.data);
  } catch (error) {
    console.error('Gagal mendapatkan informasi bot:', error.message);
    res.sendStatus(500);
  }
});
// Endpoint untuk menghapus webhook Telegram
app.post('/deleteWebhook', async (req, res) => {
  try {
    const response = await axios.post(`${TELEGRAM_API}/deleteWebhook`);
    res.send(response.data);
  } catch (error) {
    console.error('Gagal menghapus webhook:', error.message);
    res.sendStatus(500);
  }
});

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
app.post(['/webhook', '/webhook/'], async (req, res) => {
  console.log('Webhook diterima 🚀', JSON.stringify(req.body, null, 2));

  const msg = req.body.message;
  if (!msg || !msg.text) return res.sendStatus(200);

  const chatId = msg.chat.id;
  const text = msg.text.trim();

  // Proses step-by-step pendaftaran
  if (text === '/daftar') {
    userStates[chatId] = 'menunggu_nama';
    userData[chatId] = {};
    await sendMessage(chatId, 'Silakan kirim *nama lengkap* kamu:');
    return res.sendStatus(200);
  }
  if (userStates[chatId] === 'menunggu_nama') {
    userData[chatId].nama = text;
    userStates[chatId] = 'menunggu_nomor';
    await sendMessage(chatId, 'Sekarang kirim *nomor HP* kamu:');
    return res.sendStatus(200);
  }
  if (userStates[chatId] === 'menunggu_nomor') {
    userData[chatId].nomor = text;
    userStates[chatId] = 'menunggu_nik';
    await sendMessage(chatId, 'Terakhir, kirim *NIK* atau ID kamu:');
    return res.sendStatus(200);
  }
  if (userStates[chatId] === 'menunggu_nik') {
    userData[chatId].nik = text;
    const data = userData[chatId];
    console.log('User daftar:', data);
    await sendMessage(chatId, `Terima kasih! Berikut data kamu:\n\nNama: ${data.nama}\nNo HP: ${data.nomor}\nNIK: ${data.nik}`);
    delete userStates[chatId];
    delete userData[chatId];
    return res.sendStatus(200);
  }
  // Fallback default
  if (text === '/start') {
    await sendMessage(chatId, 'Halo! Bot Telegram sudah aktif 🚀');
    return res.sendStatus(200);
  }
  // Fallback jika perintah tidak dikenali
  await sendMessage(chatId, 'Saya tidak paham');
  res.sendStatus(200);
});

// Fungsi untuk mengirim pesan ke Telegram
app.listen(port, () => {
  console.log(`Server jalan di port ${port}`);
});
