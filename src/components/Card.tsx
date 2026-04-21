export default function Card({ children }: { children: any }) {
  return (
    <div
      className="bg-white rounded-lg shadow-sm border p-6 transition-all duration-300 hover:shadow-md hover:border-[var(--isipp-bordo)]/40"
      style={{
        borderColor: 'var(--siu-border)',
        backgroundColor: 'var(--siu-panel)'
      }}
    >
      {children}
    </div>
  )
}
