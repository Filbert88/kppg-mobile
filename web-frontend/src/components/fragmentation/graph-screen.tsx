"use client"

import { Button } from "@/components/ui/button"

interface GraphScreenProps {
  formData: any
  onNext: () => void
}

export default function GraphScreen({ formData, onNext }: GraphScreenProps) {
  return (
    <div className="flex-1 flex flex-col p-6 w-full h-full mt-8 pb-24">
      <div className="flex-1 space-y-6">
        <div className="bg-emerald-200 text-center py-2 px-4 rounded-full inline-block">
          <span className="font-medium">Grafik</span>
        </div>

        <div className="border border-gray-300 rounded-md p-4 bg-white">
          <div className="aspect-square w-full relative">
            {/* Placeholder for graph */}
            <div className="absolute inset-0 grid place-items-center">
              <img src="/placeholder.svg?height=300&width=300" alt="Graph" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>

        <div className="bg-emerald-200 text-center py-2 px-4 rounded-full inline-block">
          <span className="font-medium">Ringkasan</span>
        </div>

        <div className="border border-gray-300 rounded-md p-4 bg-white">
          <div className="h-64 overflow-auto">
            <table className="w-full text-sm">
              <tbody>
                {Array.from({ length: 15 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-1">{(i * 10).toFixed(2)}</td>
                    <td className="py-1">{(i * 5 + 10).toFixed(2)}</td>
                    <td className="py-1">{(i * 2 + 5).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 right-4">
        <Button
          onClick={onNext}
          className="bg-green-800 hover:bg-green-900 text-white font-medium py-2 px-6 rounded-none"
        >
          Simpan
        </Button>
      </div>
    </div>
  )
}

