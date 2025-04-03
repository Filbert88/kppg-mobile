"use client";
import React from "react";
interface ThicknessPickerModalProps {
  initialThickness: number;
  onClose: (thickness: number) => void;
}
export default function ThicknessPickerModal({
  initialThickness,
  onClose,
}: ThicknessPickerModalProps) {
  const [thickness, setThickness] = React.useState(initialThickness);
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
        <h2>Pick Line Thickness</h2>
        <input
          type="range"
          min={1}
          max={20}
          value={thickness}
          onChange={(e) => setThickness(Number(e.target.value))}
        />
        <p>{thickness}px</p>
        <div style={{ marginTop: "1rem", textAlign: "right" }}>
          <button
            onClick={() => onClose(thickness)}
            style={{ marginRight: "0.5rem" }}
          >
            OK
          </button>
          <button onClick={() => onClose(initialThickness)}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
