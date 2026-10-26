"use client";

import { use } from "react";
import dynamic from "next/dynamic";
import { LoaderCircle } from "lucide-react";
import { decodeProfileUsername } from '../../../../profileRoute';

const ProfileView = dynamic(() => import("../../../../components/profile/ProfileView"), {
  ssr: false,
  loading: () => (
    <div className="feed-loading" role="status" style={{ padding: "60px 0" }}>
      <LoaderCircle size={28} className="animate-spin" />
      <span>Cargando perfil…</span>
    </div>
  ),
});

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const resolved = use(params);
  return <ProfileView targetUsername={decodeProfileUsername(resolved.username)} />;
}
