// SvgOverlay.tsx
import React, {useState, useMemo} from 'react';
import {
  View,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  StyleSheet,
} from 'react-native';
import Svg, {Rect, Line, Circle} from 'react-native-svg';

export interface Shape {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}

export interface LineType {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeColor: string;
  strokeWidth: number;
}

type Tool = 'draw' | 'fill' | 'shape' | 'line' | null;

interface Point {
  x: number;
  y: number;
}

interface SvgOverlayProps {
  width: number;
  height: number;

  shapes: Shape[];
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>;
  lines: LineType[];
  setLines: React.Dispatch<React.SetStateAction<LineType[]>>;

  activeTool: Tool;
  selectedColor: string;
  lineThickness: number;

  /** Called if user is in fill tool, but taps outside shapes => fill pixel layer */
  onCanvasFill: (x: number, y: number) => void;

  // Let parent control pointer events
  pointerEvents?: 'auto' | 'none';
}

// Helper
const generateId = () => Math.random().toString(36).substr(2, 9);

function isPointInShape(px: number, py: number, s: Shape) {
  return px >= s.x && px <= s.x + s.width && py >= s.y && py <= s.y + s.height;
}
function shapeCorners(s: Shape) {
  return {
    topLeft: {x: s.x, y: s.y},
    topRight: {x: s.x + s.width, y: s.y},
    bottomLeft: {x: s.x, y: s.y + s.height},
    bottomRight: {x: s.x + s.width, y: s.y + s.height},
  };
}
function distance(p1: Point, p2: Point) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}
function isNear(p1: Point, p2: Point, threshold = 10) {
  return distance(p1, p2) < threshold;
}
function distanceToLine(pt: Point, line: LineType) {
  const {x, y} = pt;
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
}

type SelectedElement =
  | {type: 'shape'; id: string}
  | {type: 'line'; id: string}
  | null;
type DragMode = 'move' | 'resize' | null;
type CornerKey = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
type Endpoint = 'start' | 'end';

