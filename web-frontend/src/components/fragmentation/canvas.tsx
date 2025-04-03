"use client";
import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  Pen,
  Eraser,
  Crop as CropIcon,
  PaintBucket,
  Slash,
  ShapesIcon,
} from "lucide-react";

// Modal components
import ColorPickerModal from "./modal/ColorPickerModal";
import ShapePickerModal from "./modal/ShapePickerModal";
import ThicknessPickerModal from "./modal/ThicknessPickerModal";

// Our container that wraps the drawing area (pastikan ImageContainer mengoper ref-nya)
import ImageContainer from "./ImageContainer";

// Import zoom/pan dan crop libraries
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";

// --- Helper functions for cropping ---
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

function getRadianAngle(degreeValue: number): number {
  return (degreeValue * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

async function getCroppedImg(
  imageSrc: string,
  croppedAreaPixels: Area,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<string | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const rotRad = rotation * (Math.PI / 180);
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);
  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");
  if (!croppedCtx) return null;
  croppedCanvas.width = croppedAreaPixels.width;
  croppedCanvas.height = croppedAreaPixels.height;
  croppedCtx.drawImage(
    canvas,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height
  );
  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob((blob) => {
      if (blob) {
        resolve(URL.createObjectURL(blob));
      } else {
        reject(new Error("Canvas is empty"));
      }
    }, "image/png");
  });
}
// --- End helpers ---

// Definisikan tipe tool dan shape.
export type Tool =
  | "none"
  | "draw"
  | "erase"
  | "fill"
  | "crop"
  | "shapes"
  | "line"
  | "zoomIn"
  | "zoomOut";

export type ShapeType = "rect" | "circle";

