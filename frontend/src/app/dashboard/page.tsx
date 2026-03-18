"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts"
import { TrendingUp, Target, Activity, CalendarDays, BrainCircuit, CheckCircle2, Loader2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

const defaultProbabilityTrendData = [
    { week: "W1", probability: 45 },
    { week: "W2", probability: 55 },
    { week: "W3", probability: 68 },
    { week: "W4", probability: 75 },
    { week: "W5", probability: 82 },
    { week: "W6", probability: 85 },
]

export default function DashboardPage() {
    const { user, isLoaded } = useUser()
    const router = useRouter()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [dashboardData, setDashboardData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isLoaded && !user) {
            router.push("/")
            return
        }
        
        if (isLoaded && user) {
            const fetchDashboard = async () => {
                try {
                    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
                    const res = await fetch(`${API_URL}/api/profile/user/${user.id}`)
                    if (res.status === 404) {
                        // User hasn't onboarded, redirect
                        router.push("/onboarding")
                        return
                    }
                    if (res.ok) {
                        const data = await res.json()
                        setDashboardData(data)
                    }
                } catch (err) {
                    console.error("Dashboard fetch error:", err)
                } finally {
                    setLoading(false)
                }
            }
            fetchDashboard()
        }
    }, [isLoaded, user, router])

    if (!isLoaded || loading) {
        return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
    }

    if (!dashboardData) {
        return <div className="container py-8 mx-auto text-center">Failed to load dashboard. Make sure backend is running.</div>
    }

    const { profile, stats } = dashboardData
    const summary = stats?.summary || {}
    const leetcode = stats?.leetcode || {}
    
    // We can map backend summary.rating_history to probabilty trend 
    const trendData = summary.rating_history?.map((r: any) => ({
        week: r.month,
        probability: Math.min(100, Math.max(10, Math.floor((r.rating / 2000) * 100))) 
    })) || defaultProbabilityTrendData

    // Chart data for DSA 
    const dsaProgressData = summary.difficulty_distribution || [
        { name: "Easy", value: 0, fill: "#22c55e" },
        { name: "Medium", value: 0, fill: "#eab308" },
        { name: "Hard", value: 0, fill: "#ef4444" }
    ]

    return (
        <div className="container px-4 py-8 mx-auto max-w-7xl space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold tracking-tight">Welcome back, {profile.name}!</h1>
                    <p className="text-muted-foreground">
                        Your comprehensive overview of placement readiness and progress tracking.
                    </p>
                </div>
                <div className="flex flex-col text-right">
                    <span className="text-sm font-semibold text-muted-foreground">Overall Readiness Score</span>
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">
                        {summary.readiness_score || 0} <span className="text-lg text-muted-foreground font-normal">/ 100</span>
                    </span>
                </div>
            </div>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">DSA Questions</CardTitle>
                        <BrainCircuit className="w-4 h-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total_solved || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Current CGPA: {profile.cgpa}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Placement Probability</CardTitle>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.readiness_score ? Math.min(99, summary.readiness_score + 10) : 0}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Estimated chance
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Interviews Mocked</CardTitle>
                        <Target className="w-4 h-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Average Score: N/A
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                        <Activity className="w-4 h-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1 Days</div>
                        <p className="text-xs text-muted-foreground mt-1 text-orange-500 font-medium flex items-center gap-1">
                            Keep it up!
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Placement Probability Trend</CardTitle>
                        <CardDescription>Your prediction history based on coding ratings.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}
                                />
                                <Area type="monotone" dataKey="probability" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorProb)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>DSA Difficulty Spread</CardTitle>
                        <CardDescription>Problems solved categorized by difficulty.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dsaProgressData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {dsaProgressData.map((entry: { name: string; value: number; fill: string }, index: number) => (
                                      <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Lower Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Score Breakdown Area */}
                <Card className="col-span-1 border-primary/20">
                    <CardHeader>
                        <CardTitle>Profile Breakdown</CardTitle>
                        <CardDescription>Areas of strength and improvement.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm font-medium">
                                <span>DSA</span>
                                <span className="text-muted-foreground">{summary.total_dsa_score ? summary.total_dsa_score * 10 : 0}/100</span>
                            </div>
                            <Progress value={summary.total_dsa_score ? summary.total_dsa_score * 10 : 0} className="h-2" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm font-medium">
                                <span>Projects</span>
                                <span className="text-muted-foreground">65/100</span>
                            </div>
                            <Progress value={65} className="h-2" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm font-medium">
                                <span>Resume</span>
                                <span className="text-muted-foreground">72/100</span>
                            </div>
                            <Progress value={72} className="h-2" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm font-medium">
                                <span>Interview Skills</span>
                                <span className="text-muted-foreground">70/100</span>
                            </div>
                            <Progress value={70} className="h-2" />
                        </div>
                    </CardContent>
                </Card>

                {/* Company Prep Tracker */}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarDays className="w-5 h-5" />
                            Company Match Predictor
                        </CardTitle>
                        <CardDescription>Your target companies and readiness status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { name: "Amazon / Microsoft", tier: "Tier 1", progress: Math.min(100, summary.total_solved ? Math.floor(summary.total_solved / 5) : 20), status: summary.total_solved > 400 ? "Ready" : "In Progress", fit: summary.total_solved > 400 ? "High" : "Medium" },
                                { name: "Atlassian / Uber", tier: "Tier 1", progress: Math.min(100, summary.total_solved ? Math.floor(summary.total_solved / 8) : 10), status: summary.total_solved > 600 ? "Ready" : "Needs Work", fit: summary.total_solved > 600 ? "High" : "Low" },
                                { name: "Swiggy / Zomato", tier: "Tier 2", progress: Math.min(100, summary.total_solved ? Math.floor(summary.total_solved / 3) : 35), status: summary.total_solved > 300 ? "Ready" : "In Progress", fit: summary.total_solved > 300 ? "High" : "Medium" },
                                { name: "TCS / Infosys", tier: "Service", progress: 95, status: "Ready", fit: "High" }
                            ].map((company, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/40 rounded-lg border gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-lg">{company.name}</h4>
                                            <Badge variant={company.tier === "Tier 1" ? "default" : "secondary"}>{company.tier}</Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                Fit: <strong className={
                                                    company.fit === "High" ? "text-green-500" :
                                                        company.fit === "Medium" ? "text-amber-500" : "text-red-500"
                                                }>{company.fit}</strong>
                                            </span>
                                            <span>Status: <strong>{company.status}</strong></span>
                                        </div>
                                    </div>
                                    <div className="w-full sm:w-48 space-y-1.5 shrink-0">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span>Prep Completion</span>
                                            <span>{company.progress}%</span>
                                        </div>
                                        <Progress value={company.progress} className={`h-2 ${company.progress >= 80 ? '[&>div]:bg-green-500' : ''}`} />
                                    </div>
                                    <div className="hidden sm:flex shrink-0 w-8 justify-center">
                                        {company.progress >= 80 && <CheckCircle2 className="w-6 h-6 text-green-500" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
