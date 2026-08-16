# JIRVI EDU SYSTEM

## Overview
A comprehensive e-learning platform designed to help achieve academic excellence through interactive and personalized education. The application serves Administrators, Teachers, and Students through dedicated portals, providing features ranging from module management and assignment grading to lecture scheduling and progressive web app (PWA) capabilities.

## Features

### Administrator Features
- **User Management**: Add, update, and remove students and teachers.
- **Module Management**: Create and manage learning modules/courses.
- **System Monitoring**: View system activity logs.
- **Performance Overview**: Access and monitor student performance metrics.

### Teacher Features
- **Dashboard Overview**: Track assigned modules and upcoming schedule.
- **Lecture Management**: Schedule and manage video lectures.
- **Materials Management**: Upload and organize learning materials.
- **Assignment Management**: Create, publish, and manage assignments with due dates.
- **Grading & Feedback**: Review student submissions, assign grades, and provide feedback.

### Student Features
- **Student Dashboard**: View enrolled modules, pending assignments, and upcoming lectures.
- **Assignment Submission**: View assignment instructions, deadlines, and upload submissions.
- **Results Portal**: View graded submissions and generate/download official Result Slips with QR code verification.
- **Learning Materials**: Access and download course materials provided by teachers.

### PWA Features
- Installable on desktop and mobile devices.
- Offline-capable service worker integration.
- Custom installation prompts (including tailored iOS instructions).

## Technology Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4
- **UI Components**: Framer Motion (animations), Lucide React (icons)
- **Backend / API**: Node.js, Express (`server.ts` entry point)
- **Database**: Insforge (Supabase-compatible PostgreSQL API)
- **Utilities**: PDF Generation (`jspdf`, `html-to-image`), QR Codes (`qrcode.react`)

## System Requirements
- **Node.js**: v18 or newer
- **Package Manager**: npm (or yarn/pnpm/bun)
- **Database**: Insforge / Supabase project

## Installation

1. Clone the repository and navigate into the project directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables (see below).

## Environment Variables

The project requires specific environment variables to function correctly. Copy `.env.example` to `.env` and fill in the values:

```env
# Required for Gemini AI API calls
GEMINI_API_KEY="your_placeholder_key"

# The URL where this applet is hosted (used for self-referential links)
APP_URL="http://localhost:3000"

# Insforge / Supabase Database Configuration
VITE_INSFORGE_URL="your_insforge_project_url"
VITE_INSFORGE_ANON_KEY="your_insforge_anon_key"
```
*Note: Never commit your `.env` file to version control.*

## Database
The application integrates with Insforge (a Supabase-compatible PostgreSQL provider). The primary entities include:
- `admins`, `teachers`, `students` (User roles and profiles)
- `teacher_passwords`, `student_passwords` (Authentication credentials)
- `modules` (Courses/Subjects)
- `enrollments` (Mapping students to modules)
- `lectures` (Scheduled video or in-person sessions)
- `assignments` & `submissions` (Homework and grading)
- `learning_materials` (Course documents)
- `announcements` & `notifications` (System alerts)
- `activity_logs` (System audit trails)

## Authentication and Authorization
The system utilizes a custom, role-based authentication workflow interacting directly with the Insforge database:
- **Admin**: Full access to all modules, users, and system logs. Uses hardcoded fallback or DB-stored credentials.
- **Teacher**: Restricted to assigned modules. Can publish materials, create assignments, and grade submissions.
- **Student**: Restricted to enrolled modules. Can submit assignments, view materials, and download result slips.

*Passwords are cryptographically hashed using `bcrypt-ts` prior to storage, and a client-side lockout mechanism prevents rapid brute-force attempts.*

