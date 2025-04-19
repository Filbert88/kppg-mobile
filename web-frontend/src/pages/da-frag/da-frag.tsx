"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Loader2, Filter, Calendar } from "lucide-react";
import DepthAverageDetailPopup from "@/components/depth-average/depthAverageDetailPopup";

interface DepthAverageItem {
  id: number;
  imageUri: string | null;
  prioritas: number;
  lokasi: string;
  tanggal: string;
  average: string;
  kedalaman: Record<string, string>;
}

export default function FilteredDepthAveragePage() {
  const { priority, tanggal } = useParams<{
    priority: string;
    tanggal: string;
  }>();
  const [data, setData] = useState<DepthAverageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<DepthAverageItem | null>(
    null
  );
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useEffect(() => {
    const fetchFilteredData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(
          `http://localhost:5180/api/DepthAverage/today?tanggal=${tanggal}&priority=${priority}`
        );
        if (!res.ok) {
          setData([]);
          return;
        }

        const item = await res.json();
        const mapped: DepthAverageItem = {
          id: item.id,
          imageUri: item.imageUri,
          prioritas: item.prioritas,
          lokasi: item.lokasi,
          tanggal: item.tanggal.split("T")[0],
          average: `${item.average} cm`,
          kedalaman:
            typeof item.kedalaman === "string"
              ? JSON.parse(item.kedalaman)
              : item.kedalaman,
        };

        setData([mapped]);
      } catch (error) {
        console.error("Failed to fetch filtered Depth Average:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (priority && tanggal) {
      fetchFilteredData();
    }
  }, [priority, tanggal]);

  const handleCardClick = (item: DepthAverageItem) => {
    setSelectedItem(item);
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  // For pagination (if we have more data in the future)
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="pb-10 max-w-7xl w-full">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-rose-50 to-rose-100 py-6 px-6 mb-6 shadow-sm">
        <div className="w-full">
          <div className="flex items-center mb-2">
            <button
              className="mr-3 p-2 rounded-full hover:bg-rose-200 transition-colors"
              onClick={() => window.history.back()}
            >
              <ArrowLeft size={20} className="text-rose-700" />
            </button>
            <h1 className="text-2xl font-bold text-rose-800">
              Depth Average Data
            </h1>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center bg-white px-3 py-1.5 rounded-full text-sm shadow-sm">
              <Filter size={16} className="text-rose-600 mr-2" />
              <span className="font-medium text-gray-700">Priority:</span>
              <span className="ml-2 text-rose-700 font-semibold">
                {priority}
              </span>
            </div>

            <div className="flex items-center bg-white px-3 py-1.5 rounded-full text-sm shadow-sm">
              <Calendar size={16} className="text-rose-600 mr-2" />
              <span className="font-medium text-gray-700">Date:</span>
              <span className="ml-2 text-rose-700 font-semibold">
                {tanggal ? formatDate(tanggal) : "Not specified"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="w-full">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 bg-white rounded-xl shadow-sm p-8">
            <Loader2 size={40} className="text-rose-500 animate-spin mb-4" />
            <p className="text-gray-600">Loading depth average data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter size={24} className="text-rose-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Data Found
            </h3>
            <p className="text-gray-600 mb-4">
              No depth average data with priority {priority} found for the
              selected date.
            </p>
            <button
              className="px-4 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors font-medium"
              onClick={() => window.history.back()}
            >
              Go Back
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
              {currentData.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white border border-rose-100 rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all hover:border-rose-300"
                  onClick={() => handleCardClick(item)}
                >
                  <div className="bg-rose-50 py-2 px-4 border-b border-rose-100">
                    <h2 className="text-lg font-bold text-rose-800">
                      Depth Average {startIndex + index + 1}
                    </h2>
                  </div>

                  <div className="p-4">
                    <div className="flex gap-4 flex-col sm:flex-row">
                      <div className="w-full sm:w-24 h-24 bg-rose-50 rounded-lg flex items-center justify-center border border-rose-100 shrink-0">
                        {item.imageUri ? (
                          <img
                            src={item.imageUri || "/placeholder.svg"}
                            alt={`Depth ${index + 1}`}
                            className="object-cover w-full h-full rounded-lg"
                          />
                        ) : (
                          <div className="text-rose-300">No image</div>
                        )}
                      </div>

                      <div className="flex-1 text-sm space-y-2.5 text-gray-500 overflow-hidden">
                        <p className="grid grid-cols-[80px_1fr]">
                          <span className="font-medium text-gray-700">
                            Priority:
                          </span>
                          <span className="truncate">{item.prioritas}</span>
                        </p>
                        <p className="grid grid-cols-[80px_1fr]">
                          <span className="font-medium text-gray-700">
                            Lokasi:
                          </span>
                          <span className="break-words">{item.lokasi}</span>
                        </p>
                        <p className="grid grid-cols-[80px_1fr]">
                          <span className="font-medium text-gray-700">
                            Tanggal:
                          </span>
                          <span className="truncate">
                            {formatDate(item.tanggal)}
                          </span>
                        </p>
                        <p className="grid grid-cols-[80px_1fr]">
                          <span className="font-medium text-gray-700">
                            Average:
                          </span>
                          <span className="truncate font-semibold text-rose-700">
                            {item.average}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex border-t border-rose-100">
                    <button
                      className="flex-1 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(item);
                        setIsPopupOpen(true);
                      }}
                    >
                      <Pencil size={16} />
                      <span>Edit Data</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination - will be useful when there's more data */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === 1
                        ? "bg-rose-50 text-gray-400 cursor-not-allowed"
                        : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                    }`}
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-md ${
                          currentPage === page
                            ? "bg-rose-500 text-white"
                            : "bg-rose-50 text-rose-700 hover:bg-rose-200"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === totalPages
                        ? "bg-rose-50 text-gray-400 cursor-not-allowed"
                        : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                    }`}
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>

      <DepthAverageDetailPopup
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        data={selectedItem}
      />
    </div>
  );
}
