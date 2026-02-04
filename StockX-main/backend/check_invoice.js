const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      items: true,
    },
  });
  
  console.log('\n📋 Ultimele facturi:');
  invoices.forEach(inv => {
    console.log(`\nFactură: ${inv.fileName}`);
    console.log(`Status: ${inv.status}`);
    console.log(`Articole extrase: ${inv.items.length}`);
    if (inv.items.length > 0) {
      inv.items.forEach(item => {
        console.log(`  - ${item.itemName}: ${item.quantity} ${item.unit}`);
      });
    }
  });
  
  const inventory = await prisma.inventory.findMany({
    include: { ingredient: true },
  });
  
  console.log(`\n📦 Inventar: ${inventory.length} articole`);
  inventory.forEach(inv => {
    console.log(`  - ${inv.ingredient.name}: ${inv.quantity} ${inv.unit}`);
  });
  
  await prisma.$disconnect();
}

check().catch(console.error);
