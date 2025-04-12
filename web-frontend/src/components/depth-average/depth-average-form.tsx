"use client";

import { useState } from "react";
import ImageUploadScreen from "./image-upload-screen";
import HoleInfoScreen from "./hole-info-screen";
import DepthMeasurementScreen from "./depth-measurement-screen";
import AverageScreen from "./average-screen";
import SummaryScreen from "./summary-screen";
import ActionScreenDA from "./action-da";
import DatePriority from "../date-priority";
import { fetchNextPriority } from "@/lib/function";

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

  const handleNext = async () => {
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
    } else if (currentStep === 6) {
      setCurrentStep(0);
    } else {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSave = async () => {
    const payload = {
      jumlahLubang: formData.numberOfHoles.toString(),
      lokasi: formData.location,
      tanggal: formData.date,
      prioritas: Number(formData.priority),
      kedalaman: JSON.stringify(
        formData.depths.reduce((acc, val, index) => {
          acc[`kedalaman${index + 1}`] = val;
          return acc;
        }, {} as Record<string, string>)
      ),
      average: formData.average.replace(" cm", ""),
      imageUri: formData.image,
      synced: 1,
    };

    try {
      const response = await fetch("http://localhost:5180/api/DepthAverage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([payload]),
      });

      if (!response.ok) {
        if (response.status === 409) {
          const errorData = await response.json();
          const nextPriority = Math.max(...errorData.existingPriorities) + 1;
          alert(
            `Priority ${formData.priority} already exists for ${formData.date}. Auto-updating to ${nextPriority}.`
          );

          payload.prioritas = nextPriority;

          const retry = await fetch("http://localhost:5180/api/DepthAverage", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify([payload]),
          });

          if (retry.ok) {
            console.log("Conflict resolved. Data saved with new priority.");
            setActiveScreen("home");
          } else {
            throw new Error("Retry failed to save data.");
          }
        } else {
          throw new Error("Failed to save Depth Average data.");
        }
      } else {
        console.log("Data saved successfully");
        setActiveScreen("home");
      }
    } catch (error) {
      console.error("Error saving Depth Average data:", error);
      alert("Failed to save data.");
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <ActionScreenDA
            onTambahClick={() => setCurrentStep(1)}
            onRiwayatClick={() => setCurrentStep(6)}
          />
        );
      case 1:
        return (
          <DatePriority
            date={formData.date}
            priority={formData.priority}
            onDateChange={async (value) => {
              updateFormData("date", value);
              const next = await fetchNextPriority(value, "depthAverage");
              if (next !== null) {
                updateFormData("priority", next.toString());
              }
            }}
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
            onImageSelect={(_, imageUrl, depths) => {
              updateFormData("image", imageUrl);
              updateFormData("numberOfHoles", depths.length);
              updateFormData("depths", depths);
            }}
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
        return <SummaryScreen />;
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
