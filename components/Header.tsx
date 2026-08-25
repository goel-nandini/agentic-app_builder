import Link from "next/link";
import { UserButton, SignInButton, SignUpButton, Show } from "@clerk/nextjs";
import Image from "next/image";
import { Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkUser } from "@/lib/checkUser";
import { PricingModal } from "@/components/PricingModal";

export default async function Header() {
    const user = await checkUser();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/8 bg-[#0a0a0a]/80 backdrop-blur-md">
            <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 select-none">
                    <Image
                        src="/logo.png"
                        alt="Forge"
                        width={100}
                        height={100}
                        className="h-9 w-auto rounded-md"
                        priority
                    />
                </Link>

                {/* Right side */}
                <div className="flex items-center gap-5">
                    <Show when="signed-in">
                        <Link
                            href="/projects"
                            className="text-[13px] font-medium text-white/50 transition-colors hover:text-white/90"
                        >
                            Projects
                        </Link>

                        {user && (
                            <PricingModal>
                                <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-xs text-white/70 hover:bg-white/10 transition-colors cursor-pointer">
                                    <Zap className="h-3 w-3 fill-amber-400 text-amber-400" />
                                    <span>{user.credits} credits</span>
                                </span>
                            </PricingModal>
                        )}

                        <UserButton />
                    </Show>

                    <Show when="signed-out">
                        <SignInButton mode="modal">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/5 cursor-pointer"
                            >
                                Sign in
                            </Button>
                        </SignInButton>

                        <SignUpButton mode="modal">
                            <Button
                                size="sm"
                                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black hover:bg-white/90 active:scale-95 cursor-pointer shadow-sm"
                            >
                                Get Started
                                <ArrowRight className="h-3 w-3 opacity-70" />
                            </Button>
                        </SignUpButton>
                    </Show>
                </div>
            </nav>
        </header>
    );
}