import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AIStudyAssistant from '@/components/AIStudyAssistant';

const AIAssistant: React.FC = () => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState<string>('');

  return (
    <div className="min-h-screen bg-gradient-accent p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div 
            className="flex items-center justify-center gap-3 mb-4 cursor-pointer" 
            onClick={() => navigate('/')}
            title="Back to Home"
          >
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">StudyGenie</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Your AI-powered study assistant
          </p>
        </div>

        {/* Back button */}
        <Button 
          variant="ghost" 
          className="mb-6 flex items-center gap-2"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* AI Study Assistant */}
        <AIStudyAssistant subject={subject || undefined} />
      </div>
    </div>
  );
};

export default AIAssistant;