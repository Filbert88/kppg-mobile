"use client";

import { useState } from "react";
import ImageUploadScreen from "./image-upload-screen";
import HoleInfoScreen from "./hole-info-screen";
import DepthMeasurementScreen from "./depth-measurement-screen";
import AverageScreen from "./average-screen";
import SummaryScreen from "./summary-screen";
import ActionScreenDA from "./action-da";

type DepthAverageFormData = {
  numberOfHoles: number;
  location: string;
  date: string;
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
  const [currentStep, setCurrentStep] = useState(0); // Start at 0 for ActionScreenDA
  const [formData, setFormData] = useState<DepthAverageFormData>({
    numberOfHoles: 0,
    location: "",
    date: "",
    image: null,
    depths: [],
    average: "22.5 cm",
  });

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

  // Update a specific depth by index
  const updateDepth = (index: number, value: string) => {
    setFormData((prev) => {
      const newDepths = [...prev.depths];
      newDepths[index] = value;
      return { ...prev, depths: newDepths };
    });
  };

  const handleNext = () => {
    // If leaving depth measurement step, calculate average
    if (currentStep === 3) {
      const depths = formData.depths.filter((d) => d !== "");
      if (depths.length > 0) {
        const sum = depths.reduce(
          (acc, curr) => acc + Number.parseFloat(curr || "0"),
          0
        );
        const avg = sum / depths.length;
        setFormData((prev) => ({
          ...prev,
          average: `${avg.toFixed(1)} cm`,
        }));
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
      // const res = await fetch("/api/depth-average", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(formData),
      // });
      // if (res.ok) {
      //   setActiveScreen("home");
      // } else {
      //   console.error("Error saving data");
      // }
      setActiveScreen("home");
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  const renderBackButton = () => {
    return (
      <button
        onClick={handleBack}
        className="absolute left-0 top-0 bg-green-800 text-white px-4 py-2 font-medium rounded-lg"
      >
        Back
      </button>
    );
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
          <ImageUploadScreen
            image={formData.image}
            onImageUpload={(img) => updateFormData("image", img)}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <HoleInfoScreen
            numberOfHoles={formData.numberOfHoles.toString()}
            location={formData.location}
            date={formData.date}
            onUpdateNumberOfHoles={updateNumberOfHoles}
            onUpdateLocation={(value) => updateFormData("location", value)}
            onUpdateDate={(value) => updateFormData("date", value)}
            onNext={handleNext}
          />
        );
      case 3:
        return (
          <DepthMeasurementScreen
            depths={formData.depths}
            onUpdateDepth={updateDepth}
            onNext={handleNext}
          />
        );
      case 4:
        return <AverageScreen average={formData.average} onSave={handleSave} />;
      case 5:
        return <SummaryScreen formData={formData} onSave={handleSave} />;
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
