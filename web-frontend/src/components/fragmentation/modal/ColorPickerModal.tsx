"use client";
import React, { useState } from "react";

interface ColorPickerModalProps {
  initialColor: string;
  onClose: (selectedColor: string) => void;
}

export default function ColorPickerModal({
  initialColor,
  onClose,
}: ColorPickerModalProps) {
  const [color, setColor] = useState(initialColor);
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
        zIndex: 3,
      }}
    >
      <div
        style={{ background: "white", padding: "1rem", borderRadius: "8px" }}
      >
        <h2>Pick a Color</h2>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <div style={{ marginTop: "1rem", textAlign: "right" }}>
          <button
            onClick={() => onClose(color)}
            style={{ marginRight: "0.5rem" }}
          >
            OK
          </button>
          <button onClick={() => onClose(initialColor)}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
