const fs = require('fs/promises');

const FILES = [
    {
        src: '../public/index-assets/main.js',
        dest: '../../../250205_gitHubPages/gitHubPages/index-assets/main.js'
    },
    {
        src: '../public/index.html',
        dest: '../../../250205_gitHubPages/gitHubPages/index.html'
    },
] 

async function copySingleFile(source, destination) {
  try {
    await fs.copyFile(source, destination);
    console.log('Файл успешно скопирован!');
  } catch (err) {
    console.error('Ошибка при копировании файла:', err);
  }
}

// Пример запуска
(async () => {
    for (let i = 0; i < FILES.length; i++) {
        await copySingleFile(FILES[i].src, FILES[i].dest);
    }
})();