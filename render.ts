import { PluginSettings } from "types/settings";
import { DiagramSpec, Point } from "./types/diagramSpec";

export function renderDiagram(spec: DiagramSpec, container: HTMLElement, settings: PluginSettings) {
	container.style.color = "var(--text-normal)";
	container.style.setProperty(
		"--unit-length",
		`calc(${settings.diagramHeight} / ${spec.scale[1]})`
	);
	container.style.setProperty("--height", settings.diagramHeight);
	container.style.setProperty("--width", `calc(${spec.scale[0]} * var(--unit-length))`);

	const grid = drawGrid(container, spec.scale);
	if (spec.hideDots) {
		grid.style.display = "none";
	}

	const canvas = createCanvas(container, spec.scale);

	console.log(spec.items)
	for (const point of spec.items['Points']) {
		drawPoint(canvas, point);
	}
}

function drawGrid(container: HTMLElement, scale: [number, number]) {
	const grid = container.createDiv({ cls: "phyfig-dotgrid" });
	grid.style.width = `calc(${scale[0] + 1} * var(--unit-length))`;
	grid.style.height = `calc(${scale[1] + 1} * var(--unit-length))`;
	grid.style.gridTemplateColumns = `repeat(${scale[0] + 1}, 1fr)`;
	grid.style.gridTemplateRows = `repeat(${scale[1] + 1}, 1fr)`;

	for (let i = 0; i < scale[0] + 1; i++) {
		for (let j = 0; j < scale[1] + 1; j++) {
			grid.createDiv({ cls: "phyfig-dot" });
		}
	}
	return grid
}

function createCanvas(container: HTMLElement, scale: [number, number]) {
    const canvas = container.createSvg("svg", {
        cls: "phyfig-canvas",
        attr: {
            viewBox: `0 0 ${scale[0] * 100} ${scale[1] * 100}`,
        },
    });
    return canvas;
}

function drawPoint(canvas: SVGSVGElement, point:Point) {
    const circle = canvas.createSvg("circle");
    circle.setAttribute("cx", `${point.x * 100}`);
    circle.setAttribute("cy", `${point.y * 100}`);
    circle.setAttribute("r", "0.5rem");
}
