import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchUsedPriorities } from "@/lib/function";

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
  const [availablePriorities, setAvailablePriorities] = useState<string[]>([]);

  useEffect(() => {
    const updateAvailablePriorities = async () => {
      if (!date) return;

      const used = await fetchUsedPriorities(date, formType);
      const available: number[] = [];
      let current = 1;

      while (available.length < 10) {
        if (!used.includes(current)) {
          available.push(current);
        }
        current++;
      }

      setAvailablePriorities(available.map(String));
    };

    updateAvailablePriorities();
  }, [date, formType]);

  return (
    <div className="w-full max-w-md flex flex-col p-4 rounded-lg space-y-4 min-h-[600px]">
      <label htmlFor="date" className="block text-lg font-medium">
        {displayLabel}
      </label>
      <input
        type="date"
        id="date"
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        className="w-full p-3 bg-white rounded-full pl-4 pr-10 text-gray-400"
        placeholder="Masukkan tanggal..."
        required
      />

      <div className="flex flex-col">
        <label htmlFor="priority" className="block text-lg font-medium">
          Prioritas
        </label>
        <Select value={priority} onValueChange={onPriorityChange}>
          <SelectTrigger className="w-full p-3 bg-white rounded-full text-gray-400">
            <SelectValue placeholder="Pilih prioritas..." />
          </SelectTrigger>
          <SelectContent>
            {availablePriorities.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
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
