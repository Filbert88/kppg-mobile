import { useEffect, useState } from "react";
import SummaryScreen from "./summary-screen";
import { apiUrl } from "@/lib/function";

export default function FragmentationSummaryPage({
  onTambahFoto,
}: {
  onTambahFoto?: (data: any) => void;
}) {
  const [fragmentationData, setFragmentationData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${apiUrl}/Fragmentation`);
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
            option: item.pilihan || "",
            size: item.ukuran || "",
            ammoniumNitrate: item.ammoniumNitrate || "",
            blastingVolume: item.volumeBlasting || "",
            rockType: item.litologi || "Claystone",
            fragmentationImages: item.fragmentationImages ?? [],
            powderFactor: item.powderFactor || "25",
            videoUri: item.videoUri || null,
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
                      .sort((a, b) => b.size - a.size);

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

  return (
    <SummaryScreen formData={fragmentationData} onTambahFoto={onTambahFoto} />
  );
}
