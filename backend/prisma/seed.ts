import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set in environment variables.");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Wiping existing database records...");

  // 1. Delete junction/child tables first
  await prisma.productVehicle.deleteMany({});
  await prisma.productAttribute.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.review.deleteMany({});
  
  // 2. Delete parent products
  await prisma.product.deleteMany({});

  // 3. Delete lookup/parent tables
  await prisma.category.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.coupon.deleteMany({});
  
  // 4. Delete user/order/cart related tables
  await prisma.payment.deleteMany({});
  await prisma.shipment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Database wiped clean.");

  // Seeding Brands
  console.log("Seeding Brands...");
  const brandsData = [
    { name: "Toyota Genuine Parts", slug: "toyota-genuine" },
    { name: "Ford Performance", slug: "ford-performance" },
    { name: "BMW M Parts", slug: "bmw-m" },
    { name: "Jeep Performance Parts", slug: "jeep-performance" },
    { name: "Offroad Armor Ltd.", slug: "offroad-armor" },
    { name: "MerchStore Apparel", slug: "merchstore-apparel" },
  ];

  const seededBrands: Record<string, any> = {};
  for (const b of brandsData) {
    const brand = await prisma.brand.create({
      data: b,
    });
    seededBrands[brand.slug] = brand;
  }
  console.log(`Seeded ${Object.keys(seededBrands).length} Brands.`);

  // Seeding Categories & Subcategories
  console.log("Seeding Categories...");
  
  // Parent 1: Car Accessories
  const catCarAccessories = await prisma.category.create({
    data: {
      name: "Car Accessories",
      slug: "car-accessories",
      description: "Premium engineered off-road armor, lighting, and overland systems.",
      isActive: true,
      sortOrder: 1,
    },
  });

  const subCarAccessories = [
    { name: "Recovery Gear", slug: "recovery-gear", description: "Heavy-duty gear engineered to get you out of tight spots on the trail.", parentId: catCarAccessories.id },
    { name: "Lighting & Electrical", slug: "lighting-electrical", description: "Advanced illumination and battery systems built for night expeditions.", parentId: catCarAccessories.id },
    { name: "Armor & Protection", slug: "armor-protection", description: "Rigid steel plates and structural bars designed to guard critical components.", parentId: catCarAccessories.id },
    { name: "Camping & Overland", slug: "camping-overland", description: "Premium fold-out shelters and portable galley equipment for basecamp comfort.", parentId: catCarAccessories.id },
    { name: "Suspension & Wheels", slug: "suspension-wheels", description: "Upgraded geometry, long-travel shocks, and durable off-road wheel sets.", parentId: catCarAccessories.id },
    { name: "Storage & Racks", slug: "storage-racks", description: "Modular platform networks and trunk compartments built to organize supplies.", parentId: catCarAccessories.id },
  ];

  const seededSubCategories: Record<string, any> = {};
  for (const sub of subCarAccessories) {
    const category = await prisma.category.create({
      data: sub,
    });
    seededSubCategories[category.slug] = category;
  }

  // Parent 2: Merchandise
  const catMerchandise = await prisma.category.create({
    data: {
      name: "Merchandise",
      slug: "merchandise",
      description: "Official street fashion, tees, caps, and lifestyle gear.",
      isActive: true,
      sortOrder: 2,
    },
  });

  const subMerchandise = [
    { name: "Apparel", slug: "apparel", description: "Heavyweight hoodies, t-shirts, and windbreakers.", parentId: catMerchandise.id },
    { name: "Caps", slug: "caps", description: "Trucker hats, snapbacks, and beanies.", parentId: catMerchandise.id },
    { name: "Keychains", slug: "keychains", description: "Carbon fiber, leather, and metal branded keychains.", parentId: catMerchandise.id },
    { name: "Collectibles", slug: "collectibles", description: "Stickers, mugs, die-cast models, and flags.", parentId: catMerchandise.id },
  ];

  for (const sub of subMerchandise) {
    const category = await prisma.category.create({
      data: sub,
    });
    seededSubCategories[category.slug] = category;
  }
  console.log("Seeded Categories structure.");

  // Seeding Vehicles
  console.log("Seeding Vehicles...");
  const vehiclesData = [
    { make: "Toyota", model: "Land Cruiser", yearFrom: 2015, yearTo: 2024, bodyType: "SUV", engineType: "Diesel" },
    { make: "Toyota", model: "Tacoma", yearFrom: 2016, yearTo: 2023, bodyType: "Truck", engineType: "Petrol" },
    { make: "Ford", model: "F-150", yearFrom: 2018, yearTo: 2024, bodyType: "Truck", engineType: "Petrol" },
    { make: "BMW", model: "X5", yearFrom: 2019, yearTo: 2024, bodyType: "SUV", engineType: "Hybrid" },
    { make: "Jeep", model: "Wrangler", yearFrom: 2018, yearTo: 2024, bodyType: "SUV", engineType: "Petrol" },
    { make: "Ford", model: "Raptor", yearFrom: 2020, yearTo: 2024, bodyType: "Truck", engineType: "Petrol" },
  ];

  const seededVehicles = [];
  for (const v of vehiclesData) {
    const vehicle = await prisma.vehicle.create({
      data: v,
    });
    seededVehicles.push(vehicle);
  }
  console.log(`Seeded ${seededVehicles.length} Vehicles.`);

  // Seeding Products
  console.log("Seeding Products...");

  const productsData = [
    {
      name: "Stealth Winch Bumper",
      description: "Engineered from high-grade CNC cut steel. Featuring dual recovery shackle tabs, integrated winch platform (up to 12,000 lbs capacity), and cutouts for LED fog lights. Finished in a dual-stage micro-texture powder coat.",
      shortDescription: "Ultra-heavy duty front steel bumper with winch mount.",
      slug: "stealth-winch-bumper",
      price: 1249.99,
      compareAtPrice: 1499.00,
      costPrice: 800.00,
      sku: "STH-FB-01",
      stockQty: 14,
      weight: 42.5,
      productType: "part",
      isActive: true,
      isFeatured: true,
      categoryId: seededSubCategories["armor-protection"].id,
      brandId: seededBrands["offroad-armor"].id,
      images: [
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Material", value: "3/16 inch CNC Steel" },
        { key: "Finish", value: "Textured Black Powder Coat" },
        { key: "Winch Compatibility", value: "Up to 12,000 lbs" }
      ],
      compatibleVehicles: ["Wrangler", "Tacoma", "F-150"]
    },
    {
      name: "Hyper-LED Projector Headlights",
      description: "Upgrade your nighttime vision with these ultra-bright projector LEDs. Delivering 6000 lumens of cool white 6000K light. Features dynamic startup animations, integrated amber sequential turn signals, and a high-impact polycarbonate lens.",
      shortDescription: "6000K LED projector headlights with sequential DRL indicators.",
      slug: "hyper-led-projector-headlights",
      price: 499.00,
      compareAtPrice: 599.00,
      costPrice: 220.00,
      sku: "HYP-LED-09",
      stockQty: 28,
      weight: 6.2,
      productType: "part",
      isActive: true,
      isFeatured: true,
      categoryId: seededSubCategories["lighting-electrical"].id,
      brandId: seededBrands["offroad-armor"].id,
      images: [
        "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Brightness", value: "6000 Lumens" },
        { key: "Color Temperature", value: "6000K Cool White" },
        { key: "Waterproof Rating", value: "IP68" }
      ],
      compatibleVehicles: ["Wrangler", "Land Cruiser"]
    },
    {
      name: "Overland Slim Roof Rack",
      description: "Low-profile, modular roof rack system crafted from premium aerospace aluminum. T-slot crossbars permit seamless mounting of rooftop tents, recovery boards, and jerry cans. Wind deflector included to minimize cabin noise.",
      shortDescription: "Modular aerospace aluminum low-profile roof rack system.",
      slug: "overland-slim-roof-rack",
      price: 899.00,
      compareAtPrice: 999.00,
      costPrice: 500.00,
      sku: "OVL-SR-99",
      stockQty: 8,
      weight: 24.0,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["storage-racks"].id,
      brandId: seededBrands["toyota-genuine"].id,
      images: [
        "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Static Load Capacity", value: "700 lbs" },
        { key: "Dynamic Load Capacity", value: "300 lbs" },
        { key: "Material", value: "Aerospace T6 Aluminum" }
      ],
      compatibleVehicles: ["Land Cruiser", "Tacoma"]
    },
    {
      name: "MerchStore Heavyweight Hoodie",
      description: "Cut from 450gsm ultra-thick brushback cotton fleece. Featuring a double-lined hood, kangaroo pocket, tonal logo embroidery on the chest, and ribbed side panels. Pre-shrunk to fit perfectly for ages.",
      shortDescription: "Limited edition 450gsm heavyweight cotton hoody.",
      slug: "merchstore-heavyweight-hoodie",
      price: 75.00,
      compareAtPrice: 90.00,
      costPrice: 25.00,
      sku: "MS-HD-BLK",
      stockQty: 120,
      weight: 0.9,
      productType: "merch",
      isActive: true,
      isFeatured: true,
      categoryId: seededSubCategories["apparel"].id,
      brandId: seededBrands["merchstore-apparel"].id,
      images: [
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Fabric Weight", value: "450 GSM" },
        { key: "Material", value: "80% Cotton / 20% Polyester" },
        { key: "Fit", value: "Oversized Relaxed" }
      ]
    },
    {
      name: "Forged Carbon Keychain",
      description: "Made from authentic forged carbon fiber composite, giving each piece a completely unique marbled appearance. Fitted with a heavy-duty gunmetal-plated key loop.",
      shortDescription: "Premium lightweight marbled forged carbon key ring.",
      slug: "forged-carbon-keychain",
      price: 19.99,
      compareAtPrice: 29.99,
      costPrice: 5.00,
      sku: "MS-KC-01",
      stockQty: 400,
      weight: 0.05,
      productType: "merch",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["keychains"].id,
      brandId: seededBrands["merchstore-apparel"].id,
      images: [
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Material", value: "100% Forged Carbon Fiber" },
        { key: "Hardware", value: "Gunmetal Stainless Steel" }
      ]
    }
  ];

  for (const p of productsData) {
    const { images, attributes, compatibleVehicles, ...pData } = p;
    
    const createdProduct = await prisma.product.create({
      data: {
        ...pData,
        images: {
          create: images.map((url, idx) => ({
            imageUrl: url,
            isPrimary: idx === 0,
            sortOrder: idx,
          })),
        },
        attributes: {
          create: attributes?.map(attr => ({
            attrKey: attr.key,
            attrValue: attr.value,
          })),
        },
      },
    });

    // Seed vehicle compatibility
    if (compatibleVehicles && compatibleVehicles.length > 0) {
      for (const modelName of compatibleVehicles) {
        const matchingVehicle = seededVehicles.find(v => v.model === modelName);
        if (matchingVehicle) {
          await prisma.productVehicle.create({
            data: {
              productId: createdProduct.id,
              vehicleId: matchingVehicle.id,
            },
          });
        }
      }
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Error seeding database: ", e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
