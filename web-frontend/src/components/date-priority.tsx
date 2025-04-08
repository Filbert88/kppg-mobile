"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DatePriorityProps {
  date: string;
  onDateChange: (newDate: string) => void;
  priority: string;
  onPriorityChange: (newPriority: string) => void;
  onNext: () => void;
  formType: "depthAverage" | "fragmentation";
  label?: string;
  nextLabel?: string;
}

export default function DatePriority({
  date,
  onDateChange,
  priority,
  onPriorityChange,
  onNext,
  formType,
  label,
  nextLabel = "Next",
}: DatePriorityProps) {
  const displayLabel =
    label ||
    (formType === "depthAverage" ? "Tanggal Pengukuran" : "Tanggal Fragmentasi");

  const isFormValid = date !== "" && priority !== "";

  return (
    <div className="w-full max-w-md flex flex-col p-4 rounded-lg space-y-4 min-h-[600px]">
      <label htmlFor="date" className="block text-lg font-medium">
        {displayLabel}
      </label>
      <div>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full p-3 bg-white rounded-full pl-4 pr-10 text-gray-400"
          placeholder="Masukkan tanggal..."
          required
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor="priority" className="block text-lg font-medium">
          Prioritas
        </label>
        <Select value={priority} onValueChange={onPriorityChange}>
          <SelectTrigger className="w-full p-3 bg-white rounded-full text-gray-400">
            <SelectValue placeholder="Pilih prioritas..." />
          </SelectTrigger>
          <SelectContent>
            {[...Array(10)].map((_, index) => (
              <SelectItem key={index + 1} value={(index + 1).toString()}>
                {index + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={onNext}
        disabled={!isFormValid}
        className="absolute bottom-0 right-0 bg-green-700 hover:bg-green-800 text-white rounded-md px-6 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {nextLabel}
      </Button>
    </div>
  );
}
