import { existsSync, mkdirSync } from "fs";

import combineBackgroundVideoWithWaveformSync from "./combineBackgroundVideoWithWaveformSync.js";
import generateImageWithIntervieweeText from "./generateImageWithIntervieweeText.js";
import generateWaveformSync from "./generateWaveformSync.js";
import minimist from "minimist";
import { rimrafSync } from "rimraf";
import { tempPath } from "./config.js";

let args = minimist(process.argv.slice(2));

if (!args.i || !existsSync(args.i))
	throw new Error(
		"Must specify a valid audio input path (use the `-i` flag)"
	);
if (!args.o)
	throw new Error("Must specify a video output path (use the `-o` flag)");
if (!args.n) throw new Error("Must specify an interviewee (use the `-n` flag)");

(async function () {
	rimrafSync(tempPath);
	mkdirSync(tempPath);

	console.log("Generating background");
	await generateImageWithIntervieweeText(args.n);

	console.log("Generating waveform");
	generateWaveformSync(args.i);

	console.log("Combining background & waveform");
	combineBackgroundVideoWithWaveformSync(args.i, args.o);

	console.log("Removing temp directory");
	rimrafSync(tempPath);

	console.log("Finished. See", args.o);
})();
