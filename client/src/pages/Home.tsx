import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, MessageCircle, Phone, Mail, ShoppingBasket } from "lucide-react";
import { useLocation } from "wouter";
import type { Product } from "../../../drizzle/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: products, isLoading } = trpc.products.list.useQuery();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    // Scroll to products section if hash is present
    const hash = window.location.hash;
    if (hash === "#products") {
      setTimeout(() => {
        const element = document.getElementById("products");
        element?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, []);

  const handleOrderClick = (product: Product) => {
    setSelectedProduct(product);
    setLocation("/order?productId=" + product.id);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm shadow-md z-50 px-[5%] py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌾</span>
          <span className="font-bold text-xl text-[#2d7d32]">FARM VAULT</span>
        </div>
        <ul className="hidden md:flex gap-8">
          <li>
            <a href="#home" className="text-[#5d4037] font-semibold hover:text-[#2d7d32] transition">
              Home
            </a>
          </li>
          <li>
            <a href="#products" className="text-[#5d4037] font-semibold hover:text-[#2d7d32] transition">
              Our Products
            </a>
          </li>
          <li>
            <a href="#contact" className="text-[#5d4037] font-semibold hover:text-[#2d7d32] transition">
              Contact Us
            </a>
          </li>
        </ul>
      </nav>

      {/* Hero Section */}
      <section
        id="home"
        className="mt-20 min-h-[90vh] bg-gradient-to-br from-[#2d7d32]/90 to-[#f57c00]/80 flex items-center justify-center text-center text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 text-[20rem] opacity-5 animate-pulse">🌿</div>
        <div className="relative z-10 max-w-2xl px-4">
          <h1 className="text-5xl md:text-6xl font-black mb-4 animate-fadeInUp">Farm Vault</h1>
          <p className="text-2xl italic text-[#ffb300] mb-4">"...Natural taste from the Soil."</p>
          <p className="text-xl md:text-2xl mb-8 opacity-95">Premium Quality Farm Produce Delivered Fresh</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="#products" className="px-8 py-3 bg-[#f57c00] text-white rounded-full font-semibold hover:shadow-lg hover:-translate-y-1 transition flex items-center gap-2">
              <ShoppingBasket size={20} /> View Products
            </a>
            <a
              href="https://wa.me/2348168967790?text=Hello%20Farm%20Vault!%20I'm%20interested%20in%20your%20products."
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-white text-[#2d7d32] rounded-full font-semibold hover:bg-transparent hover:text-white border-2 border-white transition"
            >
              <MessageCircle size={20} className="inline mr-2" /> Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 bg-white px-[5%]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black text-[#2d7d32] text-center mb-2 relative inline-block left-1/2 -translate-x-1/2">
            What We Offer
            <div className="absolute bottom-[-15px] left-1/4 w-1/2 h-1 bg-gradient-to-r from-[#2d7d32] to-[#f57c00] rounded"></div>
          </h2>
          <p className="text-center text-[#5d4037] text-lg mt-8 mb-12">
            Farm-fresh produce harvested with care and delivered with love
          </p>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-[#2d7d32]" size={40} />
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-xl hover:-translate-y-2 transition">
                  <div className="h-48 bg-gray-200 overflow-hidden flex items-center justify-center">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<div class="text-gray-400 text-center">Image not available</div>';
                        }}
                      />
                    ) : (
                      <div className="text-gray-400 text-center">No image</div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-[#2d7d32] mb-2">{product.name}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{product.description}</p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xl font-bold text-[#2d7d32]">
                        ₦{parseFloat(product.price).toLocaleString()} per {product.unit}
                      </span>
                      <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                        product.stock > 0 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                      </span>
                    </div>
                    <Button
                      onClick={() => handleOrderClick(product)}
                      disabled={product.stock === 0}
                      className="w-full bg-[#f57c00] hover:bg-[#e67e22] text-white font-semibold"
                    >
                      Order Now
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No products available at the moment. Please check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-r from-[#2d7d32] to-[#4caf50] text-white px-[5%]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-4">Get In Touch</h2>
          <p className="text-lg mb-12 opacity-95">Ready to order? Send us a message directly on your preferred platform!</p>

          <div className="flex flex-col md:flex-row gap-6 justify-center mb-8">
            <a
              href="https://wa.me/2348168967790?text=Hello%20Farm%20Vault!%20I'm%20interested%20in%20your%20products.%20Please%20send%20me%20the%20price%20list."
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 p-6 bg-white/10 rounded-lg hover:bg-white/20 transition hover:scale-105"
            >
              <MessageCircle size={40} className="mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">WhatsApp</h3>
              <p className="text-sm opacity-90">Click to chat directly on WhatsApp for quick orders and inquiries</p>
            </a>

            <a
              href="mailto:banjokocosmosabdurahaman@gmail.com"
              className="flex-1 p-6 bg-white/10 rounded-lg hover:bg-white/20 transition hover:scale-105"
            >
              <Mail size={40} className="mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">Email</h3>
              <p className="text-sm opacity-90">Send us an email for inquiries and custom orders</p>
            </a>
          </div>

          <p className="text-sm opacity-80">
            <Phone size={16} className="inline mr-2" /> +2348168967790 |
            <Mail size={16} className="inline mx-2" /> banjokocosmosabdurahaman@gmail.com
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#5d4037] text-white py-8 px-[5%]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-6 text-sm">
            <a href="tel:+2348168967790" className="hover:text-[#ffb300] transition flex items-center gap-2">
              <Phone size={18} /> +2348168967790
            </a>
            <a href="mailto:banjokocosmosabdurahaman@gmail.com" className="hover:text-[#ffb300] transition flex items-center gap-2">
              <Mail size={18} /> banjokocosmosabdurahaman@gmail.com
            </a>
          </div>
          <p className="text-center md:text-right text-sm opacity-80">
            &copy; 2026 Farm Vault. All rights reserved. | Natural Taste from the Soil
          </p>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/2348168967790?text=Hello%20Farm%20Vault!"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 hover:scale-110 transition z-40 animate-pulse"
        title="Chat on WhatsApp"
      >
        <MessageCircle size={28} />
      </a>
    </div>
  );
}
