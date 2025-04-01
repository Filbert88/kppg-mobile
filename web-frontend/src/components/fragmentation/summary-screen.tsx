"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SummaryScreenProps {
  formData: any;
  onSave: () => void;
  hideSave?: boolean;
}

export default function SummaryScreen({
  formData,
}: SummaryScreenProps) {
  return (
    <div className="flex-1 flex flex-col p-6 w-full mt-8">
      <div className="flex-1">
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4">Fragmentasi Batuan</h2>

          <div className="flex mb-4">
            <div className="w-1/3">
              <img
                src={formData.images[0] || "/placeholder.svg?height=100&width=100"}
                alt="Rock"
                className="w-24 h-24 object-cover"
              />
            </div>
            <div className="w-2/3">
              <p>
                <span className="font-medium">Lokasi:</span>{" "}
                {formData.location || "......"}
              </p>
              <p>
                <span className="font-medium">Tanggal:</span>{" "}
                {formData.date || "......"}
              </p>
              <p>
                <span className="font-medium">Skala:</span>{" "}
                {formData.scale || "......"}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-medium mb-2">Grafik</h3>
            <div className="border border-gray-200 p-2">
              <img
                src="/placeholder.svg?height=150&width=150"
                alt="Graph"
                className="w-full h-32 object-contain"
              />
            </div>
          </div>

          <div className="mb-4">
            <Select defaultValue="summary">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Lihat Ringkasan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Lihat Ringkasan</SelectItem>
                <SelectItem value="details">Lihat Detail</SelectItem>
                <SelectItem value="analysis">Lihat Analisis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center">
            <Button className="bg-emerald-200 hover:bg-emerald-300 text-black font-medium py-1 px-4 rounded-full flex items-center">
              <span className="mr-1">+</span>
              <span>Tambah Foto</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
