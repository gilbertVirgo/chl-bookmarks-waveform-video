import {
	frameDimensions,
	framesPath,
	gutterBetweenWaveformBars,
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
	const audioBuffer = fs.readFileSync(audioPath),
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

	const spectrumLength = 512, // this is the fft-js default
		bloatedSpectrumFilter = Array(spectrumLength)
			.fill(null)
			.map((x, index) => {
				const maxRadians = (Math.PI * 2) / 4; // 90º
				return (
					Math.random() >
					Math.sin((maxRadians / spectrumLength) * index)
				);
			});

	progressBar.start(leftChannelData.length, 0);

	for (
		let iterator = 0;
		iterator < leftChannelData.length;
		iterator += sampleInterval
	) {
		const roundedIterator = Math.round(iterator);
		const slice = leftChannelData.slice(
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

		const fullSpectrum = FFT.util.fftMag(phasors),
			bloatedSpectrum = fullSpectrum.filter(
				(m, index) => bloatedSpectrumFilter[index]
			),
			simplifiedSpectrum = chunk(
				bloatedSpectrum,
				bloatedSpectrum.length / numberOfWaveformBars
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

	const largestPeak = Math.max(...peaks),
		barWidth =
			waveformDimensions.width / spectrumSnapshots[0].length -
			gutterBetweenWaveformBars;

	const roundToNearestTenth = (number) => Math.round(number / 10) * 10;

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
					const barHeight = roundToNearestTenth(
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
