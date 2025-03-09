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

// Example icons – adjust to your actual imports:
import { ZoomIn, ZoomOut, Crop, Edit2 } from 'react-native-feather';
import EraseIcon from '../../assets/erase.svg';
import SquareIcon from '../../assets/square.svg';
import PaintIcon from '../../assets/paint.svg';
import LineIcon from '../../assets/line.svg';

import Svg, { Path, Circle, Rect, Polygon, Line as SvgLine } from 'react-native-svg';

// === TOOLS & TYPES ===
type Tool = 'draw' | 'erase' | 'line' | 'paint' | 'shape' | null;
type ShapeType = 'rect' | 'circle' | 'triangle';

// For freehand strokes
interface Point {
  x: number;
  y: number;
}
interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

// For bounding box shapes (rect/circle/triangle)
interface ShapeBox {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string; // e.g. 'none' or 'red'
}

// For line shapes
interface LineShape {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

const { width: screenWidth } = Dimensions.get('window');
const PAGE_PADDING = 16;
const ERASE_THRESHOLD = 15;
const HANDLE_SIZE = 15;

// Convert freehand stroke array => single SVG path
function strokeToPath(points: Point[]): string {
  if (!points.length) return '';
  const [first, ...rest] = points;
  let d = `M ${first.x} ${first.y} `;
  rest.forEach((p) => {
    d += `L ${p.x} ${p.y} `;
  });
  return d;
}

// Example color & line width options
const COLORS = ['red', 'blue', 'green', 'black', 'orange'];
const LINE_THICKNESS_OPTIONS = [2, 4, 6];

export default function FragmentationForm4() {
  // === STATE: Active Tool & Zoom ===
  const [activeTool, setActiveTool] = useState<Tool>(null); // default no tool
  const [scale, setScale] = useState<number>(1);

  // === STATE: Color & Modals ===
  const [selectedColor, setSelectedColor] = useState<string>('red');
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showLineThicknessPicker, setShowLineThicknessPicker] = useState<boolean>(false);
  const [showShapePicker, setShowShapePicker] = useState<boolean>(false);

  // === STATE: line thickness ===
  const [lineThickness, setLineThickness] = useState<number>(2);

  // === STATE: Freehand strokes ===
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [lineStartPoint, setLineStartPoint] = useState<Point | null>(null);

  // === STATE: bounding-box shapes ===
  const [shapes, setShapes] = useState<ShapeBox[]>([]);
  const [shapeType, setShapeType] = useState<ShapeType | null>(null);
  const [activeShapeId, setActiveShapeId] = useState<string | null>(null);

