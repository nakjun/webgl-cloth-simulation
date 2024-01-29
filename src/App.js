import React, { useState, useEffect, useRef } from 'react'
import './App.css';
import { SceneManager } from './Simulations/Scene';
import * as dat from 'lil-gui'

// function App() {

//   const [n, setN] = useState(10); // 기본값 10
//   const [m, setM] = useState(10); // 기본값 10
//   const [isButtonDisabled, setIsButtonDisabled] = useState(false);


//   const handleNChange = (e) => {
//     setN(parseInt(e.target.value) || 0);
//   };

//   const handleMChange = (e) => {
//     setM(parseInt(e.target.value) || 0);
//   };

//   const handleCreateCloth = () => {
//     setIsButtonDisabled(true);
//     const sceneManager = new SceneManager(n, m);
//     sceneManager.start();
//   };


//   return (
//     <div>
//       <label>
//         N (Width):
//         <input type="number" value={n} onChange={handleNChange} />
//       </label>
//       <label>
//         M (Height):
//         <input type="number" value={m} onChange={handleMChange} />
//       </label>
//       <button onClick={handleCreateCloth} disabled={isButtonDisabled}>
//         Create Cloth
//       </button>
//     </div>
//   );
// }


function App() {
  const managerRef = useRef(null);

  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = new SceneManager();
      managerRef.current.render();

      const gui = new dat.GUI();
      gui.title("Simulation Mode")

      gui.add({ Particle: () => managerRef.current.startSimulation('particle') }, 'Particle');
      gui.add({ Cloth: () => managerRef.current.startSimulation('cloth') }, 'Cloth');
    }
  }, []);

  return (
    <div>
    </div>
  );
}


export default App;
