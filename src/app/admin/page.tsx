import AdminDashboard from "../../admin/AdminDashboard";
import AdminGate from "../../admin/AdminGate";

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminDashboard />
    </AdminGate>
  );
}
