# AmmaLedger 📒

**AmmaLedger** is a beautifully designed, mobile-first family finance manager. Built specifically to be simple, elder-friendly, and highly visual, it helps track monthly salaries, manage distinct savings funds, and monitor daily household expenses seamlessly.

![AmmaLedger Dashboard Overview](https://via.placeholder.com/1200x630/0f172a/f97316?text=AmmaLedger+-+Family+Finance+Manager)

## ✨ Key Features

* **📱 Mobile-First & Elder-Friendly:** Large touch targets, intuitive bottom navigation, and high-contrast typography designed for effortless use on smartphones.
* **💰 Intelligent Salary Allocation:** Whenever a salary is added, easily divide it into dedicated buckets (e.g., Savings, Household Balance, Personal Fund).
* **🏦 Fund Tracking:** A dedicated funds dashboard to see cumulative allocated amounts, total withdrawals, and the live available balance for each bucket.
* **🛍️ Expense Categorization:** Quickly log expenses and deduct them from specific funds with visual, color-coded categories.
* **📊 Visual Insights:** Interactive pie charts for spending breakdown and a 6-month bar chart trend analysis to track savings growth.
* **📄 One-Click Reports:** Generate and download monthly financial reports in both PDF and Excel formats.
* **🔒 Secure by Default:** Fully authenticated system backed by Supabase with Row Level Security (RLS) ensuring your financial data is private.

## 🛠️ Tech Stack

* **Frontend:** [Next.js 16](https://nextjs.org/) (App Router), React 19, TypeScript
* **Styling:** Tailwind CSS, custom vanilla CSS (glassmorphism UI, saffron-orange gradients)
* **Components:** [shadcn/ui](https://ui.shadcn.com/), Lucide Icons
* **Charts:** Recharts
* **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL, GoTrue Auth)
* **Forms & Validation:** React Hook Form, Zod

## 🚀 Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/ammaledger.git
cd ammaledger
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Supabase Environment
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Run the Database Migration
Run the SQL script located at `supabase/migration.sql` in your Supabase project's SQL Editor to create the necessary tables (`profiles`, `salaries`, `allocations`, `expenses`) and security policies.

### 5. Start the Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## 📦 Deployment

AmmaLedger is optimized for deployment on **Vercel**. 
Simply import your GitHub repository into Vercel, add the Supabase environment variables, and hit deploy. Next.js server-side features and middleware will be automatically configured.

---
*Designed with ❤️ for family finance management.*
