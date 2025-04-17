// DepthAverageDetailPopup.tsx
"use client";

import { useEffect, useRef } from "react";
import { X, MapPin, Calendar, BarChart, Layers, Hash, Star } from 'lucide-react';

interface DepthAverageItem {
  id: number;
  imageUri: string | null;
  prioritas: number;
  lokasi: string;
  tanggal: string;
  average: string;
  kedalaman: Record<string, string>;
}

interface DepthAverageDetailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  data: DepthAverageItem | null;
}

const DepthAverageDetailPopup: React.FC<DepthAverageDetailPopupProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent scrolling when popup is open
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = ""; // Restore scrolling
    };
  }, [isOpen, onClose]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  // Process kedalaman data for display
  const kedalamanItems = Object.entries(data.kedalaman || {})
    .map(([key, value]) => ({
      label: key.replace(/([a-z])(\d+)/i, "$1 $2"), // Add space between text and number
      value: value,
      // Extract number for sorting
      number: parseInt(key.replace(/[^0-9]/g, "") || "0", 10),
    }))
    .sort((a, b) => a.number - b.number);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div 
        ref={popupRef}
        className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col"
      >
        {/* Header */}
        <div className="bg-green-700 px-4 py-3 flex justify-between items-center">
          <h2 className="text-white text-xl font-bold">
            Detail Depth Average
          </h2>
          <button 
            onClick={onClose}
            className="text-white hover:bg-green-600 p-1 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto p-4 md:p-6 flex-1">
          {/* Image */}
          {data.imageUri && (
            <div className="mb-6 flex justify-center">
              <img
                src={data.imageUri || "/placeholder.svg"}
                alt="Depth Average"
                className="rounded-lg max-h-64 object-contain"
              />
            </div>
          )}

          {/* Main info */}
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-3">
              <Star className="text-green-700 mr-2" size={20} />
              <span className="text-green-800 font-bold text-lg">
                Priority: {data.prioritas}
              </span>
            </div>

            <div className="flex items-center mb-3">
              <MapPin className="text-green-700 mr-2" size={20} />
              <span className="text-green-800 font-medium">
                Lokasi: {data.lokasi}
              </span>
            </div>

            <div className="flex items-center mb-3">
              <Calendar className="text-green-700 mr-2" size={20} />
              <span className="text-green-800 font-medium">
                Tanggal: {data.tanggal}
              </span>
            </div>

            <div className="flex items-center">
              <BarChart className="text-green-700 mr-2" size={20} />
              <span className="text-green-800 font-medium">
                Average: {data.average}
              </span>
            </div>
          </div>

          {/* Kedalaman section */}
          <div className="mb-4">
            <div className="flex items-center mb-3">
              <Layers className="text-green-700 mr-2" size={20} />
              <h3 className="text-green-800 font-bold text-lg">
                Kedalaman
              </h3>
            </div>

            {kedalamanItems.length > 0 ? (
              <div className="bg-green-50 rounded-lg overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1">
                  {kedalamanItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between p-3 border-b border-green-100"
                    >
                      <span className="text-green-800 font-medium capitalize">
                        {item.label}
                      </span>
                      <span className="text-green-700">{item.value} cm</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">
                Tidak ada data kedalaman
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepthAverageDetailPopup;