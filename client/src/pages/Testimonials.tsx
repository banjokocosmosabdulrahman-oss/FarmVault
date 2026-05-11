import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Adekunle Okafor",
    role: "Home Chef",
    content: "The Ofada Rice from Farm Vault is absolutely premium quality! Perfect for traditional rice dishes and soups. Highly recommended!",
    rating: 5,
    avatar: "🧑‍🍳",
  },
  {
    name: "Chioma Nwosu",
    role: "Restaurant Owner",
    content: "I've been sourcing Garri from Farm Vault for 6 months now. Consistent quality, fresh products, and excellent customer service.",
    rating: 5,
    avatar: "👩‍💼",
  },
  {
    name: "Bayo Adeyemi",
    role: "Family Provider",
    content: "Farm Vault delivers exactly what they promise - natural taste from the soil. My family loves the products!",
    rating: 5,
    avatar: "👨‍👩‍👧‍👦",
  },
];

export default function Testimonials() {
  return (
    <section className="py-12 md:py-20 bg-gradient-to-b from-white to-[#f5f5f5] px-[5%]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-4xl font-black text-[#2d7d32] mb-3 md:mb-4">
            What Our Customers Say
          </h2>
          <p className="text-sm md:text-lg text-gray-600">
            Join thousands of satisfied customers enjoying premium farm produce
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-4 md:p-6 hover:shadow-lg transition">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl md:text-4xl">{testimonial.avatar}</span>
                <div>
                  <h3 className="font-bold text-sm md:text-base text-[#2d7d32]">
                    {testimonial.name}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>

              <div className="flex gap-1 mb-3">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className="fill-[#f57c00] text-[#f57c00]"
                  />
                ))}
              </div>

              <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                "{testimonial.content}"
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
