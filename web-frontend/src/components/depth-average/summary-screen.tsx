"use client";

import { useEffect, useState } from "react";
import { Pencil } from 'lucide-react';
import DepthAverageDetailPopup from "./depthAverageDetailPopup";

interface DepthAverageItem {
  id: number;
  imageUri: string | null;
  prioritas: number;
  lokasi: string;
  tanggal: string;
  average: string;
  kedalaman: Record<string, string>;
}

interface SummaryScreenProps {
  onEdit?: (item: DepthAverageItem) => void;
}

export default function SummaryScreen({ onEdit }: SummaryScreenProps) {
  const [data, setData] = useState<DepthAverageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<DepthAverageItem | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("http://localhost:5180/api/DepthAverage");
        const json = await res.json();
        const mapped = json.map((item: any): DepthAverageItem => ({
          id: item.id,
          imageUri: item.imageUri,
          prioritas: item.prioritas,
          lokasi: item.lokasi,
          tanggal: item.tanggal.split("T")[0],
          average: `${item.average} cm`,
          kedalaman: typeof item.kedalaman === "string"
            ? JSON.parse(item.kedalaman)
            : item.kedalaman,
        }));

        setData(mapped);
      } catch (error) {
        console.error("Failed to fetch Depth Average:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCardClick = (item: DepthAverageItem) => {
    console.log("hai")
    setSelectedItem(item);
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  return (
    <div className="pb-10 mt-2">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading depth data...</p>
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-gray-600 text-lg">No depth average data found</p>
            <p className="text-gray-500 mt-2">
              Try adding some data or check your connection
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 mt-4 max-w-5xl mx-auto">
          {data.map((item, index) => (
            <div
              key={item.id}
              className="bg-rose-50 rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleCardClick(item)}
            >
              <div className="p-4">
                <h2 className="text-lg font-bold mb-3">
                  Depth Average {index + 1}
                </h2>

                <div className="flex gap-4 flex-col sm:flex-row">
                  <div className="w-full sm:w-24 h-24 bg-white rounded-lg flex items-center justify-center border border-gray-200 shrink-0">
                    {item.imageUri ? (
                      <img
                        src={item.imageUri || "/placeholder.svg"}
                        alt={`Depth ${index + 1}`}
                        className="object-cover w-full h-full rounded-lg"
                      />
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-300"
                      >
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 text-sm space-y-2 text-gray-500 overflow-hidden">
                    <p className="grid grid-cols-[80px_1fr]">
                      <span className="font-medium">Priority:</span>
                      <span className="truncate">{item.prioritas}</span>
                    </p>
                    <p className="grid grid-cols-[80px_1fr]">
                      <span className="font-medium">Lokasi:</span>
                      <span className="break-words">{item.lokasi}</span>
                    </p>
                    <p className="grid grid-cols-[80px_1fr]">
                      <span className="font-medium">Tanggal:</span>
                      <span className="truncate">{item.tanggal}</span>
                    </p>
                    <p className="grid grid-cols-[80px_1fr]">
                      <span className="font-medium">Average:</span>
                      <span className="truncate">{item.average}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex border-t border-rose-100 mt-2">
                <button 
                  className="flex-1 py-2.5 text-sm font-medium text-green-700 hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEdit) {
                      onEdit(item); // 🔥 Just use callback!
                    }
                  }}
                >
                  <Pencil size={16} />
                  <span>Edit</span>
                </button>
                <div className="w-px bg-rose-100"></div>
                <button 
                  className="flex-1 py-2.5 text-sm font-medium text-green-700 hover:bg-rose-100 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    // View Fragmentation action
                  }}
                >
                  Lihat Fragmentasi
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DepthAverageDetailPopup
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        data={selectedItem}
      />
    </div>
  );
}
