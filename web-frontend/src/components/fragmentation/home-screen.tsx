"use client"

import { Button } from "@/components/ui/button"

interface HomeScreenProps {
  onFragmentasiClick: () => void
}

export default function HomeScreen({ onFragmentasiClick }: HomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-6 p-6 w-full">
      <Button
        onClick={onFragmentasiClick}
        className="w-full max-w-xs bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-md text-lg"
      >
        Fragmentasi
      </Button>

      <Button className="w-full max-w-xs bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-md text-lg">
        Depth Average
      </Button>

      <Button className="w-full max-w-xs bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-md text-lg">
        Bantuan
      </Button>
    </div>
  )
}

