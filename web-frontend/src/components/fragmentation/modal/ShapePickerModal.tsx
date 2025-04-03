"use client";
import React from "react";
export type ShapeType = "rect" | "circle";
interface ShapePickerModalProps {
  defaultShape: ShapeType;
  onClose: (selectedShape: ShapeType) => void;
}
export default function ShapePickerModal({
  defaultShape,
  onClose,
}: ShapePickerModalProps) {
  const [shape, setShape] = React.useState<ShapeType>(defaultShape);
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex:3
      }}
    >
      <div
        style={{ background: "white", padding: "1rem", borderRadius: "8px" }}
      >
        <h2>Select Shape</h2>
        <div>
          <label>
            <input
              type="radio"
              value="rect"
              checked={shape === "rect"}
              onChange={() => setShape("rect")}
            />
            Rectangle
          </label>
          <label style={{ marginLeft: "1rem" }}>
            <input
              type="radio"
              value="circle"
              checked={shape === "circle"}
              onChange={() => setShape("circle")}
            />
            Circle
          </label>
        </div>
        <div style={{ marginTop: "1rem", textAlign: "right" }}>
          <button
            onClick={() => onClose(shape)}
            style={{ marginRight: "0.5rem" }}
          >
            OK
          </button>
          <button onClick={() => onClose(defaultShape)}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
