"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit2 } from "lucide-react"

interface BasicInfoFormProps {
  formData: any
  updateFormData: (field: string, value: any) => void
  onNext: () => void
}

export default function BasicInfoForm({ formData, updateFormData, onNext }: BasicInfoFormProps) {
  return (
    <div className="flex-1 flex flex-col p-6 mt-10 w-full">
      <div className="flex-1 space-y-6">
        <div className="border border-gray-300 rounded-md p-6 flex items-center justify-center bg-white">
          <div className="flex flex-col items-center text-gray-400">
            <div className="text-4xl mb-2">🖼️</div>
            <div>Masukkan gambar...</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="scale" className="text-lg font-bold">
              Skala
            </Label>
            <Select value={formData.scale} onValueChange={(value) => updateFormData("scale", value)}>
              <SelectTrigger className="w-full bg-white rounded-full mt-1">
                <SelectValue placeholder="Masukkan skala..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1:100">1:100</SelectItem>
                <SelectItem value="1:200">1:200</SelectItem>
                <SelectItem value="1:500">1:500</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="option" className="text-lg font-bold">
              Pilihan
            </Label>
            <Select value={formData.option} onValueChange={(value) => updateFormData("option", value)}>
              <SelectTrigger className="w-full bg-white rounded-full mt-1">
                <SelectValue placeholder="Masukkan pilihan..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
                <SelectItem value="option3">Option 3</SelectItem>
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

          <div>
            <Label htmlFor="date" className="text-lg font-bold">
              Tanggal
            </Label>
            <div className="relative">
              <Input
                id="date"
                type="text"
                value={formData.date}
                onChange={(e) => updateFormData("date", e.target.value)}
                placeholder="Masukkan tanggal..."
                className="w-full bg-white rounded-md mt-1 pr-10"
              />
              <Edit2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>
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
  )
}

