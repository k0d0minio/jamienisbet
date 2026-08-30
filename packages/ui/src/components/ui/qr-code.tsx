import * as React from "react"

import { cn } from "../../lib/utils"

// Brand: inline SVG, no library — the same idiom as the data-viz primitives
// next door. A QR is one URL made machine-readable, and pulling a rendering
// dependency in for that would cost more than the 200 lines below.
//
// Byte mode, error-correction level M, versions 1–10 (up to 213 characters,
// which every link this estate hands over fits inside several times over).
// The output was checked module-for-module against a reference encoder and
// round-tripped through a decoder before it shipped.

// Total codewords (data + error correction) per version.
const TOTAL_CODEWORDS = [26, 44, 70, 100, 134, 172, 196, 242, 292, 346]

// Level M block structure per version:
// [ec codewords per block, group-1 blocks, group-1 data cw, group-2 blocks, group-2 data cw]
const BLOCKS = [
  [10, 1, 16, 0, 0],
  [16, 1, 28, 0, 0],
  [26, 1, 44, 0, 0],
  [18, 2, 32, 0, 0],
  [24, 2, 43, 0, 0],
  [16, 4, 27, 0, 0],
  [18, 4, 31, 0, 0],
  [22, 2, 38, 2, 39],
  [22, 3, 36, 2, 37],
  [26, 4, 43, 1, 44],
]

// Alignment-pattern centre coordinates per version.
const ALIGN: number[][] = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
]

const MAX_VERSION = BLOCKS.length

// GF(256) with the QR primitive polynomial, built once at module load.
const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)
for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = x
  LOG[x] = i
  x <<= 1
  if (x & 0x100) x ^= 0x11d
}
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]

const mul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]])

/** The Reed–Solomon generator polynomial, ascending (constant term first). */
function generator(degree: number): number[] {
  let poly = [1]
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(poly.length + 1).fill(0)
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= mul(poly[j], EXP[i])
      next[j + 1] ^= poly[j]
    }
    poly = next
  }
  return poly
}

/** The error-correction codewords for one block. */
function errorCorrection(data: number[], degree: number): number[] {
  // Built ascending; the synthetic division below wants it leading-first.
  const gen = generator(degree).reverse()
  const rem = new Array<number>(degree).fill(0)
  for (const byte of data) {
    const factor = byte ^ rem[0]
    rem.shift()
    rem.push(0)
    for (let i = 0; i < degree; i++) rem[i] ^= mul(gen[i + 1], factor)
  }
  return rem
}

/** BCH(15,5) format information, masked the way the spec masks it. */
function formatBits(value: number): number {
  let rest = value << 10
  for (let i = 4; i >= 0; i--) if (rest & (1 << (i + 10))) rest ^= 0x537 << i
  return ((value << 10) | rest) ^ 0x5412
}

/** Golay(18,6) version information — only versions 7 and up carry it. */
function versionBits(version: number): number {
  let rest = version << 12
  for (let i = 5; i >= 0; i--) if (rest & (1 << (i + 12))) rest ^= 0x1f25 << i
  return (version << 12) | rest
}

/** The interleaved codeword stream, or null when the text won't fit. */
function encode(text: string): { version: number; codewords: number[] } | null {
  const bytes = Array.from(new TextEncoder().encode(text))

  let version = 0
  for (let v = 1; v <= MAX_VERSION; v++) {
    const [, b1, d1, b2, d2] = BLOCKS[v - 1]
    const countBits = v < 10 ? 8 : 16
    if ((b1 * d1 + b2 * d2) * 8 >= 4 + countBits + bytes.length * 8) {
      version = v
      break
    }
  }
  if (version === 0) return null

  const [ecPerBlock, b1, d1, b2, d2] = BLOCKS[version - 1]
  const dataCw = b1 * d1 + b2 * d2
  const countBits = version < 10 ? 8 : 16

  const bits: number[] = []
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >> i) & 1)
  }
  push(0b0100, 4) // byte mode
  push(bytes.length, countBits)
  for (const byte of bytes) push(byte, 8)
  for (let i = 0; i < 4 && bits.length < dataCw * 8; i++) bits.push(0) // terminator
  while (bits.length % 8) bits.push(0)

  const data: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j]
    data.push(byte)
  }
  // The two pad codewords the spec names, alternating to the end.
  for (let i = 0; data.length < dataCw; i++) data.push(i % 2 ? 0x11 : 0xec)

  const blocks: number[][] = []
  const ecBlocks: number[][] = []
  let at = 0
  for (const [count, size] of [
    [b1, d1],
    [b2, d2],
  ]) {
    for (let i = 0; i < count; i++) {
      const block = data.slice(at, at + size)
      at += size
      blocks.push(block)
      ecBlocks.push(errorCorrection(block, ecPerBlock))
    }
  }

  // Interleave: one codeword from each block in turn, data then correction.
  const codewords: number[] = []
  for (let i = 0; i < Math.max(d1, d2); i++)
    for (const block of blocks) if (i < block.length) codewords.push(block[i])
  for (let i = 0; i < ecPerBlock; i++) for (const block of ecBlocks) codewords.push(block[i])

  return codewords.length === TOTAL_CODEWORDS[version - 1] ? { version, codewords } : null
}

