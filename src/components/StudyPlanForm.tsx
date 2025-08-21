import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2, Brain } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Subject {
  id: string;
  name: string;
  deadline: Date | undefined;
}

interface StudyPlanFormProps {
  onSubmit: (data: { subjects: Subject[]; dailyHours: number }) => void;
  onBackToHome: () => void;
}

const StudyPlanForm: React.FC<StudyPlanFormProps> = ({ onSubmit, onBackToHome }) => {
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: '1', name: '', deadline: undefined }
  ]);
  const [dailyHours, setDailyHours] = useState<number>(4);

  const addSubject = () => {
    const newSubject: Subject = {
      id: Date.now().toString(),
      name: '',
      deadline: undefined
    };
    setSubjects([...subjects, newSubject]);
  };

  const removeSubject = (id: string) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter(subject => subject.id !== id));
    }
  };

  const updateSubject = (id: string, field: keyof Subject, value: string | Date) => {
    setSubjects(subjects.map(subject =>
      subject.id === id ? { ...subject, [field]: value } : subject
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validSubjects = subjects.filter(subject => 
      subject.name.trim() !== '' && subject.deadline
    );
    
    if (validSubjects.length === 0) {
      alert('Please add at least one subject with a deadline');
      return;
    }
    
    onSubmit({ subjects: validSubjects, dailyHours });
  };

  return (
    <div className="min-h-screen bg-gradient-accent p-6">
      <div className="max-w-2xl mx-auto">
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
            Let AI create your perfect study schedule
          </p>
        </div>

        <Card className="shadow-elegant bg-gradient-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Create Your Study Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Subjects & Deadlines</Label>
                  <Button 
                    type="button" 
                    variant="accent" 
                    size="sm" 
                    onClick={addSubject}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Subject
                  </Button>
                </div>

                {subjects.map((subject, index) => (
                  <div key={subject.id} className="p-4 bg-background rounded-lg border border-border/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Subject {index + 1}</Label>
                      {subjects.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubject(subject.id)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <Input
                      placeholder="e.g., Mathematics, History, Biology..."
                      value={subject.name}
                      onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                      className="border-border/50"
                    />
                    
                    <div>
                      <Label className="text-sm text-muted-foreground">Deadline</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal mt-1",
                              !subject.deadline && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {subject.deadline ? format(subject.deadline, "PPP") : "Pick a deadline"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={subject.deadline}
                            onSelect={(date) => date && updateSubject(subject.id, 'deadline', date)}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Daily Study Hours</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min="1"
                    max="16"
                    value={dailyHours}
                    onChange={(e) => setDailyHours(Number(e.target.value))}
                    className="w-24 border-border/50"
                  />
                  <span className="text-muted-foreground">hours per day</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  How many hours can you dedicate to studying each day?
                </p>
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full">
                Generate My Study Plan
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudyPlanForm;