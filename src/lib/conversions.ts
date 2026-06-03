import { ProductDimension } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export interface UnitConfig {
  value: string;
  label: string;
  factor: Decimal; // factor to convert to base unit
}

export const DIMENSION_UNITS: Record<ProductDimension, UnitConfig[]> = {
  WEIGHT: [
    { value: "g", label: "Grams (g)", factor: new Decimal(1) },
    { value: "kg", label: "Kilograms (kg)", factor: new Decimal(1000) },
  ],
  VOLUME: [
    { value: "mL", label: "Milliliters (mL)", factor: new Decimal(1) },
    { value: "L", label: "Liters (L)", factor: new Decimal(1000) },
  ],
  COUNT: [
    { value: "item", label: "Items (count)", factor: new Decimal(1) },
  ],
};

// Given a quantity in enteredUnit, convert to base unit quantity
export function convertToBase(
  quantity: Decimal | number | string,
  enteredUnit: string,
  dimension: ProductDimension
): Decimal {
  const q = new Decimal(quantity);
  const units = DIMENSION_UNITS[dimension];
  const unit = units.find((u) => u.value.toLowerCase() === enteredUnit.toLowerCase());
  if (!unit) {
    throw new Error(`Invalid unit ${enteredUnit} for dimension ${dimension}`);
  }
  return q.mul(unit.factor);
}

// Given a quantity in base unit, convert to display unit quantity
export function convertFromBase(
  baseQuantity: Decimal | number | string,
  targetUnit: string,
  dimension: ProductDimension
): Decimal {
  const q = new Decimal(baseQuantity);
  const units = DIMENSION_UNITS[dimension];
  const unit = units.find((u) => u.value.toLowerCase() === targetUnit.toLowerCase());
  if (!unit) {
    throw new Error(`Invalid unit ${targetUnit} for dimension ${dimension}`);
  }
  return q.div(unit.factor);
}

// Convert pricing: base price is per base unit (e.g. per gram).
// Price per display unit is base price * display unit factor.
export function getPricePerDisplayUnit(
  pricePerBaseUnit: Decimal | number | string,
  displayUnit: string,
  dimension: ProductDimension
): Decimal {
  const basePrice = new Decimal(pricePerBaseUnit);
  const units = DIMENSION_UNITS[dimension];
  const unit = units.find((u) => u.value.toLowerCase() === displayUnit.toLowerCase());
  if (!unit) {
    throw new Error(`Invalid unit ${displayUnit} for dimension ${dimension}`);
  }
  return basePrice.mul(unit.factor);
}

// Reverse pricing conversion: get base unit price from a display unit price
export function getPricePerBaseUnit(
  pricePerDisplayUnit: Decimal | number | string,
  displayUnit: string,
  dimension: ProductDimension
): Decimal {
  const displayPrice = new Decimal(pricePerDisplayUnit);
  const units = DIMENSION_UNITS[dimension];
  const unit = units.find((u) => u.value.toLowerCase() === displayUnit.toLowerCase());
  if (!unit) {
    throw new Error(`Invalid unit ${displayUnit} for dimension ${dimension}`);
  }
  return displayPrice.div(unit.factor);
}

export function getBaseUnitName(dimension: ProductDimension): string {
  switch (dimension) {
    case "WEIGHT":
      return "g";
    case "VOLUME":
      return "mL";
    case "COUNT":
      return "item";
  }
}

export function formatINR(amount: Decimal | number | string): string {
  const val = new Decimal(amount).toNumber();
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4, // Show precision for small decimal values
  }).format(val);
}
