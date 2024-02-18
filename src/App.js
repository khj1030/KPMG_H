import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Home from './components/home.js';
import Acc from './components/account.js';
import OCR from './components/ocr_test.js';
import TEST from './components/test_test.js';


function App() {
  return (
    <div className='App'>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/account" element={<Acc />} />
          <Route path="/ocr" element={<OCR />} />
          <Route path="/test" element={<TEST />} />

        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
