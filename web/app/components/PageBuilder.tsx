import { PageBuilderBlock } from "@/types/sanity";
import HeroBlock from "@/app/components/HeroBlock";

export default function PageBuilder({blocks}: { blocks: PageBuilderBlock[]}) {
    return (
        <>
            {
            blocks.map(block => {
                switch (block._type) {
                    case "heroBlock": return <HeroBlock key={block._key} block={block}/>;
                    case "nextEventBlock": return <div key={block._key}>Next Event Block Content</div>;
                    case "featuredPostBlock": return <div key={block._key}>Featured Post Block Content</div>;
                    case "eventListBlock": return <div key={block._key}>Event List Block Content</div>;
                    case "richTextBlock": return <div key={block._key}>Rich Text Block Content</div>;
                    case "teamBlock": return <div key={block._key}>Team Block Content</div>;
                    case "contactBlock": return <div key={block._key}>Contact Block Content</div>;
                    case "imageBlock": return <div key={block._key}>Image Block Content</div>;
                    default: if (process.env.NODE_ENV === "development") {
                        const unknownBlock = block as { _key: string; _type: string;}
                        return <div key={unknownBlock._key}>Unknown block : {unknownBlock._type}</div>
                    };
                    return null;
                }
            })
            }
        </>
    )
}
