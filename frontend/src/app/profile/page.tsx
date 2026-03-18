"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Code2, Trophy, Flame, Target, Star, AlertTriangle, ArrowUpRight, Sparkles, Loader2, ExternalLink, GitBranch, BookOpen, Building2, TrendingUp } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from "recharts"

export default function ProfileAnalyzerPage() {
    const { user, isLoaded: isUserLoaded } = useUser()
    const router = useRouter()

    const [lcUsername, setLcUsername] = useState("")
    const [cfUsername, setCfUsername] = useState("")
    const [ghUsername, setGhUsername] = useState("")
    const [connected, setConnected] = useState(false)
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)
    const [profileData, setProfileData] = useState<any>(null)

    useEffect(() => {
        if (isUserLoaded && !user) { router.push("/"); return }
        if (isUserLoaded && user) {
            const fetchUserProfile = async () => {
                try {
                    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
                    const response = await fetch(`${API_URL}/api/profile/user/${user.id}`)
                    if (response.ok) {
                        const data = await response.json()
                        if (data.stats) {
                            setProfileData(data.stats)
                            setConnected(true)
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch user profile:", err)
                } finally {
                    setInitialLoading(false)
                }
            }
            fetchUserProfile()
        }
    }, [isUserLoaded, user, router])

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!lcUsername && !cfUsername && !ghUsername) return
        setLoading(true)
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
            const response = await fetch(`${API_URL}/api/profile/scrape`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ leetcode_username: lcUsername, codeforces_username: cfUsername, github_username: ghUsername })
            })
            const data = await response.json()
            setProfileData(data)
            setConnected(true)
        } catch (err) {
            console.error(err)
            alert("Failed to connect to backend scraper.")
        } finally {
            setLoading(false)
        }
    }

    if (initialLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Fetching your brilliance...</p>
            </div>
        )
    }

    const summary = profileData?.summary || {}
    const lc = profileData?.leetcode || {}
    const cf = profileData?.codeforces || {}
    const gh = profileData?.github || {}
    const ratingHistory = summary?.rating_history || []
    const companyReadiness = summary?.company_readiness || {}
    const weakAreas = summary?.weak_areas || []
    const recommendedProblems = summary?.recommended_problems || []
    const languages = gh?.languages || {}

    return (
        <div className="container px-4 py-8 mx-auto max-w-6xl space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Coding Profile Analyzer</h1>
                    <p className="text-muted-foreground">Deep insights from your LeetCode, Codeforces & GitHub profiles.</p>
                </div>
                {!connected && (
                    <form onSubmit={handleConnect} className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                        <Input placeholder="LeetCode Handle" value={lcUsername} onChange={(e) => setLcUsername(e.target.value)} className="w-full md:w-[140px]" />
                        <Input placeholder="Codeforces Handle" value={cfUsername} onChange={(e) => setCfUsername(e.target.value)} className="w-full md:w-[140px]" />
                        <Input placeholder="GitHub Handle" value={ghUsername} onChange={(e) => setGhUsername(e.target.value)} className="w-full md:w-[130px]" />
                        <Button type="submit" disabled={loading}>{loading ? "Connecting..." : "Connect Profile"}</Button>
                    </form>
                )}
                {connected && (
                    <Button variant="outline" size="sm" onClick={() => setConnected(false)}>
                        <Code2 className="w-4 h-4 mr-2" /> Re-connect
                    </Button>
                )}
            </div>

            {!connected ? (
                <Card className="border-dashed bg-muted/20 py-16 text-center h-[50vh] flex flex-col items-center justify-center">
                    <Code2 className="w-16 h-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-medium">No Profile Connected</h3>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                        Enter your LeetCode or Codeforces username above to generate your DSA Readiness Score.
                    </p>
                </Card>
            ) : (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">

                    {/* ── Top Stats Row ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatsCard title="DSA Readiness Score" value={summary?.total_dsa_score ?? "0"} subtitle="/ 10"
                            icon={<Star className="w-6 h-6 text-yellow-500" />}
                            progress={(summary?.total_dsa_score ?? 0) * 10} progressColor="bg-yellow-500" />
                        <StatsCard
                            title="Total Problems Solved"
                            value={(lc?.total_solved ?? 0) + (cf?.problems_solved ?? 0)}
                            subtitle={`LC: ${lc?.total_solved ?? 0} · CF: ${cf?.problems_solved ?? 0}`}
                            icon={<Target className="w-6 h-6 text-blue-500" />}
                            progress={Math.min(100, (((lc?.total_solved ?? 0) + (cf?.problems_solved ?? 0)) / 600) * 100)}
                            progressColor="bg-blue-500" />
                        <StatsCard title="GitHub Repos" value={gh?.public_repos ?? "0"} subtitle="public"
                            icon={<GitBranch className="w-6 h-6 text-orange-500" />}
                            progress={Math.min(100, ((gh?.public_repos ?? 0) / 50) * 100)} progressColor="bg-orange-500" />
                        <StatsCard title="CF Max Rating" value={cf?.maxRating ?? "0"} subtitle={`(${cf?.rank ?? "Unrated"})`}
                            icon={<Trophy className="w-6 h-6 text-purple-500" />}
                            progress={Math.min(100, ((cf?.maxRating ?? 0) / 3000) * 100)} progressColor="bg-purple-500" />
                    </div>

                    {/* ── Charts Row ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Difficulty Pie */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Difficulty Breakdown</CardTitle>
                                <CardDescription>LeetCode problem distribution</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center">
                                <div className="h-[220px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={summary?.difficulty_distribution || []} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                                                {(summary?.difficulty_distribution || []).map((entry: any, idx: number) => (
                                                    <Cell key={idx} fill={entry.fill} stroke="transparent" />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex gap-4 justify-center flex-wrap">
                                    {(summary?.difficulty_distribution || []).map((item: any) => (
                                        <div key={item.name} className="flex items-center gap-1.5 text-sm">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                            <span className="font-medium">{item.name}</span>
                                            <span className="text-muted-foreground">({item.value})</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contest Rating Chart (REAL from Codeforces) */}
                        <Card className="lg:col-span-2 shadow-sm">
                            <CardHeader>
                                <CardTitle>Contest Rating Progress</CardTitle>
                                <CardDescription>
                                    {ratingHistory.length > 0
                                        ? `Real data from last ${ratingHistory.length} Codeforces contests`
                                        : "No contest history found"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {ratingHistory.length === 0 ? (
                                    <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
                                        No contest activity found on Codeforces.
                                    </div>
                                ) : (
                                    <div className="h-[240px] w-full mt-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={ratingHistory}>
                                                <defs>
                                                    <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.2)" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} dy={8} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} domain={['dataMin - 50', 'dataMax + 50']} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                                    formatter={(value: any) => [`${value}`, 'Rating']}
                                                    labelFormatter={(label: any, payload: any) => payload?.[0]?.payload?.contest || label}
                                                />
                                                <Area type="monotone" dataKey="rating" stroke="#8b5cf6" strokeWidth={2} fill="url(#ratingGrad)" dot={{ fill: '#8b5cf6', r: 3 }} activeDot={{ r: 5 }} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Company Readiness + GitHub Languages ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Company Readiness */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" />Company Readiness</CardTitle>
                                <CardDescription>Estimated readiness based on your DSA profile</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    { name: "FAANG / Dream", key: "FAANG", color: "bg-red-500" },
                                    { name: "Tier 2 Product", key: "Tier2", color: "bg-orange-500" },
                                    { name: "Startup", key: "Startup", color: "bg-green-500" },
                                ].map(({ name, key, color }) => {
                                    const val = companyReadiness[key] ?? 0
                                    return (
                                        <div key={key} className="space-y-1.5">
                                            <div className="flex justify-between text-sm font-medium">
                                                <span>{name}</span>
                                                <span className="text-primary font-bold">{val}%</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 1, delay: 0.2 }}
                                                    className={`h-full rounded-full ${color}`}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                                <div className="pt-2 border-t grid grid-cols-3 gap-3 text-center text-xs">
                                    {[
                                        { co: "Amazon", key: "Amazon" },
                                        { co: "Google", key: "Google" },
                                        { co: "Microsoft", key: "Microsoft" }
                                    ].map(({ co, key }) => (
                                        <div key={key} className="p-2 rounded-lg bg-muted/50 border">
                                            <div className="font-bold text-base text-primary">{companyReadiness[key] ?? 0}%</div>
                                            <div className="text-muted-foreground">{co}</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* GitHub Language Chart */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><GitBranch className="w-5 h-5 text-primary" />GitHub Skill Analyzer</CardTitle>
                                <CardDescription>{gh?.public_repos ?? 0} public repos · {gh?.followers ?? 0} followers</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {Object.keys(languages).length === 0 ? (
                                    <div className="py-8 text-center text-muted-foreground text-sm">No GitHub language data available.</div>
                                ) : (
                                    <div className="space-y-3">
                                        {Object.entries(languages).map(([lang, pct]: [string, any], idx) => (
                                            <div key={lang} className="space-y-1.5">
                                                <div className="flex justify-between text-sm font-medium">
                                                    <span>{lang}</span>
                                                    <span className="text-muted-foreground">{pct}%</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: idx * 0.1 }}
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: LANG_COLORS[lang] ?? '#8b5cf6' }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Weak Topics + Recommended Problems ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Weak Topics */}
                        <Card className="border-orange-200 dark:border-orange-900/50 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                                    Weak Topics Detected
                                </CardTitle>
                                <CardDescription>Focus on these to level up fast</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {weakAreas.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No weak areas detected — great job!</p>
                                ) : (
                                    weakAreas.map((area: string, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-orange-500" />
                                                <span className="text-sm font-medium">{area}</span>
                                            </div>
                                            <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">Improve</Badge>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {/* Recommended Problems */}
                        <Card className="border-blue-200 dark:border-blue-900/50 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-blue-500" />
                                    Next 10 Problems to Solve
                                </CardTitle>
                                <CardDescription>Curated based on your weak areas</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                                {recommendedProblems.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No recommendations yet. Connect your profile first.</p>
                                ) : (
                                    recommendedProblems.map((p: any, idx: number) => (
                                        <a key={idx} href={p.url} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 hover:bg-muted border transition-colors group">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span className="text-xs text-muted-foreground w-4 shrink-0">{idx + 1}.</span>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{p.title}</p>
                                                    <p className="text-xs text-muted-foreground">{p.topic}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Badge variant="outline" className={`text-xs ${
                                                    p.difficulty === 'Easy' ? 'text-green-600 border-green-300' :
                                                    p.difficulty === 'Medium' ? 'text-yellow-600 border-yellow-300' :
                                                    'text-red-600 border-red-300'
                                                }`}>{p.difficulty}</Badge>
                                                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                                            </div>
                                        </a>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── AI Analysis ── */}
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary" />AI Profile Analysis
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold flex items-center gap-2 text-green-600 dark:text-green-500 mb-3">
                                        <ArrowUpRight className="w-4 h-4" /> Strengths
                                    </h4>
                                    <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-5">
                                        <li>Strong foundation with {lc?.easy ?? 0} Easy + {lc?.medium ?? 0} Medium problems solved.</li>
                                        <li>{summary?.total_dsa_score > 5 ? "Contest rating is solid and climbing steadily." : "Active participation across platforms."}</li>
                                        <li>GitHub shows {Object.keys(languages).length} languages in use across {gh?.public_repos ?? 0} repos.</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold flex items-center gap-2 text-orange-600 dark:text-orange-500 mb-3">
                                        <AlertTriangle className="w-4 h-4" /> Areas to Improve
                                    </h4>
                                    <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-5">
                                        <li>Only {lc?.hard ?? 0} Hard problems solved — increase this for Tier 1 interviews.</li>
                                        <li>Weak Areas: <span className="font-medium text-foreground">{weakAreas.slice(0, 3).join(", ") || "None detected"}</span>.</li>
                                        <li>Participate in more rated Codeforces rounds to boost contest experience.</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    )
}

const LANG_COLORS: Record<string, string> = {
    Python: "#3572A5", JavaScript: "#f1e05a", TypeScript: "#2b7489",
    Java: "#b07219", "C++": "#f34b7d", C: "#555555",
    Go: "#00ADD8", Rust: "#dea584", Ruby: "#701516",
    Swift: "#ffac45", Kotlin: "#F18E33", Dart: "#00B4AB",
    HTML: "#e34c26", CSS: "#563d7c", Shell: "#89e051",
}

function StatsCard({ title, value, subtitle, icon, progress, progressColor }: any) {
    return (
        <Card className="overflow-hidden">
            <CardContent className="p-5">
                <div className="flex items-center justify-between pb-3">
                    <p className="font-medium text-sm text-muted-foreground leading-tight">{title}</p>
                    <div className="p-1.5 bg-secondary rounded-lg">{icon}</div>
                </div>
                <div className="flex items-baseline gap-1">
                    <h2 className="text-3xl font-bold tracking-tight">{value}</h2>
                    <span className="text-sm font-medium text-muted-foreground">{subtitle}</span>
                </div>
                <Progress value={progress} className={`h-1.5 mt-3 [&>div]:${progressColor}`} />
            </CardContent>
        </Card>
    )
}
