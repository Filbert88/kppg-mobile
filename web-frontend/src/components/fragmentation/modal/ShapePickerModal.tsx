"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export type ShapeType = "rect" | "circle";

interface ShapePickerModalProps {
  defaultShape: ShapeType;
  onClose: (selectedShape: ShapeType | null) => void;
}

export default function ShapePickerModal({
  defaultShape,
  onClose,
}: ShapePickerModalProps) {
  const [shape, setShape] = React.useState<ShapeType>(defaultShape);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30">
      <Card className="w-full max-w-md border-green-500 border-2 shadow-lg">
        <CardHeader className="bg-green-500 text-white">
          <CardTitle className="text-xl font-semibold">Select Shape</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <RadioGroup
            defaultValue={shape}
            onValueChange={(value : string) => setShape(value as ShapeType)}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="rect"
                id="rect"
                className="text-green-500 border-green-500"
              />
              <Label htmlFor="rect" className="font-medium">
                Rectangle
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="circle"
                id="circle"
                className="text-green-500 border-green-500"
              />
              <Label htmlFor="circle" className="font-medium">
                Circle
              </Label>
            </div>
          </RadioGroup>
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
            onClick={() => onClose(shape)}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            OK
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
