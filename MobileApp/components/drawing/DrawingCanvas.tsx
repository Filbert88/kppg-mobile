import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  GestureResponderEvent,
  Image,
  ImageLoadEventData,
  Dimensions,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Rect,
  Polygon,
  Line as SvgLine,
} from 'react-native-svg';
import {Point, Stroke, ShapeBox, LineShape, Tool} from '../../types/drawing';
import {COLORS, CONSTANTS} from '../../constants/drawing';
import {
  strokeToPath,
  distance,
  nearPoint,
  getShapeCorners,
  lineBoundingBox,
  isPointInShape,
  pointInPolygon,
  mergeConnectedStrokes,
} from '../../utils/drawingUtils';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DrawingCanvasProps {
  strokes: Stroke[];
  currentStroke: Point[];
  shapes: ShapeBox[];
  lines: LineShape[];
  activeShapeId: string | null;
  activeLineId: string | null;
  selectedColor: string;
  lineThickness: number;
  scale: number;
  activeTool: Tool;
  cropRect: CropRect | null;
  isCropped: boolean;
  finalCropRect?: CropRect;
  backgroundImage?: string;
  onLayout: (event: any) => void;
  onImageLoad?: (dim: {width: number; height: number}) => void;
  onStrokeStart: (point: Point) => void;
  onStrokeMove: (point: Point) => void;
  onStrokeEnd: () => void;
  onShapeSelect: (id: string | null) => void;
  onLineSelect: (id: string | null) => void;
  onShapeMove: (id: string, dx: number, dy: number) => void;
  onShapeResize: (id: string, corner: string, x: number, y: number) => void;
  onLineMove: (id: string, dx: number, dy: number) => void;
  onLineEndpointMove: (
    id: string,
    end: 'start' | 'end',
    x: number,
    y: number,
  ) => void;
  onCropStart: (
    handle:
      | 'move'
      | 'topLeft'
      | 'topRight'
      | 'bottomLeft'
      | 'bottomRight'
      | null,
    point: Point,
  ) => void;
  onCropMove: (point: Point) => void;
  onCropEnd: () => void;
  onCropComplete: () => void;
  onErase?: (point: Point) => void;
  setShapes: (shapes: ShapeBox[] | ((prev: ShapeBox[]) => ShapeBox[])) => void;
  setStrokes: (strokes: Stroke[] | ((prev: Stroke[]) => Stroke[])) => void;
  style?: any;
}

