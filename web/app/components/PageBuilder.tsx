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

export default function PageBuilder({blocks}: { blocks: PageBuilderBlock[]}) {
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
                    case "richTextBlock": return <RichTextBlock key={block._key} block={block}/>;
                    case "teamBlock": return <TeamBlock key={block._key} block={block}/>;
                    case "volunteerBlock": return <VolunteerBlock key={block._key} block={block}/>;
                    case "instagramBlock": return <InstagramBlock key={block._key} block={block}/>;
                    case "contactBlock": return <ContactBlock key={block._key} block={block}/>;
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
