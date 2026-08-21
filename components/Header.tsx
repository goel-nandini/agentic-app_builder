import Link from "next/link";
import Image from "next/image";
import { Zap } from "lucide-react";
import { Show, SignUpButton, SignInButton, UserButton } from "@clerk/nextjs";

const Header = () => {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-16 w-full border-b border-white/10 bg-black/20 backdrop-blur-xl transition-all">
            <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/logo.png"
                        alt="Forge Logo"
                        width={120}
                        height={40}
                        className="h-9 w-auto object-contain"
                        priority
                    />
                </Link>

                <div className="flex items-center gap-4 sm:gap-5">
                    <Show when="signed-in">
                        <Link
                            href={"/projects"}
                            className="text-[13px] font-medium text-white/60 transition-colors hover:text-white"
                        >
                            Projects
                        </Link>
                        <Link
                            href="/#pricing"
                            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-xs text-white/80 backdrop-blur-md transition-all hover:bg-white/10 hover:border-amber-400/50 hover:text-white"
                            title="Upgrade Credits"
                        >
                            <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            3/40 credits
                        </Link>

                        <UserButton />
                    </Show>
                   
                    <Show when="signed-out">
                        <SignInButton mode="modal">
                            <button className="text-xs sm:text-sm font-medium text-white/70 hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-full hover:bg-white/5">
                                Sign In
                            </button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <button className="bg-purple-600 hover:bg-purple-500 text-white rounded-full font-medium text-xs sm:text-sm h-9 px-4 cursor-pointer transition-all shadow-lg shadow-purple-500/20">
                                Sign Up
                            </button>
                        </SignUpButton>
                    </Show>
                </div>
            </nav>
        </header>
    );
};

export default Header;