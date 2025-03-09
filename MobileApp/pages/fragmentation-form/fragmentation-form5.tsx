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
import Svg, { Path, Circle, Rect, Polygon } from 'react-native-svg';

import { ZoomIn, ZoomOut, Crop, Edit2 } from 'react-native-feather';
import EraseIcon from '../../assets/erase.svg';
import SquareIcon from '../../assets/square.svg';
import PaintIcon from '../../assets/paint.svg';
import LineIcon from '../../assets/line.svg';

// Tools
type Tool = 'draw' | 'erase' | 'line' | 'paint' | 'shape' | null;

// Shape types
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
  fill: string;
}

const { width: screenWidth } = Dimensions.get('window');
const PAGE_PADDING = 16;
const ERASE_THRESHOLD = 15;
const HANDLE_SIZE = 15;

// Convert points => Path
function strokeToPath(points: Point[]): string {
  if (!points.length) return '';
  const [first, ...rest] = points;
  let d = `M ${first.x} ${first.y} `;
  rest.forEach((p) => {
    d += `L ${p.x} ${p.y} `;
  });
  return d;
}

const COLORS = ['red', 'blue', 'green', 'black', 'orange'];
const LINE_THICKNESS_OPTIONS = [2, 4, 6];

export default function FragmentationForm4() {
  const [activeTool, setActiveTool] = useState<Tool>(null);
  // Zoom
  const [scale, setScale] = useState<number>(1);
  // Selected color
  const [selectedColor, setSelectedColor] = useState<string>('red');

  // Modal toggles
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showLineThicknessPicker, setShowLineThicknessPicker] = useState<boolean>(false);
  const [showShapePicker, setShowShapePicker] = useState<boolean>(false);

  // line thickness
  const [lineThickness, setLineThickness] = useState<number>(2);

  // freehand / line
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [lineStartPoint, setLineStartPoint] = useState<Point | null>(null);

  // bounding box shapes
  const [shapes, setShapes] = useState<ShapeBox[]>([]);
  const [shapeType, setShapeType] = useState<ShapeType | null>(null);
  const [activeShapeId, setActiveShapeId] = useState<string | null>(null);

  // for drag/resize
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);

  // container layout
  const [containerX, setContainerX] = useState<number>(0);
  const [containerY, setContainerY] = useState<number>(0);
  const handleContainerLayout = (e: LayoutChangeEvent) => {
    const { x, y } = e.nativeEvent.layout;
    setContainerX(x);
    setContainerY(y);
  };

  // Zoom
  const zoomIn = () => setScale((prev) => prev + 0.2);
  const zoomOut = () => setScale((prev) => (prev > 0.2 ? prev - 0.2 : prev));

  // ========== Freehand/Line/Erase ==========
  const handleDrawGrant = (evt: GestureResponderEvent) => {
    const { locationX, locationY } = evt.nativeEvent;
    if (activeTool === 'draw') {
      setCurrentStroke([{ x: locationX, y: locationY }]);
    } else if (activeTool === 'line') {
      setLineStartPoint({ x: locationX, y: locationY });
      setCurrentStroke([{ x: locationX, y: locationY }]);
    } else if (activeTool === 'erase') {
      handleEraseAtPoint(locationX, locationY);
    }
  };
  const handleDrawMove = (evt: GestureResponderEvent) => {
    const { locationX, locationY } = evt.nativeEvent;
    if (activeTool === 'draw' && currentStroke.length) {
      setCurrentStroke((prev) => [...prev, { x: locationX, y: locationY }]);
    } else if (activeTool === 'line' && lineStartPoint) {
      setCurrentStroke([{ ...lineStartPoint }, { x: locationX, y: locationY }]);
    } else if (activeTool === 'erase') {
      handleEraseAtPoint(locationX, locationY);
    }
  };
  const handleDrawRelease = () => {
    if (activeTool === 'draw' && currentStroke.length) {
      const newStroke: Stroke = {
        points: currentStroke,
        color: selectedColor,
        width: 3,
      };
      setStrokes((prev) => [...prev, newStroke]);
      setCurrentStroke([]);
    } else if (activeTool === 'line' && currentStroke.length === 2) {
      const newStroke: Stroke = {
        points: currentStroke,
        color: selectedColor,
        width: lineThickness,
      };
      setStrokes((prev) => [...prev, newStroke]);
      setCurrentStroke([]);
      setLineStartPoint(null);
    }
  };
  function handleEraseAtPoint(x: number, y: number) {
    // remove strokes
    setStrokes((prev) =>
      prev.filter((stroke) => {
        const hit = stroke.points.some((p) => Math.hypot(p.x - x, p.y - y) < ERASE_THRESHOLD);
        return !hit;
      })
    );
    // remove shape
    setShapes((prev) =>
      prev.filter((shape) => {
        if (
          x >= shape.x &&
          x <= shape.x + shape.width &&
          y >= shape.y &&
          y <= shape.y + shape.height
        ) {
          return false;
        }
        return true;
      })
    );
  }

  // ========== Shape creation & drag/resize logic in parent overlay ==========

  // Fungsi mengecek corner bounding box shape
  function getShapeCorners(shape: ShapeBox) {
    return {
      topLeft: { x: shape.x, y: shape.y },
      topRight: { x: shape.x + shape.width, y: shape.y },
      bottomLeft: { x: shape.x, y: shape.y + shape.height },
      bottomRight: { x: shape.x + shape.width, y: shape.y + shape.height },
    };
  }
  function distance(x1: number, y1: number, x2: number, y2: number) {
    return Math.hypot(x1 - x2, y1 - y2);
  }

  // Buat shape 1x tap
  function handleShapeTap(evt: GestureResponderEvent) {
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
    // tool = shape tetap
    setShapeType(null);
  }

  // onResponderGrant => user men-tap overlay
