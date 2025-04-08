"use client";
import React, { forwardRef, useRef, useState } from "react";
import PixelCanvas, { PixelCanvasRef } from "./PixelCanvas";
import { SvgOverlay } from "./SvgOverlay";

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
type ShapeType = "rect" | "circle";

interface Props {
  width: number;
  height: number;
  activeTool: Tool;
  shapeType: ShapeType;
  selectedColor: string;
  lineThickness: number;
  setActiveTool: (tool: Tool) => void;
  setDisablePan: (disable: boolean) => void;
}

const HybridContainer = forwardRef<PixelCanvasRef, Props>(
  (
    {
      width,
      height,
      activeTool,
      shapeType,
      selectedColor,
      lineThickness,
      setActiveTool,
      setDisablePan,
    },
    ref
  ) => {
    // Manage shapes and lines so that SvgOverlay can handle fill, shapes, and erase
    const [shapes, setShapes] = useState<any[]>([]);
    const [lines, setLines] = useState<any[]>([]);

    const pixelCanvasRef = useRef<PixelCanvasRef>(null);
    React.useImperativeHandle(ref, () => pixelCanvasRef.current!);

    return (
      <div style={{ position: "relative", width, height }}>
        {/* PixelCanvas renders the drawn pixels (z-index 1) */}
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
        {/* SvgOverlay (z-index 2) handles vector shapes, fill and erase */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width,
            height,
            zIndex: 2,
            pointerEvents: activeTool === "draw" ? "none" : "auto",
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
            onPixelFill={(x, y) => {
              if (pixelCanvasRef.current)
                pixelCanvasRef.current.doFloodFill(x, y, selectedColor);
            }}
            onPixelErase={(p1, p2) => {
              if (pixelCanvasRef.current)
                pixelCanvasRef.current.eraseBetweenPoints(
                  p1,
                  p2,
                  lineThickness
                );
            }}
            pointerEvents={activeTool === "draw" ? "none" : "auto"}
            setDisablePan={setDisablePan}
          />
        </div>
      </div>
    );
  }
);

HybridContainer.displayName = "HybridContainer";
export default HybridContainer;
