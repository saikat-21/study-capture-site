import AdminDebugClient from "../../../components/AdminDebugClient";

export const metadata = {
  title: "Admin Debug",
  description: "Founder debug view for Study Capture payments, licenses, and device activations."
};

export default function AdminDebugPage() {
  return (
    <main className="min-h-screen bg-ink px-4 py-8 text-mist sm:px-6 lg:px-8">
      <AdminDebugClient />
    </main>
  );
}
