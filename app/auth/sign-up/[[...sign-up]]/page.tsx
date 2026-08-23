import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <SignUp
      appearance={{
        elements: {
          card: "bg-transparent shadow-none border-none p-0",
          headerTitle: "text-white font-bold text-xl",
          headerSubtitle: "text-neutral-400 text-xs",
          formButtonPrimary:
            "bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-purple-500/20 py-2.5",
          formFieldInput:
            "bg-white/5 border-white/10 text-white placeholder-neutral-500 rounded-xl focus:border-purple-500/60 focus:ring-purple-500/20",
          formFieldLabel: "text-neutral-300 text-xs font-medium",
          footerActionLink: "text-purple-400 hover:text-purple-300 font-medium text-xs",
          dividerLine: "bg-white/10",
          dividerText: "text-neutral-500 text-xs",
          socialButtonsBlockButton:
            "bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl text-xs",
          socialButtonsBlockButtonText: "text-neutral-200 text-xs font-medium",
          identityPreviewText: "text-neutral-200 text-xs font-medium",
          formResendCodeLink: "text-purple-400 hover:text-purple-300 text-xs",
        },
      }}
      path="/auth/sign-up"
      routing="path"
      signInUrl="/auth/sign-in"
    />
  );
}
