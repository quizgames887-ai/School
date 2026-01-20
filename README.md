# School Lecture Schedule Management App

A comprehensive lecture schedule management system built with Next.js, Convex, and Clerk authentication.

## Features

- **Admin Dashboard**: Overview of teachers, classes, subjects, and scheduled lectures
- **Teacher Management**: Create, edit, and manage teachers with subject assignments
- **Class Management**: Manage classes with grade and academic year information
- **Curriculum Management**: Hierarchical curriculum structure (Subjects → Units → Lessons) with prerequisites
- **Schedule Management**: Weekly calendar view with conflict detection and curriculum alignment validation
- **Teacher View**: Personal schedule view for teachers
- **Real-time Updates**: Automatic updates using Convex subscriptions
- **Conflict Detection**: Prevents scheduling conflicts (same teacher/class at overlapping times)
- **Curriculum Alignment**: Ensures prerequisites and lesson order are respected

## Tech Stack

- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **Backend**: Convex (database, real-time queries, mutations, actions)
- **Authentication**: Clerk
- **Deployment**: Vercel (frontend), Convex (backend)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up Convex:
```bash
npx convex dev
```

3. Set up Clerk:

   **Step 1: Create a Clerk Account**
   - Go to [https://clerk.com](https://clerk.com)
   - Sign up for a free account (or log in if you already have one)
   - Create a new application or select an existing one

   **Step 2: Get Your Clerk API Keys**
   - In your Clerk Dashboard, navigate to **API Keys** (found in the sidebar under "Configure")
   - You'll see two keys:
     - **Publishable Key**: Starts with `pk_test_` (for development) or `pk_live_` (for production)
     - **Secret Key**: Starts with `sk_test_` (for development) or `sk_live_` (for production)
   - Copy both keys - you'll need them for your `.env.local` file

   **Step 3: Configure Webhooks (Required for User Sync)**
   - In your Clerk Dashboard, go to **Webhooks** (found in the sidebar under "Configure")
   - Click **"Add Endpoint"**
   - Enter your webhook URL:
     - For local development: `http://localhost:3000/api/webhooks/clerk`
     - For production: `https://your-domain.com/api/webhooks/clerk`
   - Select the events to listen to:
     - ✅ `user.created`
     - ✅ `user.updated`
   - Click **"Create"**
   - After creating the webhook, click on it to view details
   - Copy the **Signing Secret** (this is your `WEBHOOK_SECRET`)
   - **Important**: For local development, you'll need to use a tool like [ngrok](https://ngrok.com) or Clerk's webhook testing feature to expose your local server

   **Step 4: Configure Environment Variables**
   - In your project root directory, create a file named `.env.local`
   - Add the following variables:
   ```
   NEXT_PUBLIC_CONVEX_URL=your_convex_url
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
   CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
   WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```
   - Replace the placeholder values:
     - `NEXT_PUBLIC_CONVEX_URL`: Your Convex deployment URL (from step 2)
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk Publishable Key (from Step 2)
     - `CLERK_SECRET_KEY`: Your Clerk Secret Key (from Step 2)
     - `WEBHOOK_SECRET`: Your Webhook Signing Secret (from Step 3)

   **Note**: 
   - Never commit `.env.local` to version control (it should already be in `.gitignore`)
   - The `NEXT_PUBLIC_` prefix makes variables available to the browser
   - Variables without `NEXT_PUBLIC_` are server-side only (more secure)

5. Run the development server:
```bash
npm run dev
```

## Project Structure

```
School/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── admin/           # Admin dashboard and management pages
│   ├── teacher/         # Teacher view pages
│   └── layout.tsx       # Root layout
├── components/
│   ├── ui/              # Reusable UI components
│   ├── layout/          # Layout components
│   └── Calendar.tsx     # Calendar component
├── convex/
│   ├── schema.ts        # Database schema
│   ├── queries/         # Convex queries
│   ├── mutations/       # Convex mutations
│   └── actions/         # Convex actions
└── lib/                 # Utility functions
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Deploy Convex

```bash
npx convex deploy
```

## Usage

1. **Login**: Use Clerk authentication to log in
2. **Admin Access**: Admins can manage teachers, classes, curriculum, and schedules
3. **Teacher Access**: Teachers can view their personal schedules
4. **Schedule Management**: Create lectures with automatic conflict detection
5. **Curriculum Management**: Build curriculum hierarchy with prerequisites

## Notes

- All Convex queries are reactive by default, providing real-time updates
- Conflict detection runs automatically when creating/editing lectures
- Curriculum validation ensures proper lesson sequencing
