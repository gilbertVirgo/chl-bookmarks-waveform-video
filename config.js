import { dirname } from "path";
import { fileURLToPath } from "url";
import { join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const tempPath = join(__dirname, "temp");
export const framesPath = join(tempPath, "frames");
export const waveformVideoPath = join(tempPath, "waveform.mp4");
export const imageWithIntervieweeTextPath = join(
	tempPath,
	"image-with-interviewee-text.jpg"
);
export const backgroundVideoPath = join(tempPath, "background-video.mp4");
export const videoFrameRate = 25;
export const sampleSliceSize = Math.pow(2, 10);
export const backgroundImagePath = join(__dirname, "images", "background.jpg");
export const frameDimensions = {
	width: 1920,
	height: 1080,
};
export const intervieweeTextDimensions = {
	offsetLeft: 1010,
	offsetTop: 210,
	maxWidth: 800,
};
export const waveformDimensions = {
	offsetLeft: 1010,
	offsetTop: 436,
	width: 800,
	height: 510,
};
export const numberOfWaveformBars = 25;
export const gutterBetweenWaveformBars = 10;
