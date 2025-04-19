"use client";

import { useEffect, useState } from "react";
import SummaryScreen from "./summary-screen"; // your original component above, renamed

fragmentationImageResults: Array<{
  id: string;
  result1: string; // or remove if not needed
  result2: {
    kuzram: {
      P10: number;
      P20: number;
      P80: number;
      P90: number;
      X50: number;
      percentage_above_60: number;
      percentage_below_60: number;
      sizes: number[];
      distribution: number[];
    };
    plot_image_base64: string;
  };
  result3: string;
  sizeDistributions?: Array<{
    size: number;
    percentage: number;
  }>;
  plotImageUrl?: string;
}>;

export default function FragmentationSummaryPage() {
  const [fragmentationData, setFragmentationData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:5180/api/Fragmentation");
        const rawData = await res.json();

        const formattedData = rawData.map((item: any) => {
          return {
            id: item.id,
            priority: item.prioritas,
            location: item.lokasi,
            date: item.tanggal,
            scale: item.skala,
            diggingTime: item.diggingTime || "-",
            depthAverage: item.depthAverage || 0,
            results:
              item.fragmentationImages?.flatMap(
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
                      graphUrl: res.result2?.plot_image_base64,
                      topSize: res.result2?.kuzram?.top_size,
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
                      sizeDistribution,
                    };
                  }) || []
              ) || [],
          };
        });

        setFragmentationData(formattedData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  return <SummaryScreen formData={fragmentationData} />;
}
