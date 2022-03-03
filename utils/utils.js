const emtyResults = require('./emptyResults.json');
const { Interval } = require('luxon');

const createEmptyResults = (date) => ({
  date: new Date(date),
  categories: emtyResults,
  totalScore: { perc: -1 },
});

exports.insertEmptyIfMissing = (audits, dateRange) => {
  const { start, end } = dateRange;
  const dateInterval = Interval.fromDateTimes(new Date(start), new Date(end));

  return dateInterval.splitBy({ months: 1 }).map(({ start, end }) => {
    const match = audits.find(({ date }) => date >= start && date < end);
    return match || createEmptyResults(start);
  });
};
