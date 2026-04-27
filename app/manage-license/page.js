import Link from "next/link";
import ManageLicenseClient from "../../components/ManageLicenseClient";

export const metadata = {
  title: "Manage License",
  description: "Manage Study Capture Pro devices with passwordless email OTP."
};

export default function ManageLicensePage() {
  return (
    <main className="min-h-screen bg-ink px-6 py-16 text-mist">
      <div className="mx-auto mb-10 max-w-5xl">
        <Link href="/" className="text-sm font-semibold text-mint">Study Capture</Link>
      </div>
      <ManageLicenseClient />
    </main>
  );
}
