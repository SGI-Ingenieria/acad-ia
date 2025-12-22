interface Props {
  text?: string
}

export function SubmitButton({ text = 'Iniciar sesión' }: Props) {
  return (
    <button
      type="submit"
      className="w-full bg-[#7b0f1d] text-white py-2 rounded-lg
                 font-semibold hover:opacity-90 transition"
    >
      {text}
    </button>
  )
}
