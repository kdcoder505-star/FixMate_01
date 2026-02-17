
# FixMate - College Issue Reporting & Resolution System

A full-stack web application for managing campus issues, built with HTML, CSS, JavaScript (Bootstrap 5), and Supabase.

## 🚀 Features

### Common
- **Authentication**: Secure Login with Role selection (Student/Admin).
- **Responsive Design**: Mobile-first, glassmorphism aesthetics.

### 👩🎓 Student Module
- **Dashboard**: View stats and recent complaints.
- **New Complaint**: Submit issues with categories, priority, and image upload.
- **Track Progress**: Visual stepper to track complaint status.
- **History**: View past complaints.

### 🧑💼 Admin Module
- **Dashboard**: Overview of high priority and pending issues.
- **Manage Complaints**: Filter, view details, and update status (Pending -> Reviewed -> In Progress -> Resolved).
- **User Management**: List users (Creation requires Edge Functions or Dashboard).
- **Archive**: View resolved history.

## 🛠️ Setup Instructions

### 1. Supabase Setup
1. Create a new Project at [database.new](https://database.new).
2. Go to the **SQL Editor** in Supabase.
3. specific the contents of `supabase_schema.sql` and run it to create tables and policies.
4. Go to **Storage**, create a new public bucket named `complaint-images`.
5. Go to **Authentication > Settings**, ensure Email Auth is enabled (Turn off "Confirm Email" if you want easier testing).

### 2. Connect App
1. Open `js/supabase-client.js`.
2. Replace `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` with your project keys from Supabase Settings -> API.

### 3. Create First Admin
1. Go to Supabase Dashboard -> Authentication -> Add User.
2. Create an admin user (e.g., `admin@college.edu`).
3. Copy the `User UID`.
4. Go to Table Editor -> `profiles` table.
5. Insert a row: 
   - `id`: (Paste UID)
   - `email`: `admin@college.edu`
   - `role`: `admin`

### 4. Run Globally (or Locally)
- Open `index.html` in your browser (preferably using Live Server extension in VS Code for proper routing).

## 🔒 Security
- **RLS (Row Level Security)** is enabled.
- Students can only see their own data.
- Admins can see all data.
- Inputs are validated.

---
*Created for FixMate Project.*


Student: student@college.edu / password
Admin: admin@college.edu / password