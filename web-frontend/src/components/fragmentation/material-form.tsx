"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface MaterialFormProps {
  formData: any
  updateFormData: (field: string, value: any) => void
  onNext: () => void
}

export default function MaterialForm({ formData, updateFormData, onNext }: MaterialFormProps) {
  return (
    <div className="flex-1 flex flex-col p-6 mt-10 w-full min-h-[500px]">
      <div className="flex-1 space-y-6">
        <div>
          <Label htmlFor="rockType" className="text-lg font-bold">
            Litologi Batuan
          </Label>
          <Select value={formData.rockType} onValueChange={(value) => updateFormData("rockType", value)}>
            <SelectTrigger className="w-full bg-white rounded-full mt-1">
              <SelectValue placeholder="Masukkan jenis..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Amonium Nitrat">Amonium Nitrat</SelectItem>
              <SelectItem value="Batuan Beku">Batuan Beku</SelectItem>
              <SelectItem value="Batuan Sedimen">Batuan Sedimen</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-lg font-bold">Amonium Nitrat</Label>
          <Input
            value={formData.ammoniumNitrate}
            onChange={(e) => updateFormData("ammoniumNitrate", e.target.value)}
            placeholder="Masukkan jumlah..."
            className="w-full bg-white rounded-md mt-1"
          />
        </div>

        <div>
          <Label className="text-lg font-bold">Volume Blasting</Label>
          <Input
            value={formData.blastingVolume}
            onChange={(e) => updateFormData("blastingVolume", e.target.value)}
            placeholder="Masukkan volume..."
            className="w-full bg-white rounded-md mt-1"
          />
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

