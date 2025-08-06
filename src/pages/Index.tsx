import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import TemplateGenerator from "@/components/TemplateGenerator";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Features />
      <TemplateGenerator />
    </div>
  );
};

export default Index;
