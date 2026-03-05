import { TeamBlock as TeamBlockType } from "@/types/sanity"
import { urlFor } from "@/sanity/image"
import Image from "next/image"

export default function TeamBlock({ block }: { block: TeamBlockType }) {
	if (!block.members || block.members.length === 0) return null

	return (
		<div>
			<ul>
				{block.members.map(member => (
					<li key={member._id}>
						{member.photo && (
							<Image
								src={urlFor(member.photo).width(200).height(200).url()}
								width={200}
								height={200}
								alt={`Photo of ${member.name}`}
							/>
						)}
						<h3>{member.name}</h3>
						{member.role && <p>{member.role}</p>}
						{member.bio && <p>{member.bio}</p>}
					</li>
				))}
			</ul>
		</div>
	)
}
