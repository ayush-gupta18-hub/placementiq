"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { UploadCloud, FileText, CheckCircle2, XCircle, Sparkles, FileSearch, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function ResumeAnalyzerPage() {
    const [file, setFile] = useState<File | null>(null)
    const [analyzing, setAnalyzing] = useState(false)
    const [result, setResult] = useState<any>(null)

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0])
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleAnalyze = async () => {
        if (!file) return
        setAnalyzing(true)

        const formData = new FormData()
        formData.append("file", file)

        try {
            const response = await fetch("http://localhost:8000/api/resume/analyze", {
                method: "POST",
                body: formData
            })
            const data = await response.json()
            if (data.detail) throw new Error(data.detail)
            setResult(data)
        } catch (err) {
            console.error(err)
            setResult({
                atsScore: 0,
                weakSections: ["Error"],
                missingKeywords: [],
                improvements: ["Could not connect to backend server."]
            })
        } finally {
            setAnalyzing(false)
        }
    }

    return (
        <div className="container px-4 py-8 mx-auto max-w-5xl">
            <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-12 space-y-4">
                <div className="p-3 bg-primary/10 rounded-full inline-flex hidden">
                    <FileSearch className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight">AI Resume Analyzer</h1>
                <p className="text-lg text-muted-foreground">
                    Upload your resume to get instant ATS scoring, keyword gap analysis, and actionable feedback powered by Gemini.
                </p>
            </div>

            {!result && !analyzing ? (
                <Card className="max-w-2xl mx-auto border-2 border-dashed shadow-sm">
                    <CardContent className="pt-6">
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            className="flex flex-col items-center justify-center py-12 px-4 text-center border-dashed border-2 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                        >
                            <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-1">Drag and drop your resume</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                PDF format up to 5MB
                            </p>

                            <input
                                type="file"
                                id="resume-upload"
                                className="hidden"
                                accept=".pdf"
                                onChange={handleFileChange}
                            />
                            <Button variant="secondary" onClick={() => document.getElementById("resume-upload")?.click()}>
                                Browse Files
                            </Button>
                        </div>

                        {file && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6 flex items-center justify-between p-4 bg-secondary/50 rounded-lg border"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="w-8 h-8 text-primary" />
                                    <div className="text-left">
                                        <p className="font-medium text-sm truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <Button onClick={handleAnalyze}>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Analyze
                                </Button>
                            </motion.div>
                        )}
                    </CardContent>
                </Card>
            ) : analyzing ? (
                <Card className="max-w-2xl mx-auto p-12 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-background to-secondary/10 animate-pulse" />
                    <div className="relative z-10 flex flex-col items-center space-y-6">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="p-4 rounded-full bg-primary/10"
                        >
                            <FileSearch className="w-12 h-12 text-primary" />
                        </motion.div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">Extracting PDF text...</h3>
                            <p className="text-muted-foreground">
                                Analyzing your skills, formatting, and matching against top tech company expectations.
                            </p>
                        </div>
                        <Progress value={65} className="w-full max-w-sm" />
                    </div>
                </Card>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                    {/* Score Card */}
                    <Card className="md:col-span-1 border-primary/20 shadow-lg relative overflow-hidden h-fit">
                        <div className="absolute -top-10 -right-10 opacity-5">
                            <Sparkles className="w-40 h-40 text-primary" />
                        </div>
                        <CardHeader className="text-center pb-2">
                            <CardTitle>ATS Score</CardTitle>
                            <CardDescription>Based on industry standards</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-6">
                            <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-muted">
                                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                    <circle
                                        cx="60"
                                        cy="60"
                                        r="56"
                                        className="stroke-primary"
                                        strokeWidth="8"
                                        fill="none"
                                        strokeDasharray={`${result.atsScore * 3.51} 351`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <span className="text-4xl font-extrabold">{result.atsScore}%</span>
                            </div>

                            <div className="mt-6 flex flex-col gap-2 w-full">
                                <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium flex gap-2">
                                    <XCircle className="w-5 h-5 shrink-0" />
                                    <span>Weak sections: {result.weakSections.join(", ")}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="w-full" onClick={() => setResult(null)}>
                                Analyze Another
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Details Card */}
                    <Card className="md:col-span-2 shadow-sm h-fit">
                        <CardHeader>
                            <CardTitle>Detailed Feedback</CardTitle>
                            <CardDescription>AI-generated suggestions to improve your resume</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                    How to Improve
                                </h3>
                                <ul className="space-y-3">
                                    {result.improvements.map((imp: string, i: number) => (
                                        <li key={i} className="flex gap-3 text-muted-foreground p-3 rounded-md bg-secondary border">
                                            <div className="text-primary font-bold">{i + 1}.</div>
                                            {imp}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-blue-500" />
                                    Missing Keywords
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {result.missingKeywords.map((kw: string) => (
                                        <span key={kw} className="px-3 py-1 bg-background border rounded-full text-sm shadow-sm group hover:border-primary transition-colors cursor-default">
                                            <span className="text-muted-foreground group-hover:text-foreground">{kw}</span>
                                        </span>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground pt-1">
                                    Adding these keywords naturally in your experience section can boost your ATS matches for backend/SDE roles.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    )
}
