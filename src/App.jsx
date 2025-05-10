import React, { useEffect, useState } from "react";
import Navbar from "./Components/Navbar";
import SideBarAp from "./Components/SideBarAp";
import { Routes, Route } from "react-router-dom";
import AddProducts from "./Pages/AddProducts";
import ListProducts from "./Pages/ListProducts";
import Ordered from "./Pages/Ordered";
import LoginAdmin from "./Components/LoginAdmin";
import { ToastContainer } from 'react-toastify';

export const backendUrl = import.meta.env.VITE_BACKEND_URL
export const currency ='£'
const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token')? localStorage.getItem('token'):'');
  
  useEffect(()=>{
    localStorage.setItem('token', token)
  },[token])


  return (
    <div className="bg-gray-60 min-h-screen">
      <ToastContainer />
      {token === "" ? (
        <LoginAdmin setToken={setToken} />
      ) : (
        <>
          <Navbar  setToken={setToken}/>
          <hr />
          <div className="flex w-full">
            <SideBarAp />
            <div className="w-80% mx-auto ml-[max(5vw,25px)] my-8 text-gray-700 text-base">
              <Routes>
                <Route path="/AddProducts" element={<AddProducts  token={token} />} />
                <Route path="/ListProducts" element={<ListProducts token={token}  />} />
                <Route path="/Ordered" element={<Ordered token={token}  />} />
              </Routes>
            </div>
          </div>
        </>
      )}
      
    </div>
  );
};

export default App;
