import { PrismaClient, Role, ProductDimension, BaseUnit } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Seed Users
  console.log("Seeding Users...");
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@example.com",
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "seller@example.com" },
    update: {},
    create: {
      name: "Seller",
      email: "seller@example.com",
      password: hashedPassword,
      role: Role.SELLER,
    },
  });

  // 2. Seed Products
  console.log("Seeding Products...");
  const sampleProducts = [
    // Weight-Based Products (Base unit: GRAM)
    {
      name: "Sodium Chloride USP",
      sku: "CHEM-NAC-001",
      description: "High-purity chemical compound for pharmaceutical formulations.",
      dimension: ProductDimension.WEIGHT,
      baseUnit: BaseUnit.GRAM,
      stockQuantity: 15000.0, // 15 kg
      pricePerUnit: 0.12,     // ₹0.12 per gram (₹120/kg)
    },
    {
      name: "Citric Acid Anhydrous",
      sku: "CHEM-CTA-002",
      description: "Dry organic acid used as an acidulant and chelating agent.",
      dimension: ProductDimension.WEIGHT,
      baseUnit: BaseUnit.GRAM,
      stockQuantity: 50000.0, // 50 kg
      pricePerUnit: 0.08,     // ₹0.08 per gram (₹80/kg)
    },
    {
      name: "Magnesium Sulfate Heptahydrate",
      sku: "CHEM-MGS-003",
      description: "Analytical grade epsom salt crystals for mineral balance.",
      dimension: ProductDimension.WEIGHT,
      baseUnit: BaseUnit.GRAM,
      stockQuantity: 8000.0,  // 8 kg
      pricePerUnit: 0.25,     // ₹0.25 per gram (₹250/kg)
    },
    {
      name: "Potassium Hydroxide Pellets",
      sku: "CHEM-KOH-004",
      description: "Caustic potash pellets for laboratory and industrial applications.",
      dimension: ProductDimension.WEIGHT,
      baseUnit: BaseUnit.GRAM,
      stockQuantity: 12500.0, // 12.5 kg
      pricePerUnit: 0.45,     // ₹0.45 per gram (₹450/kg)
    },

    // Volume-Based Products (Base unit: MILLILITER)
    {
      name: "Ethanol 99% Absolute",
      sku: "SOLV-ETH-101",
      description: "Dehydrated absolute laboratory solvent.",
      dimension: ProductDimension.VOLUME,
      baseUnit: BaseUnit.MILLILITER,
      stockQuantity: 25000.0, // 25 Liters
      pricePerUnit: 0.85,     // ₹0.85 per mL (₹850/L)
    },
    {
      name: "Hydrochloric Acid 37%",
      sku: "SOLV-HCL-102",
      description: "Highly corrosive mineral acid solution.",
      dimension: ProductDimension.VOLUME,
      baseUnit: BaseUnit.MILLILITER,
      stockQuantity: 5000.0,  // 5 Liters
      pricePerUnit: 1.50,     // ₹1.50 per mL (₹1500/L)
    },
    {
      name: "Acetone HPLC Grade",
      sku: "SOLV-ACE-103",
      description: "High performance chromatography solvent with low UV background.",
      dimension: ProductDimension.VOLUME,
      baseUnit: BaseUnit.MILLILITER,
      stockQuantity: 18000.0, // 18 Liters
      pricePerUnit: 1.10,     // ₹1.10 per mL (₹1100/L)
    },
    {
      name: "Ultrapure Water (Type I)",
      sku: "SOLV-H2O-104",
      description: "Purified deionized water for analytical chemical applications.",
      dimension: ProductDimension.VOLUME,
      baseUnit: BaseUnit.MILLILITER,
      stockQuantity: 100000.0,// 100 Liters
      pricePerUnit: 0.03,     // ₹0.03 per mL (₹30/L)
    },

    // Count-Based Products (Base unit: ITEM)
    {
      name: "Borosilicate Beaker 250mL",
      sku: "LABQ-BEK-201",
      description: "Heavy duty glassware with graduation markers.",
      dimension: ProductDimension.COUNT,
      baseUnit: BaseUnit.ITEM,
      stockQuantity: 75.0,    // 75 units
      pricePerUnit: 140.0,    // ₹140.00 per item
    },
    {
      name: "Digital Pocket Balance 0.01g",
      sku: "LABQ-BAL-202",
      description: "High precision portable weight scale.",
      dimension: ProductDimension.COUNT,
      baseUnit: BaseUnit.ITEM,
      stockQuantity: 15.0,    // 15 units
      pricePerUnit: 850.0,    // ₹850.00 per item
    },
    {
      name: "Disposable Pipettes 3mL",
      sku: "LABQ-PIP-203",
      description: "Graduated low-density polyethylene pipettes (pack of 500).",
      dimension: ProductDimension.COUNT,
      baseUnit: BaseUnit.ITEM,
      stockQuantity: 50.0,    // 50 packs
      pricePerUnit: 480.0,    // ₹480.00 per pack
    },
    {
      name: "Laboratory Safety Glasses",
      sku: "LABQ-GLS-204",
      description: "Anti-fog protective goggles with side shields.",
      dimension: ProductDimension.COUNT,
      baseUnit: BaseUnit.ITEM,
      stockQuantity: 40.0,    // 40 units
      pricePerUnit: 220.0,    // ₹220.00 per item
    },
  ];

  for (const prod of sampleProducts) {
    await prisma.product.upsert({
      where: { sku: prod.sku },
      update: {
        stockQuantity: prod.stockQuantity,
        pricePerUnit: prod.pricePerUnit,
        description: prod.description,
      },
      create: {
        name: prod.name,
        sku: prod.sku,
        description: prod.description,
        dimension: prod.dimension,
        baseUnit: prod.baseUnit,
        stockQuantity: prod.stockQuantity,
        pricePerUnit: prod.pricePerUnit,
      },
    });
  }

  console.log("Seed completed successfully!");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });