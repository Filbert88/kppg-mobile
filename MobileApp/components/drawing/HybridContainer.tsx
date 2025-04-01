// HybridContainer.tsx
import React, {useState, useRef} from 'react';
import {View, StyleSheet} from 'react-native';
import PixelCanvas, {PixelCanvasRef} from './PixelCanvas';
import SvgOverlay, {Shape, LineType} from './SvgOverlay';
import {Tool} from '../../pages/fragmentation-form/fragmentation-form5';

// The same "tool" type you used before

interface HybridContainerProps {
  // We get these from ImageCanvasContainer
  width: number;
  height: number;
  eraserThickness: number;
  setActiveTool: (tool: Tool) => void;
  activeTool: Tool; // 'draw', 'fill', etc.
  selectedColor: string;
  lineThickness: number;
}

export default function HybridContainer({
  width,
  height,
  eraserThickness,
  setActiveTool,
  activeTool,
  selectedColor,
  lineThickness,
}: HybridContainerProps) {
  // We store shapes/lines in parent-level state
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [lines, setLines] = useState<LineType[]>([]);

  // PixelCanvas ref so we can call doFloodFill
  const pixelCanvasRef = useRef<PixelCanvasRef>(null);

  // If user is "draw"ing, we want pointerEvents="none" on the overlay, so
  // that all touches pass to the pixel layer behind.
  const overlayPointerEvents = activeTool === 'draw' ? 'none' : 'auto';

  // Called by the SVG overlay if user is in fill mode and taps outside shapes.
  const handleCanvasFill = (x: number, y: number) => {
    pixelCanvasRef.current?.doFloodFill(x, y, selectedColor);
  };

  const handlePixelErase = (
    p1: {x: number; y: number},
    p2: {x: number; y: number},
  ) => {
    pixelCanvasRef.current?.eraseBetweenPoints(p1, p2, eraserThickness);
  };

  return (
    <View style={[styles.container, {width, height}]}>
      {/* Pixel-based canvas (freehand + bucket fill) behind */}
      <PixelCanvas
        ref={pixelCanvasRef}
        width={width}
        height={height}
        activeTool={activeTool}
        selectedColor={selectedColor}
        lineThickness={lineThickness}
      />

      {/* SVG overlay for shapes/lines (drag, resize, shape fill) */}
      <SvgOverlay
        width={width}
        height={height}
        shapes={shapes}
        setShapes={setShapes}
        lines={lines}
        setLines={setLines}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        selectedColor={selectedColor}
        lineThickness={lineThickness}
        onCanvasFill={handleCanvasFill}
        onPixelErase={handlePixelErase}
        pointerEvents={overlayPointerEvents}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
