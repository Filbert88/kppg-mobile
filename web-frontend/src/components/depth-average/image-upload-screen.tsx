"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, CheckCircle2, ImagePlus } from "lucide-react";

interface ImageUploadScreenProps {
  image: string | null;
  onImageSelect: (file: File, imageUrl: string, depths: string[]) => void;
  onNext: () => void;
}

export default function ImageUploadScreen({
  image,
  onImageSelect,
  onNext,
}: ImageUploadScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(image);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<"uploading" | "processing" | "completed" | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setPreview(URL.createObjectURL(selectedFile));
    setFile(selectedFile);
  };

  const handleBoxClick = () => {
    if (isLoading) return;
    fileInputRef.current?.click();
  };

  const handleNext = async () => {
    if (!file) return;

    setIsLoading(true);
    setLoadingStage("uploading");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("http://localhost:5180/api/Upload/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.url;

      setLoadingStage("processing");

      const ocrForm = new FormData();
      ocrForm.append("file", file);

      const ocrRes = await fetch("http://localhost:5180/api/ocr", {
        method: "POST",
        body: ocrForm,
      });

      if (!ocrRes.ok) throw new Error("OCR failed");
      const ocrData = await ocrRes.json();
      const ocrResult: Record<string, string> = ocrData.ocr_result;

      const entries = Object.entries(ocrResult)
        .map(([key, value]) => [Number(key), value] as [number, string])
        .sort((a, b) => a[0] - b[0]);

      const depths: string[] = entries.map(([, value]) => value);

      setLoadingStage("completed");

      setTimeout(() => {
        onImageSelect(file, imageUrl, depths);
        setIsLoading(false);
        setLoadingStage(null);
        onNext();
      }, 1000);
    } catch (err) {
      console.error("Upload/OCR failed:", err);
      alert("Failed to upload or process image");
      setIsLoading(false);
      setLoadingStage(null);
    }
  };

  const isFormValid = file !== null && !isLoading;

  return (
    <div className="flex-1 flex flex-col p-6 h-full min-h-[600px] w-full">
      <div className="flex-1 flex items-center justify-center">
        <div
          className={`relative w-72 h-72 border-2 ${
            isLoading ? "border-green-400" : "border-gray-300 border-dashed"
          } rounded-lg flex flex-col items-center justify-center cursor-pointer bg-white overflow-hidden transition-all duration-300 ${
            isLoading ? "shadow-md" : ""
          }`}
          onClick={handleBoxClick}
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className={`w-full h-full object-cover rounded-md ${
                isLoading ? "opacity-40" : "opacity-100"
              } transition-opacity duration-300`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <ImagePlus size={48} className="text-gray-400 mb-2" />
              <div className="text-gray-400 text-center">Masukkan gambar...</div>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-70 flex flex-col items-center justify-center z-10">
              <div className="flex flex-col items-center">
                {loadingStage === "uploading" && (
                  <>
                    <div className="relative">
                      <Loader2 size={48} className="text-green-600 animate-spin" />
                      <Upload
                        size={20}
                        className="text-green-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                      />
                    </div>
                    <p className="mt-4 text-green-700 font-medium">Uploading image...</p>
                    <div className="w-48 h-1.5 bg-gray-200 rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full animate-progress-upload"></div>
                    </div>
                  </>
                )}

                {loadingStage === "processing" && (
                  <>
                    <Loader2 size={48} className="text-green-600 animate-spin" />
                    <p className="mt-4 text-green-700 font-medium">Processing OCR...</p>
                    <div className="w-48 h-1.5 bg-gray-200 rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full animate-progress-ocr"></div>
                    </div>
                  </>
                )}

                {loadingStage === "completed" && (
                  <>
                    <CheckCircle2 size={48} className="text-green-600 animate-bounce-once" />
                    <p className="mt-4 text-green-700 font-medium">Processing complete!</p>
                  </>
                )}
              </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <Button
          onClick={handleNext}
          disabled={!isFormValid}
          className={`${
            isFormValid ? "bg-green-800 hover:bg-green-900" : "bg-gray-400 cursor-not-allowed"
          } text-white font-medium py-2 px-6 rounded-lg`}
        >
          {isLoading ? (
            <span className="flex items-center">
              <Loader2 size={16} className="mr-2 animate-spin" />
              Processing...
            </span>
          ) : (
            "Next"
          )}
        </Button>
      </div>
    </div>
  );
}
