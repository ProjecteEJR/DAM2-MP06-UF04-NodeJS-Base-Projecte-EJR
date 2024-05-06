const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const AdmZip = require('adm-zip');
const dbConfig = require('./config/db');
const userRoutes = require('./api/routes/userRoutes');
const Event = require('./api/models/event');
const Word = require('./api/models/word');
const { calculateWordStats } = require('./api/services/wordStatsService'); 
const estadisticas = require('./api/models/estadisticas');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.set('json spaces', 2); // Formatea la salida JSON

mongoose.connect(dbConfig.MONGODB_URI)
  .then(() => console.log("Conectado a MongoDB"))
  .catch(err => console.error("No se pudo conectar a MongoDB", err));

app.get('/api/health', (req, res) => {
  res.json({ status: "OK" });
});

app.use('/api', userRoutes); // Rutas de usuarios

// POST endpoint para insertar un evento
app.post('/api/events', async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).send(event);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Endpoint para recuperar un evento por ID
app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).send("El evento no se ha encontrado.");
    }
    res.send(event);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Endpoint para obtener estadísticas de palabras
app.get('/api/stats/words-stats', async (req, res) => {
  try {
    const { wordLengthStats, vowelCounts, consonantCounts } = await calculateWordStats();
    let response = "• Quantes paraules hi ha amb n lletres. Per exemple:\n";

    const estadisticasDocument = {
      fecha: new Date(),
      longitudPalabras: wordLengthStats.map(item => ({
        longitud: item._id,
        cantidad: item.count
      })),
      usoVocales: vowelCounts.map(v => ({
        vocal: v._id,
        cantidad: v.count
      })),
      usoConsonantes: consonantCounts.map(c => ({
        consonante: c._id,
        cantidad: c.count
      }))
    };

    // Guardar en MongoDB (Asumiendo que tienes un modelo Estadisticas)
    await estadisticas.create(estadisticasDocument);

    // Guardar estadísticas en un archivo .txt
    const dataPath = ('../data');

    const filePath = path.join(dataPath, 'estadístiques_diccionari_lletres.txt');
    fs.writeFile(filePath, JSON.stringify(estadisticasDocument, null, 2), (err) => {
      if (err) {
        console.error('Error al guardar el archivo:', err);
        return res.status(500).send('Error al guardar el archivo de estadísticas.');
      }
      console.log('Estadísticas guardadas en archivo.');
    });

    // Generar respuesta para el cliente
    estadisticasDocument.longitudPalabras.forEach(item => {
      response += `  ${item.longitud} lletres: ${item.cantidad}\n`;
    });
    response += "• Comptage de l’ús de vocals (ordenades de major a menor):\n";
    estadisticasDocument.usoVocales.forEach(v => {
      response += `  ${v.vocal}: ${v.cantidad}\n`;
    });
    response += "• Comptatge de l’ús de consonants (ordenades de major a menor):\n";
    estadisticasDocument.usoConsonantes.forEach(c => {
      response += `  ${c.consonante}: ${c.cantidad}\n`;
    });

    res.setHeader('Content-Type', 'text/plain');
    res.send(response);
  } catch ( error) {
    console.error('Error al calcular estadísticas de palabras:', error);
    res.status(500).send(error.message);
  }
});




module.exports = app;