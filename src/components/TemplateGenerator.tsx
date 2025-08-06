import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Sparkles, Download, Eye, Copy, AlertCircle, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { validatePrompt, sanitizeHTML, validateEmailHTML, createSafeErrorMessage, VALIDATION_LIMITS } from "@/lib/security";
import { apiClient, handleApiError, GenerateTemplateResponse, isAuthenticated } from "@/lib/api";

const TemplateGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState("");
  const [generationData, setGenerationData] = useState<GenerateTemplateResponse['data'] | null>(null);
  const { toast } = useToast();
  const isUserAuthenticated = isAuthenticated();

  const handleGenerate = async () => {
    try {
      // Check if user is authenticated
      if (!isUserAuthenticated) {
        toast({
          title: "Authentication required",
          description: "Please log in to generate email templates.",
          variant: "destructive"
        });
        return;
      }

      // Validate input
      const validation = validatePrompt(prompt);
      if (!validation.isValid) {
        toast({
          title: "Invalid input",
          description: validation.error,
          variant: "destructive"
        });
        return;
      }

      setIsGenerating(true);
      
      try {
        // Call real API to generate template
        const response = await apiClient.generateTemplate({
          prompt: prompt.trim(),
          emailType: 'newsletter', // Default for now
          responsive: true,
          includeImages: true,
        });

        // Sanitize and validate the generated HTML
        const sanitizedHTML = sanitizeHTML(response.data.template.htmlContent);
        const htmlValidation = validateEmailHTML(sanitizedHTML);
        
        if (!htmlValidation.isValid) {
          throw new Error(htmlValidation.error);
        }
        
        setGeneratedTemplate(sanitizedHTML);
        setGenerationData(response.data);
        setIsGenerating(false);
        
        toast({
          title: "Template generated! 🎉",
          description: `Used ${response.data.generation.tokensUsed.total} tokens. ${response.data.user.tokensRemaining} tokens remaining.`
        });
      } catch (apiError) {
        setIsGenerating(false);
        const errorMessage = handleApiError(apiError);
        
        toast({
          title: "Generation failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error) {
      setIsGenerating(false);
      toast({
        title: "Error",
        description: createSafeErrorMessage(error),
        variant: "destructive"
      });
    }
  };

  const handleCopyHTML = () => {
    navigator.clipboard.writeText(generatedTemplate);
    toast({
      title: "HTML copied!",
      description: "The template HTML has been copied to your clipboard."
    });
  };

  const handleDownload = () => {
    const blob = new Blob([generatedTemplate], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'email-template.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Template downloaded!",
      description: "The HTML file has been saved to your downloads folder."
    });
  };

  const handleSaveTemplate = async () => {
    if (!isUserAuthenticated || !generatedTemplate || !generationData) {
      toast({
        title: "Unable to save",
        description: "Please log in and generate a template first.",
        variant: "destructive"
      });
      return;
    }

    try {
      const templateTitle = `Generated Template - ${new Date().toLocaleDateString()}`;
      
      await apiClient.saveTemplate({
        title: templateTitle,
        description: `Generated from prompt: "${prompt.substring(0, 100)}..."`,
        htmlContent: generatedTemplate,
        subject: generationData.template.subject,
        previewText: generationData.template.previewText,
        templateType: generationData.template.templateType,
        industry: generationData.template.industry,
        prompt,
        aiModel: generationData.generation.model,
        tokensUsed: generationData.generation.tokensUsed.total,
        tags: ['ai-generated'],
      });

      toast({
        title: "Template saved! 💾",
        description: "Your template has been saved to your template library."
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: handleApiError(error),
        variant: "destructive"
      });
    }
  };

  return (
    <section id="generator" className="py-24 px-6 bg-brand-gradient-subtle">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Generate Your Template
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Describe your email design and let AI create a professional template for you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generator Form */}
          <Card className="p-8">
            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-brand-purple" />
              Describe Your Email
            </h3>
            
            <Textarea
              placeholder="Example: Create a welcome email for a fitness app with a bright, energetic design. Include a hero image, welcome message, app download buttons, and social media links. Use purple and blue colors."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-32 mb-6"
              maxLength={VALIDATION_LIMITS.PROMPT_MAX_LENGTH}
            />
            <div className="text-sm text-muted-foreground mb-6">
              {prompt.length}/{VALIDATION_LIMITS.PROMPT_MAX_LENGTH} characters
            </div>
            
            {!isUserAuthenticated && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">Authentication Required</p>
                  <p className="text-sm text-yellow-600">Please log in to generate AI-powered email templates.</p>
                </div>
              </div>
            )}

            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !isUserAuthenticated}
              className="w-full"
              variant="hero"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Template
                </>
              )}
            </Button>

            {generationData && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-brand-purple" />
                  <span className="text-sm font-medium">Generation Info</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>Model: {generationData.generation.model.split('.').pop()}</div>
                  <div>Tokens: {generationData.generation.tokensUsed.total}</div>
                  <div>Time: {(generationData.generation.generationTime / 1000).toFixed(1)}s</div>
                  <div>Remaining: {generationData.user.tokensRemaining}</div>
                </div>
              </div>
            )}
          </Card>

          {/* Preview/Output */}
          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold flex items-center gap-2">
                <Eye className="h-6 w-6 text-brand-purple" />
                Preview
              </h3>
              
              {generatedTemplate && (
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={handleCopyHTML}>
                    <Copy className="h-4 w-4" />
                    Copy HTML
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  {isUserAuthenticated && (
                    <Button variant="outline" size="sm" onClick={handleSaveTemplate}>
                      <Sparkles className="h-4 w-4" />
                      Save Template
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {generatedTemplate ? (
              <div className="border rounded-lg overflow-hidden bg-white">
                <iframe
                  srcDoc={generatedTemplate}
                  className="w-full h-96 border-none"
                  title="Email Template Preview"
                  sandbox="allow-same-origin"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="h-96 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Your generated template will appear here</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};

export default TemplateGenerator;