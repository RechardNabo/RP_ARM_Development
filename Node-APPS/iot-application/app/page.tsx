import { redirect } from "next/navigation"

export default function Home() {
  // Redirect from root to dashboard
  redirect("/dashboard")
}
