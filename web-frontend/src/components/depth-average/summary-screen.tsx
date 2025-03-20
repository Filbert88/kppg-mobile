"use client"

import { Button } from "@/components/ui/button"

interface SummaryScreenProps {
  formData: {
    numberOfHoles: string
    location: string
    date: string
    image: string | null
    depths: {
      hole1: string
      hole2: string
      hole3: string
      hole4: string
      hole5: string
    }
    average: string
  }
  onSave: () => void
}

export default function SummaryScreen({ formData, onSave }: SummaryScreenProps) {
  const renderDepthAverage = (id: number) => {
    return (
      <div className="bg-white rounded-lg p-4 mb-4 ">
        <h3 className="font-medium mb-2">Depth Average {id}</h3>
        <div className="flex">
          <div className="w-1/3">
            <div className="w-16 h-16 bg-gray-100 flex items-center justify-center">
              {formData.image ? (
                <img
                  src={formData.image || "/placeholder.svg"}
                  alt={`Depth Average ${id}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400">🖼️</span>
              )}
            </div>
          </div>
          <div className="w-2/3 text-sm">
            <p>
              <span className="font-medium">Lokasi:</span> {formData.location || "........"}
            </p>
            <p>
              <span className="font-medium">Tanggal:</span> {formData.date || "........"}
            </p>
            <p>
              <span className="font-medium">Average:</span> {formData.average || "........"}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-6 h-full min-h-[600px] w-full mt-10">
      <div className="flex-1">
        {renderDepthAverage(1)}
        {renderDepthAverage(2)}
      </div>

      <div className="flex justify-end mt-4">
        <Button
          onClick={onSave}
          className="bg-green-800 hover:bg-green-900 text-white font-medium py-2 px-6 rounded-lg"
        >
          Simpan
        </Button>
      </div>
    </div>
  )
}

