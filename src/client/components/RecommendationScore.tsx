interface RecommendationScoreProps {
  score: number;
  message: string;
  size?: 'small' | 'medium' | 'large';
  showMessage?: boolean;
}

export default function RecommendationScore({ 
  score, 
  message, 
  size = 'medium', 
  showMessage = true 
}: RecommendationScoreProps) {
  // Function to get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  // Function to get background color based on value (same as devora)
  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-400';
    if (score >= 60) return 'bg-blue-400';
    if (score >= 40) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  // Size variants
  const sizeClasses = {
    small: {
      container: 'p-2',
      label: 'text-xs',
      score: 'text-lg font-bold',
      bar: 'h-1',
      message: 'text-xs'
    },
    medium: {
      container: 'p-3',
      label: 'text-sm',
      score: 'text-2xl font-bold',
      bar: 'h-2',
      message: 'text-sm'
    },
    large: {
      container: 'p-4',
      label: 'text-sm',
      score: 'text-4xl font-bold',
      bar: 'h-2',
      message: 'text-sm'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-700 ${classes.container}`}>
      <div className={`text-center text-gray-400 ${classes.label} uppercase tracking-wider mb-1`}>
        RECOMMENDATION SCORE
      </div>
      <div className={`text-center ${getScoreColor(score)} ${classes.score} my-2`}>
        {score}%
      </div>
      <div className={`w-full bg-gray-700 ${classes.bar} rounded-full overflow-hidden`}>
        <div 
          className={`h-full ${getScoreBgColor(score)} transition-all duration-300`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
      {showMessage && (
        <div className={`mt-2 text-center ${classes.message} text-gray-400`}>
          {message}
        </div>
      )}
    </div>
  );
} 
