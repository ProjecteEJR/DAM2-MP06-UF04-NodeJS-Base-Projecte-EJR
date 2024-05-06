const mongoose = require('mongoose');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const dbConfig = require('../config/db'); // Configuración de la base de datos

// Connectar a MongoDB
mongoose.connect(dbConfig.MONGODB_URI)
  .then(() => console.log("Conectat a MongoDB"))
  .catch(err => console.error("No es va poder connectar a MongoDB:", err));

const Word = mongoose.model('Word', new mongoose.Schema({
    word: String,
    length: Number
}), 'words');

// Función para importar palabras desde un archivo ZIP
async function importWords(filePath) {
  try {
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();

    const textFileEntry = zipEntries.find(entry => entry.entryName.endsWith('.txt'));
    if (!textFileEntry) {
      throw new Error('No se encontró un archivo .txt dentro del zip.');
    }

    const content = textFileEntry.getData().toString('utf8');
    const words = content.split('\n').filter(line => line.trim()).map(word => ({
      word: word.trim(),
      length: word.trim().length
    }));

    // Inserta las palabras en la colección 'words'
    await Word.insertMany(words);
    console.log("Palabras importadas correctamente");
  } catch (err) {
    console.error("Error al importar palabras:", err);
  } finally {
    mongoose.disconnect();
  }
}

// Ruta del archivo ZIP
const zipFilePath = path.join(__dirname, '../../catalan.zip'); 


importWords(zipFilePath);
