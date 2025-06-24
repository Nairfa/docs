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

app.get('/', (req, res) => {
  res.send('App jalan di Railway! 🚀');
});

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  const msg = req.body.message;
  if (!msg || !msg.text) return res.sendStatus(200); // skip non-text messages
  const chatId = msg.chat.id;
  const text = msg.text;
  let reply = "Saya tidak paham";
  if (text === '/start') {
    reply = "Halo! Bot Telegram sudah aktif 🚀";
  }
  // Kirim balasan ke Telegram
  try {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: reply
    });
  } catch (err) {
    console.error('Gagal mengirim pesan ke Telegram:', err.message);
  }
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Server jalan di port ${port}`);
});
// Untuk menjalankan server, gunakan perintah: npm start
// Untuk menguji, buka browser dan akses http://localhost:8080