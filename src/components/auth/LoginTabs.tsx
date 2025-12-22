interface Props {
  value: 'internal' | 'external'
  onChange: (v: 'internal' | 'external') => void
}

export function LoginTabs({ value, onChange }: Props) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
      {[
        { key: 'internal', label: 'Interno' },
        { key: 'external', label: 'Externo' },
      ].map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key as any)}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition
            ${
              value === tab.key
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500'
            }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
