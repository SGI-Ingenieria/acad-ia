import { createFileRoute } from '@tanstack/react-router'
import { Sparkles, Send, Paperclip, Target, UserCheck, Lightbulb, FileText } from "lucide-react"
import { useState } from 'react' // Importamos useState
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"


export const Route = createFileRoute('/planes2/$planId/iaplan')({
  component: RouteComponent,
})

function RouteComponent() {
  // 1. Estado para el texto del input
  const [inputValue, setInputValue] = useState('')
  
  // 2. Estado para la lista de mensajes (iniciamos con los de la imagen)
  const [messages, setMessages] = useState([
    { id: 1, role: 'ai', text: 'Hola, soy tu asistente de IA para el diseño del plan de estudios...' },
    { id: 2, role: 'user', text: 'jkasakj' },
    { id: 3, role: 'ai', text: 'Entendido. Estoy procesando tu solicitud.' },
  ])

  // 3. Función para enviar el mensaje
  const handleSend = () => {
    if (!inputValue.trim()) return

    // Agregamos el mensaje del usuario
    const newMessage = {
      id: Date.now(),
      role: 'user',
      text: inputValue
    }

    setMessages([...messages, newMessage])
    setInputValue('') // Limpiamos el input
  }

  return (
    <div className="flex h-[calc(100vh-200px)] gap-6 p-4">
      <div className="flex flex-col flex-1 bg-slate-50/50 rounded-xl border relative overflow-hidden">
        
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6 max-w-3xl mx-auto">
            {/* 4. Mapeamos los mensajes dinámicamente */}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                {msg.role === 'ai' && (
                  <Avatar className="h-8 w-8 border bg-teal-50">
                    <AvatarFallback className="text-teal-600"><Sparkles size={16}/></AvatarFallback>
                  </Avatar>
                )}
                
                <div className={msg.role === 'ai' ? 'space-y-2' : ''}>
                  {msg.role === 'ai' && <p className="text-xs font-bold text-teal-700 uppercase tracking-wider">Asistente IA</p>}
                  <div className={`p-4 rounded-2xl text-sm shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-teal-600 text-white rounded-tr-none' 
                      : 'bg-white border text-slate-700 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* 5. Input vinculado al estado */}
        <div className="p-4 bg-white border-t">
          <div className="max-w-4xl mx-auto flex gap-2 items-center bg-slate-50 border rounded-lg px-3 py-1 shadow-sm focus-within:ring-1 focus-within:ring-teal-500 transition-all">
            <Input 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()} // Enviar con Enter
              className="border-none bg-transparent focus-visible:ring-0 text-sm" 
              placeholder='Escribe tu solicitud... Usa ":" para mencionar campos'
            />
            <Button variant="ghost" size="icon" className="text-slate-400">
              <Paperclip size={18} />
            </Button>
            <Button 
              onClick={handleSend}
              size="icon" 
              className="bg-teal-600 hover:bg-teal-700 h-8 w-8"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Panel lateral (se mantiene igual) */}
      <div className="w-72 space-y-4">
        <div className="flex items-center gap-2 text-orange-500 font-semibold text-sm mb-4">
          <Lightbulb size={18} />
          Acciones rápidas
        </div>
        <div className="space-y-2">
          <ActionButton icon={<Target className="text-teal-500" size={18} />} text="Mejorar objetivo general" />
          <ActionButton icon={<UserCheck className="text-slate-500" size={18} />} text="Redactar perfil de egreso" />
          <ActionButton icon={<Lightbulb className="text-blue-500" size={18} />} text="Sugerir competencias" />
          <ActionButton icon={<FileText className="text-teal-500" size={18} />} text="Justificar pertinencia" />
        </div>
      </div>
    </div>
  )
}

function ActionButton({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3 px-4 text-sm font-normal hover:bg-slate-50 border-slate-200 shadow-sm text-slate-700">
      {icon}
      {text}
    </Button>
  )
}