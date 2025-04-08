"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit2 } from "lucide-react";
import { FragmentationFormData } from "./multi-step-form";

interface BasicInfoFormProps {
  formData: FragmentationFormData;
  updateFormData: (field: string, value: any) => void;
  onNext: () => void;
}

export default function BasicInfoForm({
  formData,
  updateFormData,
  onNext,
}: BasicInfoFormProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(
    formData.images[0] || null
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = (event.target?.result as string) || "";

        setSelectedImage(imageUrl);

        const updatedImages = [...formData.images, imageUrl];
        updateFormData("images", updatedImages);
      };
      reader.readAsDataURL(file);
    }
  };

  // Check that each required field is not empty.
  // Adjust the conditions as needed.
  const isFormValid =
    formData.scale.trim() !== "" &&
    formData.option.trim() !== "" &&
    formData.size.trim() !== "" &&
    formData.location.trim() !== "" &&
    formData.date.trim() !== "" &&
    formData.images.length > 0;

  return (
    <div className="flex flex-col p-6 mt-10 w-full h-screen overflow-y-auto">
      <div className="space-y-6">
        <div className="border border-gray-300 rounded-md p-6 bg-white">
          {selectedImage ? (
            <img
              src={selectedImage}
              alt="Preview"
              className="mx-auto mb-2 h-48 object-contain"
            />
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <div className="text-4xl mb-2">🖼️</div>
              <div>Belum ada gambar</div>
            </div>
          )}

          <div className="flex justify-center mt-4">
            <Label className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-full flex items-center cursor-pointer">
              <span className="mr-2">+</span>
              <span>Upload Gambar</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </Label>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="scale" className="text-lg font-bold">
              Skala
            </Label>
            <Select
              value={formData.scale}
              onValueChange={(value) => updateFormData("scale", value)}
            >
              <SelectTrigger className="w-full bg-white rounded-full mt-1">
                <SelectValue placeholder="Masukkan skala..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Skala Helm">Skala Helm</SelectItem>
                <SelectItem value="Skala Bola">Skala Bola</SelectItem>
                <SelectItem value="Skala Manual">Skala Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="option" className="text-lg font-bold">
              Pilihan
            </Label>
            <Select
              value={formData.option}
              onValueChange={(value) => updateFormData("option", value)}
            >
              <SelectTrigger className="w-full bg-white rounded-full mt-1">
                <SelectValue placeholder="Masukkan pilihan..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cm">Centimeter (cm)</SelectItem>
                <SelectItem value="dm">Decimeter (dm)</SelectItem>
                <SelectItem value="m">Meter (m)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="size" className="text-lg font-bold">
              Ukuran
            </Label>
            <div className="relative">
              <Input
                id="size"
                value={formData.size}
                onChange={(e) => updateFormData("size", e.target.value)}
                placeholder="Masukkan ukuran..."
                className="w-full bg-white rounded-md mt-1 pr-10"
              />
              <Edit2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>

          <div>
            <Label htmlFor="location" className="text-lg font-bold">
              Lokasi
            </Label>
            <div className="relative">
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateFormData("location", e.target.value)}
                placeholder="Masukkan lokasi..."
                className="w-full bg-white rounded-md mt-1 pr-10"
              />
              <Edit2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>
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
