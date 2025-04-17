"use client";

import {
  useState,
  useEffect,
  useRef,
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
import "cropperjs/dist/cropper.css";
import html2canvas from "html2canvas";

// Modal components
import ColorPickerModal from "./modal/ColorPickerModal";
import ShapePickerModal from "./modal/ShapePickerModal";
import ThicknessPickerModal from "./modal/ThicknessPickerModal";

// Image container for canvas drawing (ref forwarded down to PixelCanvas)
import ImageContainer from "./ImageContainer";
import { HybridContainerRef, HybridContainerState } from "./HybridContainer";
import { FragmentationFormData } from "./multi-step-form";
export interface ImageUploadFormRef {
  saveEditingState: () => void;
}

interface ImageUploadFormProps {
  formData: FragmentationFormData;
  updateFormData: (field: string, value: any) => void;
  onNext: () => void;
}

const ImageUploadForm = forwardRef<ImageUploadFormRef, ImageUploadFormProps>(
  ({ formData, updateFormData, onNext }, ref) => {
    // Image states
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [bgImage, setBgImage] = useState<string | null>(null);
    const [editingStates, setEditingStates] = useState<{
      [key: string]: HybridContainerState;
    }>(() => formData.editingStates || {});

    // Canvas editing states and tool selection
    const [activeTool, setActiveTool] = useState<
      | "none"
      | "draw"
      | "erase"
      | "fill"
      | "crop"
      | "shapes"
      | "line"
      | "zoomIn"
      | "zoomOut"
    >("none");
    const [chosenColor, setChosenColor] = useState("#000000");
    const [lineThickness, setLineThickness] = useState<number>(3);
    const [shapeType, setShapeType] = useState<"rect" | "circle">("rect");
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showShapePicker, setShowShapePicker] = useState(false);
    const [showThicknessPicker, setShowThicknessPicker] = useState(false);
    const [showCropModal, setShowCropModal] = useState(false);
    const [disablePan, setDisablePan] = useState(false);

    // React Cropper ref.
    const cropperRef = useRef<any>(null);

    // Refs for TransformWrapper and container capture
    const transformWrapperRef = useRef<any>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const hybridContainerRef = useRef<HybridContainerRef>(null);

    useEffect(() => {
      if (!selectedImage && formData.images.length > 0) {
        const latestImage = formData.images[0];
        setSelectedImage(latestImage);
        setBgImage(latestImage);
        if (editingStates[latestImage] && hybridContainerRef.current) {
          hybridContainerRef.current.setEditingState(
            editingStates[latestImage]
          );
        }
      }
    }, [selectedImage, formData.images]);

    useEffect(() => {
      if (bgImage && editingStates[bgImage] && hybridContainerRef.current) {
        hybridContainerRef.current.setEditingState(editingStates[bgImage]);
      }
    }, [bgImage, editingStates]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // Save the state of the current image first (if any)
        if (selectedImage && hybridContainerRef.current) {
          const currentState = hybridContainerRef.current.getEditingState();
          setEditingStates((prev) => ({
            ...prev,
            [selectedImage]: currentState,
          }));
          updateFormData("editingStates", {
            ...editingStates,
            [selectedImage]: currentState,
          });
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          const newImageUrl = (event.target?.result as string) || "";
          const updatedImages = [...formData.images, newImageUrl];
          updateFormData("images", updatedImages);
          switchImage(newImageUrl);
        };
        reader.readAsDataURL(file);
      }
    };

    const isFormValid = formData.images.length > 0;

    function handleToolSelect(tool: typeof activeTool) {
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
      } else if (tool === "line" || tool === "erase") {
        setShowThicknessPicker(true);
      } else if (tool === "crop") {
        setShowCropModal(true);
      }
    }

    // Crop functions
    async function handleCropDone() {
      if (cropperRef.current) {
        const cropper = cropperRef.current.cropper;
        const croppedCanvas = cropper.getCroppedCanvas();
        if (croppedCanvas) {
          const croppedImageUrl = croppedCanvas.toDataURL("image/png");
          const newImages = formData.images.map((img) =>
            img === selectedImage ? croppedImageUrl : img
          );
          updateFormData("images", newImages);
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

    // Switch current image
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
          updateFormData("editingStates", newStates);
        }
      },
    }));

    /**
     * handleNext:
     * Capture the current image editing container using html2canvas,
     * create a File from the resulting image, upload it, and call the multi-fragment API.
     */
    const handleNext = async () => {
      if (!imageContainerRef.current) {
        console.error("Image container not found.");
        return;
      }
      try {
        // (a) Save current editing state.
        if (selectedImage && hybridContainerRef.current) {
          const currentState = hybridContainerRef.current.getEditingState();
          setEditingStates((prev) => ({
            ...prev,
            [selectedImage]: currentState,
          }));
        }
        updateFormData("editingStates", editingStates);

        // (b) Capture the canvas.
        const canvas = await html2canvas(imageContainerRef.current, {
          useCORS: true,
          logging: false,
        });
        const finalDataUrl = canvas.toDataURL("image/png");

        // (c) Replace the local image with the new captured version (only one image).
        updateFormData("images", [finalDataUrl]);

        // (d) Convert finalDataUrl to a File.
        const blob = dataURLtoBlob(finalDataUrl);
        const file = new File([blob], "editedImage.png", { type: blob.type });

        // (e) Upload the file to obtain a permanent URL.
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);
        const uploadResponse = await fetch(
          "http://localhost:5180/api/Upload/upload",
          {
            method: "POST",
            body: formDataUpload,
          }
        );
        if (!uploadResponse.ok) {
          throw new Error("Upload failed with status " + uploadResponse.status);
        }
        const uploadResult = await uploadResponse.json();
        console.log("Uploaded image URL:", uploadResult.url);

        // (f) Replace local images with the permanent URL.
        updateFormData("images", [uploadResult.url]);

        // (g) Call the multi-fragment API with the same file.
        const formDataFragment = new FormData();
        formDataFragment.append("files", file);
        const fragmentResponse = await fetch(
          "http://localhost:5180/api/Fragmentation/multi-fragment",
          {
            method: "POST",
            body: formDataFragment,
          }
        );
        if (!fragmentResponse.ok) {
          throw new Error(
            "Fragmentation failed with status " + fragmentResponse.status
          );
        }
        const fragResult = await fragmentResponse.json();
        console.log("Fragmentation result:", fragResult);

        // (h) Parse the fragmentation result.
        // Assume the result is an array of objects as:
        // { filename: "...", result: { marker_properties: { conversion_factor: ... }, output_image: "..." } }
        const newImagesFrag: string[] = [];
        const newFragResults: Array<{
          image: string;
          conversionFactor: number;
        }> = [];
        fragResult.forEach((item: any) => {
          let rawBase64 = item.result.output_image;
          if (!rawBase64.startsWith("data:image")) {
            rawBase64 = "data:image/jpeg;base64," + rawBase64;
          }
          const conversionFactor =
            item.result.marker_properties?.conversion_factor || 1;
          newImagesFrag.push(rawBase64);
          newFragResults.push({ image: rawBase64, conversionFactor });
        });

        // (i) Replace formData.imagesFrag and fragmentationResults with new arrays.
        updateFormData("imagesFrag", newImagesFrag);
        updateFormData("fragmentationResults", newFragResults);

        // Finally, move to the next step.
        onNext();
      } catch (error) {
        console.error("Error in handleNext:", error);
      }
    };

    function handleHybridRefReady(hRef: HybridContainerRef | null) {
      if (bgImage && editingStates[bgImage] && hRef) {
        hRef.setEditingState(editingStates[bgImage]);
      }
    }

    // Helper to convert data URL to Blob.
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

    return (
      <div className="flex h-full">
        {/* Sidebar for image thumbnails */}
        <div className="w-1/5 border-r border-gray-300 p-4 overflow-y-auto pt-20">
          {formData.images.map((img, idx) => (
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
                className={`p-2 rounded-md ${
                  activeTool === "draw" ? "bg-blue-200" : ""
                }`}
              >
                <Pen className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleToolSelect("erase")}
                className={`p-2 rounded-md ${
                  activeTool === "erase" ? "bg-blue-200" : ""
                }`}
              >
                <Eraser className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleToolSelect("shapes")}
                className={`p-2 rounded-md ${
                  activeTool === "shapes" ? "bg-blue-200" : ""
                }`}
              >
                <ShapesIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleToolSelect("fill")}
                className={`p-2 rounded-md ${
                  activeTool === "fill" ? "bg-blue-200" : ""
                }`}
              >
                <PaintBucket className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleToolSelect("crop")}
                className={`p-2 rounded-md ${
                  activeTool === "crop" ? "bg-blue-200" : ""
                }`}
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
                className={`p-2 rounded-md ${
                  activeTool === "line" ? "bg-blue-200" : ""
                }`}
              >
                <Slash className="w-5 h-5" />
              </button>
            </div>
          )}
          {/* Image container captured by html2canvas */}
          <div
            ref={imageContainerRef}
            className="flex border border-gray-300 rounded-md justify-center"
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
                    activeTool === "line" ||
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

          {/* Crop Modal */}
          {showCropModal && bgImage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div
                className="relative bg-white rounded shadow-lg overflow-hidden"
                style={{ width: "80vw", height: "80vh" }}
              >
                <Cropper
                  src={bgImage}
                  style={{ height: "100%", width: "100%" }}
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
              onClose={(newColor: string | null) => {
                if (newColor === null) {
                  setActiveTool("none");
                } else {
                  setChosenColor(newColor);
                }
                setShowColorPicker(false);
              }}
            />
          )}
          {showShapePicker && (
            <ShapePickerModal
              defaultShape={shapeType}
              onClose={(selectedShape: "rect" | "circle" | null) => {
                if (selectedShape === null) {
                  setActiveTool("none");
                } else {
                  setShapeType(selectedShape);
                }
                setShowShapePicker(false);
              }}
            />
          )}
          {showThicknessPicker && (
            <ThicknessPickerModal
              initialThickness={lineThickness}
              onClose={(newThickness: number | null) => {
                if (newThickness === null) {
                  setActiveTool("none");
                } else {
                  setLineThickness(newThickness);
                }
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
  }
);

export default ImageUploadForm;
