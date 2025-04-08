"use client";
import { useState, useEffect, forwardRef } from "react";
import HybridContainer from "./HybridContainer";
import { Tool } from "./canvas";

interface ImageContainerProps {
  backgroundImage: string;
  activeTool: Tool;
  shapeType: "rect" | "circle";
  color: string;
  setActiveTool: (tool: Tool) => void;
  lineThickness: number;
  setDisablePan: (disable: boolean) => void;
}

const ImageContainer = forwardRef<HTMLDivElement, ImageContainerProps>(
  (
    {
      backgroundImage,
      activeTool,
      shapeType,
      color,
      setActiveTool,
      lineThickness,
      setDisablePan,
    },
    ref
  ) => {
    const [containerSize, setContainerSize] = useState<{
      width: number;
      height: number;
    }>({
      width: 0,
      height: 0,
    });

    useEffect(() => {
      const img = new Image();
      img.onload = () => {
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
        // Define maximum display dimensions
        const maxWidth = 800;
        const maxHeight = 600;
        let displayWidth = naturalWidth;
        let displayHeight = naturalHeight;
        // Calculate scale factor if the image is larger than the maximum allowed
        if (naturalWidth > maxWidth || naturalHeight > maxHeight) {
          const widthScale = maxWidth / naturalWidth;
          const heightScale = maxHeight / naturalHeight;
          const scale = Math.min(widthScale, heightScale);
          displayWidth = naturalWidth * scale;
          displayHeight = naturalHeight * scale;
        }
        setContainerSize({ width: displayWidth, height: displayHeight });
      };
      img.src = backgroundImage;
    }, [backgroundImage]);

    return (
      <div
        ref={ref}
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
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <HybridContainer
            width={containerSize.width}
            height={containerSize.height}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            shapeType={shapeType}
            selectedColor={color}
            lineThickness={lineThickness}
            setDisablePan={setDisablePan}
          />
        </div>
      </div>
    );
  }
);

ImageContainer.displayName = "ImageContainer";

export default ImageContainer;
