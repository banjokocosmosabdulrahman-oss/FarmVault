import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import { z } from "zod";
import { 
  getAllProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus
} from "./db";
import { TRPCError } from "@trpc/server";
import type { Product } from "../drizzle/schema";

const toPublicProduct = ({ price: _price, stock: _stock, ...product }: Product) => product;

// Helper to ensure user is admin
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ===== PRODUCTS ROUTER =====
  products: router({
    list: publicProcedure.query(async () => {
      const products = await getAllProducts();
      return products.map(toPublicProduct);
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const product = await getProductById(input.id);
        return product ? toPublicProduct(product) : undefined;
      }),

    adminList: adminProcedure.query(async () => {
      return await getAllProducts();
    }),

    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        price: z.string().regex(/^\d+(\.\d{1,2})?$/),
        unit: z.string().min(1),
        imageUrl: z.string().url(),
        stock: z.number().int().min(0),
      }))
      .mutation(async ({ input }) => {
        const product = await createProduct({
          name: input.name,
          description: input.description,
          price: input.price,
          unit: input.unit,
          imageUrl: input.imageUrl,
          stock: input.stock,
        });
        if (!product) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create product' });
        }
        return product;
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        price: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        unit: z.string().min(1).optional(),
        imageUrl: z.string().url().optional(),
        stock: z.number().int().min(0).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        const product = await updateProduct(id, updates);
        if (!product) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update product' });
        }
        return product;
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const success = await deleteProduct(input.id);
        if (!success) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete product' });
        }
        return { success: true };
      }),
  }),

  // ===== ORDERS ROUTER =====
  orders: router({
    list: adminProcedure.query(async () => {
      return await getAllOrders();
    }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getOrderById(input.id);
      }),

    create: publicProcedure
      .input(z.object({
        productId: z.number(),
        customerName: z.string().min(1),
        customerEmail: z.string().email(),
        customerPhone: z.string().min(1),
        quantity: z.number().int().min(1),
      }))
      .mutation(async ({ input }) => {
        const product = await getProductById(input.productId);
        if (!product) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
        }
        if (input.quantity > product.stock) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This product is not currently available in the requested quantity',
          });
        }

        const totalPrice = (parseFloat(product.price) * input.quantity).toFixed(2);
        const order = await createOrder({
          productId: input.productId,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          quantity: input.quantity,
          totalPrice,
        });
        if (!order) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create order' });
        }

        // Notify owner of new order
        try {
          await notifyOwner({
            title: `New Order #${order.id} from ${input.customerName}`,
            content: `Customer ${input.customerName} (${input.customerPhone}) ordered ${input.quantity} unit(s). Total: NGN ${totalPrice}. Check the admin dashboard to confirm the order.`,
          });
        } catch (error) {
          console.error('[Notification] Failed to notify owner:', error);
          // Dont throw - order was created successfully, notification is just a bonus
        }

        return order;
      }),

    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'confirmed', 'delivered']),
      }))
      .mutation(async ({ input }) => {
        const order = await updateOrderStatus(input.id, input.status);
        if (!order) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update order status' });
        }
        return order;
      }),
  }),
});

export type AppRouter = typeof appRouter;
