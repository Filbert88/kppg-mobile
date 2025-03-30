import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  GestureResponderEvent,
  StyleSheet,
  TouchableOpacity,
  Text,
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
  G,
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

const CONNECT_THRESHOLD = 1000;

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
  onImageLoad?: (dimensions: {width: number; height: number}) => void;
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
  setShapes:(shapes: ShapeBox[]) => void;
  setStrokes: (strokes: Stroke[]) => void;
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
  const [canvasSize, setCanvasSize] = useState({width: 0, height: 0});
  const [imageSize, setImageSize] = useState({width: 0, height: 0});
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);
  const [resizingLineEnd, setResizingLineEnd] = useState<
    'start' | 'end' | null
  >(null);

  const svgRef = useRef<any>(null);
  // Add new state for fill operation
  const [fillTarget, setFillTarget] = useState<{
    type: 'shape' | 'area';
    id?: string;
    point?: Point;
  } | null>(null);

  // Calculate canvas dimensions based on screen size
  useEffect(() => {
    const screenWidth = Dimensions.get('window').width;
    const padding = 32; // 16px padding on each side
    const maxWidth = Math.min(screenWidth - padding, 600);
    setCanvasSize({width: maxWidth, height: maxWidth});
  }, []);

  // Transform point coordinates based on scale and crop
  // Transform point with proper scaling
    const transformPoint = (evt: GestureResponderEvent): Point => {
      const {locationX: rawX, locationY: rawY} = evt.nativeEvent;

      if (isCropped && finalCropRect) {
        return {
          x: finalCropRect.x + rawX / scale,
          y: finalCropRect.y + rawY / scale,
        };
      } else {
        return {
          x: rawX / scale,
          y: rawY / scale,
        };
      }
    };

 const handleFill = (point: Point) => {
   if (activeTool !== 'paint') return;



   // Cek jika klik berada di dalam shape
   const targetShape = shapes.find(shape => isPointInShape(point, shape));
   if (targetShape) {
     const updatedShapes = shapes.map((shape: ShapeBox) =>
       shape.id === targetShape.id ? {...shape, fill: selectedColor} : shape,
     );
     setShapes(updatedShapes);
     return;
   }

   // Cek jika klik berada di dalam stroke yang sudah tertutup
   const targetStroke = strokes.find(
     stroke =>
       stroke.isClosed && pointInPolygon(point.x, point.y, stroke.points),
   );
   if (targetStroke) {
     setStrokes(
       strokes.map((stroke: Stroke) =>
         stroke.id === targetStroke.id
           ? {...stroke, fillColor: selectedColor}
           : stroke,
       ),
     );
     return;
   }

   const groups = mergeConnectedStrokes(strokes);
   console.log(groups);
   for (const group of groups) {
     if (group.polygon.length > 0) {
       // Hitung bounding box poligon
       const xs = group.polygon.map(p => p.x);
       const ys = group.polygon.map(p => p.y);
       const minX = Math.min(...xs);
       const maxX = Math.max(...xs);
       const minY = Math.min(...ys);
       const maxY = Math.max(...ys);
       const boxSize = Math.min(maxX - minX, maxY - minY);

       // Misalnya, gunakan threshold dinamis: minimal CONNECT_THRESHOLD atau 10% dari boxSize
       const dynamicThreshold = Math.max(CONNECT_THRESHOLD, boxSize * 0.1);

       const firstPoint = group.polygon[0];
       const lastPoint = group.polygon[group.polygon.length - 1];
       const closureDistance = distance(
         firstPoint.x,
         firstPoint.y,
         lastPoint.x,
         lastPoint.y,
       );
       console.log(
         'closureDistance:',
         closureDistance,
         'dynamicThreshold:',
         dynamicThreshold,
       );

       // Hanya jika poligon dianggap tertutup dan titik berada di dalamnya
       if (
         closureDistance < dynamicThreshold &&
         pointInPolygon(point.x, point.y, group.polygon)
       ) {
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

  const handleTouchStart = (evt: GestureResponderEvent) => {

    const point = transformPoint(evt);
      console.log('ini point', point);
     if (activeTool === 'paint') {
      console.log("hi")
       handleFill(point);
       return;
     }

    if (activeTool === 'erase' && onErase) {
      onErase(point);
      return;
    }

    if (activeTool === 'crop' && cropRect) {
      const handleSize = CONSTANTS.CROP_HANDLE_SIZE;
      const {x, y, width, height} = cropRect;

      // Check corners first
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

      // Check if inside crop area
      if (
        point.x >= x &&
        point.x <= x + width &&
        point.y >= y &&
        point.y <= y + height
      ) {
        onCropStart('move', point);
        return;
      }
      return;
    }

    if (activeTool === 'draw') {
      onStrokeStart(point);
      return;
    }

    // Handle shape selection and manipulation
    for (const shape of shapes) {
      const corners = getShapeCorners(shape);
      for (const [corner, pos] of Object.entries(corners)) {
        if (distance(point.x, point.y, pos.x, pos.y) < CONSTANTS.HANDLE_SIZE) {
          onShapeSelect(shape.id);
          setResizeCorner(corner);
          setDragStart(point);
          return;
        }
      }

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

    // Handle line selection and manipulation
    for (const line of lines) {
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

    onShapeSelect(null);
    onLineSelect(null);
  };

  const handleTouchMove = (evt: GestureResponderEvent) => {
    const point = transformPoint(evt);
    console.log("move", point)
    if (activeTool === 'crop' && cropRect) {
      // Apply proper scaling for crop movement

      onCropMove(point);
      return;
    }

    if (activeTool === 'draw') {
      onStrokeMove(point);
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

      setDragStart(point);
    }
  };

  const handleTouchEnd = () => {
    if (activeTool === 'crop') {
      console.log("scale",scale)
      onCropEnd();
    } else if (activeTool === 'draw') {
      onStrokeEnd();
    }

    setDragStart(null);
    setResizeCorner(null);
    setResizingLineEnd(null);
  };

  const handleImageLoad = (event: {nativeEvent: ImageLoadEventData}) => {
    const {width, height} = event.nativeEvent.source;
    setImageSize({width, height});

    // Calculate aspect ratio and adjust canvas height
    const aspectRatio = height / width;
    setCanvasSize(prev => ({
      ...prev,
      height: prev.width * aspectRatio,
    }));

    // if (onImageLoad) {
    //   onImageLoad({width, height});
    // }
  };

  // Calculate transform for content based on crop or scale
  const getContentTransform = () => {
    if (finalCropRect && canvasSize.width > 0) {
      const scaleX = canvasSize.width / finalCropRect.width;
      const scaleY = canvasSize.height / finalCropRect.height;
      const finalScale = Math.min(scaleX, scaleY);

      return [
        {scale: finalScale},
        {translateX: -finalCropRect.x * finalScale},
        {translateY: -finalCropRect.y * finalScale},
      ];
    }
    return [{scale}];
  };

  const renderCropOverlay = () => {
    if (!cropRect) return null;

    const handleSize = CONSTANTS.CROP_HANDLE_SIZE / 2;
    const {x, y, width, height} = cropRect;
    console.log("crop ovelay", cropRect)

    return (
      <>
        <Rect
          x={0}
          y={0}
          width={canvasSize.width}
          height={canvasSize.height}
          fill="rgba(0,0,0,0.5)"
        />
        <Rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="transparent"
          stroke="white"
          strokeWidth={2}
        />
        <Circle cx={x} cy={y} r={handleSize} fill="white" />
        <Circle cx={x + width} cy={y} r={handleSize} fill="white" />
        <Circle cx={x} cy={y + height} r={handleSize} fill="white" />
        <Circle cx={x + width} cy={y + height} r={handleSize} fill="white" />
      </>
    );
  };
  console.log("final", finalCropRect)
  return (
    <View
      style={[
        styles.container,
        style,
        {
          width: canvasSize.width,
          height: canvasSize.height,
        },
      ]}
      onLayout={onLayout}
      onStartShouldSetResponder={() => true}
      onResponderGrant={handleTouchStart}
      onResponderMove={handleTouchMove}
      onResponderRelease={handleTouchEnd}>
      {isCropped && finalCropRect ? (
        // Cropped view
        <View
          style={{
            width: finalCropRect.width ,
            height: finalCropRect.height ,
            overflow: 'hidden',
          }}>
          {backgroundImage && (
            <Image
              source={require('../../public/assets/batu.png')}
              style={{
                position: 'absolute',
                left: -finalCropRect.x ,
                top: -finalCropRect.y ,
                width: imageSize.width ,
                height: imageSize.height,
              }}
              resizeMode="contain"
            />
          )}

          <Svg
            ref={svgRef}
            style={{
              position: 'absolute',
              left: -finalCropRect.x ,
              top: -finalCropRect.y ,
              width: canvasSize.width ,
              height: canvasSize.height ,
            }}>
            {/* Render strokes */}
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
                      stroke={selectedColor}
                      strokeWidth={lineThickness}
                    />
                  )}
                  {shape.type === 'circle' && (
                    <Circle
                      cx={shape.x + shape.width / 2}
                      cy={shape.y + shape.height / 2}
                      r={Math.min(shape.width, shape.height) / 2}
                      fill={shape.fill || 'transparent'}
                      stroke={selectedColor}
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
                      stroke={selectedColor}
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

            {/* Render current stroke */}
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
        // Normal view (not cropped)
        <View
          style={[
            styles.contentContainer,
            {
              width: canvasSize.width,
              height: canvasSize.height,
              transform: [{scale}],
            },
          ]}>
          {backgroundImage && (
            <Image
              source={require('../../public/assets/batu.png')}
              style={[
                styles.backgroundImage,
                {
                  width: canvasSize.width,
                  height: canvasSize.height,
                  
                },
              ]}
              resizeMode="contain"
              onLoad={handleImageLoad}
            />
          )}

          <Svg
            ref={svgRef}
            style={[
              styles.svg,
              {
                width: canvasSize.width,
                height: canvasSize.height,
              },
            ]}>
            {/* Render strokes */}
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
                      stroke={selectedColor}
                      strokeWidth={lineThickness}
                    />
                  )}
                  {shape.type === 'circle' && (
                    <Circle
                      cx={shape.x + shape.width / 2}
                      cy={shape.y + shape.height / 2}
                      r={Math.min(shape.width, shape.height) / 2}
                      fill={shape.fill || 'transparent'}
                      stroke={selectedColor}
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
                      stroke={selectedColor}
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

            {/* Render current stroke */}
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
      )}

      {/* Crop overlay */}
      {activeTool === 'crop' && cropRect && (
        <>
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Svg style={StyleSheet.absoluteFill}>{renderCropOverlay()}</Svg>
          </View>

          <View style={styles.cropButtonsContainer}>
            <TouchableOpacity
              style={styles.cropButton}
              onPress={onCropComplete}>
              <Text style={styles.cropButtonText}>Done</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cropButton, styles.cancelButton]}
              onPress={() => {
                onCropEnd();
                onShapeSelect(null);
              }}>
              <Text style={styles.cropButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  contentContainer: {
    overflow: 'hidden',
  },
  transformContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cropButtonsContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
  },
  cropButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: COLORS.error,
  },
  cropButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
