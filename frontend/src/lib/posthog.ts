import posthog from 'posthog-js'

const key = import.meta.env.VITE_POSTHOG_KEY

if (!key) {
  console.warn('PostHog key missing')
} else {
  posthog.init(key, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    capture_pageview: true,
  })
}

export default posthog