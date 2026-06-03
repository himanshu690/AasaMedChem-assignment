import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SellerConsole from "@/components/SellerConsole";

export default async function SellerDashboard() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "SELLER") {
    redirect("/dashboard/admin");
  }

  return <SellerConsole />;
}