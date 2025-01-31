const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Подключаем статические файлы из папки public
app.use(express.static(path.join(__dirname, 'public')));

// Отдаём index.html при GET-запросе на корень
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});