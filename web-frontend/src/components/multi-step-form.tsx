"use client"

import { useState } from "react"
import HomeScreen from "./fragmentation/home-screen"
import ActionScreen from "./fragmentation/action-screen"
import BasicInfoForm from "./fragmentation/basic-info-form"
import MaterialForm from "./fragmentation/material-form"
import PowderFactorForm from "./fragmentation/powder-factor-form"
import ImageUploadForm from "./fragmentation/image-upload-form"
import GraphScreen from "./fragmentation/graph-screen"
import SummaryScreen from "./fragmentation/summary-screen"

type FormData = {
  scale: string
  option: string
  size: string
  location: string
  date: string
  rockType: string
  ammoniumNitrate: string
  blastingVolume: string
  powderFactor: string
  images: string[]
}

export default function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(0)
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
  })

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const handleSave = () => {
    console.log("Form data saved:", formData)
    
    setCurrentStep(0) // Return to home screen
  }

  const renderBackButton = () => {
    if (currentStep === 0) return null

    return (
      <button onClick={handleBack} className="absolute left-4 top-0 bg-green-800 text-white px-4 py-2 font-medium">
        Back
      </button>
    )
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <HomeScreen onFragmentasiClick={() => setCurrentStep(1)} />
      case 1:
        return <ActionScreen onTambahClick={() => setCurrentStep(2)} />
      case 2:
        return <BasicInfoForm formData={formData} updateFormData={updateFormData} onNext={handleNext} />
      case 3:
        return <MaterialForm formData={formData} updateFormData={updateFormData} onNext={handleNext} />
      case 4:
        return <PowderFactorForm formData={formData} updateFormData={updateFormData} onNext={handleNext} />
      case 5:
        return <ImageUploadForm formData={formData} updateFormData={updateFormData} onNext={handleNext} />
      case 6:
        return <GraphScreen formData={formData} onNext={handleNext} />
      case 7:
        return <SummaryScreen formData={formData} onSave={handleSave} />
      default:
        return <HomeScreen onFragmentasiClick={() => setCurrentStep(1)} />
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl relative h-full">
      {renderBackButton()}
      {renderStep()}
    </div>
  )
}

