import "./index.css";
import { mockCore } from "@easenav/core"

export function App() {
  return (
    <div className="app">
      {mockCore()}
    </div>
  );
}

export default App;
