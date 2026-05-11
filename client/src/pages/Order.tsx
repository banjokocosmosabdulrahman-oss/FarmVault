import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "../../../drizzle/schema";

export default function Order() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const productId = parseInt(params.get("productId") || "0");

  const { data: products } = trpc.products.list.useQuery();
  const createOrderMutation = trpc.orders.create.useMutation();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    if (products && productId > 0) {
      const product = products.find((p) => p.id === productId);
      setSelectedProduct(product || null);
    }
  }, [products, productId]);

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    const product = products?.find((p) => p.id === id);
    setSelectedProduct(product || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) {
      toast.error("Please select a product");
      return;
    }

    if (quantity <= 0 || quantity > selectedProduct.stock) {
      toast.error(`Please enter a valid quantity (1-${selectedProduct.stock})`);
      return;
    }

    if (!customerName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!customerEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }

    if (!customerPhone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    setIsSubmitting(true);

    try {
      const totalPrice = (parseFloat(selectedProduct.price) * quantity).toFixed(2);

      await createOrderMutation.mutateAsync({
        productId: selectedProduct.id,
        customerName,
        customerEmail,
        customerPhone,
        quantity,
        totalPrice,
      });

      setOrderSuccess(true);
      toast.success("Order submitted successfully! We'll contact you soon.");

      setTimeout(() => {
        setLocation("/");
      }, 3000);
    } catch (error) {
      console.error("Order submission error:", error);
      toast.error("Failed to submit order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4 py-8">
        <Card className="max-w-md w-full p-6 md:p-8 text-center">
          <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
          <h1 className="text-2xl md:text-3xl font-bold text-[#2d7d32] mb-2">Order Submitted!</h1>
          <p className="text-sm md:text-base text-gray-600 mb-6">
            Thank you for your order. We'll contact you shortly at {customerPhone} to confirm your order and arrange delivery.
          </p>
          <Button onClick={() => setLocation("/")} className="w-full bg-[#2d7d32] hover:bg-[#1b5e20] text-sm md:text-base py-2 md:py-3">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] py-12 md:py-20 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-[#2d7d32] font-semibold hover:text-[#f57c00] transition mb-3 md:mb-4 text-sm md:text-base"
          >
            <ArrowLeft size={18} /> Back to Home
          </button>
          <h1 className="text-2xl md:text-4xl font-black text-[#2d7d32]">Place Your Order</h1>
          <p className="text-sm md:text-base text-gray-600 mt-2">Fill in the form below to order your farm-fresh produce</p>
        </div>

        {/* Order Form */}
        <Card className="p-4 md:p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Selection */}
            <div>
              <label className="block text-sm font-semibold text-[#2d7d32] mb-2">
                Select Product *
              </label>
              <select
                value={selectedProduct?.id || ""}
                onChange={handleProductChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#2d7d32] focus:outline-none"
                required
              >
                <option value="">-- Choose a product --</option>
                {products?.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ₦{parseFloat(product.price).toLocaleString()} per {product.unit}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Details */}
            {selectedProduct && (
              <div className="bg-[#f5f5f5] p-3 md:p-4 rounded-lg border-l-4 border-[#f57c00]">
                <p className="text-xs md:text-sm text-gray-600 mb-2">
                  <strong>Description:</strong> {selectedProduct.description}
                </p>
                <p className="text-xs md:text-sm text-gray-600">
                  <strong>Available Stock:</strong>{" "}
                  <span className={selectedProduct.stock > 0 ? "text-green-600" : "text-red-600"}>
                    {selectedProduct.stock} {selectedProduct.unit}
                  </span>
                </p>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-xs md:text-sm font-semibold text-[#2d7d32] mb-2">
                Quantity ({selectedProduct?.unit || "unit"}) *
              </label>
              <input
                type="number"
                min="1"
                max={selectedProduct?.stock || 1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 md:px-4 py-2 text-sm md:text-base border-2 border-gray-300 rounded-lg focus:border-[#2d7d32] focus:outline-none"
                required
              />
              {selectedProduct && (
                <p className="text-xs text-gray-500 mt-1">
                  Total: ₦{(parseFloat(selectedProduct.price) * quantity).toLocaleString()}
                </p>
              )}
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-xs md:text-sm font-semibold text-[#2d7d32] mb-2">
                Your Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-3 md:px-4 py-2 text-sm md:text-base border-2 border-gray-300 rounded-lg focus:border-[#2d7d32] focus:outline-none"
                required
              />
            </div>

            {/* Customer Email */}
            <div>
              <label className="block text-xs md:text-sm font-semibold text-[#2d7d32] mb-2">
                Your Email *
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-3 md:px-4 py-2 text-sm md:text-base border-2 border-gray-300 rounded-lg focus:border-[#2d7d32] focus:outline-none"
                required
              />
            </div>

            {/* Customer Phone */}
            <div>
              <label className="block text-xs md:text-sm font-semibold text-[#2d7d32] mb-2">
                Your Phone Number *
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+234 801 234 5678"
                className="w-full px-3 md:px-4 py-2 text-sm md:text-base border-2 border-gray-300 rounded-lg focus:border-[#2d7d32] focus:outline-none"
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || !selectedProduct}
              className="w-full bg-[#f57c00] hover:bg-[#e67e22] text-white font-semibold py-2 md:py-3 text-sm md:text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} /> Submitting...
                </>
              ) : (
                "Submit Order"
              )}
            </Button>
          </form>
        </Card>

        {/* Info Box */}
        <Card className="mt-6 p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>📞 Need help?</strong> You can also reach us on WhatsApp at +234 801 234 5678 or via email at hello@farmvault.ng
          </p>
        </Card>
      </div>
    </div>
  );
}
