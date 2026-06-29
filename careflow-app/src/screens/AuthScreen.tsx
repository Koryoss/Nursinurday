import { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Radius } from '../constants/colors'
import { hasSupabaseConfig, supabase } from '../lib/supabase'

export default function AuthScreen() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const sendOtp = async () => {
    if (!email.trim() || loading) return
    setLoading(true)
    setMessage('')

    if (!hasSupabaseConfig) {
      setMessage('Supabase 환경변수를 먼저 설정해 주세요.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: 'careflow://auth/callback',
      },
    })

    setLoading(false)
    if (error) {
      setMessage('로그인 코드를 보내지 못했어요. 이메일과 Supabase 설정을 함께 볼까요?')
      return
    }
    setSent(true)
    setMessage('메일로 받은 로그인 코드나 링크를 확인해 주세요.')
  }

  const verifyOtp = async () => {
    if (!email.trim() || !otp.trim() || loading) return
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: 'email',
    })

    setLoading(false)
    if (error) setMessage('코드를 확인하지 못했어요. 새 코드를 받아 함께 볼까요?')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <Text style={styles.brand}>CareFlow</Text>
          <Text style={styles.title}>기록을 이어서 볼까요?</Text>
          <Text style={styles.body}>
            이메일로 로그인 코드를 받아 같은 Supabase 기록 공간에 들어갑니다.
          </Text>

          <Text style={styles.label}>이메일</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="name@example.com"
            placeholderTextColor={Colors.textLight}
            style={styles.input}
          />

          {sent && (
            <>
              <Text style={styles.label}>로그인 코드</Text>
              <TextInput
                value={otp}
                onChangeText={setOtp}
                autoCapitalize="none"
                keyboardType="number-pad"
                placeholder="메일의 6자리 코드"
                placeholderTextColor={Colors.textLight}
                style={styles.input}
              />
            </>
          )}

          <TouchableOpacity style={styles.primaryBtn} onPress={sent ? verifyOtp : sendOtp} disabled={loading}>
            {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.primaryText}>{sent ? '로그인하기' : '로그인 코드 받기'}</Text>}
          </TouchableOpacity>

          {sent && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={sendOtp} disabled={loading}>
              <Text style={styles.secondaryText}>코드 다시 받기</Text>
            </TouchableOpacity>
          )}

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Text style={styles.notice}>
            CareFlow는 진단이나 처방을 대신하지 않는 자기관찰 도구예요. 몸의 변화가 걱정될 때는 의료진과 함께 확인해 주세요.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  wrap: { flex: 1, justifyContent: 'center', padding: 18 },
  card: { backgroundColor: Colors.card, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.border, padding: 22 },
  brand: { color: Colors.brandDark, fontSize: 22, fontWeight: '900', marginBottom: 22 },
  title: { color: Colors.text, fontSize: 28, fontWeight: '900', lineHeight: 36 },
  body: { color: Colors.textMuted, fontSize: 16, lineHeight: 24, marginTop: 12, marginBottom: 24 },
  label: { color: Colors.textMuted, fontSize: 15, fontWeight: '900', marginBottom: 8 },
  input: { minHeight: 54, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 13, color: Colors.text, backgroundColor: Colors.white, marginBottom: 14, fontSize: 16 },
  primaryBtn: { minHeight: 56, backgroundColor: Colors.brand, borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryText: { color: Colors.white, fontSize: 17, fontWeight: '900' },
  secondaryBtn: { minHeight: 50, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: Colors.brandDark, fontSize: 16, fontWeight: '900' },
  message: { color: Colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: 12 },
  notice: { color: Colors.textLight, fontSize: 14, lineHeight: 21, marginTop: 20 },
})
