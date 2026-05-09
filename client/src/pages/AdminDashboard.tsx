import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Edit2, Trash2, LogOut, Package, ShoppingCart, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { Product, Order } from "../../../drizzle/schema";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"products" | "orders">("products");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Queries
  const { data: products, refetch: refetchProducts, isLoading: productsLoading } = trpc.products.list.useQuery();
  const { data: orders, refetch: refetchOrders, isLoading: ordersLoading } = trpc.orders.list.useQuery();

  // Mutations
  const createProductMutation = trpc.products.create.useMutation();
  const updateProductMutation = trpc.products.update.useMutation();
  const deleteProductMutation = trpc.products.delete.useMutation();
  const updateOrderStatusMutation = trpc.orders.updateStatus.useMutation();

  // Form state
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    unit: "",
    imageUrl: "",
    stock: "",
  });

  // Check authorization
  useEffect(() => {
    if (user && user.role !== "admin") {
      toast.error("You don't have permission to access this page");
      setLocation("/");
    }
  }, [user, setLocation]);

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  // Product Form Handlers
  const handleProductFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productForm.name || !productForm.description || !productForm.price || !productForm.unit || !productForm.imageUrl || !productForm.stock) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      if (editingProduct) {
        await updateProductMutation.mutateAsync({
          id: editingProduct.id,
          name: productForm.name,
          description: productForm.description,
          price: productForm.price,
          unit: productForm.unit,
          imageUrl: productForm.imageUrl,
          stock: parseInt(productForm.stock),
        });
        toast.success("Product updated successfully!");
      } else {
        await createProductMutation.mutateAsync({
          name: productForm.name,
          description: productForm.description,
          price: productForm.price,
          unit: productForm.unit,
          imageUrl: productForm.imageUrl,
          stock: parseInt(productForm.stock),
        });
        toast.success("Product created successfully!");
      }

      setProductForm({ name: "", description: "", price: "", unit: "", imageUrl: "", stock: "" });
      setEditingProduct(null);
      setShowProductForm(false);
      refetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      unit: product.unit,
      imageUrl: product.imageUrl,
      stock: product.stock.toString(),
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await deleteProductMutation.mutateAsync({ id });
      toast.success("Product deleted successfully!");
      refetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: "pending" | "confirmed" | "delivered") => {
    try {
      await updateOrderStatusMutation.mutateAsync({ id: orderId, status: newStatus });
      toast.success("Order status updated!");
      refetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2d7d32] to-[#4caf50] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black">Farm Vault Admin</h1>
            <p className="text-sm opacity-90">Welcome, {user?.name}</p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="bg-white/20 text-white border-white hover:bg-white/30"
            >
              <ArrowLeft size={16} className="mr-2" /> Back to Store
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-white/20 text-white border-white hover:bg-white/30"
            >
              <LogOut size={16} className="mr-2" /> Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              activeTab === "products"
                ? "bg-[#2d7d32] text-white"
                : "bg-white text-[#2d7d32] border-2 border-[#2d7d32] hover:bg-[#f5f5f5]"
            }`}
          >
            <Package size={20} /> Products
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              activeTab === "orders"
                ? "bg-[#2d7d32] text-white"
                : "bg-white text-[#2d7d32] border-2 border-[#2d7d32] hover:bg-[#f5f5f5]"
            }`}
          >
            <ShoppingCart size={20} /> Orders
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === "products" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#2d7d32]">Manage Products</h2>
              <Button
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({ name: "", description: "", price: "", unit: "", imageUrl: "", stock: "" });
                  setShowProductForm(!showProductForm);
                }}
                className="bg-[#f57c00] hover:bg-[#e67e22] text-white"
              >
                <Plus size={18} className="mr-2" /> Add Product
              </Button>
            </div>

            {/* Product Form */}
            {showProductForm && (
              <Card className="p-6 mb-6 bg-white">
                <h3 className="text-xl font-bold text-[#2d7d32] mb-4">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h3>
                <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="Product Name"
                    value={productForm.name}
                    onChange={handleProductFormChange}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#2d7d32] focus:outline-none"
                    required
                  />
                  <input
                    type="text"
                    name="unit"
                    placeholder="Unit (e.g., kg, cup)"
                    value={productForm.unit}
                    onChange={handleProductFormChange}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#2d7d32] focus:outline-none"
                    required
                  />
                  <input
                    type="number"
                    name="price"
                    placeholder="Price"
                    step="0.01"
                    value={productForm.price}
                    onChange={handleProductFormChange}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#2d7d32] focus:outline-none"
                    required
                  />
                  <input
                    type="number"
                    name="stock"
                    placeholder="Stock Quantity"
                    value={productForm.stock}
                    onChange={handleProductFormChange}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#2d7d32] focus:outline-none"
                    required
                  />
                  <input
                    type="url"
                    name="imageUrl"
                    placeholder="Image URL"
                    value={productForm.imageUrl}
                    onChange={handleProductFormChange}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#2d7d32] focus:outline-none md:col-span-2"
                    required
                  />
                  <textarea
                    name="description"
                    placeholder="Product Description"
                    value={productForm.description}
                    onChange={handleProductFormChange}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#2d7d32] focus:outline-none md:col-span-2 min-h-[100px]"
                    required
                  />
                  <div className="md:col-span-2 flex gap-4">
                    <Button type="submit" className="flex-1 bg-[#2d7d32] hover:bg-[#1b5e20] text-white">
                      {editingProduct ? "Update Product" : "Create Product"}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowProductForm(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Products List */}
            {productsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-[#2d7d32]" size={40} />
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition">
                    <div className="h-40 bg-gray-200 overflow-hidden">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-[#2d7d32] mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-[#f57c00]">
                          ₦{parseFloat(product.price).toLocaleString()}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Stock: {product.stock}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEditProduct(product)}
                          size="sm"
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          <Edit2 size={14} className="mr-1" /> Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteProduct(product.id)}
                          size="sm"
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                        >
                          <Trash2 size={14} className="mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-gray-500">No products yet. Create your first product!</p>
              </Card>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div>
            <h2 className="text-2xl font-bold text-[#2d7d32] mb-6">Manage Orders</h2>

            {ordersLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-[#2d7d32]" size={40} />
              </div>
            ) : orders && orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#2d7d32] text-white">
                      <th className="px-4 py-3 text-left">Order ID</th>
                      <th className="px-4 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-left">Product</th>
                      <th className="px-4 py-3 text-left">Quantity</th>
                      <th className="px-4 py-3 text-left">Total Price</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const product = products?.find((p) => p.id === order.productId);
                      return (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold">#{order.id}</td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              <p className="font-semibold">{order.customerName}</p>
                              <p className="text-gray-500">{order.customerPhone}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">{product?.name || "Unknown"}</td>
                          <td className="px-4 py-3">{order.quantity}</td>
                          <td className="px-4 py-3 font-bold text-[#f57c00]">
                            ₦{parseFloat(order.totalPrice).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(
                                  order.id,
                                  e.target.value as "pending" | "confirmed" | "delivered"
                                )
                              }
                              className={`px-3 py-1 rounded-full text-sm font-semibold border-none cursor-pointer ${
                                order.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : order.status === "confirmed"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="delivered">Delivered</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={`mailto:${order.customerEmail}`}
                              className="text-blue-500 hover:underline text-sm"
                            >
                              Email
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-gray-500">No orders yet. Customers will see their orders here!</p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
