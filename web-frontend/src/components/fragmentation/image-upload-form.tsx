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
  Loader2,
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
    console.log("tes: ", formData);
    console.log("form", formData.editingStates);
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
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState("");
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

    // Add this after the useState declarations
    useEffect(() => {
      console.log("Current editing states:", editingStates);
    }, [editingStates]);

    // Add this to see when an image is switched
    useEffect(() => {
      if (selectedImage) {
        console.log("Switched to image:", selectedImage);
        console.log(
          "Does this image have edits?",
          editingStates[selectedImage] ? "Yes" : "No"
        );
      }
    }, [selectedImage]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // Save the state of the current image first (if any)
        if (selectedImage && hybridContainerRef.current) {
          const currentState = hybridContainerRef.current.getEditingState();
          const updatedStates = {
            ...editingStates,
            [selectedImage]: currentState,
          };
          setEditingStates(updatedStates);
          updateFormData("editingStates", updatedStates);
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const newImageUrl = (event.target?.result as string) || "";
          const updatedImages = [...formData.images, newImageUrl];
          updateFormData("images", updatedImages);

          // Switch to the new image
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
    // Switch current image
    function switchImage(newImage: string) {
      if (selectedImage && hybridContainerRef.current) {
        const currentState = hybridContainerRef.current.getEditingState();
        // Update both the local state and form data
        const updatedStates = {
          ...editingStates,
          [selectedImage]: currentState,
        };
        setEditingStates(updatedStates);
        updateFormData("editingStates", updatedStates);
      }

      setSelectedImage(newImage);
      setBgImage(newImage);

      // Apply editing state for the new image after a brief delay to ensure rendering
      setTimeout(() => {
        if (hybridContainerRef.current) {
          if (
            editingStates[newImage] &&
            Object.keys(editingStates[newImage]).length > 0
          ) {
            hybridContainerRef.current.setEditingState(editingStates[newImage]);
          } else {
            hybridContainerRef.current.setEditingState({
              canvasData: "",
              shapes: [],
              lines: [],
            });
          }
        }
      }, 50);
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
    // ... previous code remains unchanged ...

    const handleNext = async () => {
      try {
        setIsLoading(true);
        setLoadingProgress(0);
        setLoadingMessage("Preparing process...");

        // First, save the current editing state
        if (selectedImage && hybridContainerRef.current) {
          const currentState = hybridContainerRef.current.getEditingState();
          const updatedStates = {
            ...editingStates,
            [selectedImage]: currentState,
          };
          setEditingStates(updatedStates);
          updateFormData("editingStates", updatedStates);
        }

        // Store the original selected image to restore later
        const originalImage = selectedImage;

        // Make a copy of editing states
        const editingStatesCopy = JSON.parse(JSON.stringify(editingStates));

        console.log("ALL IMAGES TO PROCESS:", formData.images);
        console.log("ALL EDITING STATES:", editingStatesCopy);

        if (formData.images.length === 1 && selectedImage) {
          console.log(
            "Single image case detected, ensuring edits are captured"
          );
          // Force a refresh of the editing state to ensure it's the most current
          if (hybridContainerRef.current) {
            const freshState = hybridContainerRef.current.getEditingState();
            editingStatesCopy[selectedImage] = freshState;
          }
        }

        const processedImages = [];
        const filesToProcess = [];

        // Process each image sequentially to get edited versions
        for (let i = 0; i < formData.images.length; i++) {
          const imageUrl = formData.images[i];
          const imageIdx = i + 1;

          setLoadingMessage(
            `Processing image ${imageIdx} of ${formData.images.length}...`
          );
          console.log(
            `Processing image ${imageIdx}: ${imageUrl.substring(0, 30)}...`
          );

          // Check if this image has edits
          const hasEdits =
            editingStatesCopy[imageUrl] &&
            (editingStatesCopy[imageUrl].canvasData ||
              (editingStatesCopy[imageUrl].shapes &&
                editingStatesCopy[imageUrl].shapes.length > 0) ||
              (editingStatesCopy[imageUrl].lines &&
                editingStatesCopy[imageUrl].lines.length > 0));

          console.log(`Image ${imageIdx} has edits:`, hasEdits);

          let finalImageUrl = imageUrl;

          // If image has edits, we need to switch to it and capture it
          if (hasEdits) {
            try {
              // Set up the UI to show this image with its edits
              setSelectedImage(imageUrl);
              setBgImage(imageUrl);

              // Apply edits to the hybrid container
              if (hybridContainerRef.current) {
                hybridContainerRef.current.setEditingState(
                  editingStatesCopy[imageUrl]
                );
                console.log(
                  `Applied editing state to image ${imageIdx}`,
                  editingStatesCopy[imageUrl]
                );
              }

              // Very important: Wait long enough for React to render and canvas to update
              await new Promise((resolve) => setTimeout(resolve, 1000));

              // Now capture the image with its edits
              if (imageContainerRef.current) {
                console.log(`Capturing canvas for image ${imageIdx}`);

                // Use html2canvas with better options
                const canvas = await html2canvas(imageContainerRef.current, {
                  useCORS: true,
                  allowTaint: true,
                  backgroundColor: null,
                  scale: 1, // Use 1:1 scaling
                  logging: true,
                  onclone: (clonedDoc) => {
                    console.log("Document cloned for html2canvas");
                  },
                });

                finalImageUrl = canvas.toDataURL("image/png");
                console.log(`Canvas captured for image ${imageIdx}`);
              }
            } catch (err) {
              console.error(`Error capturing image ${imageIdx}:`, err);
              finalImageUrl = imageUrl; // Fallback to original
            }
          } else {
            console.log(`Using original image for ${imageIdx} (no edits)`);
          }

          try {
            // Convert the image to a file and upload it
            const blob = dataURLtoBlob(finalImageUrl);
            const file = new File([blob], `image_${i}.png`, {
              type: blob.type,
            });

            setLoadingMessage(`Uploading image ${imageIdx}...`);
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
              throw new Error(
                `Upload failed with status ${uploadResponse.status}`
              );
            }

            const uploadResult = await uploadResponse.json();
            processedImages.push(uploadResult.url);
            console.log(`Successfully uploaded image ${imageIdx}`);

            // Store the file for multi-fragment processing
            filesToProcess.push(file);
          } catch (err) {
            console.error(`Error uploading image ${imageIdx}:`, err);
            processedImages.push(imageUrl); // Keep original if upload fails
          }

          setLoadingProgress(
            Math.floor(10 + (50 * (i + 1)) / formData.images.length)
          );
        }

        // Update form data with all processed images
        updateFormData("images", processedImages);

        // Process all files with the multi-fragment API
        if (filesToProcess.length > 0) {
          try {
            setLoadingMessage("Analyzing fragmentation for all images...");

            // Create form data with all files
            const formDataFragment = new FormData();
            filesToProcess.forEach((file, index) => {
              formDataFragment.append("files", file);
            });

            // Call the multi-fragment API with all files at once
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

            const fragResults = await fragmentResponse.json();
            console.log("Fragmentation results:", fragResults);

            // Process all fragmentation results
            const newImagesFrag: string[] = [];
            const newFragResults: { image: string; conversionFactor: number }[] = [];

            fragResults.forEach((item:any) => {
              let rawBase64 = item.result.output_image;
              if (!rawBase64.startsWith("data:image")) {
                rawBase64 = "data:image/jpeg;base64," + rawBase64;
              }

              const conversionFactor =
                item.result.marker_properties?.conversion_factor || 1;

              newImagesFrag.push(rawBase64);
              newFragResults.push({
                image: rawBase64,
                conversionFactor: conversionFactor,
              });
            });

            // Update form data with fragmentation results
            updateFormData("imagesFrag", newImagesFrag);
            updateFormData("fragmentationResults", newFragResults);

            console.log("Fragmentation completed for all images");
            setLoadingProgress(90);
          } catch (error) {
            console.error("Error in fragmentation processing:", error);
            setLoadingMessage(
              `Fragmentation error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
          }
        }

        // Restore the original selected image
        if (originalImage) {
          const originalIndex = formData.images.indexOf(originalImage);
          if (originalIndex >= 0 && originalIndex < processedImages.length) {
            setSelectedImage(processedImages[originalIndex]);
            setBgImage(processedImages[originalIndex]);
          } else {
            setSelectedImage(processedImages[0]);
            setBgImage(processedImages[0]);
          }
        }

        setLoadingProgress(100);
        setLoadingMessage("Complete!");

        setTimeout(() => {
          setIsLoading(false);
          onNext();
        }, 100);
      } catch (error) {
        console.error("Error in handleNext:", error);
        setLoadingMessage(
          `Error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    };

    function handleHybridRefReady(hRef: HybridContainerRef | null) {
      if (!hRef) return;

      console.log("Hybrid ref is ready");

      if (bgImage) {
        console.log("Attempting to set editing state for:", bgImage);

        if (editingStates[bgImage]) {
          console.log("Found editing state, applying it");
          // Add a small timeout to ensure DOM is ready
          setTimeout(() => {
            hRef.setEditingState(editingStates[bgImage]);
          }, 50);
        } else {
          console.log("No editing state found for this image");
          hRef.setEditingState({
            canvasData: "",
            shapes: [],
            lines: [],
          });
        }
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
        {/* Loading overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <div className="flex items-center mb-4">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <h3 className="font-semibold">{loadingMessage}</h3>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

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
