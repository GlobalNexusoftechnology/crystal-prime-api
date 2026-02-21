import { AppDataSource } from "../utils/data-source";
import { Material } from "../entities/material.entity";

async function seedMaterials() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Material);

  const materialsData = [
    {
      size: "4'x4'x8'.6\"",
      prices: {
        Maharashtra: 40000,
        Gujarat: 50000,
        Uttar_Pradesh: 50000,
        Karnataka: 50000,
        West_Bengal: 50000,
        Delhi: 50000,
        Odisha: 50000,
        Goa: 50000,
      },
    },
    {
      size: "4'x5'x8'.6\"",
      prices: {
        Maharashtra: 45000,
        Gujarat: 48000,
        Uttar_Pradesh: 48000,
        Karnataka: 48000,
        West_Bengal: 48000,
        Delhi: 48000,
        Odisha: 48000,
        Goa: 48000,
      },
    },
    {
      size: "4'x6'x8'.6\"",
      prices: {
        Maharashtra: 50000,
        Gujarat: 55000,
        Uttar_Pradesh: 55000,
        Karnataka: 55000,
        West_Bengal: 55000,
        Delhi: 55000,
        Odisha: 55000,
        Goa: 55000,
      },
    },
    {
      size: "5'x5'x8'.6\"",
      prices: {
        Maharashtra: 55000,
        Gujarat: 57000,
        Uttar_Pradesh: 57000,
        Karnataka: 57000,
        West_Bengal: 57000,
        Delhi: 57000,
        Odisha: 57000,
        Goa: 57000,
      },
    },
    {
      size: "5'x6'x8'.6\"",
      prices: {
        Maharashtra: 70000,
        Gujarat: 75000,
        Uttar_Pradesh: 75000,
        Karnataka: 75000,
        West_Bengal: 75000,
        Delhi: 75000,
        Odisha: 75000,
        Goa: 75000,
      },
    },
    {
      size: "5'x7'x8'.6\"",
      prices: {
        Maharashtra: 72000,
        Gujarat: 79000,
        Uttar_Pradesh: 79000,
        Karnataka: 79000,
        West_Bengal: 79000,
        Delhi: 79000,
        Odisha: 79000,
        Goa: 79000,
      },
    },
    {
      size: "5'x8'x8'.6\"",
      prices: {
        Maharashtra: 79000,
        Gujarat: 85000,
        Uttar_Pradesh: 85000,
        Karnataka: 85000,
        West_Bengal: 85000,
        Delhi: 85000,
        Odisha: 85000,
        Goa: 85000,
      },
    },
    {
      size: "6'x6'x8'.6\"",
      prices: {
        Maharashtra: 78000,
        Gujarat: 88500,
        Uttar_Pradesh: 88500,
        Karnataka: 88500,
        West_Bengal: 88500,
        Delhi: 88500,
        Odisha: 88500,
        Goa: 88500,
      },
    },
    {
      size: "6'x8'x8'.6\"",
      prices: {
        Maharashtra: 80000,
        Gujarat: 90000,
        Uttar_Pradesh: 90000,
        Karnataka: 90000,
        West_Bengal: 90000,
        Delhi: 90000,
        Odisha: 90000,
        Goa: 90000,
      },
    },
    {
      size: "6'x10'x8'.6\"",
      prices: {
        Maharashtra: 85000,
        Gujarat: 95000,
        Uttar_Pradesh: 95000,
        Karnataka: 95000,
        West_Bengal: 95000,
        Delhi: 95000,
        Odisha: 95000,
        Goa: 95000,
      },
    },
    {
      size: "8'x10'x8'.6\"",
      prices: {
        Maharashtra: 90000,
        Gujarat: 105000,
        Uttar_Pradesh: 105000,
        Karnataka: 105000,
        West_Bengal: 105000,
        Delhi: 105000,
        Odisha: 105000,
        Goa: 105000,
      },
    },
    {
      size: "8'x12'x8'.6\"",
      prices: {
        Maharashtra: 125000,
        Gujarat: 130000,
        Uttar_Pradesh: 130000,
        Karnataka: 130000,
        West_Bengal: 130000,
        Delhi: 130000,
        Odisha: 130000,
        Goa: 130000,
      },
    },
    {
      size: "8'x20'x8'.6\"",
      prices: {
        Maharashtra: 158000,
        Gujarat: 152000,
        Uttar_Pradesh: 152000,
        Karnataka: 152000,
        West_Bengal: 152000,
        Delhi: 152000,
        Odisha: 152000,
        Goa: 152000,
      },
    },
    {
      size: "10'x10'x8'.6\"",
      prices: {
        Maharashtra: 95000,
        Gujarat: 98000,
        Uttar_Pradesh: 98000,
        Karnataka: 98000,
        West_Bengal: 98000,
        Delhi: 98000,
        Odisha: 98000,
        Goa: 98000,
      },
    },
    {
      size: "10'x12'x8'.6\"",
      prices: {
        Maharashtra: 100000,
        Gujarat: 114000,
        Uttar_Pradesh: 114000,
        Karnataka: 114000,
        West_Bengal: 114000,
        Delhi: 114000,
        Odisha: 114000,
        Goa: 114000,
      },
    },
    {
      size: "10'x14'x8'.6\"",
      prices: {
        Maharashtra: 110000,
        Gujarat: 135000,
        Uttar_Pradesh: 135000,
        Karnataka: 135000,
        West_Bengal: 135000,
        Delhi: 135000,
        Odisha: 135000,
        Goa: 135000,
      },
    },
    {
      size: "10'x15'x8'.6\"",
      prices: {
        Maharashtra: 140000,
        Gujarat: 145000,
        Uttar_Pradesh: 145000,
        Karnataka: 145000,
        West_Bengal: 145000,
        Delhi: 145000,
        Odisha: 145000,
        Goa: 145000,
      },
    },
    {
      size: "10'x16'x8'.6\"",
      prices: {
        Maharashtra: 155000,
        Gujarat: 158000,
        Uttar_Pradesh: 158000,
        Karnataka: 158000,
        West_Bengal: 158000,
        Delhi: 158000,
        Odisha: 158000,
        Goa: 158000,
      },
    },
    {
      size: "10'x20'x8'.6\"",
      prices: {
        Maharashtra: 170000,
        Gujarat: 190000,
        Uttar_Pradesh: 190000,
        Karnataka: 190000,
        West_Bengal: 190000,
        Delhi: 190000,
        Odisha: 190000,
        Goa: 190000,
      },
    },
  ];

  for (const item of materialsData) {
    const exists = await repo.findOne({
      where: { name: item.size, code: "Portable Office Cabin" },
    });

    if (!exists) {
      await repo.save(
        repo.create({
          name: item.size,
          code: "Portable Office Cabin",
          size: item.size,
          active: true,
          state_prices: item.prices,
        }),
      );
    }
  }

  console.log("✅ Materials seeded successfully");
  process.exit(0);
}

seedMaterials().catch((err) => {
  console.error(err);
  process.exit(1);
});
