import { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";

function App() {
  const [count, setCount] = useState(0);

  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