## Project Structure
```text
/
├── public/                 # Static assets, web manifest, and icons
├── src/
│   ├── assets/             # Images and global CSS
│   ├── components/         # Reusable React components
│   │   ├── admin/          # Administrator-specific views
│   │   ├── student/        # Student-specific views
│   │   └── teacher/        # Teacher-specific views
│   ├── lib/                # Database configuration and API wrappers
│   ├── App.tsx             # Main routing and role-based access control
│   ├── main.tsx            # React DOM entry point
│   └── types.ts            # TypeScript interfaces (Admin, Student, Module, etc.)
├── server.ts               # Express backend server entry point
├── package.json            # Project dependencies and scripts
└── vite.config.ts          # Vite bundler configuration
```

## Application Workflow
- **Student Workflow**: Login → View Dashboard → Access Modules → Download Learning Materials → View Assignments → Upload Submission → Await Grading → Download Result Slip.
- **Teacher Workflow**: Login → View Assigned Modules → Create Assignments (set deadlines/marks) → Wait for Submissions → Grade & Provide Feedback.
- **Admin Workflow**: Login → Add Modules → Register Teachers & Students → Assign Modules to Teachers/Students.

## Assignment Management
- **Creation & Publishing**: Teachers and Admins can create assignments specifying Title, Instructions, Start Time, Deadline, and Maximum Marks. Published assignments automatically notify enrolled students.
- **Submission**: Students upload their work (files) before the deadline.
- **Grading**: Teachers view submissions, assign numeric grades, and leave feedback.
- **Results**: Once graded, students can view their marks and generate an official PDF Result Slip containing a verification QR code.

## Progressive Web App
The application is fully configured as a PWA:
- Features a `manifest.json` for app metadata and icons.
- Includes a service worker (`sw.js` registration in `index.html`) for caching and offline capabilities.
- Implements a custom `PWAInstallPrompt` component that gracefully prompts users to install the app on supported desktop browsers and provides specific "Add to Home Screen" instructions for iOS users.

## Development
To run the application locally in development mode:

```bash
# Starts the development server using tsx
npm run dev
```

The application runs on `http://localhost:3000` (or as configured in your environment).

## Production Build
To create an optimized production build:

```bash
# Bundles the frontend with Vite and the backend with esbuild
npm run build

# Starts the compiled production server
npm run start
```

## Deployment
The project is configured for containerized/serverless deployments. 
- **Vercel**: Includes a `vercel.json` file for frontend SPA routing fallbacks.
- **Cloud Run / Custom Node Server**: The `npm run build` script compiles a standalone `dist/server.cjs` backend, designed to serve the static frontend assets and API routes on a single port for easy Dockerization and deployment.

## Security Considerations
- **Environment Secrets**: Never commit `.env` files. Ensure `GEMINI_API_KEY` and other sensitive tokens are securely injected via deployment environments.
- **Authentication**: Passwords are cryptographically hashed. The UI implements rate-limiting and lockout timers after multiple failed login attempts.
- **Row-Level Security (RLS)**: Ensure proper Supabase RLS policies are applied directly in the Insforge dashboard so users cannot query data they do not own.
- **Authorization**: The Express server and React router enforce strict boundary checks (`role === 'admin' | 'teacher' | 'student'`) before rendering portals or executing sensitive logic.

## Troubleshooting
- **Dependencies failing to install**: Ensure you are using a recent version of Node (v18+). Try removing `node_modules` and `package-lock.json`, then run `npm install` again.
- **Database Connection Problems**: Verify that your `VITE_INSFORGE_URL` and `VITE_INSFORGE_ANON_KEY` are correct in your `.env` file and that your Insforge instance is active.
- **Authentication Problems / Lockout**: If you are locked out of the UI due to too many failed attempts, clear your browser's `localStorage` to reset the client-side attempt counter (Note: Production environments should also enforce this server-side).
- **Assignments Failing to Publish**: Ensure the Insforge database `assignments` table has `start_time` and `deadline` columns explicitly set to `TIMESTAMPTZ` to match the application's serialization logic.

## Contributing
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/new-feature`).
3. Commit your changes (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature/new-feature`).
5. Open a Pull Request.

## License
No license has currently been specified for this project.

## Author
Jirvinho Software World
