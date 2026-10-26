"use client";

import dynamic from "next/dynamic";
import { LoaderCircle } from "lucide-react";

const ProfileView = dynamic(() => import("../../../components/profile/ProfileView"), {
  ssr: false,
  loading: () => (
    <div className="feed-loading" role="status" style={{ padding: "60px 0" }}>
      <LoaderCircle size={28} className="animate-spin" />
      <span>Cargando perfil…</span>
    </div>
  ),
});

export default function MyProfilePage() {
  return <ProfileView />;
}
