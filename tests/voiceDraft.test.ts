import assert from 'node:assert/strict'
import { parseVoiceDraftText } from '../lib/voiceDraft'

const tinnitus = parseVoiceDraftText('저녁에 삐 소리 6점, 초조함은 조금 있었고 사람이 많았어요.')
assert.equal(tinnitus.bucket, 'evening')
assert.deepEqual(tinnitus.symptoms, [{ symptom: 'tinnitus', score: 6 }])
assert.deepEqual(tinnitus.affects, [{ affect: 'anxiety', score: null }])
assert.equal(tinnitus.context.crowded, true)
assert.ok(tinnitus.needsConfirmation.includes('불안은 0-10 중 어디에 가까웠나요?'))

const dizziness = parseVoiceDraftText('오늘 아침 어지럼 7, 귀 울림은 심했고 시끄러움이 있었어요.')
assert.equal(dizziness.bucket, 'morning')
assert.deepEqual(dizziness.symptoms, [
  { symptom: 'dizziness', score: 7 },
  { symptom: 'tinnitus', score: null },
])
assert.equal(dizziness.context.noise, true)
assert.ok(dizziness.needsConfirmation.includes('이명은 0-10 중 어디에 가까웠나요?'))

const emergency = parseVoiceDraftText('응급으로 휘청 8점, 긴장 5점, 기온차가 컸어요.')
assert.equal(emergency.bucket, 'attack')
assert.deepEqual(emergency.symptoms, [{ symptom: 'gait', score: 8 }])
assert.deepEqual(emergency.affects, [{ affect: 'tension', score: 5 }])
assert.equal(emergency.context.weather_change, true)

console.log('voiceDraft mapping tests passed')
