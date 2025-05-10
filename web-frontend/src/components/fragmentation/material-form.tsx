"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MaterialFormProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
  onNext: () => void;
}

export default function MaterialForm({
  formData,
  updateFormData,
  onNext,
}: MaterialFormProps) {
  const handleValueChange = (
    field: "ammoniumNitrate" | "blastingVolume",
    value: string
  ) => {
    updateFormData(field, value);

    const Q =
      field === "ammoniumNitrate"
        ? parseFloat(value)
        : parseFloat(formData.ammoniumNitrate);
    const V =
      field === "blastingVolume"
        ? parseFloat(value)
        : parseFloat(formData.blastingVolume);

    if (!isNaN(Q) && !isNaN(V) && V !== 0) {
      const calculatedPowderFactor = (Q / V).toFixed(2);
      updateFormData("powderFactor", calculatedPowderFactor);
    } else {
      updateFormData("powderFactor", "");
    }
  };
  const isFormValid =
    formData.ammoniumNitrate.trim() !== "" &&
    formData.blastingVolume.trim() !== "";

  return (
    <div className="flex-1 flex flex-col p-6 mt-10 w-full min-h-[500px]">
      <div className="flex-1 space-y-6">
        <div>
          <Label className="text-lg font-bold">Amonium Nitrat</Label>
          <Input
            type="number"
            value={formData.ammoniumNitrate}
            onChange={(e) =>
              handleValueChange("ammoniumNitrate", e.target.value)
            }
            placeholder="Masukkan jumlah..."
            className="w-full bg-white rounded-md mt-1"
          />
        </div>

        <div>
          <Label className="text-lg font-bold">Volume Blasting</Label>
          <Input
            type="number"
            value={formData.blastingVolume}
            onChange={(e) =>
              handleValueChange("blastingVolume", e.target.value)
            }
            placeholder="Masukkan volume..."
            className="w-full bg-white rounded-md mt-1"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={onNext}
          disabled={!isFormValid}
          className={`${
            isFormValid
              ? "bg-green-800 hover:bg-green-900"
              : "bg-gray-400 cursor-not-allowed"
          } text-white font-medium py-2 px-6 rounded-lg`}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
