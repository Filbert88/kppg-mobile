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
  getDataURL: () => string;
  loadDataURL: (dataUrl: string) => void;
}

interface PixelCanvasProps {
  width: number; // Width tampilan (bisa dianggap px CSS)
  height: number; // Height tampilan (bisa px CSS)
  activeTool: string; // "draw", "fill", "erase", dll
  selectedColor: string;
  lineThickness: number;
  onCanvasReady?: () => void;
}

const PixelCanvasImpl = forwardRef<PixelCanvasRef, PixelCanvasProps>(
  (
    { width, height, activeTool, selectedColor, lineThickness, onCanvasReady },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const [canvasWidth, setCanvasWidth] = useState(width);
    const [canvasHeight, setCanvasHeight] = useState(height);

    console.log("Width Hieght", width)

    useEffect(() => {
      console.log("use effect Pixel Canvas 1");
      if (!canvasRef.current) return;
      console.log("masuk use effect Pixel CAnvas");
      canvasRef.current.width = canvasWidth;
      canvasRef.current.height = canvasHeight;

      console.log("canvas width ", canvasWidth)

      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctxRef.current = ctx;
        // Bersihkan
        console.log("Bersihkan Rect");
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      }
      console.log("panggil canvas ready di pixel canvas");
      onCanvasReady?.();
    }, []); // hanya sekali saat mount

    useEffect(() => {
      console.log("Masuk use effect 2");
      if (!canvasRef.current) return;
      const oldDataURL = canvasRef.current.toDataURL();
      console.log("INI OLD DATA ");

      // Update ukuran "internal" canvas
      setCanvasWidth(width);
      setCanvasHeight(height);

      setTimeout(() => {
        if (!canvasRef.current) return;

        canvasRef.current.width = width;
        canvasRef.current.height = height;

        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;
        ctxRef.current = ctx;
        console.log("clear canvssas use effect 2");
        ctx.clearRect(0, 0, width, height);
        const img = new Image();
        img.src = oldDataURL;
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
        };
      }, 0);
    }, [width, height]);

    useImperativeHandle(ref, () => ({
      doFloodFill(x, y, fillColor) {
        if (!ctxRef.current || !canvasRef.current) return;
        const { width: cw, height: ch } = canvasRef.current;
        const imageData = ctxRef.current.getImageData(0, 0, cw, ch);
        const ff = new FloodFill(imageData);
        ff.fill(fillColor, Math.floor(x), Math.floor(y), 20);
        ctxRef.current.putImageData(imageData, 0, 0);
      },
      eraseBetweenPoints(p1, p2, thickness) {
        if (!ctxRef.current || !canvasRef.current) return;
        ctxRef.current.save();
        ctxRef.current.globalCompositeOperation = "destination-out";
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(p1.x, p1.y);
        ctxRef.current.lineTo(p2.x, p2.y);
        ctxRef.current.lineWidth = thickness;
        ctxRef.current.stroke();
        ctxRef.current.closePath();
        ctxRef.current.restore();
      },
      getDataURL() {
        if (!canvasRef.current) return "";
        const dataUrl = canvasRef.current.toDataURL();
        return dataUrl;
      },
      loadDataURL(dataUrl: string) {
        console.log("load Data URl dipanggil");
        if (!canvasRef.current) return;
        console.log("Masuk data url");
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;
        ctxRef.current = ctx;

        if (canvasRef.current.width === 0 || canvasRef.current.height === 0) {
          canvasRef.current.width = width;
          canvasRef.current.height = height;

                  console.log(
                    "Canvas ",
                    canvasRef.current!.width,
                    canvasRef.current!.height
                  );
                          console.log(
                            "Width ",
                            width,
                            height
                          );


        }

        if (!dataUrl) {
          ctx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
          return; // jangan lanjut memuat img
        }
        const img = new Image();


        img.onload = () => {
          ctx.clearRect(
            0,
            0,
            canvasRef.current!.width,
            canvasRef.current!.height
          );
          ctx.drawImage(
            img,
            0,
            0,
            canvasRef.current!.width,
            canvasRef.current!.height
          );

          // Sekarang ambil data URL
        };
        img.src = dataUrl;


        img.onerror = (err) => {
          console.error("Error loading image from dataURL", err);
        };
      },
    }));

    function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
      if (activeTool === "draw" && ctxRef.current && canvasRef.current) {
        setIsDrawing(true);
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(x, y);
      }
    }

    function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
      if (isDrawing && ctxRef.current && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctxRef.current.lineTo(x, y);
        ctxRef.current.strokeStyle = selectedColor;
        ctxRef.current.lineWidth = lineThickness;
        ctxRef.current.stroke();
      }
    }

    function handlePointerUp() {
      if (isDrawing && ctxRef.current) {
        setIsDrawing(false);
        ctxRef.current.closePath();
      }
    }

    // "width" & "height" di sini dijadikan style agar tampilan
    // menyesuaikan, bukan jadi atribut `<canvas>`
    return (
      <canvas
        ref={canvasRef}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          pointerEvents: activeTool === "draw" ? "auto" : "none",
          backgroundColor: "transparent",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    );
  }
);

export default React.memo(PixelCanvasImpl);
