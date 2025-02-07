const fs = require('fs');
const path = require('path');

// Path to your JSON file
const jsonFilePath = path.join(__dirname, '../public/index-assets/content.json');

// Path to the images folder
const imagesFolder = path.join(__dirname, '../public/index-assets/images');

// 1. Read and parse the JSON file
const imagesList = []
try {
  const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
  const parsed = JSON.parse(jsonData);
  
  // Assuming the JSON has a key "images" that is an array of filenames
  //imagesList = parsed.images; 

  for (let i = 0; i < parsed.nodes.length; i++) {
    if (parsed.nodes[i].preview.imgSrc) {
      const name = parsed.nodes[i].preview.imgSrc.split('/').pop()
      imagesList.push(name)
    }
    for (let j = 0; j < parsed.nodes[i].content.length; j++) {
      if (parsed.nodes[i].content[j].type === 'img') {       
        const name = parsed.nodes[i].content[j].src.split('/').pop() 
        imagesList.push(name)
      }
    }
  }


} catch (error) {
  console.error('Error reading or parsing images.json:', error);
  process.exit(1);
}

//console.log(imagesList)

// 2. Read the list of files in the images folder
fs.readdir(imagesFolder, (err, files) => {
  if (err) {
    console.error('Error reading images folder:', err);
    return;
  }

  // 3. Loop through each file, and remove if it's not in the JSON array
  //console.log(files)
  files.forEach((file) => {
    // Check if the file is included in the images array
    if (!imagesList.includes(file)) {
      const filePath = path.join(imagesFolder, file);

      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error(`Error deleting file "${file}":`, unlinkErr);
        } else {
          console.log(`Deleted file: ${file}`);
        }
      });
    }
  });
});