"use client";

import { useState } from "react";
import ImageUploadScreen from "./image-upload-screen";
import HoleInfoScreen from "./hole-info-screen";
import DepthMeasurementScreen from "./depth-measurement-screen";
import AverageScreen from "./average-screen";
import SummaryScreen from "./summary-screen";
import ActionScreenDA from "./action-da";
import DatePriority from "../date-priority";

type DepthAverageFormData = {
  numberOfHoles: number;
  location: string;
  date: string;
  priority: string;
  image: string | null;
  depths: string[];
  average: string;
};

export default function DepthAverageForm({
  setActiveScreen,
}: {
  setActiveScreen: React.Dispatch<
    React.SetStateAction<"home" | "fragmentation" | "depthAverage">
  >;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<DepthAverageFormData>({
    numberOfHoles: 0,
    location: "",
    date: "",
    priority: "",
    image: null,
    depths: [],
    average: "22.5 cm",
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const updateFormData = (field: keyof DepthAverageFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateNumberOfHoles = (value: string) => {
    const numHoles = parseInt(value) || 0;
    setFormData((prev) => ({
      ...prev,
      numberOfHoles: numHoles,
      depths: Array(numHoles).fill(""),
    }));
  };

  const updateDepth = (index: number, value: string) => {
    setFormData((prev) => {
      const newDepths = [...prev.depths];
      newDepths[index] = value;
      return { ...prev, depths: newDepths };
    });
  };

  const processOcr = async (file: File) => {
    const formDataOcr = new FormData();
    formDataOcr.append("file", file);

    try {
      const response = await fetch("http://localhost:5180/api/ocr", {
        method: "POST",
        body: formDataOcr,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch OCR result");
      }

      const result = (await response.json()) as {
        ocr_result: Record<string, any>;
      };

      const ocrResult = result.ocr_result;
      const entries = Object.entries(ocrResult).map(([key, value]) => [
        Number(key),
        value,
      ]);

      entries.sort((a, b) => a[0] - b[0]);
      const newDepths = entries.map((entry) => entry[1]);

      updateFormData("numberOfHoles", entries.length);
      updateFormData("depths", newDepths);

      console.log("OCR processed:", {
        numberOfHoles: entries.length,
        depths: newDepths,
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error processing OCR:", error.message);
      } else {
        console.error("Error processing OCR:", String(error));
      }
    }
  };

  const handleNext = async () => {
    if (currentStep === 2 && uploadedFile) {
      try {
        const formData = new FormData();
        formData.append("file", uploadedFile);

        const uploadResponse = await fetch(
          "http://localhost:5180/api/Upload/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error("Upload failed");
        }

        const uploadResult = await uploadResponse.json();
        const imageUrl = uploadResult.url;
        updateFormData("image", imageUrl);

        await processOcr(uploadedFile);
      } catch (error) {
        console.error("Image upload or OCR error:", error);
        alert("Gagal mengunggah atau memproses gambar.");
        return;
      }
    }

    if (currentStep === 4) {
      const depths = formData.depths.filter((d) => d.trim() !== "");
      if (depths.length > 0) {
        const sum = depths.reduce(
          (acc, curr) => acc + (Number.parseFloat(curr) || 0),
          0
        );
        const avg = sum / depths.length;
        updateFormData("average", `${avg.toFixed(1)} cm`);
      }
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep === 0) {
      setActiveScreen("home");
    } else {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSave = async () => {
    console.log("Depth Average data saved:", formData);
    try {
      setActiveScreen("home");
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <ActionScreenDA
            onTambahClick={() => setCurrentStep(1)}
            onRiwayatClick={() => setCurrentStep(5)}
          />
        );
      case 1:
        return (
          <DatePriority
            date={formData.date}
            onDateChange={(value) => updateFormData("date", value)}
            priority={formData.priority}
            onPriorityChange={(value) => updateFormData("priority", value)}
            onNext={handleNext}
            formType="depthAverage"
            label="Tanggal Pengukuran"
          />
        );
      case 2:
        return (
          <ImageUploadScreen
            image={formData.image}
            onImageSelect={(file) => setUploadedFile(file)}
            onNext={handleNext}
          />
        );
      case 3:
        return (
          <HoleInfoScreen
            numberOfHoles={formData.numberOfHoles.toString()}
            location={formData.location}
            date={formData.date}
            onUpdateNumberOfHoles={(value) => updateNumberOfHoles(value)}
            onUpdateLocation={(value) => updateFormData("location", value)}
            onNext={handleNext}
          />
        );
      case 4:
        return (
          <DepthMeasurementScreen
            depths={formData.depths}
            onUpdateDepth={updateDepth}
            onNext={handleNext}
          />
        );
      case 5:
        return <AverageScreen average={formData.average} onSave={handleSave} />;
      case 6:
        return <SummaryScreen formData={formData} onSave={handleSave} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl relative h-full">
      <button
        onClick={handleBack}
        className="absolute left-0 top-0 bg-green-800 text-white px-4 py-2 font-medium rounded-lg"
      >
        Back
      </button>
      {renderStep()}
    </div>
  );
}
