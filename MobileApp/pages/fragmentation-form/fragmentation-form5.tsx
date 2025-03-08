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

// Tipe tool yang tersedia
type Tool = 'draw' | 'erase' | 'line' | 'paint' | 'shape' | null;

// Jenis shape
type ShapeType = 'rect' | 'circle' | 'triangle';

// Titik 2D
interface Point {
  x: number;
  y: number;
}

// Stroke (freehand atau line)
interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

// Shape bounding box
interface Shape {
  id: string;
  type: ShapeType;
  x: number;       // posisi kiri
  y: number;       // posisi atas
  width: number;
  height: number;
  fill: string;    // default "none"
}

const { width: screenWidth } = Dimensions.get('window');
const PAGE_PADDING = 16;
const ERASE_THRESHOLD = 15;    // hit-test jarak penghapusan
const HANDLE_SIZE = 15;        // ukuran handle resize

// Buat path SVG dari kumpulan titik
function strokeToPath(points: Point[]): string {
  if (!points.length) return '';
  const [first, ...rest] = points;
  let d = `M ${first.x} ${first.y} `;
  rest.forEach((p) => { d += `L ${p.x} ${p.y} `; });
  return d;
}

// Opsi warna dan ketebalan
const COLORS = ['red', 'blue', 'green', 'black', 'orange'];
const LINE_THICKNESS_OPTIONS = [2, 4, 6];

