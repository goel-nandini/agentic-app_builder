import Link from "next/link";
import { UserButton, SignInButton, SignUpButton, Show } from "@clerk/nextjs";
import { Zap, ArrowRight, Sparkles, FolderCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkUser } from "@/lib/checkUser";
import { PricingModal } from "@/components/PricingModal";
import { NodexLogo } from "@/components/NodexLogo";

export default async function Header() {
    const user = await checkUser();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/8 bg-[#070709]/85 backdrop-blur-xl">
            <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-8">
                {/* Brand Logo */}
                <Link href="/" className="transition-transform hover:scale-[1.02] active:scale-95">
                    <NodexLogo size="md" />
                </Link>

                {/* Right side controls */}
                <div className="flex items-center gap-3 sm:gap-5">
                    <Show when="signed-in">
                        <Link
                            href="/projects"
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                        >
                            <FolderCode className="h-3.5 w-3.5 text-cyan-400" />
                            <span>Projects</span>
                        </Link>

                        {user && (
                            <PricingModal>
                                <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                                    <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                    <span>{user.credits} credits</span>
                                </span>
                            </PricingModal>
                        )}

                        <div className="pl-1 border-l border-white/10">
                            <UserButton />
                        </div>
                    </Show>

                    <Show when="signed-out">
                        <SignInButton mode="modal">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 cursor-pointer"
                            >
                                Sign in
                            </Button>
                        </SignInButton>

                        <SignUpButton mode="modal">
                            <Button
                                size="sm"
                                className="group relative inline-flex h-8 items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-cyan-500 via-violet-600 to-fuchsia-600 px-4 text-xs font-semibold text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 cursor-pointer"
                            >
                                <Sparkles className="h-3 w-3 text-cyan-200" />
                                <span>Get Started</span>
                                <ArrowRight className="h-3 w-3 opacity-70 transition-transform group-hover:translate-x-0.5" />
                            </Button>
                        </SignUpButton>
                    </Show>
                </div>
            </nav>
        </header>
    );
}