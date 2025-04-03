"use client";
import React, { useState, useEffect } from "react";
import HybridContainer from "./HybridContainer";
import { Tool } from "./canvas";

interface ImageContainerProps {
  backgroundImage: string;
  activeTool: Tool;
  shapeType: "rect" | "circle";
  color: string;
  setActiveTool: (tool: Tool) => void;
  lineThickness: number;
}

export default function ImageContainer({
  backgroundImage,
  activeTool,
  shapeType,
  color,
  setActiveTool,
  lineThickness,
}: ImageContainerProps) {
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  }>({
    width: 600,
    height: 400,
  });

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.naturalHeight / img.naturalWidth;
      const maxWidth = 600;
      const width = Math.min(img.naturalWidth, maxWidth);
      const height = width * aspectRatio;
      setContainerSize({ width, height });
    };
    img.src = backgroundImage;
  }, [backgroundImage]);

  return (
    <div
      style={{
        position: "relative",
        width: containerSize.width,
        height: containerSize.height,
      }}
    >
      <img
        src={backgroundImage}
        alt="Background"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
      <HybridContainer
        width={containerSize.width}
        height={containerSize.height}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        shapeType={shapeType}
        selectedColor={color}
        lineThickness={lineThickness}
      />
    </div>
  );
}
