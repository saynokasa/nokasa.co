import Link from 'next/link'
import React from 'react'
export default function Hero() {
  return (
    <div className='bg-hero h-screen py-[87px] bg-cover bg-center flex items-center'>
      <div className='max-w-[770px] px-5 mx-auto text-white text-center'>
        <h2 className='text-[46px] leading-[52px] tracking-[-2px] font-semibold md:text-[72px] md:leading-[79px]'>Together, let’s make a change!</h2>
        <p className='text-base tracking-[1px] md:text-xl my-8'>Got scrap? Sell your recyclables to us and fuel the circular economy</p>
        <Link href="#form" passHref>
          <button className="text-[16px] leading-[16px] tracking-[1px] font-semibold py-[22px] px-[32px] bg-transparent hover:bg-white hover:text-black border border-white hover:border-transparent rounded">
            BOOK A SLOT
          </button>
        </Link>
      </div>
    </div>
  )
}
