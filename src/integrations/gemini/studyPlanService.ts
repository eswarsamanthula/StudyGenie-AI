import gemini from './client';
import { Subject } from '@/pages/Index';

interface StudyFormData {
  subjects: Subject[];
  dailyHours: number;
}

interface StudyPlanDay {
  day: string;
  date: string;
  subject: string;
  hours: number;
  notes: string;
  priority: 'high' | 'medium' | 'low';
  resources?: string; // Optional field for AI tool recommendations
}

interface StudyPlanResult {
  studyPlan: StudyPlanDay[];
  motivationalTip: string;
}

// Function to calculate days until deadline for prioritization
const getDaysUntilDeadline = (deadline: Date | undefined): number => {
  if (!deadline) return Infinity;
  
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0; // Return 0 if deadline has passed
};

// Function to get weekday names for the next 5 days
const getNextFiveDays = (): { day: string; date: string }[] => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const result = [];
  const today = new Date();
  
  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    result.push({
      day: days[date.getDay()],
      date: `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
    });
  }
  
  return result;
};

// Generate a study plan using Gemini
export const generateStudyPlan = async (data: StudyFormData): Promise<StudyPlanResult> => {
  try {
    // Sort subjects by deadline (closest first)
    const sortedSubjects = [...data.subjects].sort((a, b) => {
      const daysA = getDaysUntilDeadline(a.deadline);
      const daysB = getDaysUntilDeadline(b.deadline);
      return daysA - daysB;
    });

    // Prepare subject information for the prompt
    const subjectInfo = sortedSubjects.map(subject => {
      const daysUntil = getDaysUntilDeadline(subject.deadline);
      const deadlineInfo = subject.deadline 
        ? `deadline in ${daysUntil} days (${new Date(subject.deadline).toLocaleDateString()})` 
        : 'no specific deadline';
      
      return `- ${subject.name}: ${deadlineInfo}`;
    }).join('\n');

    // Get the next 5 days for the study plan
    const nextFiveDays = getNextFiveDays();
    
    // Create the prompt for Gemini
    const prompt = `Create a detailed 5-day study plan for a student with the following subjects:\n${subjectInfo}\n\nThe student can study ${data.dailyHours} hours per day.\n\nFor each day, provide the following:\n1. Assign multiple subjects per day when appropriate (comma-separated)
2. Allocate study hours (not exceeding daily limit)
3. Create detailed, subject-specific study notes with actionable techniques
4. Assign priority (high/medium/low) based on deadline proximity
5. Include specific learning strategies tailored to each subject type (math, science, language, etc.)
\nPrioritize subjects with closer deadlines. Distribute study time effectively across all subjects, with more time for subjects with closer deadlines.\n\nFormat your response as a JSON object with this structure:\n{\n  "studyPlan": [\n    {\n      "day": "${nextFiveDays[0].day}",\n      "date": "${nextFiveDays[0].date}",\n      "subject": "Subject Name",\n      "hours": 2,\n      "notes": "Detailed study notes with specific techniques",\n      "priority": "high",\n      "resources": "Recommended tools and resources"
    },\n    // More days...
  ],\n  "motivationalTip": "A motivational message for the student"
}`;

    // Call Gemini API
    const response = await gemini.chat.completions.create({
      model: 'gpt-3.5-turbo', // This is ignored by Gemini but kept for compatibility
      messages: [
        { role: 'system', content: 'You are an expert study planner and academic advisor.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Parse the response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from Gemini');
    }

    // Extract the JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Gemini response');
    }

    const studyPlanData = JSON.parse(jsonMatch[0]) as StudyPlanResult;
    return studyPlanData;
  } catch (error) {
    console.error('Error generating study plan with Gemini:', error);
    
    // Fallback to a basic plan if Gemini fails
    return generateFallbackStudyPlan(data);
  }
};

// Fallback function to generate a basic study plan if Gemini fails
const generateFallbackStudyPlan = (data: StudyFormData): StudyPlanResult => {
  // Generate subject-specific study notes with detailed recommendations
  const getSubjectNotes = (subject: string): string => {
    const subjectLower = subject.toLowerCase();
    
    if (subjectLower.includes('math')) {
      return "Practice equations using spaced repetition, solve problem sets with increasing difficulty, and create concept maps for formulas and theorems";
    } else if (subjectLower.includes('physics')) {
      return "Review key concepts through visual diagrams, solve numerical problems, and watch simulations of physical phenomena";
    } else if (subjectLower.includes('chemistry')) {
      return "Create flashcards for chemical reactions, practice balancing equations, and review periodic table relationships";
    } else if (subjectLower.includes('biology')) {
      return "Draw detailed diagrams of biological systems, create concept maps for processes, and review key terminology";
    } else if (subjectLower.includes('history') || subjectLower.includes('social')) {
      return "Create timeline charts, practice active recall of key events, and analyze primary sources using the Cornell note-taking method";
    } else if (subjectLower.includes('english') || subjectLower.includes('literature') || subjectLower.includes('lang')) {
      return "Read assigned texts using active reading techniques, practice writing essays with clear thesis statements, and build vocabulary through contextual learning";
    } else if (subjectLower.includes('computer') || subjectLower.includes('programming') || subjectLower.includes('coding')) {
      return "Work on coding projects with test-driven development, debug exercises systematically, and document your learning process in a coding journal";
    } else {
      return "Review course materials using the Feynman technique, create summary notes with mind maps, and practice retrieval with self-quizzing";
    }
  };
  
  // Generate subject-specific AI tool recommendations
  const getSubjectResources = (subject: string): string => {
    const subjectLower = subject.toLowerCase();
    
    if (subjectLower.includes('math')) {
      return "Wolfram Alpha for equation solving, Khan Academy for tutorials, Desmos for graphing";
    } else if (subjectLower.includes('physics')) {
      return "PhET simulations, Brilliant.org physics courses, Gemini for problem-solving assistance";
    } else if (subjectLower.includes('chemistry')) {
      return "Periodic Table apps, Molecular modeling tools, ChemCollective virtual labs";
    } else if (subjectLower.includes('biology')) {
      return "BioDigital Human for 3D models, Labster for virtual labs, Quizlet for terminology";
    } else if (subjectLower.includes('history') || subjectLower.includes('social')) {
      return "Timeline JS for visual timelines, Google Arts & Culture for primary sources, Gemini for historical context";
    } else if (subjectLower.includes('english') || subjectLower.includes('literature') || subjectLower.includes('lang')) {
      return "Grammarly for writing assistance, ThesaurusAI for vocabulary, Gemini models for essay feedback";
    } else if (subjectLower.includes('computer') || subjectLower.includes('programming') || subjectLower.includes('coding')) {
      return "GitHub Copilot for coding assistance, LeetCode for practice, Stack Overflow for problem-solving";
    } else {
      return "Notion AI for note organization, Anki for flashcards, Gemini for concept explanations";
    }
  };

  // Sort subjects by deadline
  const sortedSubjects = [...data.subjects].sort((a, b) => {
    const daysA = getDaysUntilDeadline(a.deadline);
    const daysB = getDaysUntilDeadline(b.deadline);
    return daysA - daysB;
  });

  // Ensure we have at least some subjects to work with
  const availableSubjects = sortedSubjects.length > 0 
    ? sortedSubjects 
    : [{ id: '1', name: 'General Study', deadline: new Date() }];

  // Get priority based on deadline
  const getPriorityByDeadline = (subject: Subject): 'high' | 'medium' | 'low' => {
    const days = getDaysUntilDeadline(subject.deadline);
    if (days <= 7) return 'high';
    if (days <= 14) return 'medium';
    return 'low';
  };

  // Get the next 5 days
  const nextFiveDays = getNextFiveDays();

  // Create the study plan with multiple subjects per day when possible
  const studyPlan = nextFiveDays.map((dayInfo, index) => {
    // For variety, assign multiple subjects on some days
    const isMultiSubjectDay = index % 2 === 0 && availableSubjects.length > 1;
    
    if (isMultiSubjectDay) {
      // Get two subjects for this day
      const subject1 = availableSubjects[index % availableSubjects.length];
      const subject2 = availableSubjects[(index + 1) % availableSubjects.length];
      const combinedSubjects = `${subject1.name}, ${subject2.name}`;
      
      // Determine the higher priority subject
      const priority1 = getPriorityByDeadline(subject1);
      const priority2 = getPriorityByDeadline(subject2);
      const highestPriority = priority1 === 'high' || priority2 === 'high' ? 'high' : 
                             priority1 === 'medium' || priority2 === 'medium' ? 'medium' : 'low';
      
      // Create combined notes
      const notes = `${subject1.name}: ${getSubjectNotes(subject1.name)}. ${subject2.name}: ${getSubjectNotes(subject2.name)}${index === 4 ? " - prepare for assessment" : ""}`;
      
      // Create combined resources
      const resources = `${subject1.name}: ${getSubjectResources(subject1.name)}. ${subject2.name}: ${getSubjectResources(subject2.name)}`;
      
      return {
        day: dayInfo.day,
        date: dayInfo.date,
        subject: combinedSubjects,
        hours: data.dailyHours,
        notes: notes,
        priority: highestPriority,
        resources: resources
      };
    } else {
      // Single subject day
      const subject = availableSubjects[index % availableSubjects.length];
      
      return {
        day: dayInfo.day,
        date: dayInfo.date,
        subject: subject.name,
        hours: Math.ceil(data.dailyHours * (getPriorityByDeadline(subject) === 'high' ? 0.8 : 0.5)),
        notes: getSubjectNotes(subject.name) + (index === 4 ? " - prepare for assessment" : ""),
        priority: getPriorityByDeadline(subject),
        resources: getSubjectResources(subject.name)
      };
    }
  });

  const motivationalTip = "Remember, consistency beats intensity! Study a little every day rather than cramming. Your future self will thank you for the disciplined effort you put in today. Stay focused and believe in yourself! 🎯✨";

  return {
    studyPlan: studyPlan as StudyPlanDay[],
    motivationalTip
  };
};