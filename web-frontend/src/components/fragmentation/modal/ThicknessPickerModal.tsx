"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ThicknessPickerModalProps {
  initialThickness: number;
  onClose: (thickness: number | null) => void;
}

export default function ThicknessPickerModal({
  initialThickness,
  onClose,
}: ThicknessPickerModalProps) {
  const [thickness, setThickness] = React.useState(initialThickness);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30">
      <Card className="w-full max-w-md border-green-500 border-2 shadow-lg">
        <CardHeader className="bg-green-500 text-white">
          <CardTitle className="text-xl font-semibold">
            Pick Line Thickness
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Slider
              defaultValue={[thickness]}
              max={20}
              min={1}
              step={1}
              onValueChange={(value) => setThickness(value[0])}
              className="py-4"
            />
            <div className="bg-green-100 text-green-800 font-medium text-center py-2 rounded-md">
              {thickness}px
            </div>
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
            onClick={() => onClose(thickness)}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            OK
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
