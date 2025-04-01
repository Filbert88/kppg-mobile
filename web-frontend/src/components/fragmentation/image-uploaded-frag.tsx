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

  return (
    <div className="flex-1 flex flex-col p-6 mt-4">
      <div className="flex-1 space-y-6">
        <div className="flex justify-center space-x-2 py-2 border-b border-gray-300">
          <button className="p-2 hover:bg-gray-100 rounded-md">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-md">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-md">
            <ZoomOut className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-md">
            <Move className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-md">
            <RotateCw className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-md">
            <Scissors className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-md">
            <Pen className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-md">
            <Link2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border border-gray-300 rounded-md aspect-square overflow-hidden bg-white max-w-md justify-center">
          {selectedImage ? (
            <img
              src={selectedImage || "/placeholder.svg"}
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

      <div className="absolute -bottom-8 right-4">
        <Button
          onClick={onNext}
          className="bg-green-800 hover:bg-green-900 text-white font-medium py-2 px-6 rounded-lg"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
