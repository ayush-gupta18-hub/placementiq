"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowRight, Bot, Target, Sparkles, Code2, LineChart, FileText } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh)]">
      {/* Hero Section */}
      <section className="w-full pt-32 pb-20 lg:pt-48 lg:pb-32 relative overflow-hidden flex flex-col items-center justify-center min-h-screen">
        {/* Animated Background Orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse-slow pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-[100px] mix-blend-screen opacity-40 pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] mix-blend-screen opacity-40 pointer-events-none" />

        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="flex flex-col items-center text-center space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="inline-flex items-center rounded-full border border-primary/30 px-3 py-1 text-sm font-medium bg-primary/10 text-primary backdrop-blur-md gap-2 shadow-[0_0_15px_rgba(var(--primary),0.2)]"
            >
              <Sparkles className="w-4 h-4 fill-primary/50" />
              <span>Next-Gen AI Intelligence Platform</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="text-5xl font-black tracking-tighter lg:text-7xl xl:text-8xl !leading-[1.1] max-w-5xl"
            >
              Master Your Placement Journey with <br className="hidden md:block" />
              <span className="neon-text relative inline-block">
                PlacementIQ
                <span className="absolute -inset-2 bg-primary/20 blur-2xl -z-10 rounded-full opacity-50"></span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="text-lg md:text-xl md:text-2xl text-muted-foreground max-w-3xl font-light"
            >
              Analyze your resume, predict placement probabilities, and follow personalized AI roadmaps to crack top product-based companies.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              className="flex flex-col sm:flex-row gap-4 pt-8 w-full sm:w-auto"
            >
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto rounded-full h-14 px-8 text-base font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-[0_0_30px_rgba(var(--primary),0.4)] hover:shadow-[0_0_40px_rgba(var(--primary),0.6)] transition-all duration-300 neon-border">
                  Launch Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/predictor" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full h-14 px-8 text-base font-medium glass-panel border-primary/30 hover:bg-primary/10">
                  Predict Probability
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 lg:py-24 bg-muted/50">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              href="/predictor"
              icon={<Target className="w-10 h-10 text-blue-500" />}
              title="Placement Predictor"
              description="Know your chances at top companies based on your DSA, CGPA, and coding profile."
              delay={0.1}
            />
            <FeatureCard
              href="/resume"
              icon={<FileText className="w-10 h-10 text-rose-500" />}
              title="Resume Analyzer"
              description="Get instant AI feedback, ATS score, and keyword improvements for your resume."
              delay={0.2}
            />
            <FeatureCard
              href="/profile"
              icon={<Code2 className="w-10 h-10 text-green-500" />}
              title="Profile Analytics"
              description="Connect LeetCode and Codeforces to analyze your problem-solving readiness."
              delay={0.3}
            />
            <FeatureCard
              href="/roadmap"
              icon={<LineChart className="w-10 h-10 text-purple-500" />}
              title="Personalized Roadmaps"
              description="Get a 90-day custom roadmap generated by AI to fill your skill gaps."
              delay={0.4}
            />
            <FeatureCard
              href="/interview"
              icon={<Bot className="w-10 h-10 text-orange-500" />}
              title="Mock Interviews"
              description="Practice technical rounds with our AI interviewer and get instant feedback."
              delay={0.5}
            />
            <FeatureCard
              href="/predictor"
              icon={<Target className="w-10 h-10 text-indigo-500" />}
              title="Company Prediction"
              description="See exactly which tier of companies you are most likely to crack right now."
              delay={0.6}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ href, icon, title, description, delay }: { href: string, icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <Link href={href} className="block w-full h-full group">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className="relative flex flex-col p-8 space-y-6 glass-panel glow-effect h-full transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_40px_rgba(var(--primary),0.15)] overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="p-4 w-fit rounded-2xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors shadow-inner">
          {icon}
        </div>
        <div className="space-y-3 relative z-10">
          <h3 className="text-2xl font-semibold tracking-tight group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-muted-foreground leading-relaxed font-light">
            {description}
          </p>
        </div>
      </motion.div>
    </Link>
  )
}
