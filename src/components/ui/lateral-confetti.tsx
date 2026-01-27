// src/components/ui/lateral-confetti.tsx

import confetti from 'canvas-confetti'

export function lateralConfetti() {
  // 1. Reset para limpiar cualquier configuración vieja pegada en memoria
  confetti.reset()

  const duration = 1500
  const end = Date.now() + duration

  // 2. Colores vibrantes (cálidos primero)
  const vibrantColors = [
    '#FF0000', // Rojo puro
    '#fcff42', // Amarillo
    '#88ff5a', // Verde
    '#26ccff', // Azul
    '#a25afd', // Morado
  ]

  ;(function frame() {
    const commonSettings = {
      particleCount: 5,
      spread: 55,
      // origin: { x: 0.5 }, // No necesario si definimos origin abajo, pero útil en otros contextos
      colors: vibrantColors,
      zIndex: 99999,
    }

    // Cañón izquierdo
    confetti({
      ...commonSettings,
      angle: 60,
      origin: { x: 0, y: 0.6 },
    })

    // Cañón derecho
    confetti({
      ...commonSettings,
      angle: 120,
      origin: { x: 1, y: 0.6 },
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  })()
}
