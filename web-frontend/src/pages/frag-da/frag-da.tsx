import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import SummaryScreenFragDA from "./summary-screen-frag-da";
import { ArrowLeft, Filter, Calendar } from "lucide-react";

export default function FilteredFragmentationPage() {
  const { priority, tanggal } = useParams<{
    priority: string;
    tanggal: string;
  }>();
  const [fragmentationData, setFragmentationData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!priority || !tanggal) return;

      try {
        const res = await fetch(
          `http://localhost:5180/api/Fragmentation/today?priority=${priority}&tanggal=${tanggal}`
        );

        if (!res.ok) {
          setFragmentationData([]);
          return;
        }

        const item = await res.json();

        const formatted = [
          {
            id: item.id,
            priority: item.prioritas,
            location: item.lokasi,
            date: item.tanggal,
            scale: item.skala,
            diggingTime: item.diggingTime || "-",
            depthAverage: item.depthAverage || 0,
            results: item.fragmentationImages?.flatMap(
              (img: any, idx: number) =>
                img.fragmentationImageResults?.map((res: any, i: number) => {
                  const threshold = res.result2?.threshold_percentages || {};
                  const sizeDistribution = Object.entries(threshold)
                    .map(([size, percentage]) => ({
                      size: parseFloat(size),
                      percentage: percentage as number,
                    }))
                    .sort((a, b) => a.size - b.size);

                  return {
                    id: `${item.id}-${idx}-${i}`,
                    imageUrl: img.imageUri,
                    kuzram: {
                      P10: res.result2?.kuzram?.P10,
                      P20: res.result2?.kuzram?.P20,
                      X50: res.result2?.kuzram?.X50,
                      P80: res.result2?.kuzram?.P80,
                      P90: res.result2?.kuzram?.P90,
                      percentage_above_60:
                        res.result2?.kuzram?.percentage_above_60,
                      percentage_below_60:
                        res.result2?.kuzram?.percentage_below_60,
                    },
                    topSize: res.result2?.kuzram?.P80,
                    sizeDistribution,
                    graphUrl: res.result2?.plot_image_base64,
                  };
                }) || []
            ),
          },
        ];

        setFragmentationData(formatted);
      } catch (error) {
        console.error("Failed to fetch filtered fragmentation data:", error);
      }
    };

    fetchData();
  }, [priority, tanggal]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="p-4 w-full max-w-5xl">
      <div className="w-full">
        <div className="flex items-center mb-2">
          <button
            className="mr-3 p-2 rounded-full hover:bg-rose-200 transition-colors"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={20} className="text-rose-700" />
          </button>
          <h1 className="text-2xl font-bold text-rose-800">
            Fragmentation Data
          </h1>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center bg-white px-3 py-1.5 rounded-full text-sm shadow-sm">
            <Filter size={16} className="text-rose-600 mr-2" />
            <span className="font-medium text-gray-700">Priority:</span>
            <span className="ml-2 text-rose-700 font-semibold">{priority}</span>
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
      {fragmentationData.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center mt-6">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter size={24} className="text-rose-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No Data Found
          </h3>
          <p className="text-gray-600 mb-4">
            No Fragmentation data with priority {priority} found for the
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
        <SummaryScreenFragDA formData={fragmentationData} hideSave />
      )}
    </div>
  );
}
