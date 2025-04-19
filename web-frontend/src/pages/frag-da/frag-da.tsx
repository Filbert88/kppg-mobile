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
      <SummaryScreenFragDA formData={fragmentationData} hideSave />
    </div>
  );
}
