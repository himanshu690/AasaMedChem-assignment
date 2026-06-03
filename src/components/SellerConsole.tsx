"use client";

import { useState, useEffect } from "react";
import LogoutButton from "./LogoutButton";
import ChemicalLoader from "./ChemicalLoader";

type ProductDimension = "WEIGHT" | "VOLUME" | "COUNT";
type BaseUnit = "GRAM" | "MILLILITER" | "ITEM";

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  dimension: ProductDimension;
  baseUnit: BaseUnit;
  stockQuantity: string;
  pricePerUnit: string;
}

interface CartItem {
  product: Product;
  enteredQuantity: number;
  enteredUnit: string;
  baseQuantity: number;
  subtotal: number;
}

interface OrderItem {
  id: string;
  productId: string;
  enteredQuantity: string;
  enteredUnit: string;
  baseQuantity: string;
  price: string;
  product: Product;
}

interface Order {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  totalAmount: string;
  createdAt: string;
  items: OrderItem[];
}

export default function SellerConsole() {
  const [activeTab, setActiveTab] = useState<"catalog" | "orders">("catalog");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDimension, setSelectedDimension] = useState<string>("ALL");

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Individual product quantity input states
  // Key: productId, Value: { qty: string, unit: string }
  const [inputStates, setInputStates] = useState<Record<string, { qty: string; unit: string }>>({});

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  async function fetchProducts() {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);

        // Initialize input states for each product
        const initialInputs: Record<string, { qty: string; unit: string }> = {};
        data.forEach((p: Product) => {
          initialInputs[p.id] = {
            qty: "1",
            unit: p.dimension === "WEIGHT" ? "kg" : p.dimension === "VOLUME" ? "L" : "item",
          };
        });
        setInputStates(initialInputs);
      } else {
        setError("Failed to fetch products");
      }
    } catch (err) {
      setError("Error loading products");
    } finally {
      setLoadingProducts(false);
    }
  }

  async function fetchOrders() {
    setLoadingOrders(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        setError("Failed to fetch orders");
      }
    } catch (err) {
      setError("Error loading orders");
    } finally {
      setLoadingOrders(false);
    }
  }

  const handleInputChange = (productId: string, field: "qty" | "unit", value: string) => {
    setInputStates((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  // Convert unit to base and calculate subtotal on the fly
  const calculateConversionAndPrice = (product: Product, enteredQtyStr: string, enteredUnit: string) => {
    const qty = parseFloat(enteredQtyStr) || 0;
    const basePrice = parseFloat(product.pricePerUnit);

    let factor = 1;
    if (product.dimension === "WEIGHT") {
      if (enteredUnit === "kg") factor = 1000;
    } else if (product.dimension === "VOLUME") {
      if (enteredUnit === "L") factor = 1000;
    }

    const baseQuantity = qty * factor;
    const subtotal = baseQuantity * basePrice;

    return { baseQuantity, subtotal };
  };

  const addToCart = (product: Product) => {
    setError("");
    setSuccess("");
    const input = inputStates[product.id];
    if (!input || !input.qty || parseFloat(input.qty) <= 0) {
      setError(`Please enter a valid quantity for ${product.name}`);
      return;
    }

    const qty = parseFloat(input.qty);
    const unit = input.unit;

    const { baseQuantity, subtotal } = calculateConversionAndPrice(product, input.qty, unit);

    // Validate that the quantity does not exceed current stock levels
    const availableStock = parseFloat(product.stockQuantity);
    if (baseQuantity > availableStock) {
      setError(`Requested quantity exceeds available stock (${formatStock(product)})`);
      return;
    }

    // Check if product already in cart
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);

    if (existingIndex > -1) {
      const newCart = [...cart];
      const newQty = newCart[existingIndex].enteredQuantity + qty;
      const newConversion = calculateConversionAndPrice(product, newQty.toString(), unit);

      if (newConversion.baseQuantity > availableStock) {
        setError(`Cumulative cart quantity exceeds available stock (${formatStock(product)})`);
        return;
      }

      newCart[existingIndex] = {
        product,
        enteredQuantity: newQty,
        enteredUnit: unit,
        baseQuantity: newConversion.baseQuantity,
        subtotal: newConversion.subtotal,
      };
      setCart(newCart);
    } else {
      setCart((prev) => [
        ...prev,
        {
          product,
          enteredQuantity: qty,
          enteredUnit: unit,
          baseQuantity,
          subtotal,
        },
      ]);
    }

    setSuccess(`Added ${qty} ${unit} of ${product.name} to cart.`);
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePlaceOrder = async () => {
    setError("");
    setSuccess("");

    if (cart.length === 0) {
      setError("Your cart is empty");
      return;
    }

    const payload = {
      items: cart.map((item) => ({
        productId: item.product.id,
        enteredQuantity: item.enteredQuantity,
        enteredUnit: item.enteredUnit,
      })),
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Quotation request submitted successfully!");
        setCart([]);
        fetchOrders();
        setActiveTab("orders");
      } else {
        setError(data.error || "Failed to submit quotation");
      }
    } catch (err) {
      setError("Network error placing order. Please try again.");
    }
  };

  // UI Helpers
  const formatStock = (product: Product) => {
    const qty = parseFloat(product.stockQuantity);
    if (product.dimension === "WEIGHT") {
      return `${qty.toFixed(2)} g (${(qty / 1000).toFixed(3)} kg)`;
    }
    if (product.dimension === "VOLUME") {
      return `${qty.toFixed(2)} mL (${(qty / 1000).toFixed(3)} L)`;
    }
    return `${qty.toFixed(0)} items`;
  };

  const formatCurrency = (amount: number | string) => {
    const val = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(val);
  };

  const getBaseUnitShortName = (dim: ProductDimension) => {
    if (dim === "WEIGHT") return "g";
    if (dim === "VOLUME") return "mL";
    return "item";
  };

  // Filter products based on search & dimension selection
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDimension = selectedDimension === "ALL" || p.dimension === selectedDimension;

    return matchesSearch && matchesDimension;
  });

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            AasaMedChem Seller Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1">Browse active inventory, calculate unit conversions, submit order quotes</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-300">Role: <strong className="text-blue-400 uppercase">Seller</strong></span>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Alerts */}
        {error && (
          <div className="rounded-lg bg-red-950/40 border border-red-500/30 p-4 text-sm text-red-400 flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError("")} className="hover:text-white">✕</button>
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-emerald-950/40 border border-emerald-500/30 p-4 text-sm text-emerald-400 flex items-center justify-between">
            <span>✅ {success}</span>
            <button onClick={() => setSuccess("")} className="hover:text-white">✕</button>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 -mb-[2px] ${
              activeTab === "catalog"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Browse Catalog & Place Order
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 -mb-[2px] ${
              activeTab === "orders"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            My Submitted Quotations ({orders.length})
          </button>
        </div>

        {/* Catalog Tab */}
        {activeTab === "catalog" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Catalog Grid Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/40 border border-slate-800 p-4 rounded-xl backdrop-blur">
                <div className="flex-1">
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-sm"
                    placeholder="Search by product name, SKU, description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-48">
                  <select
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                    value={selectedDimension}
                    onChange={(e) => setSelectedDimension(e.target.value)}
                  >
                    <option value="ALL">All Dimensions</option>
                    <option value="WEIGHT">Weight (g/kg)</option>
                    <option value="VOLUME">Volume (mL/L)</option>
                    <option value="COUNT">Count (items)</option>
                  </select>
                </div>
              </div>

              {/* Product Grid */}
              {loadingProducts ? (
                <div className="flex items-center justify-center h-48 w-full">
                  <ChemicalLoader size="md" text="Loading Catalog..." />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center text-slate-500 py-12">No products match your filters.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map((p) => {
                    const inp = inputStates[p.id] || { qty: "1", unit: p.dimension === "WEIGHT" ? "kg" : "L" };
                    const { baseQuantity, subtotal } = calculateConversionAndPrice(p, inp.qty, inp.unit);
                    const outOfStock = parseFloat(p.stockQuantity) <= 0;

                    return (
                      <div
                        key={p.id}
                        className={`rounded-xl border p-5 backdrop-blur shadow-md flex flex-col justify-between transition duration-200 ${
                          outOfStock
                            ? "border-slate-800 bg-slate-900/10 opacity-60"
                            : "border-slate-800 bg-slate-900/40 hover:border-slate-700/80 hover:shadow-lg"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-white text-base leading-snug">{p.name}</h4>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">{p.sku}</p>
                            </div>
                            <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-semibold tracking-wider bg-slate-800 text-slate-300 uppercase">
                              {p.dimension}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 line-clamp-2 min-h-[2rem]">
                            {p.description || "No description provided."}
                          </p>

                          <div className="border-t border-slate-800/80 pt-3 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-slate-500 block">Inventory Available</span>
                              <strong className="text-white text-sm font-semibold">{formatStock(p)}</strong>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-500 block">Base Unit Price</span>
                              <strong className="text-white text-sm font-mono font-semibold">
                                {formatCurrency(p.pricePerUnit)}/{getBaseUnitShortName(p.dimension)}
                              </strong>
                            </div>
                          </div>
                        </div>

                        {!outOfStock ? (
                          <div className="mt-5 border-t border-slate-800/60 pt-4 space-y-3">
                            {/* Quantity and Unit Selection Inputs */}
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <input
                                  type="number"
                                  min="0.000001"
                                  step="any"
                                  className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500 text-xs text-center"
                                  placeholder="Quantity"
                                  value={inp.qty}
                                  onChange={(e) => handleInputChange(p.id, "qty", e.target.value)}
                                />
                              </div>
                              <div className="w-24">
                                <select
                                  className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-2 py-1.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                                  value={inp.unit}
                                  onChange={(e) => handleInputChange(p.id, "unit", e.target.value)}
                                >
                                  {p.dimension === "WEIGHT" && (
                                    <>
                                      <option value="kg">kg (Kilogram)</option>
                                      <option value="g">g (Gram)</option>
                                    </>
                                  )}
                                  {p.dimension === "VOLUME" && (
                                    <>
                                      <option value="L">L (Liter)</option>
                                      <option value="mL">mL (Milliliter)</option>
                                    </>
                                  )}
                                  {p.dimension === "COUNT" && <option value="item">item (count)</option>}
                                </select>
                              </div>
                            </div>

                            {/* Live Estimation details showing dimension consistency */}
                            <div className="flex justify-between items-center text-[10px] bg-slate-950/40 border border-slate-900 rounded p-2 text-slate-400">
                              <div>
                                <span className="block text-slate-500">Internal Storage Qty</span>
                                <strong className="text-white font-medium">
                                  {baseQuantity.toFixed(2)} {getBaseUnitShortName(p.dimension)}
                                </strong>
                              </div>
                              <div className="text-right">
                                <span className="block text-slate-500">Estimated Price (INR)</span>
                                <strong className="text-emerald-400 font-bold font-mono text-xs">
                                  {formatCurrency(subtotal)}
                                </strong>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => addToCart(p)}
                              className="w-full rounded-lg bg-indigo-600/90 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition duration-150"
                            >
                              Add to Order Cart 🛒
                            </button>
                          </div>
                        ) : (
                          <div className="mt-5 border-t border-slate-800/60 pt-4">
                            <button
                              type="button"
                              disabled
                              className="w-full rounded-lg bg-slate-800 text-slate-500 py-2 text-xs font-semibold"
                            >
                              Temporarily Out of Stock
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cart Column */}
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur shadow-xl sticky top-6 space-y-4">
                <h3 className="text-lg font-bold text-white flex justify-between items-center">
                  <span>Order Quotation Cart</span>
                  <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-semibold">
                    {cart.length} item{cart.length !== 1 ? "s" : ""}
                  </span>
                </h3>

                {cart.length === 0 ? (
                  <div className="text-center text-slate-500 py-12 text-sm border border-dashed border-slate-800 rounded-lg">
                    Your cart is empty. Browse the catalog and add products.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
                      {cart.map((item, index) => (
                        <div
                          key={`${item.product.id}-${index}`}
                          className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 flex justify-between items-center gap-4 text-xs hover:border-slate-700 transition"
                        >
                          <div className="space-y-1">
                            <strong className="text-white text-xs block font-bold leading-tight">
                              {item.product.name}
                            </strong>
                            <p className="text-slate-400 font-medium">
                              Qty: <strong className="text-slate-200">{item.enteredQuantity} {item.enteredUnit}</strong>
                              <span className="text-slate-500"> ({item.baseQuantity.toFixed(2)} {getBaseUnitShortName(item.product.dimension)})</span>
                            </p>
                            <p className="text-[10px] text-emerald-400 font-mono font-medium">
                              Subtotal: {formatCurrency(item.subtotal)}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(index)}
                            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-900 transition"
                            title="Remove item"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-800 pt-4 flex justify-between items-center">
                      <span className="text-sm text-slate-400 font-semibold">Grand Total:</span>
                      <strong className="text-xl font-extrabold text-emerald-400 font-mono">
                        {formatCurrency(cartTotal)}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-700/25 hover:from-emerald-500 hover:to-teal-500 transition duration-150"
                    >
                      Submit Quotation Request ✓
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* My Submitted Quotations Tab */}
        {activeTab === "orders" && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur shadow-xl space-y-6">
            <h3 className="text-lg font-bold text-white">Quotation History</h3>

            {loadingOrders ? (
              <div className="flex items-center justify-center h-48 w-full">
                <ChemicalLoader size="md" text="Loading Quotations..." />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center text-slate-500 py-12">You have not submitted any quotation requests yet.</div>
            ) : (
              <div className="space-y-6">
                {orders.map((o) => (
                  <div key={o.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-6 space-y-4 hover:border-slate-700/60 transition duration-200">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-white text-base">Quotation Order</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            o.status === "PENDING"
                              ? "bg-yellow-950/40 text-yellow-400 border border-yellow-500/20"
                              : o.status === "APPROVED"
                              ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
                              : "bg-red-950/40 text-red-400 border border-red-500/20"
                          }`}>
                            {o.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          ID: <span className="font-mono">{o.id}</span> • Submitted on {new Date(o.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Total Value</p>
                        <p className="text-xl font-bold text-emerald-400 font-mono mt-0.5">{formatCurrency(o.totalAmount)}</p>
                      </div>
                    </div>

                    {/* Table showing order items */}
                    <div className="overflow-x-auto border border-slate-900 rounded-lg">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-medium">
                            <th className="py-2.5 px-3">Product SKU & Name</th>
                            <th className="py-2.5 px-3 text-right">Ordered Qty</th>
                            <th className="py-2.5 px-3 text-right">Internal Conversion (Base)</th>
                            <th className="py-2.5 px-3 text-right">Rate applied</th>
                            <th className="py-2.5 px-3 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {o.items.map((item) => (
                            <tr key={item.id} className="border-b border-slate-800/40 text-slate-300">
                              <td className="py-3 px-3">
                                <div className="font-semibold text-white">{item.product?.name || "Unknown Product"}</div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.product?.sku || "-"}</div>
                              </td>
                              <td className="py-3 px-3 text-right font-medium text-white">
                                {parseFloat(item.enteredQuantity).toFixed(4)} {item.enteredUnit}
                              </td>
                              <td className="py-3 px-3 text-right text-indigo-400 font-medium">
                                {parseFloat(item.baseQuantity).toFixed(4)} {getBaseUnitShortName(item.product?.dimension || "WEIGHT")}
                              </td>
                              <td className="py-3 px-3 text-right text-slate-500 font-mono">
                                ₹{parseFloat(item.product?.pricePerUnit || "0").toFixed(4)}/{getBaseUnitShortName(item.product?.dimension || "WEIGHT")}
                              </td>
                              <td className="py-3 px-3 text-right font-semibold text-emerald-400 font-mono">
                                {formatCurrency(item.price)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
