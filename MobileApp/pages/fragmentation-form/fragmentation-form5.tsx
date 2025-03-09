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

// Example icons – adjust these imports to your actual project
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

interface Stroke {
  points: Point[];
  color: string;
  width: number;
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

// ================= MAIN COMPONENT =================
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

  // --- FREEHAND / LINE ---
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

  // === FREEHAND / LINE / ERASE HANDLERS ===
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
  function handleDrawRelease() {
    if (draggingShapeId || draggingLineId) return;
    if (activeTool === 'draw' && currentStroke.length > 1) {
      const newStroke: Stroke = { points: currentStroke, color: selectedColor, width: 3 };
      setStrokes(prev => [...prev, newStroke]);
      setCurrentStroke([]);
    } else if (activeTool === 'line' && currentStroke.length === 2) {
      const [p1, p2] = currentStroke;
      const newLine: LineShape = { id: Date.now().toString(), x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, color: selectedColor };
      setLines(prev => [...prev, newLine]);
      setCurrentStroke([]);
      setLineStartPoint(null);
    }
  }
  function handleEraseAtPoint(x: number, y: number) {
    setStrokes(prev => prev.filter(stroke => !stroke.points.some(pt => Math.hypot(pt.x - x, pt.y - y) < ERASE_THRESHOLD)));
    setShapes(prev => prev.filter(sh => !(x >= sh.x && x <= sh.x + sh.width && y >= sh.y && y <= sh.y + sh.height)));
    setLines(prev => prev.filter(ln => {
      const { minX, maxX, minY, maxY } = lineBoundingBox(ln);
      return !(x >= minX - 10 && x <= maxX + 10 && y >= minY - 10 && y <= maxY + 10);
    }));
  }

  // === SHAPE CREATION ===
  function createShape(evt: GestureResponderEvent) {
    if (!shapeType) return;
    const { locationX, locationY } = evt.nativeEvent;
    const newShape: ShapeBox = { id: Date.now().toString(), type: shapeType, x: locationX, y: locationY, width: 80, height: 80, fill: 'none' };
    setShapes(prev => [...prev, newShape]);
    setActiveShapeId(newShape.id);
    // Remain in shape tool so user can drag/resize; shapeType is reset.
    setShapeType(null);
  }

  // === OVERLAY DRAG/RESIZE LOGIC FOR SHAPES & LINES ===
  function getShapeCorners(shape: ShapeBox) {
    return {
      topLeft: { x: shape.x, y: shape.y },
      topRight: { x: shape.x + shape.width, y: shape.y },
      bottomLeft: { x: shape.x, y: shape.y + shape.height },
      bottomRight: { x: shape.x + shape.width, y: shape.y + shape.height },
    };
  }

