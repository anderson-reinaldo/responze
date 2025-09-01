import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const quizButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-gradient-button text-primary-foreground rounded-xl shadow-button hover:shadow-elevated hover:scale-[1.02] active:scale-[0.98]",
        secondary: "bg-gradient-secondary text-white rounded-xl shadow-button hover:shadow-elevated hover:scale-[1.02] active:scale-[0.98]",
        answer: "glass rounded-2xl border border-border/50 text-foreground hover:border-primary/30 hover:bg-card/90 hover:shadow-subtle",
        correct: "bg-quiz-success text-white rounded-xl shadow-lg shadow-quiz-success/20 animate-bounce-in",
        incorrect: "bg-quiz-error text-white rounded-xl shadow-lg shadow-quiz-error/20 animate-bounce-in",
        hero: "glass-strong text-white rounded-2xl border-white/20 hover:border-white/40 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]",
        podium: "bg-gradient-button text-primary-foreground rounded-2xl shadow-elevated hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]"
      },
      size: {
        default: "h-12 px-6 py-3 text-sm",
        sm: "h-10 px-4 text-sm",
        lg: "h-14 px-8 text-base",
        xl: "h-16 px-12 text-lg font-semibold",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface QuizButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof quizButtonVariants> {
  asChild?: boolean
}

const QuizButton = React.forwardRef<HTMLButtonElement, QuizButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(quizButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
QuizButton.displayName = "QuizButton"

export { QuizButton, quizButtonVariants }