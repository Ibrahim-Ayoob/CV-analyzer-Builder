import React from 'react';
import CVBuilder from './components/CVBuilder';
import './App.css';

function App() {
  return (
    <div className="App">
      <CVBuilder onBack={() => console.log('Back button clicked')} />
    </div>
  );
}

export default App;