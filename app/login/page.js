import AccountClient from "../../components/AccountClient";

export const metadata = {
  title: "Login",
  description: "Login to Study Capture with email OTP."
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-ink px-4 py-8 text-mist sm:px-6 lg:px-8">
      <AccountClient />
    </main>
  );
}
