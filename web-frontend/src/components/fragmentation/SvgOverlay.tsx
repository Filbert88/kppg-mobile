"use client";
import React, { useState, useEffect } from "react";
import { ShapeType, Tool } from "./canvas";

export interface Shape {
  id: string;
  x: number;
  y: number;
  shapeType: ShapeType;
  width: number;
  height: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}

export interface LineType {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeColor: string;
  strokeWidth: number;
}

interface Point {
  x: number;
  y: number;
}

interface SvgOverlayProps {
  width: number;
  height: number;
  shapes: Shape[];
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>;
  lines: LineType[];
  setLines: React.Dispatch<React.SetStateAction<LineType[]>>;
  activeTool: string; // "rect", "circle", "line", "fill", "erase", or "none"
  /** When activeTool === "shapes", shapeType determines whether to create a rectangle or a circle */
  shapeType: "rect" | "circle";
  color: string;
  lineThickness: number;
  setActiveTool: (tool: Tool) => void;
  onPixelFill: (x: number, y: number) => void;
  onPixelErase: (p1: Point, p2: Point) => void;
  pointerEvents?: "auto" | "none";
  setDisablePan: (disable: boolean) => void;
}

// Internal ephemeral state for creation:
type EphemeralCreation = {
  type: "rect" | "circle" | "line";
  start: Point;
  end: Point;
} | null;

type DragMode = "move" | "resize" | null;
type SelectedElement =
  | { type: "shape"; id: string }
  | { type: "line"; id: string }
  | null;

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function shapeBoundingBox(s: Shape) {
  const x1 = Math.min(s.x, s.x + s.width);
  const x2 = Math.max(s.x, s.x + s.width);
  const y1 = Math.min(s.y, s.y + s.height);
  const y2 = Math.max(s.y, s.y + s.height);
  return { x1, x2, y1, y2 };
}

function isPointInShape(px: number, py: number, s: Shape): boolean {
  const { x1, x2, y1, y2 } = shapeBoundingBox(s);
  return px >= x1 && px <= x2 && py >= y1 && py <= y2;
}

function shapeCorners(s: Shape) {
  const { x1, x2, y1, y2 } = shapeBoundingBox(s);
  return {
    topLeft: { x: x1, y: y1 },
    topRight: { x: x2, y: y1 },
    bottomLeft: { x: x1, y: y2 },
    bottomRight: { x: x2, y: y2 },
  };
}

function dist(p1: Point, p2: Point) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function isNear(p1: Point, p2: Point, threshold = 10) {
  return dist(p1, p2) < threshold;
}

function distanceToLine(p: Point, line: LineType): number {
  const { x, y } = p;
  const { x1, y1, x2, y2 } = line;
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;
  let xx, yy;
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  return Math.hypot(x - xx, y - yy);
}

