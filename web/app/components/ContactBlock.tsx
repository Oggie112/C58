import { ContactBlock as ContactBlockType } from "@/types/sanity";
import { getSiteSettings } from "@/sanity/fetch"

export default async function ContactBlock({ block }: { block: ContactBlockType}) {

    let settings;
    try {
        settings = await getSiteSettings();
    } catch (error) {
        console.error("Failed to fetch site settings:", error)
        return null
    }

    if (!settings) {
        return (
            <h1>Contact Information Not Available</h1>
        )
    }

    return (
        <div>
            <h2>Contact us</h2>
            {settings.phone && <p>{settings.phone}</p>}
            {settings.email && <p>{settings.email}</p>}
            {settings.address && <p>{settings.address}</p>}
            {block.showMap && settings.address && (
                <iframe
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(settings.address)}&output=embed`}
                    width="600" height="450" style={{ border: 0 }}
                    allowFullScreen={false} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                />
            )}
        </div>
    )
}