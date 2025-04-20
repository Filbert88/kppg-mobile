"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  MapPin,
  Calendar,
  BarChart,
  Layers,
  Star,
  ZoomIn,
} from "lucide-react";

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
  const [zoomOpen, setZoomOpen] = useState(false);

  // Disable scrolling when popup is open
  useEffect(() => {
    if (isOpen || zoomOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, zoomOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (zoomOpen) {
          setZoomOpen(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [zoomOpen, onClose]);

  // Close detail popup when clicking outside (only if zoom not open)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        !zoomOpen &&
        popupRef.current &&
        !popupRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [zoomOpen, onClose]);

  if (!isOpen || !data) return null;

  const kedalamanItems = Object.entries(data.kedalaman || {})
    .map(([key, value]) => ({
      label: key.replace(/([a-z])(\d+)/i, "$1 $2"),
      value,
      number: parseInt(key.replace(/[^0-9]/g, "") || "0", 10),
    }))
    .sort((a, b) => a.number - b.number);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div
          ref={popupRef}
          className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col"
        >
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

          <div className="overflow-y-auto p-4 md:p-6 flex-1">
            {data.imageUri && (
              <div className="mb-6 flex justify-center relative group">
                <img
                  src={data.imageUri}
                  alt="Depth Average"
                  className="rounded-lg max-h-64 object-contain cursor-pointer"
                  onClick={() => setZoomOpen(true)}
                />
                <div className="absolute bottom-2 right-2 bg-black/60 text-white rounded-full p-1 group-hover:opacity-100 opacity-0 transition-opacity">
                  <ZoomIn size={20} />
                </div>
              </div>
            )}

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
            <div className="mb-4">
              <div className="flex items-center mb-3">
                <Layers className="text-green-700 mr-2" size={20} />
                <h3 className="text-green-800 font-bold text-lg">Kedalaman</h3>
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
                <p className="text-gray-500 italic">Tidak ada data kedalaman</p>
              )}
            </div>
          </div>

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
      {zoomOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90">
          <button
            onClick={() => setZoomOpen(false)}
            className="absolute top-4 right-4 z-[1000] text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition"
          >
            <X size={28} />
          </button>
          <img
            src={data.imageUri ?? "/placeholder.svg"}
            alt="Zoomed"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
};

export default DepthAverageDetailPopup;
