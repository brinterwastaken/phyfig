export interface DiagramSpec {
	scale: [number, number];
	hideDots?: boolean;
	items?: any;
}

export interface Point {
	name: string;
	x: number;
	y: number;
}
