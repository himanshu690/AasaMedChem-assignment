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
  stockQuantity: string; // Decimal serialized as string
  pricePerUnit: string;  // Decimal serialized as string
  createdAt: string;
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
  userId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  totalAmount: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  items: OrderItem[];
}

export default function AdminConsole() {
  const [activeTab, setActiveTab] = useState<"products" | "orders">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Product Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDim, setFormDim] = useState<ProductDimension>("WEIGHT");
  const [formUnit, setFormUnit] = useState("g");
  const [formQty, setFormQty] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Handle unit options based on dimension
  useEffect(() => {
    if (formDim === "WEIGHT") {
      setFormUnit("g");
    } else if (formDim === "VOLUME") {
      setFormUnit("mL");
    } else {
      setFormUnit("item");
    }
  }, [formDim]);

  const resetForm = () => {
    setEditingId(null);
    setFormName("");
    setFormSku("");
    setFormDesc("");
    setFormDim("WEIGHT");
    setFormUnit("g");
    setFormQty("");
    setFormPrice("");
  };

  const handleEditClick = (p: Product) => {
    setEditingId(p.id);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormDesc(p.description || "");
    setFormDim(p.dimension);

    // Represent the base unit details in the form inputs
    if (p.dimension === "WEIGHT") {
      setFormUnit("g");
      setFormQty(p.stockQuantity);
      setFormPrice(p.pricePerUnit);
    } else if (p.dimension === "VOLUME") {
      setFormUnit("mL");
      setFormQty(p.stockQuantity);
      setFormPrice(p.pricePerUnit);
    } else {
      setFormUnit("item");
      setFormQty(p.stockQuantity);
      setFormPrice(p.pricePerUnit);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    if (!formName || !formSku || !formQty || !formPrice) {
      setError("All fields are required");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name: formName,
      sku: formSku,
      description: formDesc,
      dimension: formDim,
      enteredUnit: formUnit,
      enteredQuantity: parseFloat(formQty),
      enteredPricePerUnit: parseFloat(formPrice),
    };

    try {
      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(editingId ? "Product updated successfully!" : "Product created successfully!");
        resetForm();
        fetchProducts();
      } else {
        setError(data.error || "Something went wrong saving the product");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        setSuccess("Product deleted successfully");
        fetchProducts();
      } else {
        setError(data.error || "Failed to delete product");
      }
    } catch (err) {
      setError("Network error deleting product");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: "APPROVED" | "REJECTED") => {
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Order status updated to ${status}`);
        fetchOrders();
        fetchProducts(); // Refresh stock quantities
      } else {
        setError(data.error || "Failed to update order status");
      }
    } catch (err) {
      setError("Network error updating order");
    }
  };

  // UI Helpers for display conversions
  const getAltStockString = (qtyStr: string, dim: ProductDimension) => {
    const qty = parseFloat(qtyStr);
    if (dim === "WEIGHT") {
      const kg = qty / 1000;
      return `${kg.toFixed(4)} kg`;
    } else if (dim === "VOLUME") {
      const l = qty / 1000;
      return `${l.toFixed(4)} L`;
    }
    return "";
  };

  const getPricePerAltUnitString = (pricePerBaseStr: string, dim: ProductDimension) => {
    const price = parseFloat(pricePerBaseStr);
    if (dim === "WEIGHT") {
      const pricePerKg = price * 1000;
      return `₹${pricePerKg.toFixed(2)}/kg`;
    } else if (dim === "VOLUME") {
      const pricePerL = price * 1000;
      return `₹${pricePerL.toFixed(2)}/L`;
    }
    return "";
  };

  const getBaseUnitShortName = (dim: ProductDimension) => {
    if (dim === "WEIGHT") return "g";
    if (dim === "VOLUME") return "mL";
    return "item";
  };

  const formatCurrency = (valStr: string) => {
    const val = parseFloat(valStr);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            AasaMedChem Admin Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">Manage catalog, verify conversions, review pending seller quotations</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-300">Role: <strong className="text-emerald-400 uppercase">Admin</strong></span>
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
            onClick={() => setActiveTab("products")}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 -mb-[2px] ${
              activeTab === "products"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Products & Inventory CRUD
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 -mb-[2px] ${
              activeTab === "orders"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Quotation & Orders ({orders.filter(o => o.status === "PENDING").length} Pending)
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur shadow-xl">
                <h3 className="text-lg font-bold text-white mb-4">
                  {editingId ? "Edit Product" : "Add New Product"}
                </h3>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                      placeholder="e.g. Sodium Chloride USP"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      SKU (Unique Identifier)
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                      placeholder="e.g. CHEM-NAC-001"
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Description
                    </label>
                    <textarea
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm h-20 resize-none"
                      placeholder="e.g. Pharmaceutical grade salt used for preparations."
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Dimension
                      </label>
                      <select
                        className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                        value={formDim}
                        onChange={(e) => setFormDim(e.target.value as ProductDimension)}
                      >
                        <option value="WEIGHT">Weight</option>
                        <option value="VOLUME">Volume</option>
                        <option value="COUNT">Count</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Input Unit
                      </label>
                      <select
                        className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                        value={formUnit}
                        onChange={(e) => setFormUnit(e.target.value)}
                      >
                        {formDim === "WEIGHT" && (
                          <>
                            <option value="g">Grams (g)</option>
                            <option value="kg">Kilograms (kg)</option>
                          </>
                        )}
                        {formDim === "VOLUME" && (
                          <>
                            <option value="mL">Milliliters (mL)</option>
                            <option value="L">Liters (L)</option>
                          </>
                        )}
                        {formDim === "COUNT" && <option value="item">Items (unit/count)</option>}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Stock Quantity ({formUnit})
                      </label>
                      <input
                        type="number"
                        step="0.00000001"
                        className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                        placeholder="e.g. 500"
                        value={formQty}
                        onChange={(e) => setFormQty(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Price per {formUnit} (₹)
                      </label>
                      <input
                        type="number"
                        step="0.00000001"
                        className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                        placeholder="e.g. 0.50"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Real-time Preview showing conversions */}
                  {formQty && formPrice && (
                    <div className="mt-4 rounded-lg bg-indigo-950/20 border border-indigo-500/20 p-3 text-xs space-y-1 text-slate-300">
                      <p className="font-bold text-indigo-400">Database Storage Preview:</p>
                      {formDim === "WEIGHT" && formUnit === "kg" && (
                        <>
                          <p>• Internal weight stored: <strong className="text-white">{(parseFloat(formQty) * 1000).toFixed(4)} g</strong></p>
                          <p>• Internal price stored: <strong className="text-white">₹{(parseFloat(formPrice) / 1000).toFixed(6)} / g</strong></p>
                        </>
                      )}
                      {formDim === "VOLUME" && formUnit === "L" && (
                        <>
                          <p>• Internal volume stored: <strong className="text-white">{(parseFloat(formQty) * 1000).toFixed(4)} mL</strong></p>
                          <p>• Internal price stored: <strong className="text-white">₹{(parseFloat(formPrice) / 1000).toFixed(6)} / mL</strong></p>
                        </>
                      )}
                      {((formDim === "WEIGHT" && formUnit === "g") || (formDim === "VOLUME" && formUnit === "mL") || (formDim === "COUNT")) && (
                        <>
                          <p>• Internal quantity stored: <strong className="text-white">{parseFloat(formQty).toFixed(4)} {getBaseUnitShortName(formDim)}</strong></p>
                          <p>• Internal price stored: <strong className="text-white">₹{parseFloat(formPrice).toFixed(4)} / {getBaseUnitShortName(formDim)}</strong></p>
                        </>
                      )}
                    </div>
                  )}

                  <div className="pt-2 flex gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition duration-150 disabled:opacity-50"
                    >
                      {isSubmitting ? "Saving..." : editingId ? "Update Product" : "Create Product"}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="rounded-lg border border-slate-700 bg-slate-800/40 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition duration-150"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* List Column */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur shadow-xl space-y-4">
                <h3 className="text-lg font-bold text-white">Product Catalog & Inventory</h3>

                {loadingProducts ? (
                  <div className="flex items-center justify-center h-48 w-full">
                    <ChemicalLoader size="md" text="Loading Catalog..." />
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center text-slate-500 py-12">No products found. Add your first product on the left!</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-medium">
                          <th className="py-3 px-4">SKU / Name</th>
                          <th className="py-3 px-4">Dimension</th>
                          <th className="py-3 px-4 text-right">Internal Stock (Base)</th>
                          <th className="py-3 px-4 text-right">Equivalent Stock</th>
                          <th className="py-3 px-4 text-right">Internal Rate</th>
                          <th className="py-3 px-4 text-right">Equivalent Rate</th>
                          <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => (
                          <tr key={p.id} className="border-b border-slate-800/60 hover:bg-slate-900/20 transition duration-150">
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-white">{p.name}</div>
                              <div className="text-xs text-slate-400 font-mono mt-0.5">{p.sku}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                                {p.dimension}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-medium">
                              {parseFloat(p.stockQuantity).toFixed(2)} {getBaseUnitShortName(p.dimension)}
                            </td>
                            <td className="py-3.5 px-4 text-right text-emerald-400 font-medium">
                              {getAltStockString(p.stockQuantity, p.dimension) || "-"}
                            </td>
                            <td className="py-3.5 px-4 text-right text-slate-300 font-mono">
                              ₹{parseFloat(p.pricePerUnit).toFixed(4)}/{getBaseUnitShortName(p.dimension)}
                            </td>
                            <td className="py-3.5 px-4 text-right text-indigo-400 font-mono">
                              {getPricePerAltUnitString(p.pricePerUnit, p.dimension) || "-"}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEditClick(p)}
                                  className="p-1.5 rounded hover:bg-indigo-950/40 text-indigo-400 hover:text-white transition"
                                  title="Edit"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="p-1.5 rounded hover:bg-red-950/40 text-red-400 hover:text-white transition"
                                  title="Delete"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur shadow-xl space-y-6">
            <h3 className="text-lg font-bold text-white">Quotation & Order Submissions</h3>

            {loadingOrders ? (
              <div className="flex items-center justify-center h-48 w-full">
                <ChemicalLoader size="md" text="Loading Orders..." />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center text-slate-500 py-12">No quotation requests have been submitted yet.</div>
            ) : (
              <div className="space-y-6">
                {orders.map((o) => (
                  <div key={o.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-6 space-y-4 hover:border-slate-700/60 transition duration-200">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-white text-base">Quotation Request</h4>
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
                          ID: <span className="font-mono">{o.id}</span> • Submitted by {o.user.name} ({o.user.email}) on {new Date(o.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Total Value (INR)</p>
                        <p className="text-xl font-bold text-emerald-400 font-mono mt-0.5">{formatCurrency(o.totalAmount)}</p>
                      </div>
                    </div>

                    {/* Order Items Details */}
                    <div className="overflow-x-auto border border-slate-900 rounded-lg">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-medium">
                            <th className="py-2.5 px-3">Product Name (SKU)</th>
                            <th className="py-2.5 px-3 text-right">Ordered Qty</th>
                            <th className="py-2.5 px-3 text-right">Internal Base Qty</th>
                            <th className="py-2.5 px-3 text-right">Base Price Rate</th>
                            <th className="py-2.5 px-3 text-right">Total Subtotal</th>
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
                              <td className="py-3 px-3 text-right text-slate-400 font-mono">
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

                    {/* Approval Actions */}
                    {o.status === "PENDING" && (
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          onClick={() => handleUpdateOrderStatus(o.id, "REJECTED")}
                          className="rounded-lg border border-red-500/30 bg-red-950/20 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 transition duration-150"
                        >
                          Reject Quotation ✕
                        </button>
                        <button
                          onClick={() => handleUpdateOrderStatus(o.id, "APPROVED")}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition duration-150"
                        >
                          Approve & Deduct Stock ✓
                        </button>
                      </div>
                    )}
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
