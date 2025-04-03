"use client";
import React, { useState, useRef } from "react";
import PixelCanvas from "./PixelCanvas.tsx"; // your pixel-based freehand canvas component
import { SvgOverlay } from "./SvgOverlay.tsx"; // your SVG overlay component

type Tool =
  | "none"
  | "draw"
  | "erase"
  | "fill"
  | "crop"
  | "shapes"
  | "line"
  | "zoomIn"
  | "zoomOut";

/** When the user picks a shape tool, shapeType is either "rect" or "circle" */
type ShapeType = "rect" | "circle";

interface Props {
  width: number;
  height: number;
  activeTool: Tool;
  shapeType: ShapeType;
  selectedColor: string;
  lineThickness: number;
  setActiveTool: (tool: Tool) => void;
}

export default function HybridContainer({
  width,
  height,
  activeTool,
  shapeType,
  selectedColor,
  lineThickness,
  setActiveTool
}: Props) {
  // Store shapes and lines for the SVG overlay.
  const [shapes, setShapes] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);

  // Ref for the pixel canvas so we can call its imperative methods.
  const pixelCanvasRef = useRef<any>(null);

  // When the active tool is "draw", we want the overlay to not block pointer events.
  const overlayPointer = activeTool === "draw" ? "none" : "auto";

  // Callback for pixel fill – if user taps outside any shape in "fill" mode.
  function handleCanvasFill(x: number, y: number) {
    pixelCanvasRef.current?.doFloodFill(x, y, selectedColor);
  }

  // Callback for pixel erase – if user taps outside any shape in "erase" mode.
  function handlePixelErase(
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ) {
    pixelCanvasRef.current?.eraseBetweenPoints(p1, p2, lineThickness);
  }

  return (
    <div style={{ position: "relative", width, height }}>
      {/* PixelCanvas is rendered behind with z-index 1 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          zIndex: 1,
        }}
      >
        <PixelCanvas
          ref={pixelCanvasRef}
          width={width}
          height={height}
          activeTool={activeTool}
          selectedColor={selectedColor}
          lineThickness={lineThickness}
        />
      </div>

      {/* SvgOverlay is rendered on top with z-index 2 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          zIndex: 2,
          pointerEvents: overlayPointer,
        }}
      >
        <SvgOverlay
          width={width}
          height={height}
          shapes={shapes}
          setShapes={setShapes}
          lines={lines}
          setLines={setLines}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          shapeType={shapeType}
          color={selectedColor}
          lineThickness={lineThickness}
          onPixelFill={handleCanvasFill}
          onPixelErase={handlePixelErase}
          pointerEvents={overlayPointer}
        />
      </div>
    </div>
  );
}
