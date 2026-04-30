import ManageLicenseClient from "../../components/ManageLicenseClient";

export const metadata = {
  title: "Activate Pro",
  description: "Activate Study Capture Pro with a passwordless email verification code."
};

export default function ActivatePage() {
  return (
    <main className="min-h-screen bg-ink px-6 py-16 text-mist">
      <ManageLicenseClient />
    </main>
  );
}
