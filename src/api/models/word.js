const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema({
  word: { type: String, required: true },
  language: { type: String, required: true, default: 'Catalán' },
  length: { type: Number, required: true }
});

const Word = mongoose.model('Word', wordSchema);

module.exports = Word;
