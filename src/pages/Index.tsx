import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Calendar, Clock, Target, Sparkles, BookOpen, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import StudyPlanForm from '@/components/StudyPlanForm';
import StudyDashboard from '@/components/StudyDashboard';
import heroImage from '@/assets/hero-study.jpg';
import { generateStudyPlan } from '@/integrations/gemini/studyPlanService';

export interface Subject {
  id: string;
  name: string;
  deadline: Date | undefined;
}

export interface StudyFormData {
  subjects: Subject[];
  dailyHours: number;
}

// Legacy mock study plan function - kept as fallback
const generateMockStudyPlan = async (data: StudyFormData) => {
  // Use the OpenAI-powered study plan generator
  try {
    const aiGeneratedPlan = await generateStudyPlan(data);
    return aiGeneratedPlan;
  } catch (error) {
    console.error('Error generating AI study plan:', error);
    // If AI generation fails, we'll use the fallback implementation in the service
    // The service has its own fallback mechanism
    throw error;
  }
};

const Index = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'form' | 'dashboard'>('landing');
  const [studyData, setStudyData] = useState<any>(null);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Load saved study plans for authenticated users
  useEffect(() => {
    if (user) {
      loadSavedPlans();
    }
  }, [user]);

  const loadSavedPlans = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('study_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data && !error) {
      setSavedPlans(data);
    }
  };

  const handleGetStarted = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setCurrentView('form');
  };

  const handleFormSubmit = async (data: StudyFormData) => {
    try {
      // Set loading state if you have one
      // setIsLoading(true);
      
      const generatedPlan = await generateMockStudyPlan(data);
      
      // Save to database if user is authenticated
      if (user) {
        const { error } = await supabase
          .from('study_plans')
          .insert({
            user_id: user.id,
            subjects: JSON.parse(JSON.stringify(data.subjects)),
            daily_hours: data.dailyHours,
            plan_data: JSON.parse(JSON.stringify(generatedPlan.studyPlan)),
            motivational_tip: generatedPlan.motivationalTip,
          });
        
        if (!error) {
          loadSavedPlans(); // Refresh the saved plans
        }
      }
      
      setStudyData(generatedPlan);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error generating study plan:', error);
      alert('There was an error generating your study plan. Please try again.');
    } finally {
      // Reset loading state if you have one
      // setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    setCurrentView('form');
  };

  const handleBackToHome = () => {
    setCurrentView('landing');
    setStudyData(null);
  };

  const handleSignOut = async () => {
    await signOut();
    setCurrentView('landing');
    setStudyData(null);
    setSavedPlans([]);
  };

  const loadPreviousPlan = (plan: any) => {
    setStudyData({
      studyPlan: plan.plan_data,
      motivationalTip: plan.motivational_tip
    });
    setCurrentView('dashboard');
  };

  const handleDeletePlan = async (e: React.MouseEvent, planId: string) => {
    e.stopPropagation(); // Prevent triggering the card click
    console.log('Delete button clicked for plan ID:', planId);
    
    if (window.confirm('Are you sure you want to delete this study plan?')) {
      try {
        console.log('Attempting to delete plan with ID:', planId);
        
        // Remove the plan from the local state first for immediate UI feedback
        setSavedPlans(prevPlans => prevPlans.filter(plan => plan.id !== planId));
        
        // Then delete from the database
        const { error } = await supabase
          .from('study_plans')
          .delete()
          .eq('id', planId);
        
        if (error) {
          console.error('Error deleting plan:', error);
          alert('Failed to delete the study plan. Please try again.');
          // Reload the plans to restore the deleted plan in case of error
          loadSavedPlans();
        } else {
          console.log('Plan deleted successfully');
        }
      } catch (err) {
        console.error('Exception during delete operation:', err);
        alert('An unexpected error occurred. Please try again.');
        // Reload the plans to restore the deleted plan in case of error
        loadSavedPlans();
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-accent flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'form') {
    return <StudyPlanForm onSubmit={handleFormSubmit} onBackToHome={handleBackToHome} />;
  }

  if (currentView === 'dashboard' && studyData) {
    return (
      <StudyDashboard 
        studyPlan={studyData.studyPlan}
        motivationalTip={studyData.motivationalTip}
        onRegenerate={handleRegenerate}
        onBackToHome={handleBackToHome}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-accent">
      {/* Navigation */}
      <nav className="p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">StudyGenie</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Welcome back!</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/ai-assistant')}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Assistant
                </Button>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button variant="accent" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            )}
            <Button variant="accent" onClick={handleBackToHome}>
              Home
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Sparkles className="h-5 w-5" />
                AI-Powered Study Planning
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Plan Your Studies with
                <span className="bg-gradient-hero bg-clip-text text-transparent block">
                  AI Precision
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Transform your study routine with personalized schedules created by AI. 
                Input your subjects, deadlines, and available time – get a perfect study plan instantly.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6">
                Get Started Free
              </Button>
              <Button variant="accent" size="lg" className="text-lg px-8 py-6">
                See How It Works
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">AI-Powered</div>
                <div className="text-sm text-muted-foreground">Smart Scheduling</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">Personalized</div>
                <div className="text-sm text-muted-foreground">Study Plans</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">Instant</div>
                <div className="text-sm text-muted-foreground">Generation</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-hero rounded-3xl blur-3xl opacity-20"></div>
            <img 
              src={heroImage} 
              alt="AI Study Planning Workspace" 
              className="relative rounded-3xl shadow-elegant w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Saved Plans Section - Only for authenticated users */}
      {user && savedPlans.length > 0 && (
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Your Saved Study Plans
              </h2>
              <p className="text-xl text-muted-foreground">
                Pick up where you left off or revisit your previous study schedules.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedPlans.slice(0, 6).map((plan) => (
                <Card key={plan.id} className="shadow-card bg-gradient-card border-0 hover:shadow-elegant transition-all duration-300 hover:scale-105 cursor-pointer relative"
                      onClick={() => loadPreviousPlan(plan)}>
                  <div 
                    className="absolute top-2 right-2 z-20"
                  >
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-6 w-6 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlan(e, plan.id);
                      }}
                      title="Delete plan"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </Button>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{plan.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(plan.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Daily Hours:</span>
                        <span className="text-foreground font-medium">{plan.daily_hours}h</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subjects:</span>
                        <span className="text-foreground font-medium">{Array.isArray(plan.subjects) ? plan.subjects.length : 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Why Choose StudyGenie?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our AI understands your unique study needs and creates optimized schedules that actually work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="shadow-card bg-gradient-card border-0 hover:shadow-elegant transition-all duration-300 hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-6">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">AI-Powered Intelligence</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Advanced algorithms analyze your subjects, deadlines, and study capacity to create the perfect schedule.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card bg-gradient-card border-0 hover:shadow-elegant transition-all duration-300 hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-6">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Smart Scheduling</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Automatically balances study time across subjects based on deadlines and difficulty levels.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card bg-gradient-card border-0 hover:shadow-elegant transition-all duration-300 hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-6">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Goal-Oriented</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Every study session is purposefully designed to help you achieve your academic goals efficiently.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-elegant bg-gradient-hero border-0 text-white overflow-hidden">
            <CardContent className="p-12 text-center relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary-glow/20"></div>
              <div className="relative z-10">
                <BookOpen className="h-16 w-16 mx-auto mb-6 opacity-90" />
                <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Study Routine?</h2>
                <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                  Join thousands of students who have optimized their learning with AI-powered study plans.
                </p>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  onClick={handleGetStarted}
                  className="text-lg px-12 py-6 bg-white text-primary hover:bg-white/90"
                >
                  Create Your Study Plan Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
