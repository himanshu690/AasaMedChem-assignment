import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProductDimension, BaseUnit } from "@prisma/client";
import { convertToBase, getPricePerBaseUnit } from "@/lib/conversions";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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

    // Determine BaseUnit based on dimension
    let baseUnit: BaseUnit;
    if (dimension === "WEIGHT") {
      baseUnit = BaseUnit.GRAM;
    } else if (dimension === "VOLUME") {
      baseUnit = BaseUnit.MILLILITER;
    } else if (dimension === "COUNT") {
      baseUnit = BaseUnit.ITEM;
    } else {
      return NextResponse.json({ error: "Invalid dimension" }, { status: 400 });
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

    // Save to DB
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        description,
        dimension,
        baseUnit,
        stockQuantity,
        pricePerUnit,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Product with this SKU already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
