import 'hono/jsx'

declare module 'hono/jsx' {
  namespace JSX {
    interface IntrinsicElements {
      'portable-text-editor': {
        name?: string
        'data-initial'?: string
        children?: unknown
      }
    }
  }
}
