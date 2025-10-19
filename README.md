# Finance Tracker 💰

A modern, feature-rich expense tracking application built with React and Firebase. Track your expenses, visualize spending patterns with interactive charts and analytics.

## ✨ Features

- 🔐 **Authentication**: Email/password and Google OAuth sign-in
- 📊 **Expense Management**: Add, edit, and delete expenses with categories
- 📈 **Visual Analytics**: Interactive charts showing spending patterns
- 🎤 **Voice Input**: Add expenses using voice commands
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- 🎨 **Modern UI**: Beautiful gradient designs and smooth animations

##  Quick Start

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Firebase account

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase**
   
   Your Firebase is already configured in `src/services/firebase.js`

3. **Start development server**
   ```bash
   npm run dev
   ```
   
   App will run on `http://localhost:5173`

4. **Deploy to GitHub Pages**
   ```bash
   npm run build
   npm run deploy
   ```

## 🏗️ Project Structure

```
finance-tracker/
├── src/
│   ├── components/          # React components
│   │   ├── Auth.jsx        # Authentication
│   │   ├── Dashboard.jsx   # Main dashboard
│   │   ├── ExpenseForm.jsx # Add/edit expenses
│   │   ├── ExpenseList.jsx # Expense table
│   │   └── ExpenseCharts.jsx # Charts
│   ├── services/           # Firebase & services
│   │   ├── firebase.js     # Firebase config
│   │   └── speechRecognition.js
│   └── styles/             # CSS files
│
├── public/                 # Static assets
└── README.md              # This file
```

## 🎯 Key Features

### Authentication
- Email/password sign-up and login
- Google OAuth integration
- Secure Firebase Authentication

### Expense Tracking
- Add expenses with amount, category, and description
- Edit and delete expenses
- Categorize spending (Food, Transport, Shopping, etc.)
- Date tracking for all expenses

### Visual Analytics
- Interactive pie charts showing category breakdown
- Spending trends over time
- Category-wise analysis
- Responsive Chart.js visualizations

### Voice Commands
- Add expenses using voice input
- Speech recognition for quick entry
- Hands-free expense tracking

## 📦 Technologies Used

- React 19
- Firebase (Authentication & Firestore)
- Chart.js for visualizations
- Vite for build tooling
- React Icons

## 🔒 Security

- Firebase Authentication for secure user management
- Firestore security rules for data protection
- Environment variables for sensitive data

## 🚀 Deployment

The app is configured to deploy to GitHub Pages:

```bash
npm run build
npm run deploy
```

Your app will be live at: `https://yourusername.github.io/finance-tracker`

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Feel free to open issues or submit PRs.

---

Built with ❤️ using React and Firebase
