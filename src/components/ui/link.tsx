import { AnchorHTMLAttributes, forwardRef } from "react"
import { LuExternalLink } from "react-icons/lu"
import { cn } from "@/lib/utils"

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string
    isExternal?: boolean
    showExternalIcon?: boolean
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
    (
        {
            className,
            href,
            children,
            isExternal,
            showExternalIcon = true,
            ...props
        },
        ref,
    ) => {
        const isExt =
            isExternal !== undefined
                ? isExternal
                : href.startsWith("http://") ||
                  href.startsWith("https://") ||
                  href.startsWith("mailto:")

        return (
            <a
                ref={ref}
                href={href}
                className={cn(
                    "inline-flex items-center gap-1 font-medium text-primary underline underline-offset-4 hover:opacity-80 transition-opacity",
                    className,
                )}
                {...(isExt
                    ? {
                          target: "_blank",
                          rel: "noopener noreferrer",
                      }
                    : {})}
                {...props}
            >
                {children}
                {isExt && showExternalIcon && (
                    <LuExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
                )}
            </a>
        )
    },
)
Link.displayName = "Link"
