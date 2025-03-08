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

export interface Line {
	name: string;
	start: Point;
	end: Point;
}
