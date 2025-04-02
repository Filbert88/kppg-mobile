export type Tool =
  | 'draw'
  | 'erase'
  | 'shape'
  | 'line'
  | 'paint'
  | 'crop'
  | null;

export type ShapeType = 'rect' | 'circle' | 'triangle';

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id?: string;
  points: Point[];
  color: string;
  width: number;
  isClosed: boolean;
  fillColor?: string;
}

export interface ShapeBox {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
}

export interface LineShape {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}
