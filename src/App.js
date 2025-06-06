
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login'
import Register from './Register';
import './App.css';
import HomePage from './HomePage';
import 'bootstrap/dist/css/bootstrap.min.css'
import Profile from './profile';


function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Login />} />
          <Route path='/register' element={<Register/>} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/home" element={<HomePage />} />
        </Routes>
      </BrowserRouter> 
    </div>
  );
}

export default App;
