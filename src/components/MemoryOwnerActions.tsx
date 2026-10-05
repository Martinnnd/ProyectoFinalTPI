import { Pencil, X } from "lucide-react";
import type { Memory } from "../types";

export default function MemoryOwnerActions({memory, onEdit, onDelete}: {
  memory: Memory;
  onEdit: (memory: Memory) => void;
  onDelete: (memory: Memory) => void;
}) {
  if (memory.source !== "local") return null;
  return <div className="memory-owner-actions" role="group" aria-label="Opciones de mi recuerdo">
    <button type="button" className="icon-button memory-edit" aria-label="Editar recuerdo" title="Editar recuerdo" onClick={() => onEdit(memory)}><Pencil size={16}/></button>
    <button type="button" className="icon-button memory-delete" aria-label="Eliminar recuerdo" title="Eliminar recuerdo" onClick={() => onDelete(memory)}><X size={17}/></button>
  </div>;
}
