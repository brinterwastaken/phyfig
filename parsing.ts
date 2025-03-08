import { DiagramSpec, Point, Line } from "./types/diagramSpec";

export function parseDiagramSpec(source: string): DiagramSpec {
	// object to store items used
	let items: any = {
		Points: [] as Point[],
		Lines: [] as Line[],
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
					lineNum,
					scaleXY,
					items
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

function parseItem(textLine: [string, string], lineNum:number, scale: number[] | undefined, parsedItems: any) {
	const pointPattern = /^\((-?\d*\.?\d+),(-?\d*\.?\d+)\)/;
	const linePattern = /^Line\(([A-Za-z]+|\(-?\d*\.?\d+,-?\d*\.?\d+\)),([A-Za-z]+|\(-?\d*\.?\d+,-?\d*\.?\d+\))\)/;
	// check if line[1] is a point
	if (pointPattern.test(textLine[1])) {
		// parse point
		let point = textLine[1].match(pointPattern);
		if (point) {
			let x = Number(point[1]);
			let y = Number(point[2]);
			// check if point is within scale
			if (scale && scale.length == 2) {
				if (x > scale[0] || y > scale[1]) {
					throw new Error(
						`Point ${textLine[0]} = ${textLine[1]} is out of scale.`
					);
				} else {
					return {
						type: "Point",
						item: {name: textLine[0], x: x, y: y}
					};
				}
			} else {
				throw new Error(`No scale specified.`);
			}
		}
	} else if (linePattern.test(textLine[1])) {
		// parse line
		let line = textLine[1].match(linePattern);
		let startPoint:Point|null = null;
		let endPoint:Point|null = null;
		if (line) {
			let start = line[1];
			let end = line[2];
			if (pointPattern.test(start)) {
				// parse start point
				let point = start.match(pointPattern);
				if (point) {
					let startX = Number(point[1]);
					let startY = Number(point[2]);
					if (scale && scale.length == 2) {
						if (startX > scale[0] || startY > scale[1]) {
							throw new Error(
								`Point ${textLine[0]} = ${textLine[1]} is out of scale.`
							);
						} else {
							startPoint = {name: start, x: startX, y: startY};
						}
					} else {
						throw new Error(`No scale specified.`);
					}
				}
			} else if (parsedItems.Points.some((pt:Point) => pt.name == start)) {
				startPoint = parsedItems.Points.find((pt:Point) => pt.name == start);
			} else {
				throw new Error(`Invalid starting point ${start}.`);
			}
			if (pointPattern.test(end)) {
				// parse end point
				let point = end.match(pointPattern);
				if (point) {
					let endX = Number(point[1]);
					let endY = Number(point[2]);
					if (scale && scale.length == 2) {
						if (endX > scale[0] || endY > scale[1]) {
							throw new Error(
								`Point ${textLine[0]} = ${textLine[1]} is out of scale.`
							);
						} else {
							endPoint = {name: end, x: endX, y: endY};
						}
					} else {
						throw new Error(`No scale specified.`);
					}
				}
			} else if (parsedItems.Points.some((point:Point) => point.name == end)) {
				endPoint = parsedItems.Points.find((pt:Point) => pt.name == end)
			} else {
				throw new Error(`Invalid endpoint ${end}.`);
			}
			if (startPoint && endPoint) return {
				type: "Line",
				item: {name: textLine[0], start: startPoint, end: endPoint}
			};
		}
	} else {
		throw new Error(`Syntax Error at line ${lineNum}: ${textLine[1]}`);
	}
}
