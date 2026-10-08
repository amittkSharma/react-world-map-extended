import type { CSSProperties } from 'react'

// Colours can be themed with --rwme-panel-* custom properties.
const BORDER = 'var(--rwme-panel-border, #d0d7de)'
const MUTED = 'var(--rwme-panel-muted, #59636e)'

// The border is set with longhands only: switching between a shorthand and a longhand of the same
// property while the card changes state makes React warn.
const card: CSSProperties = {
  position: 'relative',
  boxSizing: 'border-box',
  width: '100%',
  padding: '1rem 1.25rem',
  borderRadius: 8,
  borderStyle: 'solid',
  borderWidth: '1px 1px 1px 4px',
  borderColor: `${BORDER} ${BORDER} ${BORDER} var(--rwme-panel-accent, #0969da)`,
  background: 'var(--rwme-panel-bg, #ffffff)',
  color: 'var(--rwme-panel-text, #1f2328)',
  fontSize: '0.95rem',
  lineHeight: 1.4,
}

export const detailsStyles = {
  card,
  empty: { ...card, borderStyle: 'dashed dashed dashed solid', color: MUTED },
  warning: {
    ...card,
    borderColor: `${BORDER} ${BORDER} ${BORDER} var(--rwme-panel-warning, #bf8700)`,
    background: 'var(--rwme-panel-warning-bg, #fff8c5)',
  },
  title: { margin: 0, paddingRight: '5rem', fontSize: '1.4rem', fontWeight: 650, lineHeight: 1.2 },
  close: {
    position: 'absolute',
    top: '0.6rem',
    right: '0.75rem',
    padding: '0.3rem 0.75rem', // a comfortable touch target
    border: `1px solid ${BORDER}`,
    borderRadius: 6,
    background: 'var(--rwme-panel-bg, #ffffff)',
    color: 'var(--rwme-panel-text, #1f2328)',
    fontFamily: 'inherit',
    fontStyle: 'inherit',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(13rem, 1fr))',
    gap: '1rem 2rem',
    margin: '1rem 0 0',
  },
  groupTitle: {
    margin: '0 0 0.4rem',
    paddingBottom: '0.25rem',
    borderBottom: `1px solid ${BORDER}`,
    color: MUTED,
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  term: { margin: 0, color: MUTED, fontSize: '0.75rem' },
  value: { margin: '0 0 0.5rem' },
  emphasised: { margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 600 },
  footer: {
    margin: '1rem 0 0',
    paddingTop: '0.75rem',
    borderTop: `1px solid ${BORDER}`,
    color: MUTED,
    fontSize: '0.85rem',
  },
  link: { color: 'var(--rwme-panel-accent, #0969da)' },
  paragraph: { margin: 0 },
  note: { margin: '0.75rem 0 0', color: MUTED, fontSize: '0.85rem' },
  customList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))',
    gap: '0.5rem 2rem',
    margin: 0,
  },
} satisfies Record<string, CSSProperties>

export const listStyles = {
  bar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0.5rem',
    paddingRight: '5rem', // room for the Hide button
  },
  count: { color: MUTED, fontSize: '0.85rem' },
  button: {
    padding: '0.3rem 0.75rem',
    border: `1px solid ${BORDER}`,
    borderRadius: 6,
    background: 'var(--rwme-panel-bg, #ffffff)',
    color: 'var(--rwme-panel-text, #1f2328)',
    fontFamily: 'inherit',
    fontStyle: 'inherit',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  list: { margin: '0.75rem 0 0', padding: 0, listStyle: 'none' },
  item: { borderTop: `1px solid ${BORDER}` },
  header: { display: 'flex', alignItems: 'center', gap: '0.25rem', margin: 0 },
  toggle: {
    display: 'flex',
    flex: '1 1 auto',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.6rem 0.25rem',
    border: 'none',
    background: 'transparent',
    color: 'inherit',
    font: 'inherit',
    fontSize: '1.05rem',
    fontWeight: 600,
    textAlign: 'left',
    cursor: 'pointer',
  },
  chevron: { display: 'inline-block', width: '1em', transition: 'transform 0.15s' },
  remove: {
    flex: '0 0 auto',
    width: '1.9rem',
    height: '1.9rem',
    border: '1px solid transparent',
    borderRadius: 6,
    background: 'transparent',
    color: MUTED,
    fontSize: '1.1rem',
    lineHeight: 1,
    cursor: 'pointer',
  },
  panel: { padding: '0 0.25rem 0.75rem 1.5rem' },
} satisfies Record<string, CSSProperties>
