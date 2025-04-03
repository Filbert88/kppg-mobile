"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { useRef } from "react"

interface ImageUploadScreenProps {
  image: string | null
  onImageUpload: (imageUrl: string) => void
  onNext: () => void
}

export default function ImageUploadScreen({
  image,
  onImageUpload,
  onNext,
}: ImageUploadScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string
        onImageUpload(imageUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBoxClick = () => {
    fileInputRef.current?.click()
  }

  const isFormValid = image !== null

  return (
    <div className="flex-1 flex flex-col p-6 h-full min-h-[600px] w-full">
      <div className="flex-1 flex items-center justify-center">
        <div
          className="w-64 h-64 border-2 border-gray-300 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer bg-white"
          onClick={handleBoxClick}
        >
          {image ? (
            <img
              src={image || "/placeholder.svg"}
              alt="Uploaded"
              className="w-full h-full object-cover rounded-md"
            />
          ) : (
            <>
              <div className="text-4xl mb-2 text-gray-400">🖼️</div>
              <div className="text-gray-400 text-center">Masukkan gambar...</div>
            </>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </div>
      </div>

      <div className="flex justify-end mt-4">
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
  )
}
