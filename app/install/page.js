import Link from "next/link";
import InstallClient from "../../components/InstallClient";

export const metadata = {
  title: "Install",
  description: "Install Study Capture for Chrome, Edge, Firefox, or Safari."
};

export default function InstallPage() {
  return (
    <main className="min-h-screen bg-ink px-6 py-16 text-mist">
      <div className="mx-auto mb-10 max-w-5xl">
        <Link href="/" className="text-sm font-semibold text-mint">Study Capture</Link>
      </div>
      <InstallClient />
    </main>
  );
}
