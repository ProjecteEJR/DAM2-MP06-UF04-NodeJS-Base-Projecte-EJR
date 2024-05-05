const readline = require('readline');
const mongoose = require('mongoose');
const dbConfig = require('../config/db');
const Estadisticas = require('../api/models/estadisticas'); 

mongoose.connect(dbConfig.MONGODB_URI)
  .then(() => console.log("Conectado a MongoDB"))
  .catch(err => console.error("No se pudo conectar a MongoDB", err));

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Listas completas de vocales y consonantes
const vowels = ['a', 'e', 'i', 'o', 'u'];
const consonants = 'bcdfghjklmnpqrstvwxyz'.split('');

function getRandomLetters(letters, count) {
    let result = [];
    while (result.length < count) {
        const randomIndex = Math.floor(Math.random() * letters.length);
        result.push(letters[randomIndex]);
    }
    return result;
}

async function getLastStats() {
    try {
        // Encuentra el último documento agregado a la colección 'estadisticas' basado en la fecha.
        const latestStats = await Estadisticas.findOne().sort({ fecha: -1 });
        return latestStats;
    } catch (error) {
        // Manejo de errores en caso de que la consulta falle
        console.error("Error al obtener las estadísticas más recientes:", error);
        throw error; // Re-lanzar el error para manejarlo más arriba si es necesario
    }
}

function selectLetters(vowelStats, consonantStats, numVowels, numConsonants, mostUsed) {
    if (mostUsed) {
        // Usando estadísticas para letras más usadas
        let vowels = vowelStats.map(v => ({ letter: v.vocal, count: v.cantidad }));
        let consonants = consonantStats.map(c => ({ letter: c.consonante, count: c.cantidad }));
        let combinedLetters = [...vowels, ...consonants];
        combinedLetters.sort((a, b) => b.count - a.count);
        return combinedLetters.slice(0, numVowels + numConsonants).map(l => l.letter);
    } else {
        // Selección completamente aleatoria de las listas definidas
        let selectedVowels = getRandomLetters(vowels, numVowels);  // Utiliza la lista de vocales definida globalmente
        let selectedConsonants = getRandomLetters(consonants, numConsonants);  // Utiliza la lista de consonantes definida globalmente
        let combinedLetters = [...selectedVowels, ...selectedConsonants];
        return combinedLetters.sort(() => Math.random() - 0.5); // Mezcla las letras seleccionadas
    }
}


async function run() {
    const stats = await getLastStats();
    if (!stats) {
        console.log("No se encontraron estadísticas en la base de datos.");
        return;
    }

    rl.question('Introduce el número de letras (de 5 a 28): ', function (input) {
        const numLetters = parseInt(input);
        if (isNaN(numLetters) || numLetters < 5 || numLetters > 28) {
            console.log("Número de letras inválido. Elige un número entre 5 y 28.");
            return run();  // Reinicia el script si la entrada es inválida
        }

        function askAlgorithm() {
            rl.question('Elige el algoritmo (1 para más usadas, 2 para aleatorias): ', function (algorithm) {
                if (algorithm !== '1' && algorithm !== '2') {
                    console.log("Opción de algoritmo inválida. Por favor, elige 1 o 2.");
                    askAlgorithm();  // Pregunta nuevamente si la opción es inválida
                } else {
                    const numVowels = Math.ceil(numLetters * 0.4);
                    const numConsonants = numLetters - numVowels;
                    const selectedLetters = selectLetters(stats.usoVocales, stats.usoConsonantes, numVowels, numConsonants, algorithm === '1');
                    console.log(`Letras generadas: ${selectedLetters.join(', ')}`);
                    console.log("Gracias por usar el generador de letras. ¡Hasta la próxima!");
                    rl.close();
                    mongoose.disconnect();
                }
            });
        }

        askAlgorithm();  // Inicia el proceso de solicitud del algoritmo
    });
}

run().catch(err => {
    console.error('Error al ejecutar el script:', err);
    process.exit(1);
});
