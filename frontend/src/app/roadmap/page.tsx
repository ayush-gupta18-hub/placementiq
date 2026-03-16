"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Map, MapPin, CheckCircle2, Calendar, ArrowRight, PlayCircle, Loader2, Sparkles, AlertCircle, Target, Briefcase, Compass } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function RoadmapPage() {
    const { user, isLoaded: isUserLoaded } = useUser()
    const router = useRouter()
    
    const [roadmap, setRoadmap] = useState<any[]>([])
    const [generating, setGenerating] = useState(false)
    const [isGenerated, setIsGenerated] = useState(false)
    const [profileData, setProfileData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // User-configurable preferences
    const [tierTarget, setTierTarget] = useState("Product Based (Tier 1)")
    const [targetRole, setTargetRole] = useState("Software Development Engineer (SDE)")
    const [durationDays, setDurationDays] = useState("90")

    useEffect(() => {
        if (isUserLoaded && !user) {
            router.push("/")
            return
        }

        if (isUserLoaded && user) {
            const fetchUserProfile = async () => {
                try {
                    const response = await fetch(`http://localhost:8000/api/profile/user/${user.id}`)
                    if (response.ok) {
                        const data = await response.json()
                        setProfileData(data)
                        // Note: We don't automatically generate here, user clicks button
                    }
                } catch (err) {
                    console.error("Failed to fetch user profile:", err)
                } finally {
                    setLoading(false)
                }
            }
            fetchUserProfile()
        }
    }, [isUserLoaded, user, router])

    const toggleTask = (weekIdx: number, taskId: number) => {
        const newRoadmap = [...roadmap]
        const task = newRoadmap[weekIdx].tasks.find((t: any) => t.id === taskId)
        if (task) {
            task.done = !task.done
            setRoadmap(newRoadmap)
        }
    }

    const handleGenerate = async () => {
        if (!user || !profileData) return
        
        setGenerating(true)
        setError(null)
        
        try {
            const stats = profileData.stats || {}
            const summary = stats.summary || {}
            
            // Get resume data if available in local storage (mock for now as it's not in db)
            const resumeDataStr = localStorage.getItem("last_resume_analysis")
            const resumeData = resumeDataStr ? JSON.parse(resumeDataStr) : null

            const response = await fetch("http://localhost:8000/api/roadmap/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tier_target: tierTarget,
                    current_role: targetRole,
                    duration_days: parseInt(durationDays),
                    dsa_skill: summary.total_dsa_score > 7 ? "Advanced" : summary.total_dsa_score > 4 ? "Intermediate" : "Beginner",
                    weaknesses: summary.weak_areas || ["General DSA"],
                    total_solved: summary.total_solved || 0,
                    leetcode_stats: summary.difficulty_distribution?.reduce((acc: any, curr: any) => ({ ...acc, [curr.name]: curr.value }), {}) || {},
                    codeforces_rating: stats.codeforces?.rating || 0,
                    resume_score: resumeData?.atsScore || 65,
                    resume_weaknesses: resumeData?.weakSections || []
                })
            })
            
            const data = await response.json()
            if (data.roadmap) {
                setRoadmap(data.roadmap)
                setIsGenerated(true)
            } else if (data.error) {
                setError(data.error)
            }
        } catch (err) {
            console.error("Roadmap generation failed:", err)
            setError("Connection to AI service failed. Please try again.")
        } finally {
            setGenerating(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Scanning your profile...</p>
            </div>
        )
    }

    if (!isGenerated) {
        return (
            <div className="container px-4 py-8 mx-auto max-w-2xl flex items-center justify-center min-h-[70vh]">
                <Card className="w-full border-2 border-primary/20 bg-primary/5">
                    <CardHeader className="text-center pb-2">
                        <motion.div 
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="mx-auto bg-primary/10 p-4 rounded-full w-max mb-4"
                        >
                            <Compass className="w-12 h-12 text-primary" />
                        </motion.div>
                        <CardTitle className="text-2xl font-bold">Craft Your Roadmap</CardTitle>
                        <CardDescription className="text-base">
                            Tell us your goals, and we'll build a personalized day-by-day placement path based on your coding profile.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-4">
                        {/* Target Tier */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold flex items-center gap-2">
                                <Target className="w-4 h-4 text-primary" /> Target Company Tier
                            </label>
                            <select
                                className="w-full px-3 py-2.5 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                value={tierTarget}
                                onChange={e => setTierTarget(e.target.value)}
                            >
                                <option value="Product Based (Tier 1)">🏆 Product Based — Tier 1 (Google, Amazon, Microsoft)</option>
                                <option value="Product Based (Tier 2)">⭐ Product Based — Tier 2 (Razorpay, Atlassian, Adobe)</option>
                                <option value="Service Based (Tier 3)">🏢 Service Based — Tier 3 (TCS, Infosys, Wipro)</option>
                                <option value="Startup">🚀 Startup (Series A/B)</option>
                            </select>
                        </div>

                        {/* Target Role */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-primary" /> Target Role
                            </label>
                            <select
                                className="w-full px-3 py-2.5 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                value={targetRole}
                                onChange={e => setTargetRole(e.target.value)}
                            >
                                <option value="Software Development Engineer (SDE)">Software Development Engineer (SDE)</option>
                                <option value="Frontend Engineer">Frontend Engineer</option>
                                <option value="Backend Engineer">Backend Engineer</option>
                                <option value="Full Stack Engineer">Full Stack Engineer</option>
                                <option value="Data Engineer">Data Engineer</option>
                                <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                                <option value="DevOps / SRE Engineer">DevOps / SRE Engineer</option>
                                <option value="Mobile App Developer (Android/iOS)">Mobile App Developer (Android/iOS)</option>
                            </select>
                        </div>

                        {/* Roadmap Duration */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" /> Roadmap Duration
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {["30", "60", "90", "120"].map(d => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => setDurationDays(d)}
                                        className={`py-2.5 rounded-md border text-sm font-medium transition-all ${
                                            durationDays === d 
                                            ? "bg-primary text-primary-foreground border-primary shadow-md scale-105" 
                                            : "bg-background hover:border-primary/50 hover:bg-primary/5"
                                        }`}
                                    >
                                        {d} Days
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <Button
                            size="lg"
                            className="w-full text-lg h-14 bg-gradient-to-r from-blue-600 to-violet-600 mt-2"
                            onClick={handleGenerate}
                            disabled={generating}
                        >
                            {generating ? (
                                <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> AI is Thinking...</>
                            ) : (
                                <><Sparkles className="w-5 h-5 mr-2" /> Generate My {durationDays}-Day Roadmap</>
                            )}
                        </Button>
                    </CardContent>
                    <CardFooter className="justify-center border-t bg-muted/20 py-3">
                        <p className="text-xs text-muted-foreground">Powered by Gemini AI · Based on your coding profile & resume</p>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    const summary = profileData?.stats?.summary || {}

    return (
        <div className="container px-4 py-8 mx-auto max-w-5xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Your {durationDays}-Day Placement Roadmap</h1>
                    <p className="text-muted-foreground">
                        Personalized for <span className="font-medium text-foreground">{targetRole}</span> at <span className="font-medium text-foreground">{tierTarget}</span>.
                    </p>
                </div>
                <div className="flex flex-col md:flex-row gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsGenerated(false)}>
                        <Map className="w-4 h-4 mr-2" /> Re-generate
                    </Button>
                    <div className="flex bg-secondary/50 rounded-lg p-1 border">
                        <Badge variant="secondary" className="rounded-md">{targetRole.split(" ")[0]}</Badge>
                        <Badge variant="secondary" className="rounded-md bg-background">{tierTarget.split("(")[1]?.replace(")", "") ?? tierTarget}</Badge>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 relative">
                {/* Timeline connector line */}
                <div className="hidden md:block absolute left-[2.2rem] top-8 bottom-8 w-0.5 bg-border -z-10" />

                {roadmap.map((phase: any, weekIdx: number) => (
                    <motion.div
                        key={phase.week}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: weekIdx * 0.1 }}
                        className="md:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-6"
                    >
                        {/* Timeline Marker */}
                        <div className="md:col-span-1 hidden md:flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-background shadow-sm ${phase.status === 'current' ? 'bg-primary text-primary-foreground' :
                                phase.status === 'completed' ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                                }`}>
                                {phase.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                            </div>
                        </div>

                        {/* Content Card */}
                        <Card className={`md:col-span-11 ${phase.status === 'current' ? 'border-primary flex-1 shadow-md relative overflow-hidden' : 'bg-muted/30'}`}>
                            {phase.status === 'current' && (
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <Map className="w-32 h-32" />
                                </div>
                            )}
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardDescription className="font-semibold text-primary mb-1 inline-flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {phase.week}
                                        </CardDescription>
                                        <CardTitle className="text-xl">{phase.title}</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">Focus: {phase.focus}</p>
                                    </div>
                                    {phase.status === 'current' && (
                                        <Badge variant="default">Current Focus</Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        Action Items
                                    </h4>
                                    <div className="grid gap-3">
                                        {phase.tasks.map((task: any) => (
                                            <div
                                                key={task.id}
                                                className={`flex items-center gap-3 p-3 rounded-md border text-sm transition-colors cursor-pointer hover:bg-secondary/50 ${task.done ? 'bg-muted/50 border-transparent text-muted-foreground opacity-70' : 'bg-background hover:border-primary/50'}`}
                                                onClick={() => toggleTask(weekIdx, task.id)}
                                            >
                                                <div className={`w-5 h-5 rounded-full border flex flex-shrink-0 items-center justify-center ${task.done ? 'bg-primary border-primary text-primary-foreground' : 'border-primary/50 text-transparent'}`}>
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                                <span className={task.done ? "line-through" : ""}>{task.title}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {phase.resources && phase.resources.length > 0 && (
                                        <div className="pt-4 mt-2 border-t">
                                            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Recommended Resources</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {phase.resources.map((resource: string) => (
                                                    <Badge key={resource} variant="outline" className="bg-background">
                                                        <PlayCircle className="w-3 h-3 mr-1" />
                                                        {resource}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            {phase.status === 'current' && (
                                <CardFooter className="pt-2 relative z-10">
                                    <Button className="w-full" onClick={() => {
                                        const newRoadmap = [...roadmap]
                                        newRoadmap[weekIdx].status = 'completed'
                                        if (weekIdx + 1 < newRoadmap.length) {
                                            newRoadmap[weekIdx + 1].status = 'current'
                                        }
                                        setRoadmap(newRoadmap)
                                    }}>
                                        Mark Phase Complete <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
