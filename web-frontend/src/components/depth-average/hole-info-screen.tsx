"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2 } from "lucide-react";

interface HoleInfoScreenProps {
  numberOfHoles: string;
  location: string;
  date: string;
  onUpdateNumberOfHoles: (value: string) => void;
  onUpdateLocation: (value: string) => void;
  onNext: () => void;
}

export default function HoleInfoScreen({
  numberOfHoles,
  location,
  date,
  onUpdateNumberOfHoles,
  onUpdateLocation,
  onNext,
}: HoleInfoScreenProps) {
  const isFormValid =
    numberOfHoles.trim() !== "" && location.trim() !== "" && date.trim() !== "";

  return (
    <div className="flex-1 flex flex-col p-6 h-full min-h-[600px] w-full">
      <div className="flex-1 space-y-6 mt-10">
        <div>
          <Label htmlFor="numberOfHoles" className="text-lg font-bold">
            Jumlah Lubang
          </Label>
          <div className="relative">
            <Input
              id="numberOfHoles"
              value={numberOfHoles}
              onChange={(e) => onUpdateNumberOfHoles(e.target.value)}
              placeholder="Masukkan jumlah lubang..."
              className="w-full bg-white rounded-md mt-1 pr-10"
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor="location" className="text-lg font-bold">
            Lokasi
          </Label>
          <div className="relative">
            <Input
              id="location"
              value={location}
              onChange={(e) => onUpdateLocation(e.target.value)}
              placeholder="Masukkan lokasi..."
              className="w-full bg-white rounded-md mt-1 pr-10"
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-4">
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
