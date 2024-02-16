const fs = require("fs");
const fourierTransform = require("fourier-transform");
const wav = require("node-wav");

const buffer = fs.readFileSync("./sine-max.wav");
const audioFile = wav.decode(buffer);

const [leftChannelData] = audioFile.channelData;

console.log(Math.max(...leftChannelData.slice(0, 1000)));
