import { Shapes } from "lucide-react";
import type { BackdropShape } from "./ShaderBackdrop";

type ShapeMenuProps = {
  value: BackdropShape;
  onChange: (value: BackdropShape) => void;
};

export function ShapeMenu({ value, onChange }: ShapeMenuProps) {
  return (
    <label className="shape-menu">
      <Shapes size={16} aria-hidden="true" />
      <span className="shape-menu-label">Shape</span>
      <select
        aria-label="Background shape"
        value={value}
        onChange={(event) => {
          const next = event.currentTarget.value;
          if (next === "torus" || next === "cube" || next === "pyramid" || next === "duck")
            onChange(next);
        }}
      >
        <option value="torus">Torus</option>
        <option value="cube">Cube</option>
        <option value="pyramid">Pyramid</option>
        <option value="duck">Duck</option>
      </select>
    </label>
  );
}
