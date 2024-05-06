const mongoose = require('mongoose');
const xml2js = require('xml2js');
const bz2 = require('unbzip2-stream');
const fs = require('fs');
const path = require('path');
const unidecode = require('unidecode');
const dbConfig = require('../config/db');

mongoose.connect(dbConfig.MONGODB_URI)
  .then(() => console.log("Conectado a MongoDB"))
  .catch(err => console.error("No se pudo conectar a MongoDB:", err));

const Word = mongoose.model('Word', new mongoose.Schema({
    word: String,
    count: { type: Number, default: 0 }
}), 'palabrasCatalan');

async function processXML(filePath) {
    const parser = new xml2js.Parser({ explicitArray: false });
    let xmlData = '';
    const stream = fs.createReadStream(filePath).pipe(bz2());
    let globalWordCount = 0; // Contador global de palabras

    stream.on('data', function (chunk) {
        xmlData += chunk.toString();
    });

    stream.on('end', async () => {
        try {
            const result = await parser.parseStringPromise(xmlData);
            const pages = result.mediawiki.page || [];
            for (const page of pages) {
                // Asegúrate de que el texto existe antes de intentar manipularlo
                if (!page.revision || !page.revision.text) continue;
                const text = unidecode(page.revision.text._?.toLowerCase() || '');
                const words = text.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").split(" ");

                const wordCounts = words.reduce((acc, word) => {
                    if (globalWordCount >= 5000) return acc; // Detener el conteo si se alcanzan las 5000 palabras
                    if (!acc[word]) acc[word] = 0;
                    acc[word] += 1;
                    globalWordCount += 1; // Incrementar el contador global
                    return acc;
                }, {});

                const bulkOps = Word.collection.initializeOrderedBulkOp();
                for (const [word, count] of Object.entries(wordCounts)) {
                    bulkOps.find({ word: word }).upsert().updateOne({ $inc: { count: count } });
                }
                if (bulkOps.length) {
                    await bulkOps.execute();
                }
            }
            console.log("Procesamiento completado.");
            mongoose.disconnect();
        } catch (err) {
            console.error("Error al procesar el XML:", err);
        }
    });

    stream.on('error', error => {
        console.error("Error al leer el archivo:", error);
        mongoose.disconnect();
    });

}

processXML(path.join(__dirname, '../../cawikisource-20240401-pages-articles-multistream.xml.bz2'));
