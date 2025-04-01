"use client"

import { Button } from "@/components/ui/button"

interface AverageScreenProps {
  average: string
  onSave: () => void
}

export default function AverageScreen({ average, onSave }: AverageScreenProps) {
  return (
    <div className="flex-1 flex flex-col p-6 h-full min-h-[600px] w-full mt-10">
      <div className="flex-1">
        <div>
          <h2 className="text-lg font-bold mb-4">Average</h2>
          <div className="bg-white py-3 px-4 rounded-md text-left">
            <span className="text-lg">{average}</span>
          </div>
        </div>
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
