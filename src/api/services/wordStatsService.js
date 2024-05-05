const Word = require('../models/word'); // Asegúrate de que la ruta al modelo Word es correcta

async function calculateWordStats() {
  // Conteo de palabras por longitud
  const wordLengthStats = await Word.aggregate([
    {
      $group: {
        _id: "$length",
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }  // Ordena por longitud de la palabra
  ]);
  
  const vowelCounts = await Word.aggregate([
    {
      $project: {
        letters: {
          $map: {
            input: { $range: [0, { $strLenCP: "$word" }] },
            as: "idx",
            in: { $toLower: { $substrCP: ["$word", "$$idx", 1] } }
          }
        }
      }
    },
    { $unwind: "$letters" },
    { $match: { letters: { $in: ["a", "e", "i", "o", "u"] } } },
    {
      $group: {
        _id: "$letters",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }  // Ordena de mayor a menor
  ]);
  
  const consonantCounts = await Word.aggregate([
    {
      $project: {
        letters: {
          $map: {
            input: { $range: [0, { $strLenCP: "$word" }] },
            as: "idx",
            in: { $toLower: { $substrCP: ["$word", "$$idx", 1] } }
          }
        }
      }
    },
    { $unwind: "$letters" },
    { $match: { letters: { $nin: ["a", "e", "i", "o", "u"] } } },
    {
      $group: {
        _id: "$letters",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }  // Ordena de mayor a menor
  ]);
  

  return { wordLengthStats, vowelCounts, consonantCounts };
}

module.exports = { calculateWordStats };
