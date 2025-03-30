import {Point, Stroke, ShapeBox} from '../types/drawing';
import {CONSTANTS} from '../constants/drawing';
const CONNECT_THRESHOLD = 20;
export function strokeToPath(points: Point[]): string {
  if (!points.length) return '';
  const [first, ...rest] = points;
  let d = `M ${first.x} ${first.y} `;
  rest.forEach(p => {
    d += `L ${p.x} ${p.y} `;
  });
  return d;
}

export function distance(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function nearPoint(
  x: number,
  y: number,
  px: number,
  py: number,
): boolean {
  return distance(x, y, px, py) < CONSTANTS.HANDLE_SIZE;
}

export function pointInPolygon(
  x: number,
  y: number,
  polygon: Point[],
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
export function isPointInShape(point: Point, shape: ShapeBox): boolean {
  switch (shape.type) {
    case 'rect':
      return (
        point.x >= shape.x &&
        point.x <= shape.x + shape.width &&
        point.y >= shape.y &&
        point.y <= shape.y + shape.height
      );

    case 'circle': {
      const centerX = shape.x + shape.width / 2;
      const centerY = shape.y + shape.height / 2;
      const radius = Math.min(shape.width, shape.height) / 2;
      return distance(point.x, point.y, centerX, centerY) <= radius;
    }

    case 'triangle': {
      const points = [
        {x: shape.x + shape.width / 2, y: shape.y},
        {x: shape.x, y: shape.y + shape.height},
        {x: shape.x + shape.width, y: shape.y + shape.height},
      ];
      return pointInPolygon(point.x, point.y, points);
    }

    default:
      return false;
  }
}

export function mergeConnectedStrokes(
  strokes: Stroke[],
): {indices: number[]; polygon: Point[]}[] {
  const groups: {indices: number[]; polygon: Point[]}[] = [];
  const visited = new Array(strokes.length).fill(false);

  for (let i = 0; i < strokes.length; i++) {
    if (visited[i]) continue;
    let groupIndices = [i];
    visited[i] = true;
    let polyline = strokes[i].points.slice();
    let merged = true;

    while (merged) {
      merged = false;
      for (let j = 0; j < strokes.length; j++) {
        if (visited[j]) continue;
        const candidate = strokes[j].points;
        if (candidate.length === 0) continue;

        const startPoly = polyline[0];
        const endPoly = polyline[polyline.length - 1];
        const candidateStart = candidate[0];
        const candidateEnd = candidate[candidate.length - 1];

        if (
          distance(endPoly.x, endPoly.y, candidateStart.x, candidateStart.y) <
          CONNECT_THRESHOLD
        ) {
          polyline = polyline.concat(candidate.slice(1));
          visited[j] = true;
          groupIndices.push(j);
          merged = true;
        } else if (
          distance(endPoly.x, endPoly.y, candidateEnd.x, candidateEnd.y) <
          CONNECT_THRESHOLD
        ) {
          polyline = polyline.concat(
            candidate.slice(0, candidate.length - 1).reverse(),
          );
          visited[j] = true;
          groupIndices.push(j);
          merged = true;
        } else if (
          distance(startPoly.x, startPoly.y, candidateEnd.x, candidateEnd.y) <
          CONNECT_THRESHOLD
        ) {
          polyline = candidate
            .slice(0, candidate.length - 1)
            .reverse()
            .concat(polyline);
          visited[j] = true;
          groupIndices.push(j);
          merged = true;
        } else if (
          distance(
            startPoly.x,
            startPoly.y,
            candidateStart.x,
            candidateStart.y,
          ) < CONNECT_THRESHOLD
        ) {
          const reversedCandidate = candidate.slice().reverse();
          polyline = reversedCandidate.slice(1).concat(polyline);
          visited[j] = true;
          groupIndices.push(j);
          merged = true;
        }
      }
    }

    // Snapping: Jika titik pertama dan terakhir sudah dekat, samakan agar polygon dianggap tertutup
    if (
      distance(
        polyline[0].x,
        polyline[0].y,
        polyline[polyline.length - 1].x,
        polyline[polyline.length - 1].y,
      ) < CONNECT_THRESHOLD
    ) {
      polyline[polyline.length - 1] = polyline[0];
    }

    groups.push({indices: groupIndices, polygon: polyline});
  }
  return groups;
}


export function getShapeCorners(shape: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  return {
    topLeft: {x: shape.x, y: shape.y},
    topRight: {x: shape.x + shape.width, y: shape.y},
    bottomLeft: {x: shape.x, y: shape.y + shape.height},
    bottomRight: {x: shape.x + shape.width, y: shape.y + shape.height},
  };
}

export function lineBoundingBox(line: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) {
  return {
    minX: Math.min(line.x1, line.x2),
    maxX: Math.max(line.x1, line.x2),
    minY: Math.min(line.y1, line.y2),
    maxY: Math.max(line.y1, line.y2),
  };
}

// Flood fill algorithm for the paint tool
export function floodFill(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  startX: number,
  startY: number,
  fillColor: number[],
): Uint8ClampedArray {
  const newImageData = new Uint8ClampedArray(imageData);
  const targetColor = getPixelColor(imageData, width, startX, startY);
  const fillColorRGBA = [fillColor[0], fillColor[1], fillColor[2], 255]; // Full alpha

  // Don't fill if colors are the same
  if (colorsMatch(targetColor, fillColorRGBA)) {
    return newImageData;
  }

  const pixelsToCheck = [{x: startX, y: startY}];
  const tolerance = CONSTANTS.FILL_TOLERANCE;

  while (pixelsToCheck.length > 0) {
    const {x, y} = pixelsToCheck.pop()!;

    if (x < 0 || y < 0 || x >= width || y >= height) {
      continue;
    }

    const currentColor = getPixelColor(newImageData, width, x, y);

    if (!colorWithinTolerance(currentColor, targetColor, tolerance)) {
      continue;
    }

    setPixelColor(newImageData, width, x, y, fillColorRGBA);

    pixelsToCheck.push({x: x + 1, y});
    pixelsToCheck.push({x: x - 1, y});
    pixelsToCheck.push({x, y: y + 1});
    pixelsToCheck.push({x, y: y - 1});
  }

  return newImageData;
}

function getPixelColor(
  imageData: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
): number[] {
  const index = (y * width + x) * 4;
  return [
    imageData[index],
    imageData[index + 1],
    imageData[index + 2],
    imageData[index + 3],
  ];
}

function setPixelColor(
  imageData: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
  color: number[],
): void {
  const index = (y * width + x) * 4;
  imageData[index] = color[0];
  imageData[index + 1] = color[1];
  imageData[index + 2] = color[2];
  imageData[index + 3] = color[3];
}

function colorsMatch(a: number[], b: number[]): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

function colorWithinTolerance(
  a: number[],
  b: number[],
  tolerance: number,
): boolean {
  const dr = Math.abs(a[0] - b[0]);
  const dg = Math.abs(a[1] - b[1]);
  const db = Math.abs(a[2] - b[2]);
  const da = Math.abs(a[3] - b[3]);

  return (
    dr <= tolerance && dg <= tolerance && db <= tolerance && da <= tolerance
  );
}

// Convert hex color to RGB array
export function hexToRgb(hex: string): number[] {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return [r, g, b];
}

export function isPolygonClosedByPerimeter(polygon: Point[]): boolean {
  if (polygon.length < 3) return false;

  // Calculate the total perimeter
  let perimeter = 0;
  for (let i = 0; i < polygon.length - 1; i++) {
    perimeter += distance(
      polygon[i].x,
      polygon[i].y,
      polygon[i + 1].x,
      polygon[i + 1].y,
    );
  }
  // Also add distance between last and first to close the loop
  perimeter += distance(
    polygon[polygon.length - 1].x,
    polygon[polygon.length - 1].y,
    polygon[0].x,
    polygon[0].y,
  );

  // Decide on some fraction of the perimeter as the closure threshold
  const closureFraction = 0.05; // e.g., 5% of perimeter
  const closureThreshold = perimeter * closureFraction;

  // Distance between first and last points
  const firstPoint = polygon[0];
  const lastPoint = polygon[polygon.length - 1];
  const dist = distance(firstPoint.x, firstPoint.y, lastPoint.x, lastPoint.y);

  return dist < closureThreshold;
}