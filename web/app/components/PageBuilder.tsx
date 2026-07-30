import { PageBuilderBlock } from "@/types/sanity";
import HeroBlock from "@/app/components/HeroBlock";
import FeaturedUpdateBlock from "@/app/components/FeaturedUpdateBlock";
import BlogListBlock from "@/app/components/BlogListBlock";
import TalentListBlock from "@/app/components/TalentListBlock";
import PartnersBlock from "@/app/components/PartnersBlock";
import EventListBlock from "@/app/components/EventListBlock";
import RichTextBlock from "@/app/components/RichTextBlock";
import ContactBlock from "@/app/components/ContactBlock";
import ImageBlock from "@/app/components/ImageBlock";
import TeamBlock from "@/app/components/TeamBlock";
import VolunteerBlock from "@/app/components/VolunteerBlock";
import InstagramBlock from "@/app/components/InstagramBlock";

// Block types that participate in the "01/02/03" numbered section marker —
// the device that ties together a page's narrative sections (e.g. About).
const NUMBERED_SECTION_TYPES = new Set(["richTextBlock", "teamBlock", "volunteerBlock", "contactBlock"])

function numberedSections(blocks: PageBuilderBlock[]): Map<string, string> {
    const eligible = blocks.filter(block => NUMBERED_SECTION_TYPES.has(block._type))
    const numbers = new Map<string, string>()

    // A single eligible block on a page isn't "a sequence" — e.g. a contactBlock
    // reused standalone on its own page shouldn't get tagged "01". Only number
    // when there's an actual multi-section sequence to tie together.
    if (eligible.length < 2) return numbers

    eligible.forEach((block, i) => {
        numbers.set(block._key, String(i + 1).padStart(2, "0"))
    })
    return numbers
}

export default function PageBuilder({blocks}: { blocks: PageBuilderBlock[]}) {
    const sectionNumbers = numberedSections(blocks)

    return (
        <>
            {
            blocks.map(block => {
                switch (block._type) {
                    case "heroBlock": return <HeroBlock key={block._key} block={block}/>;
                    case "featuredUpdateBlock": return <FeaturedUpdateBlock key={block._key} block={block}/>;
                    case "blogListBlock": return <BlogListBlock key={block._key} block={block}/>;
                    case "talentListBlock": return <TalentListBlock key={block._key} block={block}/>;
                    case "partnersBlock": return <PartnersBlock key={block._key} block={block}/>;
                    case "eventListBlock": return <EventListBlock key={block._key} block={block}/>;
                    case "richTextBlock": return <RichTextBlock key={block._key} block={block} sectionNumber={sectionNumbers.get(block._key)}/>;
                    case "teamBlock": return <TeamBlock key={block._key} block={block} sectionNumber={sectionNumbers.get(block._key)}/>;
                    case "volunteerBlock": return <VolunteerBlock key={block._key} block={block} sectionNumber={sectionNumbers.get(block._key)}/>;
                    case "instagramBlock": return <InstagramBlock key={block._key} block={block}/>;
                    case "contactBlock": return <ContactBlock key={block._key} block={block} sectionNumber={sectionNumbers.get(block._key)}/>;
                    case "imageBlock": return <ImageBlock key={block._key} block={block}/>;
                    default:
                        if (process.env.NODE_ENV === "development") {
                            const unknownBlock = block as { _key: string; _type: string }
                            return <div key={unknownBlock._key}>Unknown block: {unknownBlock._type}</div>
                        }
                        return null;
                }
            })
            }
        </>
    )
}
