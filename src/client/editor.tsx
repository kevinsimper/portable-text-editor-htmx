/** @jsxImportSource react */
import { StrictMode, useLayoutEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  defineSchema,
  EditorProvider,
  PortableTextEditable,
  useEditor,
  useEditorSelector,
} from '@portabletext/editor'
import type {
  PortableTextBlock,
  RenderDecoratorFunction,
  RenderStyleFunction,
} from '@portabletext/editor'
import { getValue } from '@portabletext/editor/selectors'
import { bold, italic, underline } from '@portabletext/keyboard-shortcuts'
import {
  useDecoratorButton,
  useStyleSelector,
  useToolbarSchema,
  type ExtendDecoratorSchemaType,
  type ExtendStyleSchemaType,
  type ToolbarDecoratorSchemaType,
  type ToolbarStyleSchemaType,
} from '@portabletext/toolbar'

const schemaDefinition = defineSchema({
  decorators: [{ name: 'strong' }, { name: 'em' }, { name: 'underline' }],
  styles: [
    { name: 'normal' },
    { name: 'h1' },
    { name: 'h2' },
    { name: 'h3' },
    { name: 'blockquote' },
  ],
  annotations: [],
  lists: [],
  inlineObjects: [],
  blockObjects: [],
})

const renderStyle: RenderStyleFunction = (props) => {
  if (props.schemaType.value === 'h1') return <h1>{props.children}</h1>
  if (props.schemaType.value === 'h2') return <h2>{props.children}</h2>
  if (props.schemaType.value === 'h3') return <h3>{props.children}</h3>
  if (props.schemaType.value === 'blockquote') return <blockquote>{props.children}</blockquote>
  return <>{props.children}</>
}

const renderDecorator: RenderDecoratorFunction = (props) => {
  if (props.value === 'strong') return <strong>{props.children}</strong>
  if (props.value === 'em') return <em>{props.children}</em>
  if (props.value === 'underline') return <u>{props.children}</u>
  return <>{props.children}</>
}

const extendStyle: ExtendStyleSchemaType = (style) => {
  if (style.name === 'h1') return { ...style, title: 'H1' }
  if (style.name === 'h2') return { ...style, title: 'H2' }
  if (style.name === 'h3') return { ...style, title: 'H3' }
  if (style.name === 'blockquote') return { ...style, title: 'Quote' }
  if (style.name === 'normal') return { ...style, title: 'P' }
  return style
}

const extendDecorator: ExtendDecoratorSchemaType = (decorator) => {
  if (decorator.name === 'strong') {
    return { ...decorator, icon: () => <strong>B</strong>, shortcut: bold, title: '' }
  }
  if (decorator.name === 'em') {
    return { ...decorator, icon: () => <em>I</em>, shortcut: italic, title: '' }
  }
  if (decorator.name === 'underline') {
    return { ...decorator, icon: () => <u>U</u>, shortcut: underline, title: '' }
  }
  return decorator
}

function DecoratorButton({ schemaType }: { schemaType: ToolbarDecoratorSchemaType }) {
  const btn = useDecoratorButton({ schemaType })
  const active = btn.snapshot.matches({ enabled: 'active' })
  return (
    <button
      type="button"
      onClick={() => btn.send({ type: 'toggle' })}
      className={active ? 'active' : ''}
    >
      {schemaType.icon && <schemaType.icon />}
      {schemaType.title}
    </button>
  )
}

function StyleButton({ schemaType }: { schemaType: ToolbarStyleSchemaType }) {
  const sel = useStyleSelector({ schemaTypes: [schemaType] })
  const active = sel.snapshot.matches('enabled')
  return (
    <button
      type="button"
      onClick={() => sel.send({ type: 'toggle', style: schemaType.name })}
      className={active ? 'active' : ''}
    >
      {schemaType.icon && <schemaType.icon />}
      {schemaType.title}
    </button>
  )
}

function Toolbar() {
  const toolbarSchema = useToolbarSchema({ extendDecorator, extendStyle })
  return (
    <div className="pte-toolbar" style={{ marginBottom: 8 }}>
      {toolbarSchema.styles?.map((s) => <StyleButton key={s.name} schemaType={s} />)}
      <span style={{ display: 'inline-block', width: 8 }} />
      {toolbarSchema.decorators?.map((d) => <DecoratorButton key={d.name} schemaType={d} />)}
    </div>
  )
}

type EditorIslandProps = {
  initial: PortableTextBlock[] | undefined
  onMutate: (value: PortableTextBlock[] | undefined) => void
}

function ValueSync({ onChange }: { onChange: (v: PortableTextBlock[] | undefined) => void }) {
  const editor = useEditor()
  const value = useEditorSelector(editor, getValue)
  useLayoutEffect(() => {
    onChange(value)
  }, [value, onChange])
  return null
}

function EditorIsland({ initial, onMutate }: EditorIslandProps) {
  return (
    <EditorProvider initialConfig={{ schemaDefinition, initialValue: initial }}>
      <ValueSync onChange={onMutate} />
      <Toolbar />
      <PortableTextEditable
        style={{
          border: '1px solid #999',
          borderRadius: 6,
          padding: '0.75em',
          minHeight: '8em',
        }}
        renderStyle={renderStyle}
        renderDecorator={renderDecorator}
        renderBlock={(props) => <div>{props.children}</div>}
        renderListItem={(props) => <>{props.children}</>}
      />
    </EditorProvider>
  )
}

function parseInitial(raw: string | null | undefined): PortableTextBlock[] | undefined {
  if (!raw) return undefined
  try {
    const parsed = JSON.parse(raw) as PortableTextBlock[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined
  } catch {
    return undefined
  }
}

class PortableTextEditorElement extends HTMLElement {
  private root: Root | null = null
  private hiddenInput: HTMLInputElement | null = null

  connectedCallback() {
    if (this.root) return // already mounted (e.g. attribute change re-trigger)

    const initial = parseInitial(this.getAttribute('data-initial'))
    const name = this.getAttribute('name')

    const mountPoint = document.createElement('div')
    this.appendChild(mountPoint)

    if (name) {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = name
      input.value = JSON.stringify(initial ?? [])
      this.appendChild(input)
      this.hiddenInput = input
    }

    this.root = createRoot(mountPoint)
    this.root.render(
      <StrictMode>
        <EditorIsland
          initial={initial}
          onMutate={(value) => {
            if (this.hiddenInput) {
              this.hiddenInput.value = JSON.stringify(value ?? [])
            }
            this.dispatchEvent(
              new CustomEvent('pte:change', { detail: value, bubbles: true }),
            )
          }}
        />
      </StrictMode>,
    )
  }

  disconnectedCallback() {
    if (this.root) {
      this.root.unmount()
      this.root = null
    }
    this.hiddenInput = null
  }
}

if (!customElements.get('portable-text-editor')) {
  customElements.define('portable-text-editor', PortableTextEditorElement)
}

export function mount(
  el: HTMLElement,
  options: { initial?: PortableTextBlock[]; onChange?: (v: PortableTextBlock[] | undefined) => void } = {},
) {
  const root = createRoot(el)
  root.render(
    <StrictMode>
      <EditorIsland initial={options.initial} onMutate={(v) => options.onChange?.(v)} />
    </StrictMode>,
  )
  return () => root.unmount()
}
