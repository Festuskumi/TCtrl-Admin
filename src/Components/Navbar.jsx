import React from 'react'
import { assets } from '../assets/assets'

const Navbar = ({setToken}) => {
  return (
    <div className='flex items-center py-3 px-[3%] justify-between'>
        <div className='flex flex-row'>
      <img  className='w-33 cursor-pointer'  src={assets.logo} alt="Brand logo" />
      <h1 className='py-10 text-lg italic text-orange-600'>Admin Panel</h1>
      </div>
     
    
      <button onClick={()=>setToken('')} className='bg-gray-700 py-2 px-5 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm text-white cursor-pointer '>SignOut</button>
    </div>
  )
}

export default Navbar
