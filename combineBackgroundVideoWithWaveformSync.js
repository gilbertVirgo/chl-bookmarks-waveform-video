import { imageWithIntervieweeTextPath, waveformVideoPath } from "./config.js";

import { spawnSync } from "child_process";

export default (audioPath, outputPath) => {
	let { stdout, stderr } = spawnSync("ffmpeg", [
		"-i",
		imageWithIntervieweeTextPath,

		"-i",
		waveformVideoPath,

		"-filter_complex",
		"[1:v]colorkey=0x000000:0.1:0.1[ckout];[0][ckout]overlay[out]",

		"-i",
		audioPath,

		"-map",
		"[out]",

		"-map",
		"2:a",

		// "-b:v",
		// "6000k",

		"-q:v",
		1,
		"-qmin",
		1,
		"-qmax",
		1,

		outputPath,
	]);

	console.log(stdout.toString(), stderr.toString());
};
