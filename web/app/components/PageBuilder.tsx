import { PageBuilderBlock } from "@/types/sanity";
import HeroBlock from "@/app/components/HeroBlock";
import FeaturedUpdateBlock from "@/app/components/FeaturedUpdateBlock";
import FeaturedPostBlock from "@/app/components/FeaturedPostBlock";
import BlogListBlock from "@/app/components/BlogListBlock";
import EventListBlock from "@/app/components/EventListBlock";
import RichTextBlock from "@/app/components/RichTextBlock";
import ContactBlock from "@/app/components/ContactBlock";
import ImageBlock from "@/app/components/ImageBlock";
import TeamBlock from "@/app/components/TeamBlock";

export default function PageBuilder({blocks}: { blocks: PageBuilderBlock[]}) {
    return (
        <>
            {
            blocks.map(block => {
                switch (block._type) {
                    case "heroBlock": return <HeroBlock key={block._key} block={block}/>;
                    case "featuredUpdateBlock": return <FeaturedUpdateBlock key={block._key} block={block}/>;
                    case "featuredPostBlock": return <FeaturedPostBlock key={block._key} block={block}/>;
                    case "blogListBlock": return <BlogListBlock key={block._key} block={block}/>;
                    case "eventListBlock": return <EventListBlock key={block._key} block={block}/>;
                    case "richTextBlock": return <RichTextBlock key={block._key} block={block}/>;
                    case "teamBlock": return <TeamBlock key={block._key} block={block}/>;
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
