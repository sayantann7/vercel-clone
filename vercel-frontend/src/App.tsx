import './App.css'
import { Landing } from './components/landing'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from '@/pages/login'
import SignupPage from '@/pages/signup'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
