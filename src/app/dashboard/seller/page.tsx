import { auth } from "@/auth";
import LogoutButton from "@/components/LogoutButton";
import { redirect } from "next/navigation";

export default async function SellerDashboard() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "SELLER") {
    redirect("/dashboard/admin");
  }

  return (
    <div>
      <h1>Seller Dashboard</h1>
      <p>Welcome {session.user.name}</p>
      <LogoutButton />
    </div>
  );
}