export default function FragmentationForm4() {
  // State tool aktif (default: null = tidak ada)
  const [activeTool, setActiveTool] = useState<Tool>(null);

  // Zoom scale (diterapkan pada gambar + overlay)
  const [scale, setScale] = useState<number>(1);

  // Warna terpilih (untuk draw atau paint)
  const [selectedColor, setSelectedColor] = useState<string>('red');

  // Modal
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showLineThicknessPicker, setShowLineThicknessPicker] = useState<boolean>(false);
  const [showShapePicker, setShowShapePicker] = useState<boolean>(false);

  // State ketebalan garis (untuk line)
  const [lineThickness, setLineThickness] = useState<number>(2);

  // Freehand/Line
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [lineStartPoint, setLineStartPoint] = useState<Point | null>(null);

  // Shape
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [shapeType, setShapeType] = useState<ShapeType | null>(null);
  const [activeShapeId, setActiveShapeId] = useState<string | null>(null);

  // Drag/Resize shape
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);

  // Layout container
  const [containerX, setContainerX] = useState<number>(0);
  const [containerY, setContainerY] = useState<number>(0);
  const handleContainerLayout = (e: LayoutChangeEvent) => {
    const { x, y } = e.nativeEvent.layout;
    setContainerX(x);
    setContainerY(y);
  };

  // ========== Zoom In/Out ==========
  const zoomIn = () => setScale((prev) => prev + 0.2);
  const zoomOut = () => setScale((prev) => (prev > 0.2 ? prev - 0.2 : prev));

  // ========== Freehand & Line ==========
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
    if (activeTool === 'draw') {
      setCurrentStroke((prev) => [...prev, { x: locationX, y: locationY }]);
    } else if (activeTool === 'line' && lineStartPoint) {
      setCurrentStroke([{ ...lineStartPoint }, { x: locationX, y: locationY }]);
    } else if (activeTool === 'erase') {
      handleEraseAtPoint(locationX, locationY);
    }
  };

  const handleDrawRelease = () => {
    if (activeTool === 'draw' && currentStroke.length > 0) {
      setStrokes((prev) => [
        ...prev,
        { points: currentStroke, color: selectedColor, width: 3 },
      ]);
      setCurrentStroke([]);
    } else if (activeTool === 'line' && currentStroke.length === 2) {
      setStrokes((prev) => [
        ...prev,
        { points: currentStroke, color: selectedColor, width: lineThickness },
      ]);
      setCurrentStroke([]);
      setLineStartPoint(null);
    }
  };

  // ========== Erase ==========
  const handleEraseAtPoint = (x: number, y: number) => {
    // Hapus stroke
    setStrokes((prev) =>
      prev.filter((stroke) => {
        const hit = stroke.points.some((p) => Math.hypot(p.x - x, p.y - y) < ERASE_THRESHOLD);
        return !hit;
      })
    );
    // Hapus shape
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
  };

  // ========== Shape ==========
  // Buat shape 1 kali tap
  const handleShapeTap = (evt: GestureResponderEvent) => {
    if (!shapeType) return;
    const { locationX, locationY } = evt.nativeEvent;
    const newShape: Shape = {
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
    // Selesai, matikan mode shape
    setActiveTool(null);
    setShapeType(null);
  };

  // ========== Drag & Resize Shape ==========
  // Dapatkan sudut-sudut bounding box
  function getShapeCorners(shape: Shape) {
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

  const handleShapeStart = (evt: GestureResponderEvent) => {
    if (activeTool !== 'shape') return;
    const { locationX, locationY } = evt.nativeEvent;
    let found = false;
    for (const shape of shapes) {
      // Cek bounding box shape
      if (
        locationX >= shape.x &&
        locationX <= shape.x + shape.width &&
        locationY >= shape.y &&
        locationY <= shape.y + shape.height
      ) {
        // Cek corner => resize
        const corners = getShapeCorners(shape);
        for (const cornerName in corners) {
          const corner = (corners as any)[cornerName];
          if (distance(locationX, locationY, corner.x, corner.y) < HANDLE_SIZE) {
            setResizeCorner(cornerName);
            setDraggingId(shape.id);
            found = true;
            break;
          }
        }
        if (!found) {
          // Jika tidak di handle => drag
          setDraggingId(shape.id);
          setResizeCorner(null);
          found = true;
        }
        break;
      }
    }
    // Jika belum ketemu shape & shapeType ada, buat shape baru
    if (!found && shapeType) {
      handleShapeTap(evt);
    }
  };

  const handleShapeMove = (evt: GestureResponderEvent) => {
    if (activeTool !== 'shape' || !draggingId) return;
    const { locationX, locationY } = evt.nativeEvent;

    setShapes((prev) =>
      prev.map((shape) => {
        if (shape.id !== draggingId) return shape;

        // Sedang resize
        if (resizeCorner) {
          let newX = shape.x;
          let newY = shape.y;
          let newWidth = shape.width;
          let newHeight = shape.height;
          if (resizeCorner === 'topLeft') {
            newWidth = shape.x + shape.width - locationX;
            newHeight = shape.y + shape.height - locationY;
            newX = locationX;
            newY = locationY;
          } else if (resizeCorner === 'topRight') {
            newWidth = locationX - shape.x;
            newHeight = shape.y + shape.height - locationY;
            newY = locationY;
          } else if (resizeCorner === 'bottomLeft') {
            newWidth = shape.x + shape.width - locationX;
            newHeight = locationY - shape.y;
            newX = locationX;
          } else if (resizeCorner === 'bottomRight') {
            newWidth = locationX - shape.x;
            newHeight = locationY - shape.y;
          }
          if (newWidth < 10) newWidth = 10;
          if (newHeight < 10) newHeight = 10;
          return { ...shape, x: newX, y: newY, width: newWidth, height: newHeight };
        }
        // Sedang drag
        else {
          // Geser => set x,y agar posisi tap jadi center shape
          return {
            ...shape,
            x: locationX - shape.width / 2,
            y: locationY - shape.height / 2,
          };
        }
      })
    );
  };

  const handleShapeEnd = () => {
    setDraggingId(null);
    setResizeCorner(null);
  };

  // ========== MODE PAINT ==========
  // Ketika user mengetuk shape, shape di-fill dengan warna
  const handleShapePress = (shapeId: string) => {
    if (activeTool === 'paint') {
      setShapes((prev) =>
        prev.map((shape) =>
          shape.id === shapeId ? { ...shape, fill: selectedColor } : shape
        )
      );
    } else {
      // Jika bukan mode paint, shape hanya menjadi aktif
      setActiveShapeId(shapeId);
    }
  };

  // ========== RENDER SHAPE ==========
  function renderShape(shape: Shape) {
    const commonProps = {
      fill: shape.fill,
      stroke: 'black',
      strokeWidth: 2,
      onPress: () => handleShapePress(shape.id),
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
        const radius = Math.min(shape.width, shape.height) / 2;
        return (
          <Circle
            key={shape.id}
            cx={shape.x + shape.width / 2}
            cy={shape.y + shape.height / 2}
            r={radius}
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

  // ========== TOOLBAR UTILS ==========
  const isActive = (tool: Tool) => activeTool === tool;

  // ========== MODALS ==========
  // Color Picker
  const openColorPicker = () => setShowColorPicker(true);
  const selectColor = (color: string) => {
    setSelectedColor(color);
    setShowColorPicker(false);
    if (activeTool !== 'paint') setActiveTool('draw');
  };

  // Line thickness
  const openLineThicknessPicker = () => setShowLineThicknessPicker(true);
  const selectLineThickness = (thickness: number) => {
    setLineThickness(thickness);
    setShowLineThicknessPicker(false);
    setActiveTool('line');
  };

  // Shape
  const openShapePicker = () => setShowShapePicker(true);
  const pickShape = (type: ShapeType) => {
    setShapeType(type);
    setShowShapePicker(false);
    setActiveTool('shape');
  };

  // ========== RENDER ==========
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
            style={[styles.iconButton, isActive('erase') && styles.activeIcon]}
            onPress={() => setActiveTool('erase')}
          >
            <EraseIcon width={20} height={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, isActive('shape') && styles.activeIcon]}
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
            style={[styles.iconButton, isActive('paint') && styles.activeIcon]}
            onPress={() => setActiveTool('paint')}
          >
            <PaintIcon width={20} height={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, isActive('line') && styles.activeIcon]}
            onPress={openLineThicknessPicker}
          >
            <LineIcon width={20} height={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, isActive('draw') && styles.activeIcon]}
            onPress={openColorPicker}
          >
            <Edit2 stroke="#666" width={20} height={20} />
          </TouchableOpacity>
        </View>

        {/* Main Image Area */}
        <View style={styles.imageArea} onLayout={handleContainerLayout}>
          <View style={styles.fixedContainer}>
            {/* Gambar + overlay diskalakan */}
            <View style={[styles.scaledContent, { transform: [{ scale }] }]}>
              <Image
                source={require('../../public/assets/batu.png')}
                style={styles.image}
                resizeMode="contain"
              />
              {/* Overlay freehand/line/erase */}
              <View
                style={StyleSheet.absoluteFill}
                pointerEvents={activeTool === 'draw' || activeTool === 'line' || activeTool === 'erase' ? 'auto' : 'none'}
                onStartShouldSetResponder={() => true}
                onResponderGrant={handleDrawGrant}
                onResponderMove={handleDrawMove}
                onResponderRelease={handleDrawRelease}
              >
                <Svg style={StyleSheet.absoluteFill}>
                  {strokes.map((stroke, index) => (
                    <Path
                      key={index}
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

              {/* Overlay shape (drag/resize) + satu kali tap shape creation */}
              <View
                style={StyleSheet.absoluteFill}
                pointerEvents={
                  activeTool === 'shape' || activeTool === 'paint'
                    ? 'auto'
                    : 'none'
                }
                onStartShouldSetResponder={() => true}
                onResponderGrant={(evt) => {
                  if (activeTool === 'shape') {
                    handleShapeStart(evt);
                  } else if (activeTool === 'paint') {
                    // Tekan shape untuk fill
                    // (bisa pakai onPress di shape, atau di sini handle area)
                  }
                }}
                onResponderMove={(evt) => {
                  if (activeTool === 'shape') {
                    handleShapeMove(evt);
                  }
                }}
                onResponderRelease={(evt) => {
                  if (activeTool === 'shape') {
                    handleShapeEnd();
                  }
                  if (shapeType) {
                    // Buat shape sekali tap
                    handleShapeTap(evt);
                  }
                }}
              >
                <Svg style={StyleSheet.absoluteFill}>
                  {shapes.map((shape) => {
                    // Render shape
                    const shapeElem = renderShape(shape);
                    return shapeElem;
                  })}
                  {activeShapeId &&
                    shapes
                      .filter((s) => s.id === activeShapeId)
                      .map((s) => {
                        const corners = getShapeCorners(s);
                        return (
                          <React.Fragment key={s.id + '_handles'}>
                            <Circle
                              cx={corners.topLeft.x}
                              cy={corners.topLeft.y}
                              r={HANDLE_SIZE / 2}
                              fill="gray"
                              onStartShouldSetResponder={() => true}
                              onResponderGrant={() => {
                                setResizeCorner('topLeft');
                                setDraggingId(s.id);
                              }}
                            />
                            <Circle
                              cx={corners.topRight.x}
                              cy={corners.topRight.y}
                              r={HANDLE_SIZE / 2}
                              fill="gray"
                              onStartShouldSetResponder={() => true}
                              onResponderGrant={() => {
                                setResizeCorner('topRight');
                                setDraggingId(s.id);
                              }}
                            />
                            <Circle
                              cx={corners.bottomLeft.x}
                              cy={corners.bottomLeft.y}
                              r={HANDLE_SIZE / 2}
                              fill="gray"
                              onStartShouldSetResponder={() => true}
                              onResponderGrant={() => {
                                setResizeCorner('bottomLeft');
                                setDraggingId(s.id);
                              }}
                            />
                            <Circle
                              cx={corners.bottomRight.x}
                              cy={corners.bottomRight.y}
                              r={HANDLE_SIZE / 2}
                              fill="gray"
                              onStartShouldSetResponder={() => true}
                              onResponderGrant={() => {
                                setResizeCorner('bottomRight');
                                setDraggingId(s.id);
                              }}
                            />
                          </React.Fragment>
                        );
                      })}
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

      {/* Modal Color Picker */}
      <Modal visible={showColorPicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pilih Warna:</Text>
            <View style={styles.colorPickerRow}>
              {COLORS.map((color) => (
                <TouchableOpacity key={color} onPress={() => selectColor(color)}>
                  <View style={[styles.colorCircle, { backgroundColor: color }]} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowColorPicker(false)} style={{ marginTop: 16 }}>
              <Text style={{ color: 'blue' }}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Line Thickness Picker */}
      <Modal visible={showLineThicknessPicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pilih Ketebalan Garis:</Text>
            <View style={styles.colorPickerRow}>
              {LINE_THICKNESS_OPTIONS.map((thickness) => (
                <TouchableOpacity key={thickness} onPress={() => selectLineThickness(thickness)}>
                  <View style={styles.lineThicknessOption}>
                    <View style={{ backgroundColor: selectedColor, height: thickness, width: 50 }} />
                    <Text style={{ fontSize: 12 }}>{thickness}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowLineThicknessPicker(false)} style={{ marginTop: 16 }}>
              <Text style={{ color: 'blue' }}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Shape Picker */}
      <Modal visible={showShapePicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pilih Bentuk:</Text>
            <View style={styles.colorPickerRow}>
              {(['rect', 'circle', 'triangle'] as ShapeType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => {
                    pickShape(type);
                  }}
                >
                  <Text style={{ fontSize: 16, marginHorizontal: 8 }}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowShapePicker(false)} style={{ marginTop: 16 }}>
              <Text style={{ color: 'blue' }}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ========== Styles ==========

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  iconButton: { padding: 8 },
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
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    marginBottom: 16,
    fontSize: 16,
  },
  colorPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  lineThicknessOption: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
});
