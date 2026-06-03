import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { convertToBase, getPricePerBaseUnit } from "@/lib/conversions";
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
    const { name, sku, description, dimension, enteredUnit, enteredQuantity, enteredPricePerUnit } = body;

    // Basic validation
    if (!name || !sku || !dimension || !enteredUnit || enteredQuantity === undefined || enteredPricePerUnit === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Convert values
    let stockQuantity: Decimal;
    let pricePerUnit: Decimal;

    try {
      stockQuantity = convertToBase(enteredQuantity, enteredUnit, dimension);
      pricePerUnit = getPricePerBaseUnit(enteredPricePerUnit, enteredUnit, dimension);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        sku,
        description,
        dimension,
        stockQuantity,
        pricePerUnit,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Product with this SKU already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if referenced by order items
    const linkedOrderCount = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (linkedOrderCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete product. It is referenced by existing quotations or orders." },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
