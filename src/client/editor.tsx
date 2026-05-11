/** @jsxImportSource react */
import { StrictMode, useLayoutEffect, useMemo, useState } from 'react'
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
  useBlockObjectButton,
  useDecoratorButton,
  useListButton,
  useStyleSelector,
  useToolbarSchema,
  type ExtendBlockObjectSchemaType,
  type ExtendDecoratorSchemaType,
  type ExtendListSchemaType,
  type ExtendStyleSchemaType,
  type ToolbarBlockObjectSchemaType,
  type ToolbarDecoratorSchemaType,
  type ToolbarListSchemaType,
  type ToolbarStyleSchemaType,
  useBlockObjectPopover,
} from '@portabletext/toolbar'

type ImageBlock = PortableTextBlock & {
  _type: 'image'
  src?: string
  alt?: string
}

const editorStyles = `
  .pte-root {
    color: #171717;
    font: 16px/1.5 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .pte-root, .pte-root * { box-sizing: border-box; }
  .pte-root .pte-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
  }
  .pte-root .pte-toolbar-group {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 3px;
    padding: 2px;
    border: 1px solid #d4d4d4;
    border-radius: 8px;
    background: #f7f7f7;
  }
  .pte-root .pte-toolbar button {
    min-width: 32px;
    min-height: 30px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    color: #262626;
    padding: 4px 8px;
    cursor: pointer;
    font: inherit;
    font-size: 0.9375rem;
    font-weight: 600;
    line-height: 1;
  }
  .pte-root .pte-toolbar button:hover:not(:disabled) {
    background: #ededed;
    border-color: #d4d4d4;
  }
  .pte-root .pte-toolbar button:focus-visible,
  .pte-root .pte-image-block-controls button:focus-visible,
  .pte-root .pte-image-dialog input:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }
  .pte-root .pte-toolbar button.active {
    background: #e7e7e7;
    border-color: #b8b8b8;
    color: #171717;
    box-shadow: inset 0 0 0 1px #d0d0d0;
  }
  .pte-root .pte-toolbar button:disabled {
    cursor: default;
    opacity: 0.45;
  }
  .pte-root .pte-editable {
    width: 100%;
    min-height: 12rem;
    border: 1px solid #c7c7c7;
    border-radius: 8px;
    background: #fff;
    padding: 1rem;
    box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.03);
  }
  .pte-root .pte-editable:focus,
  .pte-root .pte-editable:focus-visible,
  .pte-root .pte-editable[contenteditable="true"]:focus,
  .pte-root .pte-editable[contenteditable="true"]:focus-visible {
    outline: none !important;
  }
  .pte-root .pte-editable p,
  .pte-root .pte-editable h1,
  .pte-root .pte-editable h2,
  .pte-root .pte-editable h3,
  .pte-root .pte-editable blockquote {
    margin: 0.25rem 0;
  }
  .pte-root .pte-editable h1 { font-size: 1.75rem; line-height: 1.2; }
  .pte-root .pte-editable h2 { font-size: 1.4rem; line-height: 1.25; }
  .pte-root .pte-editable h3 { font-size: 1.15rem; line-height: 1.3; }
  .pte-root .pte-editable blockquote {
    border-left: 3px solid #d4d4d4;
    color: #525252;
    padding-left: 0.75rem;
  }
  .pte-root .pte-image-tool { position: relative; display: inline-flex; flex-wrap: wrap; align-items: center; gap: 4px; }
  .pte-root .pte-image-dialog { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 4px; }
  .pte-root .pte-image-dialog input {
    width: min(12rem, 100%);
    min-height: 34px;
    border: 1px solid #c7c7c7;
    border-radius: 6px;
    padding: 5px 8px;
    font: inherit;
  }
  .pte-root .pte-image-block-controls {
    position: absolute;
    top: 6px;
    right: 6px;
    display: inline-flex;
    align-items: center;
  }
  .pte-root .pte-image-block-controls button {
    min-height: 30px;
    border: 1px solid #b91c1c;
    border-radius: 6px;
    background: #fff;
    color: #b91c1c;
    padding: 4px 8px;
    cursor: pointer;
    font: inherit;
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1;
  }
  .pte-root .pte-image-block-controls button:hover {
    background: #fef2f2;
  }
  .pte-root .pte-image-block { position: relative; display: inline-flex; align-items: center; gap: 0.625rem; margin: 0.5rem 0; padding: 0.5rem; border: 1px solid #d4d4d4; border-radius: 8px; background: #fafafa; cursor: pointer; }
  .pte-root .pte-image-block.has-controls { padding-right: 5.75rem; }
  .pte-root .pte-image-block.is-selected,
  .pte-root .pte-image-block.is-focused {
    border-color: #2563eb;
    background: #f8fbff;
  }
  .pte-root .pte-image-block img { width: 72px; height: 54px; object-fit: cover; display: block; border-radius: 6px; }
  .pte-root .pte-image-placeholder { border: 1px dashed #a3a3a3; border-radius: 6px; padding: 1rem; color: #737373; background: #fff; }
  .pte-root .pt-list-item-level-2 { padding-left: 1.5rem; }
  .pte-root .pt-list-item-level-3 { padding-left: 3rem; }
  .pte-root .pte-list-item { display: flex; gap: 0.5rem; align-items: baseline; }
  .pte-root .pte-list-item-marker { flex: 0 0 1.25rem; text-align: right; }
  .pte-root .pte-list-item-content { flex: 1; min-width: 0; }
  .pte-root figcaption { color: #737373; font-size: 0.875rem; margin-top: 0.25rem; }
`

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
  lists: [{ name: 'bullet' }, { name: 'number' }],
  inlineObjects: [],
  blockObjects: [
    {
      name: 'image',
      fields: [
        { name: 'src', type: 'string' },
        { name: 'alt', type: 'string' },
      ],
    },
  ],
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

const extendList: ExtendListSchemaType = (list) => {
  if (list.name === 'bullet') return { ...list, title: 'Bullet list', icon: () => <>UL</> }
  if (list.name === 'number') return { ...list, title: 'Numbered list', icon: () => <>OL</> }
  return list
}

const extendBlockObject: ExtendBlockObjectSchemaType = (blockObject) => {
  if (blockObject.name === 'image') {
    return {
      ...blockObject,
      defaultValues: { src: '', alt: '' },
      title: 'Image',
      icon: () => <>Img</>,
    }
  }
  return blockObject
}

function DecoratorButton({ schemaType }: { schemaType: ToolbarDecoratorSchemaType }) {
  const btn = useDecoratorButton({ schemaType })
  const active = btn.snapshot.matches({ enabled: 'active' })
  const label = schemaType.title || schemaType.name
  return (
    <button
      type="button"
      onClick={() => btn.send({ type: 'toggle' })}
      className={active ? 'active' : ''}
      aria-label={label}
      aria-pressed={active}
      title={label}
    >
      {schemaType.icon && <schemaType.icon />}
      {schemaType.title}
    </button>
  )
}

function StyleButton({ schemaType }: { schemaType: ToolbarStyleSchemaType }) {
  const sel = useStyleSelector({ schemaTypes: [schemaType] })
  const active =
    sel.snapshot.matches('enabled') && sel.snapshot.context.activeStyle === schemaType.name
  const label = schemaType.title || schemaType.name
  return (
    <button
      type="button"
      onClick={() => sel.send({ type: 'toggle', style: schemaType.name })}
      className={active ? 'active' : ''}
      aria-label={label}
      aria-pressed={active}
      title={label}
    >
      {schemaType.icon && <schemaType.icon />}
      {schemaType.title}
    </button>
  )
}

function ListButton({ schemaType }: { schemaType: ToolbarListSchemaType }) {
  const btn = useListButton({ schemaType })
  const active = btn.snapshot.matches({ enabled: 'active' })
  return (
    <button
      type="button"
      onClick={() => btn.send({ type: 'toggle' })}
      className={active ? 'active' : ''}
      aria-label={schemaType.title}
      aria-pressed={active}
      title={schemaType.title}
    >
      {schemaType.icon && <schemaType.icon />}
    </button>
  )
}

