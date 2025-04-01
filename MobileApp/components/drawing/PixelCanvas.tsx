import React, {
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useMemo,
  useEffect,
} from 'react';
import {View, PanResponder, StyleSheet} from 'react-native';
import Canvas, { CanvasRenderingContext2D } from 'react-native-canvas';
import FloodFill from 'q-floodfill';

/** Exposes doFloodFill(...) for paint-bucket usage. */
export interface PixelCanvasRef {
  doFloodFill: (x: number, y: number, fillColor: string) => void;
  reDrawAllStrokes: () => void; // optional if you want to re-draw after unmount
}

/** A finished stroke: array of points + color/thickness. */
interface Stroke {
  points: Array<{x: number; y: number}>;
  color: string;
  thickness: number;
}

/** Props for the pixel-based canvas. */
interface PixelCanvasProps {
  width: number;
  height: number;
  activeTool: string | null; // e.g. 'draw', 'fill'
  selectedColor: string;
  lineThickness: number;
}

function PixelCanvasImpl(
  {width, height, activeTool, selectedColor, lineThickness}: PixelCanvasProps,
  ref: React.Ref<PixelCanvasRef>,
) {
  const canvasRef = useRef<Canvas | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // We store finalized strokes, but we do NOT forcibly re-draw on every stroke change.
  const [strokes, setStrokes] = useState<Stroke[]>([]);

  // The in-progress stroke points
  const [currentStrokePoints, setCurrentStrokePoints] = useState<
    Array<{x: number; y: number}>
  >([]);

  /**
   * 1) A stable callback that runs only when the canvas first mounts.
   *    We set the size and get the 2D context, storing it in `ctxRef`.
   */
  const handleCanvasRef = useCallback(
    (canvas: Canvas | null) => {
      if (!canvas) return;
      canvasRef.current = canvas;

      // Set the canvas size once
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctxRef.current = ctx;

      // Optionally fill a background color once
      // ctx.fillStyle = "#ffffff";
      // ctx.fillRect(0, 0, width, height);
    },
    [width, height],
  );

  /**
   * 2) On initial mount (empty deps), re-draw existing strokes if you want
   *    so we have them if the user navigates away and back.
   */
  useEffect(() => {
    // If you want to re-draw stored strokes on mount, call reDrawAllStrokes() once
    reDrawAllStrokes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 3) Re-draw all strokes from the array (clear first).
   *    We only do this manually (on mount or if you add an undo/redo feature),
   *    rather than on every stroke update, to avoid flicker.
   */
  const reDrawAllStrokes = useCallback(() => {
    if (!ctxRef.current) return;
    const ctx = ctxRef.current;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Re-draw each stroke
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.thickness;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.closePath();
    }
  }, [strokes, width, height]);

  /**
   * 4) Draw a small ephemeral line segment from p1 => p2 directly on the pixel buffer
   *    so the user sees immediate feedback while drawing, with no re-init or flicker.
   */
  const drawLiveSegment = useCallback(
    (p1: {x: number; y: number}, p2: {x: number; y: number}) => {
      if (!ctxRef.current) return;
      const ctx = ctxRef.current;

      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = lineThickness;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.closePath();
    },
    [selectedColor, lineThickness],
  );

  /**
   * 5) Imperative handle for doFloodFill
   */
  useImperativeHandle(ref, () => ({
    doFloodFill: async (x: number, y: number, fillColor: string) => {
      if (!ctxRef.current) return;
      const ctx = ctxRef.current;
        console.log("fill")
      // get pixel data
      const imgData = await ctx.getImageData(0, 0, width, height);
        console.log('fill2');
      const ff = new FloodFill(imgData);
      try{
        ff.fill(fillColor, Math.floor(x), Math.floor(y), 0);
      }catch(err){
        console.log(err)
      }
      
        console.log('fill3');
      ctx.putImageData(imgData, 0, 0);
    },

    // Optional: let parent call reDrawAllStrokes if it wants to forcibly re-draw everything
    reDrawAllStrokes,
  }));

  // ========== PANRESPONDER for "draw" ==========

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: evt => {
          if (activeTool === 'draw') {
            const {locationX, locationY} = evt.nativeEvent;
            setCurrentStrokePoints([{x: locationX, y: locationY}]);
          }
        },

        onPanResponderMove: evt => {
          if (activeTool === 'draw' && currentStrokePoints.length > 0) {
            const {locationX, locationY} = evt.nativeEvent;
            const prevPt = currentStrokePoints[currentStrokePoints.length - 1];
            const newPt = {x: locationX, y: locationY};

            // 1) Draw ephemeral segment on the pixel buffer
            drawLiveSegment(prevPt, newPt);

            // 2) Add point to the in-progress array
            setCurrentStrokePoints(prev => [...prev, newPt]);
          }
        },

        onPanResponderRelease: () => {
          if (activeTool === 'draw' && currentStrokePoints.length > 1) {
            // finalize stroke
            const newStroke: Stroke = {
              points: currentStrokePoints,
              color: selectedColor,
              thickness: lineThickness,
            };
            // store in array => can re-draw later if needed
            setStrokes(prev => [...prev, newStroke]);
          }
          // Clear the in-progress stroke
          setCurrentStrokePoints([]);
        },
      }),
    [
      activeTool,
      currentStrokePoints,
      selectedColor,
      lineThickness,
      drawLiveSegment,
    ],
  );

  return (
    <View
      style={[styles.container, {width, height}]}
      {...panResponder.panHandlers}>
      <Canvas
        ref={handleCanvasRef}
        style={{
          width,
          height,
          backgroundColor: 'transparent',
        }}
      />
    </View>
  );
}

export default forwardRef(PixelCanvasImpl);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
