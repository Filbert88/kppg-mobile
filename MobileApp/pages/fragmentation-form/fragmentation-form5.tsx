import React, {useState, useEffect} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  SafeAreaView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Toolbar from '../../components/drawing/Toolbar';
import ColorPicker from '../../components/drawing/ColorPicker';
import LineThicknessPicker from '../../components/drawing/LineThicknessPicker';
import ShapePicker from '../../components/drawing/ShapePicker';
import DrawingCanvas, {CropRect} from '../../components/drawing/DrawingCanvas';
import {
  Tool,
  Point,
  Stroke,
  ShapeBox,
  LineShape,
  ShapeType,
} from '../../types/drawing';
import {COLORS, CONSTANTS} from '../../constants/drawing';
import {
  distance,
  nearPoint,
  pointInPolygon,
  isPointInShape,
  mergeConnectedStrokes,
} from '../../utils/drawingUtils';

export default function FragmentationForm4() {
  // Canvas dimensions
  const [canvasSize, setCanvasSize] = useState(() => {
    const screenWidth = Dimensions.get('window').width;
    const padding = 32;
    const maxWidth = Math.min(screenWidth - padding, 600);
    return {width: maxWidth, height: maxWidth};
  });

  // Active tool and zoom
  const [activeTool, setActiveTool] = useState<Tool>(null);
  const [scale, setScale] = useState<number>(1);

  // Drawing style
  const [selectedColor, setSelectedColor] = useState<string>(COLORS.primary);
  const [lineThickness, setLineThickness] = useState<number>(2);

  // Modals
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showLineThicknessPicker, setShowLineThicknessPicker] =
    useState<boolean>(false);
  const [showShapePicker, setShowShapePicker] = useState<boolean>(false);

  // Drawing data
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [shapes, setShapes] = useState<ShapeBox[]>([]);
  const [lines, setLines] = useState<LineShape[]>([]);
  const [activeShapeId, setActiveShapeId] = useState<string | null>(null);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);

  // Crop states
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [finalCropRect, setFinalCropRect] = useState<CropRect | undefined>(
    undefined,
  );
  const [isCropped, setIsCropped] = useState<boolean>(false);
  const [activeCropHandle, setActiveCropHandle] = useState<
    'move' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | null
  >(null);
  const [cropStartPoint, setCropStartPoint] = useState<Point | null>(null);
  const [initialCropRect, setInitialCropRect] = useState<CropRect | null>(null);

  // Sample background image - replace with your actual image
  const backgroundImage = 'https://example.com/sample-image.jpg';

  useEffect(() => {
    // Initialize default crop rect when crop tool is activated
    if (activeTool === 'crop' && !cropRect) {
      // If already cropped, set the initial crop rect to the current cropped area
      if (isCropped && finalCropRect) {
        setCropRect({
          x: 0,
          y: 0,
          width: finalCropRect.width,
          height: finalCropRect.height,
        });
      } else {
        // Otherwise, use default crop area
        const defaultCrop: CropRect = {
          x: canvasSize.width * 0.1,
          y: canvasSize.height * 0.1,
          width: canvasSize.width * 0.8,
          height: canvasSize.height * 0.8,
        };
        setCropRect(defaultCrop);
      }
    }
  }, [activeTool, canvasSize, isCropped, finalCropRect]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  const handleToolPress = (toolId: string) => {
    if (toolId === activeTool) {
      if (toolId === 'crop' && cropRect) {
        handleCropComplete();
      } else {
        setActiveTool(null);
      }
      return;
    }

    setActiveTool(toolId as Tool);

    if (toolId === 'shape') {
      setShowShapePicker(true);
    } else if (toolId === 'line') {
      setShowLineThicknessPicker(true);
    } else if (toolId === 'draw' || toolId === 'paint') {
      setShowColorPicker(true);
    }
  };

  const handleStrokeStart = (point: Point) => {
    setCurrentStroke([point]);
  };

  const handleStrokeMove = (point: Point) => {
    setCurrentStroke(prev => [...prev, point]);
  };

  const handleStrokeEnd = () => {
    if (currentStroke.length > 1) {
      const newStroke: Stroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Add unique ID
        points: currentStroke,
        color: selectedColor,
        width: lineThickness,
        isClosed: false,
      };

      // Check if stroke is closed
      const firstPoint = currentStroke[0];
      const lastPoint = currentStroke[currentStroke.length - 1];
      if (
        distance(firstPoint.x, firstPoint.y, lastPoint.x, lastPoint.y) <
          CONSTANTS.CLOSE_THRESHOLD ||
        distance(firstPoint.x, firstPoint.y, lastPoint.x, lastPoint.y) < 15
      ) {
        newStroke.isClosed = true;
      }

      setStrokes(prev => [...prev, newStroke]);
      setCurrentStroke([]);
    }
  };

  const handleShapeSelect = (id: string | null) => {
    setActiveShapeId(id);
    setActiveLineId(null);
  };

  const handleLineSelect = (id: string | null) => {
    setActiveLineId(id);
    setActiveShapeId(null);
  };

  const handleShapeMove = (id: string, dx: number, dy: number) => {
    setShapes(prev =>
      prev.map(shape =>
        shape.id === id
          ? {
              ...shape,
              x: shape.x + dx,
              y: shape.y + dy,
            }
          : shape,
      ),
    );
  };

  const handleShapeResize = (
    id: string,
    corner: string,
    x: number,
    y: number,
  ) => {
    setShapes(prev =>
      prev.map(shape => {
        if (shape.id !== id) return shape;

        let newShape = {...shape};
        switch (corner) {
          case 'topLeft':
            newShape.width += shape.x - x;
            newShape.height += shape.y - y;
            newShape.x = x;
            newShape.y = y;
            break;
          case 'topRight':
            newShape.width = x - shape.x;
            newShape.height += shape.y - y;
            newShape.y = y;
            break;
          case 'bottomLeft':
            newShape.width += shape.x - x;
            newShape.height = y - shape.y;
            newShape.x = x;
            break;
          case 'bottomRight':
            newShape.width = x - shape.x;
            newShape.height = y - shape.y;
            break;
        }

        // Ensure minimum size
        if (newShape.width < CONSTANTS.MIN_CROP_SIZE) {
          newShape.width = CONSTANTS.MIN_CROP_SIZE;
          if (corner.includes('Left')) {
            newShape.x = shape.x + shape.width - CONSTANTS.MIN_CROP_SIZE;
          }
        }
        if (newShape.height < CONSTANTS.MIN_CROP_SIZE) {
          newShape.height = CONSTANTS.MIN_CROP_SIZE;
          if (corner.includes('Top')) {
            newShape.y = shape.y + shape.height - CONSTANTS.MIN_CROP_SIZE;
          }
        }

        return newShape;
      }),
    );
  };

  const handleLineMove = (id: string, dx: number, dy: number) => {
    setLines(prev =>
      prev.map(line =>
        line.id === id
          ? {
              ...line,
              x1: line.x1 + dx,
              y1: line.y1 + dy,
              x2: line.x2 + dx,
              y2: line.y2 + dy,
            }
          : line,
      ),
    );
  };

  const handleLineEndpointMove = (
    id: string,
    end: 'start' | 'end',
    x: number,
    y: number,
  ) => {
    setLines(prev =>
      prev.map(line =>
        line.id === id
          ? {
              ...line,
              ...(end === 'start' ? {x1: x, y1: y} : {x2: x, y2: y}),
            }
          : line,
      ),
    );
  };

  const handleCropStart = (
    handle:
      | 'move'
      | 'topLeft'
      | 'topRight'
      | 'bottomLeft'
      | 'bottomRight'
      | null,
    point: Point,
  ) => {
    setActiveCropHandle(handle);
    setCropStartPoint(point);
    setInitialCropRect(cropRect);
  };

  const handleCropMove = (point: Point) => {
    if (!cropStartPoint || !initialCropRect || !activeCropHandle) return;

    const dx = point.x - cropStartPoint.x;
    const dy = point.y - cropStartPoint.y;
    let newRect = {...initialCropRect};

    switch (activeCropHandle) {
      case 'move':
        newRect.x = Math.max(
          0,
          Math.min(newRect.x + dx, canvasSize.width - newRect.width),
        );
        newRect.y = Math.max(
          0,
          Math.min(newRect.y + dy, canvasSize.height - newRect.height),
        );
        break;
      case 'topLeft':
        {
          const maxX = initialCropRect.x + initialCropRect.width;
          const maxY = initialCropRect.y + initialCropRect.height;
          newRect.x = Math.max(0, Math.min(initialCropRect.x + dx, maxX));
          newRect.y = Math.max(0, Math.min(initialCropRect.y + dy, maxY));
          newRect.width = initialCropRect.x + initialCropRect.width - newRect.x;
          newRect.height =
            initialCropRect.y + initialCropRect.height - newRect.y;
        }
        break;
      case 'topRight':
        {
          const maxWidth = canvasSize.width - initialCropRect.x;
          const maxY = initialCropRect.y + initialCropRect.height;
          newRect.width = Math.max(
            0,
            Math.min(initialCropRect.width + dx, maxWidth),
          );
          newRect.y = Math.max(0, Math.min(initialCropRect.y + dy, maxY));
          newRect.height =
            initialCropRect.y + initialCropRect.height - newRect.y;
        }
        break;
      case 'bottomLeft':
        {
          const maxX = initialCropRect.x + initialCropRect.width;
          const maxHeight = canvasSize.height - initialCropRect.y;
          newRect.x = Math.max(0, Math.min(initialCropRect.x + dx, maxX));
          newRect.width = initialCropRect.x + initialCropRect.width - newRect.x;
          newRect.height = Math.max(
            0,
            Math.min(initialCropRect.height + dy, maxHeight),
          );
        }
        break;
      case 'bottomRight':
        {
          const maxWidth = canvasSize.width - initialCropRect.x;
          const maxHeight = canvasSize.height - initialCropRect.y;
          newRect.width = Math.max(
            0,
            Math.min(initialCropRect.width + dx, maxWidth),
          );
          newRect.height = Math.max(
            0,
            Math.min(initialCropRect.height + dy, maxHeight),
          );
        }
        break;
    }

    // Ensure width and height are not negative
    if (newRect.width < 0) {
      newRect.x = newRect.x + newRect.width;
      newRect.width = Math.abs(newRect.width);
    }

    if (newRect.height < 0) {
      newRect.y = newRect.y + newRect.height;
      newRect.height = Math.abs(newRect.height);
    }
    console.log("hi", cropRect)

    setCropRect(newRect);
  };

  const handleCropEnd = () => {
    console.log("end", cropRect)
    setActiveCropHandle(null);
    setCropStartPoint(null);
    setInitialCropRect(null);
  };

  const handleCropComplete = () => {
    if (!cropRect) return;

    if (isCropped && finalCropRect) {
      // For subsequent crops, adjust coordinates relative to the previous crop
      const newCropRect: CropRect = {
        x: finalCropRect.x + cropRect.x,
        y: finalCropRect.y + cropRect.y,
        width: cropRect.width,
        height: cropRect.height,
      };
      setFinalCropRect(newCropRect);
    } else {
      // First crop
      setFinalCropRect(cropRect);
      setIsCropped(true);
    }

    // Reset crop state
    setCropRect(null);
    setActiveTool(null);
  };

  const handleErase = (point: Point) => {
    const threshold = 20;

    // Remove strokes
    setStrokes(prev =>
      prev.filter(stroke => {
        // Check if any point in the stroke is near the eraser
        if (
          stroke.points.some(
            pt => distance(pt.x, pt.y, point.x, point.y) < threshold,
          )
        ) {
          return false;
        }
        return true;
      }),
    );

    // Remove shapes
    setShapes(prev => prev.filter(shape => !isPointInShape(point, shape)));

    // Remove lines
    setLines(prev =>
      prev.filter(line => {
        if (
          nearPoint(point.x, point.y, line.x1, line.y1) ||
          nearPoint(point.x, point.y, line.x2, line.y2)
        ) {
          return false;
        }
        return true;
      }),
    );
  };

  const handleAddShape = (type: ShapeType) => {
    const newShape: ShapeBox = {
      id: `shape-${Date.now()}`,
      type,
      x: canvasSize.width / 4,
      y: canvasSize.height / 4,
      width: canvasSize.width / 2,
      height: canvasSize.height / 2,
      fill: 'transparent',
    };
    setShapes(prev => [...prev, newShape]);
    setActiveShapeId(newShape.id);
    setShowShapePicker(false);
  };

  const handleAddLine = () => {
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;

    const newLine: LineShape = {
      id: `line-${Date.now()}`,
      x1: centerX - 100,
      y1: centerY,
      x2: centerX + 100,
      y2: centerY,
      color: selectedColor,
    };

    setLines(prev => [...prev, newLine]);
    setActiveLineId(newLine.id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.toolbarContainer}>
          <Toolbar
            activeTool={activeTool}
            onToolPress={handleToolPress}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
          />
        </View>

        <DrawingCanvas
          strokes={strokes}
          currentStroke={currentStroke}
          shapes={shapes}
          lines={lines}
          activeShapeId={activeShapeId}
          activeLineId={activeLineId}
          selectedColor={selectedColor}
          lineThickness={lineThickness}
          scale={scale}
          activeTool={activeTool}
          cropRect={cropRect}
          isCropped={isCropped}
          finalCropRect={finalCropRect}
          backgroundImage={backgroundImage}
          onLayout={() => {}}
          onImageLoad={dimensions => {
            const aspectRatio = dimensions.height / dimensions.width;
            setCanvasSize(prev => ({
              ...prev,
              height: prev.width * aspectRatio,
            }));
          }}
          onStrokeStart={handleStrokeStart}
          onStrokeMove={handleStrokeMove}
          onStrokeEnd={handleStrokeEnd}
          onShapeSelect={handleShapeSelect}
          onLineSelect={handleLineSelect}
          onShapeMove={handleShapeMove}
          onShapeResize={handleShapeResize}
          onLineMove={handleLineMove}
          onLineEndpointMove={handleLineEndpointMove}
          onCropStart={handleCropStart}
          onCropMove={handleCropMove}
          onCropEnd={handleCropEnd}
          onCropComplete={handleCropComplete}
          onErase={handleErase}
          setShapes={setShapes}
          setStrokes={setStrokes}
          style={{alignSelf: 'center'}}
        />

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.nextButton} onPress={() => {}}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>

        {showColorPicker && (
          <ColorPicker
            selectedColor={selectedColor}
            onColorSelect={color => {
              setSelectedColor(color);
              setShowColorPicker(false);
            }}
            onClose={() => setShowColorPicker(false)}
          />
        )}

        {showLineThicknessPicker && (
          <LineThicknessPicker
            selectedThickness={lineThickness}
            onThicknessSelect={thickness => {
              setLineThickness(thickness);
              setShowLineThicknessPicker(false);
              if (activeTool === 'line') {
                handleAddLine();
              }
            }}
            onClose={() => setShowLineThicknessPicker(false)}
          />
        )}

        {showShapePicker && (
          <ShapePicker
            selectedShape={null}
            onShapeSelect={shape => handleAddShape(shape as ShapeType)}
            onClose={() => setShowShapePicker(false)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  toolbarContainer: {
    paddingVertical: 16,
  },
  bottomBar: {
    paddingVertical: 16,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
  },
});
