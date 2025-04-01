"use client";

import { Button } from "@/components/ui/button";
import {
  Search,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCw,
  Scissors,
  Pen,
  Link2,
} from "lucide-react";
import { FragmentationFormData } from "./multi-step-form";

interface ImageUploadedFragProps {
  formData: FragmentationFormData;
  updateFormData: (field: string, value: any) => void;
  onNext: () => void;
}

export default function ImageUploadedFrag({
  formData,
  updateFormData,
  onNext,
}: ImageUploadedFragProps) {
  const selectedImage = formData.images[formData.images.length - 1] || null;
  const isFormValid = !!selectedImage;

  return (
    <div className="flex-1 flex flex-col p-6 mt-4">
      <div className="flex-1 space-y-6">
        <div className="flex justify-center space-x-2 py-2 border-b border-gray-300">
          {[Search, ZoomIn, ZoomOut, Move, RotateCw, Scissors, Pen, Link2].map(
            (Icon, i) => (
              <button key={i} className="p-2 hover:bg-gray-100 rounded-md">
                <Icon className="w-5 h-5" />
              </button>
            )
          )}
        </div>

        <div className="flex border border-gray-300 rounded-md aspect-square overflow-hidden bg-white max-w-md justify-center">
          {selectedImage ? (
            <img
              src={selectedImage}
              alt="Uploaded"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <p>No image selected</p>
                <p>Please upload an image</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={onNext}
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
  );
}
