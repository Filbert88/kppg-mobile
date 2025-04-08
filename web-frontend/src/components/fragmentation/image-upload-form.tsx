"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Pen,
  Eraser,
  ShapesIcon,
  PaintBucket,
  Crop as CropIcon,
  ZoomIn,
  ZoomOut,
  Slash,
} from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";
import html2canvas from "html2canvas";

// Modal components
import ColorPickerModal from "./modal/ColorPickerModal";
import ShapePickerModal from "./modal/ShapePickerModal";
import ThicknessPickerModal from "./modal/ThicknessPickerModal";

// Image container for canvas drawing (ref forwarded down to PixelCanvas)
import ImageContainer from "./ImageContainer";

// --- Helper functions for cropping (unchanged) ---
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

// Helper: Convert a data URL to a Blob.
function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) throw new Error("Invalid data URL");
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
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

interface ImageUploadFormProps {
  formData: {
    images: string[];
  };
  updateFormData: (field: string, value: any) => void;
  onNext: () => void;
}

export default function ImageUploadForm({
  formData,
  updateFormData,
  onNext,
}: ImageUploadFormProps) {
  // Image states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [bgImage, setBgImage] = useState<string | null>(null);

  // Canvas editing states
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

  // Refs for TransformWrapper and the container (for html2canvas capture)
  const transformWrapperRef = useRef<any>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedImage && formData.images.length > 0) {
      const latestImage = formData.images[formData.images.length - 1];
      setSelectedImage(latestImage);
      setBgImage(latestImage);
    }
  }, [selectedImage, formData.images]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = (event.target?.result as string) || "";
        setSelectedImage(imageUrl);
        setBgImage(imageUrl);
        updateFormData("images", [...formData.images, imageUrl]);
      };
      reader.readAsDataURL(file);
    }
  };

  const isFormValid = formData.images.length > 0;

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
      if (!croppedAreaPixels || !bgImage) return;
      const croppedImage = await getCroppedImg(bgImage, croppedAreaPixels);
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

  /**
   * handleNext:
   * We use html2canvas to capture the container that holds the ImageContainer.
   * To capture the image at its original (natural) size, we remove any CSS scaling (like maxWidth)
   * so that the container renders at the natural dimensions.
   */
  const handleNext = async () => {
    if (!imageContainerRef.current) {
      console.error("Image container not found.");
      return;
    }
    try {
      // Capture the container using html2canvas.
      const canvas = await html2canvas(imageContainerRef.current, {
        useCORS: true,
        logging: false,
      });
      const finalDataUrl = canvas.toDataURL("image/png");
      console.log("Final saved composite image (data URL):", finalDataUrl);
      const blob = dataURLtoBlob(finalDataUrl);
      const file = new File([blob], "editedImage.png", { type: blob.type });
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      const response = await fetch("http://localhost:5180/api/Upload/upload", {
        method: "POST",
        body: formDataUpload,
      });
      if (!response.ok) {
        throw new Error("Upload failed with status " + response.status);
      }
      const result = await response.json();
      console.log("Upload service returned URL:", result.url);
      onNext();
    } catch (error) {
      console.error("Error capturing and uploading image:", error);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 mt-4">
      {/* Top Toolbar */}
      {bgImage && (
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

      {/* Container to be captured by html2canvas.
          We remove any maxWidth constraints so the container is rendered at the natural size.
      */}
      <div
        ref={imageContainerRef}
        className="flex rounded-md bg-white justify-center"
        style={{ width: "fit-content", height: "fit-content" }}
      >
        {bgImage ? (
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
                backgroundImage={bgImage}
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
              <p>No image selected</p>
              <p>Please upload an image</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex justify-center mt-4">
        <label className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-full flex items-center cursor-pointer">
          <span className="mr-2">+</span>
          <span>Tambah Gambar</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </label>
      </div>

      {/* Crop Modal */}
      {showCropModal && bgImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className="relative bg-white rounded shadow-lg overflow-hidden"
            style={{ width: "80vw", height: "80vh" }}
          >
            <div className="absolute inset-0 z-10">
              <Cropper
                image={bgImage}
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
          onClose={(selectedShape: "rect" | "circle") => {
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

      {/* Next Button */}
      <div className="mt-6 flex justify-end absolute bottom-0 right-0">
        <Button
          onClick={handleNext}
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
