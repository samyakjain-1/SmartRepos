// @ts-ignore
import logo from '../assets/modelence.svg';
import { useNavigate } from 'react-router-dom';

const projectInfo = {
  title: 'Tech Explorer Platform',
  description: `This project is a dynamic platform designed to help users explore and understand the latest in technology and open-source innovation. It highlights trending tools and repositories, making it easier for users to stay current with what's popular in the developer community.\n\nUsers can dive into detailed pages for each featured technology, where they’ll find statistics, AI-generated summaries, and personalized insights tailored to their interests. To support hands-on learning, the platform also offers guided, step-by-step tutorials and interactive chat assistants that walk users through the key concepts and usage of each technology.\n\nThe experience is further personalized through a user-driven quiz that refines recommendations based on individual goals and preferences. Additionally, users can bookmark their favorite technologies for easy access later.\n\nWhether you're a developer, student, or tech enthusiast, this platform serves as a smart, guided path to discovering and mastering the tools shaping the future of software.`,
  features: [
    'Discover trending tools and open-source repositories',
    'Detailed technology pages with stats and AI-generated summaries',
    'Personalized insights and recommendations',
    'Step-by-step tutorials and interactive chat assistants',
    'User-driven quiz for tailored suggestions',
    'Bookmark favorite technologies for quick access',
  ],
};

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-xl w-full">
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Modelence Logo" className="w-32 h-32" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{projectInfo.title}</h1>
        <p className="mt-2 text-gray-700 text-lg mb-6">{projectInfo.description}</p>
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Key Features</h2>
          <ul className="list-disc list-inside text-left text-gray-700">
            {projectInfo.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>
        <div className="flex justify-center gap-6 mb-8">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded shadow"
            onClick={() => navigate('/auth/login')}
          >
            Login
          </button>
          <button
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded shadow"
            onClick={() => navigate('/auth/signup')}
          >
            Signup
          </button>
        </div>
        <div className="mt-4">
          <a 
            href="https://docs.modelence.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-lg font-semibold"
          >
            Modelence Docs →
          </a>
        </div>
      </div>
    </div>
  );
}