export function SvgOverlay({
  width,
  height,
  shapes,
  setShapes,
  lines,
  setLines,
  activeTool,
  shapeType,
  color,
  lineThickness,
  onPixelFill,
  onPixelErase,
  setActiveTool,
  pointerEvents = "auto",
  setDisablePan,
}: SvgOverlayProps) {
  // Ephemeral state for creation of new shapes/lines
  const [creatingShape, setCreatingShape] = useState<EphemeralCreation>(null);
  // Selection/resizing state
  const [selectedElement, setSelectedElement] = useState<SelectedElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [initialPointer, setInitialPointer] = useState<Point | null>(null);
  const [initialShape, setInitialShape] = useState<Shape | null>(null);
  const [initialLine, setInitialLine] = useState<LineType | null>(null);
  const [resizeCorner, setResizeCorner] = useState<
    "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | null
  >(null);
  const [resizeLineEndpoint, setResizeLineEndpoint] = useState<
    "start" | "end" | null
  >(null);
  const [lastErasePoint, setLastErasePoint] = useState<Point | null>(null);

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      setDisablePan(false);
    };
    window.addEventListener("pointerup", handleGlobalPointerUp);
    return () => {
      window.removeEventListener("pointerup", handleGlobalPointerUp);
    };
  }, [setDisablePan]);

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point: Point = { x, y };

    // For fill mode
    if (activeTool === "fill") {
      const shapeHit = shapes.find((s) => isPointInShape(x, y, s));
      if (shapeHit) {
        setShapes((prev) =>
          prev.map((s) =>
            s.id === shapeHit.id ? { ...s, fillColor: color } : s
          )
        );
      } else {
        onPixelFill(x, y);
      }
      setActiveTool("none");
      e.stopPropagation();
      return;
    }

    // For erase mode
    if (activeTool === "erase") {
      const shapeHit = shapes.find((s) => isPointInShape(x, y, s));
      if (shapeHit) {
        setShapes((prev) => prev.filter((s) => s.id !== shapeHit.id));
      } else {
        setLastErasePoint(point);
      }
      e.stopPropagation();
      return;
    }

    // For creating shapes/lines (activeTool "line" or "shapes")
    if (activeTool === "line" || activeTool === "shapes") {
      e.stopPropagation();
      // No need to disable panning here because TransformWrapper is already disabled for these tools.
      setCreatingShape({
        type: activeTool === "line" ? "line" : shapeType,
        start: point,
        end: point,
      });
      return;
    }

    // For selection mode (activeTool "none")
    if (activeTool === "none") {
      // Check if pointer is on a shape or line.
      const shapeSel = shapes.find((s) => isPointInShape(x, y, s));
      const lineSel = lines.find((ln) => distanceToLine(point, ln) < 10);
      if (shapeSel || lineSel) {
        e.stopPropagation();
        setDisablePan(true);
      }
      if (shapeSel) {
        const corners = shapeCorners(shapeSel);
        let foundCorner:
          | "topLeft"
          | "topRight"
          | "bottomLeft"
          | "bottomRight"
          | null = null;
        for (const key in corners) {
          if (isNear(point, corners[key as keyof typeof corners], 10)) {
            foundCorner = key as
              | "topLeft"
              | "topRight"
              | "bottomLeft"
              | "bottomRight";
            break;
          }
        }
        setSelectedElement({ type: "shape", id: shapeSel.id });
        setInitialPointer(point);
        setInitialShape(shapeSel);
        if (foundCorner) {
          setDragMode("resize");
          setResizeCorner(foundCorner);
        } else {
          setDragMode("move");
          setResizeCorner(null);
        }
        return;
      }
      if (lineSel) {
        const nearStart = isNear(point, { x: lineSel.x1, y: lineSel.y1 }, 10);
        const nearEnd = isNear(point, { x: lineSel.x2, y: lineSel.y2 }, 10);
        setSelectedElement({ type: "line", id: lineSel.id });
        setInitialPointer(point);
        setInitialLine(lineSel);
        if (nearStart) {
          setDragMode("resize");
          setResizeLineEndpoint("start");
        } else if (nearEnd) {
          setDragMode("resize");
          setResizeLineEndpoint("end");
        } else {
          setDragMode("move");
          setResizeLineEndpoint(null);
        }
        return;
      }
      // Otherwise, let the event propagate (for canvas panning).
    }
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (creatingShape || dragMode) {
      e.stopPropagation();
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point: Point = { x, y };

    // Erase mode: if pixel erase is active
    if (activeTool === "erase" && lastErasePoint) {
      onPixelErase(lastErasePoint, point);
      setLastErasePoint(point);
      e.stopPropagation();
      return;
    }

    // If creating a new shape or line, update its end point
    if (creatingShape) {
      setCreatingShape({ ...creatingShape, end: point });
      return;
    }

    // If in selection mode with drag/resize active
    if (activeTool === "none" && selectedElement && dragMode) {
      const dx = x - (initialPointer?.x || 0);
      const dy = y - (initialPointer?.y || 0);

      if (selectedElement.type === "shape" && initialShape) {
        if (dragMode === "move") {
          let newX = initialShape.x + dx;
          let newY = initialShape.y + dy;
          newX = Math.max(0, Math.min(newX, width - Math.abs(initialShape.width)));
          newY = Math.max(0, Math.min(newY, height - Math.abs(initialShape.height)));
          setShapes((prev) =>
            prev.map((s) =>
              s.id === selectedElement.id ? { ...s, x: newX, y: newY } : s
            )
          );
        } else if (dragMode === "resize" && resizeCorner) {
          const { x1, y1, x2, y2 } = shapeBoundingBox(initialShape);
          const minSize = 10;
          let newX1 = x1,
            newY1 = y1,
            newX2 = x2,
            newY2 = y2;
          if (resizeCorner === "topLeft") {
            newX1 = Math.max(0, Math.min(x, x2 - minSize));
            newY1 = Math.max(0, Math.min(y, y2 - minSize));
          } else if (resizeCorner === "topRight") {
            newX2 = Math.min(width, Math.max(x, x1 + minSize));
            newY1 = Math.max(0, Math.min(y, y2 - minSize));
          } else if (resizeCorner === "bottomLeft") {
            newX1 = Math.max(0, Math.min(x, x2 - minSize));
            newY2 = Math.min(height, Math.max(y, y1 + minSize));
          } else if (resizeCorner === "bottomRight") {
            newX2 = Math.min(width, Math.max(x, x1 + minSize));
            newY2 = Math.min(height, Math.max(y, y1 + minSize));
          }
          const updatedShape: Shape = {
            ...initialShape,
            x: newX1,
            y: newY1,
            width: newX2 - newX1,
            height: newY2 - newY1,
          };
          setShapes((prev) =>
            prev.map((s) => (s.id === selectedElement.id ? updatedShape : s))
          );
        }
      } else if (selectedElement.type === "line" && initialLine) {
        if (dragMode === "move") {
          const updatedLine: LineType = {
            ...initialLine,
            x1: initialLine.x1 + dx,
            y1: initialLine.y1 + dy,
            x2: initialLine.x2 + dx,
            y2: initialLine.y2 + dy,
          };
          setLines((prev) =>
            prev.map((l) => (l.id === selectedElement.id ? updatedLine : l))
          );
        } else if (dragMode === "resize" && resizeLineEndpoint) {
          const updatedLine: LineType = { ...initialLine };
          if (resizeLineEndpoint === "start") {
            updatedLine.x1 = initialLine.x1 + dx;
            updatedLine.y1 = initialLine.y1 + dy;
          } else {
            updatedLine.x2 = initialLine.x2 + dx;
            updatedLine.y2 = initialLine.y2 + dy;
          }
          setLines((prev) =>
            prev.map((l) => (l.id === selectedElement.id ? updatedLine : l))
          );
        }
      }
    }
  }

  function handlePointerUp(e: React.PointerEvent<SVGSVGElement>) {
    console.log(e)
    setDisablePan(false);
    if (creatingShape) {
      const { type, start, end } = creatingShape;
      const id = generateId();
      if (type === "line") {
        const newLine: LineType = {
          id,
          x1: start.x,
          y1: start.y,
          x2: end.x,
          y2: end.y,
          strokeColor: color,
          strokeWidth: lineThickness,
        };
        setLines((prev) => [...prev, newLine]);
      } else {
        const newShape: Shape = {
          id,
          x: start.x,
          y: start.y,
          shapeType: shapeType,
          width: end.x - start.x,
          height: end.y - start.y,
          fillColor: "transparent",
          strokeColor: color,
          strokeWidth: lineThickness,
        };
        setShapes((prev) => [...prev, newShape]);
      }
      setCreatingShape(null);
      setActiveTool("none");
    }
    if (lastErasePoint) {
      setLastErasePoint(null);
    }
    setDragMode(null);
    setResizeCorner(null);
    setResizeLineEndpoint(null);
    setInitialPointer(null);
    setInitialShape(null);
    setInitialLine(null);
  }

  // Ephemeral element for creation preview
  let ephemeralEl = null;
  if (creatingShape) {
    const { type, start, end } = creatingShape;
    if (type === "line") {
      ephemeralEl = (
        <line
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={color}
          strokeWidth={lineThickness}
        />
      );
    } else if (type === "rect") {
      const rx = Math.min(start.x, end.x);
      const ry = Math.min(start.y, end.y);
      const rw = Math.abs(end.x - start.x);
      const rh = Math.abs(end.y - start.y);
      ephemeralEl = (
        <rect
          x={rx}
          y={ry}
          width={rw}
          height={rh}
          fill="transparent"
          stroke={color}
          strokeWidth={lineThickness}
        />
      );
    } else if (type === "circle") {
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;
      const r = 0.5 * Math.min(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
      ephemeralEl = (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="transparent"
          stroke={color}
          strokeWidth={lineThickness}
        />
      );
    }
  }

  // Compute selection handles for selected shape or line
  const selectedShape =
    selectedElement?.type === "shape"
      ? shapes.find((s) => s.id === selectedElement.id)
      : null;
  const selectedLine =
    selectedElement?.type === "line"
      ? lines.find((l) => l.id === selectedElement.id)
      : null;
  let selectionHandles: JSX.Element[] = [];
  if (selectedShape) {
    const { x1, x2, y1, y2 } = shapeBoundingBox(selectedShape);
    selectionHandles.push(
      <circle key="sh-tl" cx={x1} cy={y1} r={5} fill="blue" />,
      <circle key="sh-tr" cx={x2} cy={y1} r={5} fill="blue" />,
      <circle key="sh-bl" cx={x1} cy={y2} r={5} fill="blue" />,
      <circle key="sh-br" cx={x2} cy={y2} r={5} fill="blue" />
    );
  }
  if (selectedLine) {
    selectionHandles.push(
      <circle
        key="ln-start"
        cx={selectedLine.x1}
        cy={selectedLine.y1}
        r={5}
        fill="blue"
      />,
      <circle
        key="ln-end"
        cx={selectedLine.x2}
        cy={selectedLine.y2}
        r={5}
        fill="blue"
      />
    );
  }

  return (
    <svg
      width={width}
      height={height}
      pointerEvents={pointerEvents}
      style={{ background: "transparent", touchAction: "none" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Render finalized shapes */}
      {shapes.map((s) => {
        if (s.shapeType === "circle") {
          const cx = s.x + s.width / 2;
          const cy = s.y + s.height / 2;
          const r = Math.abs(Math.min(s.width, s.height)) / 2;
          return (
            <circle
              key={s.id}
              cx={cx}
              cy={cy}
              r={r}
              fill={s.fillColor}
              stroke={s.strokeColor}
              strokeWidth={s.strokeWidth}
            />
          );
        } else {
          const { x1, x2, y1, y2 } = shapeBoundingBox(s);
          return (
            <rect
              key={s.id}
              x={x1}
              y={y1}
              width={x2 - x1}
              height={y2 - y1}
              fill={s.fillColor}
              stroke={s.strokeColor}
              strokeWidth={s.strokeWidth}
            />
          );
        }
      })}
      {/* Render finalized lines */}
      {lines.map((ln) => (
        <line
          key={ln.id}
          x1={ln.x1}
          y1={ln.y1}
          x2={ln.x2}
          y2={ln.y2}
          stroke={ln.strokeColor}
          strokeWidth={ln.strokeWidth}
        />
      ))}
      {/* Render ephemeral creation preview */}
      {ephemeralEl}
      {/* Render selection handles */}
      {selectionHandles}
    </svg>
  );
}

export default SvgOverlay;
