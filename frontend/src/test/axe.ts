import axe from 'axe-core'

const BLOCKING = new Set(['serious', 'critical'])

export async function blockingViolations(container: Element) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  })
  return results.violations
    .filter((violation) => BLOCKING.has(violation.impact ?? ''))
    .map(({ id, help, nodes }) => ({ id, help, targets: nodes.map((node) => node.target) }))
}
