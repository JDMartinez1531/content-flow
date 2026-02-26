import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Root page — redirects to dashboard if authenticated, login if not
 */
export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
