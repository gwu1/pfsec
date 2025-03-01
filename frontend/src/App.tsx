import React from "react";
import PatientManagement from "./components/PatientManagement";

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="bg-green-800 text-white p-4">
        <h1 className="text-3xl">Patient Management</h1>
      </header>
      <main className="p-4">
        <PatientManagement />
      </main>
    </div>
  );
};

export default App;