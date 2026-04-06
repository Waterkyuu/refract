import { Spinner } from "@/components/ui/spinner";

const LoadingComp = () => {
	return (
		<div className="fixed inset-0 flex items-center justify-center">
			<Spinner className="size-12 md:size-16" />
		</div>
	);
};

export default LoadingComp;
