import { signInGithub, signInGoogle, signInVercel } from "@/services/user";
import { Button } from "../ui/button";

const oauthGroup = [
	{
		id: "google",
		alt: "google icon",
		icon: "/images/platform/google.svg",
		handler: signInGoogle,
	},
	{
		id: "github",
		alt: "github icon",
		icon: "/images/platform/github.svg",
		handler: signInGithub,
	},
	{
		id: "vercel",
		alt: "vercel icon",
		icon: "/images/platform/vercel.svg",
		handler: signInVercel,
	},
];

const OauthGroup = () => {
	return (
		<div className="grid grid-cols-3 gap-4">
			{oauthGroup.map((item) => (
				<Button
					key={item.id}
					variant="outline"
					className="py-4"
					onClick={item.handler}
				>
					<img src={item.icon} alt={item.alt} className="size-5" />
				</Button>
			))}
		</div>
	);
};

export default OauthGroup;
