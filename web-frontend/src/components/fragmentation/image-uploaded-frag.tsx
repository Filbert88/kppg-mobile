"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";

// Modal components
import ColorPickerModal from "./modal/ColorPickerModal";
import ShapePickerModal from "./modal/ShapePickerModal";
import ThicknessPickerModal from "./modal/ThicknessPickerModal";

// Image container for canvas drawing
import ImageContainer from "./ImageContainer";

interface ImageUploadedFragProps {
  onNext: () => void;
}

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

// --- Types for tools and shapes ---
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

export default function ImageUploadedFrag({
  onNext,
}: ImageUploadedFragProps) {
  // State for the fragmented image from your API.
  const [fragImage, setFragImage] = useState<string | null>(null);
  const isFormValid = !!fragImage;
  // Canvas editing states (same as in your image upload form)
  const [activeTool, setActiveTool] = useState<Tool>("none");
  const [chosenColor, setChosenColor] = useState("#000000");
  const [lineThickness, setLineThickness] = useState<number>(3);
  const [shapeType, setShapeType] = useState<ShapeType>("rect");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showShapePicker, setShowShapePicker] = useState(false);
  const [showThicknessPicker, setShowThicknessPicker] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [disablePan, setDisablePan] = useState(false);

  // Refs for TransformWrapper and ImageContainer
  const transformWrapperRef = useRef<any>(null);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);

  // On mount, fetch the fragmented image from your API.
  useEffect(() => {
    fetchFragmentedImage();
  }, []);

  async function fetchFragmentedImage() {
    // Simulate an API call with a delay.
    // Replace this with your actual API call.
    setTimeout(() => {
      // Replace with the URL returned from your API.
      setFragImage(
        "https://upload.wikimedia.org/wikipedia/commons/6/63/Biho_Takashi._Bat_Before_the_Moon%2C_ca._1910.jpg"
      );
    }, 1000);
  }

  // Tool selection handler (similar to your upload form)
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
      if (!croppedAreaPixels || !fragImage) return;
      const croppedImage = await getCroppedImg(fragImage, croppedAreaPixels);
      if (croppedImage != null) {
        setFragImage(croppedImage);
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
    <div className="flex-1 flex flex-col p-6 mt-4 mb-4">
      {/* Canvas Editing Toolbar */}
      {fragImage && (
        <div className="flex justify-center space-x-2 py-2 border-b border-gray-300 mt-4">
          <button
            onClick={() => handleToolSelect("draw")}
            className="p-2 rounded-md"
          >
            <Pen className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleToolSelect("erase")}
            className="p-2 rounded-md"
          >
            <Eraser className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleToolSelect("shapes")}
            className="p-2 rounded-md"
          >
            <ShapesIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleToolSelect("fill")}
            className="p-2 rounded-md"
          >
            <PaintBucket className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleToolSelect("crop")}
            className="p-2 rounded-md"
          >
            <CropIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleToolSelect("zoomIn")}
            className="p-2 rounded-md"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleToolSelect("zoomOut")}
            className="p-2 rounded-md"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleToolSelect("line")}
            className="p-2 rounded-md"
          >
            <Slash className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Canvas Editing Container */}
      <div className="flex border border-gray-300 rounded-md overflow-hidden bg-white justify-center">
        {fragImage ? (
          <TransformWrapper
            ref={transformWrapperRef}
            initialScale={1}
            wheel={{ step: 0.1 }}
            doubleClick={{ disabled: true }}
            panning={{
              disabled:
                activeTool === "draw" ||
                activeTool === "shapes" ||
                activeTool === "erase" ||
                activeTool === "fill" ||
                disablePan,
            }}
          >
            <TransformComponent>
              <ImageContainer
                ref={imageContainerRef}
                backgroundImage={fragImage}
                activeTool={activeTool}
                shapeType={shapeType}
                color={chosenColor}
                setActiveTool={setActiveTool}
                lineThickness={lineThickness}
                setDisablePan={setDisablePan}
              />
            </TransformComponent>
          </TransformWrapper>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-gray-400 text-center">
              <p>Loading fragmented image...</p>
            </div>
          </div>
        )}
      </div>

      {/* Crop Modal */}
      {showCropModal && fragImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className="relative bg-white rounded shadow-lg overflow-hidden"
            style={{ width: "80vw", height: "80vh" }}
          >
            <div className="absolute inset-0 z-10">
              <Cropper
                image={fragImage}
                crop={crop}
                zoom={cropZoom}
                aspect={600 / 400}
                onCropChange={setCrop}
                onZoomChange={setCropZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="absolute top-4 right-4 z-20 flex space-x-2">
              <Button variant="secondary" onClick={handleCropCancel}>
                Cancel
              </Button>
              <Button onClick={handleCropDone}>Done</Button>
            </div>
          </div>
        </div>
      )}

      {/* Other Modals */}
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
      <div className="mt-6 flex justify-end absolute bottom-0 right-0">
        <Button
          onClick={onNext}
          disabled={!isFormValid}
          className={`${
            isFormValid
              ? "bg-green-800 hover:bg-green-900"
              : "bg-gray-400 cursor-not-allowed"
          } text-white font-medium py-2 px-6 rounded-lg`}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
