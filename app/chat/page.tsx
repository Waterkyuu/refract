import InputField from "@/components/share/input-field";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import MessageArea from "./components/message-area";
import VncPanel from "./components/vnc-panel";

const ChatPage = () => {
	return (
		<div className="flex h-screen w-screen flex-col">
			<main className="flex flex-1 overflow-hidden">
				<ResizablePanelGroup
					orientation="horizontal"
					className="flex flex-1 overflow-hidden"
				>
					<ResizablePanel defaultSize="25%" maxSize="50%">
						{/* chat area */}
						<div className="flex h-full w-full flex-col">
							<MessageArea />
							<div className="flex w-full items-center justify-center px-4 py-2">
								<InputField />
							</div>
						</div>
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel defaultSize="75%" minSize="50%">
						<VncPanel />
					</ResizablePanel>
				</ResizablePanelGroup>
			</main>
		</div>
	);
};

export default ChatPage;
