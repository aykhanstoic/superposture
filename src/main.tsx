import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initTrayKeepAlive } from "@/utils/keepAlive";

initTrayKeepAlive();

createRoot(document.getElementById("root")!).render(<App />);
