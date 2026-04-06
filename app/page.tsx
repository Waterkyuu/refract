import AmbientGlow from "@/components/home/ambient-glow";
import Footer from "@/components/home/footer";
import Header from "@/components/home/header";
import InputTitle from "@/components/home/input-title";
import InputField from "@/components/share/input-field";

const HomePage = () => {
	return (
		<div className="flex h-screen w-screen flex-col items-center justify-center">
			<Header />
			<main className="flex w-full flex-1 flex-col items-center justify-center gap-6">
				<InputTitle />
				<div className="relative flex w-full items-center justify-center px-4">
					<AmbientGlow />
					<InputField />
				</div>
			</main>
			<Footer />
		</div>
	);
};

export default HomePage;
