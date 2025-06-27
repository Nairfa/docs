// 🔧 Bot Telegram Multiproject - Versi Super Lengkap (Final Plus Tambahan)
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { Client } = require('@notionhq/client');
const app = express();
const port = process.env.PORT || 8080;

// Inisialisasi
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const notion = new Client({ auth: process.env.NOTION_TOKEN });

const DB_PEKERJA = process.env.NOTION_DB_PEKERJA;
const DB_ABSEN = process.env.NOTION_DB_ABSEN;
const DB_REQUEST = process.env.NOTION_DB_REQUEST;
const DB_MUTASI = process.env.NOTION_DB_MUTASI;
const DB_TASKLIST = process.env.NOTION_DB_TASKLIST;

const userStates = {};
const userData = {};
const loggedIn = {};

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Bot Telegram Multiproject AKTIF ✅');
});

// 🔹 Helper Kirim Pesan
async function sendMessage(chatId, text, buttons) {
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown'
  };
  if (buttons) {
    payload.reply_markup = { keyboard: buttons, resize_keyboard: true };
  }
  await axios.post(`${TELEGRAM_API}/sendMessage`, payload);
}

// 🔹 Contoh KTP
async function sendKTPExample(chatId) {
  await axios.post(`${TELEGRAM_API}/sendPhoto`, {
    chat_id: chatId,
    photo: 'https://upload.wikimedia.org/wikipedia/commons/1/16/Contoh_KTP.jpg',
    caption: 'Contoh KTP yang benar. Harus jelas, tidak blur, dan tidak miring.'
  });
}

// 🔹 Validasi Lokasi GPS (contoh: jarak <= 1km dari proyek)
function isWithinRange(gps1, gps2) {
  const [lat1, lon1] = gps1.split(',').map(Number);
  const [lat2, lon2] = gps2.split(',').map(Number);
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI/180;
  const dLon = (lon2 - lon1) * Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  return d <= 1.0;
}

// 🔹 Simpan Pekerja ke Notion
async function savePekerja(data) {
  await notion.pages.create({
    parent: { database_id: DB_PEKERJA },
    properties: {
      'Nama': { title: [{ text: { content: data.nama } }] },
      'NIK': { rich_text: [{ text: { content: data.nik } }] },
      'Nomor HP': { rich_text: [{ text: { content: data.nomor } }] },
      'Daerah Asal': { rich_text: [{ text: { content: data.daerah } }] },
      'Status': { select: { name: 'Menunggu Verifikasi' } },
      'Telegram ID': { number: parseInt(data.telegram_id) }
    }
  });
}

// 🔹 Cek apakah user aktif
async function isUserApproved(chatId) {
  const res = await notion.databases.query({
    database_id: DB_PEKERJA,
    filter: {
      and: [
        { property: 'Telegram ID', number: { equals: chatId } },
        { property: 'Status', select: { equals: 'Aktif' } }
      ]
    }
  });
  return res.results.length > 0;
}

// 🔹 Simpan Absen
async function saveAbsen(chatId, tugas, lokasi, gps) {
  const task = await notion.databases.query({
    database_id: DB_TASKLIST,
    filter: { property: 'Nama Tugas', rich_text: { equals: tugas } }
  });
  if (task.results.length === 0) {
    await sendMessage(chatId, `❌ Tugas *${tugas}* tidak ada di tasklist proyek.`);
    return false;
  }

  const lokasiProyek = task.results[0].properties['Lokasi GPS'].rich_text[0]?.plain_text || '';
  if (!isWithinRange(gps, lokasiProyek)) {
    await sendMessage(chatId, `📍 Lokasi GPS tidak sesuai lokasi proyek!`);
    return false;
  }

  await notion.pages.create({
    parent: { database_id: DB_ABSEN },
    properties: {
      'Tanggal': { date: { start: new Date().toISOString() } },
      'Tugas': { rich_text: [{ text: { content: tugas } }] },
      'Lokasi': { rich_text: [{ text: { content: lokasi } }] },
      'GPS': { rich_text: [{ text: { content: gps } }] },
      'Pekerja': { rich_text: [{ text: { content: String(chatId) } }] }
    }
  });
  return true;
}

// 🔹 Simpan Request
async function saveRequest(chatId, jenis, keterangan) {
  await notion.pages.create({
    parent: { database_id: DB_REQUEST },
    properties: {
      'Tanggal': { date: { start: new Date().toISOString() } },
      'Jenis Request': { select: { name: jenis } },
      'Keterangan': { rich_text: [{ text: { content: keterangan } }] },
      'Status': { select: { name: 'Menunggu' } },
      'Pekerja': { rich_text: [{ text: { content: String(chatId) } }] }
    }
  });
}

// 🔹 Simpan Mutasi
async function saveMutasi(chatId, dari, ke, alasan) {
  await notion.pages.create({
    parent: { database_id: DB_MUTASI },
    properties: {
      'Tanggal': { date: { start: new Date().toISOString() } },
      'Dari Proyek': { rich_text: [{ text: { content: dari } }] },
      'Ke Proyek': { rich_text: [{ text: { content: ke } }] },
      'Alasan': { rich_text: [{ text: { content: alasan } }] },
      'Jenis Mutasi': { select: { name: 'Sementara' } },
      'Pekerja': { rich_text: [{ text: { content: String(chatId) } }] }
    }
  });
}
