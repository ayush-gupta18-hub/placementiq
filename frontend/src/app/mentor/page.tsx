"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, User, Bot, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Message = {
    role: "user" | "mentor"
    text: string
}

export default function MentorPage() {
    const [messages, setMessages] = useState<Message[]>([
        { role: "mentor", text: "Hi! I'm your AI Career Mentor. I can help you with company-specific prep, interview strategies, or general career advice. How can I help you land your dream job today?" }
    ])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const userMsg = { role: "user" as "user", text: input }
        setMessages(prev => [...prev, userMsg])
        setInput("")
        setLoading(true)

        try {
            const apiMsgFormat = messages.map(m => ({ role: m.role === 'mentor' ? 'assistant' : 'user', text: m.text }))
            apiMsgFormat.push({ role: 'user', text: userMsg.text })

            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
            const response = await fetch(`${API_URL}/api/mentor/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: apiMsgFormat })
            })
            const data = await response.json()
            setMessages(prev => [...prev, { role: "mentor", text: data.response }])
        } catch (err) {
            console.error(err)
            setMessages(prev => [...prev, { role: "mentor", text: "Oops, I'm having trouble connecting right now. Let's try again in a moment." }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container px-4 py-8 mx-auto max-w-4xl h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex flex-col items-center text-center mb-6 space-y-2 shrink-0">
                <div className="p-2 bg-primary/10 rounded-full inline-flex mb-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">AI Career Mentor</h1>
                <p className="text-muted-foreground">
                    Ask me how to crack top companies, structure your resume, or prepare for interviews.
                </p>
            </div>

            <Card className="flex-1 overflow-hidden flex flex-col shadow-lg border-primary/10">
                <CardHeader className="border-b bg-muted/30 py-4 shrink-0">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Bot className="w-5 h-5 text-primary" />
                        Expert Guidance
                    </CardTitle>
                    <CardDescription>Powered by Gemini AI</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 relative">
                    <AnimatePresence>
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary border text-secondary-foreground"}`}>
                                        {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                                    </div>
                                    <div className={`p-4 rounded-xl text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted border border-border/50"}`}>
                                        <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start"
                        >
                            <div className="flex gap-3 max-w-[80%]">
                                <div className="w-8 h-8 rounded-full bg-secondary border flex items-center justify-center shrink-0">
                                    <Bot size={16} />
                                </div>
                                <div className="p-4 rounded-xl bg-muted border border-border/50 text-sm flex items-center gap-2 text-muted-foreground">
                                    Thinking <span className="flex gap-1"><span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span></span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </CardContent>

                <div className="p-4 bg-background border-t shrink-0">
                    <form onSubmit={handleSend} className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="e.g. How do I crack Atlassian?"
                            className="flex-1"
                            disabled={loading}
                            autoComplete="off"
                        />
                        <Button type="submit" disabled={!input.trim() || loading} className="w-12 h-10 p-0 shrink-0">
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    )
}
