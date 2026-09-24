import { ActivityIndicator, Animated, Easing, Linking, StyleSheet, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useEffect, useRef, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'

import RecordScreen from './src/screens/RecordScreen'
import NotificationScreen from './src/screens/NotificationScreen'
import ChatScreen from './src/screens/ChatScreen'
import DashboardScreen from './src/screens/DashboardScreen'
import WeeklyReviewScreen from './src/screens/WeeklyReviewScreen'
import AuthScreen from './src/screens/AuthScreen'
import OnboardingScreen from './src/screens/OnboardingScreen'
import { Colors } from './src/constants/colors'
import { supabase } from './src/lib/supabase'
import { logUsage } from './src/lib/usageLog'

type AppSection = 'dashboard' | 'record' | 'notification' | 'chat' | 'weeklyReview'

function paramsFromUrl(url: string) {
  const parsed = new URL(url)
  const hash = parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash
  const hashParams = new URLSearchParams(hash)
  const searchParams = parsed.searchParams
  return {
    code: searchParams.get('code') ?? hashParams.get('code'),
    accessToken: hashParams.get('access_token'),
    refreshToken: hashParams.get('refresh_token'),
  }
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [profileReady, setProfileReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<AppSection>('dashboard')
  const [weeklyReviewEndDate, setWeeklyReviewEndDate] = useState(() => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }))
  const transition = useRef(new Animated.Value(1)).current

  const loadProfile = async (user: User | null) => {
    if (!user || user.is_anonymous) {
      setProfileReady(false)
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('consented_at')
      .eq('id', user.id)
      .maybeSingle()

    setProfileReady(Boolean(data?.consented_at))
  }

  useEffect(() => {
    const handleAuthUrl = async (url: string | null) => {
      if (!url) return
      const { code, accessToken, refreshToken } = paramsFromUrl(url)
      if (code) {
        await supabase.auth.exchangeCodeForSession(code)
      } else if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      }
    }

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      await loadProfile(data.session?.user ?? null)
      setLoading(false)
    })

    Linking.getInitialURL().then(handleAuthUrl)
    const linking = Linking.addEventListener('url', event => handleAuthUrl(event.url))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      loadProfile(nextSession?.user ?? null)
    })

    return () => {
      listener.subscription.unsubscribe()
      linking.remove()
    }
  }, [])

  useEffect(() => {
    transition.setValue(0)
    Animated.timing(transition, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [activeSection, transition])

  // 베타 사용성 로깅: 화면 전환 (screen analytics)
  useEffect(() => {
    if (session?.user && !session.user.is_anonymous) {
      logUsage('screen_view', activeSection)
    }
  }, [activeSection, session])

  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg }}>
          <ActivityIndicator color={Colors.brand} />
        </View>
      </SafeAreaProvider>
    )
  }

  if (!session?.user || session.user.is_anonymous) {
    return (
      <SafeAreaProvider>
        <AuthScreen />
      </SafeAreaProvider>
    )
  }

  if (!profileReady) {
    return (
      <SafeAreaProvider>
        <OnboardingScreen user={session.user} onComplete={() => setProfileReady(true)} />
      </SafeAreaProvider>
    )
  }

  return (
    <SafeAreaProvider>
      <View style={styles.appShell}>
        <Animated.View
          style={[
            styles.screenSlot,
            {
              opacity: transition,
              transform: [
                {
                  translateY: transition.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {activeSection === 'dashboard' && (
            <DashboardScreen
              onOpenRecord={() => setActiveSection('record')}
              onOpenNotification={() => setActiveSection('notification')}
              onOpenWeeklyReview={date => {
                setWeeklyReviewEndDate(date)
                setActiveSection('weeklyReview')
              }}
            />
          )}
          {activeSection === 'record' && (
            <RecordScreen
              onBack={() => setActiveSection('dashboard')}
              onOpenChat={() => setActiveSection('chat')}
              onOpenNotification={() => setActiveSection('notification')}
            />
          )}
          {activeSection === 'notification' && (
            <NotificationScreen
              onBack={() => setActiveSection('dashboard')}
              onOpenRecord={() => setActiveSection('record')}
            />
          )}
          {activeSection === 'chat' && <ChatScreen onBack={() => setActiveSection('record')} />}
          {activeSection === 'weeklyReview' && (
            <WeeklyReviewScreen
              endDate={weeklyReviewEndDate}
              onBack={() => setActiveSection('dashboard')}
              onOpenRecord={() => setActiveSection('record')}
            />
          )}
        </Animated.View>
      </View>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  appShell: { flex: 1, backgroundColor: Colors.bg },
  screenSlot: { flex: 1, minHeight: 0 },
})
