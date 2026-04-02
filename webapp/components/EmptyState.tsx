interface EmptyStateProps {
  heading: string
  subtitle: string
  icon?: React.ReactNode
}

const DefaultIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-12 h-12 text-gray-300"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
    />
  </svg>
)

export default function EmptyState({ heading, subtitle, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      {icon ?? DefaultIcon}
      <p className="text-lg font-semibold text-gray-700">{heading}</p>
      <p className="text-sm text-gray-400">{subtitle}</p>
    </div>
  )
}