function handleShapeStart(evt: GestureResponderEvent) {
  const { locationX, locationY } = evt.nativeEvent;
  let foundShape = false;

  for (const shape of shapes) {
    // Buat "padding" agar corner di tepi masih terdeteksi
    const minX = shape.x - HANDLE_SIZE;
    const maxX = shape.x + shape.width + HANDLE_SIZE;
    const minY = shape.y - HANDLE_SIZE;
    const maxY = shape.y + shape.height + HANDLE_SIZE;

    if (locationX >= minX && locationX <= maxX && locationY >= minY && locationY <= maxY) {
      // user men-tap "dalam" bounding box (plus margin)
      setActiveShapeId(shape.id);
      setActiveTool('shape');

      // Cek corner => resize
      const corners = getShapeCorners(shape);
      let cornerFound = false;
      for (const cornerName in corners) {
        const cornerPt = (corners as any)[cornerName];
        if (distance(locationX, locationY, cornerPt.x, cornerPt.y) < HANDLE_SIZE) {
          setResizeCorner(cornerName);
          setDraggingId(shape.id);
          cornerFound = true;
          break;
        }
      }
      if (!cornerFound) {
        // drag
        setResizeCorner(null);
        setDraggingId(shape.id);
      }

      foundShape = true;
      break;
    }
  }

  if (!foundShape) {
    // user menekan luar shape
    if (shapeType) {
      handleShapeTap(evt);
    } else {
      setActiveShapeId(null);
      setDraggingId(null);
      setResizeCorner(null);
      setActiveTool(null);
    }
  }
}


  // onResponderMove => drag or resize shape
  function handleShapeMove(evt: GestureResponderEvent) {
    if (!draggingId) return;
    const { locationX, locationY } = evt.nativeEvent;

    setShapes((prev) =>
      prev.map((shape) => {
        if (shape.id !== draggingId) return shape;

        // Perhitungan anchor
        const oldRight = shape.x + shape.width;
        const oldBottom = shape.y + shape.height;
        const oldLeft = shape.x;
        const oldTop = shape.y;

        if (resizeCorner) {
          // Resize
          let newX = shape.x;
          let newY = shape.y;
          let newW = shape.width;
          let newH = shape.height;

          if (resizeCorner === 'topLeft') {
            // anchor bottomRight => oldRight, oldBottom
            newX = locationX;
            newY = locationY;
            newW = oldRight - locationX;
            newH = oldBottom - locationY;
          } else if (resizeCorner === 'topRight') {
            // anchor bottomLeft => oldLeft, oldBottom
            newY = locationY;
            newW = locationX - oldLeft;
            newH = oldBottom - locationY;
          } else if (resizeCorner === 'bottomLeft') {
            // anchor topRight => oldRight, oldTop
            newX = locationX;
            newW = oldRight - locationX;
            newH = locationY - oldTop;
          } else if (resizeCorner === 'bottomRight') {
            // anchor topLeft => oldLeft, oldTop
            newW = locationX - oldLeft;
            newH = locationY - oldTop;
          }
          if (newW < 10) newW = 10;
          if (newH < 10) newH = 10;
          return { ...shape, x: newX, y: newY, width: newW, height: newH };
        } else {
          // Drag
          return {
            ...shape,
            x: locationX - shape.width / 2,
            y: locationY - shape.height / 2,
          };
        }
      })
    );
  }

  // onResponderRelease => reset drag
  function handleShapeEnd() {
    setDraggingId(null);
    setResizeCorner(null);
  }


  // Render bounding box shape
  function renderShape(shape: ShapeBox) {
    const commonProps = {
      fill: shape.fill,
      stroke: 'black',
      strokeWidth: 2,
      pointerEvents: 'none' as const, // shape tak menangkap event
    };
    switch (shape.type) {
      case 'rect': {
        return (
          <Rect
            key={shape.id}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            {...commonProps}
          />
        );
      }
      case 'circle': {
        const r = Math.min(shape.width, shape.height) / 2;
        return (
          <Circle
            key={shape.id}
            cx={shape.x + shape.width / 2}
            cy={shape.y + shape.height / 2}
            r={r}
            {...commonProps}
          />
        );
      }
      case 'triangle': {
        const x1 = shape.x + shape.width / 2;
        const y1 = shape.y;
        const x2 = shape.x;
        const y2 = shape.y + shape.height;
        const x3 = shape.x + shape.width;
        const y3 = shape.y + shape.height;
        return (
          <Polygon
            key={shape.id}
            points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`}
            {...commonProps}
          />
        );
      }
      default:
        return null;
    }
  }

  function isActiveTool(t: Tool) {
    return activeTool === t;
  }

  // modal line thickness
  function openLineThicknessPicker() {
    setShowLineThicknessPicker(true);
  }
  function selectLineThicknessFn(t: number) {
    setLineThickness(t);
    setShowLineThicknessPicker(false);
    setActiveTool('line');
  }

  // modal color
  function openColorPicker() {
    setShowColorPicker(true);
  }
  function selectColorFn(c: string) {
    setSelectedColor(c);
    setShowColorPicker(false);
    if (activeTool !== 'paint') setActiveTool('draw');
  }

  // modal shape
  function openShapePicker() {
    setShowShapePicker(true);
  }
  function pickShapeFn(type: ShapeType) {
    setShapeType(type);
    setActiveTool('shape');
    setShowShapePicker(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.pageContainer}>
        {/* Toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity
            style={[styles.iconButton, activeTool === null && styles.activeIcon]}
            onPress={zoomIn}
          >
            <ZoomIn stroke="#666" width={20} height={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, activeTool === null && styles.activeIcon]}
            onPress={zoomOut}
          >
            <ZoomOut stroke="#666" width={20} height={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, isActiveTool('erase') && styles.activeIcon]}
            onPress={() => setActiveTool('erase')}
          >
            <EraseIcon width={20} height={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, isActiveTool('shape') && styles.activeIcon]}
            onPress={openShapePicker}
          >
            <SquareIcon width={20} height={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, activeTool === null && styles.activeIcon]}
            onPress={() => {}}
          >
            <Crop stroke="#666" width={20} height={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, isActiveTool('paint') && styles.activeIcon]}
            onPress={() => setActiveTool('paint')}
          >
            <PaintIcon width={20} height={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, isActiveTool('line') && styles.activeIcon]}
            onPress={openLineThicknessPicker}
          >
            <LineIcon width={20} height={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, isActiveTool('draw') && styles.activeIcon]}
            onPress={openColorPicker}
          >
            <Edit2 stroke="#666" width={20} height={20} />
          </TouchableOpacity>
        </View>

        {/* Main content */}
        <View style={styles.imageArea} onLayout={handleContainerLayout}>
          <View style={styles.fixedContainer}>
            <View style={[styles.scaledContent, { transform: [{ scale }] }]}>
              {/* Gambar background */}
              <Image
                source={require('../../public/assets/batu.png')}
                style={styles.image}
                resizeMode="contain"
              />
              {/* Overlay freehand/line/erase */}
              <View
                style={StyleSheet.absoluteFill}
                pointerEvents={
                  activeTool === 'draw' || activeTool === 'line' || activeTool === 'erase'
                    ? 'auto'
                    : 'none'
                }
                onStartShouldSetResponder={() => true}
                onResponderGrant={handleDrawGrant}
                onResponderMove={handleDrawMove}
                onResponderRelease={handleDrawRelease}
              >
                <Svg style={StyleSheet.absoluteFill}>
                  {strokes.map((stroke, i) => (
                    <Path
                      key={i}
                      d={strokeToPath(stroke.points)}
                      stroke={stroke.color}
                      strokeWidth={stroke.width}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                  {currentStroke.length > 0 && (
                    <Path
                      d={strokeToPath(currentStroke)}
                      stroke={activeTool === 'erase' ? 'white' : selectedColor}
                      strokeWidth={activeTool === 'line' ? lineThickness : 3}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </Svg>
              </View>

              {/* Overlay bounding box shape => drag/resize */}
              <View
                style={StyleSheet.absoluteFill}
                pointerEvents={
                  activeTool === 'shape' || activeTool === 'paint' || activeTool === null
                    ? 'auto'
                    : 'none'
                }
                onStartShouldSetResponder={() => true}
                onResponderGrant={handleShapeStart}
                onResponderMove={handleShapeMove}
                onResponderRelease={handleShapeEnd}
              >
                <Svg style={StyleSheet.absoluteFill}>
                  {/* Render shape bounding box => pointerEvents:none (visual) */}
                  {shapes.map((sh) => (
                    <React.Fragment key={sh.id}>
                      {renderShape(sh)}
                      {/* Tampilkan corner handle jika shape ini adalah activeShape */}
                      {sh.id === activeShapeId && (
                        <React.Fragment>
                          {/* corner circle => pointerEvents:none => cuma visual */}
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
                        </React.Fragment>
                      )}
                    </React.Fragment>
                  ))}
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
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => {
                    setSelectedColor(c);
                    setShowColorPicker(false);
                    if (activeTool !== 'paint') setActiveTool('draw');
                  }}
                >
                  <View style={[styles.colorCircle, { backgroundColor: c }]} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => setShowColorPicker(false)}
              style={{ marginTop: 16 }}
            >
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
            {LINE_THICKNESS_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => {
                  setLineThickness(t);
                  setActiveTool('line');
                  setShowLineThicknessPicker(false);
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
            {(['rect', 'circle', 'triangle'] as ShapeType[]).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => {
                  pickShapeFn(type);
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

// Hanya visual shape + handle => pointerEvents="none"
function renderShape(shape: ShapeBox) {
  const commonProps = {
    fill: shape.fill,
    stroke: 'black',
    strokeWidth: 2,
    pointerEvents: 'none' as const, // agar event tak berhenti di shape
  };
  switch (shape.type) {
    case 'rect': {
      return (
        <Rect
          key={shape.id}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          {...commonProps}
        />
      );
    }
    case 'circle': {
      const r = Math.min(shape.width, shape.height) / 2;
      return (
        <Circle
          key={shape.id}
          cx={shape.x + shape.width / 2}
          cy={shape.y + shape.height / 2}
          r={r}
          {...commonProps}
        />
      );
    }
    case 'triangle': {
      const x1 = shape.x + shape.width / 2;
      const y1 = shape.y;
      const x2 = shape.x;
      const y2 = shape.y + shape.height;
      const x3 = shape.x + shape.width;
      const y3 = shape.y + shape.height;
      return (
        <Polygon
          key={shape.id}
          points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`}
          {...commonProps}
        />
      );
    }
    default:
      return null;
  }
}


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
  scaledContent: { flex: 1 },
  image: { width: '100%', height: '100%' },
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
