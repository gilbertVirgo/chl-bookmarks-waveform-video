const fs = require("fs"),
	wav = require("node-wav"),
	{ spawnSync } = require("child_process"),
	FFT = require("fft-js");
const pad = require("pad-number");
const { rimrafSync } = require("rimraf");

const framesDirectoryPath = "./frames",
	audioFilePath = "./audio.wav",
	muteVideoFilePath = "./waveform-mute.mp4",
	videoFilePath = "./waveform.mp4",
	audioBuffer = fs.readFileSync(audioFilePath),
	audioFile = wav.decode(audioBuffer),
	[leftChannelData] = audioFile.channelData,
	videoFrameRate = 25, // should be 25
	sampleInterval = audioFile.sampleRate / videoFrameRate,
	sliceSize = Math.pow(2, 10),
	peaks = [],
	spectrumSnapshots = [];

[videoFilePath, muteVideoFilePath].forEach((pathToRemove) => {
	if (fs.existsSync(pathToRemove)) fs.rmSync(pathToRemove);
});

rimrafSync(framesDirectoryPath);

fs.mkdirSync(framesDirectoryPath);

for (
	let iterator = 0;
	iterator < leftChannelData.length;
	iterator += sampleInterval
) {
	const roundedIterator = Math.round(iterator);
	const slice = leftChannelData.slice(
		roundedIterator,
		roundedIterator + sliceSize
	);

	let phasors;

	try {
		phasors = FFT.fft(slice);
	} catch (error) {
		// The final slice isn't a multiple of 1024 so will throw an error. Just miss that off.
		break;
	}

	const spectrum = FFT.util.fftMag(phasors);

	spectrum.forEach((m, index) => {
		if (
			typeof peaks[index] === "undefined" ||
			spectrum[index] > peaks[index]
		)
			peaks[index] = spectrum[index];
	});

	spectrumSnapshots.push(spectrum);
}

const imageWidth = 1024,
	imageHeight = 256,
	largestPeak = Math.max(...peaks),
	barWidth = imageWidth / spectrumSnapshots[0].length;

spectrumSnapshots.forEach((spectrum, index) =>
	fs.writeFileSync(
		`${framesDirectoryPath}/${pad(index, 7)}.svg`,
		`<svg width="${imageWidth}" height="${imageHeight}" viewBox="0 0 ${imageWidth} ${imageHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
			${spectrum
				.map((magnitude, index) => {
					const barHeight = Math.round(
						imageHeight * (1 / largestPeak) * magnitude
					);

					return `<rect x="${barWidth * index}" y="${
						imageHeight - barHeight
					}" width="${barWidth}" height="${barHeight}" fill="white" />`;
				})
				.join("\n")}
			<!-- <text x="20" y="120" fill="white" style="font-size: 100px;">${index}</text> -->
		</svg>`
	)
);

spawnSync("ffmpeg", [
	"-framerate",
	videoFrameRate,
	"-pattern_type",
	"glob",
	"-i",
	`${framesDirectoryPath}/*.svg`,
	muteVideoFilePath,
]);

spawnSync("ffmpeg", [
	"-i",
	audioFilePath,
	"-i",
	muteVideoFilePath,
	videoFilePath,
]);
