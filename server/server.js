const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const fs = require("fs/promises")
const multer = require('multer')

const app = express()
const PORT = 3000

async function saveDataAsync(newData) {
  try {
    let currentData = [];
    // // 1. Check if file exists
    // try {
    //   // 2. Read the file and parse existing JSON
    //   const fileData = await fs.readFile(filePath, "utf-8");
    //   currentData = JSON.parse(fileData);
    // } catch (error) {
    //   // If file doesn't exist or is invalid, we'll start with an empty array
    //   console.log("File not found or invalid JSON; starting with an empty array.");
    // }

    // // 3. Modify the data
    // currentData.push(newData);

    // 4. Write updated data back to file
    await fs.writeFile('./public/content.json', JSON.stringify(newData, null, 2));

    console.log("Data saved successfully (async).");
  } catch (err) {
    console.error("Error saving data:", err);
  }
}


const uploadDir = path.join(__dirname, '../public/images')
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  },
})
const upload = multer({ storage })


// Подключаем статические файлы из папки public
app.use(express.static(path.join(__dirname, '../public')));
app.use(bodyParser.json());

// Отдаём index.html при GET-запросе на корень
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.get('/edit', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index-edit.html'));
});

app.post('/api/updateAppData', async (req, res) => {
    await saveDataAsync(req.body.appData)
    res.sendStatus(200)
})

app.post('/api/updateAppData', async (req, res) => {
  await saveDataAsync(req.body.appData)
  res.sendStatus(200)
})

app.post('/api/upload-image', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({
    message: 'Файл успешно загружен',
    file: req.file,
  })
})

// Запуск
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});