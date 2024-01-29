import React, {useState} from 'react'
import './App.css';
import { SceneManager } from './Simulations/Scene';

function App() {
  
  const [n, setN] = useState(10); // 기본값 10
  const [m, setM] = useState(10); // 기본값 10

  const handleNChange = (e) => {
    setN(parseInt(e.target.value) || 0);
  };

  const handleMChange = (e) => {
    setM(parseInt(e.target.value) || 0);
  };

  const handleCreateCloth = () => {
    // Cloth 생성 로직
    console.log(`Creating cloth with ${n} x ${m} nodes`);
    // 여기에 cloth 생성 로직을 추가하세요.
  };


  return (
    <div>
      <label>
        N (Width): 
        <input type="number" value={n} onChange={handleNChange} />
      </label>      
      <label>
        M (Height): 
        <input type="number" value={m} onChange={handleMChange} />
      </label>      
      <button onClick={handleCreateCloth}>Create Cloth</button>
    </div>
  );
}

export default App;
