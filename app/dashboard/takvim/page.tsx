import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFiveYearDate, getRenewalReminderDate, toDateKey } from "@/lib/calendarEvents";
import TakvimView from "@/components/calendar/TakvimView";

async function getEvents(ownerId: string) {
  const tenants = await prisma.tenant.findMany({
    where: { property: { ownerId } },
    select: {
      id: true,
      fullName: true,
      contractStart: true,
      property: { select: { title: true } },
      debts: { select: { dueDate: true } },
    },
  });

  const fiveYearEvents: { date: string; tenantId: string; tenantName: string; propertyTitle: string; contractStart: string }[] = [];
  const renewalEvents: { date: string; tenantId: string; tenantName: string; propertyTitle: string; contractStart: string }[] = [];

  for (const t of tenants) {
    if (t.contractStart) {
      const fiveYear = getFiveYearDate(t.contractStart);
      fiveYearEvents.push({
        date: toDateKey(fiveYear),
        tenantId: t.id,
        tenantName: t.fullName,
        propertyTitle: t.property.title,
        contractStart: t.contractStart.toISOString(),
      });
    }

    const reminder = getRenewalReminderDate(t.debts.map((d) => d.dueDate));
    if (reminder) {
      renewalEvents.push({
        date: toDateKey(reminder),
        tenantId: t.id,
        tenantName: t.fullName,
        propertyTitle: t.property.title,
        contractStart: t.contractStart ? t.contractStart.toISOString() : "",
      });
    }
  }

  return { fiveYearEvents, renewalEvents };
}

export default async function TakvimPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { fiveYearEvents, renewalEvents } = await getEvents(session.userId);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Takvim</h1>
        <p className="text-sm text-slate-500 mt-1">
          Kira tespit davası ve kira artış/borçlandırma tarihlerini takip edin.
        </p>
      </div>
      <TakvimView fiveYearEvents={fiveYearEvents} renewalEvents={renewalEvents} />
    </div>
  );
}
