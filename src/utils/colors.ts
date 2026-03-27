// Convierte HSL a Hexadecimal
function hslToHex(h: number, s: number, l: number): string {
  l /= 100
  const a = (s * Math.min(l, 1 - l)) / 100
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

/**
 * Genera un color contrastante.
 * @param prevHue El tono (0-360) del color anterior. Null si es el primero.
 * @returns Objeto con el hex y el nuevo hue para guardar como referencia.
 */
export function generarColorContrastante(prevHue: number | null = null) {
  let newHue: number

  if (prevHue === null) {
    // Primer color: completamente al azar
    newHue = Math.floor(Math.random() * 360)
  } else {
    // Siguientes: Salto aleatorio entre 130° y 230° para forzar contraste
    const salto = 130 + Math.floor(Math.random() * 100)
    newHue = (prevHue + salto) % 360
  }

  // Mantenemos saturación al 70% y luminosidad al 50% para colores vivos pero no fosforescentes
  const hex = hslToHex(newHue, 70, 50)

  return { hex, hue: newHue }
}
