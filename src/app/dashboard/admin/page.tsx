import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
export default async function AdminDashboard() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard/seller");
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome {session.user.name}</p>
      <LogoutButton />
    </div>
  );
}