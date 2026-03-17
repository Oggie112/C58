import { defineQuery } from 'next-sanity'

// Fetch the singleton site settings document.
export const GET_SITE_SETTINGS = defineQuery(/* groq */ `
    *[_id == "siteSettings"][0] {
        _id,
        _type,
        phone,
        email,
        address,
        "navLinks": navLinks[]{
            label,
            "href": select(page->slug.current == "home" => "/", "/" + page->slug.current)
        },
        "socialLinks": socialLinks[]{
            platform,
            url
        },
        "privacyPolicySlug": privacyPolicyPage->slug.current
    }`)