"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ColorPickerModalProps {
  initialColor: string;
  onClose: (selectedColor: string | null) => void;
}

export default function ColorPickerModal({
  initialColor,
  onClose,
}: ColorPickerModalProps) {
  const [color, setColor] = useState(initialColor);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30">
      <Card className="w-full max-w-md border-green-500 border-2 shadow-lg">
        <CardHeader className="bg-green-500 text-white">
          <CardTitle className="text-xl font-semibold">Pick a Color</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-32 h-32 rounded-full border-4 border-white shadow-md"
              style={{ backgroundColor: color }}
            />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-12 cursor-pointer rounded-md"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 bg-gray-50 p-4">
          <Button
            variant="outline"
            onClick={() => onClose(null)}
            className="border-green-500 text-green-700 hover:bg-green-50"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onClose(color)}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            OK
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
