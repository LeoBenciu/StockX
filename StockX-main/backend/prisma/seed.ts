import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ingredients = [
    // ======================
    // ALUAT & BAZĂ
    // ======================
    { name: 'faina', unit: 'g', category: 'bakery' },
    { name: 'drojdie', unit: 'g', category: 'bakery' },
    { name: 'apa', unit: 'ml', category: 'liquids' },
    { name: 'sare', unit: 'g', category: 'spices' },
    { name: 'ulei masline', unit: 'ml', category: 'oil' },
    { name: 'zahar', unit: 'g', category: 'bakery' },
    { name: 'malt', unit: 'g', category: 'bakery' },

    // ======================
    // SOSURI & BAZE
    // ======================
    { name: 'sos rosii', unit: 'g', category: 'sauces' },
    { name: 'rosii decojite', unit: 'g', category: 'vegetables' },
    { name: 'smantana', unit: 'ml', category: 'dairy' },
    { name: 'frisca', unit: 'ml', category: 'dairy' },
    { name: 'pesto', unit: 'g', category: 'sauces' },

    // ======================
    // BRÂNZETURI
    // ======================
    { name: 'mozzarella', unit: 'g', category: 'cheese' },
    { name: 'parmezan', unit: 'g', category: 'cheese' },
    { name: 'grana padano', unit: 'g', category: 'cheese' },
    { name: 'gorgonzola', unit: 'g', category: 'cheese' },
    { name: 'ricotta', unit: 'g', category: 'cheese' },
    { name: 'provolone', unit: 'g', category: 'cheese' },
    { name: 'pecorino', unit: 'g', category: 'cheese' },
    { name: 'cascaval', unit: 'g', category: 'cheese' },
    { name: 'branza', unit: 'g', category: 'cheese' },

    // ======================
    // CĂRNURI & PROTEINE
    // ======================
    { name: 'sunca', unit: 'g', category: 'meat' },
    { name: 'prosciutto cotto', unit: 'g', category: 'meat' },
    { name: 'prosciutto crudo', unit: 'g', category: 'meat' },
    { name: 'salam', unit: 'g', category: 'meat' },
    { name: 'salam picant', unit: 'g', category: 'meat' },
    { name: 'pepperoni', unit: 'g', category: 'meat' },
    { name: 'pancetta', unit: 'g', category: 'meat' },
    { name: 'bacon', unit: 'g', category: 'meat' },
    { name: 'carnati', unit: 'g', category: 'meat' },
    { name: 'pui', unit: 'g', category: 'meat' },
    { name: 'vita', unit: 'g', category: 'meat' },
    { name: 'ton', unit: 'g', category: 'fish' },

    // ======================
    // LEGUME
    // ======================
    { name: 'ciuperci', unit: 'g', category: 'vegetables' },
    { name: 'ardei gras', unit: 'g', category: 'vegetables' },
    { name: 'ceapa', unit: 'g', category: 'vegetables' },
    { name: 'ceapa rosie', unit: 'g', category: 'vegetables' },
    { name: 'masline', unit: 'g', category: 'vegetables' },
    { name: 'porumb', unit: 'g', category: 'vegetables' },
    { name: 'rosii cherry', unit: 'g', category: 'vegetables' },
    { name: 'dovlecel', unit: 'g', category: 'vegetables' },
    { name: 'vinete', unit: 'g', category: 'vegetables' },
    { name: 'spanac', unit: 'g', category: 'vegetables' },
    { name: 'broccoli', unit: 'g', category: 'vegetables' },
    { name: 'rucola', unit: 'g', category: 'vegetables' },
    { name: 'anghinare', unit: 'g', category: 'vegetables' },

    // ======================
    // EXTRA
    // ======================
    { name: 'ananas', unit: 'g', category: 'fruits' },
    { name: 'capere', unit: 'g', category: 'vegetables' },
    { name: 'usturoi', unit: 'g', category: 'vegetables' },
    { name: 'ou', unit: 'pcs', category: 'eggs' },
    { name: 'oua', unit: 'pcs', category: 'eggs' },
    { name: 'porumb dulce', unit: 'g', category: 'vegetables' },
    { name: 'trufe', unit: 'g', category: 'luxury' },
    { name: 'seminte', unit: 'g', category: 'seeds' },
    { name: 'nuci', unit: 'g', category: 'nuts' },

    // ======================
    // CONDIMENTE
    // ======================
    { name: 'busuioc', unit: 'g', category: 'spices' },
    { name: 'oregano', unit: 'g', category: 'spices' },
    { name: 'cimbru', unit: 'g', category: 'spices' },
    { name: 'rozmarin', unit: 'g', category: 'spices' },
    { name: 'fulgi chilli', unit: 'g', category: 'spices' },
    { name: 'piper', unit: 'g', category: 'spices' },
  ];

  for (const ingredient of ingredients) {
    await prisma.ingredient.upsert({
      where: { name: ingredient.name },
      update: {},
      create: ingredient,
    });
  }

  console.log('✔ All pizza ingredients seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
