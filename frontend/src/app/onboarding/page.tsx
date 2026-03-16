"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, UserCircle2, GraduationCap, Code2, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function OnboardingPage() {
    const { user, isLoaded } = useUser()
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [step, setStep] = useState(1)
    
    // Form state
    const [formData, setFormData] = useState({
        cgpa: "",
        branch: "",
        leetcode: "",
        codeforces: "",
        github: ""
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const nextStep = () => setStep(prev => prev + 1)
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        
        setIsSubmitting(true)

        try {
            // POST to FastAPI backend
            const res = await fetch("http://localhost:8000/api/profile/onboard", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    clerk_id: user.id,
                    email: user.primaryEmailAddress?.emailAddress,
                    name: user.fullName || "User",
                    ...formData
                })
            })

            if (res.ok) {
                // Redirect to dashboard after successful onboarding
                router.push("/dashboard")
                router.refresh()
            } else {
                console.error("Failed to save onboarding data")
                setIsSubmitting(false)
            }
        } catch (error) {
            console.error(error)
            setIsSubmitting(false)
        }
    }

    if (!isLoaded) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
    }

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">Please sign in first.</div>
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12">
            <Card className="w-full max-w-xl mx-auto border-2 border-primary/10 shadow-lg">
                <CardHeader className="text-center pb-8 border-b bg-muted/20">
                    <UserCircle2 className="w-16 h-16 mx-auto mb-4 text-primary opacity-80" />
                    <CardTitle className="text-3xl font-extrabold">Welcome aboard, {user.firstName}!</CardTitle>
                    <CardDescription className="text-base mt-2">Let&apos;s set up your intelligence profile.</CardDescription>
                    
                    {/* Progress dots */}
                    <div className="flex justify-center gap-2 mt-6">
                        <div className={`w-3 h-3 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                        <div className={`w-3 h-3 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                    </div>
                </CardHeader>
                
                <CardContent className="pt-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* STEP 1: Academic Profile */}
                        {step === 1 && (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} 
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-2 mb-6">
                                    <GraduationCap className="w-5 h-5 text-blue-500" />
                                    <h3 className="font-semibold text-lg">Academic Details</h3>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Branch / Stream</label>
                                    <Input 
                                        name="branch" 
                                        placeholder="e.g. Computer Science" 
                                        value={formData.branch} 
                                        onChange={handleChange} 
                                        required 
                                        className="h-12"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Current CGPA (out of 10)</label>
                                    <Input 
                                        name="cgpa" 
                                        type="number" 
                                        step="0.01" 
                                        max="10" 
                                        placeholder="e.g. 8.5" 
                                        value={formData.cgpa} 
                                        onChange={handleChange} 
                                        required 
                                        className="h-12"
                                    />
                                </div>

                                <Button type="button" onClick={nextStep} className="w-full h-12 mt-4 text-base" disabled={!formData.branch || !formData.cgpa}>
                                    Next Step
                                </Button>
                            </motion.div>
                        )}

                        {/* STEP 2: Coding Profile */}
                        {step === 2 && (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} 
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-2 mb-6">
                                    <Code2 className="w-5 h-5 text-green-500" />
                                    <h3 className="font-semibold text-lg">Coding Profiles</h3>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">LeetCode Username</label>
                                    <Input 
                                        name="leetcode" 
                                        placeholder="e.g. your_username" 
                                        value={formData.leetcode} 
                                        onChange={handleChange} 
                                        className="h-12"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Codeforces Handle</label>
                                    <Input 
                                        name="codeforces" 
                                        placeholder="e.g. tourist" 
                                        value={formData.codeforces} 
                                        onChange={handleChange} 
                                        className="h-12"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">GitHub Username</label>
                                    <Input 
                                        name="github" 
                                        placeholder="e.g. octocat" 
                                        value={formData.github} 
                                        onChange={handleChange} 
                                        className="h-12"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-12 flex-1 text-base">
                                        Back
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting} className="h-12 flex-1 text-base bg-gradient-to-r from-blue-600 to-violet-600">
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5 mr-2" /> Complete setup</>}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
