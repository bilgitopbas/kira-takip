import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeAccessState } from "@/lib/access";
import MizanProView from "@/components/MizanProView";

export default async function MizanProPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const [user, subscription, propertyCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        fullName: true,
        email: true,
        phone: true,
        city: true,
        subscriptionStatus: true,
        trialEndsAt: true,
      },
    }),
    prisma.subscription.findUnique({ where: { userId: session.userId } }),
    prisma.property.count({ where: { ownerId: session.userId } }),
  ]);

  if (!user) redirect("/login");

  const access = computeAccessState(user);

  return (
    <MizanProView
      access={access}
      profile={{
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || "",
        city: user.city || "",
      }}
      currentPropertyCount={propertyCount}
      planPropertyLimit={subscription?.propertyCount || null}
      isActive={user.subscriptionStatus === "ACTIVE"}
    />
  );
}