export default function CanvasPage() {
  // State untuk alat yang aktif
  const [activeTool, setActiveTool] = useState<Tool>("none");
  const [chosenColor, setChosenColor] = useState("#000000");
  const [lineThickness, setLineThickness] = useState<number>(3);
  const [shapeType, setShapeType] = useState<ShapeType>("rect");

  // State untuk visibilitas modal
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showShapePicker, setShowShapePicker] = useState(false);
  const [showThicknessPicker, setShowThicknessPicker] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);

  // State untuk crop (react-easy-crop)
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // State untuk background image
  const [bgImage, setBgImage] = useState<string>(
    "https://upload.wikimedia.org/wikipedia/commons/6/63/Biho_Takashi._Bat_Before_the_Moon%2C_ca._1910.jpg"
  );

  // Refs untuk TransformWrapper dan ImageContainer
  const transformWrapperRef = useRef<any>(null);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);

  // Handler untuk pemilihan alat
  function handleToolSelect(tool: Tool) {
    if (tool === "zoomIn") {
      transformWrapperRef.current?.zoomIn();
      setActiveTool("none");
      return;
    }
    if (tool === "zoomOut") {
      transformWrapperRef.current?.zoomOut();
      setActiveTool("none");
      return;
    }
    if (activeTool === tool) {
      setActiveTool("none");
      return;
    }
    setActiveTool(tool);
    if (tool === "draw" || tool === "fill") {
      setShowColorPicker(true);
    } else if (tool === "shapes") {
      setShowShapePicker(true);
    } else if (tool === "line") {
      setShowThicknessPicker(true);
    } else if (tool === "crop") {
      setShowCropModal(true);
    }
  }

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  async function handleCropDone() {
    try {
      const croppedImage = await getCroppedImg(bgImage, croppedAreaPixels!);
      if (croppedImage != null) {
        setBgImage(croppedImage);
      }
    } catch (e) {
      console.error(e);
    }
    setShowCropModal(false);
    setActiveTool("none");
  }

  function handleCropCancel() {
    setShowCropModal(false);
    setActiveTool("none");
  }

  return (
    <div className="flex flex-col p-4">
      {/* Toolbar */}
      <div className="flex justify-center space-x-2 py-2 border-b border-gray-300 mb-4">
        <button
          onClick={() => handleToolSelect("draw")}
          className={`p-2 rounded-md ${
            activeTool === "draw" ? "bg-blue-100" : "hover:bg-gray-100"
          }`}
        >
          <Pen className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleToolSelect("erase")}
          className={`p-2 rounded-md ${
            activeTool === "erase" ? "bg-blue-100" : "hover:bg-gray-100"
          }`}
        >
          <Eraser className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleToolSelect("shapes")}
          className={`p-2 rounded-md ${
            activeTool === "shapes" ? "bg-blue-100" : "hover:bg-gray-100"
          }`}
        >
          <ShapesIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleToolSelect("fill")}
          className={`p-2 rounded-md ${
            activeTool === "fill" ? "bg-blue-100" : "hover:bg-gray-100"
          }`}
        >
          <PaintBucket className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleToolSelect("crop")}
          className={`p-2 rounded-md ${
            activeTool === "crop" ? "bg-blue-100" : "hover:bg-gray-100"
          }`}
        >
          <CropIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleToolSelect("zoomIn")}
          className={`p-2 rounded-md ${
            activeTool === "zoomIn" ? "bg-blue-100" : "hover:bg-gray-100"
          }`}
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleToolSelect("zoomOut")}
          className={`p-2 rounded-md ${
            activeTool === "zoomOut" ? "bg-blue-100" : "hover:bg-gray-100"
          }`}
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleToolSelect("line")}
          className={`p-2 rounded-md ${
            activeTool === "line" ? "bg-blue-100" : "hover:bg-gray-100"
          }`}
        >
          <Slash className="w-5 h-5" />
        </button>
      </div>

      {/* Area gambar utama dengan zoom/pan */}
      <div
        className="relative border border-gray-300 bg-white"
        style={{ width: "100%", maxWidth: 600 }}
      >
        <TransformWrapper
          ref={transformWrapperRef}
          initialScale={1}
          wheel={{ step: 0.1 }}
          doubleClick={{ disabled: true }}
          panning={{ disabled: activeTool === "draw" || activeTool === "shapes" }}
        >
          <TransformComponent>
            <ImageContainer
              ref={imageContainerRef}
              backgroundImage={bgImage}
              activeTool={activeTool}
              shapeType={shapeType}
              color={chosenColor}
              setActiveTool={setActiveTool}
              lineThickness={lineThickness}
            />
          </TransformComponent>
        </TransformWrapper>
      </div>

      {/* Modals */}
      {showColorPicker && (
        <ColorPickerModal
          initialColor={chosenColor}
          onClose={(newColor: string) => {
            setChosenColor(newColor);
            setShowColorPicker(false);
          }}
        />
      )}
      {showShapePicker && (
        <ShapePickerModal
          defaultShape={shapeType}
          onClose={(selectedShape: ShapeType) => {
            setShapeType(selectedShape);
            setShowShapePicker(false);
          }}
        />
      )}
      {showThicknessPicker && (
        <ThicknessPickerModal
          initialThickness={lineThickness}
          onClose={(newThickness: number) => {
            setLineThickness(newThickness);
            setShowThicknessPicker(false);
          }}
        />
      )}

      {/* Crop Modal menggunakan react-easy-crop */}
      {showCropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className="relative bg-white p-4 rounded shadow-lg"
            style={{ width: "80vw", height: "80vh" }}
          >
            <Cropper
              image={bgImage}
              crop={crop}
              zoom={cropZoom}
              aspect={600 / 400}
              onCropChange={setCrop}
              onZoomChange={setCropZoom}
              onCropComplete={onCropComplete}
            />
            <div className="flex justify-end space-x-2 mt-4">
              <Button onClick={handleCropCancel}>Cancel</Button>
              <Button onClick={handleCropDone}>Done</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function handleCropCancel() {
  // Reset crop state if needed.
}

function onCropComplete(croppedArea: Area, croppedAreaPixels: Area) {
  // This callback is handled in CanvasPage via useCallback.
}