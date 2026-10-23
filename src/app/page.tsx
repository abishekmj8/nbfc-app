import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";

export default async function Home() {
  const companyCount = await prisma.company.count();
  if (companyCount === 0) {
    redirect("/setup");
  }
  redirect("/dashboard");
}
