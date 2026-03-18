"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Lightbulb, Code, Target, ArrowRight, LayoutList, Layers } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export default function ProjectsPage() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrorMsg(null)
        setResult(null)

        const payload = {
            target_tier: (document.getElementById("target_tier") as HTMLSelectElement).value,
            current_skills: (document.getElementById("current_skills") as HTMLInputElement).value.split(",").map(s => s.trim()),
            interests: (document.getElementById("interests") as HTMLInputElement).value.split(",").map(s => s.trim())
        }

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
            const response = await fetch(`${API_URL}/api/projects/recommend`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            const data = await response.json()
            if (data.error) {
                setErrorMsg(data.error)
            } else {
                setResult(data.projects || [])
            }
        } catch (err) {
            console.error(err)
            setErrorMsg("Failed to connect to the backend server. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container px-4 py-8 mx-auto max-w-5xl">
            <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-12 space-y-4">
                <div className="p-3 bg-primary/10 rounded-full inline-flex hidden">
                    <Lightbulb className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight">Smart Project Recommender</h1>
                <p className="text-lg text-muted-foreground">
                    Get AI-curated project ideas tailored to your target company tier and current skill set.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Section */}
                <Card className="lg:col-span-4 h-fit sticky top-24">
                    <CardHeader>
                        <CardTitle>Your Preferences</CardTitle>
                        <CardDescription>Tell us what you're aiming for.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="target_tier">Target Company Tier</Label>
                                <select id="target_tier" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" required>
                                    <option value="Tier 1 (e.g., Google, Amazon, Microsoft)">Tier 1 (Product Based)</option>
                                    <option value="Tier 2 (e.g., Paytm, Swiggy, Zomato)">Tier 2 (Growth Startups)</option>
                                    <option value="Tier 3 (e.g., TCS, Infosys, Wipro)">Tier 3 (Service Based)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="current_skills">Current Skills (comma separated)</Label>
                                <Input id="current_skills" placeholder="e.g. React, Python, SQL" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="interests">Interests (comma separated)</Label>
                                <Input id="interests" placeholder="e.g. Back-End, AI, FinTech" required />
                            </div>
                            <Button type="submit" className="w-full mt-4" disabled={loading}>
                                {loading ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"
                                        />
                                        Generating ideas...
                                    </>
                                ) : (
                                    <>
                                        <Lightbulb className="w-4 h-4 mr-2" />
                                        Generate Ideas
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Recommendations Section */}
                <div className="lg:col-span-8 space-y-6">
                    {errorMsg && (
                        <Card className="flex flex-col items-center justify-center p-8 text-center border-destructive bg-destructive/10">
                            <CardTitle className="text-destructive mb-2">Generation Failed</CardTitle>
                            <p className="text-sm text-destructive">{errorMsg}</p>
                        </Card>
                    )}

                    {!result && !loading && !errorMsg && (
                        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 bg-muted/20">
                            <LayoutList className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Recommendations Yet</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                Fill out your preferences and generate highly relevant, resume-boosting projects.
                            </p>
                        </Card>
                    )}

                    {loading && (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="p-6 relative overflow-hidden h-40">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-muted to-background animate-pulse" />
                                </Card>
                            ))}
                        </div>
                    )}

                    {result && !loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4"
                        >
                            <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                                <Target className="w-5 h-5 text-primary" />
                                Top Projects for Your Portfolio
                            </h3>
                            {result.map((project: any, index: number) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <CardTitle className="text-xl">{project.title}</CardTitle>
                                                    <CardDescription className="mt-1.5 line-clamp-2">
                                                        {project.description}
                                                    </CardDescription>
                                                </div>
                                                <Badge variant={project.difficulty === 'Advanced' ? 'destructive' : project.difficulty === 'Intermediate' ? 'default' : 'secondary'} className="shrink-0 bg-opacity-10">
                                                    {project.difficulty}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-4">
                                            <div className="mb-4 space-y-2">
                                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                                    <Code className="w-3.5 h-3.5" /> Skills Gained
                                                </span>
                                                <div className="flex flex-wrap gap-2">
                                                    {project.skills_gained.map((skill: string, i: number) => (
                                                        <span key={i} className="px-2 py-1 bg-secondary rounded-md text-xs font-medium border border-border/50">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                                                <span className="text-xs font-semibold text-primary/80 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                                    <Layers className="w-3.5 h-3.5" /> Why it helps
                                                </span>
                                                <p className="text-sm text-muted-foreground">
                                                    {project.why_it_helps}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    )
}
