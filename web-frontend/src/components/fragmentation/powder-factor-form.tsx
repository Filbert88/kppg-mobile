"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PowderFactorFormProps {
  formData: any
  updateFormData: (field: string, value: any) => void
  onNext: () => void
}

export default function PowderFactorForm({ formData, updateFormData, onNext }: PowderFactorFormProps) {
  return (
    <div className="flex-1 flex flex-col p-6 mt-10 w-full min-h-[500px]">
      <div className="flex-1 space-y-6">
        <div>
          <Label htmlFor="powderFactor" className="text-lg font-bold">
            Powder Factor
          </Label>
          <Input
            id="powderFactor"
            value={formData.powderFactor}
            onChange={(e) => updateFormData("powderFactor", e.target.value)}
            className="w-full bg-white rounded-md mt-1"
          />
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

