# E-Way Intelligence Dashboard 🚛

An advanced, full-stack intelligence dashboard built for tax authorities to monitor E-Way bills, detect suspicious transactions, and prevent logistics fraud in real-time.

## 🌟 Features

- **Real-Time Dashboard**: Visualize massive sets of E-Way bills with dynamic Key Performance Indicators (KPIs) showing Total, Clean, and Suspicious metrics.
- **Bulk Data Processing**: Automatically parses uploaded bulk Excel spreadsheets, identifies anomalies using strict validation rules, and flags suspicious transport records instantly.
- **Advanced Filtering**: Perform high-speed debounced searches by Vehicle Number or E-Way Bill Number. Filter data strictly by jurisdiction (National, State, or District levels).
- **Secure Authentication (RBAC)**: Multi-layer security designed for government data:
  - Registration with robust Email OTP Verification.
  - Secure Login with `bcrypt` password hashing and `JWT` token management.
  - **Admin Approval Wall**: New officers are placed in a "Pending" state and must be manually approved by a National Admin before accessing the dashboard.
  - Secure Forgot/Reset Password flows.
- **Monorepo Architecture**: Cleanly separated React Frontend and Express Backend, orchestrated to run seamlessly via a single command.

## 🛠️ Technology Stack

**Frontend (Client)**
- React (Vite)
- React Router DOM
- Custom CSS (Modern flexbox/grid designs)

**Backend (Server)**
- Node.js & Express.js
- MongoDB & Mongoose (Database & ORM)
- JSON Web Tokens (JWT) & bcrypt for Auth
- Nodemailer for OTP & Email Services
- Multer & xlsx for bulk file parsing

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed along with a running instance of MongoDB (either local or MongoDB Atlas).

### 1. Installation
Clone the repository and install all dependencies for both the frontend and backend simultaneously using the root package script:

```bash
git clone https://github.com/Ani032006/eway_project.git
cd eway_project
npm run install:all
```

### 2. Environment Variables
Navigate to the `backend/` directory (where the Express server lives) and create a `.env` file. Fill in the following keys:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

### 3. Running the Application
From the **root directory**, you can start both the backend API and the React frontend concurrently with a single command:

```bash
npm run dev
```

- **Frontend UI** will run on: `http://localhost:5173`
- **Backend API** will run on: `http://localhost:5000`

---

## 📂 Project Structure

```text
eway_project/
├── backend/               # Express server, MongoDB models, Auth routes, Email utilities
├── frontend/              # React UI, Pages (Dashboard, Login), Services (API fetches)
├── docs/                  # Authentication Guides and System documentation
├── package.json           # Root package managing concurrent execution scripts
└── README.md              # This file
```

## 🤝 Future Enhancements
- **Auto-Logout**: Implement an inactivity session timer for strict security compliance.
- **Automated Verification**: Sync registration directly with a live employee database.
- **Data Scoping**: Force strict database-level jurisdiction filters automatically upon login.
