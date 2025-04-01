import {Point, Stroke, ShapeBox, LineShape} from '../types/drawing';
import {CONSTANTS} from '../constants/drawing';

export function strokeToPath(points: Point[]): string {
  // Convert an array of points to an SVG path data string
  if (!points.length) return '';
  const [first, ...rest] = points;
  let d = `M ${first.x} ${first.y}`;
  rest.forEach(p => {
    d += ` L ${p.x} ${p.y}`;
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
  // Check if (x,y) is close to (px,py) within a fixed handle radius
  return distance(x, y, px, py) < CONSTANTS.HANDLE_SIZE;
}

export function pointInPolygon(
  x: number,
  y: number,
  polygon: Point[],
): boolean {
  // Ray-casting algorithm to determine if point is inside polygon
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
  // Check if a point lies within a given shape’s area
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
      const trianglePoints: Point[] = [
        {x: shape.x + shape.width / 2, y: shape.y},
        {x: shape.x, y: shape.y + shape.height},
        {x: shape.x + shape.width, y: shape.y + shape.height},
      ];
      return pointInPolygon(point.x, point.y, trianglePoints);
    }
    default:
      return false;
  }
}

export function mergeConnectedStrokes(
  strokes: Stroke[],
): {indices: number[]; polygon: Point[]}[] {
  // Group strokes whose endpoints are near each other into connected polygons
  const groups: {indices: number[]; polygon: Point[]}[] = [];
  const visited = new Array(strokes.length).fill(false);
  const threshold = CONSTANTS.CONNECT_THRESHOLD;
  for (let i = 0; i < strokes.length; i++) {
    if (visited[i] || strokes[i].points.length === 0) continue;
    let groupIndices = [i];
    visited[i] = true;
    let polyline = [...strokes[i].points];
    let merged = true;
    while (merged) {
      merged = false;
      for (let j = 0; j < strokes.length; j++) {
        if (visited[j] || strokes[j].points.length === 0) continue;
        const candidate = strokes[j].points;
        const startPoly = polyline[0];
        const endPoly = polyline[polyline.length - 1];
        const candidateStart = candidate[0];
        const candidateEnd = candidate[candidate.length - 1];
        // Check connectivity: end of current polyline to start or end of candidate (or start of polyline to candidate end, etc.)
        if (
          distance(endPoly.x, endPoly.y, candidateStart.x, candidateStart.y) <
          threshold
        ) {
          polyline = polyline.concat(candidate.slice(1));
          visited[j] = true;
          groupIndices.push(j);
          merged = true;
        } else if (
          distance(endPoly.x, endPoly.y, candidateEnd.x, candidateEnd.y) <
          threshold
        ) {
          polyline = polyline.concat(candidate.slice(0, -1).reverse());
          visited[j] = true;
          groupIndices.push(j);
          merged = true;
        } else if (
          distance(startPoly.x, startPoly.y, candidateEnd.x, candidateEnd.y) <
          threshold
        ) {
          polyline = candidate.slice(0, -1).reverse().concat(polyline);
          visited[j] = true;
          groupIndices.push(j);
          merged = true;
        } else if (
          distance(
            startPoly.x,
            startPoly.y,
            candidateStart.x,
            candidateStart.y,
          ) < threshold
        ) {
          const reversedCandidate = [...candidate].reverse();
          polyline = reversedCandidate.slice(1).concat(polyline);
          visited[j] = true;
          groupIndices.push(j);
          merged = true;
        }
      }
    }
    // If the polyline's ends meet, snap them to exactly close the polygon
    if (
      distance(
        polyline[0].x,
        polyline[0].y,
        polyline[polyline.length - 1].x,
        polyline[polyline.length - 1].y,
      ) < threshold
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
  // Return coordinates for each corner of a shape’s bounding box
  return {
    topLeft: {x: shape.x, y: shape.y},
    topRight: {x: shape.x + shape.width, y: shape.y},
    bottomLeft: {x: shape.x, y: shape.y + shape.height},
    bottomRight: {x: shape.x + shape.width, y: shape.y + shape.height},
  };
}

export function lineBoundingBox(line: LineShape) {
  // Compute a simple bounding box for a line segment
  const minX = Math.min(line.x1, line.x2);
  const maxX = Math.max(line.x1, line.x2);
  const minY = Math.min(line.y1, line.y2);
  const maxY = Math.max(line.y1, line.y2);
  return {minX, maxX, minY, maxY};
}
