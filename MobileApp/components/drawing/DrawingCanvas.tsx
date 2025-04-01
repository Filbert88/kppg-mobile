import React, {useState, useMemo, useEffect} from 'react';
import {
  View,
  PanResponder,
  StyleSheet,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import Svg, {Path, Line, Rect, Circle} from 'react-native-svg';

interface Point {
  x: number;
  y: number;
}

interface Shape {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}

interface LineType {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeColor: string;
  strokeWidth: number;
}

interface DrawingCanvasProps {
  canvasWidth: number;
  canvasHeight: number;
  activeTool: string | null; // "draw", "line", "shape", "fill", or null (for selection)
  selectedColor: string;
  lineThickness: number;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

// Returns true if point lies within a shape's bounding box.
const isPointInShape = (point: Point, shape: Shape) => {
  return (
    point.x >= shape.x &&
    point.x <= shape.x + shape.width &&
    point.y >= shape.y &&
    point.y <= shape.y + shape.height
  );
};

// Returns an object with each corner's coordinates.
const shapeCorners = (shape: Shape) => ({
  topLeft: {x: shape.x, y: shape.y},
  topRight: {x: shape.x + shape.width, y: shape.y},
  bottomLeft: {x: shape.x, y: shape.y + shape.height},
  bottomRight: {x: shape.x + shape.width, y: shape.y + shape.height},
});

// Euclidean distance between two points.
const distance = (p1: Point, p2: Point) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

// Returns true if two points are within threshold.
const isPointNear = (p1: Point, p2: Point, threshold = 10) =>
  distance(p1, p2) < threshold;

// Returns distance from a point to a line segment.
const distanceToLine = (point: Point, line: LineType) => {
  const {x, y} = point;
  const {x1, y1, x2, y2} = line;
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq !== 0) param = dot / len_sq;
  let xx, yy;
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  return Math.hypot(x - xx, y - yy);
};

type SelectedElement = {type: 'shape' | 'line'; id: string} | null;
type DragMode = 'move' | 'resize' | null;

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  canvasWidth,
  canvasHeight,
  activeTool,
  selectedColor,
  lineThickness,
}) => {
  // Freehand drawing state.
  const [freehandPaths, setFreehandPaths] = useState<
    Array<{color: string; width: number; d: string}>
  >([]);
  const [currentFreehandPoints, setCurrentFreehandPoints] = useState<Point[]>(
    [],
  );

  // Finished shapes and lines.
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [lines, setLines] = useState<LineType[]>([]);

  // Currently drawn element.
  const [currentLine, setCurrentLine] = useState<{
    start: Point;
    end: Point;
  } | null>(null);
  const [currentShape, setCurrentShape] = useState<{
    start: Point;
    end: Point;
  } | null>(null);

  // Selection state for dragging/resizing.
  const [selectedElement, setSelectedElement] = useState<SelectedElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [resizeCorner, setResizeCorner] = useState<
    'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | null
  >(null);
  // For moving/resizing, store initial touch position and element state.
  const [initialTouch, setInitialTouch] = useState<Point | null>(null);
  const [initialShapeState, setInitialShapeState] = useState<Shape | null>(
    null,
  );
  const [initialLineState, setInitialLineState] = useState<LineType | null>(
    null,
  );

  // Helper: Create freehand path string.
  const createPathFromPoints = (points: Point[]): string => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  };

  // Re-create PanResponder when dependencies change.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          const {locationX, locationY} = evt.nativeEvent;
          const point: Point = {x: locationX, y: locationY};

          // If activeTool is "fill", perform fill on the tapped shape.
          if (activeTool === 'fill') {
            const hitShape = shapes.find(s => isPointInShape(point, s));
            if (hitShape) {
              setShapes(prev =>
                prev.map(s =>
                  s.id === hitShape.id ? {...s, fillColor: selectedColor} : s,
                ),
              );
            }
            return;
          }

          // If a creation tool is active.
          if (activeTool === 'draw') {
            setCurrentFreehandPoints([point]);
          } else if (activeTool === 'line') {
            setCurrentLine({start: point, end: point});
          } else if (activeTool === 'shape') {
            setCurrentShape({start: point, end: point});
          } else if (activeTool === null) {
            // Selection mode: check shapes first.
            const hitShape = shapes.find(s => isPointInShape(point, s));
            if (hitShape) {
              const corners = shapeCorners(hitShape);
              let foundCorner:
                | 'topLeft'
                | 'topRight'
                | 'bottomLeft'
                | 'bottomRight'
                | null = null;
              for (const key in corners) {
                if (isPointNear(point, corners[key as keyof typeof corners])) {
                  foundCorner = key as
                    | 'topLeft'
                    | 'topRight'
                    | 'bottomLeft'
                    | 'bottomRight';
                  break;
                }
              }
              setSelectedElement({type: 'shape', id: hitShape.id});
              setInitialTouch(point);
              setInitialShapeState(hitShape);
              setDragMode(foundCorner ? 'resize' : 'move');
              setResizeCorner(foundCorner);
              return;
            }
            // Otherwise, check lines.
            const hitLine = lines.find(l => distanceToLine(point, l) < 10);
            if (hitLine) {
              setSelectedElement({type: 'line', id: hitLine.id});
              setInitialTouch(point);
              setInitialLineState(hitLine);
              setDragMode('move');
              return;
            }
            // If nothing is hit, deselect.
            setSelectedElement(null);
            setDragMode(null);
          }
        },
        onPanResponderMove: (
          evt: GestureResponderEvent,
          gestureState: PanResponderGestureState,
        ) => {
          const {locationX, locationY} = evt.nativeEvent;
          const point: Point = {x: locationX, y: locationY};

          if (activeTool === 'draw') {
            setCurrentFreehandPoints(prev => [...prev, point]);
          } else if (activeTool === 'line' && currentLine) {
            setCurrentLine({start: currentLine.start, end: point});
          } else if (activeTool === 'shape' && currentShape) {
            setCurrentShape({start: currentShape.start, end: point});
          } else if (
            activeTool === null &&
            selectedElement &&
            dragMode === 'move' &&
            initialTouch
          ) {
            const dx = point.x - initialTouch.x;
            const dy = point.y - initialTouch.y;
            if (selectedElement.type === 'shape' && initialShapeState) {
              setShapes(prev =>
                prev.map(s =>
                  s.id === selectedElement.id
                    ? {
                        ...s,
                        x: initialShapeState.x + dx,
                        y: initialShapeState.y + dy,
                      }
                    : s,
                ),
              );
            } else if (selectedElement.type === 'line' && initialLineState) {
              setLines(prev =>
                prev.map(l =>
                  l.id === selectedElement.id
                    ? {
                        ...l,
                        x1: initialLineState.x1 + dx,
                        y1: initialLineState.y1 + dy,
                        x2: initialLineState.x2 + dx,
                        y2: initialLineState.y2 + dy,
                      }
                    : l,
                ),
              );
            }
          } else if (
            activeTool === null &&
            selectedElement &&
            dragMode === 'resize'
          ) {
            if (
              selectedElement.type === 'shape' &&
              initialShapeState &&
              resizeCorner
            ) {
              setShapes(prev =>
                prev.map(s => {
                  if (s.id !== selectedElement.id) return s;
                  let newShape = {...s};
                  switch (resizeCorner) {
                    case 'topLeft':
                      newShape.width = s.x + s.width - point.x;
                      newShape.height = s.y + s.height - point.y;
                      newShape.x = point.x;
                      newShape.y = point.y;
                      break;
                    case 'topRight':
                      newShape.width = point.x - s.x;
                      newShape.height = s.y + s.height - point.y;
                      newShape.y = point.y;
                      break;
                    case 'bottomLeft':
                      newShape.width = s.x + s.width - point.x;
                      newShape.height = point.y - s.y;
                      newShape.x = point.x;
                      break;
                    case 'bottomRight':
                      newShape.width = point.x - s.x;
                      newShape.height = point.y - s.y;
                      break;
                    default:
                      break;
                  }
                  return newShape;
                }),
              );
            } else if (
              activeTool === null &&
              selectedElement &&
              dragMode === 'resize' &&
              selectedElement.type === 'line' &&
              initialLineState
            ) {
              // For lines, allow resizing endpoints if near one of them.
              if (
                isPointNear(point, {
                  x: initialLineState.x1,
                  y: initialLineState.y1,
                })
              ) {
                setLines(prev =>
                  prev.map(l =>
                    l.id === selectedElement.id
                      ? {...l, x1: point.x, y1: point.y}
                      : l,
                  ),
                );
              } else if (
                isPointNear(point, {
                  x: initialLineState.x2,
                  y: initialLineState.y2,
                })
              ) {
                setLines(prev =>
                  prev.map(l =>
                    l.id === selectedElement.id
                      ? {...l, x2: point.x, y2: point.y}
                      : l,
                  ),
                );
              }
            }
          }
        },
        onPanResponderRelease: () => {
          if (activeTool === 'draw') {
            const pathData = createPathFromPoints(currentFreehandPoints);
            if (pathData) {
              setFreehandPaths(prev => [
                ...prev,
                {color: selectedColor, width: lineThickness, d: pathData},
              ]);
            }
            setCurrentFreehandPoints([]);
          } else if (activeTool === 'line' && currentLine) {
            const newLine: LineType = {
              id: generateId(),
              x1: currentLine.start.x,
              y1: currentLine.start.y,
              x2: currentLine.end.x,
              y2: currentLine.end.y,
              strokeColor: selectedColor,
              strokeWidth: lineThickness,
            };
            setLines(prev => [...prev, newLine]);
            setCurrentLine(null);
          } else if (activeTool === 'shape' && currentShape) {
            const {start, end} = currentShape;
            const x = Math.min(start.x, end.x);
            const y = Math.min(start.y, end.y);
            const width = Math.abs(start.x - end.x);
            const height = Math.abs(start.y - end.y);
            const newShape: Shape = {
              id: generateId(),
              x,
              y,
              width,
              height,
              fillColor: 'transparent',
              strokeColor: selectedColor,
              strokeWidth: lineThickness,
            };
            setShapes(prev => [...prev, newShape]);
            setCurrentShape(null);
          }
          // Reset selection and drag modes.
          setSelectedElement(null);
          setDragMode(null);
          setResizeCorner(null);
          setInitialTouch(null);
          setInitialShapeState(null);
          setInitialLineState(null);
        },
      }),
    [
      activeTool,
      selectedColor,
      lineThickness,
      currentFreehandPoints,
      currentLine,
      currentShape,
      shapes,
      lines,
      selectedElement,
      dragMode,
      resizeCorner,
      initialTouch,
      initialShapeState,
      initialLineState,
    ],
  );

  return (
    <View
      style={[styles.container, {width: canvasWidth, height: canvasHeight}]}
      {...panResponder.panHandlers}>
      <Svg width={canvasWidth} height={canvasHeight}>
        {/* Render freehand drawing */}
        {freehandPaths.map((p, idx) => (
          <Path
            key={`freehand-${idx}`}
            d={p.d}
            stroke={p.color}
            strokeWidth={p.width}
            fill="none"
            strokeLinecap="round"
          />
        ))}
        {activeTool === 'draw' && currentFreehandPoints.length > 0 && (
          <Path
            d={createPathFromPoints(currentFreehandPoints)}
            stroke={selectedColor}
            strokeWidth={lineThickness}
            fill="none"
            strokeLinecap="round"
          />
        )}
        {/* Render line while drawing */}
        {activeTool === 'line' && currentLine && (
          <Line
            x1={currentLine.start.x}
            y1={currentLine.start.y}
            x2={currentLine.end.x}
            y2={currentLine.end.y}
            stroke={selectedColor}
            strokeWidth={lineThickness}
          />
        )}
        {/* Render shape while drawing */}
        {activeTool === 'shape' && currentShape && (
          <Rect
            x={Math.min(currentShape.start.x, currentShape.end.x)}
            y={Math.min(currentShape.start.y, currentShape.end.y)}
            width={Math.abs(currentShape.start.x - currentShape.end.x)}
            height={Math.abs(currentShape.start.y - currentShape.end.y)}
            stroke={selectedColor}
            strokeWidth={lineThickness}
            fill="transparent"
          />
        )}
        {/* Render finalized shapes */}
        {shapes.map(s => (
          <Rect
            key={s.id}
            x={s.x}
            y={s.y}
            width={s.width}
            height={s.height}
            stroke={s.strokeColor}
            strokeWidth={s.strokeWidth}
            fill={s.fillColor}
          />
        ))}
        {/* Render finalized lines */}
        {lines.map(l => (
          <Line
            key={l.id}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke={l.strokeColor}
            strokeWidth={l.strokeWidth}
          />
        ))}
        {/* Render selection handles */}
        {selectedElement &&
          selectedElement.type === 'shape' &&
          shapes
            .filter(s => s.id === selectedElement.id)
            .map(s => {
              const corners = shapeCorners(s);
              return (
                <React.Fragment key={`handles-${s.id}`}>
                  <Circle
                    cx={corners.topLeft.x}
                    cy={corners.topLeft.y}
                    r={5}
                    fill="blue"
                  />
                  <Circle
                    cx={corners.topRight.x}
                    cy={corners.topRight.y}
                    r={5}
                    fill="blue"
                  />
                  <Circle
                    cx={corners.bottomLeft.x}
                    cy={corners.bottomLeft.y}
                    r={5}
                    fill="blue"
                  />
                  <Circle
                    cx={corners.bottomRight.x}
                    cy={corners.bottomRight.y}
                    r={5}
                    fill="blue"
                  />
                </React.Fragment>
              );
            })}
        {selectedElement &&
          selectedElement.type === 'line' &&
          lines
            .filter(l => l.id === selectedElement.id)
            .map(l => (
              <React.Fragment key={`line-handles-${l.id}`}>
                <Circle cx={l.x1} cy={l.y1} r={5} fill="blue" />
                <Circle cx={l.x2} cy={l.y2} r={5} fill="blue" />
              </React.Fragment>
            ))}
      </Svg>
    </View>
  );
};

export default DrawingCanvas;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.001)', // nearly transparent for hit testing
  },
});
