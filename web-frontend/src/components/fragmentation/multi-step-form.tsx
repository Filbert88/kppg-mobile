"use client";

import { useState } from "react";
import ActionScreen from "./action-screen";
import BasicInfoForm from "./basic-info-form";
import MaterialForm from "./material-form";
import PowderFactorForm from "./powder-factor-form";
import ImageUploadForm from "./image-upload-form";
import GraphScreen from "./graph-screen";
import SummaryScreen from "./summary-screen";

type FormData = {
  scale: string;
  option: string;
  size: string;
  location: string;
  date: string;
  rockType: string;
  ammoniumNitrate: string;
  blastingVolume: string;
  powderFactor: string;
  images: string[];
};

export default function MultiStepForm({ setActiveScreen }: { setActiveScreen: React.Dispatch<React.SetStateAction<"home" | "fragmentation" | "depthAverage">> }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    scale: "",
    option: "",
    size: "",
    location: "",
    date: "",
    rockType: "Amonium Nitrat",
    ammoniumNitrate: "",
    blastingVolume: "",
    powderFactor: "25",
    images: [],
  });

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveScreen("home"); // This sets the screen back to home when you hit back
  };

  const handleSave = () => {
    console.log("Form data saved:", formData);
    setCurrentStep(0); // Return to home screen
  };

  const renderBackButton = () => {
    if (currentStep === 0) return null;

    return (
      <button
        onClick={handleBack}
        className="absolute left-4 top-0 bg-green-800 text-white px-4 py-2 font-medium rounded-lg"
      >
        Back
      </button>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <ActionScreen onTambahClick={() => setCurrentStep(2)} />;
      case 2:
        return (
          <BasicInfoForm
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
          />
        );
      case 3:
        return (
          <MaterialForm
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
          />
        );
      case 4:
        return (
          <PowderFactorForm
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
          />
        );
      case 5:
        return (
          <ImageUploadForm
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
          />
        );
      case 6:
        return <GraphScreen formData={formData} onNext={handleNext} />;
      case 7:
        return <SummaryScreen formData={formData} onSave={handleSave} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl relative h-full ">
      {renderBackButton()}
      {renderStep()}
    </div>
  );
}
