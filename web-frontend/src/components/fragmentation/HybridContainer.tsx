"use client";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
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

export interface HybridContainerState {
  canvasData: string;
  shapes: any[]; // you may want to strongly type these based on your app
  lines: any[];
}

export interface HybridContainerRef {
  getEditingState: () => HybridContainerState;
  setEditingState: (state: HybridContainerState) => void;
}

interface Props {
  width: number;
  height: number;
  activeTool: Tool;
  shapeType: ShapeType;
  selectedColor: string;
  lineThickness: number;
  setActiveTool: (tool: Tool) => void;
  setDisablePan: (disable: boolean) => void;
  onRefReady?: (ref: HybridContainerRef) => void;
}

const HybridContainer = forwardRef<HybridContainerRef, Props>(
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

    // Ref for the PixelCanvas
    const pixelCanvasRef = useRef<PixelCanvasRef>(null);
    const [pixelCanvasReady, setPixelCanvasReady] = useState(false);

    const pendingStateRef = useRef<HybridContainerState | null>(null);

    // Function untuk benar-benar load state ke canvas+overlay
    const doSetStateNow = useCallback((state: HybridContainerState) => {
      if (!pixelCanvasRef.current) return;
      console.log("load ", state)
      pixelCanvasRef.current.loadDataURL(state.canvasData || "");
      setShapes(state.shapes || []);
      setLines(state.lines || []);
    }, []);

    useImperativeHandle(ref, () => ({
      getEditingState: () => {
        const canvasData = pixelCanvasRef.current?.getDataURL() || "";
        return {
          canvasData,
          shapes,
          lines,
        };
      },
      setEditingState: (state: HybridContainerState) => {
        console.log("masuk set editing state Hybrid Contianer");
        if (!pixelCanvasReady) {
          // jika PixelCanvas belum siap, simpan state dulu
          console.log("CAnvas belum ready set di pending")
          pendingStateRef.current = state;
        } else {
          // jika sudah siap, langsung set
          console.log("Apply State sekarang")
          doSetStateNow(state);
        }
      },
    }));

    function handleCanvasReady() {
      console.log("Pixel Canvas Sudah Ready");
      setPixelCanvasReady(true);
      // Jika ada pending state, load sekarang
      if (pendingStateRef.current) {
        console.log("apply pending state ")
        doSetStateNow(pendingStateRef.current);
        pendingStateRef.current = null;
      }
    }

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
            onCanvasReady={handleCanvasReady}
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