export default function SvgOverlay({
  width,
  height,
  shapes,
  setShapes,
  lines,
  setLines,
  activeTool,
  selectedColor,
  lineThickness,
  onCanvasFill,
  pointerEvents = 'auto',
}: SvgOverlayProps) {
  // For shape/line creation
  const [creatingShape, setCreatingShape] = useState<{
    start: Point;
    end: Point;
  } | null>(null);
  const [creatingLine, setCreatingLine] = useState<{
    start: Point;
    end: Point;
  } | null>(null);

  // Selection
  const [selectedElement, setSelectedElement] = useState<SelectedElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);

  const [resizeCorner, setResizeCorner] = useState<CornerKey | null>(null);
  const [resizeLineEndpoint, setResizeLineEndpoint] = useState<Endpoint | null>(
    null,
  );

  const [initialTouch, setInitialTouch] = useState<Point | null>(null);
  const [initialShape, setInitialShape] = useState<Shape | null>(null);
  const [initialLine, setInitialLine] = useState<LineType | null>(null);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: evt => {
          const {locationX, locationY} = evt.nativeEvent;
          const p: Point = {x: locationX, y: locationY};

          // 1) Fill tool
          if (activeTool === 'fill') {
            // Check if tapped a shape
            const shapeHit = shapes.find(s =>
              isPointInShape(locationX, locationY, s),
            );
            if (shapeHit) {
              // fill shape
              setShapes(prev =>
                prev.map(sh =>
                  sh.id === shapeHit.id
                    ? {...sh, fillColor: selectedColor}
                    : sh,
                ),
              );
            } else {
              // fill pixel layer behind
              onCanvasFill(locationX, locationY);
            }
            return;
          }

          // 2) If "shape" => start new shape
          if (activeTool === 'shape') {
            setCreatingShape({start: p, end: p});
            return;
          }

          // 3) If "line" => start new line
          if (activeTool === 'line') {
            setCreatingLine({start: p, end: p});
            return;
          }

          // 4) If activeTool===null => selection mode
          if (activeTool === null) {
            // A) Check shapes
            const shape = shapes.find(s =>
              isPointInShape(locationX, locationY, s),
            );
            if (shape) {
              // check corners
              const corners = shapeCorners(shape);
              let foundCorner: CornerKey | null = null;
              for (const key in corners) {
                if (isNear(p, corners[key as keyof typeof corners])) {
                  foundCorner = key as CornerKey;
                  break;
                }
              }
              setSelectedElement({type: 'shape', id: shape.id});
              setInitialTouch(p);
              setInitialShape(shape);
              if (foundCorner) {
                setDragMode('resize');
                setResizeCorner(foundCorner);
              } else {
                setDragMode('move');
                setResizeCorner(null);
              }
              return;
            }
            // B) Check lines
            const lineHit = lines.find(l => distanceToLine(p, l) < 10);
            if (lineHit) {
              // near endpoints?
              const nearStart = isNear(p, {x: lineHit.x1, y: lineHit.y1});
              const nearEnd = isNear(p, {x: lineHit.x2, y: lineHit.y2});
              setSelectedElement({type: 'line', id: lineHit.id});
              setInitialTouch(p);
              setInitialLine(lineHit);

              if (nearStart) {
                setDragMode('resize');
                setResizeLineEndpoint('start');
              } else if (nearEnd) {
                setDragMode('resize');
                setResizeLineEndpoint('end');
              } else {
                setDragMode('move');
                setResizeLineEndpoint(null);
              }
              return;
            }

            // If tapped nothing
            setSelectedElement(null);
            setDragMode(null);
            setResizeCorner(null);
            setResizeLineEndpoint(null);
          }
        },

        onPanResponderMove: (evt, gestureState: PanResponderGestureState) => {
          const {locationX, locationY} = evt.nativeEvent;
          const p: Point = {x: locationX, y: locationY};

          // If creating shape
          if (activeTool === 'shape' && creatingShape) {
            setCreatingShape({start: creatingShape.start, end: p});
            return;
          }
          // If creating line
          if (activeTool === 'line' && creatingLine) {
            setCreatingLine({start: creatingLine.start, end: p});
            return;
          }

          // selection
          if (activeTool === null && selectedElement && dragMode) {
            const dx = locationX - (initialTouch?.x ?? 0);
            const dy = locationY - (initialTouch?.y ?? 0);

            if (selectedElement.type === 'shape' && initialShape) {
              if (dragMode === 'move') {
                // move shape
                setShapes(prev =>
                  prev.map(sh =>
                    sh.id === selectedElement.id
                      ? {...sh, x: initialShape.x + dx, y: initialShape.y + dy}
                      : sh,
                  ),
                );
              } else if (dragMode === 'resize' && resizeCorner) {
                setShapes(prev =>
                  prev.map(sh => {
                    if (sh.id !== selectedElement.id) return sh;
                    const updated = {...sh};
                    switch (resizeCorner) {
                      case 'topLeft':
                        updated.width = sh.x + sh.width - locationX;
                        updated.height = sh.y + sh.height - locationY;
                        updated.x = locationX;
                        updated.y = locationY;
                        break;
                      case 'topRight':
                        updated.width = locationX - sh.x;
                        updated.height = sh.y + sh.height - locationY;
                        updated.y = locationY;
                        break;
                      case 'bottomLeft':
                        updated.width = sh.x + sh.width - locationX;
                        updated.height = locationY - sh.y;
                        updated.x = locationX;
                        break;
                      case 'bottomRight':
                        updated.width = locationX - sh.x;
                        updated.height = locationY - sh.y;
                        break;
                    }
                    return updated;
                  }),
                );
              }
            } else if (selectedElement.type === 'line' && initialLine) {
              if (dragMode === 'move') {
                // move entire line
                setLines(prev =>
                  prev.map(l =>
                    l.id === selectedElement.id
                      ? {
                          ...l,
                          x1: initialLine.x1 + dx,
                          y1: initialLine.y1 + dy,
                          x2: initialLine.x2 + dx,
                          y2: initialLine.y2 + dy,
                        }
                      : l,
                  ),
                );
              } else if (dragMode === 'resize' && resizeLineEndpoint) {
                setLines(prev =>
                  prev.map(l => {
                    if (l.id !== selectedElement.id) return l;
                    const updated = {...l};
                    if (resizeLineEndpoint === 'start') {
                      updated.x1 = locationX;
                      updated.y1 = locationY;
                    } else {
                      updated.x2 = locationX;
                      updated.y2 = locationY;
                    }
                    return updated;
                  }),
                );
              }
            }
          }
        },

        onPanResponderRelease: () => {
          // finalize shape creation
          if (activeTool === 'shape' && creatingShape) {
            const {start, end} = creatingShape;
            const x = Math.min(start.x, end.x);
            const y = Math.min(start.y, end.y);
            const w = Math.abs(start.x - end.x);
            const h = Math.abs(start.y - end.y);

            const newShape: Shape = {
              id: generateId(),
              x,
              y,
              width: w,
              height: h,
              fillColor: 'transparent',
              strokeColor: selectedColor,
              strokeWidth: lineThickness,
            };
            setShapes(prev => [...prev, newShape]);
            setCreatingShape(null);
          }
          // finalize line creation
          if (activeTool === 'line' && creatingLine) {
            const {start, end} = creatingLine;
            const newLine: LineType = {
              id: generateId(),
              x1: start.x,
              y1: start.y,
              x2: end.x,
              y2: end.y,
              strokeColor: selectedColor,
              strokeWidth: lineThickness,
            };
            setLines(prev => [...prev, newLine]);
            setCreatingLine(null);
          }

          // end selection
          setSelectedElement(null);
          setDragMode(null);
          setResizeCorner(null);
          setResizeLineEndpoint(null);
          setInitialTouch(null);
          setInitialShape(null);
          setInitialLine(null);
        },
      }),
    [
      activeTool,
      shapes,
      lines,
      creatingShape,
      creatingLine,
      selectedColor,
      lineThickness,
      selectedElement,
      dragMode,
      resizeCorner,
      resizeLineEndpoint,
      initialTouch,
      initialShape,
      initialLine,
    ],
  );

  // Render
  return (
    <View
      style={[styles.overlay, {width, height}]}
      pointerEvents={pointerEvents}
      {...panResponder.panHandlers}>
      <Svg width={width} height={height}>
        {/* shape being created */}
        {creatingShape && (
          <Rect
            x={Math.min(creatingShape.start.x, creatingShape.end.x)}
            y={Math.min(creatingShape.start.y, creatingShape.end.y)}
            width={Math.abs(creatingShape.start.x - creatingShape.end.x)}
            height={Math.abs(creatingShape.start.y - creatingShape.end.y)}
            stroke={selectedColor}
            strokeWidth={lineThickness}
            fill="transparent"
          />
        )}
        {/* line being created */}
        {creatingLine && (
          <Line
            x1={creatingLine.start.x}
            y1={creatingLine.start.y}
            x2={creatingLine.end.x}
            y2={creatingLine.end.y}
            stroke={selectedColor}
            strokeWidth={lineThickness}
          />
        )}

        {/* final shapes */}
        {shapes.map(s => (
          <Rect
            key={s.id}
            x={s.x}
            y={s.y}
            width={s.width}
            height={s.height}
            fill={s.fillColor}
            stroke={s.strokeColor}
            strokeWidth={s.strokeWidth}
          />
        ))}

        {/* final lines */}
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

        {/* selection handles */}
        {selectedElement &&
          selectedElement.type === 'shape' &&
          shapes
            .filter(s => s.id === selectedElement.id)
            .map(s => {
              const corners = shapeCorners(s);
              return (
                <React.Fragment key={`handles-shape-${s.id}`}>
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
              <React.Fragment key={`handles-line-${l.id}`}>
                <Circle cx={l.x1} cy={l.y1} r={5} fill="blue" />
                <Circle cx={l.x2} cy={l.y2} r={5} fill="blue" />
              </React.Fragment>
            ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'transparent',
  },
});
