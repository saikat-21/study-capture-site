import ManageLicenseClient from "../../components/ManageLicenseClient";

export const metadata = {
  title: "Manage License",
  description: "Manage Study Capture Pro devices with a passwordless email verification code."
};

export default function ManageLicensePage() {
  return (
    <main className="min-h-screen bg-ink px-6 py-16 text-mist">
      <ManageLicenseClient />
    </main>
  );
}
