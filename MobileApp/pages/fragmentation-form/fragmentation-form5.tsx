import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StyleSheet,
  LayoutChangeEvent,
  Modal,
  Dimensions,
  GestureResponderEvent,
} from 'react-native';
import Svg, { Path, Circle, Rect, Polygon, Line as SvgLine } from 'react-native-svg';

// Example icons – adjust these imports to your project
import { ZoomIn, ZoomOut, Crop, Edit2 } from 'react-native-feather';
import EraseIcon from '../../assets/erase.svg';
import SquareIcon from '../../assets/square.svg';
import PaintIcon from '../../assets/paint.svg';
import LineIcon from '../../assets/line.svg';

// ===== TYPES & INTERFACES =====
type Tool = 'draw' | 'erase' | 'line' | 'paint' | 'shape' | null;
type ShapeType = 'rect' | 'circle' | 'triangle';

interface Point {
  x: number;
  y: number;
}

/** Strokes can also be “closed” and filled. */
interface Stroke {
  points: Point[];
  color: string;
  width: number;
  /** If user finished near start => isClosed */
  isClosed?: boolean;
  /** Fill color if closed. */
  fillColor?: string;
}

interface ShapeBox {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string; // e.g. 'none' or 'red'
}

interface LineShape {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

// ===== CONSTANTS =====
const PAGE_PADDING = 16;
const ERASE_THRESHOLD = 15;
const HANDLE_SIZE = 15;
const { width: screenWidth } = Dimensions.get('window');
const COLORS = ['red', 'blue', 'green', 'black', 'orange'];
const LINE_THICKNESS_OPTIONS = [2, 4, 6];
const CLOSE_THRESHOLD = 15; // how close the last point must be to the first point to be considered "closed"

// ===== UTILITY FUNCTIONS =====
function strokeToPath(points: Point[]): string {
  if (!points.length) return '';
  const [first, ...rest] = points;
  let d = `M ${first.x} ${first.y} `;
  rest.forEach(p => {
    d += `L ${p.x} ${p.y} `;
  });
  return d;
}

function lineBoundingBox(ln: LineShape) {
  const minX = Math.min(ln.x1, ln.x2);
  const maxX = Math.max(ln.x1, ln.x2);
  const minY = Math.min(ln.y1, ln.y2);
  const maxY = Math.max(ln.y1, ln.y2);
  return { minX, maxX, minY, maxY };
}

function distance(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x1 - x2, y1 - y2);
}

function nearPoint(x: number, y: number, px: number, py: number) {
  return distance(x, y, px, py) < HANDLE_SIZE;
}

/**
 * Ray-casting algorithm for point-in-polygon test.
 * Assumes the polygon is described by the array of points in order.
 */
