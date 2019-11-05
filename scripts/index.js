/**
  Transfer Learning
  Each instance of `base-recognizer` can be loaded with multiple transfer recognizers
 */

// ------------------------------------------------
// Globals
let baseRecognizer;
let recognizer;
const NUM_FRAMES = 3;
const SAMPLES = 1;
let examples = [];
const INPUT_SHAPE = [NUM_FRAMES, 232, 1];
let model;

// ------------------------------------------------
// Core Functions
function updateConsole(txt) {
  const textNode = document.createTextNode(txt);
  const linebreak = document.createElement('br');
  document.querySelector('#console').appendChild(textNode);
  document.querySelector('#console').appendChild(linebreak);
  var objDiv = document.querySelector("#console");
  objDiv.scrollTop = objDiv.scrollHeight;
}

function setReady() {
  document.querySelector('#terminal').className = 'mw8 center br2 ba b--light-green bg-light-green';
  updateConsole('ready!');
}

function downloadSamples(transferRecognizer) {
  const artifacts = transferRecognizer.serializeExamples();
  const anchor = document.createElement('a');
  anchor.download = `samples.bin`;
  anchor.href = window.URL.createObjectURL(
      new Blob([artifacts], {type: 'application/octet-stream'}));
  anchor.click();
};

function showHelp() {
  document.querySelector('#help').className = 'help sans-serif absolute ct pa4 flex justify-center items-center show';
  setTimeout(() => {
    document.querySelector('#help').className = 'help sans-serif absolute ct pa4 flex justify-center items-center hide';
  }, 7e3);
};

async function collectSamples(recognizer, name, count) {
  for (let index = 0; index < count; index++) {
    updateConsole(`Say ${name}, it: ${index+1}...`);
    await recognizer.collectExample(name);
  }
  updateConsole('Ok Thanks');
}

async function loadSamplesBinaryArrayBuffer(transferRecognizer) {
  const response = await fetch('samples/samples.bin');
  const buffer = await response.arrayBuffer();
  transferRecognizer.loadExamples(buffer);
}

async function createHelpTransferRecognizer() {
  updateConsole('Creating Transfer Recognizer...');
  const transferRecognizer = baseRecognizer.createTransfer('help'); // 1s

  // -------------------------------------------------------
  // Collect Samples
  updateConsole(`Collecting Samples...`);
  await collectSamples(transferRecognizer, 'help', SAMPLES);
  await collectSamples(transferRecognizer, 'checkout', SAMPLES);
  await collectSamples(transferRecognizer, '_background_noise_', SAMPLES);
  const countExamples = transferRecognizer.countExamples();
  const allExamplesKeys = Object.keys(countExamples);
  const example1 = countExamples[allExamplesKeys[0]];
  updateConsole(`Total Samples Collected ${example1}`);

  // -------------------------------------------------------
  // Train
  updateConsole(`Training...`);
  await transferRecognizer.train({
    epochs: 10,
    callback: {
      onEpochEnd: async (epoch, logs) => {
        updateConsole(`Epoch ${epoch}: loss=${logs.loss}, accuracy=${logs.acc}`);
      }
    }
  });
  updateConsole(`Training finished.`);
  downloadSamples(transferRecognizer);

  // -------------------------------------------------------
  // Listen
  updateConsole(`Listening..`);
  await transferRecognizer.listen(result => {
    let { scores } = result;
    const words = transferRecognizer.wordLabels();
    let scoresList = Array.from(scores).map((s, i) => ({
      score: s,
      word: words[i]
    }));
    scoresList.sort((s1, s2) => s2.score - s1.score);
    updateConsole(`Highest Score: ${scoresList[0].word}, ${scoresList[0].score}`);
  }, {
    probabilityThreshold: 0.75
  });
  // Stop the recognition in 10 seconds.
  setTimeout(() => {
    transferRecognizer.stopListening();
    updateConsole(`Stopped Listening.`);
    updateConsole(`Terminated.`);
  }, 10e3);
}

async function loadHelpTransferRecognizer() {
  updateConsole('Creating transfer...');
  const transferRecognizer = baseRecognizer.createTransfer('help'); // 1s

  // -------------------------------------------------------
  // Load Samples
  updateConsole(`Loading samples...`);
  await loadSamplesBinaryArrayBuffer(transferRecognizer);
  const exampleCounts = transferRecognizer.countExamples();
  updateConsole(`Loading finished... ${JSON.stringify(exampleCounts)}`);

  // -------------------------------------------------------
  // Train
  updateConsole(`Training...`);
  await transferRecognizer.train({
    epochs: 10,
    callback: {
      onEpochEnd: async (epoch, logs) => {
        updateConsole(`Epoch ${epoch}: loss=${logs.loss}, accuracy=${logs.acc}`);
      }
    }
  });
  updateConsole(`Training finished.`);

  // -------------------------------------------------------
  // Listen
  updateConsole(`Listening..`);
  showHelp();
  await transferRecognizer.listen(result => {
    let { scores } = result;
    const words = transferRecognizer.wordLabels();
    let scoresList = Array.from(scores).map((s, i) => ({
      score: s,
      word: words[i]
    }));
    scoresList.sort((s1, s2) => s2.score - s1.score);
    updateConsole(`Highest Score: ${scoresList[0].word}, ${scoresList[0].score}`);
    if (scoresList[0].word === 'help') {
      showHelp();
    }
  }, {
    probabilityThreshold: 0.75
  });
  // Stop the recognition in 10 seconds.
  setTimeout(() => {
    transferRecognizer.stopListening();
    updateConsole(`Stopped Listening.`);
    updateConsole(`Terminated.`);
  }, 60e3);
}



// ------------------------------------------------
// Initializer Function
function init() {
  console.log('Starting app...');
  async function app() {
    baseRecognizer = speechCommands.create('BROWSER_FFT');
    await baseRecognizer.ensureModelLoaded();
    setReady();
    // await createHelpTransferRecognizer();
    await loadHelpTransferRecognizer();
  }
  app();
}

document.addEventListener('readystatechange', function () {
  if (document.readyState === "complete") {
    init();
  }
});
