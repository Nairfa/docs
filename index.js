console.log("Project berhasil jalan 🎉");
console.log("Selamat datang di project ini!");
console.log("Silakan mulai dengan menjalankan perintah yang sesuai.");
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('App jalan di Railway! 🚀');
});

app.listen(port, () => {
  console.log(`Server jalan di port ${port}`);
});
// Untuk menjalankan server, gunakan perintah: npm start
// Untuk menguji, buka browser dan akses http://localhost:8080