"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, CheckCircle2, ImagePlus } from "lucide-react";

interface ImageUploadScreenProps {
  image: string | null;
  onImageSelect: (file: File, imageUrl: string, depths: string[]) => void;
  onNext: () => void;
  isEdit: boolean;
}

export default function ImageUploadScreen({
  image,
  onImageSelect,
  onNext,
  isEdit,
}: ImageUploadScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(image);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<
    "uploading" | "processing" | "completed" | null
  >(null);

  /* ─────────────────────────────
     Sync preview → state on mount
     ───────────────────────────── */
  useEffect(() => {
    if (image) setPreview(image);
  }, [image]);

  /* ─────────────────────────────
     Handlers
     ───────────────────────────── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setPreview(URL.createObjectURL(selected));
    setFile(selected);
  };

  const handleBoxClick = () => {
    if (!isLoading) fileInputRef.current?.click();
  };

  const handleNext = async () => {
    /* ➜  EDIT‑mode, user tidak meng‑upload gambar baru
       ‑‑> langsung lompat ke step berikut */
    if (isEdit && !file) {
      onNext();
      return;
    }

    /* ➜  Tambah baru / user memilih gambar baru → upload + OCR */
    if (!file) return;           // button seharusnya sudah disabled

    setIsLoading(true);
    setLoadingStage("uploading");

    try {
      /* 1. Upload */
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("http://localhost:5180/api/Upload/upload", {
        method: "POST",
        body: fd,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url: imageUrl } = await uploadRes.json();

      /* 2. OCR */
      setLoadingStage("processing");
      const ocrFd = new FormData();
      ocrFd.append("file", file);
      const ocrRes = await fetch("http://localhost:5180/api/ocr", {
        method: "POST",
        body: ocrFd,
      });
      if (!ocrRes.ok) throw new Error("OCR failed");
      const { ocr_result } = await ocrRes.json();

      const depths: string[] = Object.entries(ocr_result)
      .sort(
        ([a], [b]) =>
          Number(a.replace(/^\D+/g, "")) - Number(b.replace(/^\D+/g, ""))
      )
      .map(([, v]) => v as string);  

      /* 3. Finish */
      setLoadingStage("completed");
      setTimeout(() => {
        onImageSelect(file, imageUrl, depths);
        setIsLoading(false);
        setLoadingStage(null);
        onNext();
      }, 800);
    } catch (err) {
      console.error(err);
      alert("Failed to upload or process image");
      setIsLoading(false);
      setLoadingStage(null);
    }
  };

  /* ─────────────────────────────
     UI helpers
     ───────────────────────────── */
  const isFormValid =
    (!isLoading && !!file) || (isEdit && !!preview && !isLoading);

  return (
    <div className="flex-1 flex flex-col p-6 h-full w-full min-h-[600px]">
      {/* Upload box */}
      <div className="flex-1 flex items-center justify-center">
        <div
          className={`relative w-72 h-72 rounded-lg overflow-hidden cursor-pointer bg-white border-2 ${
            isLoading ? "border-green-400" : "border-gray-300 border-dashed"
          } ${isLoading ? "shadow-md" : ""}`}
          onClick={handleBoxClick}
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className={`w-full h-full object-cover ${
                isLoading ? "opacity-40" : "opacity-100"
              } transition-opacity duration-300`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <ImagePlus size={48} className="text-gray-400 mb-2" />
              <span className="text-gray-400">Masukkan gambar…</span>
            </div>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center z-10">
              {loadingStage === "uploading" && (
                <>
                  <div className="relative">
                    <Loader2 size={48} className="animate-spin text-green-600" />
                    <Upload
                      size={20}
                      className="absolute inset-0 m-auto text-green-600"
                    />
                  </div>
                  <p className="mt-3 text-green-700">Uploading image…</p>
                </>
              )}

              {loadingStage === "processing" && (
                <>
                  <Loader2 size={48} className="animate-spin text-green-600" />
                  <p className="mt-3 text-green-700">Processing OCR…</p>
                </>
              )}

              {loadingStage === "completed" && (
                <>
                  <CheckCircle2
                    size={48}
                    className="text-green-600 animate-bounce"
                  />
                  <p className="mt-3 text-green-700">Done!</p>
                </>
              )}
            </div>
          )}

          {/* Hidden input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Next button */}
      <div className="flex justify-end mt-4">
        <Button
          disabled={!isFormValid}
          onClick={handleNext}
          className={
            isFormValid
              ? "bg-green-800 hover:bg-green-900 text-white"
              : "bg-gray-400 text-white cursor-not-allowed"
          }
        >
          {isLoading ? (
            <span className="flex items-center">
              <Loader2 size={16} className="mr-2 animate-spin" />
              Processing…
            </span>
          ) : (
            "Next"
          )}
        </Button>
      </div>
    </div>
  );
}
