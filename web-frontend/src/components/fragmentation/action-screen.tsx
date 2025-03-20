"use client";

import { Button } from "@/components/ui/button";

interface ActionScreenProps {
  onTambahClick: () => void;
  onRiwayatClick: () => void;
}

export default function ActionScreen({
  onTambahClick,
  onRiwayatClick,
}: ActionScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-6 p-6 h-full min-h-[600px] w-full">
      <Button
        onClick={onTambahClick}
        className="w-full max-w-xs bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-md text-lg"
      >
        Tambah
      </Button>

      <Button
        onClick={onRiwayatClick}
        className="w-full max-w-xs bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-md text-lg"
      >
        Riwayat
      </Button>

      <div className="absolute bottom-4 right-4">
        <Button
          onClick={onTambahClick}
          className="bg-green-800 hover:bg-green-900 text-white font-medium py-2 px-6 rounded-lg"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
