interface InputProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}

export function Input({
  label,
  value,
  onChange,
  type = 'text',
}: InputProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2
                   focus:outline-none focus:ring-2 focus:ring-[#7b0f1d]"
      />
    </div>
  )
}
