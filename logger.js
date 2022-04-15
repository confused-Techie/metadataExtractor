function logTime(start, phrase) {
  const duration = getDurationInMilli(start);

  console.log(`${phrase}: ${duration} ms`);
}

function getDurationInMilli(start) {
  const NS_PER_SEC = 1e9;
  const NS_TO_MS = 1e6;
  const diff = process.hrtime(start);

  return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
}

module.exports = {
  logTime,
};
