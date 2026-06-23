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
    { name: "Mahindra Genuine Accessories", slug: "mahindra-genuine" },
    { name: "Tata Motors Genuine Accessories", slug: "tata-genuine" },
    { name: "Maruti Suzuki Genuine Parts", slug: "maruti-genuine" },
    { name: "Royal Enfield Official", slug: "royal-enfield-official" },
    { name: "Red Rooster Performance", slug: "red-rooster" },
    { name: "Toyota Genuine Parts", slug: "toyota-genuine" },
    { name: "Hyundai Genuine Accessories", slug: "hyundai-genuine" },
    { name: "Bajaj Genuine Parts", slug: "bajaj-genuine" },
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
    { make: "Mahindra", model: "Thar", yearFrom: 2020, yearTo: 2026, bodyType: "SUV", engineType: "Diesel" },
    { make: "Tata", model: "Nexon", yearFrom: 2017, yearTo: 2026, bodyType: "SUV", engineType: "Petrol" },
    { make: "Maruti Suzuki", model: "Swift", yearFrom: 2018, yearTo: 2026, bodyType: "Hatchback", engineType: "Petrol" },
    { make: "Mahindra", model: "Scorpio-N", yearFrom: 2022, yearTo: 2026, bodyType: "SUV", engineType: "Diesel" },
    { make: "Royal Enfield", model: "Classic 350", yearFrom: 2012, yearTo: 2026, bodyType: "Motorcycle", engineType: "Petrol" },
    { make: "Toyota", model: "Fortuner", yearFrom: 2016, yearTo: 2026, bodyType: "SUV", engineType: "Diesel" },
    { make: "Mahindra", model: "XUV700", yearFrom: 2021, yearTo: 2026, bodyType: "SUV", engineType: "Petrol" },
    { make: "Tata", model: "Harrier", yearFrom: 2019, yearTo: 2026, bodyType: "SUV", engineType: "Diesel" },
    { make: "Maruti Suzuki", model: "Jimny", yearFrom: 2023, yearTo: 2026, bodyType: "SUV", engineType: "Petrol" },
    { make: "Hyundai", model: "Creta", yearFrom: 2015, yearTo: 2026, bodyType: "SUV", engineType: "Petrol" },
    { make: "Bajaj", model: "RE Auto Rickshaw", yearFrom: 2010, yearTo: 2026, bodyType: "Tuk Tuk", engineType: "CNG" },
    { make: "Tata", model: "Safari", yearFrom: 2021, yearTo: 2026, bodyType: "SUV", engineType: "Diesel" }
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
    // === RECOVERY GEAR (5 products) ===
    {
      name: "Thar Heavy-Duty Snorkel",
      description: "Custom-fit off-road snorkel kit designed specifically for the Mahindra Thar. Features high-grade UV-resistant polyethylene construction for maximum engine protection during deep water wading. Provides an elevated air intake to prevent dust and water intake.",
      shortDescription: "UV-resistant polyethylene deep-water wading snorkel for Thar.",
      slug: "thar-heavy-duty-snorkel",
      price: 8500.00,
      compareAtPrice: 9999.00,
      costPrice: 4500.00,
      sku: "REC-SNK-THAR",
      stockQty: 25,
      weight: 4.8,
      productType: "part",
      isActive: true,
      isFeatured: true,
      categoryId: seededSubCategories["recovery-gear"].id,
      brandId: seededBrands["mahindra-genuine"].id,
      images: [
        "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Material", value: "UV-Resistant Linear Low-Density Polyethylene" },
        { key: "Wading Depth Increase", value: "+500mm" },
        { key: "Fitment Type", value: "Direct Bolt-on" }
      ],
      compatibleVehicles: ["Thar"]
    },
    {
      name: "Kinetic Recovery Tow Rope",
      description: "Professional kinetic energy recovery rope with 30% stretch capability. Engineered to absorb shock and smoothly transfer energy for heavy-duty vehicle extractions. Features double-braided nylon with polyurethane coating for exceptional abrasion resistance.",
      shortDescription: "30-foot double-braided kinetic nylon tow rope (12-ton rating).",
      slug: "kinetic-recovery-tow-rope",
      price: 5499.00,
      compareAtPrice: 6500.00,
      costPrice: 2500.00,
      sku: "REC-ROP-KIN",
      stockQty: 50,
      weight: 3.5,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["recovery-gear"].id,
      brandId: seededBrands["red-rooster"].id,
      images: [
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Length", value: "30 feet (9 meters)" },
        { key: "Breaking Strength", value: "28,000 lbs (12.7 Tons)" },
        { key: "Material", value: "Double Braided Nylon" }
      ],
      compatibleVehicles: ["Thar", "Jimny", "Fortuner", "Scorpio-N", "Safari", "Harrier", "XUV700"]
    },
    {
      name: "Heavy-Duty Sand & Mud Traction Boards",
      description: "Engineered high-impact polymer traction boards to get your vehicle out of sand, mud, snow, or sludge. Features reinforced teeth for maximum grip, built-in shovels on both ends, and convenient carrying handles.",
      shortDescription: "Pair of reinforced heavy-duty recovery traction escape boards.",
      slug: "heavy-duty-traction-boards",
      price: 4999.00,
      compareAtPrice: 5999.00,
      costPrice: 2000.00,
      sku: "REC-BRD-TRA",
      stockQty: 40,
      weight: 6.0,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["recovery-gear"].id,
      brandId: seededBrands["red-rooster"].id,
      images: [
        "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Material", value: "High-Grade Engineered Nylon" },
        { key: "Max Load", value: "10 Tons" },
        { key: "Quantity", value: "Set of 2 Boards" }
      ],
      compatibleVehicles: ["Thar", "Jimny", "Fortuner", "Scorpio-N", "Safari", "Harrier", "XUV700", "Nexon", "Creta"]
    },
    {
      name: "Wireless Winch Controller Kit",
      description: "Upgrade your recovery setup with this long-range wireless winch control kit. Works up to 50 feet away, allowing you to guide your vehicle safely from outside the danger zone. Universal compatibility with most 12V winches.",
      shortDescription: "Universal 12V wireless winch remote control kit with receiver.",
      slug: "wireless-winch-controller-kit",
      price: 2999.00,
      compareAtPrice: 3999.00,
      costPrice: 1200.00,
      sku: "REC-WNC-WRL",
      stockQty: 30,
      weight: 0.6,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["recovery-gear"].id,
      brandId: seededBrands["red-rooster"].id,
      images: [
        "https://images.unsplash.com/photo-1562591176-b3337482f7d9?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Range", value: "Up to 50 Feet" },
        { key: "Voltage", value: "12V DC" },
        { key: "Remote Battery", value: "Included (12V 23A)" }
      ],
      compatibleVehicles: ["Thar", "Fortuner", "Jimny", "Scorpio-N"]
    },
    {
      name: "Offroad Recovery Shackle Hook Set",
      description: "Heavy-duty drop-forged alloy steel D-ring bow shackles with carbon steel pins. Perfect for coupling recovery straps, snatch blocks, and winches. Features a durable powder-coated finish to prevent rust.",
      shortDescription: "Pair of heavy-duty 3/4 inch drop-forged bow shackles.",
      slug: "offroad-recovery-shackle-hook-set",
      price: 3499.00,
      compareAtPrice: 4500.00,
      costPrice: 1500.00,
      sku: "REC-SHK-DNG",
      stockQty: 80,
      weight: 2.2,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["recovery-gear"].id,
      brandId: seededBrands["red-rooster"].id,
      images: [
        "https://images.unsplash.com/photo-1469037490029-e47da2f1d538?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Shackle Size", value: "3/4 inch" },
        { key: "Working Load Limit", value: "4.75 Tons" },
        { key: "Finish", value: "Gloss Red Powder Coat" }
      ],
      compatibleVehicles: ["Thar", "Jimny", "Fortuner", "Scorpio-N", "Safari", "Harrier", "XUV700"]
    },

    // === LIGHTING & ELECTRICAL (5 products) ===
    {
      name: "Thar Dual-Projector LED Headlights",
      description: "High-performance retrofitted dual-projector LED headlights for the Mahindra Thar. Integrates a brilliant halo ring DRL and amber sequential turn signal indicators. Emits 8000 lumens of hyper-focused 6000K white light.",
      shortDescription: "Plug-and-play LED projector headlights with sequential DRL for Thar.",
      slug: "thar-dual-projector-led-headlights",
      price: 14500.00,
      compareAtPrice: 18000.00,
      costPrice: 8000.00,
      sku: "LGT-LED-THARHD",
      stockQty: 18,
      weight: 5.4,
      productType: "part",
      isActive: true,
      isFeatured: true,
      categoryId: seededSubCategories["lighting-electrical"].id,
      brandId: seededBrands["mahindra-genuine"].id,
      images: [
        "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Output", value: "8,000 Raw Lumens" },
        { key: "Color Temp", value: "6000K Cool White" },
        { key: "DRL Ring", value: "RGB App Controlled Halo" }
      ],
      compatibleVehicles: ["Thar"]
    },
    {
      name: "Roof-Mounted High-Intensity LED Light Bar",
      description: "Dual-row slim LED light bar providing broad flood and long-distance spot beam coverage. Encased in an IP68 waterproof aluminum casing with heat sink fins. Perfect for high-speed night trail driving.",
      shortDescription: "40-inch 240W dual-row combo beam LED light bar.",
      slug: "roof-mounted-led-light-bar",
      price: 9999.00,
      compareAtPrice: 12500.00,
      costPrice: 4000.00,
      sku: "LGT-BAR-40IN",
      stockQty: 22,
      weight: 4.1,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["lighting-electrical"].id,
      brandId: seededBrands["red-rooster"].id,
      images: [
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Luminous Flux", value: "22,000 Lumens" },
        { key: "Waterproof Level", value: "IP68 Certification" },
        { key: "Power Rating", value: "240 Watts" }
      ],
      compatibleVehicles: ["Thar", "Scorpio-N", "Fortuner", "Safari", "Harrier", "XUV700", "Jimny"]
    },
    {
      name: "Nexon Sequential LED Fog Lamps",
      description: "Upgrade the visibility of your Tata Nexon with these high-intensity LED fog lamps. Integrates matrix sequential flow blinkers and bright cornering assistance illumination. Shockproof polycarbonate lens.",
      shortDescription: "Matrix sequential DRL & LED fog lights customized for Tata Nexon.",
      slug: "nexon-sequential-led-fog-lamps",
      price: 4499.00,
      compareAtPrice: 5500.00,
      costPrice: 2000.00,
      sku: "LGT-FOG-NEXN",
      stockQty: 35,
      weight: 1.8,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["lighting-electrical"].id,
      brandId: seededBrands["tata-genuine"].id,
      images: [
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "LED Chip Type", value: "OSRAM Advanced LED" },
        { key: "Flow Style", value: "Matrix Sequential Swipe" },
        { key: "Housing Material", value: "Diecast Aluminum" }
      ],
      compatibleVehicles: ["Nexon"]
    },
    {
      name: "Auxiliary LED Pod Ditch Lights",
      description: "Sleek, high-intensity LED pods designed to mount on hood/A-pillar brackets. Angled outward to illuminate ditches, curbs, and forest paths. Features high-grade powder coat and shatterproof optics.",
      shortDescription: "Pair of compact 3-inch LED ditch pod lights (40W each).",
      slug: "auxiliary-led-pod-ditch-lights",
      price: 5999.00,
      compareAtPrice: 7500.00,
      costPrice: 2800.00,
      sku: "LGT-POD-DITCH",
      stockQty: 28,
      weight: 2.0,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["lighting-electrical"].id,
      brandId: seededBrands["red-rooster"].id,
      images: [
        "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Pod Size", value: "3 Inch Square" },
        { key: "Beam Pattern", value: "Spot & Flood Combo" },
        { key: "Total Output", value: "4800 Lumens Pair" }
      ],
      compatibleVehicles: ["Jimny", "Thar", "Fortuner", "Scorpio-N"]
    },
    {
      name: "Scorpio-N Underbody Neon Underglow",
      description: "App-controlled multi-color RGB neon lighting kit designed for the undercarriage of the Scorpio-N. Features voice-sync modes, customized patterns, and high-impact sealing for off-road water resistance.",
      shortDescription: "App-controlled waterproof multi-color RGB underglow lighting kit.",
      slug: "scorpio-n-underbody-neon-underglow",
      price: 6499.00,
      compareAtPrice: 8500.00,
      costPrice: 3000.00,
      sku: "LGT-UND-GLOWRGB",
      stockQty: 15,
      weight: 1.5,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["lighting-electrical"].id,
      brandId: seededBrands["mahindra-genuine"].id,
      images: [
        "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Control Mode", value: "Bluetooth Smart App + RF Remote" },
        { key: "Color Options", value: "16 Million Colors (RGB)" },
        { key: "Waterproof Standard", value: "IP67 Tube Sealing" }
      ],
      compatibleVehicles: ["Scorpio-N", "XUV700", "Thar"]
    },

    // === ARMOR & PROTECTION (5 products) ===
    {
      name: "Thar Off-road Front Steel Bumper",
      description: "Winch-ready heavy steel replacement bumper for the Mahindra Thar. Laser cut from structural carbon steel, featuring massive recovery points and integrated light mounts. Protects against severe trail damage.",
      shortDescription: "CNC-cut structural steel off-road front bumper for Thar.",
      slug: "thar-off-road-front-steel-bumper",
      price: 42000.00,
      compareAtPrice: 48000.00,
      costPrice: 22000.00,
      sku: "ARM-BMP-THARST",
      stockQty: 8,
      weight: 38.0,
      productType: "part",
      isActive: true,
      isFeatured: true,
      categoryId: seededSubCategories["armor-protection"].id,
      brandId: seededBrands["mahindra-genuine"].id,
      images: [
        "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Bumper Material", value: "3/16 inch CNC Bent Steel" },
        { key: "Finish", value: "Anti-Corrosion Matte Black Powder" },
        { key: "Winch Capacity", value: "Up to 9,500 lbs Rated" }
      ],
      compatibleVehicles: ["Thar"]
    },
    {
      name: "Fortuner Underbody Heavy Skid Bash Plate",
      description: "Thick aluminum alloy armor designed to protect the engine oil pan, transmission, and transfer case of the Toyota Fortuner from jagged boulders and low-clearance trail scrapes.",
      shortDescription: "6mm aircraft-grade aluminum underbody skid plate for Fortuner.",
      slug: "fortuner-underbody-heavy-skid-bash-plate",
      price: 18500.00,
      compareAtPrice: 22000.00,
      costPrice: 9500.00,
      sku: "ARM-SKD-FORTN",
      stockQty: 12,
      weight: 12.5,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["armor-protection"].id,
      brandId: seededBrands["toyota-genuine"].id,
      images: [
        "https://images.unsplash.com/photo-1562591176-b3337482f7d9?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Thickness", value: "6mm Heavy Duty" },
        { key: "Material", value: "5052-H32 Structural Aluminum" },
        { key: "Coverage", value: "Oil Pan & Front Differential" }
      ],
      compatibleVehicles: ["Fortuner"]
    },
    {
      name: "Jimny Heavy-Duty Steel Rock Sliders",
      description: "Tough side bars that mount directly to the chassis frame of the Maruti Suzuki Jimny. Designed to slide over obstacles without crushing the rocker panels. Features step plates with grip tape.",
      shortDescription: "Chassis-mounted heavy-duty side rock slider rails for Jimny.",
      slug: "jimny-heavy-duty-steel-rock-sliders",
      price: 16999.00,
      compareAtPrice: 19500.00,
      costPrice: 8500.00,
      sku: "ARM-SLD-JIMNY",
      stockQty: 10,
      weight: 22.0,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["armor-protection"].id,
      brandId: seededBrands["maruti-genuine"].id,
      images: [
        "https://images.unsplash.com/photo-1617469767053-d3b508a0d825?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Mount Type", value: "Frame Mounted (Zero Drilling)" },
        { key: "Pipe Diameter", value: "48mm Steel Tubing" },
        { key: "Weight Capacity", value: "Supports Hi-Lift Jacking" }
      ],
      compatibleVehicles: ["Jimny"]
    },
    {
      name: "Scorpio-N Premium Side Footsteps",
      description: "Anti-slip side steps with stylish chrome inserts matching the premium look of the Scorpio-N. Ensures comfortable cabin boarding for children and seniors while protecting door edges from door dings.",
      shortDescription: "Non-slip aluminum alloy boarding footsteps for Scorpio-N.",
      slug: "scorpio-n-premium-side-footsteps",
      price: 12499.00,
      compareAtPrice: 15000.00,
      costPrice: 6000.00,
      sku: "ARM-STP-SCORP",
      stockQty: 20,
      weight: 15.0,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["armor-protection"].id,
      brandId: seededBrands["mahindra-genuine"].id,
      images: [
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Core Material", value: "Premium Extruded Aluminum" },
        { key: "Weight Capacity", value: "Holds up to 150kg per side" },
        { key: "Tread", value: "Molded Rubber Gripping Pad" }
      ],
      compatibleVehicles: ["Scorpio-N"]
    },
    {
      name: "Harrier Tough Front Grille Mesh Guard",
      description: "Reinforced black mesh insert adding a rugged look to your Tata Harrier. Effectively keeps small gravel, leaves, and flying debris from piercing or bending the radiator cooling fins.",
      shortDescription: "Rust-resistant steel mesh bumper grille guard for Harrier.",
      slug: "harrier-front-grille-mesh-guard",
      price: 3800.00,
      compareAtPrice: 4900.00,
      costPrice: 1800.00,
      sku: "ARM-GRL-HARR",
      stockQty: 15,
      weight: 3.2,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["armor-protection"].id,
      brandId: seededBrands["tata-genuine"].id,
      images: [
        "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Material", value: "Powder-coated Stainless Steel" },
        { key: "Mesh Design", value: "Honeycomb Grid Design" },
        { key: "Installation", value: "Snap-on Clip Mount" }
      ],
      compatibleVehicles: ["Harrier"]
    },

    // === CAMPING & OVERLAND (5 products) ===
    {
      name: "Thar Foldable Hard-Shell Rooftop Tent",
      description: "Aerodynamic ABS shell rooftop tent custom sized for SUV roofs. Uses twin gas struts to pop up automatically in 45 seconds. Features a cozy 2.5-inch mattress, mosquito nets, and a collapsible telescoping ladder.",
      shortDescription: "Waterproof ABS hard shell 2-person rooftop tent.",
      slug: "thar-foldable-rooftop-tent",
      price: 115000.00,
      compareAtPrice: 135000.00,
      costPrice: 65000.00,
      sku: "CMP-TNT-ROOFABS",
      stockQty: 4,
      weight: 65.0,
      productType: "part",
      isActive: true,
      isFeatured: true,
      categoryId: seededSubCategories["camping-overland"].id,
      brandId: seededBrands["red-rooster"].id,
      images: [
        "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Sleeping Capacity", value: "2-3 Persons Comfortably" },
        { key: "Mattress Details", value: "High-density Memory Foam" },
        { key: "Shell Material", value: "UV Protected ABS Composite" }
      ],
      compatibleVehicles: ["Thar", "Jimny", "Fortuner", "Scorpio-N", "Safari", "XUV700"]
    },
    {
      name: "Universal Car Side Awning (Waterproof)",
      description: "Roll-out shade system that mounts to any roof rack. Features thick ripstop canvas with height-adjustable telescopic aluminum legs. Erects a comfortable, dry basecamp dining or relaxation shade zone.",
      shortDescription: "Vehicle-mounted roll-out waterproof camping side awning.",
      slug: "universal-car-side-awning",
      price: 18999.00,
      compareAtPrice: 22000.00,
      costPrice: 9000.00,
      sku: "CMP-AWN-SIDE",
      stockQty: 14,
      weight: 12.0,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["camping-overland"].id,
      brandId: seededBrands["red-rooster"].id,
      images: [
        "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Dimensions", value: "2.0m (Width) x 2.5m (Extension)" },
        { key: "Canvas density", value: "420D Waterproof Ripstop" },
        { key: "Hardware", value: "Anodized Aluminum Frame" }
      ],
      compatibleVehicles: ["Thar", "Safari", "Fortuner", "Scorpio-N", "Jimny", "XUV700"]
    },
    {
      name: "Trekking Portable Car Fridge/Freezer (12V)",
      description: "Dual-zone high-efficiency portable refrigerator compressor. Operates quietly off DC car charger ports or AC wall adapters. Cools down to freezing temperatures, preserving perishables and chilling drinks on long road trips.",
      shortDescription: "35L dual-zone compressor fridge/freezer for vehicular travel.",
      slug: "portable-car-fridge-freezer",
      price: 24999.00,
      compareAtPrice: 29999.00,
      costPrice: 14000.00,
      sku: "CMP-FRG-12VPORT",
      stockQty: 8,
      weight: 14.5,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["camping-overland"].id,
      brandId: seededBrands["red-rooster"].id,
      images: [
        "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Total Capacity", value: "35 Liters Volume" },
        { key: "Cooling Range", value: "-20°C to +20°C" },
        { key: "Power Draw", value: "45W Eco Mode" }
      ],
      compatibleVehicles: ["Thar", "Jimny", "Fortuner", "Scorpio-N", "Safari", "Harrier", "XUV700", "Nexon", "Creta"]
    },
    {
      name: "Overland Foldable Camp Table & Bench Set",
      description: "Ultra-portable aluminum table with two matching bench seats. Folds into a flat, lockable carry case. Built with premium woodgrain styling and rust-resistant aluminum framing.",
      shortDescription: "3-piece wooden styling aluminum folding camp table set.",
      slug: "foldable-camp-table-bench-set",
      price: 6499.00,
      compareAtPrice: 7999.00,
      costPrice: 3000.00,
      sku: "CMP-TBL-FOLDSET",
      stockQty: 25,
      weight: 8.5,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["camping-overland"].id,
      brandId: seededBrands["red-rooster"].id,
      images: [
        "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Material", value: "Sturdy MDF with Aluminum Frame" },
        { key: "Max Table Load", value: "50kg Weight Capacity" },
        { key: "Seating", value: "Set includes 2 Benches" }
      ],
      compatibleVehicles: ["Thar", "Jimny", "Fortuner", "Scorpio-N", "Safari", "Harrier", "XUV700"]
    },
    {
      name: "Tailgate Mounted Camp Kitchen Organizer",
      description: "Collapsible canvas storage network that straps onto rear tailgate panels. Features designated pockets for cutlery, species, plates, and cooking accessories. Makes campsite meal prep organized and fun.",
      shortDescription: "Heavy-duty canvas kitchen organizer for rear tailgate.",
      slug: "tailgate-camp-kitchen-organizer",
      price: 4800.00,
      compareAtPrice: 5800.00,
      costPrice: 1900.00,
      sku: "CMP-KTN-ORG",
      stockQty: 30,
      weight: 1.8,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["camping-overland"].id,
      brandId: seededBrands["red-rooster"].id,
      images: [
        "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Material", value: "1000D Tactical Nylon Canvas" },
        { key: "Pockets", value: "12 Utility Gear Pouches" },
        { key: "Attachment", value: "Heavy-duty Adjustable Strapping" }
      ],
      compatibleVehicles: ["Thar", "Jimny"]
    },

    // === SUSPENSION & WHEELS (5 products) ===
    {
      name: "Thar 2-Inch Suspension Lift Kit",
      description: "Upgrade the ground clearance of your Thar with this premium 2-inch lift kit. Includes longer heavy-duty coil springs and twin-tube nitro-charged shock absorbers calibrated for handling high-angle off-road gradients.",
      shortDescription: "Premium 2-inch height suspension lift kit for Thar.",
      slug: "thar-suspension-lift-kit",
      price: 68000.00,
      compareAtPrice: 78000.00,
      costPrice: 34000.00,
      sku: "SUS-LIFT-THAR2IN",
      stockQty: 6,
      weight: 28.0,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["suspension-wheels"].id,
      brandId: seededBrands["red-rooster"].id,
      images: [
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Clearance Gain", value: "2 inches (50mm)" },
        { key: "Shock Design", value: "Nitrogen Charged Twin Tube" },
        { key: "Coil Finish", value: "Epoxy Red Powder Coat" }
      ],
      compatibleVehicles: ["Thar"]
    },
    {
      name: "Swift Sport Lowering Springs Kit",
      description: "Reduces center of gravity for sporty hatchbacks. Lowers ride height by 30mm, improving aerodynamics and reducing body roll through fast highway curves. Delivers an aggressive stanced look.",
      shortDescription: "Progressive rate 30mm lowering springs for Maruti Swift.",
      slug: "swift-sport-lowering-springs",
      price: 24500.00,
      compareAtPrice: 28000.00,
      costPrice: 12000.00,
      sku: "SUS-SPR-SWIFT",
      stockQty: 10,
      weight: 11.2,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["suspension-wheels"].id,
      brandId: seededBrands["red-rooster"].id,
      images: [
        "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Height drop", value: "-30mm Front & Rear" },
        { key: "Spring Type", value: "Progressive Rate Coils" },
        { key: "Ride Profile", value: "Sporty Firm Handling" }
      ],
      compatibleVehicles: ["Swift"]
    },
    {
      name: "Royal Enfield Classic 350 Custom Alloy Wheels",
      description: "Upgrade the vintage wheels of your Classic 350 to these modern tubeless-compatible multi-spoke alloy wheels. Crafted from high-integrity cast aluminum, providing superior balance and highway stability.",
      shortDescription: "Tubeless multi-spoke cast aluminum alloy wheels for Classic 350.",
      slug: "royal-enfield-classic-alloy-wheels",
      price: 11500.00,
      compareAtPrice: 14000.00,
      costPrice: 5500.00,
      sku: "SUS-WHL-RECLASS",
      stockQty: 25,
      weight: 12.0,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["suspension-wheels"].id,
      brandId: seededBrands["royal-enfield-official"].id,
      images: [
        "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Spoke Count", value: "9-Spoke Modern Design" },
        { key: "Tyre Compatibility", value: "Tubeless System Support" },
        { key: "Finish", value: "Matte Black with Polished Lip" }
      ],
      compatibleVehicles: ["Classic 350"]
    },
    {
      name: "Fortuner Premium Off-Road Alloy Wheels (18\")",
      description: "Aggressively styled beadlock-look alloy wheels designed for the heavy Toyota Fortuner SUV. Features reinforced lips and high load indexes to prevent cracking under severe rock-crawling impacts.",
      shortDescription: "Heavy-duty 18-inch beadlock-style alloy wheels (Set of 4).",
      slug: "fortuner-premium-off-road-alloy-wheels",
      price: 85000.00,
      compareAtPrice: 95000.00,
      costPrice: 42000.00,
      sku: "SUS-WHL-FORTN18",
      stockQty: 5,
      weight: 48.0,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["suspension-wheels"].id,
      brandId: seededBrands["toyota-genuine"].id,
      images: [
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Wheel Size", value: "18 x 9.0 J" },
        { key: "Bolt Pattern", value: "6 x 139.7 PCD" },
        { key: "Quantity", value: "Set of 4 Wheels" }
      ],
      compatibleVehicles: ["Fortuner"]
    },
    {
      name: "Auto Rickshaw Custom Chrome Wheel Caps",
      description: "Vintage-styled bright chrome wheel covers engineered for the legendary Bajaj RE Auto Rickshaw. Adds a classic retro shine to standard steel wheels, resisting mud, dirt, and highway rust.",
      shortDescription: "Set of 3 retro bright chrome wheel hubcaps for Auto Rickshaw.",
      slug: "auto-rickshaw-chrome-wheel-caps",
      price: 2999.00,
      compareAtPrice: 3800.00,
      costPrice: 1000.00,
      sku: "SUS-WHL-RICKCAP",
      stockQty: 50,
      weight: 1.5,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["suspension-wheels"].id,
      brandId: seededBrands["bajaj-genuine"].id,
      images: [
        "https://images.unsplash.com/photo-1590766940554-634a7ed41450?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Finish", value: "Triple Chrome Plated" },
        { key: "Size", value: "8 inch diameter" },
        { key: "Quantity", value: "Set of 3 covers" }
      ],
      compatibleVehicles: ["RE Auto Rickshaw"]
    },

    // === STORAGE & RACKS (5 products) ===
    {
      name: "Jimny Slim Profile Roof Rack",
      description: "Minimalist aluminum roof rack for the Suzuki Jimny. Integrates perfectly into gutters without drilling. Aerodynamic deflector prevents wind whistling on high-speed road journeys.",
      shortDescription: "Laser-cut aluminum low-profile roof luggage rack for Jimny.",
      slug: "jimny-slim-profile-roof-rack",
      price: 28500.00,
      compareAtPrice: 34000.00,
      costPrice: 12000.00,
      sku: "STG-RCK-JIMNY",
      stockQty: 12,
      weight: 14.5,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["storage-racks"].id,
      brandId: seededBrands["maruti-genuine"].id,
      images: [
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Load Limit", value: "75kg Dynamic / 200kg Static" },
        { key: "Material", value: "Powder coated T6 Aluminum" },
        { key: "Crossbars", value: "4 T-Slot crossbars included" }
      ],
      compatibleVehicles: ["Jimny"]
    },
    {
      name: "XUV700 Modular Luggage Roof Carrier",
      description: "Aerodynamic premium cargo box that mounts onto roof crossbars. Keep luggage safe from rain and dust with secure key-locking mechanisms. Sleek gloss black finish accentuates your SUV's profile.",
      shortDescription: "400L aerodynamic weather-proof roof cargo box for XUV700.",
      slug: "xuv700-modular-luggage-carrier",
      price: 14999.00,
      compareAtPrice: 18000.00,
      costPrice: 7000.00,
      sku: "STG-CAR-XUV700",
      stockQty: 18,
      weight: 18.0,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["storage-racks"].id,
      brandId: seededBrands["mahindra-genuine"].id,
      images: [
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Volume Capacity", value: "400 Liters Space" },
        { key: "Locking", value: "Dual Side 3-Point Central Lock" },
        { key: "Material", value: "UV-Resistant ABS Plastics" }
      ],
      compatibleVehicles: ["XUV700"]
    },
    {
      name: "Safari Boot Organizer / Drawer Module",
      description: "Dual drawer storage cabinet designed for the rear trunk of the Tata Safari. Features heavy-duty roller slides, marine-grade carpet linings, and dividers to keep tools, accessories, and groceries organized.",
      shortDescription: "Trunk-fit dual carpeted storage drawer system for Safari.",
      slug: "safari-boot-organizer-drawer",
      price: 8500.00,
      compareAtPrice: 11000.00,
      costPrice: 3800.00,
      sku: "STG-DWR-SAFARI",
      stockQty: 15,
      weight: 16.0,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["storage-racks"].id,
      brandId: seededBrands["tata-genuine"].id,
      images: [
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Slide mechanism", value: "Stainless Steel Ball Bearing" },
        { key: "Lining", value: "Industrial Charcoal Felt Carpet" },
        { key: "Locking Type", value: "Slam Latches with Keys" }
      ],
      compatibleVehicles: ["Safari"]
    },
    {
      name: "Royal Enfield Vintage Leather Saddlebags",
      description: "Handcrafted top-grain leather saddlebags lined with waterproof backing. Styled with brass buckles and rivets, maintaining the heritage look of Royal Enfield motorcycles. Mounting steel stays included.",
      shortDescription: "Pair of premium handcrafted brown leather saddlebags for Classic.",
      slug: "royal-enfield-vintage-leather-saddlebags",
      price: 6999.00,
      compareAtPrice: 8500.00,
      costPrice: 3000.00,
      sku: "STG-BAG-RELEATH",
      stockQty: 30,
      weight: 4.5,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["storage-racks"].id,
      brandId: seededBrands["royal-enfield-official"].id,
      images: [
        "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Material", value: "Handcrafted Top-grain Leather" },
        { key: "Total Volume", value: "24 Liters Pair (12L each)" },
        { key: "Mounting Stays", value: "Left & Right Black Steel Brackets" }
      ],
      compatibleVehicles: ["Classic 350"]
    },
    {
      name: "Universal Elastic Cargo Net & Strap Set",
      description: "High-stretch heavy bungee cargo net equipped with impact-resistant plastic hooks. Safely secures loose duffel bags, gear boxes, and coolers onto roof racks or truck beds during bouncy off-road driving.",
      shortDescription: "Flexible 4x4 feet bungee cargo net with locking clips.",
      slug: "universal-cargo-net-straps",
      price: 1800.00,
      compareAtPrice: 2400.00,
      costPrice: 700.00,
      sku: "STG-NET-UNIV",
      stockQty: 100,
      weight: 0.9,
      productType: "part",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["storage-racks"].id,
      brandId: seededBrands["red-rooster"].id,
      images: [
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Relaxed Dimensions", value: "4.0 x 4.0 Feet" },
        { key: "Maximum Stretch", value: "8.0 x 8.0 Feet" },
        { key: "Bungee Core", value: "Latex Rubber Core" }
      ],
      compatibleVehicles: ["Thar", "Jimny", "Fortuner", "Scorpio-N", "Safari", "Harrier", "XUV700", "Nexon", "Creta"]
    },

    // === APPAREL (3 products) ===
    {
      name: "Mahindra Thar 'Live Young Live Free' Tee",
      description: "Showcase your adventure spirit with this premium crewneck t-shirt. Crafted from 100% pre-shrunk combed cotton, featuring a classic silhouette graphic of the Thar climbing a rocky peak. Highly breathable.",
      shortDescription: "Combed cotton graphic adventure t-shirt featuring the Thar.",
      slug: "thar-live-young-tee",
      price: 1199.00,
      compareAtPrice: 1499.00,
      costPrice: 400.00,
      sku: "MER-TEE-THAR",
      stockQty: 150,
      weight: 0.2,
      productType: "merch",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["apparel"].id,
      brandId: seededBrands["merchstore-apparel"].id,
      images: [
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Material", value: "100% Organic Combed Cotton" },
        { key: "Weave Type", value: "220 GSM Bio-Washed Single Jersey" },
        { key: "Fit", value: "Regular Unisex Fit" }
      ]
    },
    {
      name: "Royal Enfield Classic Silhouette Hoodie",
      description: "Heavyweight premium hoodie with a minimalist distressed print of the iconic Royal Enfield fuel tank. Designed with a soft fleece lining, thick drawstrings, and a front kangaroo pocket for warm comfort.",
      shortDescription: "Super-soft 350 GSM cotton-fleece heritage motorcycle hoodie.",
      slug: "royal-enfield-classic-hoodie",
      price: 2499.00,
      compareAtPrice: 2999.00,
      costPrice: 900.00,
      sku: "MER-HDY-RECLASS",
      stockQty: 80,
      weight: 0.8,
      productType: "merch",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["apparel"].id,
      brandId: seededBrands["merchstore-apparel"].id,
      images: [
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Fabric Blend", value: "85% Cotton, 15% Polyester" },
        { key: "Inner Lining", value: "Brushed Thermal Fleece" },
        { key: "Weight", value: "350 GSM Heavyweight" }
      ]
    },
    {
      name: "Indian Auto Rickshaw Retro Printed T-Shirt",
      description: "Celebrate Indian street culture with this vintage-styled graphic tee. Depicts a colorful yellow-and-green Bajaj RE auto rickshaw cruising through city streets. Quirky, breathable, and retro.",
      shortDescription: "Retro yellow-and-green auto rickshaw graphic street t-shirt.",
      slug: "auto-rickshaw-retro-tee",
      price: 999.00,
      compareAtPrice: 1299.00,
      costPrice: 350.00,
      sku: "MER-TEE-RICK",
      stockQty: 120,
      weight: 0.2,
      productType: "merch",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["apparel"].id,
      brandId: seededBrands["merchstore-apparel"].id,
      images: [
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Material", value: "100% Combed Cotton" },
        { key: "Graphic style", value: "Distressed Retro Screen Print" },
        { key: "GSM", value: "180 GSM Lightweight Breathable" }
      ]
    },

    // === CAPS (3 products) ===
    {
      name: "Thar Off-Road Embroidered Trucker Cap",
      description: "Breathable polyester meshback cap with a detailed embroidery patch showcasing the Thar grille. Built with an adjustable snapback closure ensuring a comfortable fit for all head sizes.",
      shortDescription: "Curved-visor mesh back trucker cap with Thar custom patch.",
      slug: "thar-offroad-trucker-cap",
      price: 799.00,
      compareAtPrice: 999.00,
      costPrice: 250.00,
      sku: "MER-CAP-THAR",
      stockQty: 200,
      weight: 0.15,
      productType: "merch",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["caps"].id,
      brandId: seededBrands["merchstore-apparel"].id,
      images: [
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Closure", value: "Adjustable 7-hole Plastic Snap" },
        { key: "Material", value: "Cotton Twill Front, Polyester Mesh Back" },
        { key: "Visor Shape", value: "Pre-Curved Structured Bill" }
      ]
    },
    {
      name: "Royal Enfield Bullet Heritage Snapback",
      description: "Flat-brim structured snapback featuring a bold gold 3D embroidery of 'Made Like a Gun'. Celebrating the legendary thumping legacy of Royal Enfield motorcycles. Premium sweatband lining.",
      shortDescription: "Flat-brim snapback cap with gold Bullet heritage embroidery.",
      slug: "royal-enfield-heritage-snapback",
      price: 999.00,
      compareAtPrice: 1299.00,
      costPrice: 350.00,
      sku: "MER-CAP-REBUL",
      stockQty: 150,
      weight: 0.15,
      productType: "merch",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["caps"].id,
      brandId: seededBrands["merchstore-apparel"].id,
      images: [
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Profile", value: "6-Panel High Crown Structured" },
        { key: "Embroidery Style", value: "Gold Metallic Raised 3D Stitching" },
        { key: "Fabric", value: "100% Premium Acrylic Twill" }
      ]
    },
    {
      name: "Maruti Swift Racing Distressed Dad Hat",
      description: "Low-profile, unstructured washed dad hat. Embroidered with a minimalist sports racing logo. Delivers a relaxed, worn-in vintage look, protecting your eyes during high-octane drive meets.",
      shortDescription: "Relaxed unstructured washed cotton dad hat with sports logo.",
      slug: "swift-racing-dad-hat",
      price: 699.00,
      compareAtPrice: 899.00,
      costPrice: 200.00,
      sku: "MER-CAP-SWIFT",
      stockQty: 180,
      weight: 0.12,
      productType: "merch",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["caps"].id,
      brandId: seededBrands["merchstore-apparel"].id,
      images: [
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Strap Type", value: "Washed Fabric with Brass Buckle" },
        { key: "Fit Profile", value: "Low Profile Unstructured Dad Style" },
        { key: "Fabric Care", value: "Garment Washed for Vintage Feel" }
      ]
    },

    // === KEYCHAINS (3 products) ===
    {
      name: "Thar Braided Leather Keyring",
      description: "Heavy-duty keyring styled with double-braided genuine leather strap. Features a gunmetal stainless steel quick-release clasp stamped with the rugged Thar adventure logo outline.",
      shortDescription: "Braided genuine leather key ring with gunmetal clasp.",
      slug: "thar-braided-leather-keyring",
      price: 599.00,
      compareAtPrice: 799.00,
      costPrice: 180.00,
      sku: "MER-KCH-THARLEATH",
      stockQty: 300,
      weight: 0.04,
      productType: "merch",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["keychains"].id,
      brandId: seededBrands["merchstore-apparel"].id,
      images: [
        "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Strap Material", value: "100% Genuine Full-grain Leather" },
        { key: "Hardware", value: "Anti-scratch Stainless Steel Clasp" },
        { key: "Total Length", value: "12 centimeters" }
      ]
    },
    {
      name: "Royal Enfield Brass Engine Silhouette Keychain",
      description: "Authentic polished solid brass keychain representing the classic 350 engine head. Develops a gorgeous vintage patina over time, perfect for Bullet owners.",
      shortDescription: "Solid brass scale replica key chain of RE engine block.",
      slug: "royal-enfield-brass-keychain",
      price: 499.00,
      compareAtPrice: 699.00,
      costPrice: 150.00,
      sku: "MER-KCH-REBRASS",
      stockQty: 400,
      weight: 0.05,
      productType: "merch",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["keychains"].id,
      brandId: seededBrands["merchstore-apparel"].id,
      images: [
        "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Material", value: "100% Pure Solid Yellow Brass" },
        { key: "Design Details", value: "3D Double Sided Scale Engraving" },
        { key: "Split Ring", value: "30mm Flat Brass Split Ring" }
      ]
    },
    {
      name: "Tata Nexon Carbon Fiber Textured Key Fob Cover",
      description: "Shockproof protective cover with a stunning carbon fiber weave print. Wraps tightly around the Tata smart key fob, guarding it from accidental drops, scuffs, and water sprays.",
      shortDescription: "Carbon-fiber pattern protective smart key fob case.",
      slug: "nexon-carbon-key-cover",
      price: 799.00,
      compareAtPrice: 999.00,
      costPrice: 280.00,
      sku: "MER-KCH-NEXNCARB",
      stockQty: 250,
      weight: 0.03,
      productType: "merch",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["keychains"].id,
      brandId: seededBrands["merchstore-apparel"].id,
      images: [
        "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Shell Material", value: "Flexible Shockproof TPU Silicone" },
        { key: "Surface Weave", value: "Carbon Fiber Texture Coat" },
        { key: "Key Access", value: "Allows Full Smart Button Pressing" }
      ]
    },

    // === COLLECTIBLES (3 products) ===
    {
      name: "Bajaj RE Auto Rickshaw Miniature Toy Model",
      description: "Delightful scale model replica of the iconic yellow-and-green Indian Auto Rickshaw. Built with realistic rubber tires, steerable front wheel, metal body parts, and pull-back action engine play.",
      shortDescription: "Die-cast yellow & green Indian Auto Rickshaw model (1:18).",
      slug: "auto-rickshaw-miniature-model",
      price: 1499.00,
      compareAtPrice: 1999.00,
      costPrice: 600.00,
      sku: "MER-COL-RICKMINI",
      stockQty: 100,
      weight: 0.45,
      productType: "merch",
      isActive: true,
      isFeatured: true,
      categoryId: seededSubCategories["collectibles"].id,
      brandId: seededBrands["merchstore-apparel"].id,
      images: [
        "https://images.unsplash.com/photo-1566908829747-d1d7bbef85b2?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Scale size", value: "1:18 scale ratio" },
        { key: "Materials Used", value: "Zinc Alloy Diecast + Rubber Tires" },
        { key: "Special Features", value: "Pull Back Action & Working Steering" }
      ]
    },
    {
      name: "Tata Safari Die-Cast 1:32 Scale Model",
      description: "High-quality metallic collectible replicating the premium Tata Safari. Features opening front doors, openable hood revealing the engine cover, working horn sounds, and headlamp glowing LEDs.",
      shortDescription: "Premium die-cast SUV model with glowing LEDs (1:32 scale).",
      slug: "safari-diecast-scale-model",
      price: 2499.00,
      compareAtPrice: 2999.00,
      costPrice: 1100.00,
      sku: "MER-COL-SAFARIMD",
      stockQty: 60,
      weight: 0.35,
      productType: "merch",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["collectibles"].id,
      brandId: seededBrands["merchstore-apparel"].id,
      images: [
        "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Scale Size", value: "1:32 scale ratio" },
        { key: "Special Effects", value: "Engine Sound + Headlight LEDs" },
        { key: "Doors", value: "4 Opening Doors & Trunk Lift" }
      ]
    },
    {
      name: "Mahindra Thar Silhouette Wall Art Plate",
      description: "Sophisticated metal wall plaque depicting the sharp profile of the Mahindra Thar. Precision laser-cut from high-grade carbon steel with matte black industrial coating. Perfect decor for garages or living rooms.",
      shortDescription: "Laser-cut steel silhouette wall plaque of Mahindra Thar.",
      slug: "thar-silhouette-wall-art",
      price: 1999.00,
      compareAtPrice: 2499.00,
      costPrice: 850.00,
      sku: "MER-COL-THARWALL",
      stockQty: 40,
      weight: 1.2,
      productType: "merch",
      isActive: true,
      isFeatured: false,
      categoryId: seededSubCategories["collectibles"].id,
      brandId: seededBrands["merchstore-apparel"].id,
      images: [
        "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&q=80&w=600"
      ],
      attributes: [
        { key: "Dimensions", value: "18 x 12 inches" },
        { key: "Material Steel", value: "2mm Laser Cut Structural Steel" },
        { key: "Coating Finish", value: "Textured Matte Black Powder Coat" }
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
