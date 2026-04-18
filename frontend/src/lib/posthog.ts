import posthog from 'posthog-js'

posthog.init('phc_CYpECQgYUmmyreiDnBRH9q8XQNpmR5Pg43jg3wjuw4i2', {
    api_host: 'https://us.i.posthog.com',
    capture_pageview: true,
})

export default posthog