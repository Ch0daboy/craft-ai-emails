import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Heart, 
  Download, 
  Copy,
  Filter,
  Sparkles,
  Calendar,
  Mail,
  Star,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient, handleApiError, Template, isAuthenticated } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";

const Dashboard = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [userStats, setUserStats] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
      return;
    }
    loadDashboardData();
  }, [navigate]);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, selectedFilter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [templatesResponse, statsResponse] = await Promise.all([
        apiClient.getTemplates({ limit: 50, sortBy: 'updatedAt', sortOrder: 'desc' }),
        apiClient.getUserStats()
      ]);

      setTemplates(templatesResponse.data.templates);
      setUserStats(statsResponse.data.stats);
    } catch (error) {
      toast({
        title: "Failed to load dashboard",
        description: handleApiError(error),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(template => 
        template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.templateType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedFilter !== "all") {
      if (selectedFilter === "favorites") {
        filtered = filtered.filter(template => template.isFavorite);
      } else {
        filtered = filtered.filter(template => template.templateType === selectedFilter);
      }
    }

    setFilteredTemplates(filtered);
  };

  const handleToggleFavorite = async (templateId: string) => {
    try {
      await apiClient.toggleFavorite(templateId);
      setTemplates(prev => prev.map(template => 
        template.id === templateId 
          ? { ...template, isFavorite: !template.isFavorite }
          : template
      ));
      toast({
        title: "Favorite updated",
        description: "Template favorite status has been updated."
      });
    } catch (error) {
      toast({
        title: "Failed to update favorite",
        description: handleApiError(error),
        variant: "destructive"
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string, templateTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${templateTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.deleteTemplate(templateId);
      setTemplates(prev => prev.filter(template => template.id !== templateId));
      toast({
        title: "Template deleted",
        description: `"${templateTitle}" has been deleted successfully.`
      });
    } catch (error) {
      toast({
        title: "Failed to delete template",
        description: handleApiError(error),
        variant: "destructive"
      });
    }
  };

  const handleDownloadTemplate = (template: Template) => {
    const blob = new Blob([template.htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Template downloaded",
      description: `"${template.title}" has been saved to your downloads.`
    });
  };

  const handleCopyHTML = (template: Template) => {
    navigator.clipboard.writeText(template.htmlContent);
    toast({
      title: "HTML copied",
      description: `Template HTML for "${template.title}" has been copied to clipboard.`
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTemplateTypes = () => {
    const types = [...new Set(templates.map(t => t.templateType))];
    return types;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
                <p className="text-gray-600">Manage your email templates and track your usage</p>
              </div>
              <Button onClick={() => navigate("/")} variant="hero">
                <Plus className="h-4 w-4 mr-2" />
                Create New Template
              </Button>
            </div>

            {/* Stats Overview */}
            {userStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Templates</p>
                      <p className="text-2xl font-bold text-gray-900">{userStats.totalTemplates}</p>
                    </div>
                    <Mail className="h-8 w-8 text-brand-purple" />
                  </div>
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Favorites</p>
                      <p className="text-2xl font-bold text-gray-900">{userStats.favoriteTemplates}</p>
                    </div>
                    <Heart className="h-8 w-8 text-red-500" />
                  </div>
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tokens Used</p>
                      <p className="text-2xl font-bold text-gray-900">{userStats.tokensUsed}</p>
                      <p className="text-xs text-gray-500">of {userStats.tokenLimit}</p>
                    </div>
                    <Sparkles className="h-8 w-8 text-yellow-500" />
                  </div>
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Subscription</p>
                      <p className="text-2xl font-bold text-gray-900 capitalize">{userStats.subscriptionTier}</p>
                    </div>
                    <Star className="h-8 w-8 text-brand-purple" />
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-white"
              >
                <option value="all">All Templates</option>
                <option value="favorites">Favorites</option>
                {getTemplateTypes().map(type => (
                  <option key={type} value={type} className="capitalize">
                    {type.replace(/([A-Z])/g, ' $1').trim()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Templates Grid */}
          {filteredTemplates.length === 0 ? (
            <Card className="p-12 text-center">
              <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || selectedFilter !== "all" ? "No templates found" : "No templates yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedFilter !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "Create your first email template to get started"
                }
              </p>
              {!searchTerm && selectedFilter === "all" && (
                <Button onClick={() => navigate("/")} variant="hero">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Template
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                        {template.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {template.description || "No description"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFavorite(template.id)}
                      className="p-1 h-8 w-8"
                    >
                      <Heart 
                        className={`h-4 w-4 ${template.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
                      />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="text-xs">
                      {template.templateType.replace(/([A-Z])/g, ' $1').trim()}
                    </Badge>
                    {template.industry && (
                      <Badge variant="outline" className="text-xs">
                        {template.industry}
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(template.updatedAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        {template.usageCount} uses
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyHTML(template)}
                          title="Copy HTML"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadTemplate(template)}
                          title="Download HTML"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id, template.title)}
                          title="Delete template"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;