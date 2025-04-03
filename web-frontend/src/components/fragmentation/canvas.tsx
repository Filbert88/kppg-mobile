"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  Pen,
  Eraser,
  Crop as CropIcon,
  PaintBucket,
  Slash,
  ShapesIcon,
} from "lucide-react";
import ImageContainer from "./ImageContainer";
import ColorPickerModal from "./modal/ColorPickerModal";
import ShapePickerModal from "./modal/ShapePickerModal";
import ThicknessPickerModal from "./modal/ThicknessPickerModal";

// Define our tool types.
export type Tool =
  | "none"
  | "draw"
  | "erase"
  | "fill"
  | "crop"
  | "shapes"
  | "line"
  | "zoomIn"
  | "zoomOut";

// For shape creation, the user can choose either rectangle or circle.
export type ShapeType = "rect" | "circle";

export default function CanvasPage() {
  const [activeTool, setActiveTool] = useState<Tool>("none");
  const [chosenColor, setChosenColor] = useState("#000000");
  const [lineThickness, setLineThickness] = useState<number>(3);
  const [shapeType, setShapeType] = useState<ShapeType>("rect");

  // Modal visibility state:
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showShapePicker, setShowShapePicker] = useState(false);
  const [showThicknessPicker, setShowThicknessPicker] = useState(false);

  // Handler for tool selection – also opens modals as needed.
  const handleToolSelect = (tool: Tool) => {
    if (activeTool === tool) {
        // If tool is already active, turn it off
        setActiveTool("none");
        return;
    }
    setActiveTool(tool);
    if (tool === "draw" || tool === "fill") {
      setShowColorPicker(true);
    } else if (tool === "shapes") {
      setShowShapePicker(true);
    } else if (tool === "line") {
      setShowThicknessPicker(true);
    }
  };

  return (
    <div className="flex flex-col p-4">
      {/* Toolbar */}
      <div className="flex justify-center space-x-2 py-2 border-b border-gray-300 mb-4">
        <button
          onClick={() => handleToolSelect("draw")}
          className={`p-2 rounded-md ${
            activeTool === "draw" ? "bg-blue-100" : "hover:bg-gray-100"
          }`}
        >
          <Pen className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleToolSelect("erase")}
          className={`p-2 rounded-md ${
            activeTool === "erase" ? "bg-blue-100" : "hover:bg-gray-100"
          }`}
        >
          <Eraser className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleToolSelect("shapes")}
          className={`p-2 rounded-md ${
            activeTool === "shapes" ? "bg-blue-100" : "hover:bg-gray-100"
          }`}
        >
          <ShapesIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleToolSelect("fill")}
          className={`p-2 rounded-md ${
            activeTool === "fill" ? "bg-blue-100" : "hover:bg-gray-100"
          }`}
        >
          <PaintBucket className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleToolSelect("crop")}
          className={`p-2 rounded-md ${
            activeTool === "crop" ? "bg-blue-100" : "hover:bg-gray-100"
          }`}
        >
          <CropIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleToolSelect("zoomIn")}
          className={`p-2 rounded-md ${
            activeTool === "zoomIn" ? "bg-blue-100" : "hover:bg-gray-100"
          }`}
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleToolSelect("zoomOut")}
          className={`p-2 rounded-md ${
            activeTool === "zoomOut" ? "bg-blue-100" : "hover:bg-gray-100"
          }`}
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleToolSelect("line")}
          className={`p-2 rounded-md ${
            activeTool === "line" ? "bg-blue-100" : "hover:bg-gray-100"
          }`}
        >
          <Slash className="w-5 h-5" />
        </button>
      </div>

      {/* Main drawing area */}
      <ImageContainer
        backgroundImage="https://upload.wikimedia.org/wikipedia/commons/6/63/Biho_Takashi._Bat_Before_the_Moon%2C_ca._1910.jpg"
        activeTool={activeTool}
        shapeType={shapeType}
        color={chosenColor}
        setActiveTool={setActiveTool}
        lineThickness={lineThickness}
      />

      {/* Modals */}
      {showColorPicker && (
        <ColorPickerModal
          initialColor={chosenColor}
          onClose={(newColor : string) => {
            setChosenColor(newColor);
            console.log(newColor)
            setShowColorPicker(false);
          }}
        />
      )}
      {showShapePicker && (
        <ShapePickerModal
          defaultShape={shapeType}
          onClose={(selectedShapeType: ShapeType) => {
            setShapeType(selectedShapeType);
            setShowShapePicker(false);
          }}
        />
      )}
      {showThicknessPicker && (
        <ThicknessPickerModal
          initialThickness={lineThickness}
          onClose={(newThickness: number) => {
            setLineThickness(newThickness);
            setShowThicknessPicker(false);
          }}
        />
      )}
    </div>
  );
}
