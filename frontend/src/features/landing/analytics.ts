// First-party only: events are dispatched on `window` and nothing leaves the browser.
// A real sink (a counter endpoint, or a tool chosen after a privacy review) subscribes
// to ANALYTICS_EVENT; until then, publishing an event has no effect. No cookies, no ids.
export const ANALYTICS_EVENT = 'codeexpert:analytics'

export type LandingEventName =
  | 'landing_view'
  | 'hero_cta_click'
  | 'access_request_click'
  | 'demo_start'
  | 'demo_complete'
  | 'proof_run'
  | 'faq_interaction'

export interface LandingEvent {
  name: LandingEventName
  props: Readonly<Record<string, string | number | boolean>>
}

export function trackEvent(name: LandingEventName, props: LandingEvent['props'] = {}): void {
  window.dispatchEvent(new CustomEvent<LandingEvent>(ANALYTICS_EVENT, { detail: { name, props } }))
}
