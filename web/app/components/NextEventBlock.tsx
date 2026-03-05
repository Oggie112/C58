import { getNearestEvent } from "@/sanity/fetch"
import { urlFor } from "@/sanity/image"
import { PortableText } from "next-sanity"
import Image from "next/image"
import { formatEventDate } from "@/lib/dateFormat"

export default async function NextEventBlock() {
    let event;
    try {
        event = await getNearestEvent();
    } catch (error) {
        console.error('Failed to fetch nearest event:', error)
        return null
    }

    if (!event) return <h1>No Upcoming Events</h1>

    const imageUrl = event.image ? urlFor(event.image).width(100).height(100).url() : "";
    return (
        <div>
            <div>
                <h1>{event.title}</h1>
                {event.image && <Image src={imageUrl} width={100} height={100} alt={"Event Image for " + event.title} />}
            </div>
            <p>{formatEventDate(event.date)}{event.time ? ` at ${event.time}` : ""}</p>
            {event.location && <p>Location: {event.location}</p>}
            {event.cost && <p>Cost: {event.cost}</p>}
            {event.description && <PortableText value={event.description}/>}
        </div>
    )
}
