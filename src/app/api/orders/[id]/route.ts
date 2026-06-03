import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status } = body; // "APPROVED" or "REJECTED"

    if (status !== "APPROVED" && status !== "REJECTED") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Retrieve order and its items
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "Order status can only be changed if it is PENDING" }, { status: 400 });
    }

    // Perform approval/rejection logic in a transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      if (status === "APPROVED") {
        for (const item of order.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new Error(`Product ${item.productId} not found`);
          }

          const currentStock = new Decimal(product.stockQuantity);
          const orderedStock = new Decimal(item.baseQuantity);

          if (currentStock.lessThan(orderedStock)) {
            throw new Error(
              `Insufficient stock for product ${product.name} (SKU: ${product.sku}). Available: ${currentStock.toString()}, Required: ${orderedStock.toString()}`
            );
          }

          // Deduct stock
          await tx.product.update({
            where: { id: product.id },
            data: {
              stockQuantity: currentStock.sub(orderedStock),
            },
          });
        }
      }

      const updated = await tx.order.update({
        where: { id },
        data: { status },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return updated;
    });

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
