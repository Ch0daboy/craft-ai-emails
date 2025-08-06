import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isAuthenticated, apiClient, clearAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import AuthDialog from "./AuthDialog";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = isAuthenticated();
      setIsUserAuthenticated(authenticated);
      
      if (authenticated) {
        try {
          const profile = await apiClient.getProfile();
          setUserEmail(profile.data.user.email);
        } catch (error) {
          // If profile fetch fails, user might not be properly authenticated
          clearAuth();
          setIsUserAuthenticated(false);
        }
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      clearAuth();
      setIsUserAuthenticated(false);
      setUserEmail("");
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account.",
      });
      window.location.reload();
    } catch (error) {
      // Even if logout fails, clear local auth
      clearAuth();
      setIsUserAuthenticated(false);
      setUserEmail("");
      window.location.reload();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/10 border-b border-white/20">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-gradient rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">EC</span>
            </div>
            <span className="text-xl font-bold text-white">EmailCraft AI</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {isUserAuthenticated && (
              <button 
                onClick={() => navigate("/dashboard")} 
                className={`text-white/80 hover:text-white transition-colors ${location.pathname === '/dashboard' ? 'text-white font-semibold' : ''}`}
              >
                Dashboard
              </button>
            )}
            {location.pathname !== '/' ? (
              <button 
                onClick={() => navigate("/")} 
                className="text-white/80 hover:text-white transition-colors"
              >
                Generator
              </button>
            ) : (
              <>
                <a href="#features" className="text-white/80 hover:text-white transition-colors">
                  Features
                </a>
                <a href="#templates" className="text-white/80 hover:text-white transition-colors">
                  Templates
                </a>
                <a href="#pricing" className="text-white/80 hover:text-white transition-colors">
                  Pricing
                </a>
                <a href="#docs" className="text-white/80 hover:text-white transition-colors">
                  Docs
                </a>
              </>
            )}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isUserAuthenticated ? (
              <>
                <span className="text-white/80 text-sm">
                  {userEmail}
                </span>
                {location.pathname !== '/dashboard' && (
                  <Button 
                    variant="ghost" 
                    className="text-white hover:bg-white/10"
                    onClick={() => navigate("/dashboard")}
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/10"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <AuthDialog>
                  <Button variant="ghost" className="text-white hover:bg-white/10">
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </AuthDialog>
                <AuthDialog>
                  <Button variant="glass">
                    Start Free Trial
                  </Button>
                </AuthDialog>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white p-2"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/20">
            <nav className="flex flex-col gap-4 mt-4">
              {isUserAuthenticated && (
                <button 
                  onClick={() => navigate("/dashboard")} 
                  className={`text-white/80 hover:text-white transition-colors text-left ${location.pathname === '/dashboard' ? 'text-white font-semibold' : ''}`}
                >
                  Dashboard
                </button>
              )}
              {location.pathname !== '/' ? (
                <button 
                  onClick={() => navigate("/")} 
                  className="text-white/80 hover:text-white transition-colors text-left"
                >
                  Generator
                </button>
              ) : (
                <>
                  <a href="#features" className="text-white/80 hover:text-white transition-colors">
                    Features
                  </a>
                  <a href="#templates" className="text-white/80 hover:text-white transition-colors">
                    Templates
                  </a>
                  <a href="#pricing" className="text-white/80 hover:text-white transition-colors">
                    Pricing
                  </a>
                  <a href="#docs" className="text-white/80 hover:text-white transition-colors">
                    Docs
                  </a>
                </>
              )}
              <div className="flex flex-col gap-2 pt-4 border-t border-white/20">
                {isUserAuthenticated ? (
                  <>
                    <div className="text-white/80 text-sm px-2 py-1">
                      {userEmail}
                    </div>
                    {location.pathname !== '/dashboard' && (
                      <Button 
                        variant="ghost" 
                        className="text-white hover:bg-white/10 justify-start"
                        onClick={() => navigate("/dashboard")}
                      >
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Dashboard
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      className="text-white hover:bg-white/10 justify-start"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <AuthDialog>
                      <Button variant="ghost" className="text-white hover:bg-white/10 justify-start">
                        <User className="h-4 w-4 mr-2" />
                        Sign In
                      </Button>
                    </AuthDialog>
                    <AuthDialog>
                      <Button variant="glass" className="justify-start">
                        Start Free Trial
                      </Button>
                    </AuthDialog>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;