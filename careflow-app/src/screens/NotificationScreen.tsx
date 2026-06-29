import { useState } from 'react'
import { Linking, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppHeader from '../components/AppHeader'
import { Colors, Radius } from '../constants/colors'

type ReminderKey = 'wake' | 'morning' | 'noon' | 'evening' | 'bedtime'
type Reminder = {
  label: string
  group: '수면' | '투약'
  time: string
  enabled: boolean
}

const TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const hour = Math.floor(index / 4)
  const minute = (index % 4) * 15
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
})

const INITIAL_REMINDERS: Record<ReminderKey, Reminder> = {
  wake: { label: '기상 직후', group: '수면', time: '07:00', enabled: true },
  morning: { label: '아침', group: '투약', time: '08:00', enabled: true },
  noon: { label: '점심', group: '투약', time: '12:30', enabled: false },
  evening: { label: '저녁', group: '투약', time: '19:00', enabled: true },
  bedtime: { label: '취침 전', group: '수면', time: '22:30', enabled: true },
}

function parseTime(time: string) {
  const [hour, minute] = time.split(':').map(Number)
  return { hour: hour || 0, minute: minute || 0 }
}

function AnalogClock({ time }: { time: string }) {
  const { hour, minute } = parseTime(time)
  const minuteAngle = minute * 6
  const hourAngle = ((hour % 12) + minute / 60) * 30

  return (
    <View style={styles.clockFace}>
      {[12, 3, 6, 9].map(number => (
        <Text key={number} style={[styles.clockNumber, styles[`clockNumber${number}` as keyof typeof styles]]}>{number}</Text>
      ))}
      <View style={[styles.clockHand, styles.hourHand, { transform: [{ rotate: `${hourAngle}deg` }] }]} />
      <View style={[styles.clockHand, styles.minuteHand, { transform: [{ rotate: `${minuteAngle}deg` }] }]} />
      <View style={styles.clockCenter} />
    </View>
  )
}

