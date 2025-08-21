import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, BookOpen, Target, RefreshCw, Brain, Calculator, Atom, Beaker, BookText, History, Languages, Code, Lightbulb, Sparkles } from 'lucide-react';

interface StudySession {
  day: string;
  date: string;
  subject: string;
  hours: number;
  notes: string;
  priority: 'high' | 'medium' | 'low';
  resources?: string; // Optional field for AI tool recommendations
}

interface StudyDashboardProps {
  studyPlan: StudySession[];
  motivationalTip: string;
  onRegenerate: () => void;
  onBackToHome: () => void;
}

const StudyDashboard: React.FC<StudyDashboardProps> = ({ 
  studyPlan, 
  motivationalTip, 
  onRegenerate,
  onBackToHome
}) => {
  const navigate = useNavigate();
  const totalHours = studyPlan.reduce((total, session) => total + session.hours, 0);
  const uniqueSubjects = [...new Set(studyPlan.map(session => session.subject))];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };
  
  // Get subject-specific icon based on subject name
  const getSubjectIcon = (subject: string) => {
    const subjectLower = subject.toLowerCase().trim();
    
    if (subjectLower.includes('math')) {
      return <Calculator className="h-4 w-4 text-primary" />;
    } else if (subjectLower.includes('physics')) {
      return <Atom className="h-4 w-4 text-primary" />;
    } else if (subjectLower.includes('chemistry')) {
      return <Beaker className="h-4 w-4 text-primary" />;
    } else if (subjectLower.includes('biology')) {
      return <Atom className="h-4 w-4 text-primary" />;
    } else if (subjectLower.includes('history') || subjectLower.includes('social')) {
      return <History className="h-4 w-4 text-primary" />;
    } else if (subjectLower.includes('english') || subjectLower.includes('literature') || subjectLower.includes('lang')) {
      return <BookText className="h-4 w-4 text-primary" />;
    } else if (subjectLower.includes('computer') || subjectLower.includes('programming') || subjectLower.includes('coding')) {
      return <Code className="h-4 w-4 text-primary" />;
    } else {
      return <Lightbulb className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-accent p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div 
        className="flex items-center justify-center gap-3 mb-4 cursor-pointer" 
        onClick={onBackToHome}
        title="Back to Home"
      >
        <Brain className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">StudyGenie</h1>
      </div>
          <p className="text-muted-foreground text-lg">
            Your personalized AI-generated study schedule
          </p>
        </div>

        {/* AI Assistant Button */}
        <div className="mb-8 flex justify-center">
          <Button 
            onClick={() => navigate('/ai-assistant')} 
            className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 px-6 py-6"
            size="lg"
          >
            <Sparkles className="h-5 w-5" />
            <span className="font-medium text-lg">Open AI Study Assistant</span>
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-card bg-gradient-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalHours}</p>
                  <p className="text-muted-foreground">Total Study Hours</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card bg-gradient-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{uniqueSubjects.length}</p>
                  <p className="text-muted-foreground">Subjects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card bg-gradient-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{studyPlan.length}</p>
                  <p className="text-muted-foreground">Study Days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Study Schedule */}
        <Card className="shadow-elegant bg-gradient-card border-0 mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Your Study Schedule
            </CardTitle>
            <Button variant="accent" onClick={onRegenerate} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Regenerate Plan
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-4 font-semibold text-foreground">Day</th>
                    <th className="text-left p-4 font-semibold text-foreground">Date</th>
                    <th className="text-left p-4 font-semibold text-foreground">Subject</th>
                    <th className="text-left p-4 font-semibold text-foreground">Hours</th>
                    <th className="text-left p-4 font-semibold text-foreground">Priority</th>
                    <th className="text-left p-4 font-semibold text-foreground">Notes</th>
                    <th className="text-left p-4 font-semibold text-foreground">AI Resources</th>
                  </tr>
                </thead>
                <tbody>
                  {studyPlan.map((session, index) => (
                    <tr key={index} className="border-b border-border/30 hover:bg-accent/50 transition-colors">
                      <td className="p-4 font-medium text-foreground">{session.day}</td>
                      <td className="p-4 text-muted-foreground">{session.date}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {/* Split multiple subjects and display them with badges and subject-specific icons */}
                            {session.subject.split(',').map((subj, i) => (
                              <span key={i} className="inline-block">
                                {i > 0 && <span className="mx-1">&</span>}
                                <Badge variant="outline" className="mr-1 bg-primary/10 flex items-center gap-1">
                                  {getSubjectIcon(subj)}
                                  <span>{subj.trim()}</span>
                                </Badge>
                              </span>
                            ))}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="text-foreground">{session.hours}h</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={getPriorityColor(session.priority) as any}>
                          {session.priority}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground max-w-md">
                        {/* Format notes with better readability */}
                        {session.notes.split('.').map((note, i) => (
                          note.trim() && (
                            <div key={i} className="mb-1">
                              • {note.trim().replace(/\.$/, '')}
                            </div>
                          )
                        ))}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {session.resources ? (
                          <div className="max-w-md">
                            {session.resources.split(',').map((resource, i) => (
                              <div key={i} className="mb-1 flex items-center gap-1">
                                <Brain className="h-3 w-3 text-primary" />
                                <span>{resource.trim()}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span>No AI resources available</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Motivational Section with AI Focus */}
        <Card className="shadow-elegant bg-gradient-hero border-0 text-white">
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-90" />
              <h3 className="text-xl font-bold mb-2">AI-Powered Study Tip</h3>
            </div>
            <p className="text-lg opacity-90 leading-relaxed max-w-2xl mx-auto">
              {motivationalTip}
            </p>
            <div className="mt-6 pt-6 border-t border-white/20">
              <h4 className="text-lg font-semibold mb-3">AI Study Assistant</h4>
              <p className="opacity-80 mb-4">Use AI to enhance your learning experience:</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Badge 
                  variant="outline" 
                  className="bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-sm py-2 px-3"
                  onClick={() => navigate('/ai-assistant')}
                >
                  Ask for explanations
                </Badge>
                <Badge 
                  variant="outline" 
                  className="bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-sm py-2 px-3"
                  onClick={() => navigate('/ai-assistant')}
                >
                  Generate practice questions
                </Badge>
                <Badge 
                  variant="outline" 
                  className="bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-sm py-2 px-3"
                  onClick={() => navigate('/ai-assistant')}
                >
                  Summarize complex topics
                </Badge>
                <Badge 
                  variant="outline" 
                  className="bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-sm py-2 px-3"
                  onClick={() => navigate('/ai-assistant')}
                >
                  Create flashcards
                </Badge>
                <Badge 
                  variant="outline" 
                  className="bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-sm py-2 px-3"
                  onClick={() => navigate('/ai-assistant')}
                >
                  Get learning strategies
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudyDashboard;