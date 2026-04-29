import type { PortableTextBlock } from '@portabletext/to-html'

let saved: PortableTextBlock[] | undefined = undefined

export const getSaved = (): PortableTextBlock[] | undefined => saved
export const setSaved = (v: PortableTextBlock[]): void => {
  saved = v
}
