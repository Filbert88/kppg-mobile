"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader,Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface GraphScreenProps {
  formData: {
    finalAnalysisResults: Array<{
      kuzram?: {
        P10?: number;
        P20?: number;
        P80?: number;
        P90?: number;
        X50?: number;
        percentage_above_60?: number;
        percentage_below_60?: number;
      };
      plot_image_base64?: string | null;
      plotFileUrl?: string;
      threshold_percentages?: Record<string, number>;
    }>;
  };
  onSave: () => void;
  onDiggingTimeClick: () => void;
}

export default function GraphScreen({
  formData,
  onSave,
  onDiggingTimeClick,
}: GraphScreenProps) {
  const [isLoading, setIsLoading] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveClick = async () => {
    setIsLoading(true);
    setIsSaving(true);
    try {
      await onSave();
      toast({
        title: "Data saved",
        description: "Your fragmentation data was saved successfully.",
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Save failed",
        description:
          err instanceof Error ? err.message : "An unknown error occurred.",
      });
    } finally {
      setIsSaving(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white w-[70%]">
      <h2 className="text-xl font-bold mb-4">Graph Screen</h2>

      {formData.finalAnalysisResults.map((result, idx) => {
        const { kuzram, threshold_percentages, plot_image_base64 } = result;
        console.log("url: ", plot_image_base64);
        return (
          <div key={idx} className="border p-4 mb-4 rounded-md">
            <h3 className="font-semibold text-lg">Result {idx + 1}</h3>

            {kuzram && (
              <div className="mt-2">
                <p>
                  <strong>X50</strong>: {kuzram.X50?.toFixed(2) ?? "N/A"} cm
                </p>
                <p>
                  <strong>P10</strong>: {kuzram.P10?.toFixed(2) ?? "N/A"}
                </p>
                <p>
                  <strong>P20</strong>: {kuzram.P20?.toFixed(2) ?? "N/A"}
                </p>
                <p>
                  <strong>P80</strong>: {kuzram.P80?.toFixed(2) ?? "N/A"}
                </p>
                <p>
                  <strong>P90</strong>: {kuzram.P90?.toFixed(2) ?? "N/A"}
                </p>
                <p>
                  <strong>% Above 60</strong>:{" "}
                  {kuzram.percentage_above_60?.toFixed(2) ?? "N/A"}%
                </p>
                <p>
                  <strong>% Below 60</strong>:{" "}
                  {kuzram.percentage_below_60?.toFixed(2) ?? "N/A"}%
                </p>
              </div>
            )}

            {threshold_percentages && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Threshold Percentages</h4>
                <table className="border-collapse">
                  <thead>
                    <tr>
                      <th className="border px-2 py-1">Size (mm)</th>
                      <th className="border px-2 py-1">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(threshold_percentages)
                      .map(([size, perc]) => ({
                        size: parseFloat(size),
                        percentage: Number(perc),
                      }))
                      .sort((a, b) => b.size - a.size)
                      .map(({ size, percentage }) => (
                        <tr key={size}>
                          <td className="border px-2 py-1">
                            {size.toFixed(2)}
                          </td>
                          <td className="border px-2 py-1">
                            {percentage.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {plot_image_base64 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Plot Image</h4>
                <img
                  src={
                    plot_image_base64.startsWith("data:")
                      ? plot_image_base64
                      : plot_image_base64.replace(
                          "http://localhost:5180",
                          import.meta.env.VITE_API_IP.replace(/\/$/, "")
                        )
                  }
                  alt={`Plot for result ${idx + 1}`}
                  className="border"
                  style={{ maxWidth: "400px", maxHeight: "300px" }}
                />
              </div>
            )}
          </div>
        );
      })}

      <div className="flex justify-end space-x-4 mt-4">
        <Button onClick={onDiggingTimeClick} className="bg-blue-600 text-white">
          Digging Time
        </Button>
        <Button
          onClick={handleSaveClick}
          className="bg-green-800 text-white flex items-center"
          disabled={isSaving}
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Simpan"
            )}
        </Button>
      </div>
    </div>
  );
}
