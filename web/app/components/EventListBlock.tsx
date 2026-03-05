import { EventListBlock as EventListBlockType } from "@/types/sanity";
import { getUpcomingEvents, getPastEvents } from "@/sanity/fetch";
import { formatEventDate } from "@/lib/dateFormat";
import { PortableText } from "next-sanity";
import { urlFor } from "@/sanity/image";
import Image from "next/image";

export default async function EventListBlock({block}: { block: EventListBlockType}) {
    const { showPast } = block;

    let events;
    try {
        events = showPast ? await getPastEvents() : await getUpcomingEvents();
    } catch (error) {
        console.error("Failed to fetch events:", error)
        return null
    }

    if (events.length === 0) {
        return (
            <h1>{showPast ? "No Past Events" : "No Upcoming Events"}</h1>
        )
    }

    return (
        <div>
            <h2>{showPast ? "Past Events" : "Upcoming Events"}</h2>
                <ul>
                    {events.map(event => 
                        <li key={event._id}>
                            <div>
                            <h3>{event.title}</h3>
                            {event.image && <Image src={urlFor(event.image).width(100).height(100).url()} width={100} height={100} alt={"Event Image for " + event.title} />}
                            </div>
                            <p>{formatEventDate(event.date)}{event.time ? ` at ${event.time}` : ""}</p>
                            {event.location && <p>Location: {event.location}</p>}
                            {event.cost && <p>Cost: {event.cost}</p>}
                            {event.description && <PortableText value={event.description}/>}
                        </li>
                    )}
                </ul>
        </div>
    )
}