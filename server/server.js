const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const fs = require("fs/promises")
const multer = require('multer')

const app = express()
const PORT = 3000

const UPLOAD_IMAGE_DIR = path.join(__dirname, '../public/index-assets/content')
const DELETE_DIR_IMAGE_DIR = './public/index-assets/content/'
const UPDATE_CONTENT_DIR = './public/index-assets/content'

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.originalname === '_content.json') {
      cb(null, UPDATE_CONTENT_DIR)
    }
    cb(null, UPLOAD_IMAGE_DIR)
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

app.post('/api/save-content-json', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({
    message: 'Файл успешно загружен',
  })
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
  fs.unlink(DELETE_DIR_IMAGE_DIR + fileName, (err) => {
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