function ImageButton({ schemaType }: { schemaType: ToolbarBlockObjectSchemaType }) {
  const btn = useBlockObjectButton({ schemaType })
  const [src, setSrc] = useState('')
  const [alt, setAlt] = useState('')
  const showingDialog = btn.snapshot.matches({ enabled: 'showing dialog' })

  return (
    <span className="pte-image-tool">
      <button
        type="button"
        onClick={() => btn.send({ type: 'open dialog' })}
        disabled={btn.snapshot.matches('disabled')}
        aria-label={schemaType.title}
        aria-expanded={showingDialog}
        title={schemaType.title}
      >
        {schemaType.icon && <schemaType.icon />}
      </button>
      {showingDialog && (
        <span
          className="pte-image-dialog"
        >
          <input
            aria-label="Image path"
            placeholder="/image.jpg"
            value={src}
            onChange={(event) => setSrc(event.currentTarget.value)}
            required
          />
          <input
            aria-label="Image alt text"
            placeholder="Alt text"
            value={alt}
            onChange={(event) => setAlt(event.currentTarget.value)}
          />
          <button
            type="button"
            onClick={() => {
              const trimmedSrc = src.trim()
              if (!trimmedSrc) return
              btn.send({
                type: 'insert',
                value: { src: trimmedSrc, alt: alt.trim() },
                placement: undefined,
              })
              setSrc('')
              setAlt('')
            }}
          >
            Insert
          </button>
          <button
            type="button"
            onClick={() => {
              btn.send({ type: 'close dialog' })
              setSrc('')
              setAlt('')
            }}
          >
            Cancel
          </button>
        </span>
      )}
    </span>
  )
}

function Toolbar() {
  const toolbarSchema = useToolbarSchema({
    extendBlockObject,
    extendDecorator,
    extendList,
    extendStyle,
  })
  return (
    <div className="pte-toolbar">
      <span className="pte-toolbar-group" aria-label="Block style controls">
        {toolbarSchema.styles?.map((s) => <StyleButton key={s.name} schemaType={s} />)}
      </span>
      <span className="pte-toolbar-group" aria-label="Text formatting controls">
        {toolbarSchema.decorators?.map((d) => <DecoratorButton key={d.name} schemaType={d} />)}
      </span>
      <span className="pte-toolbar-group" aria-label="List controls">
        {toolbarSchema.lists?.map((l) => <ListButton key={l.name} schemaType={l} />)}
      </span>
      <span className="pte-toolbar-group" aria-label="Insert controls">
        {toolbarSchema.blockObjects?.map((b) => (
          <ImageButton key={b.name} schemaType={b} />
        ))}
      </span>
    </div>
  )
}

function ImageBlockControls() {
  const toolbarSchema = useToolbarSchema({ extendBlockObject })
  const imageSchema = toolbarSchema.blockObjects?.find((schemaType) => schemaType.name === 'image')
  const schemaTypes = useMemo(() => (imageSchema ? [imageSchema] : []), [imageSchema])
  const popover = useBlockObjectPopover({ schemaTypes })
  const selectedImage = popover.snapshot.context.blockObjects.find(
    (blockObject) => blockObject.schemaType.name === 'image',
  )
  const selectedImagePath = selectedImage ? JSON.stringify(selectedImage.at) : undefined

  return (
    <PortableTextEditable
      className="pte-editable"
      renderStyle={renderStyle}
      renderDecorator={renderDecorator}
      renderBlock={(props) => {
        if (props.schemaType.name === 'image') {
          const image = props.value as ImageBlock
          const path = JSON.stringify(props.path)
          const isSelectedImage =
            Boolean(selectedImagePath) &&
            selectedImagePath === path &&
            popover.snapshot.matches({ enabled: 'active' })
          const className = [
            'pte-image-block',
            props.selected || isSelectedImage ? 'is-selected' : '',
            props.focused ? 'is-focused' : '',
            isSelectedImage ? 'has-controls' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <figure
              className={className}
              aria-label="Image block. Click to select."
              title="Click to select image block"
            >
              {image.src ? (
                <img src={image.src} alt={image.alt ?? ''} />
              ) : (
                <div className="pte-image-placeholder">Image</div>
              )}
              {(image.alt || image.src) && <figcaption>{image.alt || image.src}</figcaption>}
              {isSelectedImage && selectedImage && (
                <div className="pte-image-block-controls" contentEditable={false}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => popover.send({ type: 'remove', at: selectedImage.at })}
                    aria-label="Remove selected image"
                    title="Remove selected image"
                  >
                    Remove
                  </button>
                </div>
              )}
            </figure>
          )
        }
        return <div>{props.children}</div>
      }}
      renderListItem={(props) => (
        <span className={`pte-list-item pte-list-item-${props.value}`}>
          <span className="pte-list-item-marker" contentEditable={false}>
            {props.value === 'number' ? '1.' : '•'}
          </span>
          <span className="pte-list-item-content">{props.children}</span>
        </span>
      )}
    />
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
      <div className="pte-root">
        <style>{editorStyles}</style>
        <ValueSync onChange={onMutate} />
        <Toolbar />
        <ImageBlockControls />
      </div>
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