  // === STATE: line shapes ===
  const [lines, setLines] = useState<LineShape[]>([]);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);

  // For dragging shapes
  const [draggingShapeId, setDraggingShapeId] = useState<string | null>(null);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);

  // For dragging lines
  const [draggingLineId, setDraggingLineId] = useState<string | null>(null);
  const [resizingLineEndpoint, setResizingLineEndpoint] = useState<'start'|'end'|null>(null);

  // For layout
  const [containerX, setContainerX] = useState<number>(0);
  const [containerY, setContainerY] = useState<number>(0);
  const handleContainerLayout = (e: LayoutChangeEvent) => {
    const { x, y } = e.nativeEvent.layout;
    setContainerX(x);
    setContainerY(y);
  };

  // === HELPER: highlight tool icon
  function isActiveTool(t: Tool) {
    return activeTool === t;
  }

  // === ZOOM ===
  function zoomIn() {
    setScale((prev) => prev + 0.2);
  }
  function zoomOut() {
    setScale((prev) => (prev > 0.2 ? prev - 0.2 : prev));
  }

  // === FREEHAND / LINE / ERASE ===
  function handleDrawGrant(evt: GestureResponderEvent) {
    // If we are currently dragging a shape or line, skip new creation
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
    // If we are dragging shape/line, skip new creation
    if (draggingShapeId || draggingLineId) return;

    const { locationX, locationY } = evt.nativeEvent;
    if (activeTool === 'draw' && currentStroke.length) {
      setCurrentStroke((prev) => [...prev, { x: locationX, y: locationY }]);
    } else if (activeTool === 'line' && lineStartPoint) {
      setCurrentStroke([{ ...lineStartPoint }, { x: locationX, y: locationY }]);
    } else if (activeTool === 'erase') {
      handleEraseAtPoint(locationX, locationY);
    }
  }
  function handleDrawRelease() {
    // If we are dragging shape/line, skip
    if (draggingShapeId || draggingLineId) return;

    if (activeTool === 'draw' && currentStroke.length > 1) {
      // finalize freehand stroke
      const newStroke: Stroke = {
        points: currentStroke,
        color: selectedColor,
        width: 3,
      };
      setStrokes((prev) => [...prev, newStroke]);
      setCurrentStroke([]);
    } else if (activeTool === 'line' && currentStroke.length === 2) {
      // finalize line
      const [p1, p2] = currentStroke;
      const newLine: LineShape = {
        id: Date.now().toString(),
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        color: selectedColor,
      };
      setLines((prev) => [...prev, newLine]);
      setCurrentStroke([]);
      setLineStartPoint(null);
      // remain in line tool => can draw again
    }
  }
  function handleEraseAtPoint(x: number, y: number) {
    // remove strokes
    setStrokes((prev) =>
      prev.filter((stroke) => {
        const hit = stroke.points.some((p) => Math.hypot(p.x - x, p.y - y) < ERASE_THRESHOLD);
        return !hit;
      })
    );
    // remove shapes
    setShapes((prev) =>
      prev.filter((sh) => {
        if (x >= sh.x && x <= sh.x + sh.width && y >= sh.y && y <= sh.y + sh.height) return false;
        return true;
      })
    );
    // remove lines
    setLines((prev) =>
      prev.filter((ln) => {
        const minX = Math.min(ln.x1, ln.x2) - 10;
        const maxX = Math.max(ln.x1, ln.x2) + 10;
        const minY = Math.min(ln.y1, ln.y2) - 10;
        const maxY = Math.max(ln.y1, ln.y2) + 10;
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) return false;
        return true;
      })
    );
  }

  // === SHAPE CREATION ===
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
    setShapes((prev) => [...prev, newShape]);
    setActiveShapeId(newShape.id);
    // remain shape tool => can create more shapes or drag existing
    setShapeType(null);
  }

  // === DETECT SHAPE & LINE bounding box ===
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

  // === OVERLAY DRAG/RESIZE LOGIC ===
  function handleOverlayStart(evt: GestureResponderEvent) {
    const { locationX, locationY } = evt.nativeEvent;
    let found = false;

    // 1) check shapes
    for (const sh of shapes) {
      const minX = sh.x - HANDLE_SIZE;
      const maxX = sh.x + sh.width + HANDLE_SIZE;
      const minY = sh.y - HANDLE_SIZE;
      const maxY = sh.y + sh.height + HANDLE_SIZE;
      if (locationX >= minX && locationX <= maxX && locationY >= minY && locationY <= maxY) {
        // user tapped shape => drag or resize corner
        setActiveShapeId(sh.id);
        setActiveLineId(null);
        setActiveTool('shape');
        // check corners
        const corners = {
          topLeft: { x: sh.x, y: sh.y },
          topRight: { x: sh.x+sh.width, y: sh.y },
          bottomLeft: { x: sh.x, y: sh.y+sh.height },
          bottomRight: { x: sh.x+sh.width, y: sh.y+sh.height },
        };
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
          // drag entire shape
          setDraggingShapeId(sh.id);
          setResizeCorner(null);
        }
        found = true;
        break;
      }
    }
    // 2) check lines
    if (!found) {
      for (const ln of lines) {
        const box = lineBoundingBox(ln);
        const minX = box.minX - 10, maxX = box.maxX + 10;
        const minY = box.minY - 10, maxY = box.maxY + 10;
        if (locationX >= minX && locationX <= maxX && locationY >= minY && locationY <= maxY) {
          // check endpoints
          if (nearPoint(locationX, locationY, ln.x1, ln.y1)) {
            // drag endpoint x1,y1
            setResizingLineEndpoint('start');
            setDraggingLineId(ln.id);
          } else if (nearPoint(locationX, locationY, ln.x2, ln.y2)) {
            // drag endpoint x2,y2
            setResizingLineEndpoint('end');
            setDraggingLineId(ln.id);
          } else {
            // drag entire line
            setDraggingLineId(ln.id);
            setResizingLineEndpoint(null);
          }
          setActiveLineId(ln.id);
          setActiveShapeId(null);
          setActiveTool('line');
          found = true;
          break;
        }
      }
    }

    // 3) if not found => maybe create shape
    if (!found) {
      if (shapeType) {
        createShape(evt);
        found = true;
      }
    }

    // 4) if still not found => user tapped outside => reset
    if (!found) {
      setActiveShapeId(null);
      setActiveLineId(null);
      setDraggingShapeId(null);
      setResizeCorner(null);
      setDraggingLineId(null);
      setResizingLineEndpoint(null);
      setActiveTool(null);
    }
  }

  function handleOverlayMove(evt: GestureResponderEvent) {
    const { locationX, locationY } = evt.nativeEvent;
    // shape drag or resize
    if (draggingShapeId) {
      setShapes((prev) =>
        prev.map((sh) => {
          if (sh.id !== draggingShapeId) return sh;
          const oldRight = sh.x + sh.width;
          const oldBottom = sh.y + sh.height;
          if (resizeCorner) {
            // corner resize
            let newX = sh.x, newY = sh.y;
            let newW = sh.width, newH = sh.height;
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
            // drag entire shape
            return {
              ...sh,
              x: locationX - sh.width / 2,
              y: locationY - sh.height / 2,
            };
          }
        })
      );
    }
    // line drag or resize
    if (draggingLineId) {
      setLines((prev) =>
        prev.map((ln) => {
          if (ln.id !== draggingLineId) return ln;
          if (resizingLineEndpoint === 'start') {
            // move x1,y1
            return { ...ln, x1: locationX, y1: locationY };
          } else if (resizingLineEndpoint === 'end') {
            // move x2,y2
            return { ...ln, x2: locationX, y2: locationY };
          } else {
            // drag entire line => shift by difference from midpoint
            const midX = (ln.x1 + ln.x2)/2;
            const midY = (ln.y1 + ln.y2)/2;
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
        })
      );
    }
  }

  function handleOverlayEnd() {
    setDraggingShapeId(null);
    setResizeCorner(null);
    setDraggingLineId(null);
    setResizingLineEndpoint(null);
  }

  // === RENDERING HELPERS ===
  function renderStrokes() {
    return strokes.map((stroke, i) => (
      <Path
        key={i}
        d={strokeToPath(stroke.points)}
        stroke={stroke.color}
        strokeWidth={stroke.width}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ));
  }
  function renderCurrentStroke() {
    if (!currentStroke.length) return null;
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
    } else if (activeTool === 'draw') {
      return (
        <Path
          d={strokeToPath(currentStroke)}
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
    return shapes.map((sh) => {
      const isActive = (sh.id === activeShapeId);
      const commonProps = {
        fill: sh.fill,
        stroke: 'black',
        strokeWidth: 2,
        pointerEvents: 'none' as const,
      };
      let shapeElem: React.ReactNode = null;
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
        const r = Math.min(sh.width, sh.height)/2;
        shapeElem = (
          <Circle
            key={sh.id}
            cx={sh.x + sh.width/2}
            cy={sh.y + sh.height/2}
            r={r}
            {...commonProps}
          />
        );
      } else if (sh.type === 'triangle') {
        const x1 = sh.x + sh.width/2;
        const y1 = sh.y;
        const x2 = sh.x;
        const y2 = sh.y + sh.height;
        const x3 = sh.x + sh.width;
        const y3 = sh.y + sh.height;
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
              <Circle cx={sh.x} cy={sh.y} r={HANDLE_SIZE/2} fill="gray" pointerEvents="none"/>
              <Circle cx={sh.x+sh.width} cy={sh.y} r={HANDLE_SIZE/2} fill="gray" pointerEvents="none"/>
              <Circle cx={sh.x} cy={sh.y+sh.height} r={HANDLE_SIZE/2} fill="gray" pointerEvents="none"/>
              <Circle cx={sh.x+sh.width} cy={sh.y+sh.height} r={HANDLE_SIZE/2} fill="gray" pointerEvents="none"/>
            </>
          )}
        </React.Fragment>
      );
    });
  }
  function renderLines() {
    return lines.map((ln) => {
      const isActive = (ln.id === activeLineId);
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
              <Circle cx={ln.x1} cy={ln.y1} r={HANDLE_SIZE/2} fill="gray" pointerEvents="none"/>
              <Circle cx={ln.x2} cy={ln.y2} r={HANDLE_SIZE/2} fill="gray" pointerEvents="none"/>
            </>
          )}
        </React.Fragment>
      );
    });
  }

  // === TOOL TOGGLES ===
  function toggleToolErase() {
    if (activeTool === 'erase') setActiveTool(null);
    else setActiveTool('erase');
  }
  function toggleToolPaint() {
    if (activeTool === 'paint') setActiveTool(null);
    else setActiveTool('paint');
  }
  // Instead of toggling shape or line, we open modals for them:
  function openShapePicker() {
    setShowShapePicker(true);
  }
  function openLineThicknessPicker() {
    setShowLineThicknessPicker(true);
  }
  function openColorPicker() {
    setShowColorPicker(true);
  }
  // If we want toggles for 'draw' or 'line' we can do:
  function setToolDraw() {
    if (activeTool === 'draw') setActiveTool(null);
    else setActiveTool('draw');
  }
  function setToolLine() {
    if (activeTool === 'line') setActiveTool(null);
    else setActiveTool('line');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.pageContainer}>
        {/* === Toolbar === */}
        <View style={styles.toolbar}>
          {/* Zoom */}
          <TouchableOpacity style={styles.iconButton} onPress={zoomIn}>
            <ZoomIn stroke="#666" width={20} height={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={zoomOut}>
            <ZoomOut stroke="#666" width={20} height={20} />
          </TouchableOpacity>

          {/* Erase */}
          <TouchableOpacity
            style={[styles.iconButton, isActiveTool('erase') && styles.activeIcon]}
            onPress={toggleToolErase}
          >
            <EraseIcon width={20} height={20} />
          </TouchableOpacity>

          {/* Shape -> opens shape picker modal */}
          <TouchableOpacity
            style={[styles.iconButton, isActiveTool('shape') && styles.activeIcon]}
            onPress={() => {
              if (activeTool === 'shape') setActiveTool(null);
              else setActiveTool('shape');
              setShowShapePicker(true);
            }}
          >
            <SquareIcon width={20} height={20} />
          </TouchableOpacity>

          {/* dummy Crop icon */}
          <TouchableOpacity style={styles.iconButton} onPress={() => {}}>
            <Crop stroke="#666" width={20} height={20} />
          </TouchableOpacity>

          {/* Paint */}
          <TouchableOpacity
            style={[styles.iconButton, isActiveTool('paint') && styles.activeIcon]}
            onPress={toggleToolPaint}
          >
            <PaintIcon width={20} height={20} />
          </TouchableOpacity>

          {/* Line => open line thickness picker */}
          <TouchableOpacity
            style={[styles.iconButton, isActiveTool('line') && styles.activeIcon]}
            onPress={() => {
              if (activeTool === 'line') setActiveTool(null);
              else setActiveTool('line');
              setShowLineThicknessPicker(true);
            }}
          >
            <LineIcon width={20} height={20} />
          </TouchableOpacity>

          {/* Draw => open color picker */}
          <TouchableOpacity
            style={[styles.iconButton, isActiveTool('draw') && styles.activeIcon]}
            onPress={() => {
              if (activeTool === 'draw') setActiveTool(null);
              else setActiveTool('draw');
              setShowColorPicker(true);
            }}
          >
            <Edit2 stroke="#666" width={20} height={20} />
          </TouchableOpacity>
        </View>

        {/* === Main content area === */}
        <View style={styles.imageArea} onLayout={handleContainerLayout}>
          <View style={styles.fixedContainer}>
            {/* Scale content */}
            <View style={[styles.scaledContent, { transform: [{ scale }] }]}>
              {/* Background image */}
              <Image
                source={require('../../public/assets/batu.png')}
                style={styles.image}
                resizeMode="contain"
              />

              {/* Freehand / line / erase creation layer */}
              <View
                style={StyleSheet.absoluteFill}
                pointerEvents={
                  (activeTool === 'draw' || activeTool === 'line' || activeTool === 'erase')
                    ? 'auto'
                    : 'none'
                }
                onStartShouldSetResponder={() => true}
                onResponderGrant={handleDrawGrant}
                onResponderMove={handleDrawMove}
                onResponderRelease={handleDrawRelease}
              >
                <Svg style={StyleSheet.absoluteFill}>
                  {/* existing strokes */}
                  {renderStrokes()}
                  {/* current stroke or line preview */}
                  {renderCurrentStroke()}
                </Svg>
              </View>

              {/* bounding box shapes & lines => drag/resize layer */}
              <View
                style={StyleSheet.absoluteFill}
                pointerEvents={
                  (activeTool === 'shape' || activeTool === 'paint' || activeTool === 'line' || activeTool === null)
                    ? 'auto'
                    : 'none'
                }
                onStartShouldSetResponder={() => true}
                onResponderGrant={handleOverlayStart}
                onResponderMove={handleOverlayMove}
                onResponderRelease={handleOverlayEnd}
              >
                <Svg style={StyleSheet.absoluteFill}>
                  {/* shapes */}
                  {renderShapes()}
                  {/* lines */}
                  {renderLines()}
                </Svg>
              </View>
            </View>
          </View>
        </View>

        {/* Next Button (example) */}
        <View style={styles.nextButtonContainer}>
          <TouchableOpacity style={styles.nextButton} onPress={() => {}}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* === MODALS === */}

      {/* Color Picker Modal */}
      <Modal visible={showColorPicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>Pilih Warna:</Text>
            <View style={styles.colorPickerRow}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => {
                    setSelectedColor(c);
                    setShowColorPicker(false);
                    // default tool => draw
                    setActiveTool('draw');
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

      {/* Line Thickness Picker */}
      <Modal visible={showLineThicknessPicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>Pilih Ketebalan Garis:</Text>
            {LINE_THICKNESS_OPTIONS.map((t) => (
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
            {(['rect','circle','triangle'] as ShapeType[]).map((type) => (
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
            <TouchableOpacity
              onPress={() => setShowShapePicker(false)}
              style={{ marginTop: 16 }}
            >
              <Text style={{ color: 'blue' }}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// === STYLES ===
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pageContainer: {
    flex: 1,
    paddingHorizontal: PAGE_PADDING,
  },
  toolbar: {
    marginTop: 20,
    backgroundColor: '#ffe4e6',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
  },
  activeIcon: {
    backgroundColor: 'rgba(0,255,0,0.2)',
    borderRadius: 8,
  },
  imageArea: {
    flex: 1,
    marginTop: 20,
  },
  fixedContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  scaledContent: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  nextButtonContainer: {
    flex: 0.5,
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  nextButton: {
    backgroundColor: 'green',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '500',
  },
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
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 8,
  },
});
