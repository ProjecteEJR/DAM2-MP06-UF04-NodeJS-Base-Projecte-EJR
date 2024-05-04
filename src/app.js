const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const AdmZip = require('adm-zip');
const dbConfig = require('./config/db');
const userRoutes = require('./api/routes/userRoutes');
const Event = require('./api/models/event');
const Word = require('./api/models/word');
const app = express();

app.use(express.json());
app.set('json spaces', 2); // Formatea la salida JSON

mongoose.connect(dbConfig.MONGODB_URI)
  .then(() => console.log("Conectado a MongoDB"))
  .catch(err => console.error("No se pudo conectar a MongoDB", err));

app.get('/api/health', (req, res) => {
  res.json({ status: "OK" });
});

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

// Usa las rutas de usuarios con el prefijo /api
app.use('/api', userRoutes);

//Endpoint per afegir paraules a la bbdd diccionari
app.post('/api/import-words', upload.single('file'), async (req, res) => {
  try {
    const zip = new AdmZip(req.file.path);
    const zipEntries = zip.getEntries();
    const textFileEntry = zipEntries.find(entry => entry.entryName.endsWith('.txt'));
    if (!textFileEntry) {
      return res.status(400).send('No se encontró un archivo .txt dentro del zip.');
    }

    const content = textFileEntry.getData().toString('utf8');
    const words = content.split('\n').filter(line => line.trim()).map(word => ({
      word: word.trim(),
      length: word.trim().length
    }));

    await Word.insertMany(words);
    res.status(201).send({ message: "Palabras importadas correctamente", count: words.length });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

module.exports = app;
