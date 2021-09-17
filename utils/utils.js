const emtyResults = require('./emptyResults.json');

function monthDiff(dateFrom, dateTo) {
  console.log('hello from monthDiff');
  console.log({ dateFrom }, { dateTo });
  return (
    dateTo.getMonth() -
    dateFrom.getMonth() +
    12 * (dateTo.getFullYear() - dateFrom.getFullYear())
  );
}

function getExpectedMonths(range) {
  const countOfMonths = monthDiff(range.start, range.stop);
  const arr = [];
  const date = new Date(range.start);

  for (let index = 0; index <= countOfMonths; index++) {
    arr.push({ year: date.getFullYear(), month: date.getMonth() });
    date.setMonth(date.getMonth() + 1);
  }
  return arr;
}

exports.insertEmptyIfMissing = (data, dateRange) => {
  const expectedMonths = getExpectedMonths(dateRange);

  return expectedMonths.map(({ month, year }) => {
    const match = data.find(
      (audit) =>
        audit.date.getMonth() === month && audit.date.getFullYear() === year
    );
    if (match) {
      return match;
    } else {
      return { date: new Date(year, month), categories: emtyResults, totalPerc: -1 };
    }
  });
};
