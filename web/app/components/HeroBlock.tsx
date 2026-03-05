import { HeroBlock as HeroBlockType } from "@/types/sanity"
import { urlFor } from "@/sanity/image"
import Image from "next/image"

export default function HeroBlock( { block }: { block: HeroBlockType }) {
    const mediaType = block.bgMedia?.mediaType

    return (
        <div style={{ position: "relative", width: "100%", height: "400px", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {mediaType === "image" && block.bgMedia?.image && (
                <Image src={urlFor(block.bgMedia.image).url()} alt="Background" fill/>
            )}
            {mediaType === "video" && block.bgMedia?.videoUrl && (
                <video autoPlay loop muted>
                    <source src={block.bgMedia.videoUrl} type="video/mp4"/>
                    Your browser does not support the video tag.
                </video>
            )}
            <p>{block.overlayText}</p>
        </div>

    )
}