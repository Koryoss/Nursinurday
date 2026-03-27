// AI가 응답 생성 중일 때 표시되는 타이핑 애니메이션
'use client'

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 mb-4">
      {/* 아바타 */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: '#28C840', color: '#fff' }}>
        💚
      </div>
      {/* 점 애니메이션 */}
      <div className="rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1" style={{ background: '#FFF8EC', border: '1px solid #EAD9BA' }}>
        <div className="w-2 h-2 rounded-full bg-gray-400 typing-dot" />
        <div className="w-2 h-2 rounded-full bg-gray-400 typing-dot" />
        <div className="w-2 h-2 rounded-full bg-gray-400 typing-dot" />
      </div>
    </div>
  )
}
