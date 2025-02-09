const fs = require('fs');
const path = require('path');

/**
 * Loads a JSON file and returns its contents.
 * 
 * @param {string} filePath - The relative or absolute path to the JSON file.
 * @returns {object} - The parsed JSON content.
 */
function loadJson(filePath) {
    try {
        const absolutePath = path.resolve(filePath);
        const fileContent = fs.readFileSync(absolutePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);
        return jsonData;
    } catch (error) {
        console.error(`Error loading JSON file: ${error.message}`);
        return null;
    }
}

module.exports = loadJson;