/** The function patterns and the data, before masking. `fixed` marks every
 *  module the mask must leave alone. */
function layout(version: number, codewords: number[]) {
  const size = version * 4 + 17
  const modules = Array.from({ length: size }, () => new Array<number>(size).fill(0))
  const fixed = Array.from({ length: size }, () => new Array<boolean>(size).fill(false))
  const set = (row: number, col: number, value: number) => {
    modules[row][col] = value
    fixed[row][col] = true
  }

  // Finders and their separators.
  for (const [r0, c0] of [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ]) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = r0 + r
        const col = c0 + c
        if (row < 0 || col < 0 || row >= size || col >= size) continue
        const dark =
          r >= 0 &&
          r <= 6 &&
          c >= 0 &&
          c <= 6 &&
          (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4))
        set(row, col, dark ? 1 : 0)
      }
    }
  }

  // Alignment patterns, skipping the three that would sit on a finder.
  const centres = ALIGN[version - 1]
  for (const r0 of centres) {
    for (const c0 of centres) {
      const onFinder =
        (r0 <= 8 && c0 <= 8) || (r0 <= 8 && c0 >= size - 9) || (r0 >= size - 9 && c0 <= 8)
      if (onFinder) continue
      for (let r = -2; r <= 2; r++)
        for (let c = -2; c <= 2; c++)
          set(r0 + r, c0 + c, Math.max(Math.abs(r), Math.abs(c)) === 1 ? 0 : 1)
    }
  }

  // Timing, dark module, and the reserved format/version areas.
  for (let i = 8; i < size - 8; i++) {
    set(6, i, i % 2 ? 0 : 1)
    set(i, 6, i % 2 ? 0 : 1)
  }
  set(size - 8, 8, 1)
  for (let i = 0; i < 9; i++) {
    if (!fixed[8][i]) set(8, i, 0)
    if (!fixed[i][8]) set(i, 8, 0)
  }
  for (let i = 0; i < 8; i++) {
    if (!fixed[8][size - 1 - i]) set(8, size - 1 - i, 0)
    if (!fixed[size - 1 - i][8]) set(size - 1 - i, 8, 0)
  }
  if (version >= 7) {
    for (let i = 0; i < 18; i++) {
      const row = Math.floor(i / 3)
      const col = i % 3
      set(size - 11 + col, row, 0)
      set(row, size - 11 + col, 0)
    }
  }

  // The data, in the two-column zigzag that starts bottom-right.
  const stream: number[] = []
  for (const cw of codewords) for (let i = 7; i >= 0; i--) stream.push((cw >> i) & 1)
  let at = 0
  let upward = true
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col-- // the vertical timing column is not a data column
    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i
      for (const c of [col, col - 1]) {
        if (fixed[row][c]) continue
        modules[row][c] = at < stream.length ? stream[at] : 0
        at++
      }
    }
    upward = !upward
  }

  return { modules, fixed, size }
}

const MASKS: ((row: number, col: number) => boolean)[] = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
]

const FINDER_LIKE = [
  [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1],
]

