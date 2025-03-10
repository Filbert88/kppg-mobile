"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Search, ZoomIn, ZoomOut, Move, RotateCw, Scissors, Pen, Link2 } from "lucide-react"

interface ImageUploadFormProps {
  formData: any
  updateFormData: (field: string, value: any) => void
  onNext: () => void
}

export default function ImageUploadForm({ formData, updateFormData, onNext }: ImageUploadFormProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string
        setSelectedImage(imageUrl)

        // Add to images array in formData
        const updatedImages = [...formData.images, imageUrl]
        updateFormData("images", updatedImages)
      }
      reader.readAsDataURL(file)
    }
  }

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
            <img src={selectedImage || "/placeholder.svg"} alt="Uploaded" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <p>No image selected</p>
                <p>Please upload an image</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <label className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-full flex items-center cursor-pointer">
            <span className="mr-2">+</span>
            <span>Tambah Gambar</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>
      </div>

      <div className="absolute -bottom-8 right-4">
        <Button
          onClick={onNext}
          className="bg-green-800 hover:bg-green-900 text-white font-medium py-2 px-6 rounded-none"
        >
          Next
        </Button>
      </div>
    </div>
  )
}

