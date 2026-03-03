import { defineQuery } from 'next-sanity'

// Fetch the singleton site settings document.
export const GET_SITE_SETTINGS = defineQuery(/* groq */ `
    *[_id == "singleton-siteSettings"][0] {
        _id,
        _type,
        phone,
        email,
        address
    }`)