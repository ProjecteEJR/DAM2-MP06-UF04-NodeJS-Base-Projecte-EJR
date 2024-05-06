const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dbConfig = require('../config/db');

// Connectar a MongoDB
mongoose.connect(dbConfig.MONGODB_URI)
  .then(() => console.log("Conectat a MongoDB"))
  .catch(err => console.error("No es va poder connectar a MongoDB:", err));

const Word = mongoose.model('Word', new mongoose.Schema({
    word: String,
    count: { type: Number, default: 0 }
}), 'palabrasCatalan');

async function generateReport() {
    try {
        // Consulta per obtenir les paraules i els usos en ordre descendent
        const words = await Word.find().sort({ count: -1 }).lean();

        let reportData = "PARAULA, USOS\n";
        words.forEach(word => {
            reportData += `${word.word}, ${word.count}\n`;
        });

        // Preparar el camí per l'arxiu de l'informe
        const reportPath = path.join(__dirname, '../../data');
        const reportFile = path.join(reportPath, 'estadístiques_us_paraules_viquipedia.txt');

        // Comprovar si el directori existeix, crear-lo si no existeix
        if (!fs.existsSync(reportPath)) {
            fs.mkdirSync(reportPath, { recursive: true });
        }

        // Escriure l'informe en un fitxer
        fs.writeFileSync(reportFile, reportData);
        console.log("Informe generat amb èxit.");
    } catch (error) {
        console.error("Error al generar l'informe:", error);
    } finally {
        mongoose.disconnect();
    }
}

generateReport();
