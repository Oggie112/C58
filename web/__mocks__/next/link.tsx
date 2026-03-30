import { ReactNode } from 'react'

export default function MockLink({ href, children, className }: 
    { href: string, children: ReactNode, className?: string }) {
    return <a href={href} className={className}>{children}</a>
}