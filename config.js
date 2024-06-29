import { dirname } from "path";
import { fileURLToPath } from "url";
import { join } from "path";

let __dirname = dirname(fileURLToPath(import.meta.url));

export let tempPath = join(__dirname, "temp");
export let framesPath = join(tempPath, "frames");
export let waveformVideoPath = join(tempPath, "waveform.mp4");
export let imageWithIntervieweeTextPath = join(
	tempPath,
	"image-with-interviewee-text.jpg"
);
export let backgroundVideoPath = join(tempPath, "background-video.mp4");
export let videoFrameRate = 25;
export let sampleSliceSize = Math.pow(2, 10);
export let backgroundImagePath = join(__dirname, "images", "background.jpg");
export let frameDimensions = {
	width: 1920,
	height: 1080,
};
export let intervieweeTextDimensions = {
	offsetLeft: 1010,
	offsetTop: 210,
	maxWidth: 800,
};
export let waveformDimensions = {
	offsetLeft: 1010,
	offsetTop: 436,
	width: 800,
	height: 510,
};
export let numberOfWaveformBars = 25;
export let gutterBetweenWaveformBars = 10;
