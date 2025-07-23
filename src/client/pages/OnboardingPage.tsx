import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { modelenceQuery } from '@modelence/react-query';
import { useSession } from 'modelence/client';
import Page from '../components/Page';
import PageTransition from '../components/PageTransition';

interface UserPreferences {
  programmingLanguages: string[];
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  techInterests: string[];
  goals: string;
}

export default function OnboardingPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences>({
    programmingLanguages: [],
    experienceLevel: 'Beginner',
    techInterests: [],
    goals: ''
  });

  // Redirect if not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  const languages = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 
    'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'C++',
    'React', 'Vue', 'Angular', 'Node.js'
  ];

  const interests = [
    'Web Development', 'Mobile Apps', 'Machine Learning', 
    'DevOps', 'Cloud Computing', 'Blockchain', 
    'Game Development', 'Data Science', 'Security',
    'AI/ML', 'Backend Development', 'Frontend Development'
  ];

  const experienceLevels: UserPreferences['experienceLevel'][] = [
    'Beginner', 'Intermediate', 'Advanced'
  ];

  const updateLanguages = (language: string) => {
    setPreferences(prev => {
      const newLanguages = prev.programmingLanguages.includes(language)
        ? prev.programmingLanguages.filter(l => l !== language)
        : [...prev.programmingLanguages, language];
      
      return { ...prev, programmingLanguages: newLanguages };
    });
  };

  const updateInterests = (interest: string) => {
    setPreferences(prev => {
      const newInterests = prev.techInterests.includes(interest)
        ? prev.techInterests.filter(i => i !== interest)
        : [...prev.techInterests, interest];
      
      return { ...prev, techInterests: newInterests };
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      console.log('Starting onboarding submission');
      const query = modelenceQuery('userPreferences.saveUserPreferences', {
        preferences,
      });
      const result = await query.queryFn();
      console.log('Onboarding mutation raw result:', result);
      return result;
    },
    onSuccess: async () => {
      console.log('Successfully saved preferences');
      // Invalidate all user preference queries
      await queryClient.invalidateQueries({ 
        queryKey: modelenceQuery('userPreferences.hasCompletedOnboarding', {}).queryKey 
      });
      await queryClient.invalidateQueries({ 
        queryKey: modelenceQuery('userPreferences.getTechRecommendationContext', {}).queryKey 
      });
      await queryClient.invalidateQueries({ 
        queryKey: modelenceQuery('userPreferences.getUserPreferences', {}).queryKey 
      });
      // Force refetch of the onboarding status, then redirect
      await queryClient.refetchQueries({ 
        queryKey: modelenceQuery('userPreferences.hasCompletedOnboarding', {}).queryKey 
      });
      navigate('/');
    },
    onError: (error: any) => {
      console.error('Error saving preferences:', error);
      alert('Failed to save your preferences. Please try again.');
    },
  });

  const handleSubmit = () => {
    console.log('Submitting preferences:', preferences);
    saveMutation.mutate();
  };

  const renderQuizStep = () => {
    switch(step) {
      case 0: // Programming languages
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Which technologies do you know?</h2>
              <p className="text-gray-600 text-lg">Select all that apply - this helps us personalize recommendations</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {languages.map(lang => (
                <button
                  key={lang}
                  onClick={() => updateLanguages(lang)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                    preferences.programmingLanguages.includes(lang)
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-blue-500 text-white shadow-lg'
                      : 'border-gray-300 hover:border-blue-400 bg-white hover:bg-blue-50'
                  }`}
                >
                  <span className="font-medium">{lang}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-6">
              <button
                onClick={() => setStep(1)}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
              >
                Next →
              </button>
            </div>
          </div>
        );

      case 1: // Experience level
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">What's your experience level?</h2>
              <p className="text-gray-600 text-lg">This helps us suggest appropriate technologies</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {experienceLevels.map(level => (
                <button
                  key={level}
                  onClick={() => setPreferences(prev => ({ ...prev, experienceLevel: level }))}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                    preferences.experienceLevel === level
                      ? 'bg-gradient-to-r from-green-500 to-blue-600 border-green-500 text-white shadow-lg'
                      : 'border-gray-300 hover:border-green-400 bg-white hover:bg-green-50'
                  }`}
                >
                  <div className="text-lg font-semibold mb-2">{level}</div>
                  <div className="text-sm opacity-90">
                    {level === 'Beginner' && 'New to programming or learning fundamentals'}
                    {level === 'Intermediate' && 'Comfortable with several technologies'}
                    {level === 'Advanced' && 'Experienced with complex projects'}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-between pt-6">
              <button
                onClick={() => setStep(0)}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition-colors font-medium"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(2)}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
              >
                Next →
              </button>
            </div>
          </div>
        );

      case 2: // Tech interests
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">What interests you most?</h2>
              <p className="text-gray-600 text-lg">Select areas you'd like to explore or learn more about</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {interests.map(interest => (
                <button
                  key={interest}
                  onClick={() => updateInterests(interest)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                    preferences.techInterests.includes(interest)
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 border-purple-500 text-white shadow-lg'
                      : 'border-gray-300 hover:border-purple-400 bg-white hover:bg-purple-50'
                  }`}
                >
                  <span className="font-medium">{interest}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-between pt-6">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition-colors font-medium"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
              >
                Next →
              </button>
            </div>
          </div>
        );

      case 3: // Goals
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">What are your goals?</h2>
              <p className="text-gray-600 text-lg">Tell us what you're trying to achieve - this makes our recommendations much more relevant</p>
            </div>
            <div className="max-w-2xl mx-auto">
              <textarea
                value={preferences.goals}
                onChange={(e) => setPreferences(prev => ({ ...prev, goals: e.target.value }))}
                className="w-full p-6 border-2 border-gray-300 rounded-xl h-40 text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all resize-none"
                placeholder="For example: 'I want to build a mobile app for my business' or 'Looking to transition into machine learning' or 'Want to become a full-stack developer'..."
              />
            </div>
            <div className="flex justify-between pt-6">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition-colors font-medium"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={saveMutation.isPending}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl hover:from-green-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Complete Setup'
                )}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Show loading if user session is still being determined
  if (user === undefined) {
    return (
      <Page title="Loading...">
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Welcome - Tell us about yourself">
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="max-w-4xl mx-auto p-6 pt-12">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Welcome to GitHub Trends!
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Let's personalize your experience! This quick setup helps us recommend technologies that match your interests and experience.
              </p>
            </div>
            
            {/* Progress bar */}
            <div className="w-full max-w-2xl mx-auto mb-12">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Step {step + 1} of 4</span>
                <span>{Math.round((step + 1) * 25)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
                  style={{ width: `${(step + 1) * 25}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
              {renderQuizStep()}
            </div>
          </div>
        </div>
      </PageTransition>
    </Page>
  );
} 