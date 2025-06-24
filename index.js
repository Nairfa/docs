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

// Webhook endpoint dari Telegram
app.post(['/webhook', '/webhook/'], async (req, res) => {
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
});

app.listen(port, () => {
  console.log(`Server jalan di port ${port}`);
});
