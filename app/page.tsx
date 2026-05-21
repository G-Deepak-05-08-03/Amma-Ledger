import Link from 'next/link'
import { Wallet, PieChart, ShieldCheck, PiggyBank, ArrowRight, IndianRupee } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      
      {/* Background Gradients */}
      <div className="fixed inset-0 -z-10 bg-background">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] opacity-70 animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[hsl(187,76%,42%)]/15 blur-[120px] opacity-60" />
      </div>

      {/* Navigation */}
      <nav className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl shadow-lg shadow-primary/20"
            style={{ background: 'linear-gradient(135deg, hsl(30,95%,55%), hsl(45,100%,65%))' }}>
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight gradient-text">AmmaLedger</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold shadow-lg shadow-primary/20 glow-saffron transition-all hover:scale-105 text-white"
            style={{ background: 'linear-gradient(135deg, hsl(30,95%,55%), hsl(45,100%,65%))' }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 pt-20 pb-32 flex flex-col lg:flex-row items-center justify-between gap-16">
        
        {/* Left Copy */}
        <div className="flex-1 space-y-8 text-center lg:text-left animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            Family Finance, Simplified
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.15] tracking-tight">
            Manage your home budget with <span className="gradient-text">clarity.</span>
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            AmmaLedger is the beautiful, elder-friendly app built to track salaries, manage distinct savings funds, and monitor daily expenses seamlessly in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 justify-center lg:justify-start">
            <Link href="/register" className="inline-flex items-center justify-center h-14 px-8 rounded-full text-lg font-bold shadow-xl shadow-primary/25 glow-saffron hover:scale-105 transition-all w-full sm:w-auto text-white"
              style={{ background: 'linear-gradient(135deg, hsl(30,95%,55%), hsl(45,100%,65%))' }}>
              Start Tracking Free <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center h-14 px-8 rounded-full text-lg font-semibold border border-border bg-background/50 backdrop-blur hover:bg-muted/50 transition-all w-full sm:w-auto text-foreground">
              Log In to Account
            </Link>
          </div>
          
          <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 text-muted-foreground text-sm font-medium">
            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Secure</span>
            <span className="flex items-center gap-2"><PieChart className="w-4 h-4 text-primary" /> Visual</span>
            <span className="flex items-center gap-2"><IndianRupee className="w-4 h-4 text-blue-400" /> ₹ Supported</span>
          </div>
        </div>

        {/* Right Visual (Abstract App Representation) */}
        <div className="flex-1 w-full max-w-lg relative animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="glass-card p-6 rounded-3xl border border-white/10 shadow-2xl relative z-10 overflow-hidden group">
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Available Balance</p>
                <p className="text-4xl font-bold text-emerald-400 mt-1 flex items-center gap-1">₹45,250</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <PiggyBank className="w-6 h-6 text-emerald-400" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-muted/30 border border-white/5 hover:bg-muted/40 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary" />Savings Fund</span>
                  <span className="font-bold text-sm">₹12,000</span>
                </div>
                <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full w-[35%]" />
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-muted/30 border border-white/5 hover:bg-muted/40 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[hsl(187,76%,42%)]" />Household Balance</span>
                  <span className="font-bold text-sm">₹33,250</span>
                </div>
                <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-[hsl(187,76%,42%)] rounded-full w-[65%]" />
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-transparent border-l-2 border-primary">
              <p className="text-sm">"Finally, a finance app simple enough for the whole family to use."</p>
            </div>
          </div>

          {/* Floating decorative elements */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-primary to-[hsl(45,100%,65%)] rounded-2xl blur-xl opacity-40 animate-pulse-slow" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-[hsl(187,76%,42%)] to-blue-500 rounded-full blur-xl opacity-30" />
        </div>
      </main>
    </div>
  )
}
