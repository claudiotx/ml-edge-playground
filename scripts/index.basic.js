function init() {
  console.log('Starting app...');
  let recognizer;

  function setReady() {
    document.querySelector('#terminal').className = 'mw8 center br2 ba b--light-green bg-light-green';
  }

  function predictWord() {
    // Recognizer is trained to recognize.
    const words = recognizer.wordLabels();
    console.log('Starting to listen...');
    setReady();
    recognizer.listen(({
      scores
    }) => {
      scores = Array.from(scores).map((s, i) => ({
        score: s,
        word: words[i]
      }));
      // Find the most probable word.
      scores.sort((s1, s2) => s2.score - s1.score);
      console.log('Highest Score:', scores[0].word, scores[0].score);
      document.querySelector('#console').textContent = scores[0].word;
    }, {
      probabilityThreshold: 0.75
    });
  }

  async function app() {
    recognizer = speechCommands.create('BROWSER_FFT');
    await recognizer.ensureModelLoaded();
    predictWord();
  }

  app();
}

document.addEventListener('readystatechange', function () {
  if (document.readyState === "complete") {
    init();
  }
});