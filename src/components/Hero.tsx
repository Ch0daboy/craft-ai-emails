import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";

const Hero = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-brand-gradient opacity-80" />
      
      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center text-white">
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">AI-Powered Email Templates</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Create Stunning{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
            Email Templates
          </span>{" "}
          with AI
        </h1>
        
        <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
          Transform your ideas into professional, responsive email templates in seconds. 
          Just describe what you want, and watch AI craft the perfect design.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button variant="glass" size="lg" className="group">
            Start Creating Free
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button variant="ghost" size="lg" className="text-white hover:bg-white/10">
            Watch Demo
          </Button>
        </div>
        
        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
            <Zap className="h-4 w-4 text-yellow-300" />
            <span>Generate in seconds</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
            <span>📱</span>
            <span>Mobile responsive</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
            <span>✉️</span>
            <span>Email client compatible</span>
          </div>
        </div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-white/5 rounded-lg backdrop-blur-sm animate-pulse" />
      <div className="absolute bottom-32 right-16 w-16 h-16 bg-white/5 rounded-full backdrop-blur-sm animate-pulse" />
      <div className="absolute top-1/3 right-8 w-12 h-12 bg-white/5 rounded-lg backdrop-blur-sm animate-pulse" />
    </div>
  );
};

export default Hero;