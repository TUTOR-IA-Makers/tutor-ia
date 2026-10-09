export type Pair = readonly [string, string, number]
export interface Result {
  fg: string
  bg: string
  min: number
  ratio: number
  ok: boolean
  missing: boolean
}
export const PAIRS: Pair[]
export function readTokens(css: string): Map<string, string>
export function contrastRatio(a: string, b: string): number
export function evaluate(tokens: Map<string, string>, pairs?: readonly Pair[]): Result[]
