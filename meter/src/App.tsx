import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import MainWindow from "./MainWindow";
import Popover from "./Popover";

export default function App() {
  const isPopover = getCurrentWebviewWindow().label === "popover";
  return isPopover ? <Popover /> : <MainWindow />;
}
