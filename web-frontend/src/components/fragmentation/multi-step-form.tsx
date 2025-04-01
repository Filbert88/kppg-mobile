"use client";

import { useState } from "react";
import ActionScreen from "./action-screen";
import BasicInfoForm from "./basic-info-form";
import MaterialForm from "./material-form";
import PowderFactorForm from "./powder-factor-form";
import ImageUploadForm from "./image-upload-form";
import ImageUploadedFrag from "./image-uploaded-frag";
import GraphScreen from "./graph-screen";
import SummaryScreen from "./summary-screen";

export type FragmentationFormData = {
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

interface MultiStepFormProps {
  setActiveScreen: React.Dispatch<
    React.SetStateAction<"home" | "fragmentation" | "depthAverage">
  >;
}

export default function MultiStepForm({ setActiveScreen }: MultiStepFormProps) {
  const [flow, setFlow] = useState<"tambah" | "history">("tambah");
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FragmentationFormData>({
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

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep === 1) {
      setActiveScreen("home");
    } else if (currentStep === 8) {
      setActiveScreen("home"); 
    } else {
      setCurrentStep((prev) => prev - 1);
    }
  };  

  const handleSave = () => {
    console.log("Form data saved:", formData);
    setActiveScreen("home");
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
              setCurrentStep(8);
            }}
          />
        );

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
        return (
          <ImageUploadedFrag
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
          />
        );

      case 7:
        return <GraphScreen formData={formData} onSave={handleSave} />;

      case 8:
        return (
          <SummaryScreen
            formData={formData}
            hideSave={flow === "history"}
            onSave={handleSave}
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
