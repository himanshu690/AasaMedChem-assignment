import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { convertToBase } from "@/lib/conversions";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId = session.user.id;
    if (!userId && session.user.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      });
      if (dbUser) {
        userId = dbUser.id;
      }
    }

    let orders;
    if (session.user.role === "ADMIN") {
      orders = await prisma.order.findMany({
        include: {
          user: { select: { name: true, email: true } },
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      orders = await prisma.order.findMany({
        where: { userId: userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId = session.user.id;
    if (!userId && session.user.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      });
      if (dbUser) {
        userId = dbUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID could not be resolved" }, { status: 401 });
    }

    const body = await req.json();
    const { items } = body; // Array of { productId, enteredQuantity, enteredUnit }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    let totalAmount = new Decimal(0);
    const orderItemsData: {
      productId: string;
      enteredQuantity: Decimal;
      enteredUnit: string;
      baseQuantity: Decimal;
      price: Decimal;
    }[] = [];

    // Loop and fetch products to compute prices & quantities
    for (const item of items) {
      const { productId, enteredQuantity, enteredUnit } = item;

      if (!productId || enteredQuantity === undefined || !enteredUnit) {
        return NextResponse.json({ error: "Invalid item data" }, { status: 400 });
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${productId}` }, { status: 404 });
      }

      // Convert quantity to base unit
      let baseQty: Decimal;
      try {
        baseQty = convertToBase(enteredQuantity, enteredUnit, product.dimension);
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
      }

      // Calculate subtotal price: base quantity * price per base unit
      const itemSubtotal = baseQty.mul(new Decimal(product.pricePerUnit));
      totalAmount = totalAmount.add(itemSubtotal);

      orderItemsData.push({
        productId,
        enteredQuantity: new Decimal(enteredQuantity),
        enteredUnit,
        baseQuantity: baseQty,
        price: itemSubtotal,
      });
    }

    // Create Order and OrderItems in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: userId as string,
          status: "PENDING",
          totalAmount,
          items: {
            create: orderItemsData.map((item) => ({
              productId: item.productId,
              enteredQuantity: item.enteredQuantity,
              enteredUnit: item.enteredUnit,
              baseQuantity: item.baseQuantity,
              price: item.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return newOrder;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
