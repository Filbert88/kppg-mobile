"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit2 } from "lucide-react"

interface DepthMeasurementScreenProps {
  depths: {
    hole1: string
    hole2: string
    hole3: string
    hole4: string
    hole5: string
  }
  onUpdateDepth: (hole: string, value: string) => void
  onNext: () => void
}

export default function DepthMeasurementScreen({ depths, onUpdateDepth, onNext }: DepthMeasurementScreenProps) {
  const renderDepthInput = (index: number, holeKey: string) => {
    return (
      <div className="mb-4">
        <Label htmlFor={`depth${index}`} className="text-lg font-bold">
          Kedalaman Lubang ke-{index}
        </Label>
        <div className="relative">
          <Input
            id={`depth${index}`}
            value={depths[holeKey as keyof typeof depths]}
            onChange={(e) => onUpdateDepth(holeKey, e.target.value)}
            placeholder="Masukkan ukuran..."
            className="w-full bg-white rounded-md mt-1 pr-10"
          />
          <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-6 h-full min-h-[600px] w-full mt-10">
      <div className="flex-1 space-y-2">
        {renderDepthInput(1, "hole1")}
        {renderDepthInput(2, "hole2")}
        {renderDepthInput(3, "hole3")}
        {renderDepthInput(4, "hole4")}
        {renderDepthInput(5, "hole5")}
      </div>

      <div className="flex justify-end mt-4">
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

