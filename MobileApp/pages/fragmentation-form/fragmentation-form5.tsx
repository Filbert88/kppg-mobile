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

export default function FragmentationForm5() {
  // Canvas dimensions
  const [canvasSize, setCanvasSize] = useState(() => {
    const screenWidth = Dimensions.get('window').width;
    const padding = 32;
    const maxWidth = Math.min(screenWidth - padding, 600);
    return {width: maxWidth, height: maxWidth};
  });

  // Active tool and zoom scale
  const [activeTool, setActiveTool] = useState<Tool>(null);
  const [scale, setScale] = useState<number>(1);

  // Drawing style state
  const [selectedColor, setSelectedColor] = useState<string>(COLORS.primary);
  const [lineThickness, setLineThickness] = useState<number>(2);

  // Modal visibility for pickers
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLineThicknessPicker, setShowLineThicknessPicker] = useState(false);
  const [showShapePicker, setShowShapePicker] = useState(false);

  // Drawn elements state
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [shapes, setShapes] = useState<ShapeBox[]>([]);
  const [lines, setLines] = useState<LineShape[]>([]);
  const [activeShapeId, setActiveShapeId] = useState<string | null>(null);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);

  // Crop state
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

  // Sample background image (replace with actual image URI or require)
  const backgroundImage = 'https://example.com/sample-image.jpg';

  useEffect(() => {
    // When crop tool is selected, initialize the crop rectangle if not set
    if (activeTool === 'crop' && !cropRect) {
      if (isCropped && finalCropRect) {
        // If already cropped once, start new crop relative to the cropped area
        setCropRect({
          x: 0,
          y: 0,
          width: finalCropRect.width,
          height: finalCropRect.height,
        });
      } else {
        // Initial default crop rect (80% of canvas)
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
      // Tapping the active tool toggles it off, except for crop which finalizes on second tap
      if (toolId === 'crop' && cropRect) {
        handleCropComplete();
      } else {
        setActiveTool(null);
      }
      return;
    }
    // Activate the selected tool
    setActiveTool(toolId as Tool);
    // Open any sub-tool pickers if needed
    if (toolId === 'shape') {
      setShowShapePicker(true);
    } else if (toolId === 'line') {
      setShowLineThicknessPicker(true);
    } else if (toolId === 'draw' || toolId === 'paint') {
      setShowColorPicker(true);
    }
  };

  // Stroke (freehand) drawing handlers
  const handleStrokeStart = (point: Point) => {
    setCurrentStroke([point]);
  };
  const handleStrokeMove = (point: Point) => {
    setCurrentStroke(prev => [...prev, point]);
  };
  const handleStrokeEnd = () => {
    if (currentStroke.length > 1) {
      const newStroke: Stroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        points: currentStroke,
        color: selectedColor,
        width: lineThickness,
        isClosed: false,
      };
      // Mark stroke as closed if start and end are near
      const firstPoint = currentStroke[0];
      const lastPoint = currentStroke[currentStroke.length - 1];
      if (
        distance(firstPoint.x, firstPoint.y, lastPoint.x, lastPoint.y) <
        CONSTANTS.CLOSE_THRESHOLD
      ) {
        newStroke.isClosed = true;
      }
      setStrokes(prev => [...prev, newStroke]);
      setCurrentStroke([]);
    }
  };

  // Selection handlers for shapes and lines
  const handleShapeSelect = (id: string | null) => {
    setActiveShapeId(id);
    setActiveLineId(null);
  };
  const handleLineSelect = (id: string | null) => {
    setActiveLineId(id);
    setActiveShapeId(null);
  };

  // Shape manipulation handlers
  const handleShapeMove = (id: string, dx: number, dy: number) => {
    setShapes(prev =>
      prev.map(shape =>
        shape.id === id ? {...shape, x: shape.x + dx, y: shape.y + dy} : shape,
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
        // Enforce minimum shape size
        if (newShape.width < CONSTANTS.MIN_SHAPE_SIZE) {
          newShape.width = CONSTANTS.MIN_SHAPE_SIZE;
          if (corner.includes('Left')) {
            // Adjust X if resizing from left
            newShape.x = shape.x + shape.width - CONSTANTS.MIN_SHAPE_SIZE;
          }
        }
        if (newShape.height < CONSTANTS.MIN_SHAPE_SIZE) {
          newShape.height = CONSTANTS.MIN_SHAPE_SIZE;
          if (corner.includes('Top')) {
            // Adjust Y if resizing from top
            newShape.y = shape.y + shape.height - CONSTANTS.MIN_SHAPE_SIZE;
          }
        }
        return newShape;
      }),
    );
  };

  // Line manipulation handlers
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
          ? end === 'start'
            ? {...line, x1: x, y1: y}
            : {...line, x2: x, y2: y}
          : line,
      ),
    );
  };

  // Crop tool handlers
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
    if (!cropStartPoint || !initialCropRect || !activeCropHandle || !cropRect)
      return;
    const dx = point.x - cropStartPoint.x;
    const dy = point.y - cropStartPoint.y;
    let newRect = {...initialCropRect};
    const maxX = initialCropRect.x + initialCropRect.width;
    const maxY = initialCropRect.y + initialCropRect.height;
    switch (activeCropHandle) {
      case 'move':
        // Move crop rect, clamping within canvas
        newRect.x = Math.max(
          0,
          Math.min(
            initialCropRect.x + dx,
            canvasSize.width - initialCropRect.width,
          ),
        );
        newRect.y = Math.max(
          0,
          Math.min(
            initialCropRect.y + dy,
            canvasSize.height - initialCropRect.height,
          ),
        );
        break;
      case 'topLeft':
        newRect.x = Math.max(0, initialCropRect.x + dx);
        newRect.y = Math.max(0, initialCropRect.y + dy);
        newRect.width = maxX - newRect.x;
        newRect.height = maxY - newRect.y;
        break;
      case 'topRight':
        newRect.y = Math.max(0, initialCropRect.y + dy);
        newRect.width = Math.min(
          canvasSize.width - initialCropRect.x,
          initialCropRect.width + dx,
        );
        newRect.height = maxY - newRect.y;
        break;
      case 'bottomLeft':
        newRect.x = Math.max(0, initialCropRect.x + dx);
        newRect.width = maxX - newRect.x;
        newRect.height = Math.min(
          canvasSize.height - initialCropRect.y,
          initialCropRect.height + dy,
        );
        break;
      case 'bottomRight':
        newRect.width = Math.min(
          canvasSize.width - initialCropRect.x,
          initialCropRect.width + dx,
        );
        newRect.height = Math.min(
          canvasSize.height - initialCropRect.y,
          initialCropRect.height + dy,
        );
        break;
    }
    // Ensure minimum crop size
    if (newRect.width < CONSTANTS.MIN_CROP_SIZE)
      newRect.width = CONSTANTS.MIN_CROP_SIZE;
    if (newRect.height < CONSTANTS.MIN_CROP_SIZE)
      newRect.height = CONSTANTS.MIN_CROP_SIZE;
    setCropRect(newRect);
  };
  const handleCropEnd = () => {
    setActiveCropHandle(null);
    setCropStartPoint(null);
    setInitialCropRect(null);
  };
  const handleCropComplete = () => {
    if (!cropRect) return;
    if (isCropped && finalCropRect) {
      // If image already cropped before, adjust the new crop rect relative to original image
      const newCropRect: CropRect = {
        x: finalCropRect.x + cropRect.x,
        y: finalCropRect.y + cropRect.y,
        width: cropRect.width,
        height: cropRect.height,
      };
      setFinalCropRect(newCropRect);
    } else {
      // First-time crop
      setFinalCropRect(cropRect);
      setIsCropped(true);
    }
    // Reset current crop selection
    setCropRect(null);
    setActiveTool(null);
  };

  // Eraser handler
  const handleErase = (point: Point) => {
    const threshold = 20;
    // Remove any stroke where the touch is near one of its points
    setStrokes(prev =>
      prev.filter(
        stroke =>
          !stroke.points.some(
            pt => distance(pt.x, pt.y, point.x, point.y) < threshold,
          ),
      ),
    );
    // Remove any shape that contains the touch point
    setShapes(prev => prev.filter(shape => !isPointInShape(point, shape)));
    // Remove any line where touch is near either endpoint
    setLines(prev =>
      prev.filter(
        line =>
          !(
            nearPoint(point.x, point.y, line.x1, line.y1) ||
            nearPoint(point.x, point.y, line.x2, line.y2)
          ),
      ),
    );
  };

  // Add new shape or line
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
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-4">
        {/* Toolbar with tools and zoom controls */}
        <View className="py-4">
          <Toolbar
            activeTool={activeTool}
            onToolPress={handleToolPress}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
          />
        </View>

        {/* Drawing Canvas component */}
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
            // Adjust canvas height to image aspect ratio
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

        {/* Next/Submit button (placeholder) */}
        <View className="py-4">
          <TouchableOpacity
            className="bg-emerald-500 rounded-xl py-4"
            onPress={() => {}}>
            <Text className="text-white text-center font-semibold text-lg">
              Next
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modal pickers for color, thickness, shape */}
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
                // After picking line thickness, add a new line
                handleAddLine();
              }
            }}
            onClose={() => setShowLineThicknessPicker(false)}
          />
        )}
        {showShapePicker && (
          <ShapePicker
            selectedShape={null}
            onShapeSelect={shape => {
              handleAddShape(shape as ShapeType);
            }}
            onClose={() => setShowShapePicker(false)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
