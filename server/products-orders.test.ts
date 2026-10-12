import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

// Create mock admin user context
function createAdminContext(): TrpcContext {
  const adminUser: User = {
    id: 1,
    openId: "admin-user",
    email: "admin@farmvault.ng",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user: adminUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

// Create mock public context (no user)
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Products Router", () => {
  let adminCaller: ReturnType<typeof appRouter.createCaller>;
  let publicCaller: ReturnType<typeof appRouter.createCaller>;
  let createdProductId: number;

  beforeAll(() => {
    adminCaller = appRouter.createCaller(createAdminContext());
    publicCaller = appRouter.createCaller(createPublicContext());
  });

  it("should list products (public access)", async () => {
    const products = await publicCaller.products.list();
    expect(Array.isArray(products)).toBe(true);
    products.forEach((product) => {
      expect(product).not.toHaveProperty("price");
      expect(product).not.toHaveProperty("stock");
    });
  });

  it("should create a product (admin only)", async () => {
    const product = await adminCaller.products.create({
      name: "Test Rice",
      description: "High quality test rice",
      price: "5000.00",
      unit: "kg",
      imageUrl: "https://example.com/rice.jpg",
      stock: 100,
    });

    expect(product).toBeDefined();
    expect(product?.name).toBe("Test Rice");
    expect(product?.price).toBe("5000.00");
    createdProductId = product?.id || 0;
  });

  it("should prevent non-admin from creating products", async () => {
    try {
      await publicCaller.products.create({
        name: "Unauthorized Product",
        description: "This should fail",
        price: "1000.00",
        unit: "kg",
        imageUrl: "https://example.com/test.jpg",
        stock: 50,
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(["FORBIDDEN", "UNAUTHORIZED"]).toContain(error.code);
    }
  });

  it("should update a product (admin only)", async () => {
    if (createdProductId === 0) {
      console.warn("Skipping update test - no product created");
      return;
    }

    const updated = await adminCaller.products.update({
      id: createdProductId,
      stock: 50,
      price: "4500.00",
    });

    expect(updated).toBeDefined();
    expect(updated?.stock).toBe(50);
    expect(updated?.price).toBe("4500.00");
  });

  it("should get product by id (public access)", async () => {
    if (createdProductId === 0) {
      console.warn("Skipping getById test - no product created");
      return;
    }

    const product = await publicCaller.products.getById({ id: createdProductId });
    expect(product).toBeDefined();
    expect(product?.id).toBe(createdProductId);
    expect(product).not.toHaveProperty("price");
    expect(product).not.toHaveProperty("stock");
  });
});

describe("Orders Router", () => {
  let adminCaller: ReturnType<typeof appRouter.createCaller>;
  let publicCaller: ReturnType<typeof appRouter.createCaller>;
  let testProductId = 0;

  beforeAll(async () => {
    adminCaller = appRouter.createCaller(createAdminContext());
    publicCaller = appRouter.createCaller(createPublicContext());
    const products = await adminCaller.products.adminList();
    testProductId = products[0]?.id ?? 0;
  });

  it("should create an order (public access)", async () => {
    if (testProductId === 0) {
      console.warn("Skipping order creation test - no products found");
      return;
    }

    const order = await publicCaller.orders.create({
      productId: testProductId,
      customerName: "John Doe",
      customerEmail: "john@example.com",
      customerPhone: "+234 801 234 5678",
      quantity: 5,
    });

    expect(order).toBeDefined();
    expect(order?.customerName).toBe("John Doe");
    expect(order?.quantity).toBe(5);
    expect(order?.status).toBe("pending");
  });

  it("should prevent non-admin from listing orders", async () => {
    try {
      await publicCaller.orders.list();
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(["FORBIDDEN", "UNAUTHORIZED"]).toContain(error.code);
    }
  });

  it("should list orders (admin only)", async () => {
    const orders = await adminCaller.orders.list();
    expect(Array.isArray(orders)).toBe(true);
  });

  it("should update order status (admin only)", async () => {
    const orders = await adminCaller.orders.list();
    if (orders.length === 0) {
      console.warn("Skipping status update test - no orders found");
      return;
    }

    const firstOrder = orders[0];
    const updated = await adminCaller.orders.updateStatus({
      id: firstOrder.id,
      status: "confirmed",
    });

    expect(updated).toBeDefined();
    expect(updated?.status).toBe("confirmed");
  });

  it("should validate order input", async () => {
    try {
      await publicCaller.orders.create({
        productId: 1,
        customerName: "Jane Doe",
        customerEmail: "invalid-email",
        customerPhone: "+234 801 234 5678",
        quantity: 5,
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.code).toBe("BAD_REQUEST");
    }
  });
});
