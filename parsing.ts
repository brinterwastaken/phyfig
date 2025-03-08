import { DiagramSpec, Point } from "./types/diagramSpec";

export function parseDiagramSpec(source: string): DiagramSpec {
	// object to store items used
	let items: any = {
		Points: [] as Point[],
	};

	// remove all empty lines
	source = source.replace(/^\s*[\r\n]/gm, "");

	// get lines of code
	let lines = source.split("\n");
	let scaleXY, hideDots;
	for (const [lineNum, line] of lines.entries()) {
		if (line.startsWith("@")) {
			let configParam = line.slice(1).replace(/\s+/g, "");
			if (configParam.startsWith("Scale")) {
				// @Scale=10,10
				scaleXY = Array.from(
					configParam.split("=")[1].split(","),
					(x) => Number(x)
				);
			}
			if (configParam.startsWith("HideDots")) {
				// @HideDots
				hideDots = true;
			}
		} else {
			let currentLine = line.replace(/\s+/g, "").split("=");
			if (currentLine.length == 2) {
				const currentItem = parseItem(
					currentLine as [string, string],
					scaleXY
				);
				if (currentItem) {
					items[currentItem.type + "s"].push(currentItem.item);
				}
			} else {
				throw new Error(`Syntax Error at line ${lineNum}: ${line}`);
			}
		}
	}
	if (!scaleXY || scaleXY.length != 2) {
		throw new Error("No scale specified.");
	}
	return {
		scale: scaleXY as [number, number],
		hideDots: hideDots,
		items: items,
	};
}

function parseItem(line: [string, string], scale: number[] | undefined) {
	const pointPattern = /^\((-?\d*\.?\d+),(-?\d*\.?\d+)\)/;
	// check if line[1] is a point
	if (pointPattern.test(line[1])) {
		// parse point
		let point = line[1].match(pointPattern);
		if (point) {
			let x = Number(point[1]);
			let y = Number(point[2]);
			// check if point is within scale
			if (scale && scale.length == 2) {
				if (x > scale[0] || y > scale[1]) {
					throw new Error(
						`Point ${line[0]} = ${line[1]} is out of scale.`
					);
				} else {
					return {
						type: "Point",
						item: {name: line[0], x: x, y: y}
					};
				}
			} else {
				throw new Error(`No scale specified.`);
			}
		}
	}
}
