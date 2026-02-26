import { LoginForm } from "./LoginForm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Login page — entry point for authentication
 * Redirects to dashboard if already logged in
 */
export default async function LoginPage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">ContentFlow</h1>
            <p className="text-slate-600 mt-2">
              Content staging and approval platform
            </p>
          </div>

          <LoginForm />

          <p className="text-xs text-slate-500 text-center mt-6">
            Demo credentials will be set up during initial setup
          </p>
        </div>
      </div>
    </div>
  );
}