/** The spec's four penalty rules — lower is easier for a camera to read. */
function penalty(modules: number[][], size: number): number {
  let score = 0

  for (let i = 0; i < size; i++) {
    for (const byRow of [true, false]) {
      let run = 1
      for (let j = 1; j < size; j++) {
        const here = byRow ? modules[i][j] : modules[j][i]
        const before = byRow ? modules[i][j - 1] : modules[j - 1][i]
        if (here === before) run++
        else {
          if (run >= 5) score += run - 2
          run = 1
        }
      }
      if (run >= 5) score += run - 2
    }
  }

  for (let r = 0; r < size - 1; r++)
    for (let c = 0; c < size - 1; c++) {
      const v = modules[r][c]
      if (v === modules[r][c + 1] && v === modules[r + 1][c] && v === modules[r + 1][c + 1])
        score += 3
    }

  for (let i = 0; i < size; i++)
    for (let j = 0; j + 11 <= size; j++)
      for (const pattern of FINDER_LIKE) {
        let inRow = true
        let inCol = true
        for (let k = 0; k < 11; k++) {
          if (modules[i][j + k] !== pattern[k]) inRow = false
          if (modules[j + k][i] !== pattern[k]) inCol = false
        }
        if (inRow) score += 40
        if (inCol) score += 40
      }

  let dark = 0
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) dark += modules[r][c]
  score += Math.floor(Math.abs((dark * 100) / (size * size) - 50) / 5) * 10

  return score
}

/** The finished module grid for `value`, or null when it is too long to encode. */
function matrixFor(value: string): { size: number; modules: number[][] } | null {
  const encoded = encode(value)
  if (encoded === null) return null

  const { version, codewords } = encoded
  const { modules, fixed, size } = layout(version, codewords)

  let best: { score: number; modules: number[][] } | null = null
  for (let mask = 0; mask < 8; mask++) {
    const candidate = modules.map((row, r) =>
      row.map((v, c) => (fixed[r][c] ? v : v ^ (MASKS[mask](r, c) ? 1 : 0)))
    )

    const format = formatBits(mask) // level M is 0b00, so the mask is the value
    for (let i = 0; i < 15; i++) {
      const bit = (format >> i) & 1
      if (i < 6) candidate[i][8] = bit
      else if (i < 8) candidate[i + 1][8] = bit
      else candidate[size - 15 + i][8] = bit
      if (i < 8) candidate[8][size - 1 - i] = bit
      else if (i < 9) candidate[8][15 - i] = bit
      else candidate[8][14 - i] = bit
    }

    if (version >= 7) {
      const bits = versionBits(version)
      for (let i = 0; i < 18; i++) {
        const bit = (bits >> i) & 1
        const row = Math.floor(i / 3)
        const col = i % 3
        candidate[size - 11 + col][row] = bit
        candidate[row][size - 11 + col] = bit
      }
    }

    const score = penalty(candidate, size)
    if (best === null || score < best.score) best = { score, modules: candidate }
  }

  return best === null ? null : { size, modules: best.modules }
}

/** Whether `value` fits in a code this renders — call it to decide what to say
 *  when it doesn't, rather than reading a null out of the component. */
function canEncodeQr(value: string): boolean {
  return encode(value) !== null
}

/** One `<path>` for the whole code: horizontal runs of dark modules, so a
 *  57×57 grid costs a few hundred bytes rather than three thousand nodes. */
function pathFor(modules: number[][], size: number, quiet: number): string {
  let d = ""
  for (let r = 0; r < size; r++) {
    let run = 0
    for (let c = 0; c <= size; c++) {
      if (c < size && modules[r][c] === 1) {
        run++
        continue
      }
      if (run > 0) d += `M${c - run + quiet} ${r + quiet}h${run}v1h-${run}z`
      run = 0
    }
  }
  return d
}

const QUIET_ZONE = 4

/**
 * A QR code for one short string — a link handed over in person.
 *
 *   <QrCode value={url} label="Questionnaire link" />
 *
 * Deliberately dark-on-light in both themes (`--scan-plate` / `--scan-ink`,
 * the one token pair that does not flip): this is read by a camera, not by a
 * person, and plenty of scanners will not invert.
 */
function QrCode({
  value,
  label,
  className,
  ...props
}: Omit<React.ComponentProps<"svg">, "children"> & {
  /** The string to encode — a URL, at most 213 characters. */
  value: string
  /** Spoken description. The code itself is meaningless to a screen reader. */
  label: string
}) {
  const code = matrixFor(value)
  if (code === null) return null

  const span = code.size + QUIET_ZONE * 2

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${span} ${span}`}
      // `crispEdges` keeps module edges on pixel boundaries at any size —
      // an antialiased QR is a QR a camera has to work at.
      shapeRendering="crispEdges"
      className={cn("h-auto w-full max-w-full", className)}
      {...props}
    >
      {/* The quiet zone is part of the code: it has to be plate, not page. */}
      <rect width={span} height={span} className="fill-scan-plate" />
      <path d={pathFor(code.modules, code.size, QUIET_ZONE)} className="fill-scan-ink" />
    </svg>
  )
}

export { QrCode, canEncodeQr }
