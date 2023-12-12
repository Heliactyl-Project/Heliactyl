// Addons/simpleads.js
module.exports = {
    version: "1.0.0",
    "randomInt": getRandomInt(1,100)
  };
  // fuction which gives a random number between 1 and 100
  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; 
  }