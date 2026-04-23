// AsignaturaNode.tsx
import { Handle, Position } from "@xyflow/react";

import AsignaturaCardItem from "./AsignaturaCardItem";

export default function AsignaturaNode({ data }: any) {
  const isActive = data.isActive;

  return (
    <div
      style={{
        transform: isActive ? "scale(1.08)" : "scale(1)",
        zIndex: isActive ? 10 : 1,
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div
        style={{
          boxShadow: isActive
            ? "0 0 0 3px #2563eb, 0 10px 25px rgba(0,0,0,0.2)"
            : "none",
          borderRadius: 16,
        }}
      >
        <AsignaturaCardItem
          asignatura={data.asignatura}
          lineaColor={data.lineaColor}
          onDragStart={() => {}}
          isDragging={false}
          onClick={() => {}}
          onViewSeriacion={data.onViewSeriacion}
        />
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}