export default function DrawingCanvas({
  strokes,
  currentStroke,
  shapes,
  lines,
  activeShapeId,
  activeLineId,
  selectedColor,
  lineThickness,
  scale,
  activeTool,
  cropRect,
  isCropped,
  finalCropRect,
  backgroundImage,
  onLayout,
  onImageLoad,
  onStrokeStart,
  onStrokeMove,
  onStrokeEnd,
  onShapeSelect,
  onLineSelect,
  onShapeMove,
  onShapeResize,
  onLineMove,
  onLineEndpointMove,
  onCropStart,
  onCropMove,
  onCropEnd,
  onCropComplete,
  onErase,
  setShapes,
  setStrokes,
  style,
}: DrawingCanvasProps) {
  const svgRef = useRef<Svg>(null);
  const [imageSize, setImageSize] = useState<{width: number; height: number}>({
    width: 0,
    height: 0,
  });
  // Track dragging state for shapes/lines
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);
  const [resizingLineEnd, setResizingLineEnd] = useState<
    'start' | 'end' | null
  >(null);

  // Initialize canvas size based on screen width (handles dynamic image aspect ratio)
  useEffect(() => {
    const screenWidth = Dimensions.get('window').width;
    const padding = 32;
    const maxWidth = Math.min(screenWidth - padding, 600);
    // Set canvas width and height to maxWidth until image loads and onImageLoad adjusts height
    setCanvasSize({width: maxWidth, height: maxWidth});
  }, []);
  const [canvasSize, setCanvasSize] = useState<{width: number; height: number}>(
    {
      width: 0,
      height: 0,
    },
  );

  // Helper to transform touch event coordinates into canvas coordinates (accounts for scale and cropping offset)
  const transformPoint = (evt: GestureResponderEvent): Point => {
    const {locationX: rawX, locationY: rawY} = evt.nativeEvent;
    if (isCropped && finalCropRect) {
      // If image was cropped, translate touch to original image coords
      return {
        x: finalCropRect.x + rawX / scale,
        y: finalCropRect.y + rawY / scale,
      };
    } else {
      // Without cropping, just account for current scale
      return {
        x: rawX / scale,
        y: rawY / scale,
      };
    }
  };

  // Fill handler (paint bucket)
  const handleFill = (point: Point) => {
    if (activeTool !== 'paint') return;
    // If tapping inside a shape, fill that shape
    const targetShape = shapes.find(shape => isPointInShape(point, shape));
    if (targetShape) {
      const updatedShapes = shapes.map(shape =>
        shape.id === targetShape.id ? {...shape, fill: selectedColor} : shape,
      );
      setShapes(updatedShapes);
      return;
    }
    // If tapping inside a closed stroke path, fill that stroke
    const targetStroke = strokes.find(
      stroke =>
        stroke.isClosed && pointInPolygon(point.x, point.y, stroke.points),
    );
    if (targetStroke) {
      setStrokes(
        strokes.map(stroke =>
          stroke.id === targetStroke.id
            ? {...stroke, fillColor: selectedColor}
            : stroke,
        ),
      );
      return;
    }
    // Otherwise, check if point is inside any region formed by connected strokes
    const groups = mergeConnectedStrokes(strokes);
    for (const group of groups) {
      if (group.polygon.length > 0) {
        // Compute if this group forms a closed polygon
        const firstPoint = group.polygon[0];
        const lastPoint = group.polygon[group.polygon.length - 1];
        const closureDistance = distance(
          firstPoint.x,
          firstPoint.y,
          lastPoint.x,
          lastPoint.y,
        );
        const dynamicThreshold = Math.max(
          CONSTANTS.CLOSE_THRESHOLD,
          0.1 * Math.min(group.polygon.length, group.polygon.length),
        );
        if (
          closureDistance < dynamicThreshold &&
          pointInPolygon(point.x, point.y, group.polygon)
        ) {
          // Fill all strokes in this group
          const newStrokes: Stroke[] = strokes.map((s, idx) =>
            group.indices.includes(idx)
              ? {...s, fillColor: selectedColor, isClosed: true}
              : s,
          );
          setStrokes(newStrokes);
          return;
        }
      }
    }
  };

  // Touch event handlers for the canvas
  const handleTouchStart = (evt: GestureResponderEvent) => {
    const point = transformPoint(evt);
    if (activeTool === 'paint') {
      handleFill(point);
      return;
    }
    if (activeTool === 'erase' && onErase) {
      onErase(point);
      // Start continuous erasing
      setDragStart(point);
      return;
    }
    if (activeTool === 'crop' && cropRect) {
      const handleSize = CONSTANTS.CROP_HANDLE_HIT_SIZE;
      const {x, y, width, height} = cropRect;
      // Determine if touch is on a crop handle (corners)
      if (distance(point.x, point.y, x, y) < handleSize) {
        onCropStart('topLeft', point);
        return;
      }
      if (distance(point.x, point.y, x + width, y) < handleSize) {
        onCropStart('topRight', point);
        return;
      }
      if (distance(point.x, point.y, x, y + height) < handleSize) {
        onCropStart('bottomLeft', point);
        return;
      }
      if (distance(point.x, point.y, x + width, y + height) < handleSize) {
        onCropStart('bottomRight', point);
        return;
      }
      // If inside the crop rectangle, allow moving the crop area
      if (
        point.x >= x &&
        point.x <= x + width &&
        point.y >= y &&
        point.y <= y + height
      ) {
        onCropStart('move', point);
        return;
      }
      return; // touches outside crop rect are ignored in crop mode
    }
    if (activeTool === 'draw') {
      onStrokeStart(point);
      return;
    }
    // Handle selection of shapes or lines (when no specific tool like draw/erase is active)
    for (const shape of shapes) {
      const corners = getShapeCorners(shape);
      // Check if touch is on a shape's corner handle
      for (const [corner, pos] of Object.entries(corners)) {
        if (distance(point.x, point.y, pos.x, pos.y) < CONSTANTS.HANDLE_SIZE) {
          onShapeSelect(shape.id);
          setResizeCorner(corner); // start resizing this shape
          setDragStart(point);
          return;
        }
      }
      // Check if touch is inside shape bounds (to move the shape)
      if (
        point.x >= shape.x &&
        point.x <= shape.x + shape.width &&
        point.y >= shape.y &&
        point.y <= shape.y + shape.height
      ) {
        onShapeSelect(shape.id);
        setDragStart(point);
        return;
      }
    }
    // Handle selection of lines
    for (const line of lines) {
      // Check if touch near line start or end point
      if (nearPoint(point.x, point.y, line.x1, line.y1)) {
        onLineSelect(line.id);
        setResizingLineEnd('start');
        setDragStart(point);
        return;
      }
      if (nearPoint(point.x, point.y, line.x2, line.y2)) {
        onLineSelect(line.id);
        setResizingLineEnd('end');
        setDragStart(point);
        return;
      }
      // Check if touch is near the line segment itself (within 10px bounding box buffer)
      const box = lineBoundingBox(line);
      if (
        point.x >= box.minX - 10 &&
        point.x <= box.maxX + 10 &&
        point.y >= box.minY - 10 &&
        point.y <= box.maxY + 10
      ) {
        onLineSelect(line.id);
        setDragStart(point);
        return;
      }
    }
    // If we reach here, user touch didn't hit any shape/line – deselect all
    onShapeSelect(null);
    onLineSelect(null);
  };

  const handleTouchMove = (evt: GestureResponderEvent) => {
    const point = transformPoint(evt);
    if (activeTool === 'crop' && cropRect) {
      onCropMove(point);
      return;
    }
    if (activeTool === 'draw') {
      onStrokeMove(point);
      return;
    }
    if (activeTool === 'erase' && onErase) {
      onErase(point);
      // Continue erasing as finger moves
      setDragStart(point);
      return;
    }
    if (dragStart) {
      const dx = point.x - dragStart.x;
      const dy = point.y - dragStart.y;
      if (activeShapeId) {
        if (resizeCorner) {
          onShapeResize(activeShapeId, resizeCorner, point.x, point.y);
        } else {
          onShapeMove(activeShapeId, dx, dy);
        }
      } else if (activeLineId) {
        if (resizingLineEnd) {
          onLineEndpointMove(activeLineId, resizingLineEnd, point.x, point.y);
        } else {
          onLineMove(activeLineId, dx, dy);
        }
      }
      // Update drag start for continued movement
      setDragStart(point);
    }
  };

  const handleTouchEnd = () => {
    if (activeTool === 'crop') {
      onCropEnd();
    } else if (activeTool === 'draw') {
      onStrokeEnd();
    }
    // Reset drag state
    setDragStart(null);
    setResizeCorner(null);
    setResizingLineEnd(null);
  };

  const handleImageLoad = (event: {nativeEvent: ImageLoadEventData}) => {
    const {width, height} = event.nativeEvent.source;
    setImageSize({width, height});
    // Adjust canvas height to preserve image aspect ratio
    const aspectRatio = height / width;
    setCanvasSize(prev => ({
      ...prev,
      height: prev.width * aspectRatio,
    }));
    onImageLoad && onImageLoad({width, height});
  };

  // Render the cropping overlay (dimmed outside area + bright crop rectangle + handles)
  const renderCropOverlay = () => {
    if (!cropRect) return null;
    const handleRadius = CONSTANTS.CROP_HANDLE_SIZE / 2;
    const {x, y, width, height} = cropRect;
    return (
      <>
        {/* Dimmed outside area */}
        <Rect
          x={0}
          y={0}
          width={canvasSize.width}
          height={canvasSize.height}
          fill="rgba(0,0,0,0.5)"
        />
        {/* Clear crop rectangle area */}
        <Rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="transparent"
          stroke="#fff"
          strokeWidth={2}
        />
        {/* Corner handles */}
        <Circle cx={x} cy={y} r={handleRadius} fill="#fff" />
        <Circle cx={x + width} cy={y} r={handleRadius} fill="#fff" />
        <Circle cx={x} cy={y + height} r={handleRadius} fill="#fff" />
        <Circle cx={x + width} cy={y + height} r={handleRadius} fill="#fff" />
      </>
    );
  };

  // Determine the content scaling/translation if cropped
  const contentTransform = () => {
    if (finalCropRect) {
      // If cropped, scale the content so that the cropped area fits the canvas
      const scaleX = canvasSize.width / finalCropRect.width;
      const scaleY = canvasSize.height / finalCropRect.height;
      const finalScale = Math.min(scaleX, scaleY);
      return [
        {scale: finalScale},
        {translateX: -finalCropRect.x * finalScale},
        {translateY: -finalCropRect.y * finalScale},
      ];
    }
    // If not cropped, just apply uniform scale for zoom
    return [{scale}];
  };

  return (
    <View
      style={[
        {
          width: canvasSize.width,
          height: canvasSize.height,
        },
        style,
      ]}
      onLayout={onLayout}
      onStartShouldSetResponder={() => true}
      onResponderGrant={handleTouchStart}
      onResponderMove={handleTouchMove}
      onResponderRelease={handleTouchEnd}>
      {/* If cropped, use a clipped view of just the cropped area */}
      {isCropped && finalCropRect ? (
        <View
          style={{
            width: finalCropRect.width,
            height: finalCropRect.height,
            overflow: 'hidden',
          }}>
          {/* Background image positioned for cropped area */}
          {backgroundImage && (
            <Image
              source={
                require('../../public/assets/batu.png')
              }
              style={{
                position: 'absolute',
                left: -finalCropRect.x,
                top: -finalCropRect.y,
                width: imageSize.width,
                height: imageSize.height,
              }}
              resizeMode="contain"
            />
          )}
          {/* SVG for strokes/shapes/lines positioned for cropped area */}
          <Svg
            ref={svgRef}
            style={{
              position: 'absolute',
              left: -finalCropRect.x,
              top: -finalCropRect.y,
              width: canvasSize.width,
              height: canvasSize.height,
            }}>
            {/* Render all strokes (filled or unfilled) */}
            {strokes.map((stroke, i) => (
              <Path
                key={`stroke-${i}`}
                d={strokeToPath(stroke.points)}
                stroke={stroke.color}
                strokeWidth={stroke.width}
                fill={stroke.fillColor || 'none'}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {/* Render shapes */}
            {shapes.map(shape => {
              const isActive = shape.id === activeShapeId;
              return (
                <React.Fragment key={shape.id}>
                  {shape.type === 'rect' && (
                    <Rect
                      x={shape.x}
                      y={shape.y}
                      width={shape.width}
                      height={shape.height}
                      fill={shape.fill || 'transparent'}
                      stroke={COLORS.shapeStroke} // constant stroke color for shapes
                      strokeWidth={lineThickness}
                    />
                  )}
                  {shape.type === 'circle' && (
                    <Circle
                      cx={shape.x + shape.width / 2}
                      cy={shape.y + shape.height / 2}
                      r={Math.min(shape.width, shape.height) / 2}
                      fill={shape.fill || 'transparent'}
                      stroke={COLORS.shapeStroke}
                      strokeWidth={lineThickness}
                    />
                  )}
                  {shape.type === 'triangle' && (
                    <Polygon
                      points={`${shape.x + shape.width / 2},${shape.y} ${
                        shape.x
                      },${shape.y + shape.height} ${shape.x + shape.width},${
                        shape.y + shape.height
                      }`}
                      fill={shape.fill || 'transparent'}
                      stroke={COLORS.shapeStroke}
                      strokeWidth={lineThickness}
                    />
                  )}
                  {/* Render shape corner handles if this shape is active/selected */}
                  {isActive && (
                    <>
                      <Circle
                        cx={shape.x}
                        cy={shape.y}
                        r={CONSTANTS.HANDLE_SIZE / 2}
                        fill="gray"
                      />
                      <Circle
                        cx={shape.x + shape.width}
                        cy={shape.y}
                        r={CONSTANTS.HANDLE_SIZE / 2}
                        fill="gray"
                      />
                      <Circle
                        cx={shape.x}
                        cy={shape.y + shape.height}
                        r={CONSTANTS.HANDLE_SIZE / 2}
                        fill="gray"
                      />
                      <Circle
                        cx={shape.x + shape.width}
                        cy={shape.y + shape.height}
                        r={CONSTANTS.HANDLE_SIZE / 2}
                        fill="gray"
                      />
                    </>
                  )}
                </React.Fragment>
              );
            })}
            {/* Render lines */}
            {lines.map(line => {
              const isActive = line.id === activeLineId;
              return (
                <React.Fragment key={line.id}>
                  <SvgLine
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke={line.color}
                    strokeWidth={lineThickness}
                  />
                  {/* If active, draw endpoint handles */}
                  {isActive && (
                    <>
                      <Circle
                        cx={line.x1}
                        cy={line.y1}
                        r={CONSTANTS.HANDLE_SIZE / 2}
                        fill="gray"
                      />
                      <Circle
                        cx={line.x2}
                        cy={line.y2}
                        r={CONSTANTS.HANDLE_SIZE / 2}
                        fill="gray"
                      />
                    </>
                  )}
                </React.Fragment>
              );
            })}
            {/* Render the stroke currently being drawn (if any) */}
            {currentStroke.length > 0 && (
              <Path
                d={strokeToPath(currentStroke)}
                stroke={selectedColor}
                strokeWidth={lineThickness}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </Svg>
        </View>
      ) : (
        // Normal full-view (not cropped)
        <View
          style={{
            width: canvasSize.width,
            height: canvasSize.height,
            transform: [{scale}], // apply zoom scale
          }}>
          {/* Background image underneath SVG drawing */}
          {backgroundImage && (
            <Image
              source={
                 require('../../public/assets/batu.png')
              }
              style={{
                width: canvasSize.width,
                height: canvasSize.height,
              }}
              resizeMode="contain"
              onLoad={handleImageLoad}
            />
          )}
          {/* SVG overlay for drawings */}
          <Svg
            ref={svgRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: canvasSize.width,
              height: canvasSize.height,
            }}>
            {strokes.map((stroke, i) => (
              <Path
                key={`stroke-${i}`}
                d={strokeToPath(stroke.points)}
                stroke={stroke.color}
                strokeWidth={stroke.width}
                fill={stroke.fillColor || 'none'}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {shapes.map(shape => {
              const isActive = shape.id === activeShapeId;
              return (
                <React.Fragment key={shape.id}>
                  {shape.type === 'rect' && (
                    <Rect
                      x={shape.x}
                      y={shape.y}
                      width={shape.width}
                      height={shape.height}
                      fill={shape.fill || 'transparent'}
                      stroke={COLORS.shapeStroke}
                      strokeWidth={lineThickness}
                    />
                  )}
                  {shape.type === 'circle' && (
                    <Circle
                      cx={shape.x + shape.width / 2}
                      cy={shape.y + shape.height / 2}
                      r={Math.min(shape.width, shape.height) / 2}
                      fill={shape.fill || 'transparent'}
                      stroke={COLORS.shapeStroke}
                      strokeWidth={lineThickness}
                    />
                  )}
                  {shape.type === 'triangle' && (
                    <Polygon
                      points={`${shape.x + shape.width / 2},${shape.y} ${
                        shape.x
                      },${shape.y + shape.height} ${shape.x + shape.width},${
                        shape.y + shape.height
                      }`}
                      fill={shape.fill || 'transparent'}
                      stroke={COLORS.shapeStroke}
                      strokeWidth={lineThickness}
                    />
                  )}
                  {isActive && (
                    <>
                      <Circle
                        cx={shape.x}
                        cy={shape.y}
                        r={CONSTANTS.HANDLE_SIZE / 2}
                        fill="gray"
                      />
                      <Circle
                        cx={shape.x + shape.width}
                        cy={shape.y}
                        r={CONSTANTS.HANDLE_SIZE / 2}
                        fill="gray"
                      />
                      <Circle
                        cx={shape.x}
                        cy={shape.y + shape.height}
                        r={CONSTANTS.HANDLE_SIZE / 2}
                        fill="gray"
                      />
                      <Circle
                        cx={shape.x + shape.width}
                        cy={shape.y + shape.height}
                        r={CONSTANTS.HANDLE_SIZE / 2}
                        fill="gray"
                      />
                    </>
                  )}
                </React.Fragment>
              );
            })}
            {lines.map(line => {
              const isActive = line.id === activeLineId;
              return (
                <React.Fragment key={line.id}>
                  <SvgLine
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke={line.color}
                    strokeWidth={lineThickness}
                  />
                  {isActive && (
                    <>
                      <Circle
                        cx={line.x1}
                        cy={line.y1}
                        r={CONSTANTS.HANDLE_SIZE / 2}
                        fill="gray"
                      />
                      <Circle
                        cx={line.x2}
                        cy={line.y2}
                        r={CONSTANTS.HANDLE_SIZE / 2}
                        fill="gray"
                      />
                    </>
                  )}
                </React.Fragment>
              );
            })}
            {currentStroke.length > 0 && (
              <Path
                d={strokeToPath(currentStroke)}
                stroke={selectedColor}
                strokeWidth={lineThickness}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {/* Render crop overlay on top if crop tool is active */}
            {activeTool === 'crop' && renderCropOverlay()}
          </Svg>
        </View>
      )}
    </View>
  );
}
