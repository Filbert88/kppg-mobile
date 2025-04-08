"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { useRef, useState } from "react"

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
  const [isUploading, setIsUploading] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    setIsUploading(true)
    try {
      const response = await fetch("http://localhost:5180/api/Upload/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const result = await response.json()
      const imageUrl = result.url 
      onImageUpload(imageUrl)
    } catch (error) {
      console.error("Image upload error:", error)
      alert("Upload gambar gagal.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleBoxClick = () => {
    fileInputRef.current?.click()
  }

  const isFormValid = image !== null && !isUploading

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
              <div className="text-gray-400 text-center">
                {isUploading ? "Mengunggah..." : "Masukkan gambar..."}
              </div>
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
          {isUploading ? "Uploading..." : "Next"}
        </Button>
      </div>
    </div>
  )
}
