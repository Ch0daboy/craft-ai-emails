import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Sparkles, Download, Eye, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { validatePrompt, sanitizeHTML, validateEmailHTML, createSafeErrorMessage, VALIDATION_LIMITS } from "@/lib/security";

const TemplateGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState("");
  const { toast } = useToast();

  const handleGenerate = async () => {
    try {
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
      
      // Simulate API call - in real app, this would call AWS Bedrock
      setTimeout(() => {
        try {
          const mockHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Email Template</title>
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #8b5cf6, #3b82f6); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .content { padding: 40px 20px; }
        .cta { background: #8b5cf6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Our Newsletter!</h1>
        </div>
        <div class="content">
            <h2>Thank you for subscribing</h2>
            <p>We're excited to have you join our community. Get ready for amazing content, exclusive offers, and insider updates delivered straight to your inbox.</p>
            <a href="#" class="cta">Get Started</a>
            <p>Best regards,<br>The EmailCraft Team</p>
        </div>
    </div>
</body>
</html>`;
          
          // Sanitize and validate the generated HTML
          const sanitizedHTML = sanitizeHTML(mockHTML);
          const htmlValidation = validateEmailHTML(sanitizedHTML);
          
          if (!htmlValidation.isValid) {
            throw new Error(htmlValidation.error);
          }
          
          setGeneratedTemplate(sanitizedHTML);
          setIsGenerating(false);
          toast({
            title: "Template generated!",
            description: "Your email template is ready for preview and export."
          });
        } catch (error) {
          setIsGenerating(false);
          toast({
            title: "Generation failed",
            description: createSafeErrorMessage(error),
            variant: "destructive"
          });
        }
      }, 2000);
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
            
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
              variant="hero"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Template
                </>
              )}
            </Button>
          </Card>

          {/* Preview/Output */}
          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold flex items-center gap-2">
                <Eye className="h-6 w-6 text-brand-purple" />
                Preview
              </h3>
              
              {generatedTemplate && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyHTML}>
                    <Copy className="h-4 w-4" />
                    Copy HTML
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
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