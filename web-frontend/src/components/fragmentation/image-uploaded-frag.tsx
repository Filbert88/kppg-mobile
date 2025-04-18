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
  Loader2
} from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import html2canvas from "html2canvas";

// Modal components
import ColorPickerModal from "./modal/ColorPickerModal";
import ShapePickerModal from "./modal/ShapePickerModal";
import ThicknessPickerModal from "./modal/ThicknessPickerModal";

// Image container for canvas drawing
import ImageContainer from "./ImageContainer";
import { HybridContainerRef, HybridContainerState } from "./HybridContainer";

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

interface ImageUploadedFragProps {
  formData: {
    imagesFrag: string[];
    editingFragStates: Record<string, HybridContainerState>;
    // fragmentationResults contains an object per image with its conversionFactor.
    fragmentationResults: Array<{
      image: string;
      conversionFactor: number;
      analysisResult?: any;
    }>;
    // Used to compute K = Q/V
    ammoniumNitrate: string;
    blastingVolume: string;
  };
  updateFormData: (field: string, value: any) => void;
  onNext: () => void;
}

export interface ImageUploadFragRef {
  saveEditingState: () => void;
}

function normalizeBase64Image(base64Str: string): string {
  if (base64Str.startsWith("data:")) return base64Str;
  return "data:image/jpeg;base64," + base64Str;
}

const ImageUploadedFrag = forwardRef<
  ImageUploadFragRef,
  ImageUploadedFragProps
