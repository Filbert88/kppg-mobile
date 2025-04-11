"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
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
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css"; // Import Cropper.css from cropperjs
import html2canvas from "html2canvas";

// Modal components
import ColorPickerModal from "./modal/ColorPickerModal";
import ShapePickerModal from "./modal/ShapePickerModal";
import ThicknessPickerModal from "./modal/ThicknessPickerModal";

// Image container for canvas drawing (ref forwarded down to PixelCanvas)
import ImageContainer from "./ImageContainer";
import { HybridContainerRef, HybridContainerState } from "./HybridContainer";

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

// --- Props interface for Fragmented Image Upload ---
interface ImageUploadedFragProps {
  formData: {
    imagesFrag: string[];
    editingFragStates: Record<string, HybridContainerState>;
  };
  updateFormData: (field: string, value: any) => void;
  onNext: () => void;
}

export interface ImageUploadFragRef {
  saveEditingState: () => void;
}

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

const ImageUploadedFrag = forwardRef<
  ImageUploadFragRef,
  ImageUploadedFragProps
>(({ formData, updateFormData, onNext }, ref) => {
  // Image states – note we use imagesFrag here
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [disablePan, setDisablePan] = useState(false);

  // Use editingFragStates from formData
  const [editingStates, setEditingStates] = useState<{
    [key: string]: HybridContainerState;
  }>(() => formData.editingFragStates || {});

  // Canvas editing states
  const [activeTool, setActiveTool] = useState<Tool>("none");
  const [chosenColor, setChosenColor] = useState("#000000");
  const [lineThickness, setLineThickness] = useState<number>(3);
  const [shapeType, setShapeType] = useState<ShapeType>("rect");

  // Modal toggles
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showShapePicker, setShowShapePicker] = useState(false);
  const [showThicknessPicker, setShowThicknessPicker] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);

  // For React Cropper (crop modal)
  const cropperRef = useRef<any>(null);

  // Refs for TransformWrapper and container capture
  const transformWrapperRef = useRef<any>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const hybridContainerRef = useRef<HybridContainerRef>(null);

  // On mount, set the first image if available
  useEffect(() => {
    if (!selectedImage && formData.imagesFrag.length > 0) {
      const latestImage = formData.imagesFrag[0];
      setSelectedImage(latestImage);
      setBgImage(latestImage);
      if (editingStates[latestImage] && hybridContainerRef.current) {
        hybridContainerRef.current.setEditingState(editingStates[latestImage]);
      }
    }
  }, [selectedImage, formData.imagesFrag]);

  useEffect(() => {
    // When bgImage or its editing state changes, update HybridContainer
    if (bgImage && editingStates[bgImage] && hybridContainerRef.current) {
      hybridContainerRef.current.setEditingState(editingStates[bgImage]);
    }
  }, [bgImage, editingStates]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (selectedImage && hybridContainerRef.current) {
        const currentState = hybridContainerRef.current.getEditingState();
        setEditingStates((prev) => ({
          ...prev,
          [selectedImage]: currentState,
        }));
        updateFormData("editingFragStates", {
          ...editingStates,
          [selectedImage]: currentState,
        });
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImageUrl = (event.target?.result as string) || "";
        const updatedImages = [...formData.imagesFrag, newImageUrl];
        updateFormData("imagesFrag", updatedImages);
        // Switch image will set selectedImage, setBgImage and load/reset state.
        switchImage(newImageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const isFormValid = formData.imagesFrag.length > 0;

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

  // handleCropDone using React Cropper:
  async function handleCropDone() {
    if (cropperRef.current) {
      const cropper = cropperRef.current.cropper;
      const croppedCanvas = cropper.getCroppedCanvas();
      if (croppedCanvas) {
        const croppedImageUrl = croppedCanvas.toDataURL("image/png");
        // Update the form data: replace the image that is being cropped with the cropped image.
        const newImages = formData.imagesFrag.map((img) =>
          img === selectedImage ? croppedImageUrl : img
        );
        updateFormData("imagesFrag", newImages);
        setBgImage(croppedImageUrl);
        setSelectedImage(croppedImageUrl);
      }
    }
    setShowCropModal(false);
    setActiveTool("none");
  }

  function handleCropCancel() {
    setShowCropModal(false);
    setActiveTool("none");
  }

  // Save current editing state
  function saveCurrentEditingState() {
    if (selectedImage && hybridContainerRef.current) {
      const state = hybridContainerRef.current.getEditingState();
      setEditingStates((prev) => ({ ...prev, [selectedImage]: state }));
    }
  }

  // Switch image from the sidebar
  function switchImage(newImage: string) {
    saveCurrentEditingState();
    setSelectedImage(newImage);
    setBgImage(newImage);
    if (editingStates[newImage] && hybridContainerRef.current) {
      hybridContainerRef.current.setEditingState(editingStates[newImage]);
    } else if (hybridContainerRef.current) {
      hybridContainerRef.current.setEditingState({
        canvasData: "",
        shapes: [],
        lines: [],
      });
    }
  }

  // Expose method to parent via useImperativeHandle
  useImperativeHandle(ref, () => ({
    saveEditingState() {
      if (selectedImage && hybridContainerRef.current) {
        const currentState = hybridContainerRef.current.getEditingState();
        const newStates = { ...editingStates, [selectedImage]: currentState };
        setEditingStates(newStates);
        updateFormData("editingFragStates", newStates);
      }
    },
  }));

  /**
   * handleNext:
   * We use html2canvas to capture the container that holds ImageContainer.
   * The container is captured at its natural dimensions.
   */
  const handleNext = async () => {
    if (!imageContainerRef.current) {
      console.error("Image container not found.");
      return;
    }
    try {
      if (selectedImage && hybridContainerRef.current) {
        const currentState = hybridContainerRef.current.getEditingState();
        setEditingStates((prev) => ({
          ...prev,
          [selectedImage]: currentState,
        }));
      }
      updateFormData("editingFragStates", editingStates);
      const canvas = await html2canvas(imageContainerRef.current, {
        useCORS: true,
        logging: false,
      });
      const finalDataUrl = canvas.toDataURL("image/png");
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

  // (Optional) Callback for HybridContainer reference ready
  function handleHybridRefReady(hRef: HybridContainerRef | null) {
    if (bgImage && editingStates[bgImage] && hRef) {
      console.log("handle hybrid ref dipanggil");
      hRef.setEditingState(editingStates[bgImage]);
    }
  }

  return (
    <div className="flex h-full">
      {/* Sidebar for images */}
      <div className="w-1/5 border-r border-gray-300 p-4 overflow-y-auto pt-20">
        {formData.imagesFrag.map((img, idx) => (
          <div
            key={idx}
            className={`mb-2 p-1 rounded-md cursor-pointer ${
              selectedImage === img ? "border-2 border-blue-500" : ""
            }`}
            onClick={() => switchImage(img)}
          >
            <img
              src={img}
              alt={`Thumbnail ${idx}`}
              className="w-full object-contain"
            />
          </div>
        ))}
      </div>

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

        {/* Container captured by html2canvas */}
        <div
          ref={imageContainerRef}
          className="flex border border-gray-300 rounded-md bg-white justify-center"
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
                  hybridContainerRef={hybridContainerRef}
                  onHybridRefReady={handleHybridRefReady}
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

        {/* Crop Modal using React Cropper */}
        {showCropModal && bgImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div
              className="relative bg-white rounded shadow-lg overflow-hidden"
              style={{ width: "80vw", height: "80vh" }}
            >
              <Cropper
                src={bgImage}
                style={{ height: "100%", width: "100%" }}
                // Optionally set an aspect ratio (remove or change if needed)
                aspectRatio={600 / 400}
                guides={true}
                responsive={true}
                checkOrientation={false}
                ref={cropperRef}
              />
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
    </div>
  );
});

export default ImageUploadedFrag;
