import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Placeholder seed. Real demo data (>= 5 students, 2 programmes, fees, and
  // sample grades) is added in the seed phase once the schema models exist.
  console.log("Seed placeholder — no data to load yet.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
