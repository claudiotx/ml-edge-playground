/**
  Label 0: Left
  Label 1: Right
  Label 2: Noise

  Will capture the raw spectrogram of audio
  1 Sample - [1000] of Data in the spectrum
  1 sec audio => 43 frames
  23ms of audio = [1000] raw spectrum data
  There is always a map between a number and string
 */

// ------------------------------------------------
// Globals
let recognizer;
// One frame is ~23ms of audio.
const NUM_FRAMES = 3;
let examples = [];

// ------------------------------------------------
// Helper Functions
function normalize(x) {
  const mean = -100;
  const std = 10;
  return x.map(x => (x - mean) / std);
}

function collect(label) {
  console.log('Collecting samples...');
  if (recognizer.isListening()) {
    return recognizer.stopListening();
  }
  if (label == null) {
    return;
  }
  recognizer.listen(async ({
    spectrogram: {
      frameSize,
      data
    }
  }) => {
    let vals = normalize(data.subarray(-frameSize * NUM_FRAMES));
    examples.push({
      vals,
      label
    });
    console.log(`${examples.length} examples collected`);
    document.querySelector('#console').textContent =
      `${examples.length} examples collected`;
  }, {
    overlapFactor: 0.999,
    includeSpectrogram: true,
    invokeCallbackOnNoiseAndUnknown: true
  });
}

// ------------------------------------------------
// Initializer Function
function init() {
  console.log('Starting app...');

  function setReady() {
    document.querySelector('#terminal').className = 'mw8 center br2 ba b--light-green bg-light-green';
  }

  // Entrypoint ===================================
  async function app() {
    recognizer = speechCommands.create('BROWSER_FFT');
    await recognizer.ensureModelLoaded();
    setReady();
  }

  app();
}

document.addEventListener('readystatechange', function () {
  if (document.readyState === "complete") {
    init();
  }
});


// Deprecated (from previous tests)
// function predictWord() {
//   // Recognizer is trained to recognize.
//   const words = recognizer.wordLabels();
//   console.log('Starting to listen...');
//   setReady();
//   recognizer.listen(({
//     scores
//   }) => {
//     scores = Array.from(scores).map((s, i) => ({
//       score: s,
//       word: words[i]
//     }));
//     // Find the most probable word.
//     scores.sort((s1, s2) => s2.score - s1.score);
//     console.log('Highest Score:', scores[0].word, scores[0].score);
//     document.querySelector('#console').textContent = scores[0].word;
//   }, {
//     probabilityThreshold: 0.75
//   });
// }