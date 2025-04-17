// PixelCanvas.tsx

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
  eraseBetweenPoints: (
    p1: {x: number; y: number},
    p2: {x: number; y: number},
    thickness: number,
  ) => void;
}

interface PixelCanvasProps {
  width: number;
  height: number;
  activeTool: string | null; // "draw", "fill", "erase", etc.
  selectedColor: string; // e.g. "#ff0000"
  lineThickness: number;
}

export function convertHexToRgbaString(hexColor: string): string {
  let hex = hexColor.replace('#', '').trim();

  // Expand short forms: #abc => #aabbccff, #abcd => #aabbccdd
  if (hex.length === 3) {
    // #rgb -> #rrggbb + "ff"
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + 'ff';
  } else if (hex.length === 4) {
    // #rgba -> #rrggbbaa
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  } else if (hex.length === 6) {
    // #rrggbb -> #rrggbbff
    hex += 'ff';
  }
  // Now hex should be 8 digits, "rrggbbaa"
  if (hex.length !== 8) {
    throw new Error(`Invalid hex color: #${hex}`);
  }

  // Parse out components
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const a = parseInt(hex.slice(6, 8), 16) / 255; // convert 0..255 => 0..1

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function SkiaPixelCanvasImpl(
  {width, height, activeTool, selectedColor, lineThickness}: PixelCanvasProps,
  ref: React.Ref<PixelCanvasRef>,
) {
  const RWidth = Math.floor(width);
  const RHeight = Math.floor(height);

  // The RGBA buffer
  const [rgbaData] = useState<Uint8Array>(() => {
    const arr = new Uint8Array(RWidth * RHeight * 4).fill(0); // alpha=0 => transparent
    return arr;
  });

  const [skImage, setSkImage] = useState<ReturnType<
    typeof Skia.Image.MakeImage
  > | null>(null);

  // For "draw" pointer
  const [lastPoint, setLastPoint] = useState<{x: number; y: number} | null>(
    null,
  );

  // On mount, build initial empty image
  useEffect(() => {
    rebuildImage(rgbaData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rebuildImage = (pixels: Uint8Array) => {
    const data = Skia.Data.fromBytes(pixels);
    try {
      const image = Skia.Image.MakeImage(
        {
          width: RWidth,
          height: RHeight,
          colorType: ColorType.RGBA_8888,
          alphaType: AlphaType.Unpremul,
        },
        data,
        RWidth * 4,
      );
      setSkImage(image);
    } catch (err) {
      console.log('MakeImage error:', err);
    }
  };

  // ---------- Drawing strokes ----------
  const drawLineSegmentInRgba = (
    p1: {x: number; y: number},
    p2: {x: number; y: number},
  ) => {
    const colorRGBA = parseCssColorToRGBA(selectedColor);
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(dist * 2);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(p1.x + dx * t);
      const y = Math.round(p1.y + dy * t);
      drawDot(rgbaData, x, y, colorRGBA, lineThickness);
    }
  };

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
            const idx = (py * RWidth + px) * 4;
            data[idx + 0] = color[0];
            data[idx + 1] = color[1];
            data[idx + 2] = color[2];
            data[idx + 3] = color[3]; // 255 => opaque
          }
        }
      }
    }
  }

  // ---------- Erase pixels (alpha=0) ----------
  const eraseLineSegmentInRgba = (
    p1: {x: number; y: number},
    p2: {x: number; y: number},
    thickness: number,
  ) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(dist * 2);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(p1.x + dx * t);
      const y = Math.round(p1.y + dy * t);
      eraseDot(rgbaData, x, y, thickness);
    }
  };

  function eraseDot(
    data: Uint8Array,
    cx: number,
    cy: number,
    diameter: number,
  ) {
    const radius = diameter / 2;
    for (let yy = -radius; yy <= radius; yy++) {
      for (let xx = -radius; xx <= radius; xx++) {
        if (xx * xx + yy * yy <= radius * radius) {
          const px = Math.round(cx + xx);
          const py = Math.round(cy + yy);
          if (px >= 0 && px < RWidth && py >= 0 && py < RHeight) {
            const idx = (py * RWidth + px) * 4;
            // set alpha=0 => erase
            data[idx + 3] = 0;
          }
        }
      }
    }
  }

  function parseCssColorToRGBA2(
    cssColor: string,
  ): [number, number, number, number] {
    let c = cssColor.replace('#', '');
    if (c.length === 3) {
      c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2] + 'FF'; // default to opaque
    } else if (c.length === 6) {
      c += 'FF'; // add alpha if missing
    }

    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const a = parseInt(c.substring(6, 8), 16);

    return [r, g, b, a];
  }

  // ---------- parse color ----------
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

  // ---------- (optional) panResponder for "draw" ----------
  const [lastPointDraw, setLastPointDraw] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: evt => {
          if (activeTool === 'draw') {
            const {locationX, locationY} = evt.nativeEvent;
            setLastPointDraw({x: locationX, y: locationY});
          }
        },
        onPanResponderMove: evt => {
          if (activeTool === 'draw' && lastPointDraw) {
            const {locationX, locationY} = evt.nativeEvent;
            const nextPoint = {x: locationX, y: locationY};
            console.log(selectedColor)
            // If the user picked white, treat it as an erase stroke:
            if (
              selectedColor.toLowerCase() === '#FFFFFF' ||
              selectedColor.toLowerCase() === 'white'
            ) {
              eraseLineSegmentInRgba(lastPointDraw, nextPoint, lineThickness);
            } else {
              drawLineSegmentInRgba(lastPointDraw, nextPoint);
            }

            setLastPointDraw(nextPoint);
            rebuildImage(rgbaData);
          }
        },
        onPanResponderRelease: () => {
          if (activeTool === 'draw') {
            setLastPointDraw(null);
          }
        },
      }),
    [activeTool, lastPointDraw, rgbaData, drawLineSegmentInRgba, rebuildImage],
  );

  // ---------- Imperative handle ----------
  useImperativeHandle(ref, () => ({
    doFloodFill: async (x: number, y: number, fillColor: string) => {
      console.log('flood fill started');
      
      const rgbaColor = convertHexToRgbaString(fillColor)
      const ff = new FloodFill({
        data: rgbaData,
        width: RWidth,
        height: RHeight,
      });
      const tol = fillColor.toLowerCase() === '#FFFFFF' ? 255 : 20;
      ff.fill(rgbaColor, Math.floor(x), Math.floor(y), tol);
      rebuildImage(rgbaData);
    },
    reDrawAllStrokes: () => {
      rebuildImage(rgbaData);
    },
    eraseBetweenPoints: (p1, p2, thickness) => {
      eraseLineSegmentInRgba(p1, p2, thickness);
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
