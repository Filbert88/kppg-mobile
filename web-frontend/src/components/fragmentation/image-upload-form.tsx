"use client";

import { useState, useEffect } from "react";
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

interface ImageUploadFormProps {
  formData: {
    images: string[];
  };
  updateFormData: (field: string, value: any) => void;
  onNext: () => void;
}

export default function ImageUploadForm({
  formData,
  updateFormData,
  onNext,
}: ImageUploadFormProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedImage && formData.images.length > 0) {
      setSelectedImage(formData.images[formData.images.length - 1]);
    }
  }, [selectedImage, formData.images]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = (event.target?.result as string) || "";
        setSelectedImage(imageUrl);
        updateFormData("images", [...formData.images, imageUrl]);
      };
      reader.readAsDataURL(file);
    }
  };

  const isFormValid = formData.images.length > 0;

  return (
    <div className="flex-1 flex flex-col p-6 mt-4">
      <div className="flex-1 space-y-6">
        {/* Tools Row */}
        <div className="flex justify-center space-x-2 py-2 border-b border-gray-300">
          {[Search, ZoomIn, ZoomOut, Move, RotateCw, Scissors, Pen, Link2].map(
            (Icon, i) => (
              <button key={i} className="p-2 hover:bg-gray-100 rounded-md">
                <Icon className="w-5 h-5" />
              </button>
            )
          )}
        </div>

        {/* Image Preview */}
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

        {/* Upload Button */}
        <div className="flex justify-center">
          <label className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-full flex items-center cursor-pointer">
            <span className="mr-2">+</span>
            <span>Tambah Gambar</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>
        </div>
      </div>

      {/* Next Button */}
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
