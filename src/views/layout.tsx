import type { FC, PropsWithChildren } from 'hono/jsx'

export const Layout: FC<PropsWithChildren<{ title: string }>> = ({ title, children }) => (
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title}</title>
      <style>{`
        body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
        h1 { margin-bottom: 0.25rem; }
        .saved { background: #f6f6f6; border: 1px solid #ddd; padding: 1rem; border-radius: 6px; margin-bottom: 2rem; }
        .toolbar button { margin-right: 4px; padding: 4px 8px; cursor: pointer; }
        .toolbar button.active { background: #333; color: white; }
        form { margin-top: 1rem; }
        button[type="submit"] { margin-top: 1rem; padding: 8px 16px; cursor: pointer; }
        pre { background: #f6f6f6; padding: 1rem; overflow-x: auto; font-size: 12px; }
      `}</style>
    </head>
    <body>
      {children}
      <script src="/public/client.js" defer></script>
    </body>
  </html>
)
