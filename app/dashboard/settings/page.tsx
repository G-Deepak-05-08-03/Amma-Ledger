'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Save, User, Wallet, ExternalLink, ClipboardList, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

type FormData = z.infer<typeof schema>

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [signOutLoading, setSignOutLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')

  const handleSignOut = async () => {
    setSignOutLoading(true)
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
    router.refresh()
  }

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserEmail(user.email || '')
      const { data } = await supabase.from('profiles').select('name').eq('id', user.id).single()
      if (data) setValue('name', data.name)
      setProfileLoading(false)
    }
    loadProfile()
  }, [supabase, setValue])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ name: data.name })
      .eq('id', user.id)

    if (error) toast.error('Failed to update profile')
    else toast.success('Profile updated!')
    setLoading(false)
  }

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Profile</h2>
            <p className="text-muted-foreground text-xs">{userEmail}</p>
          </div>
        </div>

        {profileLoading ? (
          <div className="h-12 bg-muted/40 rounded-xl animate-pulse" />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                className="h-12 bg-muted/50 text-base"
                {...register('name')}
              />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-11 font-semibold"
              style={{ background: 'linear-gradient(135deg, hsl(30,95%,55%), hsl(45,100%,65%))' }}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        )}
      </div>

      {/* App info */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-semibold">About AmmaLedger</h2>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="text-foreground font-medium">1.0.0 MVP</span>
          </div>
          <div className="flex justify-between">
            <span>Database</span>
            <span className="text-foreground font-medium">Supabase PostgreSQL</span>
          </div>
          <div className="flex justify-between">
            <span>Currency</span>
            <span className="text-foreground font-medium">Indian Rupee (₹ INR)</span>
          </div>
        </div>
      </div>

      {/* Supabase SQL setup hint */}
      <div className="rounded-2xl p-5 border"
        style={{ background: 'rgba(249,115,22,0.06)', borderColor: 'rgba(249,115,22,0.2)' }}>
        <h3 className="font-semibold text-sm text-orange-400 mb-2 flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />
          Database Setup Required
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Run the SQL migration in your Supabase project dashboard to create the required tables.
          Find the migration file at <code className="text-orange-300">supabase/migration.sql</code> in the project.
        </p>
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          Open Supabase Dashboard <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Sign Out */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Sign Out</p>
            <p className="text-xs text-muted-foreground mt-0.5">{userEmail}</p>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            disabled={signOutLoading}
            className="h-10 gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="w-4 h-4" />
            {signOutLoading ? 'Signing out...' : 'Sign Out'}
          </Button>
        </div>
      </div>
    </div>
  )
}
