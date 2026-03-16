"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ShieldAlert, BarChart3, TrendingUp, Sparkles, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

export default function PredictorPage() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)

    const handlePredict = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const payload = {
            cgpa: parseFloat((document.getElementById("cgpa") as HTMLInputElement).value) || 0,
            dsa_problems_solved: parseInt((document.getElementById("dsa") as HTMLInputElement).value) || 0,
            leetcode_rating: parseInt((document.getElementById("leetcode") as HTMLInputElement).value) || 0,
            codeforces_rating: parseInt((document.getElementById("codeforces") as HTMLInputElement).value) || 0,
            projects: parseInt((document.getElementById("projects") as HTMLInputElement).value) || 0,
            internships: parseInt((document.getElementById("internships") as HTMLInputElement).value) || 0,
            hackathons: parseInt((document.getElementById("hackathons") as HTMLInputElement).value) || 0,
            gender: (document.getElementById("gender") as HTMLSelectElement).value || "Male",
            branch: (document.getElementById("branch") as HTMLSelectElement).value || "CSE"
        }

        try {
            const response = await fetch("http://localhost:8000/api/prediction/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            const data = await response.json()
            setResult(data)
        } catch (err) {
            console.error(err)
            setResult({
                probability: 0,
                tier: "Error",
                companies: [],
                feedback: "Could not connect to backend. Please ensure the FastAPI server is running."
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container px-4 py-8 mx-auto max-w-6xl">
            <div className="flex flex-col mb-8 space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Placement Predictor</h1>
                <p className="text-muted-foreground">
                    Enter your metrics to calculate your placement probability and get personalized feedback.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2">
                    <Card className="glass-panel border-white/5">
                        <CardHeader>
                            <CardTitle className="text-2xl">Your Profile</CardTitle>
                            <CardDescription className="text-muted-foreground">Metrics are used by our ML model for prediction.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePredict} className="space-y-6">

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="cgpa">CGPA (Out of 10)</Label>
                                        <Input id="cgpa" type="number" step="0.01" min="0" max="10" placeholder="e.g. 8.5" required className="bg-background/50 border-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="branch">Branch</Label>
                                        <select id="branch" className="flex h-10 w-full rounded-md border border-white/10 bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" required>
                                            <option value="">Select branch</option>
                                            <option value="CSE">Computer Science</option>
                                            <option value="IT">Information Technology</option>
                                            <option value="ECE">Electronics</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="gender">Gender</Label>
                                        <select id="gender" className="flex h-10 w-full rounded-md border border-white/10 bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" required>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="dsa">DSA Solved</Label>
                                        <Input id="dsa" type="number" placeholder="e.g. 350" required className="bg-background/50 border-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="leetcode">LeetCode Rating</Label>
                                        <Input id="leetcode" type="number" placeholder="e.g. 1500" className="bg-background/50 border-white/10" />
                                        <p className="text-[10px] text-muted-foreground mt-1">Leave blank if unrated</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="codeforces">Codeforces</Label>
                                        <Input id="codeforces" type="number" placeholder="e.g. 1200" className="bg-background/50 border-white/10" />
                                        <p className="text-[10px] text-muted-foreground mt-1">Leave blank if unrated</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="projects">Projects</Label>
                                        <Input id="projects" type="number" placeholder="e.g. 3" required className="bg-background/50 border-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="internships">Internships</Label>
                                        <Input id="internships" type="number" placeholder="e.g. 1" required className="bg-background/50 border-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="hackathons">Hackathons</Label>
                                        <Input id="hackathons" type="number" placeholder="e.g. 2" className="bg-background/50 border-white/10" />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all duration-300 neon-border rounded-xl" disabled={loading}>
                                    {loading ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                                        />
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5 mr-2" />
                                            Predict Probability
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-1">
                    {!result && !loading ? (
                        <Card className="h-full flex flex-col items-center justify-center text-center p-6 border-dashed border-2 bg-muted/30">
                            <BarChart3 className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-lg font-medium text-muted-foreground">Awaiting Prediction</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                Fill the form and submit to see your placement probability and insights.
                            </p>
                        </Card>
                    ) : loading ? (
                        <Card className="h-full flex flex-col items-center justify-center p-6 border bg-muted/30 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent animate-pulse" />
                            <div className="z-10 flex flex-col items-center space-y-4">
                                <div className="relative">
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center"
                                    >
                                        <TrendingUp className="w-8 h-8 text-primary" />
                                    </motion.div>
                                </div>
                                <p className="font-medium animate-pulse">Running ML Models...</p>
                            </div>
                        </Card>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                        >
                            <Card className="h-full border-primary/20 shadow-lg shadow-primary/5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <TrendingUp className="w-24 h-24" />
                                </div>
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        Results
                                        <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-full">
                                            {result.tier}
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-6 pt-2">

                                        {/* Original Probability Score */}
                                        <div className="space-y-2 pb-4 border-b">
                                            <div className="flex justify-between items-end">
                                                <span className="text-sm font-medium">Placement Probability</span>
                                                <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
                                                    {result.probability}%
                                                </span>
                                            </div>
                                            <Progress value={result.probability} className="h-2" />
                                        </div>

                                        {/* Tier Predictions */}
                                        {result.tier_probabilities && (
                                            <div className="space-y-3 pb-4 border-b">
                                                <h4 className="text-sm font-semibold">Tier Prediction</h4>
                                                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                                    <div className="bg-primary/5 p-2 rounded-md border border-primary/20">
                                                        <span className="block text-muted-foreground text-xs uppercase tracking-wider mb-1">Tier 1</span>
                                                        <span className="font-bold text-primary">{result.tier_probabilities["Tier 1"]}%</span>
                                                    </div>
                                                    <div className="bg-secondary/50 p-2 rounded-md border">
                                                        <span className="block text-muted-foreground text-xs uppercase tracking-wider mb-1">Tier 2</span>
                                                        <span className="font-bold">{result.tier_probabilities["Tier 2"]}%</span>
                                                    </div>
                                                    <div className="bg-secondary/50 p-2 rounded-md border">
                                                        <span className="block text-muted-foreground text-xs uppercase tracking-wider mb-1">Tier 3</span>
                                                        <span className="font-bold">{result.tier_probabilities["Tier 3"]}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Company Fit Categories */}
                                        {result.company_fit && (
                                            <div className="space-y-3 pb-4 border-b">
                                                <h4 className="text-sm font-semibold">Company Fit Analysis</h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-start text-sm">
                                                        <span className="font-medium text-green-600 dark:text-green-500 w-24">High Fit</span>
                                                        <span className="text-muted-foreground text-right">{result.company_fit["High Probability"].join(", ")}</span>
                                                    </div>
                                                    <div className="flex justify-between items-start text-sm">
                                                        <span className="font-medium text-amber-500 w-24">Medium Fit</span>
                                                        <span className="text-muted-foreground text-right">{result.company_fit["Medium Probability"].join(", ")}</span>
                                                    </div>
                                                    <div className="flex justify-between items-start text-sm">
                                                        <span className="font-medium text-red-500 w-24">Low Fit</span>
                                                        <span className="text-muted-foreground text-right">{result.company_fit["Low Probability"].join(", ")}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Skill Gap Detector */}
                                        {result.skill_gap && (
                                            <div className="space-y-3 pb-4 border-b">
                                                <h4 className="text-sm font-semibold">Comparison: You vs Selected Students</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {/* DSA Comparison */}
                                                    <div className="space-y-2 p-3 bg-secondary/30 rounded-lg border">
                                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">DSA Questions</span>
                                                        <div className="flex justify-between items-end">
                                                            <div className="text-center">
                                                                <span className="block text-xs text-muted-foreground mb-0.5">You</span>
                                                                <span className={`font-bold ${result.skill_gap.dsa.you >= result.skill_gap.dsa.avg ? 'text-green-500' : 'text-red-500'}`}>{result.skill_gap.dsa.you}</span>
                                                            </div>
                                                            <div className="w-px h-8 bg-border"></div>
                                                            <div className="text-center">
                                                                <span className="block text-xs text-muted-foreground mb-0.5">Target Avg</span>
                                                                <span className="font-bold">{result.skill_gap.dsa.avg}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Projects Comparison */}
                                                    <div className="space-y-2 p-3 bg-secondary/30 rounded-lg border">
                                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Projects</span>
                                                        <div className="flex justify-between items-end">
                                                            <div className="text-center">
                                                                <span className="block text-xs text-muted-foreground mb-0.5">You</span>
                                                                <span className={`font-bold ${result.skill_gap.projects.you >= result.skill_gap.projects.avg ? 'text-green-500' : 'text-red-500'}`}>{result.skill_gap.projects.you}</span>
                                                            </div>
                                                            <div className="w-px h-8 bg-border"></div>
                                                            <div className="text-center">
                                                                <span className="block text-xs text-muted-foreground mb-0.5">Target Avg</span>
                                                                <span className="font-bold">{result.skill_gap.projects.avg}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* AI Placement Readiness Breakdown */}
                                        {result.score_breakdown && (
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center bg-primary/5 p-3 rounded-lg border border-primary/20">
                                                    <span className="font-semibold flex items-center gap-2">
                                                        <Sparkles className="w-5 h-5 text-amber-500" />
                                                        AI Readiness Score
                                                    </span>
                                                    <span className="text-xl font-bold">{result.score_breakdown.overall} <span className="text-sm text-muted-foreground font-normal">/ 100</span></span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">DSA</span>
                                                            <span className="font-medium">{result.score_breakdown.dsa}%</span>
                                                        </div>
                                                        <Progress value={result.score_breakdown.dsa} className="h-1.5" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Projects</span>
                                                            <span className="font-medium">{result.score_breakdown.projects}%</span>
                                                        </div>
                                                        <Progress value={result.score_breakdown.projects} className="h-1.5" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Resume</span>
                                                            <span className="font-medium">{result.score_breakdown.resume}%</span>
                                                        </div>
                                                        <Progress value={result.score_breakdown.resume} className="h-1.5" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Interview</span>
                                                            <span className="font-medium">{result.score_breakdown.interview}%</span>
                                                        </div>
                                                        <Progress value={result.score_breakdown.interview} className="h-1.5" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    </div>

                                    <div className="space-y-3 pt-4 border-t">
                                        <h4 className="text-sm font-semibold flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-orange-500" />
                                            Feedback
                                        </h4>
                                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md border">
                                            {result.feedback}
                                        </p>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t">
                                        <h4 className="text-sm font-semibold">Recommended Companies</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {result.companies.map((company: string) => (
                                                <div key={company} className="text-xs font-medium px-2.5 py-1 bg-secondary rounded-md border">
                                                    {company}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </CardContent>
                                <CardFooter>
                                    <Link href="/roadmap" className="w-full">
                                        <Button variant="outline" className="w-full bg-primary/5 border-primary/20 hover:bg-primary/10">
                                            View Personalized Roadmap
                                        </Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    )
}
