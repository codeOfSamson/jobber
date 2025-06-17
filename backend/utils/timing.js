function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(min = 500, max = 4000) {
  return sleep(Math.floor(Math.random() * (max - min) + min));
}

module.exports = {
  sleep,
  randomDelay,
};
