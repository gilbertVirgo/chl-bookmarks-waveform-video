import {
	frameDimensions,
	framesPath,
	frequencySpectrumLength,
	gutterBetweenWaveformBars,
	maxFrequency,
	minFrequency,
	numberOfWaveformBars,
	sampleSliceSize,
	videoFrameRate,
	waveformDimensions,
	waveformVideoPath,
} from "./config.js";

import FFT from "fft-js";
import average from "average";
import chunk from "lodash.chunk";
import cliProgress from "cli-progress";
import fs from "fs";
import pad from "pad-number";
import { spawnSync } from "child_process";
import wav from "node-wav";

export default (audioPath) => {
	let audioBuffer = fs.readFileSync(audioPath),
		audioFile = wav.decode(audioBuffer),
		progressBar = new cliProgress.SingleBar(
			{},
			cliProgress.Presets.shades_classic
		),
		[leftChannelData] = audioFile.channelData,
		sampleInterval = audioFile.sampleRate / videoFrameRate,
		peaks = [],
		spectrumSnapshots = [];

	fs.mkdirSync(framesPath);

	// Bloated spectrum: Higher frequencies get included less and less.
	// *
	//  **
	//    ****
	//        *******

	let bloatedSpectrumFilter = Array(frequencySpectrumLength)
		.fill(null)
		.map((x, index) => {
			let maxRadians = (Math.PI * 2) / 4; // 90º
			return (
				Math.random() >
				Math.sin((maxRadians / frequencySpectrumLength) * index)
			);
		});

	progressBar.start(leftChannelData.length, 0);

	for (
		let iterator = 0;
		iterator < leftChannelData.length;
		iterator += sampleInterval
	) {
		let roundedIterator = Math.round(iterator);
		let slice = leftChannelData.slice(
			roundedIterator,
			roundedIterator + sampleSliceSize
		);

		let phasors;

		try {
			phasors = FFT.fft(slice);
		} catch (error) {
			// The final slice isn't a multiple of 1024 so will throw an error. Just miss that off.
			break;
		}

		let fullSpectrum = FFT.util.fftMag(phasors),
			// filteredSpectrum = fullSpectrum.filter(
			// 	(m, index) => bloatedSpectrumFilter[index]
			// ),
			filteredSpectrum = fullSpectrum.slice(minFrequency, maxFrequency),
			simplifiedSpectrum = chunk(
				filteredSpectrum,
				filteredSpectrum.length / numberOfWaveformBars
			).map((magnitudes) => average(magnitudes));

		simplifiedSpectrum.forEach((m, index) => {
			if (
				typeof peaks[index] === "undefined" ||
				simplifiedSpectrum[index] > peaks[index]
			)
				peaks[index] = simplifiedSpectrum[index];
		});

		spectrumSnapshots.push(simplifiedSpectrum);

		progressBar.update(iterator);
	}

	progressBar.stop();

	let largestPeak = Math.max(...peaks),
		barWidth =
			waveformDimensions.width / spectrumSnapshots[0].length -
			gutterBetweenWaveformBars;

	let roundToNearestTenth = (number) => Math.round(number / 10) * 10;

	spectrumSnapshots.forEach((spectrum, index) =>
		fs.writeFileSync(
			`${framesPath}/${pad(index, 7)}.svg`,
			`<svg width="${frameDimensions.width}" height="${
				frameDimensions.height
			}" viewBox="0 0 ${frameDimensions.width} ${
				frameDimensions.height
			}" fill="black" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
			${spectrum
				.map((magnitude, index) => {
					let barHeight = roundToNearestTenth(
							Math.round(
								waveformDimensions.height *
									(1 / largestPeak) *
									magnitude
							)
						),
						x =
							waveformDimensions.offsetLeft +
							(barWidth + gutterBetweenWaveformBars) * index,
						y =
							waveformDimensions.offsetTop +
							(waveformDimensions.height - barHeight) / 2;

					return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="${
						barWidth / 2
					}" ry="${barWidth / 2}" fill="white" />`;
				})
				.join("\n")}
		</svg>`
		)
	);

	spawnSync("ffmpeg", [
		"-framerate",
		videoFrameRate,
		"-pattern_type",
		"glob",
		"-i",
		`${framesPath}/*.svg`,
		waveformVideoPath,
	]);
};
