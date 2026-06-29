import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Colors } from '../constants/colors'

export type AppSection = 'dashboard' | 'record' | 'notification' | 'chat'

const TABS: { key: Exclude<AppSection, 'dashboard' | 'chat'>; label: string }[] = []

export default function BottomNav({ active, onChange }: { active: AppSection; onChange: (section: AppSection) => void }) {
  return (
    <View style={styles.wrap}>
      {TABS.map(tab => {
        const selected = active === tab.key
        return (
          <TouchableOpacity key={tab.key} style={[styles.tab, selected && styles.tabActive]} onPress={() => onChange(tab.key)}>
            <Text style={[styles.tabText, selected && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  tabActive: { borderColor: Colors.brand, backgroundColor: 'rgba(92,122,94,0.12)' },
  tabText: { color: Colors.textMuted, fontSize: 18, fontWeight: '900' },
  tabTextActive: { color: Colors.brandDark },
})
