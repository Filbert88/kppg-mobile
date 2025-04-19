"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Plus,
  Edit,
  Clock,
  BarChart2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
// Update the interface to support multiple results
interface ResultData {
  id: string;
  imageUrl: string;
  graphUrl: string;
  topSize?: number;
  sizeDistribution?: Array<{
    size: number;
    percentage: number;
  }>;
  kuzram?: {
    P10?: number;
    P20?: number;
    P80?: number;
    P90?: number;
    X50?: number;
    percentage_above_60?: number;
    percentage_below_60?: number;
  };
}

interface FragmentationData {
  id: string;
  priority: string;
  location: string;
  date: string;
  scale: string;
  diggingTime: string;
  depthAverage: number;
  results: ResultData[];
}

interface SummaryScreenProps {
  formData: any;
  onSave?: () => void;
  hideSave?: boolean;
}

export default function SummaryScreen({
  formData,
  onSave,
}: SummaryScreenProps) {
  const fragmentationData: FragmentationData[] = Array.isArray(formData)
    ? formData
    : [];

  const navigate = useNavigate();

  // State for active result in each card
  const [activeResultIndices, setActiveResultIndices] = useState<
    Record<string, number>
  >({});

  // Get active result index for a specific item
  const getActiveResultIndex = (itemId: string) => {
    return activeResultIndices[itemId] || 0;
  };

  // Set active result index for a specific item
  const setActiveResultIndex = (itemId: string, index: number) => {
    setActiveResultIndices((prev) => ({
      ...prev,
      [itemId]: index,
    }));
  };

  // Navigate to next result
  const nextResult = (itemId: string, totalResults: number) => {
    const currentIndex = getActiveResultIndex(itemId);
    const nextIndex = (currentIndex + 1) % totalResults;
    setActiveResultIndex(itemId, nextIndex);
  };

  // Navigate to previous result
  const prevResult = (itemId: string, totalResults: number) => {
    const currentIndex = getActiveResultIndex(itemId);
    const prevIndex = (currentIndex - 1 + totalResults) % totalResults;
    setActiveResultIndex(itemId, prevIndex);
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const totalPages = Math.ceil(fragmentationData.length / itemsPerPage);

  // Get current items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = fragmentationData.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle add photo
  const handleAddPhoto = (id: string) => {
    console.log(`Add photo for item ${id}`);
    // Implement your photo adding logic here
  };

  // Handle view depth average
  const handleViewDepthAverage = (priority: number, tanggal: string) => {
    const formattedDate = tanggal.split("T")[0]; // '2025-04-17'
    navigate(`/da-frag/${priority}/${formattedDate}`);
  };

  // Handle edit
  const handleEdit = (id: string, resultId: string) => {
    console.log(`Edit item ${id}, result ${resultId}`);
    // Implement your edit logic here
  };

  return (
    <div className="flex-1 flex flex-col p-6 w-full mt-8">
      <div className="flex-1">
        <h2 className="text-xl font-bold mb-6">Fragmentasi Batuan</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentItems.map((item) => {
            const activeResultIndex = getActiveResultIndex(item.id);
            const activeResult = item.results[activeResultIndex];
            const hasMultipleResults = item.results.length > 1;

            return (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold">
                      Fragmentasi Batuan {item.id}
                    </h3>
                    {hasMultipleResults && (
                      <div className="text-sm text-gray-500">
                        Result {activeResultIndex + 1}/{item.results.length}
                      </div>
                    )}
                  </div>

                  <div className="flex mb-4">
                    <div className="w-1/3 relative">
                      <div className="relative w-24 h-24">
                        <img
                          src={activeResult.imageUrl || "/placeholder.svg"}
                          alt="Rock"
                          className="w-full h-full object-cover"
                        />
                        {hasMultipleResults && (
                          <div className="absolute inset-0 flex items-center justify-between">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full bg-white/80 shadow-sm"
                              onClick={() =>
                                prevResult(item.id, item.results.length)
                              }
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full bg-white/80 shadow-sm"
                              onClick={() =>
                                nextResult(item.id, item.results.length)
                              }
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-2/3">
                      <p>
                        <span className="font-medium">Priority:</span>{" "}
                        {item.priority}
                      </p>
                      <p>
                        <span className="font-medium">Lokasi:</span>{" "}
                        {item.location}
                      </p>
                      <p>
                        <span className="font-medium">Tanggal:</span>{" "}
                        {item.date}
                      </p>
                      <p>
                        <span className="font-medium">Skala:</span> {item.scale}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Grafik</h3>
                    <div className="border border-gray-200 p-2 relative">
                      <img
                        src={activeResult.graphUrl || "/placeholder.svg"}
                        alt="Graph"
                        className="w-full h-32 object-contain"
                      />
                      {hasMultipleResults && (
                        <div className="absolute inset-0 flex items-center justify-between px-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full bg-white/80 shadow-sm"
                            onClick={() =>
                              prevResult(item.id, item.results.length)
                            }
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full bg-white/80 shadow-sm"
                            onClick={() =>
                              nextResult(item.id, item.results.length)
                            }
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                        >
                          Lihat Ringkasan
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
                            className="h-4 w-4 opacity-50"
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>
                            Ringkasan Fragmentasi Batuan {item.id}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {hasMultipleResults ? (
                            <Tabs
                              defaultValue={`result-${activeResultIndex}`}
                              className="w-full"
                            >
                              <TabsList className="grid grid-cols-2">
                                {item.results.map((result, index) => (
                                  <TabsTrigger
                                    key={result.id}
                                    value={`result-${index}`}
                                  >
                                    Result {index + 1}
                                  </TabsTrigger>
                                ))}
                              </TabsList>
                              {item.results.map((result, index) => (
                                <TabsContent
                                  key={result.id}
                                  value={`result-${index}`}
                                  className="space-y-4"
                                >
                                  {result.kuzram && (
                                    <div className="border rounded-md p-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <h4 className="font-semibold mb-2">
                                            Size Distribution
                                          </h4>
                                          <div className="max-h-60 overflow-y-auto">
                                            <table className="w-full border-collapse">
                                              <thead className="sticky top-0 bg-white">
                                                <tr>
                                                  <th className="border px-2 py-1 text-left">
                                                    Size (mm)
                                                  </th>
                                                  <th className="border px-2 py-1 text-left">
                                                    %
                                                  </th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {result.sizeDistribution?.map(
                                                  (size) => (
                                                    <tr key={size.size}>
                                                      <td className="border px-2 py-1">
                                                        {size.size.toFixed(2)}
                                                      </td>
                                                      <td className="border px-2 py-1">
                                                        {size.percentage.toFixed(
                                                          2
                                                        )}
                                                      </td>
                                                    </tr>
                                                  )
                                                )}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>

                                        <div>
                                          <h4 className="font-semibold mb-2">
                                            Summary Metrics
                                          </h4>
                                          <table className="w-full">
                                            <tbody>
                                              <tr>
                                                <td className="py-1">
                                                  P20 Size (mm)
                                                </td>
                                                <td className="py-1 font-medium">
                                                  {result.kuzram.P20?.toFixed(
                                                    2
                                                  )}
                                                </td>
                                              </tr>
                                              <tr>
                                                <td className="py-1">
                                                  P50 Size (mm)
                                                </td>
                                                <td className="py-1 font-medium">
                                                  {result.kuzram.X50?.toFixed(
                                                    2
                                                  )}
                                                </td>
                                              </tr>
                                              <tr>
                                                <td className="py-1">
                                                  P80 Size (mm)
                                                </td>
                                                <td className="py-1 font-medium">
                                                  {result.kuzram.P80?.toFixed(
                                                    2
                                                  )}
                                                </td>
                                              </tr>
                                              <tr>
                                                <td className="py-1">
                                                  Top Size (mm)
                                                </td>
                                                <td className="py-1 font-medium">
                                                  {result.topSize?.toFixed(2) ||
                                                    "N/A"}
                                                </td>
                                              </tr>
                                            </tbody>
                                          </table>

                                          <div className="mt-4">
                                            <img
                                              src={
                                                result.graphUrl ||
                                                "/placeholder.svg"
                                              }
                                              alt="Graph"
                                              className="w-full h-32 object-contain border"
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex justify-between mt-4">
                                        <Button
                                          variant="outline"
                                          className="flex items-center gap-2"
                                          onClick={() =>
                                            handleEdit(item.id, result.id)
                                          }
                                        >
                                          <Edit className="h-4 w-4" />
                                          Edit
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </TabsContent>
                              ))}
                            </Tabs>
                          ) : (
                            <>
                              {activeResult.kuzram && (
                                <div className="border rounded-md p-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold mb-2">
                                        Size Distribution
                                      </h4>
                                      <div className="max-h-60 overflow-y-auto">
                                        <table className="w-full border-collapse">
                                          <thead className="sticky top-0 bg-white">
                                            <tr>
                                              <th className="border px-2 py-1 text-left">
                                                Size (mm)
                                              </th>
                                              <th className="border px-2 py-1 text-left">
                                                %
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {activeResult.sizeDistribution?.map(
                                              (size) => (
                                                <tr key={size.size}>
                                                  <td className="border px-2 py-1">
                                                    {size.size.toFixed(2)}
                                                  </td>
                                                  <td className="border px-2 py-1">
                                                    {size.percentage.toFixed(2)}
                                                  </td>
                                                </tr>
                                              )
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>

                                    <div>
                                      <h4 className="font-semibold mb-2">
                                        Summary Metrics
                                      </h4>
                                      <table className="w-full">
                                        <tbody>
                                          <tr>
                                            <td className="py-1">
                                              P20 Size (mm)
                                            </td>
                                            <td className="py-1 font-medium">
                                              {activeResult.kuzram.P20?.toFixed(
                                                2
                                              )}
                                            </td>
                                          </tr>
                                          <tr>
                                            <td className="py-1">
                                              P50 Size (mm)
                                            </td>
                                            <td className="py-1 font-medium">
                                              {activeResult.kuzram.X50?.toFixed(
                                                2
                                              )}
                                            </td>
                                          </tr>
                                          <tr>
                                            <td className="py-1">
                                              P80 Size (mm)
                                            </td>
                                            <td className="py-1 font-medium">
                                              {activeResult.kuzram.P80?.toFixed(
                                                2
                                              )}
                                            </td>
                                          </tr>
                                          <tr>
                                            <td className="py-1">
                                              Top Size (mm)
                                            </td>
                                            <td className="py-1 font-medium">
                                              {activeResult.topSize?.toFixed(
                                                2
                                              ) || "N/A"}
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>

                                      <div className="mt-4">
                                        <img
                                          src={
                                            activeResult.graphUrl ||
                                            "/placeholder.svg"
                                          }
                                          alt="Graph"
                                          className="w-full h-32 object-contain border"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex justify-between mt-4">
                                    <Button
                                      variant="outline"
                                      className="flex items-center gap-2"
                                      onClick={() =>
                                        handleEdit(item.id, activeResult.id)
                                      }
                                    >
                                      <Edit className="h-4 w-4" />
                                      Edit
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className="flex items-center gap-2"
                                      onClick={() =>
                                        handleViewDepthAverage(
                                          Number(item.priority),
                                          item.date
                                        )
                                      }
                                    >
                                      <BarChart2 className="h-4 w-4" />
                                      Lihat Depth Average
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Digging Time</span>
                      <span>{item.diggingTime}</span>
                    </div>

                    <Button
                      onClick={() => handleAddPhoto(item.id)}
                      className="bg-emerald-200 hover:bg-emerald-300 text-black font-medium py-1 px-4 rounded-full flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      <span>Tambah Foto</span>
                    </Button>
                  </div>

                  <div className="mt-3">
                    <Button
                      variant="outline"
                      className="w-full bg-teal-100 hover:bg-teal-200 text-black border-teal-300"
                      onClick={() =>
                        handleViewDepthAverage(Number(item.priority), item.date)
                      }
                    >
                      Lihat Depth Average
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) handlePageChange(currentPage - 1);
                    }}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }).map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === index + 1}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(index + 1);
                      }}
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages)
                        handlePageChange(currentPage + 1);
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {onSave && (
        <div className="flex justify-end mt-6">
          <Button onClick={onSave} className="bg-green-800 text-white">
            Save
          </Button>
        </div>
      )}
    </div>
  );
}
