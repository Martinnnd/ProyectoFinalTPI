import { Suspense } from "react";
import CapsulesView from "../../../components/capsules/CapsulesView";

export default function CapsulesPage() {
  return (
    <Suspense fallback={<p role="status">Preparando cápsulas…</p>}>
      <CapsulesView />
    </Suspense>
  );
}