>(({ formData, updateFormData, onNext }, ref) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [disablePan, setDisablePan] = useState(false);
  const [editingStates, setEditingStates] = useState<
    Record<string, HybridContainerState>
  >(() => formData.editingFragStates || {});
  const [activeTool, setActiveTool] = useState<Tool>("none");
  const [chosenColor, setChosenColor] = useState("#000000");
  const [lineThickness, setLineThickness] = useState<number>(3);
  const [shapeType, setShapeType] = useState<ShapeType>("rect");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showShapePicker, setShowShapePicker] = useState(false);
  const [showThicknessPicker, setShowThicknessPicker] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");

  const cropperRef = useRef<any>(null);
  const transformWrapperRef = useRef<any>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const hybridContainerRef = useRef<HybridContainerRef>(null);

  console.log("results: ", formData.fragmentationResults);
  // When mounting, set the default selected image from imagesFrag.
  useEffect(() => {
    if (!selectedImage && formData.imagesFrag.length > 0) {
      let img = formData.imagesFrag[0];
      img = normalizeBase64Image(img);
      setSelectedImage(img);
      setBgImage(img);
      if (editingStates[img] && hybridContainerRef.current) {
        hybridContainerRef.current.setEditingState(editingStates[img]);
      }
    }
  }, [selectedImage, formData.imagesFrag]);

  useEffect(() => {
    if (bgImage && editingStates[bgImage] && hybridContainerRef.current) {
      hybridContainerRef.current.setEditingState(editingStates[bgImage]);
    }
  }, [bgImage, editingStates]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (selectedImage && hybridContainerRef.current) {
        const currentState = hybridContainerRef.current.getEditingState();
        const normalizedSelectedImage = normalizeBase64Image(selectedImage);

        setEditingStates((prev) => ({
          ...prev,
          [normalizedSelectedImage]: currentState,
        }));
        updateFormData("editingFragStates", {
          // Use editingFragStates, not editingStates
          ...editingStates,
          [normalizedSelectedImage]: currentState,
        });
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        let newImageUrl = (event.target?.result as string) || "";
        newImageUrl = normalizeBase64Image(newImageUrl);
        const updatedImages = [...formData.imagesFrag, newImageUrl];
        updateFormData("imagesFrag", updatedImages);
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
    } else if (tool === "line" || tool === "erase") {
      setShowThicknessPicker(true);
    } else if (tool === "crop") {
      setShowCropModal(true);
    }
  }

  async function handleCropDone() {
    if (cropperRef.current) {
      const cropper = cropperRef.current.cropper;
      const croppedCanvas = cropper.getCroppedCanvas();
      if (croppedCanvas) {
        const croppedImageUrl = croppedCanvas.toDataURL("image/png");
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

  function saveCurrentEditingState() {
    if (selectedImage && hybridContainerRef.current) {
      const state = hybridContainerRef.current.getEditingState();
      const normalizedSelectedImage = normalizeBase64Image(selectedImage);
      setEditingStates((prev) => ({
        ...prev,
        [normalizedSelectedImage]: state,
      }));
    }
  }

  function switchImage(newImage: string) {
    if (selectedImage && hybridContainerRef.current) {
      const currentState = hybridContainerRef.current.getEditingState();
      // Normalize the current selected image before saving its state
      const normalizedSelectedImage = normalizeBase64Image(selectedImage);

      // Update both the local state and form data with the CORRECT FIELD NAME
      const updatedStates = {
        ...editingStates,
        [normalizedSelectedImage]: currentState,
      };
      setEditingStates(updatedStates);
      updateFormData("editingFragStates", updatedStates); // Use editingFragStates, not editingStates
    }

    // Normalize the new image
    const normalizedNewImage = normalizeBase64Image(newImage);
    setSelectedImage(normalizedNewImage);
    setBgImage(normalizedNewImage);

    // Apply editing state for the new image
    setTimeout(() => {
      if (hybridContainerRef.current) {
        // Check for the normalized image URL in editing states
        if (
          editingStates[normalizedNewImage] &&
          Object.keys(editingStates[normalizedNewImage]).length > 0
        ) {
          console.log(`Applying editing state for ${normalizedNewImage}`);
          hybridContainerRef.current.setEditingState(
            editingStates[normalizedNewImage]
          );
        } else {
          console.log(
            `No editing state found for ${normalizedNewImage}, setting empty state`
          );
          hybridContainerRef.current.setEditingState({
            canvasData: "",
            shapes: [],
            lines: [],
          });
        }
      }
    }, 50);
  }

  useImperativeHandle(ref, () => ({
    saveEditingState() {
      if (selectedImage && hybridContainerRef.current) {
        const currentState = hybridContainerRef.current.getEditingState();
        const normalizedSelectedImage = normalizeBase64Image(selectedImage);
        const newStates = {
          ...editingStates,
          [normalizedSelectedImage]: currentState,
        };
        setEditingStates(newStates);
        updateFormData("editingFragStates", newStates); // Correct field name
      }
    },
  }));

  // When the user clicks "Next", for every image in imagesFrag we call fragmentation-analysis.
  // The payload uses fixed A = 5.955, E = 100, n = 1.851.
  // K is computed as Q/V with Q = ammoniumNitrate and V = blastingVolume.
  // The conversion factor is taken from fragmentationResults array at the same index.
  const handleNext = async () => {
    try {
      // Show loading state
      // (You may want to add loading state variables like in the previous component)

      // First, save the current editing state
      if (selectedImage && hybridContainerRef.current) {
        const currentState = hybridContainerRef.current.getEditingState();
        const updatedStates = {
          ...editingStates,
          [selectedImage]: currentState,
        };
        setEditingStates(updatedStates);
        updateFormData("editingFragStates", updatedStates);
      }

      // Store the original selected image to restore later
      const originalImage = selectedImage;

      // Create a copy of editing states to work with
      const editingStatesCopy = JSON.parse(JSON.stringify(editingStates));

      console.log("ALL FRAG IMAGES TO PROCESS:", formData.imagesFrag);
      console.log("ALL FRAG EDITING STATES:", editingStatesCopy);

      // Process all images
      const processedImages = [];
      const filesToAnalyze = [];

      // Process each image sequentially with proper rendering and capture
      for (let i = 0; i < formData.imagesFrag.length; i++) {
        const imageUrl = formData.imagesFrag[i];
        const normalizedImageUrl = normalizeBase64Image(imageUrl);

        console.log(
          `Processing frag image ${i + 1}/${formData.imagesFrag.length}`
        );

        // Check if this image has edits
        const hasEdits =
          editingStatesCopy[normalizedImageUrl] &&
          (editingStatesCopy[normalizedImageUrl].canvasData ||
            (editingStatesCopy[normalizedImageUrl].shapes &&
              editingStatesCopy[normalizedImageUrl].shapes.length > 0) ||
            (editingStatesCopy[normalizedImageUrl].lines &&
              editingStatesCopy[normalizedImageUrl].lines.length > 0));

        console.log(`Image ${i + 1} has edits:`, hasEdits);

        let finalImageUrl = normalizedImageUrl;

        // If image has edits, switch to it and capture it
        if (hasEdits) {
          try {
            // Set up the UI to show this image with its edits
            setSelectedImage(normalizedImageUrl);
            setBgImage(normalizedImageUrl);

            // Apply edits to the hybrid container
            if (hybridContainerRef.current) {
              hybridContainerRef.current.setEditingState(
                editingStatesCopy[normalizedImageUrl]
              );
              console.log(`Applied editing state to frag image ${i + 1}`);
            }

            // Wait for the rendering to complete
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Capture the image with its edits
            if (imageContainerRef.current) {
              console.log(`Capturing canvas for frag image ${i + 1}`);

              const canvas = await html2canvas(imageContainerRef.current, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                scale: 1,
                logging: true,
              });

              finalImageUrl = canvas.toDataURL("image/png");
              console.log(`Canvas captured for frag image ${i + 1}`);
            }
          } catch (err) {
            console.error(`Error capturing frag image ${i + 1}:`, err);
            finalImageUrl = normalizedImageUrl; // Fallback to original
          }
        }

        try {
          // Convert the image to a File and upload it
          const blob = dataURLtoBlob(finalImageUrl);
          const file = new File([blob], `editedFragImage_${i}.png`, {
            type: blob.type,
          });

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

          // Save the file for fragmentation analysis
          filesToAnalyze.push(file);

          console.log(`Successfully uploaded frag image ${i + 1}`);
        } catch (err) {
          console.error(`Error uploading frag image ${i + 1}:`, err);
          // If upload fails, use original image URL
          processedImages.push(imageUrl);
        }
      }

      // Update the imagesFrag in formData with processed images
      updateFormData("imagesFrag", processedImages);

      // Now call the fragmentation-analysis with all files
      try {
        const analysisFormData = new FormData();

        // For each file, fetch it again from its URL and add to form data
        for (let i = 0; i < filesToAnalyze.length; i++) {
          analysisFormData.append("files", filesToAnalyze[i]);
        }

        // Compute parameters (K = Q/V)
        const Q = parseFloat(formData.ammoniumNitrate) || 0;
        const V = parseFloat(formData.blastingVolume) || 1;
        const K = Q / V;

        // Add analysis parameters to form data
        analysisFormData.append("A", "5.955");
        analysisFormData.append("K", K.toString());
        analysisFormData.append("Q", formData.ammoniumNitrate);
        analysisFormData.append("E", "100");
        analysisFormData.append("n", "1.851");

        // Use the conversion factor from the first fragmentation result
        const conversion =
          formData.fragmentationResults[0]?.conversionFactor || 1;
        analysisFormData.append("conversion", conversion.toString());

        console.log("Sending fragmentation analysis request with parameters:", {
          files: filesToAnalyze.length,
          A: "5.955",
          K,
          Q: formData.ammoniumNitrate,
          E: "100",
          n: "1.851",
          conversion,
        });

        // Call the API for analysis
        const analysisResponse = await fetch(
          "http://localhost:5180/api/Fragmentation/fragmentation-analysis",
          {
            method: "POST",
            body: analysisFormData,
          }
        );

        if (!analysisResponse.ok) {
          throw new Error(
            `Analysis failed with status ${analysisResponse.status}`
          );
        }

        const analysisResults = await analysisResponse.json();
        console.log("Analysis results:", analysisResults);

        // Save the results in formData
        updateFormData("finalAnalysisResults", analysisResults);

        // Restore the original selected image if possible
        if (originalImage) {
          const originalIndex = formData.imagesFrag.indexOf(originalImage);
          if (originalIndex >= 0 && originalIndex < processedImages.length) {
            setSelectedImage(processedImages[originalIndex]);
            setBgImage(processedImages[originalIndex]);
          }
        }

        // Move to the next step
        onNext();
      } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Fragmentation analysis error:", err);
      alert(`Error during fragmentation analysis: ${msg}`);
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("General error during handleNext:", error);
    alert(`Error: ${msg}`);
  }
  };

  function handleHybridRefReady(hRef: HybridContainerRef | null) {
    if (!hRef) return;

    console.log("Hybrid ref is ready");

    if (bgImage) {
      const normalizedBgImage = normalizeBase64Image(bgImage);
      console.log("Attempting to set editing state for:", normalizedBgImage);
      console.log("Available states:", Object.keys(editingStates));

      if (editingStates[normalizedBgImage]) {
        console.log("Found editing state, applying it");
        setTimeout(() => {
          hRef.setEditingState(editingStates[normalizedBgImage]);
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
              src={normalizeBase64Image(img)}
              alt={`Thumbnail ${idx}`}
              className="w-full object-contain"
            />
          </div>
        ))}
      </div>
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
});

export default ImageUploadedFrag;
