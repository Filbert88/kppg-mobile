"use client";

import { useState } from "react";
import StartScreen from "./start-screen";
import HomeScreen from "../home-screen";
import ImageUploadScreen from "./image-upload-screen";
import HoleInfoScreen from "./hole-info-screen";
import DepthMeasurementScreen from "./depth-measurement-screen";
import AverageScreen from "./average-screen";
import SummaryScreen from "./summary-screen";

type DepthAverageFormData = {
  numberOfHoles: string;
  location: string;
  date: string;
  image: string | null;
  depths: {
    hole1: string;
    hole2: string;
    hole3: string;
    hole4: string;
    hole5: string;
  };
  average: string;
};

export default function DepthAverageForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<DepthAverageFormData>({
    numberOfHoles: "",
    location: "",
    date: "",
    image: null,
    depths: {
      hole1: "",
      hole2: "",
      hole3: "",
      hole4: "",
      hole5: "",
    },
    average: "22.5 cm",
  });

  const updateFormData = (field: keyof DepthAverageFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateDepth = (hole: keyof typeof formData.depths, value: string) => {
    setFormData((prev) => ({
      ...prev,
      depths: {
        ...prev.depths,
        [hole]: value,
      },
    }));
  };

  const handleNext = () => {
    console.log("tes")
    setCurrentStep((prev) => prev + 1); // Ensure state updates first
    
    console.log("Current Step Before:", currentStep);
    
    if (currentStep === 3) {
      const depths = Object.values(formData.depths).filter((d) => d !== "");
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
  
    console.log("Current Step After:", currentStep + 1);
  };
  

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSave = () => {
    console.log("Depth Average data saved:", formData);
    // Here you would typically send the data to your backend
    setCurrentStep(0); // Return to home screen
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
            numberOfHoles={formData.numberOfHoles}
            location={formData.location}
            date={formData.date}
            onUpdateNumberOfHoles={(value) =>
              updateFormData("numberOfHoles", value)
            }
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
        return <AverageScreen average={formData.average} onNext={handleNext} />;
      case 5:
        return <SummaryScreen formData={formData} onSave={handleSave} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl relative h-full">
      {currentStep > 0 && renderBackButton()}
      {renderStep()}
    </div>
  );
}
