import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Local Weather Service',
  description: 'Get personalized weather updates based on your location',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
