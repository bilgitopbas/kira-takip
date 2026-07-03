import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "admin@mizanmulkyonetimi.com";
  const plainPassword = "Hst.19121996";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Bu e-posta ile zaten bir kullanıcı var, işlem iptal edildi.");
    return;
  }

  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const trialEndsAt = new Date();
  trialEndsAt.setFullYear(trialEndsAt.getFullYear() + 100);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName: "Sistem Yöneticisi",
      city: "İstanbul",
      role: "ADMIN",
      subscriptionStatus: "ACTIVE",
      trialEndsAt,
    },
  });

  console.log("Admin hesabı oluşturuldu:", email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());