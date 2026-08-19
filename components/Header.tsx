import Link from "next/link";
import Image from "next/image";
import { Zap } from "lucide-react";
import { Show, SignUpButton, SignInButton, UserButton } from "@clerk/nextjs";

const Header = () => {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-16 w-full border-b border-white/10 bg-black/50 backdrop-blur-md">
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

                <div className="flex items-center gap-5">
                    <Show when="signed-in">
                         <Link
                        href={"/projects"}
                        className="text-[13px] font-medium text-white/60 transition-colors hover:text-white"
                    >
                        Projects
                    </Link>
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-xs text-white/80">
                        <Zap className="h-4 w-4 fill-amber-400 text-amber-400" />
                        3/40 credits
                    </span>

                        <UserButton />
                    </Show>
                   
                    <Show when="signed-out">
                        <SignInButton mode="modal" />
                        <SignUpButton mode="modal">

                            <button className="bg-purple-700 text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
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