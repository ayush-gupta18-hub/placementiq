import Link from "next/link"
import { Rocket } from "lucide-react"
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"

export function Navbar() {
    return (
        <div className="fixed top-0 inset-x-0 z-50 pointer-events-none flex justify-center bg-background/80 backdrop-blur-xl border-b border-border/40 supports-[backdrop-filter]:bg-background/60">
            <header className="pointer-events-auto w-full max-w-6xl mx-auto transition-all">
                <div className="flex h-16 items-center px-6 justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight group">
                        <div className="p-1.5 rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors">
                            <Rocket className="w-5 h-5 text-primary" />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">PlacementIQ</span>
                    </Link>

                <nav className="hidden md:flex gap-6 text-sm font-medium">
                    <Link href="/predictor" className="transition-colors hover:text-primary">
                        Predictor
                    </Link>
                    <Link href="/resume" className="transition-colors hover:text-primary">
                        Resume Analyzer
                    </Link>
                    <Link href="/profile" className="transition-colors hover:text-primary">
                        Coding Profile
                    </Link>
                    <Link href="/roadmap" className="transition-colors hover:text-primary">
                        Roadmap
                    </Link>
                    <Link href="/projects" className="transition-colors hover:text-primary">
                        Projects
                    </Link>
                    <Link href="/mentor" className="transition-colors hover:text-primary">
                        AI Mentor
                    </Link>
                    <Link href="/interview" className="transition-colors hover:text-primary">
                        Mock Interview
                    </Link>
                </nav>

                <div className="flex items-center gap-4">
                    <ModeToggle />
                    <SignedOut>
                        <SignInButton mode="modal">
                            <Button className="hidden md:inline-flex rounded-full">Sign In</Button>
                        </SignInButton>
                    </SignedOut>
                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                </div>
                </div>
            </header>
        </div>
    )
}
