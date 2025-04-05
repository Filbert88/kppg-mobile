"use client";
import React, {
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import FloodFill from "q-floodfill";

export interface PixelCanvasRef {
  doFloodFill: (x: number, y: number, fillColor: string) => void;
  eraseBetweenPoints: (
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    thickness: number
  ) => void;
}

interface PixelCanvasProps {
  width: number;
  height: number;
  activeTool: string; // "draw", "fill", "erase", etc.
  selectedColor: string;
  lineThickness: number;
}

function PixelCanvasImpl(
  { width, height, activeTool, selectedColor, lineThickness }: PixelCanvasProps,
  ref: React.Ref<PixelCanvasRef>
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctxRef.current = ctx;
        ctx.clearRect(0, 0, width, height);
      }
    }
  }, [width, height]);

  useImperativeHandle(ref, () => ({
    doFloodFill(x, y, fillColor) {
      if (!ctxRef.current || !canvasRef.current) return;
      const ctx = ctxRef.current;
      const imageData = ctx.getImageData(0, 0, width, height);
      const ff = new FloodFill(imageData);
      ff.fill(fillColor, Math.floor(x), Math.floor(y), 20);
      ctx.putImageData(imageData, 0, 0);
    },
    eraseBetweenPoints(p1, p2, thickness) {
      if (!ctxRef.current) return;
      const ctx = ctxRef.current;
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = thickness;
      ctx.stroke();
      ctx.closePath();
      ctx.restore();
    },
  }));

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (activeTool === "draw" && ctxRef.current) {
      setIsDrawing(true);
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(x, y);
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (isDrawing && ctxRef.current) {
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ctxRef.current.lineTo(x, y);
      ctxRef.current.strokeStyle = selectedColor;
      ctxRef.current.lineWidth = lineThickness;
      ctxRef.current.stroke();
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (isDrawing && ctxRef.current) {
      setIsDrawing(false);
      ctxRef.current.closePath();
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        pointerEvents: activeTool === "draw" ? "auto" : "none",
        backgroundColor: "transparent",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    />
  );
}

export default forwardRef(PixelCanvasImpl);
