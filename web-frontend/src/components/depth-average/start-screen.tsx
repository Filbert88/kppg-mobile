"use client"

import { Button } from "@/components/ui/button"

interface StartScreenProps {
  onNext: () => void
}

export default function StartScreen({ onNext }: StartScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-6">
      <Button
        onClick={onNext}
        className="w-full max-w-xs bg-emerald-200 hover:bg-emerald-300 text-black font-medium py-3 rounded-md text-lg"
      >
        Tambah
      </Button>

      <Button className="w-full max-w-xs bg-emerald-200 hover:bg-emerald-300 text-black font-medium py-3 rounded-md text-lg">
        Riwayat
      </Button>

      <div className="absolute bottom-4 right-4">
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

