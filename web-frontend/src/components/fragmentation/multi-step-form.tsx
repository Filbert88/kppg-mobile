"use client";

import { useRef, useState } from "react";
import ActionScreen from "./action-screen";
import BasicInfoForm from "./basic-info-form";
import MaterialForm from "./material-form";
import PowderFactorForm from "./powder-factor-form";
import ImageUploadForm, { ImageUploadFormRef } from "./image-upload-form";
import ImageUploadedFrag, { ImageUploadFragRef } from "./image-uploaded-frag";
import GraphScreen from "./graph-screen";
import DatePriority from "../date-priority";
import DiggingTimePage from "./digging-time";
import { HybridContainerState } from "./HybridContainer";
import { fetchNextPriority } from "@/lib/function";
import FragmentationSummaryPage from "./FragmentationSummary";
// The full form data type used throughout the multi-step process.
export type FragmentationFormData = {
  scale: string;
  option: string;
  size: string;
  location: string;
  date: string;
  priority: string;
  rockType: string;
  ammoniumNitrate: string;
  blastingVolume: string;
  powderFactor: string;
  images: string[]; // images from the first upload (ImageUploadForm)
  editingStates: Record<string, HybridContainerState>;
  imagesFrag: string[]; // output images (in base64) from the red-outline fragmentation API
  editingFragStates: Record<string, HybridContainerState>;
  fragmentationResults: Array<{
    image: string;
    conversionFactor: number;
    analysisResult?: any;
  }>;
  finalAnalysisResults: any[]; // Analysis results after calling fragmentation-analysis API
  diggingTime?: string;
  videoUri?: string;
};

interface MultiStepFormProps {
  setActiveScreen: React.Dispatch<
    React.SetStateAction<"home" | "fragmentation" | "depthAverage">
  >;
}

