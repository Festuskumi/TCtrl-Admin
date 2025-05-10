import React, { useState } from 'react';
import { assets } from '../assets/assets';
import axios from 'axios'
import { backendUrl } from '../App';
import {toast} from 'react-toastify'

const LoginAdmin = ({setToken}) => {

    const [email,setEmail] =useState('')
    const [password,setPassword] =useState('')
    const onSubmitHandler =async (e)=>{
        try {
            e.preventDefault();
            const response = await axios.post(backendUrl + '/api/users/admin', {email,password})
            if (response.data.success) {
                setToken(response.data.token)
            }else{
                toast.error(response.data.message)
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white flex flex-col items-center shadow-lg rounded-xl px-8 py-10 w-full max-w-md transition-all duration-300 transform hover:scale-105">
        
        {/* Logo with Fade-in Animation */}
        <img 
          className="w-24 h-24 mb-4 animate-fadeIn"
          src={assets.logo}
          alt="Brand-Logo"
        />
        
        {/* Title */}
        <h1 className="text-3xl font-extrabold mb-6 text-gray-900">TCtrl Admin Panel</h1>
        
        {/* Form */}
        <form onSubmit={onSubmitHandler} className="w-full">
          {/* Email Field */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700">Admin Email</label>
            <input onChange={(e)=>setEmail(e.target.value)} value={email}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              type="email"
              placeholder="your@tcrl.co.uk"
              required
            />
          </div>

          {/* Password Field */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700">Admin Password</label>
            <input onChange={(e)=>setPassword(e.target.value)} value={password}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              type="password"
              placeholder="Enter Password"
              required
            />
          </div>

          {/* Submit Button */}
          <button 
            className="w-full py-3 rounded-lg font-semibold text-white bg-indigo-600 transition-all duration-300 hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            type="submit"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginAdmin;
