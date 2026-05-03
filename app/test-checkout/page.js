import TestCheckoutClient from "../../components/TestCheckoutClient";

export const metadata = {
  title: "Test Checkout | Study Capture",
  description: "Temporary Study Capture Pro payment flow test.",
  robots: {
    index: false,
    follow: false
  }
};

export default function TestCheckoutPage() {
  return (
    <main className="min-h-screen bg-ink px-6 py-16 text-mist">
      <TestCheckoutClient />
    </main>
  );
}
