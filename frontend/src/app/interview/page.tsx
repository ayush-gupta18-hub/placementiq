"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Bot, User, Send, Mic, StopCircle, Video, Play, PhoneOff, Settings2, ShieldCheck, Building2, Briefcase } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export default function MockInterviewPage() {
    const [messages, setMessages] = useState<{ role: string, text: string, time: string }[]>([])
    const [input, setInput] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [sessionActive, setSessionActive] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [showEvaluation, setShowEvaluation] = useState(false)
    const [isCameraOn, setIsCameraOn] = useState(false)
    const [evalData, setEvalData] = useState<any>(null)
    const [isEvaluating, setIsEvaluating] = useState(false)

    // Setup State
    const [company, setCompany] = useState("Amazon")
    const [role, setRole] = useState("Software Engineer")
    const [difficulty, setDifficulty] = useState("Medium")

    const scrollRef = useRef<HTMLDivElement>(null)
    const recognitionRef = useRef<any>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const streamRef = useRef<MediaStream | null>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isTyping])

    // Initialize Web Speech API
    useEffect(() => {
        if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
            recognitionRef.current = new SpeechRecognition()
            recognitionRef.current.continuous = true
            recognitionRef.current.interimResults = true

            recognitionRef.current.onresult = (event: any) => {
                let currentTranscript = ""
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    currentTranscript += event.results[i][0].transcript
                }
                setInput(currentTranscript)
            }

            recognitionRef.current.onerror = (event: any) => {
                // "network" error is common in privacy browsers (e.g. Brave) or localhost.
                // It means the browser blocked cloud speech recognition. Fail silently,
                // the user can still type their answer.
                if (event.error !== 'network' && event.error !== 'aborted') {
                    console.warn("Speech recognition error:", event.error)
                }
                setIsRecording(false)
            }

            recognitionRef.current.onend = () => {
                setIsRecording(false)
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop()
            }
            if (typeof window !== "undefined") {
                window.speechSynthesis.cancel()
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    const toggleCamera = async () => {
        if (isCameraOn) {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
                streamRef.current = null
            }
            if (videoRef.current) videoRef.current.srcObject = null
            setIsCameraOn(false)
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true })
                streamRef.current = stream
                setIsCameraOn(true)
                // wait for re-render so videoRef is available
                setTimeout(() => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream
                    }
                }, 50)
            } catch (err) {
                console.error("Error accessing camera:", err)
                alert("Could not access camera. Please check your permissions.")
            }
        }
    }

    const toggleRecording = () => {
        if (!recognitionRef.current) return alert("Speech Recognition is not supported in this browser. Try Chrome.")

        if (isRecording) {
            recognitionRef.current.stop()
        } else {
            setInput("")
            recognitionRef.current.start()
            setIsRecording(true)
        }
    }

    const speak = (text: string) => {
        if (typeof window !== "undefined" && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel() // Stop any current speech
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.rate = 1.05
            utterance.pitch = 0.95

            // Try to find a good female/professional voice
            const voices = window.speechSynthesis.getVoices()
            const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha"))
            if (preferredVoice) utterance.voice = preferredVoice

            window.speechSynthesis.speak(utterance)
        }
    }

    const startInterview = () => {
        setSessionActive(true)
        setShowEvaluation(false)
        const initialText = `Hello! I'm your AI technical interviewer for the ${role} position at ${company}. Are you ready to begin?`
        setMessages([
            { role: 'assistant', text: initialText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ])
        speak(initialText)
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || !sessionActive) return

        if (isRecording && recognitionRef.current) {
            recognitionRef.current.stop()
            setIsRecording(false)
        }

        const userText = input
        const userMessage = { role: 'user', text: userText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        setMessages(prev => [...prev, userMessage])
        setInput("")
        setIsTyping(true)
        window.speechSynthesis.cancel() // Stop AI if speaking

        try {
            // Format for backend
            const apiMsgFormat = messages.map(m => ({ role: m.role, text: m.text }))
            apiMsgFormat.push({ role: 'user', text: userText })

            const response = await fetch("http://localhost:8000/api/interview/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: apiMsgFormat,
                    company: company,
                    role: role
                })
            })
            const data = await response.json()
            const aiText = data.response

            setMessages(prev => [...prev, {
                role: 'assistant',
                text: aiText,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }])
            speak(aiText)
        } catch (err) {
            console.error(err)
            const fallback = "Sorry, my connection broke for a second. Can you repeat that?"
            setMessages(prev => [...prev, {
                role: 'assistant', text: fallback, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }])
            speak(fallback)
        } finally {
            setIsTyping(false)
        }
    }

    const endSession = async () => {
        setSessionActive(false)
        setIsEvaluating(true)
        setShowEvaluation(true)
        if (typeof window !== "undefined") window.speechSynthesis.cancel()
        if (recognitionRef.current) recognitionRef.current.stop()
        setIsRecording(false)

        try {
            const apiMsgFormat = messages.map(m => ({ role: m.role, text: m.text }))
            const response = await fetch("http://localhost:8000/api/interview/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: apiMsgFormat,
                    company: company,
                    role: role
                })
            })
            const data = await response.json()
            setEvalData(data)
        } catch (err) {
            console.error("Evaluation error", err)
            // Fallback mock
            setEvalData({
                problemSolving: 5.0,
                technicalClarity: 5.0,
                communication: 5.0,
                feedback: "Evaluation failed to generate. Please check backend connection."
            })
        } finally {
            setIsEvaluating(false)
        }
    }

    return (
        <div className="container px-4 py-6 mx-auto max-w-6xl h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">AI Mock Interview</h1>
                    <p className="text-muted-foreground">
                        Practice voice or text technical rounds with realistic AI personas.
                    </p>
                </div>
                <div className="flex gap-2">
                    {sessionActive ? (
                        <Button variant="destructive" onClick={endSession}>
                            <PhoneOff className="w-4 h-4 mr-2" /> End Interview
                        </Button>
                    ) : (
                        <Button onClick={startInterview} disabled={showEvaluation}>
                            <Play className="w-4 h-4 mr-2" /> Start Interview
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                {/* Main Chat Area */}
                <Card className="lg:col-span-3 flex flex-col overflow-hidden border-2 shadow-sm relative">
                    {/* Setup Overlay */}
                    {!sessionActive && !showEvaluation && (
                        <div className="absolute inset-0 z-20 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
                            <Card className="max-w-md w-full border-primary/20 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="text-2xl text-center">Interview Setup</CardTitle>
                                    <CardDescription className="text-center">Configure your AI Interviewer.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Target Company</label>
                                        <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Amazon, Google, Startup" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" /> Target Role</label>
                                        <Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Frontend Engineer, SDE II" />
                                    </div>
                                    <div className="pt-4">
                                        <Button className="w-full h-12 text-lg" onClick={startInterview}>
                                            <Play className="w-5 h-5 mr-2" /> Start Mock Interview
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Evaluation Overlay */}
                    {showEvaluation && (
                        <div className="absolute inset-0 z-20 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
                            <Card className="max-w-xl w-full max-h-full flex flex-col border-primary/20 shadow-xl overflow-hidden">
                                <ScrollArea className="flex-1 overflow-y-auto">
                                    <CardHeader className="text-center pt-8">
                                        <CardTitle className="flex flex-col items-center gap-4 text-2xl">
                                            <ShieldCheck className="w-16 h-16 text-green-500" />
                                            Interview Complete
                                        </CardTitle>
                                        <CardDescription>
                                            Here is your performance snapshot for this session.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {isEvaluating ? (
                                            <div className="py-12 flex flex-col items-center justify-center gap-4">
                                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                <p className="text-muted-foreground animate-pulse">AI is grading your interview...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm font-medium">
                                                        <span>Problem Solving</span><span className="text-primary">{evalData?.problemSolving || 0}/10</span>
                                                    </div>
                                                    <Progress value={(evalData?.problemSolving || 0) * 10} className="h-2" />
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm font-medium">
                                                        <span>Technical Clarity</span><span className="text-primary">{evalData?.technicalClarity || 0}/10</span>
                                                    </div>
                                                    <Progress value={(evalData?.technicalClarity || 0) * 10} className="h-2" />
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm font-medium">
                                                        <span>Communication</span><span className="text-primary">{evalData?.communication || 0}/10</span>
                                                    </div>
                                                    <Progress value={(evalData?.communication || 0) * 10} className="h-2" />
                                                </div>

                                                <div className="p-4 bg-muted/50 rounded-lg text-sm text-left border space-y-2">
                                                    <p className="font-semibold">Simulated AI Feedback</p>
                                                    <p className="text-muted-foreground">{evalData?.feedback}</p>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                    <CardFooter className="pb-8">
                                        <Button className="w-full h-12 text-lg" disabled={isEvaluating} onClick={() => {
                                            setShowEvaluation(false)
                                            setMessages([])
                                            setEvalData(null)
                                        }}>
                                            Start New Session
                                        </Button>
                                    </CardFooter>
                                </ScrollArea>
                            </Card>
                        </div>
                    )}

                    <CardHeader className="bg-muted/30 border-b flex flex-row items-center space-y-0 py-4 px-6 justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
                                    <Bot className="w-6 h-6 text-primary" />
                                </div>
                                {sessionActive && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full animate-pulse" />
                                )}
                            </div>
                            <div>
                                <CardTitle className="text-base">Alex (Senior Engineer)</CardTitle>
                                <CardDescription className="text-xs">{company} • {role}</CardDescription>
                            </div>
                        </div>
                        {sessionActive && isRecording && (
                            <Badge variant="outline" className="animate-pulse bg-red-500/10 text-red-500 border-red-500/20">
                                <span className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                                Listening...
                            </Badge>
                        )}
                    </CardHeader>

                    <ScrollArea className="flex-1 p-6 min-h-0" ref={scrollRef}>
                        <div className="space-y-6">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center border border-primary/30 mt-1">
                                            <Bot className="w-4 h-4 text-primary" />
                                        </div>
                                    )}

                                    <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`p-4 rounded-2xl max-w-[85%] sm:max-w-md md:max-w-xl text-sm leading-relaxed ${msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                            : 'bg-muted rounded-tl-sm border shadow-sm'
                                            }`}>
                                            {msg.text}
                                        </div>
                                        <span className="text-xs text-muted-foreground mt-1 mx-1">{msg.time}</span>
                                    </div>

                                    {msg.role === 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center border mt-1">
                                            <User className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}

                            {isTyping && (
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center border border-primary/30">
                                        <Bot className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="bg-muted p-4 rounded-2xl rounded-tl-sm w-16 border shadow-sm flex items-center justify-center gap-1">
                                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <div className="bg-background border-t p-4 shrink-0 mt-auto z-10 relative">
                        <form onSubmit={handleSend} className="flex gap-2 w-full">
                            <Button type="button" variant="outline" size="icon" className={`shrink-0 rounded-full transition-colors ${isRecording ? 'bg-red-500/10 text-red-500 border-red-500/50 hover:bg-red-500/20 hover:text-red-600' : ''}`} onClick={toggleRecording} disabled={!sessionActive}>
                                {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </Button>
                            <Input
                                placeholder="Type your answer or use voice..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                disabled={!sessionActive || isTyping}
                                className="rounded-full bg-background"
                                autoComplete="off"
                            />
                            <Button type="submit" size="icon" disabled={!sessionActive || !input.trim() || isTyping} className="shrink-0 rounded-full">
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                </Card>

                {/* Sidebar Panel */}
                <Card className="lg:col-span-1 border-2 shadow-sm flex-col hidden lg:flex">
                    <CardHeader className="py-4 border-b bg-muted/30">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Settings2 className="w-4 h-4" />
                            Interview Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6 pt-6">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <div className="text-sm font-medium">Difficulty</div>
                                <div className="flex gap-2">
                                    <Badge variant={difficulty === "Easy" ? "default" : "outline"} className="cursor-pointer" onClick={() => setDifficulty("Easy")}>Easy</Badge>
                                    <Badge variant={difficulty === "Medium" ? "default" : "outline"} className="cursor-pointer" onClick={() => setDifficulty("Medium")}>Medium</Badge>
                                    <Badge variant={difficulty === "Hard" ? "default" : "outline"} className="cursor-pointer" onClick={() => setDifficulty("Hard")}>Hard</Badge>
                                </div>
                            </div>

                            {sessionActive && (
                                <div className="p-3 bg-primary/10 rounded-lg text-sm border font-medium text-primary">
                                    Active Simulation:
                                    <div className="text-foreground mt-1 text-xs">Target: {company}</div>
                                    <div className="text-foreground text-xs">Role: {role}</div>
                                </div>
                            )}
                        </div>

                        {/* Video preview */}
                        <div className="mt-auto space-y-2 pb-6">
                            <div className="text-sm font-medium">Your Camera Preview</div>
                            <div className="w-full aspect-video bg-muted rounded-lg border-2 border-dashed flex items-center justify-center relative overflow-hidden group">
                                {isCameraOn ? (
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                                ) : (
                                    <Video className="w-8 h-8 text-muted-foreground/50 transition-transform group-hover:scale-110" />
                                )}
                                <div className={`absolute inset-0 bg-black/10 flex items-center justify-center overflow-hidden transition-opacity ${isCameraOn ? 'opacity-0 hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    <Button variant="secondary" size="sm" className="rounded-full shadow-md" onClick={toggleCamera}>
                                        {isCameraOn ? "Turn Off" : "Turn On"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
