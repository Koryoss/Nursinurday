import { useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { User } from '@supabase/supabase-js'
import { Colors, Radius } from '../constants/colors'
import { supabase } from '../lib/supabase'

type Mode = 'gentle' | 'formal'

export default function OnboardingScreen({ user, onComplete }: { user: User; onComplete: () => void }) {
  const [mode, setMode] = useState<Mode>('gentle')
  const [terms, setTerms] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const save = async () => {
    if (!terms || !privacy || saving) return
    setSaving(true)
    setMessage('')

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      chat_mode: mode,
      consented_at: new Date().toISOString(),
    }, { onConflict: 'id' })

    setSaving(false)
    if (error) {
      setMessage('동의 정보를 저장하지 못했어요. 연결 상태를 함께 볼까요?')
      return
    }
    onComplete()
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.brand}>CareFlow</Text>
        <Text style={styles.title}>오늘의 나를 위한 기록 공간이에요</Text>
        <Text style={styles.copy}>
          CareFlow는 진단이나 처방을 하지 않아요. 몸·감정·관계·의미 기록을 저장하고, 나의 변화 흐름을 함께 보기 위한 도구예요.
        </Text>

        <Text style={styles.section}>대화 모드</Text>
        <View style={styles.modeRow}>
          {[
            { value: 'gentle' as const, label: '친근 모드' },
            { value: 'formal' as const, label: '정중 모드' },
          ].map(item => (
            <TouchableOpacity key={item.value} style={[styles.modeBtn, mode === item.value && styles.modeActive]} onPress={() => setMode(item.value)}>
              <Text style={[styles.modeText, mode === item.value && styles.modeTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={styles.checkRow} onPress={() => setTerms(prev => !prev)}>
            <View style={[styles.checkBox, terms && styles.checkOn]}><Text style={styles.checkMark}>{terms ? '✓' : ''}</Text></View>
            <Text style={styles.checkText}>이용약관과 면책 안내에 동의해요. 비의료기기이며 진단·치료를 대체하지 않아요.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.checkRow} onPress={() => setPrivacy(prev => !prev)}>
            <View style={[styles.checkBox, privacy && styles.checkOn]}><Text style={styles.checkMark}>{privacy ? '✓' : ''}</Text></View>
            <Text style={styles.checkText}>개인정보 수집·이용에 동의해요(필수). 건강 관련 자기기록을 저장하고 본인 기록으로 다시 보여줘요.</Text>
          </TouchableOpacity>
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity style={[styles.primaryBtn, (!terms || !privacy) && styles.disabled]} onPress={save} disabled={!terms || !privacy || saving}>
          {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.primaryText}>기록 시작하기</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  body: { padding: 20, paddingTop: 44, gap: 16 },
  brand: { color: Colors.brandDark, fontSize: 22, fontWeight: '900' },
  title: { color: Colors.text, fontSize: 30, fontWeight: '900', lineHeight: 38, marginTop: 18 },
  copy: { color: Colors.textMuted, fontSize: 16, lineHeight: 25 },
  section: { color: Colors.textMuted, fontSize: 15, fontWeight: '900', marginTop: 10 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: { flex: 1, minHeight: 54, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: 15, backgroundColor: Colors.white, justifyContent: 'center' },
  modeActive: { borderColor: Colors.brand, backgroundColor: 'rgba(92,122,94,0.12)' },
  modeText: { color: Colors.textMuted, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  modeTextActive: { color: Colors.brandDark },
  card: { backgroundColor: Colors.card, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 14 },
  checkRow: { minHeight: 58, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  checkBox: { width: 26, height: 26, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkOn: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  checkMark: { color: Colors.white, fontSize: 16, fontWeight: '900' },
  checkText: { flex: 1, color: Colors.textMuted, fontSize: 15, lineHeight: 23 },
  message: { color: Colors.danger, fontSize: 15, lineHeight: 22 },
  primaryBtn: { minHeight: 56, backgroundColor: Colors.brand, borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  disabled: { opacity: 0.55 },
  primaryText: { color: Colors.white, fontWeight: '900', fontSize: 17 },
})
