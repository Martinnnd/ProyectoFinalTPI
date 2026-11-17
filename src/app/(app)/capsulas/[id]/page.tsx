import { notFound } from "next/navigation";
import CapsuleDetail from "../../../../components/capsules/CapsuleDetail";

export default async function CapsulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) > 2147483647)
    notFound();
  return <CapsuleDetail id={Number(id)} />;
}
