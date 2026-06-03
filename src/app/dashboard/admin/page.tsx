import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminConsole from "@/components/AdminConsole";

export default async function AdminDashboard() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard/seller");
  }

  return <AdminConsole />;
}