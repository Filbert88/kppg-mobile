"use client";
import { useState, useEffect, forwardRef, useRef } from "react";
import HybridContainer, { HybridContainerRef } from "./HybridContainer";
import { Tool } from "./canvas";

interface ImageContainerProps {
  backgroundImage: string;
  activeTool: Tool;
  shapeType: "rect" | "circle";
  color: string;
  setActiveTool: (tool: Tool) => void;
  lineThickness: number;
  setDisablePan: (disable: boolean) => void;
  hybridContainerRef?: React.Ref<HybridContainerRef>;
  onHybridRefReady?: (hybridRef: HybridContainerRef | null) => void;
}

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (value: T) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        // Asumsikan ref adalah React.MutableRefObject
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
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
      hybridContainerRef,
      onHybridRefReady,
    },
    ref
  ) => {
    const hasHybridRefTriggered = useRef(false);
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

        const maxWidth = 800;
        const maxHeight = 600;
        const minWidth = 300;

        const aspectRatio = naturalWidth / naturalHeight;

        let displayWidth = naturalWidth;
        let displayHeight = naturalHeight;

        // First, constrain to max size if too large
        if (naturalWidth > maxWidth || naturalHeight > maxHeight) {
          const widthScale = maxWidth / naturalWidth;
          const heightScale = maxHeight / naturalHeight;
          const scale = Math.min(widthScale, heightScale);
          displayWidth = naturalWidth * scale;
          displayHeight = naturalHeight * scale;
        }

        // Then, enforce min width *preserving aspect ratio*
        if (displayWidth < minWidth) {
          displayWidth = minWidth;
          displayHeight = minWidth / aspectRatio;
        }

        setContainerSize({
          width: displayWidth,
          height: displayHeight,
        });

        console.log("Final image container size:", displayWidth, displayHeight);
      };
      img.src = backgroundImage;
    }, [backgroundImage]);

    // useEffect(() => {
    //   // Jika hybridContainerRef sudah tersedia, panggil callback onHybridRefReady
    //   console.log("triggere");
    //   if (!onHybridRefReady) return;

    //   if (
    //     hybridContainerRef &&
    //     typeof hybridContainerRef !== "function" &&
    //     hybridContainerRef.current
    //   ) {
    //     console.log("Href ready");
    //     onHybridRefReady(hybridContainerRef.current);
    //   }
    // }, []);

    // Hanya render ketika containerSize sudah di-set (tidak 0)
    if (containerSize.width === 0 || containerSize.height === 0) {
      return <div>Loading image...</div>;
    }
    
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "transparent",
          width: 800,
          height: 600,
        }}
      >
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
              ref={mergeRefs(hybridContainerRef, (hybridRef) => {
                if (hybridRef && !hasHybridRefTriggered.current) {
                  console.log("HybridContainer sudah siap");
                  if (onHybridRefReady) {
                    console.log("masuk");
                    onHybridRefReady(hybridRef);
                  }
                  hasHybridRefTriggered.current = true;
                }
              })}
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
      </div>
    );
  }
);

ImageContainer.displayName = "ImageContainer";

export default ImageContainer;
