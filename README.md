# 🔥 GitHub Trends Explorer

A modern platform for discovering trending GitHub repositories, built with the Modelence framework.  
Stay up-to-date with the most popular repositories in the developer community and explore detailed insights about each project.

---

## ✨ Features

- **📈 Trending Repositories** — Discover daily, weekly, and monthly trending GitHub repos
- **🔍 Detailed Repository Views** — Comprehensive repository information with README rendering
- **📊 Repository Analytics** — Stars, forks, issues, and language breakdowns
- **🔖 Save Repositories** — Bookmark your favorite repos for easy access
- **👤 User Authentication** — Secure login and signup functionality
- **⚡ Smart Caching** — Intelligent data caching for optimal performance
- **📱 Responsive Design** — Beautiful, modern UI that works on all devices

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, React Query
- **Backend**: Modelence Framework, Node.js
- **Database**: MongoDB (via Modelence)
- **APIs**: GitHub API, GitHub Trending Scraper
- **Authentication**: Modelence Auth UI
- **Build Tools**: Vite, PostCSS
- **UI Libraries**: React Router, React Hot Toast

---

## 📦 Project Structure

```
my-app/
├── src/
│   ├── client/                 # Frontend React application
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Page components
│   │   └── assets/            # Static assets
│   └── server/                # Backend Modelence modules
│       ├── github-trending/   # Trending repos scraping & caching
│       ├── repos/             # Repository data management
│       └── saved-repos/       # User saved repositories
├── scripts/                   # Utility scripts
└── public/                    # Static files
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB connection string
- GitHub API token (optional, for enhanced rate limits)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.modelence.env` file in the project root:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   GITHUB_TOKEN=your_github_token_optional
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000` to see the application

---

## 📖 Usage

### Exploring Trending Repositories

- Visit the homepage to see trending repositories
- Switch between daily, weekly, and monthly trending periods
- Click on any repository to view detailed information

### Repository Details

- View comprehensive repository statistics
- Read formatted README content
- See language breakdowns and topics
- Access direct links to GitHub

### User Features

- Sign up for an account to save repositories
- Bookmark interesting projects for later reference
- Manage your saved repositories collection

---

## 🔧 Development

### Available Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm test` — Run tests (not implemented yet)

### Data Scraping

The application includes automated scraping of GitHub trending data:
- Runs periodically to cache trending repositories
- Supports daily, weekly, and monthly periods
- Stores data in MongoDB for fast retrieval

---

## 🏗️ Architecture

### Frontend
- **React SPA** with TypeScript for type safety
- **Tailwind CSS** for utility-first styling
- **React Query** for efficient data fetching and caching
- **React Router** for client-side routing

### Backend
- **Modelence modules** for organized, scalable backend logic
- **MongoDB stores** for data persistence
- **GitHub API integration** for repository details
- **Web scraping** for trending data collection

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- Built with [Modelence Framework](https://docs.modelence.com)
- GitHub API for repository data
- Tailwind CSS for styling
- React ecosystem for frontend development

---

**Happy coding! 🚀**
