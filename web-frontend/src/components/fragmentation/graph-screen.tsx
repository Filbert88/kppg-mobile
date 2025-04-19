"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";

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
  updateFormData: (field: string, value: any) => void;
  onSave: () => void;
  onDiggingTimeClick: () => void;
}

export default function GraphScreen({
  formData,
  updateFormData,
  onSave,
  onDiggingTimeClick,
}: GraphScreenProps) {
  const [updatedResults, setUpdatedResults] = useState(
    formData.finalAnalysisResults || []
  );
  const [uploading, setUploading] = useState(false);
  const hasUploaded = useRef(false);

  useEffect(() => {
    const uploadAllPlots = async () => {
      if (hasUploaded.current) return;
      hasUploaded.current = true;

      setUploading(true);
      const newResults = await Promise.all(
        (formData.finalAnalysisResults || []).map(async (result, index) => {
          if (result.plotFileUrl || !result.plot_image_base64) return result;

          try {
            const blob = dataURLtoBlob(
              `data:image/png;base64,${result.plot_image_base64}`
            );
            const file = new File([blob], `plot_${index}.png`, {
              type: blob.type,
            });
            const formDataUpload = new FormData();
            formDataUpload.append("file", file);

            const res = await fetch("http://localhost:5180/api/Upload/upload", {
              method: "POST",
              body: formDataUpload,
            });

            if (!res.ok) {
              console.error("Upload failed for plot image", res.status);
              return result;
            }

            const data = await res.json();
            return {
              ...result,
              plotFileUrl: data.url,
              plot_image_base64: null,
            };
          } catch (err) {
            console.error("Error uploading plot image:", err);
            return result;
          }
        })
      );

      setUpdatedResults(newResults);
      updateFormData("finalAnalysisResults", newResults);
      setUploading(false);
    };

    uploadAllPlots();
  }, []);

  return (
    <div className="p-4 bg-white w-[70%]">
      <h2 className="text-xl font-bold mb-4">Graph Screen</h2>

      {uploading ? (
        <p className="text-blue-500">Uploading plot images...</p>
      ) : updatedResults.length === 0 ? (
        <p>No final analysis results found.</p>
      ) : (
        formData.finalAnalysisResults.map((result, idx) => {
          const { kuzram, threshold_percentages, plot_image_base64 } = result;

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
                        .sort((a, b) => a.size - b.size)
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
                    src={plot_image_base64}
                    alt={`Plot for result ${idx + 1}`}
                    className="border"
                    style={{ maxWidth: "400px", maxHeight: "300px" }}
                  />
                </div>
              )}
            </div>
          );
        })
      )}

      <div className="flex justify-end space-x-4 mt-4">
        <Button onClick={onDiggingTimeClick} className="bg-blue-600 text-white">
          Digging Time
        </Button>
        <Button onClick={onSave} className="bg-green-800 text-white">
          Save
        </Button>
      </div>
    </div>
  );
}

function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) throw new Error("Invalid data URL");
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}
