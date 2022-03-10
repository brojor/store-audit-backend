const funnyQuotes = require('./funnyQuotes.json');

module.exports = function fakeResults(categories) {
  return categories.reduce((results, categoryPointId) => {
    results[categoryPointId] = getRandomResult(12);
    return results;
  }, {});
};

function getRandomResult(probabilityOfFalse) {
  if (Math.random() < probabilityOfFalse / 100) {
    return { accepted: false, comment: getRandomQuote() };
  }
  return { accepted: true };
}

function getRandomQuote() {
  const randomIndex = Math.floor(Math.random() * funnyQuotes.length);
  return funnyQuotes[randomIndex];
}