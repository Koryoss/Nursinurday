import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { ReactNode } from 'react'
import { Colors } from '../constants/colors'

export default function AppHeader({
  onBack,
  right,
  bottom,
  backLabel = '홈',
}: {
  onBack?: () => void
  right?: ReactNode
  bottom?: ReactNode
  backLabel?: string
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.side}>
          {onBack && (
            <TouchableOpacity onPress={onBack} accessibilityLabel="홈으로 돌아가기" style={styles.backBtn}>
              <Text style={styles.backText}>{backLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.brand}>CareFlow</Text>
        <View style={[styles.side, styles.rightSide]}>{right}</View>
      </View>
      {bottom ? <View style={styles.bottom}>{bottom}</View> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerTop: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottom: {
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingTop: 16,
    paddingBottom: 16,
  },
  side: { width: 64, alignItems: 'flex-start' },
  rightSide: { alignItems: 'flex-end' },
  brand: { flex: 1, textAlign: 'center', fontSize: 22, fontWeight: '900', color: Colors.brandDark },
  backBtn: {
    minWidth: 54,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: Colors.brandDark, fontSize: 16, fontWeight: '900' },
})
