import { db } from "@db";
import {
  products,
  tenants,
  users,
  categories,
  transactions,
  transactionItems,
  dailySummaries,
} from "@schema/index";

const main = async () => {
  console.log("Starting seeding data!");

  try {
    // Bersihkan dulu isi database
    await db.delete(transactionItems);
    await db.delete(transactions);
    await db.delete(dailySummaries);
    await db.delete(products);
    await db.delete(categories);
    await db.delete(users);
    await db.delete(tenants);

    console.log("Seeding tenant data!");
    const [newTenant] = await db
      .insert(tenants)
      .values({
        name: "Kios Sheza",
        slug: "kios-sheza",
        plan: "premium",
        isActive: true,
      })
      .returning({ id: tenants.id });

    if (!newTenant) {
      throw new Error(
        "Failed creating tenant data, database didn't return the ID!",
      );
    }
    console.log("Seeding tenant success!");

    console.log("Seeding users data!");
    const insertedUsers = await db
      .insert(users)
      .values([
        {
          tenantId: newTenant.id,
          name: "Admin Kios Sheza",
          email: "admin@kiossheza.com",
          role: "admin",
          passwordHash: await Bun.password.hash("password", {
            algorithm: "bcrypt",
            cost: 10,
          }),
        },
        {
          tenantId: newTenant.id,
          name: "Kasir Kios Sheza",
          email: "kasir@kiossheza.com",
          role: "cashier",
          passwordHash: await Bun.password.hash("password", {
            algorithm: "bcrypt",
            cost: 10,
          }),
        },
      ])
      .returning({ id: users.id, role: users.role });
    console.log("Seeding users success!");

    const cashier = insertedUsers.find((u) => u.role === "cashier");
    if (!cashier) throw new Error("Cashier not found!");

    const insertCategories = await db
      .insert(categories)
      .values([
        {
          name: "Makanan",
          tenantId: newTenant.id,
          slug: "makanan",
        },
        {
          name: "Minuman",
          tenantId: newTenant.id,
          slug: "minuman",
        },
        {
          name: "Rokok",
          tenantId: newTenant.id,
          slug: "rokok",
        },
        {
          name: "Kebersihan",
          tenantId: newTenant.id,
          slug: "kebersihan",
        },
        {
          name: "Kebutuhan Rumah Tangga",
          tenantId: newTenant.id,
          slug: "kebutuhan-rumah-tangga",
        },
      ])
      .returning({ id: categories.id, slug: categories.slug });

    console.log(`Success create ${insertCategories.length} categories!`);

    const getCategoryId = (slug: string): string => {
      const category = insertCategories.find((c) => c.slug === slug);
      if (!category) {
        throw new Error(`Category ${slug} not found!`);
      }
      return category.id;
    };

    console.log("Seeding product data!");
    const insertedProducts = await db
      .insert(products)
      .values([
      // ================= MAKANAN =================
      {
        tenantId: newTenant.id,
        categoryId: getCategoryId("makanan"),
        name: "Indomie Goreng Original",
        slug: "indomie-goreng-original",
        barcode: "089686010839",
        sellingPrice: "3500",
        unit: "Bks",
        stockQty: 120,
      },
      {
        tenantId: newTenant.id,
        categoryId: getCategoryId("makanan"),
        name: "Beng-Beng Coklat 20g",
        slug: "beng-beng-coklat-20g",
        barcode: "089960011402",
        sellingPrice: "2500",
        unit: "Pcs",
        stockQty: 60,
      },
      {
        tenantId: newTenant.id,
        categoryId: getCategoryId("makanan"),
        name: "Taro Net Rumput Laut 65g",
        slug: "taro-net-rumput-laut-65g",
        barcode: "089686043210",
        sellingPrice: "5000",
        unit: "Bks",
        stockQty: 30,
      },
      {
        tenantId: newTenant.id,
        categoryId: getCategoryId("makanan"),
        name: "Roti Aoka Coklat",
        slug: "roti-aoka-coklat",
        barcode: "089912345678",
        sellingPrice: "2500",
        unit: "Pcs",
        stockQty: 40,
      },

      // ================= MINUMAN =================
      {
        tenantId: newTenant.id,
        categoryId: getCategoryId("minuman"),
        name: "Aqua Botol 600ml",
        slug: "aqua-botol-600ml",
        barcode: "089686054321",
        sellingPrice: "3500",
        unit: "Btl",
        stockQty: 100,
      },
      {
        tenantId: newTenant.id,
        categoryId: getCategoryId("minuman"),
        name: "Teh Pucuk Harum 350ml",
        slug: "teh-pucuk-harum-350ml",
        barcode: "089987654321",
        sellingPrice: "4000",
        unit: "Btl",
        stockQty: 48,
      },
      {
        tenantId: newTenant.id,
        categoryId: getCategoryId("minuman"),
        name: "Kopi Kapal Api Mix (Sachet)",
        slug: "kopi-kapal-api-mix-sachet",
        barcode: "089987651111",
        sellingPrice: "1500",
        unit: "Pcs",
        stockQty: 200,
      },
      {
        tenantId: newTenant.id,
        categoryId: getCategoryId("minuman"),
        name: "Le Minerale 1500ml",
        slug: "le-minerale-1500ml",
        barcode: "089987652222",
        sellingPrice: "6500",
        unit: "Btl",
        stockQty: 24,
      },

      // ================= ROKOK =================
      {
        tenantId: newTenant.id,
        categoryId: getCategoryId("rokok"),
        name: "Sampoerna A Mild 16",
        slug: "sampoerna-a-mild-16",
        barcode: "089987653333",
        sellingPrice: "32000",
        unit: "Bks",
        stockQty: 50,
      },
      {
        tenantId: newTenant.id,
        categoryId: getCategoryId("rokok"),
        name: "Gudang Garam Surya 16",
        slug: "gudang-garam-surya-16",
        barcode: "089987654444",
        sellingPrice: "34000",
        unit: "Bks",
        stockQty: 50,
      },
      {
        tenantId: newTenant.id,
        categoryId: getCategoryId("rokok"),
        name: "Dji Sam Soe Refill 12",
        slug: "dji-sam-soe-refill-12",
        barcode: "089987655555",
        sellingPrice: "21000",
        unit: "Bks",
        stockQty: 30,
      },
      {
        tenantId: newTenant.id,
        categoryId: getCategoryId("rokok"),
        name: "Marlboro Filter Black 20",
        slug: "marlboro-filter-black-20",
        barcode: "089987656666",
        sellingPrice: "40000",
        unit: "Bks",
        stockQty: 20,
      },

      // ================= KEBERSIHAN =================
      {
        tenantId: newTenant.id,
        categoryId: getCategoryId("kebersihan"),
        name: "Sabun Mandi Lifebuoy 110g",
        slug: "sabun-mandi-lifebuoy-110g",
        barcode: "089987657777",
        sellingPrice: "4500",
        unit: "Pcs",
        stockQty: 36,
      },
      {
        tenantId: newTenant.id,
        categoryId: getCategoryId("kebersihan"),
        name: "Pepsodent White 190g",
        slug: "pepsodent-white-190g",
        barcode: "089987658888",
        sellingPrice: "12500",
        unit: "Tube",
        stockQty: 24,
      },
      {
        tenantId: newTenant.id,
        categoryId: getCategoryId("kebersihan"),
        name: "Shampo Clear Ice Cool (Renceng)",
        slug: "shampo-clear-ice-cool-renceng",
        barcode: "089987659999",
        sellingPrice: "12000",
        unit: "Rtg",
        stockQty: 15,
      },
      {
        tenantId: newTenant.id,
        categoryId: getCategoryId("kebersihan"),
        name: "Sikat Gigi Formula Kuat",
        slug: "sikat-gigi-formula-kuat",
        barcode: "089987650000",
        sellingPrice: "6000",
        unit: "Pcs",
        stockQty: 12,
      },

      // ========== KEBUTUHAN RUMAH TANGGA ==========
      {
        tenantId: newTenant.id,
        categoryId: getCategoryId("kebutuhan-rumah-tangga"),
        name: "Hit Aerosol Anti Nyamuk 600ml",
        slug: "hit-aerosol-anti-nyamuk-600ml",
        barcode: "089911112222",
        sellingPrice: "38500",
        unit: "Klg",
        stockQty: 12,
      },
      {
        tenantId: newTenant.id,
        categoryId: getCategoryId("kebutuhan-rumah-tangga"),
        name: "Deterjen Daia Putih 850g",
        slug: "deterjen-daia-putih-850g",
        barcode: "089911113333",
        sellingPrice: "18500",
        unit: "Bks",
        stockQty: 20,
      },
      {
        tenantId: newTenant.id,
        categoryId: getCategoryId("kebutuhan-rumah-tangga"),
        name: "Sunlight Jeruk Nipis 400ml",
        slug: "sunlight-jeruk-nipis-400ml",
        barcode: "089911114444",
        sellingPrice: "10500",
        unit: "Pch",
        stockQty: 24,
      },
      {
        tenantId: newTenant.id,
        categoryId: getCategoryId("kebutuhan-rumah-tangga"),
        name: "Tisu Paseo Soft 250s",
        slug: "tisu-paseo-soft-250s",
        barcode: "089911115555",
        sellingPrice: "19000",
        unit: "Pcs",
        stockQty: 15,
      }
    ])
    .returning({
      id: products.id,
      slug: products.slug,
      sellingPrice: products.sellingPrice,
    });
    console.log("Seeding 20 product success!");

    console.log("Seeding transactions & transaction items data!");
    
    // Helper to get product by slug
    const getProduct = (slug: string) => {
      const p = insertedProducts.find((p) => p.slug === slug);
      if (!p) throw new Error(`Product ${slug} not found`);
      return p;
    };

    const indomie = getProduct("indomie-goreng-original")!;
    const aqua = getProduct("aqua-botol-600ml")!;
    const sampoerna = getProduct("sampoerna-a-mild-16")!;
    const taro = getProduct("taro-net-rumput-laut-65g")!;
    const kopi = getProduct("kopi-kapal-api-mix-sachet")!;
    const sabun = getProduct("sabun-mandi-lifebuoy-110g")!;
    const tisu = getProduct("tisu-paseo-soft-250s")!;
    const bengbeng = getProduct("beng-beng-coklat-20g")!;

    // Function to format date to YYYY-MM-DD
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0]!;
    };

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // ================== HARI INI (TODAY) ==================
    // Transaction 1
    const [trx1] = await db
      .insert(transactions)
      .values({
        tenantId: newTenant.id,
        cashierId: cashier.id,
        trxNumber: `TRX-${formatDate(today).replace(/-/g, "")}-0001`,
        totalAmount: "10500", // (2 * 3500) + (1 * 3500)
        amountPaid: "15000",
        changeAmount: "4500",
        paymentMethod: "cash",
        status: "success",
        createdAt: today,
      })
      .returning({ id: transactions.id });
    if (!trx1) throw new Error("trx1 undefined");

    await db.insert(transactionItems).values([
      {
        transactionId: trx1.id,
        productId: indomie.id,
        qty: 2,
        unitPrice: indomie.sellingPrice,
        subtotal: "7000",
        createdAt: today,
      },
      {
        transactionId: trx1.id,
        productId: aqua.id,
        qty: 1,
        unitPrice: aqua.sellingPrice,
        subtotal: "3500",
        createdAt: today,
      },
    ]);

    // Transaction 2
    const [trx2] = await db
      .insert(transactions)
      .values({
        tenantId: newTenant.id,
        cashierId: cashier.id,
        trxNumber: `TRX-${formatDate(today).replace(/-/g, "")}-0002`,
        totalAmount: "37000", // (1 * 32000) + (1 * 5000)
        amountPaid: "50000",
        changeAmount: "13000",
        paymentMethod: "cash",
        status: "success",
        createdAt: today,
      })
      .returning({ id: transactions.id });
    if (!trx2) throw new Error("trx2 undefined");

    await db.insert(transactionItems).values([
      {
        transactionId: trx2.id,
        productId: sampoerna.id,
        qty: 1,
        unitPrice: sampoerna.sellingPrice,
        subtotal: "32000",
        createdAt: today,
      },
      {
        transactionId: trx2.id,
        productId: taro.id,
        qty: 1,
        unitPrice: taro.sellingPrice,
        subtotal: "5000",
        createdAt: today,
      },
    ]);

    // Transaction 3
    const [trx3] = await db
      .insert(transactions)
      .values({
        tenantId: newTenant.id,
        cashierId: cashier.id,
        trxNumber: `TRX-${formatDate(today).replace(/-/g, "")}-0003`,
        totalAmount: "23500", // (1 * 19000) + (1 * 4500)
        amountPaid: "25000",
        changeAmount: "1500",
        paymentMethod: "qris",
        status: "success",
        createdAt: today,
      })
      .returning({ id: transactions.id });
    if (!trx3) throw new Error("trx3 undefined");

    await db.insert(transactionItems).values([
      {
        transactionId: trx3.id,
        productId: tisu.id,
        qty: 1,
        unitPrice: tisu.sellingPrice,
        subtotal: "19000",
        createdAt: today,
      },
      {
        transactionId: trx3.id,
        productId: sabun.id,
        qty: 1,
        unitPrice: sabun.sellingPrice,
        subtotal: "4500",
        createdAt: today,
      },
    ]);

    // ================== KEMARIN (YESTERDAY) ==================
    // Transaction 4 (Kemarin)
    const [trx4] = await db
      .insert(transactions)
      .values({
        tenantId: newTenant.id,
        cashierId: cashier.id,
        trxNumber: `TRX-${formatDate(yesterday).replace(/-/g, "")}-0001`,
        totalAmount: "15000", // (10 * 1500)
        amountPaid: "20000",
        changeAmount: "5000",
        paymentMethod: "cash",
        status: "success",
        createdAt: yesterday,
      })
      .returning({ id: transactions.id });
    if (!trx4) throw new Error("trx4 undefined");

    await db.insert(transactionItems).values([
      {
        transactionId: trx4.id,
        productId: kopi.id,
        qty: 10,
        unitPrice: kopi.sellingPrice,
        subtotal: "15000",
        createdAt: yesterday,
      },
    ]);

    // Transaction 5 (Kemarin)
    const [trx5] = await db
      .insert(transactions)
      .values({
        tenantId: newTenant.id,
        cashierId: cashier.id,
        trxNumber: `TRX-${formatDate(yesterday).replace(/-/g, "")}-0002`,
        totalAmount: "12500", // 5 * 2500
        amountPaid: "12500",
        changeAmount: "0",
        paymentMethod: "qris",
        status: "success",
        createdAt: yesterday,
      })
      .returning({ id: transactions.id });
    if (!trx5) throw new Error("trx5 undefined");

    await db.insert(transactionItems).values([
      {
        transactionId: trx5.id,
        productId: bengbeng.id,
        qty: 5,
        unitPrice: bengbeng.sellingPrice,
        subtotal: "12500",
        createdAt: yesterday,
      },
    ]);

    // ================== LUSA (TWO DAYS AGO) ==================
    // Transaction 6 (Lusa)
    const [trx6] = await db
      .insert(transactions)
      .values({
        tenantId: newTenant.id,
        cashierId: cashier.id,
        trxNumber: `TRX-${formatDate(twoDaysAgo).replace(/-/g, "")}-0001`,
        totalAmount: "70000", // 20 * 3500
        amountPaid: "100000",
        changeAmount: "30000",
        paymentMethod: "cash",
        status: "success",
        createdAt: twoDaysAgo,
      })
      .returning({ id: transactions.id });
    if (!trx6) throw new Error("trx6 undefined");

    await db.insert(transactionItems).values([
      {
        transactionId: trx6.id,
        productId: indomie.id,
        qty: 20,
        unitPrice: indomie.sellingPrice,
        subtotal: "70000",
        createdAt: twoDaysAgo,
      },
    ]);

    // Transaction 7 (Lusa)
    const [trx7] = await db
      .insert(transactions)
      .values({
        tenantId: newTenant.id,
        cashierId: cashier.id,
        trxNumber: `TRX-${formatDate(twoDaysAgo).replace(/-/g, "")}-0002`,
        totalAmount: "34000", // 1 * 34000
        amountPaid: "50000",
        changeAmount: "16000",
        paymentMethod: "cash",
        status: "success",
        createdAt: twoDaysAgo,
      })
      .returning({ id: transactions.id });
    if (!trx7) throw new Error("trx7 undefined");

    await db.insert(transactionItems).values([
      {
        transactionId: trx7.id,
        productId: getProduct("gudang-garam-surya-16")!.id,
        qty: 1,
        unitPrice: getProduct("gudang-garam-surya-16")!.sellingPrice,
        subtotal: "34000",
        createdAt: twoDaysAgo,
      },
    ]);

    console.log("Seeding transactions success!");

    console.log("Seeding daily summaries data!");

    // Update daily summaries berdasarkan data transaksi di atas
    await db.insert(dailySummaries).values([
      {
        tenantId: newTenant.id,
        summaryDate: formatDate(today),
        retailRevenue: "71000", // 10500 + 37000 + 23500
        retailCogs: "55000", // Asumsi HPP
        brilinkCommission: "0",
        totalRevenue: "71000",
        grossProfit: "16000", // 71000 - 55000
        trxCount: 3,
        itemsSold: 7, // 3 + 2 + 2
      },
      {
        tenantId: newTenant.id,
        summaryDate: formatDate(yesterday),
        retailRevenue: "27500", // 15000 + 12500
        retailCogs: "20000", // Asumsi HPP
        brilinkCommission: "0",
        totalRevenue: "27500",
        grossProfit: "7500", // 27500 - 20000
        trxCount: 2,
        itemsSold: 15, // 10 + 5
      },
      {
        tenantId: newTenant.id,
        summaryDate: formatDate(twoDaysAgo),
        retailRevenue: "104000", // 70000 + 34000
        retailCogs: "85000", // Asumsi HPP
        brilinkCommission: "0",
        totalRevenue: "104000",
        grossProfit: "19000", // 104000 - 85000
        trxCount: 2,
        itemsSold: 21, // 20 + 1
      },
      // ====== TAMBAHAN DATA SUMMARY LAMA UNTUK CHART ======
      {
        tenantId: newTenant.id,
        summaryDate: formatDate(new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)), // 3 hari lalu
        retailRevenue: "150000",
        retailCogs: "120000",
        brilinkCommission: "5000",
        totalRevenue: "155000",
        grossProfit: "35000",
        trxCount: 15,
        itemsSold: 32,
      },
      {
        tenantId: newTenant.id,
        summaryDate: formatDate(new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000)), // 4 hari lalu
        retailRevenue: "210000",
        retailCogs: "165000",
        brilinkCommission: "15000",
        totalRevenue: "225000",
        grossProfit: "60000",
        trxCount: 22,
        itemsSold: 45,
      },
      {
        tenantId: newTenant.id,
        summaryDate: formatDate(new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000)), // 5 hari lalu
        retailRevenue: "85000",
        retailCogs: "65000",
        brilinkCommission: "0",
        totalRevenue: "85000",
        grossProfit: "20000",
        trxCount: 8,
        itemsSold: 12,
      },
      {
        tenantId: newTenant.id,
        summaryDate: formatDate(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)), // 6 hari lalu
        retailRevenue: "320000",
        retailCogs: "250000",
        brilinkCommission: "25000",
        totalRevenue: "345000",
        grossProfit: "95000",
        trxCount: 35,
        itemsSold: 70,
      },
    ] as any);
    console.log("Seeding daily summaries success!");

    console.log("Seeding data complete !");
  } catch (e) {
    console.log("Error while seeding the data : ", e);
  } finally {
    process.exit();
  }
};

main();