  // This overlay handler deals with all pointer events on the main canvas.
  function handleOverlayStart(evt: GestureResponderEvent) {
    const { locationX, locationY } = evt.nativeEvent;

    // If eraser is active, immediately erase and return.
    if (activeTool === 'erase') {
      handleEraseAtPoint(locationX, locationY);
      return;
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
          // Drag entire shape if tapped inside but not on a corner.
          setDraggingShapeId(sh.id);
          setResizeCorner(null);
        }
        found = true;
        break;
      }
    }
    // 2) Check lines if no shape found
    if (!found) {
      for (const ln of lines) {
        const { minX, maxX, minY, maxY } = lineBoundingBox(ln);
        if (locationX >= minX - 10 && locationX <= maxX + 10 && locationY >= minY - 10 && locationY <= maxY + 10) {
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
    // 3) If nothing found, then:
    if (!found) {
      if (activeTool === 'shape' && shapeType) {
        createShape(evt);
      } else if (activeTool === 'draw') {
        setCurrentStroke([{ x: locationX, y: locationY }]);
      } else if (activeTool === 'line') {
        setLineStartPoint({ x: locationX, y: locationY });
        setCurrentStroke([{ x: locationX, y: locationY }]);
      } else {
        // tapped empty area => reset active elements if in paint/shape mode or null
        setActiveShapeId(null);
        setActiveLineId(null);
        setDraggingShapeId(null);
        setResizeCorner(null);
        setDraggingLineId(null);
        setResizingLineEndpoint(null);
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
            let newX = sh.x, newY = sh.y, newW = sh.width, newH = sh.height;
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
            return { ...sh, x: locationX - sh.width / 2, y: locationY - sh.height / 2 };
          }
        })
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
        })
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
    if (activeTool === 'draw' && currentStroke.length > 1) {
      const newStroke: Stroke = { points: currentStroke, color: selectedColor, width: 3 };
      setStrokes(prev => [...prev, newStroke]);
      setCurrentStroke([]);
    } else if (activeTool === 'line' && currentStroke.length === 2) {
      const [p1, p2] = currentStroke;
      const newLine: LineShape = { id: Date.now().toString(), x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, color: selectedColor };
      setLines(prev => [...prev, newLine]);
      setCurrentStroke([]);
      setLineStartPoint(null);
    }
    setDraggingShapeId(null);
    setResizeCorner(null);
    setDraggingLineId(null);
    setResizingLineEndpoint(null);
  }

  // === RENDER HELPERS ===
  const renderStrokes = () =>
    strokes.map((stroke, i) => (
      <Path
        key={'st' + i}
        d={strokeToPath(stroke.points)}
        stroke={stroke.color}
        strokeWidth={stroke.width}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ));
  const renderCurrentStroke = () => {
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
  };
  const renderShapes = () =>
    shapes.map(sh => {
      const isActive = sh.id === activeShapeId;
      const commonProps = { fill: sh.fill, stroke: 'black', strokeWidth: 2, pointerEvents: 'none' as const };
      let shapeElem: React.ReactNode;
      if (sh.type === 'rect') {
        shapeElem = <Rect key={sh.id} x={sh.x} y={sh.y} width={sh.width} height={sh.height} {...commonProps} />;
      } else if (sh.type === 'circle') {
        const r = Math.min(sh.width, sh.height) / 2;
        shapeElem = <Circle key={sh.id} cx={sh.x + sh.width / 2} cy={sh.y + sh.height / 2} r={r} {...commonProps} />;
      } else {
        const x1 = sh.x + sh.width / 2, y1 = sh.y;
        const x2 = sh.x, y2 = sh.y + sh.height;
        const x3 = sh.x + sh.width, y3 = sh.y + sh.height;
        shapeElem = <Polygon key={sh.id} points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`} {...commonProps} />;
      }
      return (
        <React.Fragment key={sh.id}>
          {shapeElem}
          {isActive && (
            <>
              <Circle cx={sh.x} cy={sh.y} r={HANDLE_SIZE / 2} fill="gray" pointerEvents="none" />
              <Circle cx={sh.x + sh.width} cy={sh.y} r={HANDLE_SIZE / 2} fill="gray" pointerEvents="none" />
              <Circle cx={sh.x} cy={sh.y + sh.height} r={HANDLE_SIZE / 2} fill="gray" pointerEvents="none" />
              <Circle cx={sh.x + sh.width} cy={sh.y + sh.height} r={HANDLE_SIZE / 2} fill="gray" pointerEvents="none" />
            </>
          )}
        </React.Fragment>
      );
    });
  const renderLines = () =>
    lines.map(ln => {
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
              <Circle cx={ln.x1} cy={ln.y1} r={HANDLE_SIZE / 2} fill="gray" pointerEvents="none" />
              <Circle cx={ln.x2} cy={ln.y2} r={HANDLE_SIZE / 2} fill="gray" pointerEvents="none" />
            </>
          )}
        </React.Fragment>
      );
    });

  // === RENDER ===
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
              setActiveTool('shape');
              setShowShapePicker(true);
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
              setActiveTool('line');
              setShowLineThicknessPicker(true);
            }}
          >
            <LineIcon width={20} height={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, isActiveToolFunc('draw') && styles.activeIcon]}
            onPress={() => {
              setActiveTool('draw');
              setShowColorPicker(true);
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
              {/* Overlay for drawing, shapes, and lines */}
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
            <TouchableOpacity onPress={() => setShowLineThicknessPicker(false)} style={{ marginTop: 16 }}>
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
            {(['rect','circle','triangle'] as ShapeType[]).map(type => (
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

export default FragmentationForm4;

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
  fixedContainer: { width: '100%', aspectRatio: 1, backgroundColor: '#e5e7eb', borderRadius: 8, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  nextButtonContainer: { flex: 0.5, justifyContent: 'flex-end', paddingBottom: 16 },
  nextButton: { backgroundColor: 'green', borderRadius: 8, padding: 12, alignItems: 'center' },
  nextButtonText: { color: 'white', fontWeight: '500' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 16, borderRadius: 8, width: '80%', alignItems: 'center' },
  colorPickerRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginVertical: 8 },
  colorCircle: { width: 40, height: 40, borderRadius: 20, marginHorizontal: 8 },
});
