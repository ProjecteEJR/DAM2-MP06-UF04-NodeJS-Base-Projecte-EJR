const mongoose = require('mongoose');

const estadisticasSchema = new mongoose.Schema({
  fecha: Date,
  longitudPalabras: [
    {
      longitud: Number,
      cantidad: Number
    }
  ],
  usoVocales: [
    {
      vocal: String,
      cantidad: Number
    }
  ],
  usoConsonantes: [
    {
      consonante: String,
      cantidad: Number
    }
  ]
});

const estadisticas = mongoose.model('estadisticas', estadisticasSchema);

module.exports = estadisticas;
