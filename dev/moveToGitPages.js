const fs = require('fs/promises');
const fse = require('fs-extra')
const { exec } = require('child_process')
const path = require('path')


function getCurrentGitBranch() {
  return new Promise((resolve, reject) => {
    exec('git rev-parse --abbrev-ref HEAD', (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      resolve(stdout.trim());
    })
  })
}

async function copySingleFile(source, destination) {
  try {
    await fs.copyFile(source, destination);
    console.log('Файл успешно скопирован!');
  } catch (err) {
    console.error('Ошибка при копировании файла:', err);
  }
}

async function copyFolder(src, dest) {
  try {
    await fse.copy(src, dest, { recursive: true });
    console.log('Копирование завершено!');
  } catch (err) {
    console.error('Ошибка при копировании:', err);
  }
}

async function removeFilesInFolder(folderPath) {
  try {
    // Получаем все элементы в папке
    const files = await fs.readdir(folderPath);

    // Перебираем каждый файл и удаляем, если это файл
    for (const file of files) {
      const filePath = path.join(folderPath, file);

      const stats = await fs.stat(filePath);
      if (stats.isFile()) {
        await fs.unlink(filePath);  // Удаляем файл
        console.log(`Удален файл: ${filePath}`);
      }
    }

    console.log('Все файлы удалены!');
  } catch (err) {
    console.error('Ошибка при удалении файлов:', err);
  }
}

const FILES = [
  {
      src: '../public/index-assets/main.js',
      dest: '../../../250205_gitHubPages/gitHubPages/index-assets/main.js'
  },
  {
      src: '../public/index.html',
      dest: '../../../250205_gitHubPages/gitHubPages/index.html'
  },
  {
      src: '../public/index-assets/content.json',
      dest: '../../../250205_gitHubPages/gitHubPages/index-assets/content.json'
  },
] 
const SOURCE_FOLDER = '../public/index-assets/images'
const DEST_FOLDER = '../../../250205_gitHubPages/gitHubPages/index-assets/images'

(async () => {
  try {
    const branchName = await getCurrentGitBranch();
    console.log('Текущая ветка:', branchName);
    if (branchName !== 'git-pages') {
      return;
    }
  } catch (err) {
    console.error('Ошибка при определении ветки:', err);
    return
  }

  for (let i = 0; i < FILES.length; i++) {
      await copySingleFile(FILES[i].src, FILES[i].dest);
  }
  await removeFilesInFolder(DEST_FOLDER)
  await copyFolder(SOURCE_FOLDER, DEST_FOLDER)
})()