import { Card } from "@/components/ui/card";
import { Bot, Palette, Smartphone, Code, Zap, Shield } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI-Powered Generation",
    description: "Describe your email design in plain English and watch AI create professional templates instantly."
  },
  {
    icon: Palette,
    title: "Visual Customization",
    description: "Fine-tune colors, fonts, layouts, and branding with our intuitive visual editor."
  },
  {
    icon: Smartphone,
    title: "Mobile Responsive",
    description: "Every template automatically adapts perfectly to all screen sizes and devices."
  },
  {
    icon: Code,
    title: "Clean HTML Export",
    description: "Export production-ready HTML that works flawlessly across all major email clients."
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Generate templates in under 10 seconds. No more hours of manual coding and testing."
  },
  {
    icon: Shield,
    title: "Email Client Compatible",
    description: "Guaranteed compatibility with Gmail, Outlook, Apple Mail, and 40+ other clients."
  }
];

const Features = () => {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything you need to create{" "}
            <span className="text-transparent bg-clip-text bg-brand-gradient">
              perfect emails
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From AI generation to export, we've built every tool you need to create 
            professional email templates that convert.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-8 group hover:shadow-medium transition-all duration-300 hover:-translate-y-1 bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="mb-6">
                <div className="w-12 h-12 bg-brand-gradient-subtle rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-brand-purple" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;