export default function MultiStepForm({ setActiveScreen }: MultiStepFormProps) {
  const [flow, setFlow] = useState<"tambah" | "history">("tambah");
  const [currentStep, setCurrentStep] = useState(1);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<FragmentationFormData>({
    scale: "",
    option: "",
    size: "",
    location: "",
    date: "",
    priority: "",
    rockType: "Claystone",
    ammoniumNitrate: "",
    blastingVolume: "",
    powderFactor: "25",
    images: [],
    editingStates: {},
    imagesFrag: [],
    editingFragStates: {},
    fragmentationResults: [],
    finalAnalysisResults: [],
    diggingTime: undefined,
    videoUri: undefined,
  });

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  console.log("formdata", formData);
  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const imageUploadFormRef = useRef<ImageUploadFormRef>(null);
  const imageUploadFragRef = useRef<ImageUploadFragRef>(null);

  function handleBack() {
    if (isEdit && currentStep <= 3) return;
    if (currentStep === 6) {
      imageUploadFormRef.current?.saveEditingState();
    }
    if (currentStep === 7) {
      imageUploadFragRef.current?.saveEditingState();
    }
    if (currentStep === 10) {
      setCurrentStep(1);
      return;
    }
    if (currentStep === 1 || currentStep === 8) {
      setActiveScreen("home");
    } else {
      setCurrentStep((prev) => prev - 1);
    }
  }

  const handleCancelEdit = () => {
    setIsEdit(false);
    setCurrentStep(10);
  };

  const handleSave = async () => {
    try {
      // Build the DTO based on the formData
      const dto = {
        skala: formData.scale,
        pilihan: formData.option,
        ukuran: formData.size,
        lokasi: formData.location,
        tanggal: formData.date,
        prioritas: parseInt(formData.priority),
        litologi: formData.rockType,
        ammoniumNitrate: formData.ammoniumNitrate,
        volumeBlasting: formData.blastingVolume,
        powderFactor: formData.powderFactor,
        diggingTime: formData.diggingTime ?? null,
        videoUri: formData.videoUri ?? null,
        uploadedImageUrls: formData.images,
        fragmentedImageUrls: formData.imagesFrag,
        plotImageUrls: formData.finalAnalysisResults.map((a) =>
          a.plot_image_base64.replace("localhost", "10.0.2.2")
        ),
        analysisJsonList: formData.finalAnalysisResults,
      };

      const response = await fetch("http://localhost:5180/api/Fragmentation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        if (response.status === 409) {
          const data = await response.json();
          const newPriority = Math.max(...data.existingPriorities) + 1;
          dto.prioritas = newPriority;
          const retry = await fetch("http://localhost:5180/api/Fragmentation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(dto),
          });

          if (!retry.ok) throw new Error("Retry failed");
          const result = await retry.json();
          updateFormData("priority", newPriority.toString());
          console.log("Saved with new priority", result);
        } else {
          const text = await response.text();
          throw new Error(`Server Error ${response.status}: ${text}`);
        }
      } else {
        const result = await response.json();
        console.log("Successfully saved", result);
      }

      setActiveScreen("home");
    } catch (error) {
      console.error("Error saving form:", error);
      alert("Gagal menyimpan data. Silakan coba lagi.");
    }
  };

  const renderBackButton = () => (
    <button
      onClick={handleBack}
      className="absolute left-4 top-0 bg-green-800 text-white px-4 py-2 font-medium rounded-lg"
    >
      Back
    </button>
  );

  const renderStep = () => {
    const cancelButton = isEdit && (
      <button
        onClick={handleCancelEdit}
        className="absolute top-0 right-0 bg-red-500 text-white px-4 py-2 rounded-lg"
      >
        Cancel Edit
      </button>
    );
    switch (currentStep) {
      case 1:
        return (
          <ActionScreen
            onTambahClick={() => {
              setFlow("tambah");
              setCurrentStep(2);
            }}
            onRiwayatClick={() => {
              setFlow("history");
              setCurrentStep(10);
            }}
          />
        );
      case 2:
        return (
          <DatePriority
            date={formData.date}
            priority={formData.priority}
            onDateChange={async (value) => {
              updateFormData("date", value);
              const next = await fetchNextPriority(value, "fragmentation");
              if (next !== null) updateFormData("priority", next.toString());
            }}
            onPriorityChange={(value) => updateFormData("priority", value)}
            onNext={handleNext}
            formType="fragmentation"
            label="Tanggal Fragmentasi"
            nextLabel="Next"
          />
        );
      case 3:
        return (
          <>
            {cancelButton}
            <BasicInfoForm
              formData={formData}
              updateFormData={updateFormData}
              onNext={handleNext}
            />
          </>
        );
      case 4:
        return (
          <>
            {cancelButton}
            <MaterialForm
              formData={formData}
              updateFormData={updateFormData}
              onNext={handleNext}
            />
          </>
        );
      case 5:
        return (
          <>
            {cancelButton}
            <PowderFactorForm
              formData={formData}
              updateFormData={updateFormData}
              onNext={handleNext}
            />
          </>
        );
      case 6:
        return (
          <>
            {cancelButton}
            <ImageUploadForm
              key={currentStep}
              ref={imageUploadFormRef}
              formData={formData}
              updateFormData={updateFormData}
              onNext={handleNext}
            />
          </>
        );
      case 7:
        return (
          <ImageUploadedFrag
            key={currentStep}
            ref={imageUploadFragRef}
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
          />
        );
      case 8:
        return (
          <GraphScreen
            formData={formData}
            updateFormData={updateFormData}
            onSave={handleSave}
            onDiggingTimeClick={() => setCurrentStep(9)}
          />
        );
      case 9:
        return (
          <DiggingTimePage
            onSaveDiggingData={(digTime, videoUrl) => {
              setFormData((prev) => {
                const updated = {
                  ...prev,
                  diggingTime: digTime,
                  videoUri: videoUrl,
                };
                setTimeout(() => {
                  handleSave(); 
                }, 0);
                return updated;
              });
            }}
            onBack={() => setCurrentStep(10)}
          />
        );

      case 10:
        return (
          <FragmentationSummaryPage
            onTambahFoto={(item) => {
              const reconstructed: FragmentationFormData = {
                scale: item.scale,
                option: item.option || "",
                size: item.size || "",
                location: item.location,
                date: item.date,
                priority: item.prioritas,
                rockType: item.rockType || "Claystone",
                ammoniumNitrate: item.ammoniumNitrate || "",
                blastingVolume: item.blastingVolume || "",
                powderFactor: item.powderFactor || "25",
                images:
                  item.fragmentationImages?.map((img: any) => img.imageUri) ||
                  [],
                editingStates: {},
                imagesFrag: [],
                editingFragStates: {},
                fragmentationResults: [],
                finalAnalysisResults: [],
                diggingTime: item.diggingTime ?? undefined,
                videoUri: item.videoUri ?? undefined,
              };
              console.log("🧪 Reconstructed formData", reconstructed);
              setFormData(reconstructed);
              setIsEdit(true);
              setCurrentStep(6);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl relative h-full">
      {renderBackButton()}
      {renderStep()}
    </div>
  );
}
