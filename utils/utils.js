const emtyResults = require('./emptyResults.json');

function getExpectedMonths({ start, stop }) {
  const expectedMonths = [];
  const date = new Date(start);
  while (date <= new Date(stop)) {
    expectedMonths.push({
      year: date.getFullYear(),
      month: date.getUTCMonth() + 1,
    });
    date.setUTCMonth(date.getUTCMonth() + 1);
  }
  return expectedMonths;
}

exports.insertEmptyIfMissing = (data, dateRange) => {
  const expectedMonths = getExpectedMonths(dateRange);

  return expectedMonths.map(({ month, year }) => {
    const match = data.find(
      (audit) =>
        audit.date.getUTCMonth() +1 === month &&
        audit.date.getFullYear() === year
    );
    if (match) {
      return match;
    } else {
      return {
        date: new Date(year, month -1),
        categories: emtyResults,
        totalScore: { perc: -1 },
      };
    }
  });
};

exports.getExpectedMonths = getExpectedMonths;
