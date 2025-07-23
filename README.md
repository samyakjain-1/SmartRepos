# SmartRepos

A modern platform for discovering trending GitHub repositories with personalized AI-powered insights and recommendations. Built with the Modelence framework, this application helps developers find relevant repositories based on their skills, interests, and goals.

---

## Features

### Core Functionality
- **Trending Repository Discovery** — Browse daily, weekly, and monthly trending GitHub repositories
- **Personalized Recommendations** — Get repository recommendations based on your programming languages, experience level, and interests
- **User Onboarding** — Complete a personalized quiz to set up your developer profile and preferences
- **Repository Bookmarking** — Save interesting repositories for easy access later

### AI-Powered Insights
- **AI Repository Analysis** — Get comprehensive AI-generated insights about repository structure, purpose, and implementation
- **Enhanced Descriptions** — AI-enhanced repository descriptions that go beyond basic GitHub information
- **Step-by-Step Learning Guides** — Personalized learning paths and implementation guides for technologies
- **Repository-Specific Chat** — Interactive chat assistant with full repository context using Repomix analysis

### Repository Detail Views
- **README Display** — Formatted README content with syntax highlighting
- **Repository Information** — Comprehensive metadata including stats, topics, and technical details
- **Recommendation Scoring** — Personalized scores indicating how well repositories match your profile
- **Multi-Tab Interface** — Organized information across README, AI Analysis, Description, Learning Guide, Chat, and Info tabs

### User Experience
- **User Authentication** — Secure login and signup with persistent sessions
- **Responsive Design** — Modern, clean interface that works on all devices
- **Smooth Transitions** — Framer Motion animations for polished user experience
- **Smart Caching** — Intelligent data caching for optimal performance

---

## Tech Stack

### Frontend
- **React 18** with TypeScript for type-safe component development
- **Tailwind CSS** for utility-first styling and responsive design
- **Framer Motion** for smooth page transitions and animations
- **React Query** for efficient data fetching, caching, and synchronization
- **React Router** for client-side routing and navigation
- **Marked** with Tailwind Typography for markdown rendering

### Backend
- **Modelence Framework** for modular, scalable backend architecture
- **Node.js** runtime environment
- **MongoDB** via Modelence Store for data persistence
- **GPT-4o Mini** for AI-powered analysis and chat functionality
- **GitHub API** integration for repository data
- **Cheerio** for web scraping GitHub trending pages
- **Repomix** for comprehensive repository analysis and context

### Development Tools
- **Vite** for fast development and building
- **PostCSS** for CSS processing
- **TypeScript** for static type checking
- **ESLint** and **Prettier** for code quality

---

## Project Structure

```
my-app/
├── src/
│   ├── client/                     # Frontend React application
│   │   ├── components/             # Reusable UI components
│   │   │   ├── Header.tsx          # Navigation header
│   │   │   ├── PageTransition.tsx  # Framer Motion transitions
│   │   │   ├── SaveRepoButton.tsx  # Repository save functionality
│   │   │   ├── RecommendationScore.tsx  # Personalized scoring display
│   │   │   └── RepoChatInterface.tsx    # Repository chat interface
│   │   ├── pages/                  # Page components
│   │   │   ├── TrendingReposPage.tsx    # Homepage with trending repos
│   │   │   ├── RepoDetailPage.tsx       # Detailed repository view
│   │   │   ├── OnboardingPage.tsx       # User preference setup
│   │   │   ├── SavedReposPage.tsx       # User's bookmarked repos
│   │   │   ├── LoginPage.tsx            # Authentication
│   │   │   └── SignupPage.tsx           # User registration
│   │   └── routes.ts               # Application routing configuration
│   └── server/                     # Backend Modelence modules
│       ├── github-trending/        # Trending repository scraping and caching
│       ├── repos/                  # Repository data management
│       ├── saved-repos/            # User bookmark functionality
│       ├── user-preferences/       # User profile and onboarding data
│       ├── recommendation-scoring/ # Personalized recommendation algorithm
│       ├── llm/                    # AI analysis and content generation
│       ├── repomix/                # Repository context analysis
│       └── repo-chat/              # Repository-specific chat functionality
├── scripts/                        # Utility and maintenance scripts
└── public/                         # Static assets
```

---

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/samyakjain-1/github-trends.git
   cd github-trends
   ```
2. **Install dependencies**
    ```bash
    npm install
    ```
3. **Create a new app on https://cloud.modelence.com**
4. **Configure and add your open ai api key in https://cloud.modelence.com**
5. **Setup the local environment by going to the settings of the app on modelence. This will create a .modelence.env file in your local dir**
6. **Set GITHUB_TOKEN =your_github_token in .modelence.env created in last step**
7. **Start Development Server**
    ```bash
    npm run dev
    ```

---

## Usage

### Getting Started
1. **Sign up** for an account or log in if you already have one
2. **Complete the onboarding** quiz to set up your developer profile
3. **Browse trending repositories** on the homepage with personalized recommendations
4. **Explore repository details** using the comprehensive multi-tab interface
5. **Save interesting repositories** for easy access later

### Personalization Features
- **Developer Profile**: Set your programming languages, experience level, tech interests, and goals
- **Recommendation Scores**: Get personalized scores showing how well repositories match your profile
- **AI Insights**: Access tailored analysis, descriptions, and learning guides based on your preferences

### AI-Powered Tools
- **Repository Analysis**: Get comprehensive AI insights about repository structure and purpose
- **Chat Assistant**: Interactive chat with full repository context for questions and guidance
- **Learning Guides**: Step-by-step implementation guides customized for your skill level
- **Enhanced Descriptions**: AI-improved repository descriptions with detailed technical context

---

## Development

### Available Scripts

- `npm run dev` — Start development server with hot reloading
- `npm run build` — Build optimized production bundle
- `npm run start` — Start production server
- `npm run test` — Run test suite (to be implemented)

### Key Components

**Trending Data Collection**
- Automated scraping of GitHub trending pages
- Intelligent caching with configurable refresh intervals
- Support for daily, weekly, and monthly trending periods
- Avatar and metadata extraction for enhanced display

**AI Integration**
- GPT-4o Mini integration for analysis and chat
- Repomix integration for comprehensive repository context
- Intelligent prompt engineering for personalized responses
- Caching system for AI-generated content

**Recommendation System**
- Algorithm matching user preferences with repository characteristics
- Multi-factor scoring based on languages, experience level, interests, and goals
- Real-time score calculation and display
- Continuous learning from user interactions

---

## Architecture

### Frontend Architecture
- **Component-based React architecture** with TypeScript for maintainability
- **Custom hooks** for data fetching and state management
- **Responsive design system** using Tailwind CSS utilities
- **Animation system** with Framer Motion for smooth user experience
- **Route-based code splitting** for optimal performance

### Backend Architecture
- **Modular Modelence framework** for organized, scalable server logic
- **MongoDB document stores** with proper indexing and relationships
- **API abstraction layers** for external service integration
- **Caching strategies** for both database queries and API responses
- **Error handling and logging** throughout the application stack

### Data Flow
- **Client-side state management** with React Query for server state
- **Real-time updates** through intelligent cache invalidation
- **Optimistic updates** for immediate user feedback
- **Background data synchronization** for consistent user experience

---

## Acknowledgments

- **Modelence Framework** for providing the backend architecture
- **OpenAI** for AI capabilities and natural language processing
- **GitHub API** for repository data access
- **Repomix** for repository analysis and context extraction
- **React ecosystem** for frontend development tools
- **Tailwind CSS** for utility-first styling approach
