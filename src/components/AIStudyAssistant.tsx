import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain, BookOpen, HelpCircle, FileQuestion, FileText, Layers, Lightbulb, AlertCircle, ExternalLink } from 'lucide-react';
import gemini, { validateApiKey, handleGeminiError } from '@/integrations/gemini/client';

interface AIStudyAssistantProps {
  subject?: string;
}

type AssistantMode = 'explanation' | 'practice' | 'summary' | 'flashcards' | 'strategy';

const AIStudyAssistant: React.FC<AIStudyAssistantProps> = ({ subject }) => {
  const [mode, setMode] = useState<AssistantMode>('explanation');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Get mode-specific prompt
  const getModePrompt = (userQuery: string, mode: AssistantMode, subject?: string): string => {
    const subjectContext = subject ? `for the subject: ${subject}` : '';
    
    switch (mode) {
      case 'explanation':
        return `Explain the following concept ${subjectContext} in a clear, concise way with examples:\n\n${userQuery}`;
      case 'practice':
        return `Generate 3-5 practice questions ${subjectContext} about:\n\n${userQuery}\n\nInclude answers and explanations.`;
      case 'summary':
        return `Summarize the following information ${subjectContext} into key points and concepts:\n\n${userQuery}`;
      case 'flashcards':
        return `Create 5 flashcards ${subjectContext} about:\n\n${userQuery}\n\nFormat as Term: Definition pairs.`;
      case 'strategy':
        return `Suggest effective learning strategies ${subjectContext} for mastering:\n\n${userQuery}`;
      default:
        return userQuery;
    }
  };

  // Get mode-specific icon
  const getModeIcon = (mode: AssistantMode) => {
    switch (mode) {
      case 'explanation':
        return <HelpCircle className="h-5 w-5" />;
      case 'practice':
        return <FileQuestion className="h-5 w-5" />;
      case 'summary':
        return <FileText className="h-5 w-5" />;
      case 'flashcards':
        return <Layers className="h-5 w-5" />;
      case 'strategy':
        return <Lightbulb className="h-5 w-5" />;
      default:
        return <Brain className="h-5 w-5" />;
    }
  };

  // Get mode title
  const getModeTitle = (mode: AssistantMode): string => {
    switch (mode) {
      case 'explanation': return 'Ask for Explanations';
      case 'practice': return 'Generate Practice Questions';
      case 'summary': return 'Summarize Complex Topics';
      case 'flashcards': return 'Create Flashcards';
      case 'strategy': return 'Get Learning Strategies';
      default: return 'AI Study Assistant';
    }
  };

  // Handle mode change
  const handleModeChange = (newMode: AssistantMode) => {
    setMode(newMode);
    setResult('');
    setError('');
  };

  // Check API key on component mount
  useEffect(() => {
    const keyValidation = validateApiKey();
    if (!keyValidation.valid) {
      setError(`Gemini API key error: ${keyValidation.error}. Please check your .env file.`);
    }
  }, []);

  // Retry function with exponential backoff
  const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3, initialDelay = 1000) => {
    let retries = 0;
    let delay = initialDelay;
    
    while (retries < maxRetries) {
      try {
        return await fn();
      } catch (error: any) {
        // If it's not a rate limit error, throw immediately
        if (error.response?.status !== 429) {
          throw error;
        }
        
        // If we've reached max retries, throw the error
        if (retries === maxRetries - 1) {
          throw error;
        }
        
        // Wait for the delay period
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Increase the delay for next retry (exponential backoff)
        delay *= 2;
        retries++;
        
        // Update UI to show retry attempt
        setError(`Rate limit reached. Retrying (${retries}/${maxRetries})...`);
      }
    }
  };

  // Handle query submission
  const handleSubmit = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Validate Gemini API key
      const keyValidation = validateApiKey();
      if (!keyValidation.valid) {
        throw new Error(`Gemini API key error: ${keyValidation.error}`);
      }

      const prompt = getModePrompt(query, mode, subject);
      
      // Use retry with backoff for API calls
      const response = await retryWithBackoff(async () => {
        return await gemini.chat.completions.create({
          messages: [
            { role: 'system', content: 'You are an expert study assistant helping students learn effectively.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      setResult(content);
    } catch (err: any) {
      console.error('Error using AI assistant:', err);
      
      // Use the enhanced error handler
      const errorInfo = handleGeminiError(err);
      
      switch(errorInfo.type) {
        case 'rate_limit':
          setError(`${errorInfo.message} This happens when too many requests are made to the Gemini API. You can: 1) Wait a few minutes and try again, 2) Get your own API key from Google AI Studio, or 3) Upgrade to a paid Google Cloud plan for higher limits.`);
          break;
        case 'auth_error':
          setError(`${errorInfo.message} Please check your API key in the .env file. If you don't have an API key, you can get one from Google AI Studio.`);
          break;
        case 'server_error':
          setError(`${errorInfo.message} This is an issue with Google's servers and not with your request.`);
          break;
        case 'network_error':
          setError(`${errorInfo.message} Please check your internet connection and try again when your connection is stable.`);
          break;
        default:
          if (err.message.includes('API key')) {
            setError('Gemini API key error: Please check your API key configuration in the .env file. You can get an API key from Google AI Studio.');
          } else {
            setError(`Failed to get a response: ${errorInfo.message}. Please try again later.`);
          }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-card bg-gradient-card border-0 w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <CardTitle>AI Study Assistant</CardTitle>
          </div>
          {subject && (
            <Badge variant="outline" className="bg-primary/10">
              {subject}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge 
              variant={mode === 'explanation' ? 'default' : 'outline'}
              className="cursor-pointer flex gap-1 items-center"
              onClick={() => handleModeChange('explanation')}
            >
              <HelpCircle className="h-3 w-3" /> Ask for explanations
            </Badge>
            <Badge 
              variant={mode === 'practice' ? 'default' : 'outline'}
              className="cursor-pointer flex gap-1 items-center"
              onClick={() => handleModeChange('practice')}
            >
              <FileQuestion className="h-3 w-3" /> Generate practice questions
            </Badge>
            <Badge 
              variant={mode === 'summary' ? 'default' : 'outline'}
              className="cursor-pointer flex gap-1 items-center"
              onClick={() => handleModeChange('summary')}
            >
              <FileText className="h-3 w-3" /> Summarize complex topics
            </Badge>
            <Badge 
              variant={mode === 'flashcards' ? 'default' : 'outline'}
              className="cursor-pointer flex gap-1 items-center"
              onClick={() => handleModeChange('flashcards')}
            >
              <Layers className="h-3 w-3" /> Create flashcards
            </Badge>
            <Badge 
              variant={mode === 'strategy' ? 'default' : 'outline'}
              className="cursor-pointer flex gap-1 items-center"
              onClick={() => handleModeChange('strategy')}
            >
              <Lightbulb className="h-3 w-3" /> Get learning strategies
            </Badge>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {getModeIcon(mode)}
                <h3 className="font-medium">{getModeTitle(mode)}</h3>
              </div>
              <Textarea 
                placeholder={`Enter your query for ${getModeTitle(mode).toLowerCase()}...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || !query.trim()}
              className="w-full relative"
            >
              {isLoading ? (
                <>
                  <span className="animate-pulse">Processing</span>
                  <span className="animate-pulse delay-100">.</span>
                  <span className="animate-pulse delay-200">.</span>
                  <span className="animate-pulse delay-300">.</span>
                </>
              ) : 'Get AI Response'}
            </Button>
            
            {error && (
              <div className="p-3 mt-2 bg-destructive/10 text-destructive rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <p className="text-sm font-medium">Error</p>
                </div>
                <p className="text-sm ml-6">{error}</p>
                
                {error.includes('rate limit') && (
                  <div className="mt-3 ml-6 p-2 bg-background/50 rounded border border-border">
                    <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Get your own API key
                    </h4>
                    <ol className="text-xs space-y-1 ml-5 list-decimal">
                      <li>Go to <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a> and create an account</li>
                      <li>Navigate to the API Keys section and create a new API key</li>
                      <li>Add your API key to the .env file as VITE_GEMINI_API_KEY=your-key-here</li>
                      <li>Restart the application</li>
                    </ol>
                  </div>
                )}
              </div>
            )}
            
            {result && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">AI Response</h3>
                </div>
                <div className="whitespace-pre-line">{result}</div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIStudyAssistant;