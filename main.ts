import { log } from "console";
import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import { config } from "process";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	diagramHeight: string;
}

interface DiagramSpec {
	scale: [number, number];
	hideDots?: boolean;
	items?: any;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	diagramHeight: "16rem",
};

export default class PhyFigPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();
		// Register the markdown processor for phyfig code blocks
		this.registerMarkdownCodeBlockProcessor("phyfig", (source, el, ctx) => {
			// Create a container for our diagram
			const container = el.createDiv({ cls: "phyfig-diagram" });
			try {
				// Parse the source code
				const diagramSpec = this.parseDiagramSpec(source);
				// Render the diagram
				this.renderDiagram(diagramSpec, container);
			} catch (error) {
				container.style.padding = '1rem'
				container.style.color = "var(--text-error)";
				container.setText("Error rendering diagram: " + error.message);
			}
		});

		this.addSettingTab(new SettingTab(this.app, this));
	}

	private parseDiagramSpec(source: string): DiagramSpec {
		// object to store items used
		let items:any = {};

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
				console.log(line.replace(/\s+/g, ""));
				
				if (currentLine.length == 2) {
					items[currentLine[0]] = currentLine[1];
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

	private drawGrid(container: HTMLElement, scale: [number, number]) {
		const grid = container.createDiv({ cls: "phyfig-dotgrid" });
		grid.style.width = `calc(${scale[0] + 1} * (var(--unit-length))`;
		grid.style.height = `calc(${scale[1] + 1} * var(--unit-length))`;
		grid.style.gridTemplateColumns = `repeat(${scale[0] + 1}, 1fr)`;
		grid.style.gridTemplateRows = `repeat(${scale[1] + 1}, 1fr)`;

		for (let i = 0; i < scale[0] + 1; i++) {
			for (let j = 0; j < scale[1] + 1; j++) {
				const dot = grid.createDiv({ cls: "phyfig-dot" });
			}
		}
		return grid
	}

	private renderDiagram(spec: DiagramSpec, container: HTMLElement) {
		container.style.color = "var(--text-normal)";
		container.style.setProperty(
			"--unit-length",
			`calc(${this.settings.diagramHeight} / ${spec.scale[1]})`
		);
		container.style.setProperty("--height", this.settings.diagramHeight);
		container.style.setProperty("--width", `calc(${spec.scale[0]} * var(--unit-length))`);

		const grid = this.drawGrid(container, spec.scale);
		if (spec.hideDots) {
			grid.style.display = "none";
		}
		console.log(spec.items)
	}

	onunload() {
		// Clean up any resources when the plugin is disabled
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		document
			.querySelectorAll(".phyfig-diagram")
			.forEach((container: HTMLElement) => {
				container.style.height = this.settings.diagramHeight;
			});
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SettingTab extends PluginSettingTab {
	plugin: PhyFigPlugin;

	constructor(app: App, plugin: PhyFigPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Diagram Height")
			.setDesc(
				"Set the default height for diagram containers (e.g., 8rem, 200px)"
			)
			.addText((text) =>
				text
					.setPlaceholder("8rem")
					.setValue(this.plugin.settings.diagramHeight)
					.onChange(async (value) => {
						this.plugin.settings.diagramHeight = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