function pointInPolygon(testX: number, testY: number, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const { x: xi, y: yi } = polygon[i];
    const { x: xj, y: yj } = polygon[j];

    const intersect =
      (yi > testY) !== (yj > testY) &&
      testX < ((xj - xi) * (testY - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export default function FragmentationForm4() {
  // --- TOOL & ZOOM ---
  const [activeTool, setActiveTool] = useState<Tool>(null);
  const [scale, setScale] = useState<number>(1);

  // --- COLOR & MODALS ---
  const [selectedColor, setSelectedColor] = useState<string>('red');
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showLineThicknessPicker, setShowLineThicknessPicker] = useState<boolean>(false);
  const [showShapePicker, setShowShapePicker] = useState<boolean>(false);
  const [lineThickness, setLineThickness] = useState<number>(2);

  // --- FREEHAND / LINE DRAWING ---
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [lineStartPoint, setLineStartPoint] = useState<Point | null>(null);

  // --- SHAPES ---
  const [shapes, setShapes] = useState<ShapeBox[]>([]);
  const [shapeType, setShapeType] = useState<ShapeType | null>(null);
  const [activeShapeId, setActiveShapeId] = useState<string | null>(null);

  // --- LINES ---
  const [lines, setLines] = useState<LineShape[]>([]);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);

  // --- DRAGGING STATES ---
  const [draggingShapeId, setDraggingShapeId] = useState<string | null>(null);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);
  const [draggingLineId, setDraggingLineId] = useState<string | null>(null);
  const [resizingLineEndpoint, setResizingLineEndpoint] = useState<'start' | 'end' | null>(null);

  // --- LAYOUT ---
  const [containerX, setContainerX] = useState<number>(0);
  const [containerY, setContainerY] = useState<number>(0);
  function handleContainerLayout(e: LayoutChangeEvent) {
    const { x, y } = e.nativeEvent.layout;
    setContainerX(x);
    setContainerY(y);
  }

  // --- TOOLBAR HELPERS ---
  function isActiveToolFunc(t: Tool) {
    return activeTool === t;
  }
  function zoomIn() {
    setScale(prev => prev + 0.2);
  }
  function zoomOut() {
    setScale(prev => (prev > 0.2 ? prev - 0.2 : prev));
  }

  // ===================================================================
  // ==================== DRAW / ERASE / LINE LOGIC =====================
  // ===================================================================
  function handleDrawGrant(evt: GestureResponderEvent) {
    if (draggingShapeId || draggingLineId) return;
    const { locationX, locationY } = evt.nativeEvent;
    if (activeTool === 'draw') {
      setCurrentStroke([{ x: locationX, y: locationY }]);
    } else if (activeTool === 'line') {
      setLineStartPoint({ x: locationX, y: locationY });
      setCurrentStroke([{ x: locationX, y: locationY }]);
    } else if (activeTool === 'erase') {
      handleEraseAtPoint(locationX, locationY);
    }
  }

  function handleDrawMove(evt: GestureResponderEvent) {
    if (draggingShapeId || draggingLineId) return;
    const { locationX, locationY } = evt.nativeEvent;
    if (activeTool === 'draw' && currentStroke.length) {
      setCurrentStroke(prev => [...prev, { x: locationX, y: locationY }]);
    } else if (activeTool === 'line' && lineStartPoint) {
      setCurrentStroke([{ ...lineStartPoint }, { x: locationX, y: locationY }]);
    } else if (activeTool === 'erase') {
      handleEraseAtPoint(locationX, locationY);
    }
  }

  /**
   * Called when user lifts finger after a draw or line operation.
   * This is where we detect if a freehand stroke is “closed.”
   */
  function handleDrawRelease() {
    if (draggingShapeId || draggingLineId) return;

    // ---- FREEHAND DRAW ----
    if (activeTool === 'draw' && currentStroke.length > 1) {
      const strokePoints = [...currentStroke];
      setCurrentStroke([]);

      // Check if stroke is closed
      const firstPt = strokePoints[0];
      const lastPt = strokePoints[strokePoints.length - 1];
      const closed = distance(firstPt.x, firstPt.y, lastPt.x, lastPt.y) < CLOSE_THRESHOLD;

      const newStroke: Stroke = {
        points: strokePoints,
        color: selectedColor,
        width: 3,
        isClosed: closed,
        fillColor: closed ? 'none' : undefined,
      };
      setStrokes(prev => [...prev, newStroke]);
    }

    // ---- LINE DRAW ----
    else if (activeTool === 'line' && currentStroke.length === 2) {
      const [p1, p2] = currentStroke;
      const newLine: LineShape = {
        id: Date.now().toString(),
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        color: selectedColor,
      };
      setLines(prev => [...prev, newLine]);
      setCurrentStroke([]);
      setLineStartPoint(null);
      // remain in line tool
    }
  }

  /**
   * If user is in erase mode, remove any strokes/shapes/lines near that point.
   */
  function handleEraseAtPoint(x: number, y: number) {
    setStrokes(prev =>
      prev.filter(stroke =>
        // Keep the stroke if there's NO point near (x, y) within ERASE_THRESHOLD
        !stroke.points.some(pt => distance(pt.x, pt.y, x, y) < ERASE_THRESHOLD),
      ),
    );
    setShapes(prev =>
      prev.filter(sh => !(x >= sh.x && x <= sh.x + sh.width && y >= sh.y && y <= sh.y + sh.height)),
    );
    setLines(prev =>
      prev.filter(ln => {
        const { minX, maxX, minY, maxY } = lineBoundingBox(ln);
        return !(x >= minX - 10 && x <= maxX + 10 && y >= minY - 10 && y <= maxY + 10);
      }),
    );
  }

  // ===================================================================
  // ==================== PAINT FEATURE (FILL) ==========================
  // ===================================================================
  /**
   * Attempt to paint inside a shape OR a closed stroke at (x,y).
   * Returns true if something was painted, false otherwise.
   */
  function handlePaintAtPoint(x: number, y: number): boolean {
    // 1) Check if user tapped inside any rectangle/circle/triangle shapes
    for (const sh of shapes) {
      if (
        x >= sh.x &&
        x <= sh.x + sh.width &&
        y >= sh.y &&
        y <= sh.y + sh.height
      ) {
        setShapes(prev =>
          prev.map(shape =>
            shape.id === sh.id ? { ...shape, fill: selectedColor } : shape,
          ),
        );
        setActiveShapeId(sh.id);
        return true;
      }
    }

    // 2) Check closed freehand strokes
    //    We do bounding-box check first, then a pointInPolygon test if closed.
    //    If inside => fill that stroke.
    for (let i = 0; i < strokes.length; i++) {
      const stroke = strokes[i];
      if (!stroke.isClosed) continue; // skip open strokes

      // bounding box of the stroke:
      const xs = stroke.points.map(p => p.x);
      const ys = stroke.points.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      // quick bounding box test
      if (x < minX || x > maxX || y < minY || y > maxY) {
        continue;
      }

      // deeper point-in-polygon test
      const inside = pointInPolygon(x, y, stroke.points);
      if (inside) {
        setStrokes(prev =>
          prev.map((s, idx) => {
            if (idx !== i) return s;
            return { ...s, fillColor: selectedColor };
          }),
        );
        return true;
      }
    }

    return false;
  }

  // ===================================================================
  // ==================== SHAPE CREATION & DRAGGING =====================
  // ===================================================================
  function createShape(evt: GestureResponderEvent) {
    if (!shapeType) return;
    const { locationX, locationY } = evt.nativeEvent;
    const newShape: ShapeBox = {
      id: Date.now().toString(),
      type: shapeType,
      x: locationX,
      y: locationY,
      width: 80,
      height: 80,
      fill: 'none',
    };
    setShapes(prev => [...prev, newShape]);
    setActiveShapeId(newShape.id);
    // remain in shape tool
    setShapeType(null);
  }

  function getShapeCorners(shape: ShapeBox) {
    return {
      topLeft: { x: shape.x, y: shape.y },
      topRight: { x: shape.x + shape.width, y: shape.y },
      bottomLeft: { x: shape.x, y: shape.y + shape.height },
      bottomRight: { x: shape.x + shape.width, y: shape.y + shape.height },
    };
  }

  // ===================================================================
  // ================ SHARED OVERLAY POINTER HANDLERS ==================
  // ===================================================================
  function handleOverlayStart(evt: GestureResponderEvent) {
    const { locationX, locationY } = evt.nativeEvent;

    if (activeTool === 'erase') {
      handleEraseAtPoint(locationX, locationY);
      return;
    }

    // If in paint mode, try to fill a shape or closed stroke
    if (activeTool === 'paint') {
      const painted = handlePaintAtPoint(locationX, locationY);
      if (painted) return; // if we painted something, we can stop
    }

    let found = false;

    // 1) Check shapes first
    for (const sh of shapes) {
      const minX = sh.x - HANDLE_SIZE;
      const maxX = sh.x + sh.width + HANDLE_SIZE;
      const minY = sh.y - HANDLE_SIZE;
      const maxY = sh.y + sh.height + HANDLE_SIZE;
      if (locationX >= minX && locationX <= maxX && locationY >= minY && locationY <= maxY) {
        setActiveShapeId(sh.id);
        setActiveLineId(null);
        setActiveTool('shape');
        const corners = getShapeCorners(sh);
        let cornerFound = false;
        for (const cornerName in corners) {
          const c = (corners as any)[cornerName];
          if (distance(locationX, locationY, c.x, c.y) < HANDLE_SIZE) {
            setDraggingShapeId(sh.id);
            setResizeCorner(cornerName);
            cornerFound = true;
            break;
          }
        }
        if (!cornerFound) {
          setDraggingShapeId(sh.id);
          setResizeCorner(null);
        }
        found = true;
        break;
      }
    }

    // 2) Check lines if no shape was found
    if (!found) {
      for (const ln of lines) {
        const { minX, maxX, minY, maxY } = lineBoundingBox(ln);
        if (
          locationX >= minX - 10 &&
          locationX <= maxX + 10 &&
          locationY >= minY - 10 &&
          locationY <= maxY + 10
        ) {
          // Check endpoints first
          if (nearPoint(locationX, locationY, ln.x1, ln.y1)) {
            setResizingLineEndpoint('start');
            setDraggingLineId(ln.id);
          } else if (nearPoint(locationX, locationY, ln.x2, ln.y2)) {
            setResizingLineEndpoint('end');
            setDraggingLineId(ln.id);
          } else {
            setDraggingLineId(ln.id);
            setResizingLineEndpoint(null);
          }
          setActiveLineId(ln.id);
          setActiveShapeId(null);
          if (activeTool !== 'draw') {
            setActiveTool('line');
          }
          found = true;
          break;
        }
      }
    }

    // 3) If nothing was found:
    if (!found) {
      // If currently in shape mode and we have a shapeType, create a shape
      if (activeTool === 'shape' && shapeType) {
        createShape(evt);
      }
      // If in freehand draw
      else if (activeTool === 'draw') {
        setCurrentStroke([{ x: locationX, y: locationY }]);
      }
      // If in line mode
      else if (activeTool === 'line') {
        setLineStartPoint({ x: locationX, y: locationY });
        setCurrentStroke([{ x: locationX, y: locationY }]);
      } else {
        // Tapped empty area
        setActiveShapeId(null);
        setActiveLineId(null);
        setDraggingShapeId(null);
        setResizeCorner(null);
        setDraggingLineId(null);
        setResizingLineEndpoint(null);

        // If tool is paint/shape/null, revert to null
        if (activeTool === 'paint' || activeTool === 'shape' || activeTool === null) {
          setActiveTool(null);
        }
      }
    }
  }

  function handleOverlayMove(evt: GestureResponderEvent) {
    const { locationX, locationY } = evt.nativeEvent;
    // Drag/resize shape
    if (draggingShapeId) {
      setShapes(prev =>
        prev.map(sh => {
          if (sh.id !== draggingShapeId) return sh;
          const oldRight = sh.x + sh.width;
          const oldBottom = sh.y + sh.height;
          if (resizeCorner) {
            // resizing
            let newX = sh.x,
              newY = sh.y,
              newW = sh.width,
              newH = sh.height;
            if (resizeCorner === 'topLeft') {
              newX = locationX;
              newY = locationY;
              newW = oldRight - locationX;
              newH = oldBottom - locationY;
            } else if (resizeCorner === 'topRight') {
              newY = locationY;
              newW = locationX - sh.x;
              newH = oldBottom - locationY;
            } else if (resizeCorner === 'bottomLeft') {
              newX = locationX;
              newW = oldRight - locationX;
              newH = locationY - sh.y;
            } else if (resizeCorner === 'bottomRight') {
              newW = locationX - sh.x;
              newH = locationY - sh.y;
            }
            if (newW < 10) newW = 10;
            if (newH < 10) newH = 10;
            return { ...sh, x: newX, y: newY, width: newW, height: newH };
          } else {
            // dragging whole shape
            return {
              ...sh,
              x: locationX - sh.width / 2,
              y: locationY - sh.height / 2,
            };
          }
        }),
      );
      return;
    }
    // Drag/resize line
    if (draggingLineId) {
      setLines(prev =>
        prev.map(ln => {
          if (ln.id !== draggingLineId) return ln;
          if (resizingLineEndpoint === 'start') {
            return { ...ln, x1: locationX, y1: locationY };
          } else if (resizingLineEndpoint === 'end') {
            return { ...ln, x2: locationX, y2: locationY };
          } else {
            // dragging whole line
            const midX = (ln.x1 + ln.x2) / 2;
            const midY = (ln.y1 + ln.y2) / 2;
            const diffX = locationX - midX;
            const diffY = locationY - midY;
            return {
              ...ln,
              x1: ln.x1 + diffX,
              y1: ln.y1 + diffY,
              x2: ln.x2 + diffX,
              y2: ln.y2 + diffY,
            };
          }
        }),
      );
      return;
    }
    // Continue freehand or line creation
    if (activeTool === 'draw' && currentStroke.length) {
      setCurrentStroke(prev => [...prev, { x: locationX, y: locationY }]);
      return;
    }
    if (activeTool === 'line' && lineStartPoint) {
      setCurrentStroke([{ ...lineStartPoint }, { x: locationX, y: locationY }]);
      return;
    }
    if (activeTool === 'erase') {
      handleEraseAtPoint(locationX, locationY);
    }
  }

  function handleOverlayEnd() {
    // End a freehand stroke or line stroke
    if (activeTool === 'draw' && currentStroke.length > 1) {
      const strokePoints = [...currentStroke];
      setCurrentStroke([]);

      // Check if stroke is closed
      const firstPt = strokePoints[0];
      const lastPt = strokePoints[strokePoints.length - 1];
      const closed = distance(firstPt.x, firstPt.y, lastPt.x, lastPt.y) < CLOSE_THRESHOLD;

      const newStroke: Stroke = {
        points: strokePoints,
        color: selectedColor,
        width: 3,
        isClosed: closed,
        fillColor: closed ? 'none' : undefined,
      };
      setStrokes(prev => [...prev, newStroke]);
    } else if (activeTool === 'line' && currentStroke.length === 2) {
      const [p1, p2] = currentStroke;
      const newLine: LineShape = {
        id: Date.now().toString(),
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        color: selectedColor,
      };
      setLines(prev => [...prev, newLine]);
      setCurrentStroke([]);
      setLineStartPoint(null);
    }

    // Clean up dragging/resizing
    setDraggingShapeId(null);
    setResizeCorner(null);
    setDraggingLineId(null);
    setResizingLineEndpoint(null);
  }

  // ===================================================================
  // ==================== RENDERING HELPERS =============================
  // ===================================================================
  function renderStrokes() {
    return strokes.map((stroke, i) => {
      const path = strokeToPath(stroke.points);
      return (
        <Path
          key={'st' + i}
          d={path}
          stroke={stroke.color}
          strokeWidth={stroke.width}
          fill={stroke.isClosed ? (stroke.fillColor || 'none') : 'none'}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    });
  }

  function renderCurrentStroke() {
    if (!currentStroke.length) return null;
    // If user is drawing a line
    if (activeTool === 'line' && currentStroke.length === 2) {
      const [p1, p2] = currentStroke;
      return (
        <SvgLine
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke={selectedColor}
          strokeWidth={lineThickness}
        />
      );
    }
    // If user is freehand drawing
    if (activeTool === 'draw') {
      const d = strokeToPath(currentStroke);
      return (
        <Path
          d={d}
          stroke={selectedColor}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }
    return null;
  }

  function renderShapes() {
    return shapes.map(sh => {
      const isActive = sh.id === activeShapeId;
      const commonProps = {
        fill: sh.fill,
        stroke: 'black',
        strokeWidth: 2,
        pointerEvents: 'none' as const,
      };

      let shapeElem: React.ReactNode;
      if (sh.type === 'rect') {
        shapeElem = (
          <Rect
            key={sh.id}
            x={sh.x}
            y={sh.y}
            width={sh.width}
            height={sh.height}
            {...commonProps}
          />
        );
      } else if (sh.type === 'circle') {
        const r = Math.min(sh.width, sh.height) / 2;
        shapeElem = (
          <Circle
            key={sh.id}
            cx={sh.x + sh.width / 2}
            cy={sh.y + sh.height / 2}
            r={r}
            {...commonProps}
          />
        );
      } else {
        // Triangle
        const x1 = sh.x + sh.width / 2,
          y1 = sh.y;
        const x2 = sh.x,
          y2 = sh.y + sh.height;
        const x3 = sh.x + sh.width,
          y3 = sh.y + sh.height;
        shapeElem = (
          <Polygon
            key={sh.id}
            points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`}
            {...commonProps}
          />
        );
      }

      return (
        <React.Fragment key={sh.id}>
          {shapeElem}
          {isActive && (
            <>
              {/* Show resize handles if active */}
              <Circle
                cx={sh.x}
                cy={sh.y}
                r={HANDLE_SIZE / 2}
                fill="gray"
                pointerEvents="none"
              />
              <Circle
                cx={sh.x + sh.width}
                cy={sh.y}
                r={HANDLE_SIZE / 2}
                fill="gray"
                pointerEvents="none"
              />
              <Circle
                cx={sh.x}
                cy={sh.y + sh.height}
                r={HANDLE_SIZE / 2}
                fill="gray"
                pointerEvents="none"
              />
              <Circle
                cx={sh.x + sh.width}
                cy={sh.y + sh.height}
                r={HANDLE_SIZE / 2}
                fill="gray"
                pointerEvents="none"
              />
            </>
          )}
        </React.Fragment>
      );
    });
  }

  function renderLines() {
    return lines.map(ln => {
      const isActive = ln.id === activeLineId;
      return (
        <React.Fragment key={ln.id}>
          <SvgLine
            x1={ln.x1}
            y1={ln.y1}
            x2={ln.x2}
            y2={ln.y2}
            stroke={ln.color}
            strokeWidth={lineThickness}
            pointerEvents="none"
          />
          {isActive && (
            <>
              <Circle
                cx={ln.x1}
                cy={ln.y1}
                r={HANDLE_SIZE / 2}
                fill="gray"
                pointerEvents="none"
              />
              <Circle
                cx={ln.x2}
                cy={ln.y2}
                r={HANDLE_SIZE / 2}
                fill="gray"
                pointerEvents="none"
              />
            </>
          )}
        </React.Fragment>
      );
    });
  }

  // ===================================================================
  // ===================== COMPONENT RENDER =============================
  // ===================================================================
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.pageContainer}>
        {/* Toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.iconButton} onPress={zoomIn}>
            <ZoomIn stroke="#666" width={20} height={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={zoomOut}>
            <ZoomOut stroke="#666" width={20} height={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, isActiveToolFunc('erase') && styles.activeIcon]}
            onPress={() => setActiveTool(activeTool === 'erase' ? null : 'erase')}
          >
            <EraseIcon width={20} height={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, isActiveToolFunc('shape') && styles.activeIcon]}
            onPress={() => {
              if (activeTool === 'shape') {
                setActiveTool(null);
              } else {
                setActiveTool('shape');
                setShowShapePicker(true);
              }
            }}
          >
            <SquareIcon width={20} height={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => {}}>
            <Crop stroke="#666" width={20} height={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, isActiveToolFunc('paint') && styles.activeIcon]}
            onPress={() => setActiveTool(activeTool === 'paint' ? null : 'paint')}
          >
            <PaintIcon width={20} height={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, isActiveToolFunc('line') && styles.activeIcon]}
            onPress={() => {
              if (activeTool === 'line') {
                setActiveTool(null);
              } else {
                setActiveTool('line');
                setShowLineThicknessPicker(true);
              }
            }}
          >
            <LineIcon width={20} height={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, isActiveToolFunc('draw') && styles.activeIcon]}
            onPress={() => {
              if (activeTool === 'draw') {
                setActiveTool(null);
              } else {
                setActiveTool('draw');
                setShowColorPicker(true);
              }
            }}
          >
            <Edit2 stroke="#666" width={20} height={20} />
          </TouchableOpacity>
        </View>

        {/* Main content area */}
        <View style={styles.imageArea} onLayout={handleContainerLayout}>
          <View style={styles.fixedContainer}>
            <View style={{ flex: 1, transform: [{ scale }] }}>
              <Image
                source={require('../../public/assets/batu.png')}
                style={styles.image}
                resizeMode="contain"
              />
              {/* Single overlay handling all pointer events */}
              <View
                style={StyleSheet.absoluteFill}
                pointerEvents="auto"
                onStartShouldSetResponder={() => true}
                onResponderGrant={handleOverlayStart}
                onResponderMove={handleOverlayMove}
                onResponderRelease={handleOverlayEnd}
              >
                <Svg style={StyleSheet.absoluteFill}>
                  {renderStrokes()}
                  {renderShapes()}
                  {renderLines()}
                  {renderCurrentStroke()}
                </Svg>
              </View>
            </View>
          </View>
        </View>

        {/* Next Button */}
        <View style={styles.nextButtonContainer}>
          <TouchableOpacity style={styles.nextButton} onPress={() => {}}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Color Picker Modal */}
      <Modal visible={showColorPicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>Pilih Warna:</Text>
            <View style={styles.colorPickerRow}>
              {COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => {
                    setSelectedColor(c);
                    setShowColorPicker(false);
                    setActiveTool('draw'); // default back to draw
                  }}
                >
                  <View style={[styles.colorCircle, { backgroundColor: c }]} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowColorPicker(false)} style={{ marginTop: 16 }}>
              <Text style={{ color: 'blue' }}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Line Thickness Modal */}
      <Modal visible={showLineThicknessPicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>Pilih Ketebalan Garis:</Text>
            {LINE_THICKNESS_OPTIONS.map(t => (
              <TouchableOpacity
                key={t}
                onPress={() => {
                  setLineThickness(t);
                  setShowLineThicknessPicker(false);
                  setActiveTool('line');
                }}
              >
                <Text style={{ margin: 8 }}>{t}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShowLineThicknessPicker(false)}
              style={{ marginTop: 16 }}
            >
              <Text style={{ color: 'blue' }}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Shape Picker Modal */}
      <Modal visible={showShapePicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>Pilih Bentuk:</Text>
            {(['rect', 'circle', 'triangle'] as ShapeType[]).map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => {
                  setShapeType(type);
                  setActiveTool('shape');
                  setShowShapePicker(false);
                }}
              >
                <Text style={{ margin: 8 }}>{type}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowShapePicker(false)} style={{ marginTop: 16 }}>
              <Text style={{ color: 'blue' }}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ======================= STYLES =========================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  pageContainer: { flex: 1, paddingHorizontal: PAGE_PADDING },
  toolbar: {
    marginTop: 20,
    backgroundColor: '#ffe4e6',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: { padding: 8 },
  activeIcon: { backgroundColor: 'rgba(0,255,0,0.2)', borderRadius: 8 },
  imageArea: { flex: 1, marginTop: 20 },
  fixedContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  nextButtonContainer: { flex: 0.5, justifyContent: 'flex-end', paddingBottom: 16 },
  nextButton: { backgroundColor: 'green', borderRadius: 8, padding: 12, alignItems: 'center' },
  nextButtonText: { color: 'white', fontWeight: '500' },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  colorPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 8,
  },
  colorCircle: { width: 40, height: 40, borderRadius: 20, marginHorizontal: 8 },
});
