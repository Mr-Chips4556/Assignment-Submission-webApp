# 📚 EduSubmit — Assignment Submission Portal

A full-stack assignment submission application built with **React**, **Tailwind CSS**, and **Firebase**.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 Authentication | Email/password login & registration |
| 👥 Dual Roles | Separate flows for Students and Teachers |
| 🏫 Class Management | Teachers create classes; students join via code |
| 📤 File Upload | Drag-and-drop upload with progress bar (max 20 MB) |
| 💬 Remarks | Teachers can review submissions and leave remarks |
| 🔴 Real-time | Firestore live updates — no refresh needed |
| 🎨 Modern UI | Dark theme, animations, responsive design |

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Enable these services:
   - **Authentication** → Sign-in method → Email/Password ✅
   - **Firestore Database** → Create database (start in test mode, then apply rules)
   - **Storage** → Get started
3. Go to **Project Settings** → **Your apps** → **Add app** (Web)
4. Copy the config and paste it into `src/firebase/config.js`:

```js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID",
};
```

### 3. Deploy Firestore rules & indexes

**Option A — Firebase CLI (recommended):**
```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select your project
firebase deploy --only firestore,storage
```

**Option B — Firebase Console (manual):**
- Paste contents of `firestore.rules` into Firestore → Rules
- Paste contents of `storage.rules` into Storage → Rules
- Create the three composite indexes shown in `firestore.indexes.json`

### 4. Run locally

```bash
npm run dev
```

Visit `http://localhost:5173`

---

## 📁 Project Structure

```
src/
├── firebase/
│   └── config.js              ← 🔧 YOUR FIREBASE CONFIG GOES HERE
├── contexts/
│   └── AuthContext.jsx        ← Auth state + role management
├── pages/
│   ├── Login.jsx              ← Sign-in page
│   ├── Register.jsx           ← Registration with role picker
│   ├── StudentDashboard.jsx   ← Student home (enrolled classes + join)
│   ├── TeacherDashboard.jsx   ← Teacher home (class management)
│   └── ClassPage.jsx          ← Class detail (student or teacher view)
├── components/
│   ├── Navbar.jsx             ← Top navigation bar
│   ├── UploadAssignment.jsx   ← Drag-and-drop file uploader
│   ├── StudentSubmissions.jsx ← Student's own submissions + remarks
│   └── TeacherSubmissions.jsx ← All submissions with remark editor
├── App.jsx                    ← Routes + role-based guards
├── main.jsx                   ← React entry point
└── index.css                  ← Tailwind + global styles
```

---

## 🗄️ Firestore Data Model

```
/users/{uid}
  name:      string
  email:     string
  role:      "student" | "teacher"
  createdAt: timestamp

/classes/{classId}
  name:        string
  code:        string   ← 6-char join code (e.g. "AB12CD")
  teacherId:   string
  teacherName: string
  studentIds:  string[]
  createdAt:   timestamp

/assignments/{assignmentId}
  classId:     string
  studentId:   string
  studentName: string
  fileName:    string
  fileSize:    number
  fileType:    string
  fileURL:     string   ← Firebase Storage download URL
  storagePath: string
  submittedAt: timestamp
  status:      "submitted" | "reviewed"
  remarks:     string
```

---

## 👤 User Flow

### Student
1. Register → select **Student** role
2. Login → **Student Dashboard**
3. Enter class code → join class
4. Open class → upload assignment (drag & drop)
5. See submission history + teacher remarks in real-time

### Teacher
1. Register → select **Teacher** role
2. Login → **Teacher Dashboard**
3. Create class → share the auto-generated code with students
4. Open class → see all student submissions
5. Click **Add Remarks** → write feedback → **Save**
6. Filter by Pending / Reviewed

---

## 🔒 Security Rules Summary

| Collection | Read | Write |
|---|---|---|
| `/users/{uid}` | Any auth user | Owner only |
| `/classes/{id}` | Any auth user | Teacher (create/delete), anyone (join) |
| `/assignments/{id}` | Owner student or teacher | Student (create), Teacher (update remarks) |
| `Storage /assignments/**` | Any auth user | Owning student, max 20 MB |

---

## 🏗️ Build & Deploy

```bash
# Build for production
npm run build

# Deploy to Firebase Hosting
firebase deploy
```

---

## 🛠️ Tech Stack

- **React 18** + **Vite**
- **Tailwind CSS 3**
- **Firebase 10** (Auth, Firestore, Storage)
- **React Router 6**
- Google Fonts: Sora + DM Sans + JetBrains Mono
