import AdminDashboardClient from "../../components/AdminDashboardClient";

export const metadata = {
  title: "Admin Dashboard | Study Capture",
  description: "Study Capture production backend dashboard."
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-ink px-4 py-8 text-mist sm:px-6 lg:px-8">
      <AdminDashboardClient />
    </main>
  );
}
