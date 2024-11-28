"use client"
import Image from "next/image";
import Lottie from "lottie-react";
import Logo from "../../../public/assets/Lottie/Hero.json";
import Link from "next/link";

export default function Hero() {
  return (
    <div className="w-full pt-12 md:pt-4 p-4 min-h-screen bg-hero bg-cover bg-left-bottom bg-no-repeat flex items-center justify-center">
      <div className="grid md:grid-cols-2 w-full">
        <div className="flex justify-end ">
          <div className="md:mt-20 px-2  m-auto max-w-[400px] md:max-w-[550px]">
            <div className="text-white md:ml-8">
              <h1 className="text-5xl md:text-7xl font-aveira relative leading-[46px] md:leading-[87px] tracking-[-0.03em] max-w-[350px] md:max-w-none">
                <Image
                  className="hidden md:block absolute -top-10 -left-10"
                  src="/assets/title.png"
                  alt="title"
                  width={45}
                  height={45}
                />
                Let&apos;s save the planet together!
                <Image
                  className="md:hidden absolute -top-8 right-12"
                  src="/assets/pricing-pattern5 1.png"
                  alt="banner"
                  width={45}
                  height={45}
                />
              </h1>
              <p className="mt-4 font-inter font-normal text-base md:text-lg md:leading-[31px]">
                At NoKasa, we boost recycling by bringing together consumers,
                q-commerce apps and scrap dealers
              </p>
            </div>
            <div className="mt-12 mb-10 md:mb-0 md:ml-8">
              <Link className="scroll-smooth" href="#contact">
                <button className="w-[150px] h-[50px] bg-[#E3803B] text-white font-semibold font-inter transition duration-700 hover:text-[#E3803B] hover:bg-white my-3 mr-5">
                  Let&apos;s connect
                </button>
              </Link>
              <Link className="scroll-smooth" href="#works">
                <button className="w-[150px] h-[50px] bg-[#E3803B] text-white font-semibold font-inter transition duration-700 hover:text-[#E3803B] hover:bg-white my-3 mr-5">
                  How it works
                </button>
              </Link>
            </div>
          </div>
        </div>
        <div className="flex justify-center items-center mt-4">
          <Lottie
            loop={true}
            animationData={Logo}
            className="h-[390px] w-[90%] md:h-[500px] md:w-[530px] m-auto max-h-[95%]"
          />
        </div>
      </div>
    </div>
  );
}