import {
	backgroundImagePath,
	frameDimensions,
	imageWithIntervieweeTextPath,
	intervieweeTextDimensions,
} from "./config.js";
import { createCanvas, loadImage, registerFont } from "canvas";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { resolve } from "path";
import { writeFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async (interviewee) => {
	// Juuuust can't get this to work. Of course...

	registerFont("urw-antiqua.ttf", {
		family: "urw-antiqua",
	});

	const canvas = createCanvas(frameDimensions.width, frameDimensions.height),
		context = canvas.getContext("2d");

	const backgroundImage = await loadImage(backgroundImagePath);

	context.drawImage(
		backgroundImage,
		0,
		0,
		frameDimensions.width,
		frameDimensions.height
	);

	let fontSize = 0;

	context.textBaseline = "top";

	(function increaseFontSize() {
		context.font = `${fontSize++}px urw-antiqua`;

		if (
			context.measureText(interviewee).width <
			intervieweeTextDimensions.maxWidth
		)
			increaseFontSize();
	})();

	context.fillStyle = "white";

	context.fillText(
		interviewee,
		intervieweeTextDimensions.offsetLeft,
		intervieweeTextDimensions.offsetTop
	);

	const imageBuffer = canvas.toBuffer("image/jpeg");

	writeFileSync(imageWithIntervieweeTextPath, imageBuffer);
};
