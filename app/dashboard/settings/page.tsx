'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Save, User, LogOut, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore, type Language } from '@/store/useStore'
import { useTranslation } from '@/lib/i18n/useTranslation'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

type FormData = z.infer<typeof schema>

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
]

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const t = useTranslation()
  const [loading, setLoading] = useState(false)
  const [signOutLoading, setSignOutLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)

  const userEmail = useAppStore((s) => s.userEmail)
  const setUserProfile = useAppStore((s) => s.setUserProfile)
  const language = useAppStore((s) => s.language)
  const setLanguage = useAppStore((s) => s.setLanguage)

  const handleSignOut = async () => {
    setSignOutLoading(true)
    await supabase.auth.signOut()
    toast.success(t.settings.signedOut)
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
      const email = user.email || ''
      const { data } = await supabase.from('profiles').select('name').eq('id', user.id).single()
      if (data) {
        setValue('name', data.name)
        setUserProfile(data.name, email)
      }
      setProfileLoading(false)
    }
    loadProfile()
  }, [supabase, setValue, setUserProfile])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ name: data.name })
      .eq('id', user.id)

    if (error) {
      toast.error(t.settings.profileFailed)
    } else {
      setUserProfile(data.name, userEmail)
      toast.success(t.settings.profileUpdated)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{t.settings.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t.settings.subtitle}</p>
      </div>

      {/* Profile */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">{t.settings.profile}</h2>
            <p className="text-muted-foreground text-xs">{userEmail}</p>
          </div>
        </div>

        {profileLoading ? (
          <div className="h-12 bg-muted/40 rounded-xl animate-pulse" />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.settings.displayName}</Label>
              <Input
                id="name"
                placeholder={t.settings.namePlaceholder}
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
              {loading ? t.settings.saving : t.settings.saveChanges}
            </Button>
          </form>
        )}
      </div>

      {/* Language */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">{t.settings.language}</h2>
            <p className="text-muted-foreground text-xs">{t.settings.languageSubtitle}</p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          {LANGUAGES.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => setLanguage(code)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                language === code
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sign Out */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">{t.settings.signOut}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{userEmail}</p>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            disabled={signOutLoading}
            className="h-10 gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="w-4 h-4" />
            {signOutLoading ? t.settings.signingOut : t.settings.signOut}
          </Button>
        </div>
      </div>
    </div>
  )
}
