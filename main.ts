import {
	App,
	Modal,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

import { PluginSettings } from "./types/settings";
import { parseDiagramSpec } from "parsing";
import { renderDiagram } from "render";

// Remember to rename these classes and interfaces!

const DEFAULT_SETTINGS: PluginSettings = {
	diagramHeight: "16rem",
};

export default class PhyFigPlugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();
		// Register the markdown processor for phyfig code blocks
		this.registerMarkdownCodeBlockProcessor("phyfig", (source, el, ctx) => {
			// Create a container for our diagram
			const container = el.createDiv({ cls: "phyfig-diagram" });
			try {
				// Parse the source code
				const diagramSpec = parseDiagramSpec(source);
				// Render the diagram
				renderDiagram(diagramSpec, container, this.settings);
			} catch (error) {
				container.style.padding = '1rem'
				container.style.color = "var(--text-error)";
				container.setText("Error rendering diagram: " + error.message);
			}
		});

		this.addSettingTab(new SettingTab(this.app, this));
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
