import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./admin.module.css";

export default function Pagination({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (total <= 1) return null;
  return (
    <nav className={styles.pagination} aria-label="Paginación">
      <button disabled={current <= 1} onClick={() => onChange(current - 1)}>
        <ChevronLeft /> Anterior
      </button>
      <span>
        Página <strong>{current}</strong> de {total}
      </span>
      <button disabled={current >= total} onClick={() => onChange(current + 1)}>
        Siguiente <ChevronRight />
      </button>
    </nav>
  );
}
