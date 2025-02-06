const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const fs = require("fs/promises")
const multer = require('multer')

const app = express()
const PORT = 3000

const saveDataAsync = async (newData) => {
  try {
    await fs.writeFile('./public/index-assets/content.json', JSON.stringify(newData, null, 2))
    console.log("Data saved successfully (async).")
  } catch (err) {
    console.error("Error saving data:", err);
  }
}

const UPLOAD_DIR = path.join(__dirname, '../public/index-assets/images')
const DELETE_DIR = './public/index-assets/images/'

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  },
})
const upload = multer({ storage })

app.use(express.static(path.join(__dirname, '../public')))
app.use(bodyParser.json())

app.get('/edit', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index-edit.html'))
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

app.post('/api/delete-image', async (req, res) => {
  const { fileName } = req.body
  fs.unlink(DELETE_DIR + fileName, (err) => {
      if (err) {
        console.error('Ошибка при удалении:', err);
        return; 
      }
      console.log('Файл удалён успешно.');
  })
  res.sendStatus(200)
})

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});