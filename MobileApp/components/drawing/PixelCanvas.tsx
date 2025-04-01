import React, {
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useMemo,
  useEffect,
} from 'react';
import {View, PanResponder, StyleSheet} from 'react-native';
import {
  Canvas,
  Image as SkImageComp,
  ColorType,
  AlphaType,
  Skia,
} from '@shopify/react-native-skia';

import FloodFill from 'q-floodfill';

export interface PixelCanvasRef {
  doFloodFill: (x: number, y: number, fillColor: string) => void;
  reDrawAllStrokes: () => void;
}

interface PixelCanvasProps {
  width: number;
  height: number;
  activeTool: string | null; // "draw", "fill", etc.
  selectedColor: string; // e.g. "#ff0000"
  lineThickness: number;
}

/**
 * SkiaPixelCanvasImpl:
 *
 * 1) We store an RGBA pixel buffer (Uint8Array) of size width×height×4,
 *    initially all alpha=0 => fully transparent background.
 * 2) On pointer moves, we "draw" line segments in that array => updated pixels.
 * 3) We re-create a Skia image with `Skia.Image.MakeImage(...)`.
 * 4) We show that image in a <Canvas>.
 * 5) doFloodFill(...) uses q-floodfill on the RGBA array, then rebuilds the image.
 */
function SkiaPixelCanvasImpl(
  {width, height, activeTool, selectedColor, lineThickness}: PixelCanvasProps,
  ref: React.Ref<PixelCanvasRef>,
) {
  // Round to int
  const RWidth = Math.floor(width);
  const RHeight = Math.floor(height);

  // 1) RGBA pixel buffer with alpha=0 => fully transparent
  const [rgbaData] = useState<Uint8Array>(() => {
    const arr = new Uint8Array(RWidth * RHeight * 4).fill(0);
    return arr;
  });

  // 2) We'll store the current Skia image
  const [skImage, setSkImage] = useState<ReturnType<
    typeof Skia.Image.MakeImage
  > | null>(null);

  // 3) For ephemeral line-drawing, track the last pointer location
  const [lastPoint, setLastPoint] = useState<{x: number; y: number} | null>(
    null,
  );

  // ========== Rebuild the SkImage from RGBA data ==========
  const rebuildImage = (pixels: Uint8Array) => {
    // Create a Skia.Data from the raw pixel array
    const data = Skia.Data.fromBytes(pixels);

    try {
      const image = Skia.Image.MakeImage(
        {
          width: RWidth,
          height: RHeight,
          colorType: ColorType.RGBA_8888,
          alphaType: AlphaType.Unpremul, // unpremultiplied alpha => supports transparency
        },
        data,
        RWidth * 4,
      );
      setSkImage(image);
    } catch (err) {
      console.log('MakeImage error:', err);
    }
  };

  // On mount, build the initial (transparent) image
  useEffect(() => {
    rebuildImage(rgbaData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========== Helper: draw line in RGBA array ==========
  const drawLineSegmentInRgba = (
    p1: {x: number; y: number},
    p2: {x: number; y: number},
  ) => {
    const colorRGBA = parseCssColorToRGBA(selectedColor);
    // Increase sampling steps for smoother line
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // e.g. we do 2 or 3 samples per pixel distance for smoother coverage
    const steps = Math.ceil(dist * 2);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(p1.x + dx * t);
      const y = Math.round(p1.y + dy * t);
      drawDot(rgbaData, x, y, colorRGBA, lineThickness);
    }
  };

  // ========== Helper: draw a dot in RGBA array ==========
  function drawDot(
    data: Uint8Array,
    cx: number,
    cy: number,
    color: [number, number, number, number],
    diameter: number,
  ) {
    const radius = diameter / 2;
    for (let yy = -radius; yy <= radius; yy++) {
      for (let xx = -radius; xx <= radius; xx++) {
        const dist2 = xx * xx + yy * yy;
        if (dist2 <= radius * radius) {
          const px = Math.round(cx + xx);
          const py = Math.round(cy + yy);
          if (px >= 0 && px < RWidth && py >= 0 && py < RHeight) {
            const index = (py * RWidth + px) * 4;
            data[index + 0] = color[0]; // R
            data[index + 1] = color[1]; // G
            data[index + 2] = color[2]; // B
            data[index + 3] = color[3]; // A=255 => fully opaque stroke
          }
        }
      }
    }
  }

  // ========== Convert CSS "#RRGGBB" => [r,g,b,a=255] ==========
  function parseCssColorToRGBA(
    cssColor: string,
  ): [number, number, number, number] {
    let c = cssColor.replace('#', '');
    if (c.length === 3) {
      c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    }
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return [r, g, b, 255];
  }

  // ========== PanResponder for pointer events ==========
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: evt => {
          if (activeTool === 'draw') {
            const {locationX, locationY} = evt.nativeEvent;
            setLastPoint({x: locationX, y: locationY});
          }
        },
        onPanResponderMove: evt => {
          if (activeTool === 'draw' && lastPoint) {
            const {locationX, locationY} = evt.nativeEvent;
            // 1) Draw line in RGBA
            drawLineSegmentInRgba(lastPoint, {x: locationX, y: locationY});
            // 2) Update lastPoint
            setLastPoint({x: locationX, y: locationY});
            // 3) Rebuild the image => show stroke
            rebuildImage(rgbaData);
          }
        },
        onPanResponderRelease: () => {
          if (activeTool === 'draw') {
            setLastPoint(null);
          }
        },
      }),
    [activeTool, lastPoint, rgbaData, drawLineSegmentInRgba, rebuildImage],
  );

  // ========== Imperative Methods ==========
  useImperativeHandle(ref, () => ({
    doFloodFill: async (x: number, y: number, fillColor: string) => {
      // q-floodfill on entire RGBA buffer
      console.log('flood fill started');
      const ff = new FloodFill({
        data: rgbaData,
        width: RWidth,
        height: RHeight,
      });
      ff.fill(fillColor, Math.floor(x), Math.floor(y), 20);
      console.log('flood fill done. Rebuild image next.');
      rebuildImage(rgbaData);
    },
    reDrawAllStrokes: () => {
      // If needed, you can reload from a saved buffer. For now, we just rebuild
      rebuildImage(rgbaData);
    },
  }));

  return (
    <View
      style={[styles.container, {width: RWidth, height: RHeight}]}
      {...panResponder.panHandlers}>
      <Canvas style={{width: RWidth, height: RHeight}}>
        {skImage && (
          <SkImageComp
            image={skImage}
            x={0}
            y={0}
            width={RWidth}
            height={RHeight}
          />
        )}
      </Canvas>
    </View>
  );
}

export default forwardRef(SkiaPixelCanvasImpl);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