export default function NotificationScreen({ onBack, onOpenRecord }: { onBack?: () => void; onOpenRecord?: () => void }) {
  const [reminders, setReminders] = useState<Record<ReminderKey, Reminder>>(INITIAL_REMINDERS)
  const [activeKey, setActiveKey] = useState<ReminderKey>('morning')
  const [pickerKey, setPickerKey] = useState<ReminderKey | null>(null)
  const [message, setMessage] = useState('')
  const activeReminder = reminders[activeKey]

  const updateReminder = (key: ReminderKey, patch: Partial<Reminder>) => {
    setReminders(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  const chooseTime = (time: string) => {
    if (pickerKey) {
      updateReminder(pickerKey, { time })
      setActiveKey(pickerKey)
    }
    setPickerKey(null)
  }

  const openSystemAlarm = async () => {
    setMessage('')
    try {
      if (Platform.OS === 'android') {
        await Linking.sendIntent('android.intent.action.SET_ALARM')
        return
      }
      await Linking.openURL('clock-alarm://')
    } catch {
      setMessage('휴대폰 시계 앱에서 같은 시간으로 알람을 맞춰주세요.')
    }
  }

  const renderReminder = (key: ReminderKey) => {
    const item = reminders[key]
    const selected = activeKey === key
    return (
      <TouchableOpacity key={key} style={[styles.reminderRow, selected && styles.reminderRowActive]} onPress={() => setActiveKey(key)}>
        <View style={{ flex: 1 }}>
          <Text style={styles.reminderLabel}>{item.label}</Text>
          <Text style={styles.reminderGroup}>{item.group} 시간</Text>
        </View>
        <TouchableOpacity style={styles.timePill} onPress={() => setPickerKey(key)}>
          <Text style={styles.timePillText}>{item.time}</Text>
        </TouchableOpacity>
        <Switch
          value={item.enabled}
          onValueChange={enabled => updateReminder(key, { enabled })}
          trackColor={{ true: Colors.brand, false: Colors.border }}
          thumbColor={Colors.white}
        />
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader
        onBack={onBack}
        right={onOpenRecord ? (
          <TouchableOpacity onPress={onOpenRecord} accessibilityLabel="기록으로 이동" style={styles.headerActionButton}>
            <Text style={styles.headerActionText}>기록</Text>
          </TouchableOpacity>
        ) : undefined}
      />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.clockCard}>
          <Text style={styles.sectionTitle}>알림 시간</Text>
          <AnalogClock time={activeReminder.time} />
          <Text style={styles.clockTime}>{activeReminder.time}</Text>
          <Text style={styles.clockLabel}>{activeReminder.label}</Text>
        </View>

        <Text style={styles.sectionTitle}>투약 시간</Text>
        {renderReminder('morning')}
        {renderReminder('noon')}
        {renderReminder('evening')}

        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>기상·취침</Text>
        {renderReminder('wake')}
        {renderReminder('bedtime')}

        <TouchableOpacity style={styles.systemAlarmButton} onPress={openSystemAlarm}>
          <Text style={styles.systemAlarmText}>휴대폰 알람 연동</Text>
        </TouchableOpacity>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>

      <Modal visible={pickerKey !== null} transparent animationType="fade" onRequestClose={() => setPickerKey(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.timePickerCard}>
            <Text style={styles.timePickerTitle}>{pickerKey ? reminders[pickerKey].label : ''}</Text>
            <ScrollView style={styles.timePickerList} contentContainerStyle={styles.timePickerContent}>
              {TIME_OPTIONS.map(time => {
                const selected = pickerKey ? reminders[pickerKey].time === time : false
                return (
                  <TouchableOpacity key={time} style={[styles.timeOption, selected && styles.timeOptionActive]} onPress={() => chooseTime(time)}>
                    <Text style={[styles.timeOptionText, selected && styles.timeOptionTextActive]}>{time}</Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setPickerKey(null)}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerActionButton: { minWidth: 58, height: 44, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  headerActionText: { color: Colors.brandDark, fontSize: 16, fontWeight: '900' },
  body: { flex: 1 },
  bodyContent: { padding: 18, paddingBottom: 36, gap: 10 },
  sectionTitle: { fontSize: 19, fontWeight: '900', color: Colors.text, marginBottom: 12 },
  clockCard: { alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.card, padding: 18, borderWidth: 1, borderColor: Colors.border, marginBottom: 6 },
  clockFace: { width: 178, height: 178, borderRadius: 89, borderWidth: 8, borderColor: Colors.brand, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginVertical: 4 },
  clockNumber: { position: 'absolute', color: Colors.textMuted, fontSize: 16, fontWeight: '900' },
  clockNumber12: { top: 11, left: 75 },
  clockNumber3: { right: 14, top: 72 },
  clockNumber6: { bottom: 9, left: 80 },
  clockNumber9: { left: 14, top: 72 },
  clockHand: { position: 'absolute', bottom: 89, left: 85, width: 6, borderRadius: 3, backgroundColor: Colors.brandDark, transformOrigin: 'bottom' },
  hourHand: { height: 48 },
  minuteHand: { height: 64, backgroundColor: Colors.accent },
  clockCenter: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.brandDark },
  clockTime: { color: Colors.text, fontSize: 31, fontWeight: '900', marginTop: 8 },
  clockLabel: { color: Colors.textMuted, fontSize: 17, fontWeight: '900', marginTop: 2 },
  reminderRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.card, borderRadius: Radius.card, padding: 14, borderWidth: 1, borderColor: Colors.border },
  reminderRowActive: { borderColor: Colors.brand, backgroundColor: Colors.relationSoft },
  reminderLabel: { fontSize: 20, fontWeight: '900', color: Colors.text },
  reminderGroup: { fontSize: 15, lineHeight: 21, color: Colors.textMuted, marginTop: 3, fontWeight: '800' },
  timePill: { minHeight: 46, minWidth: 86, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  timePillText: { color: Colors.brandDark, fontSize: 18, fontWeight: '900' },
  systemAlarmButton: { minHeight: 56, backgroundColor: Colors.brand, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  systemAlarmText: { color: Colors.white, fontSize: 19, fontWeight: '900' },
  message: { color: Colors.textMuted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(38,49,42,0.24)', justifyContent: 'center', padding: 18 },
  timePickerCard: { backgroundColor: Colors.card, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.border, padding: 16, alignSelf: 'center', width: '100%', maxWidth: 360 },
  timePickerTitle: { color: Colors.text, fontSize: 21, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  timePickerList: { maxHeight: 360 },
  timePickerContent: { gap: 8 },
  timeOption: { minHeight: 48, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  timeOptionActive: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  timeOptionText: { color: Colors.text, fontSize: 18, fontWeight: '900' },
  timeOptionTextActive: { color: Colors.white },
  closeButton: { minHeight: 52, marginTop: 14, borderRadius: Radius.md, backgroundColor: Colors.bg, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  closeButtonText: { color: Colors.brandDark, fontSize: 16, fontWeight: '900' },
})
