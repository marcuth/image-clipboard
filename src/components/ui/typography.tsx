/* eslint-disable react-refresh/only-export-components */
import { ComponentPropsWithoutRef, forwardRef } from "react"
import { cn } from "@/lib/utils"

const H1 = forwardRef<HTMLHeadingElement, ComponentPropsWithoutRef<"h1">>(
    ({ className, ...props }, ref) => (
        <h1
            ref={ref}
            className={cn(
                "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl font-heading",
                className,
            )}
            {...props}
        />
    ),
)
H1.displayName = "TypographyH1"

const H2 = forwardRef<HTMLHeadingElement, ComponentPropsWithoutRef<"h2">>(
    ({ className, ...props }, ref) => (
        <h2
            ref={ref}
            className={cn(
                "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 font-heading",
                className,
            )}
            {...props}
        />
    ),
)
H2.displayName = "TypographyH2"

const H3 = forwardRef<HTMLHeadingElement, ComponentPropsWithoutRef<"h3">>(
    ({ className, ...props }, ref) => (
        <h3
            ref={ref}
            className={cn(
                "scroll-m-20 text-2xl font-semibold tracking-tight font-heading",
                className,
            )}
            {...props}
        />
    ),
)
H3.displayName = "TypographyH3"

const H4 = forwardRef<HTMLHeadingElement, ComponentPropsWithoutRef<"h4">>(
    ({ className, ...props }, ref) => (
        <h4
            ref={ref}
            className={cn(
                "scroll-m-20 text-xl font-semibold tracking-tight font-heading",
                className,
            )}
            {...props}
        />
    ),
)
H4.displayName = "TypographyH4"

const P = forwardRef<HTMLParagraphElement, ComponentPropsWithoutRef<"p">>(
    ({ className, ...props }, ref) => (
        <p
            ref={ref}
            className={cn(
                "leading-7 [&:not(:first-child)]:mt-4 font-sans",
                className,
            )}
            {...props}
        />
    ),
)
P.displayName = "TypographyP"

const Lead = forwardRef<HTMLParagraphElement, ComponentPropsWithoutRef<"p">>(
    ({ className, ...props }, ref) => (
        <p
            ref={ref}
            className={cn("text-xl text-muted-foreground font-sans", className)}
            {...props}
        />
    ),
)
Lead.displayName = "TypographyLead"

const Large = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("text-lg font-semibold font-sans", className)}
            {...props}
        />
    ),
)
Large.displayName = "TypographyLarge"

const Small = forwardRef<HTMLElement, ComponentPropsWithoutRef<"small">>(
    ({ className, ...props }, ref) => (
        <small
            ref={ref}
            className={cn(
                "text-sm font-medium leading-none font-sans",
                className,
            )}
            {...props}
        />
    ),
)
Small.displayName = "TypographySmall"

const Muted = forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span">>(
    ({ className, ...props }, ref) => (
        <span
            ref={ref}
            className={cn("text-sm text-muted-foreground font-sans", className)}
            {...props}
        />
    ),
)
Muted.displayName = "TypographyMuted"

const InlineCode = forwardRef<HTMLElement, ComponentPropsWithoutRef<"code">>(
    ({ className, ...props }, ref) => (
        <code
            ref={ref}
            className={cn(
                "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
                className,
            )}
            {...props}
        />
    ),
)
InlineCode.displayName = "TypographyInlineCode"

const Blockquote = forwardRef<
    HTMLQuoteElement,
    ComponentPropsWithoutRef<"blockquote">
>(({ className, ...props }, ref) => (
    <blockquote
        ref={ref}
        className={cn("mt-6 border-l-2 pl-6 italic font-sans", className)}
        {...props}
    />
))
Blockquote.displayName = "TypographyBlockquote"

export const Typography = {
    H1,
    H2,
    H3,
    H4,
    P,
    Lead,
    Large,
    Small,
    Muted,
    InlineCode,
    Blockquote,
}
