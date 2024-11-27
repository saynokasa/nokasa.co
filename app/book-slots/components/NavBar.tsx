"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiAlignJustify } from "react-icons/fi";

export default function NavBar() {
  const [navbar, setNavbar] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); 
  const navbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
        setNavbar(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div ref={navbarRef} className="relative max-w-[1920px]">
      <nav
        className={`w-full max-w-[1920px] fixed top-0 z-50 md:px-10 transition-all duration-300 ease-in-out ${
          isScrolled ? "bg-[#0AC05E]" : "bg-transparent"
        }`}
      >
        <div className="justify-between px-0 py-5 mx-auto lg:max-w-7xl md:items-center md:flex md:px-8">
          <div>
            <div className="flex items-center justify-between md:block text-white pl-2">
              <Link href="/" passHref>
                <div className="text-left">
                  <div className="inline-flex items-center">
                    <Image
                      src={"/assets/icons/Logonav.svg"}
                      alt="money"
                      width={40}
                      height={40}
                      className="inline-block ml-0 md:ml-0 text-white"
                    />
                    <h4 className="inline-block font-inter font-bold text-[26px] pl-1 leading-8 tracking-[-1px]">
                      NoKasa
                    </h4>
                  </div>
                </div>
              </Link>
              <div className="md:hidden">
                <button
                  className="p-2 text-gray-700 rounded-md outline-none focus:border-gray-400 focus:border"
                  onClick={() => setNavbar(!navbar)}
                >
                  <FiAlignJustify size={32} color="white" />
                </button>
              </div>
            </div>
          </div>
          <div>
            <div
              className={`flex-1 justify-self-center md:block md:pb-0 md:mt-0 transition-all duration-500 ease-in-out transform ${
                navbar ? "max-h-screen opacity-100 bg-opacity-100" : "max-h-0 opacity-0"
              } md:max-h-full md:opacity-100`}
            >
              <ul className="text-white font-inter md:h-auto items-center justify-center text-center md:flex pb-8 md:pb-0">
                <li className="pt-6 md:py-0 md:pr-8">
                  <Link href="./" passHref legacyBehavior>
                    <a onClick={() => setNavbar(false)} className="group relative w-max">
                      Home
                      <span className="absolute -bottom-1 right-0 w-0 transition-all h-0.5 bg-[#E3803B] group-hover:w-full"></span>
                    </a>
                  </Link>
                </li>
                <li className="pt-6 md:py-0 md:pr-8">
                  <Link href="./blog" passHref legacyBehavior>
                    <a onClick={() => setNavbar(false)} className="group relative w-max">
                      Blog
                      <span className="absolute -bottom-1 right-0 w-0 transition-all h-0.5 bg-[#E3803B] group-hover:w-full"></span>
                    </a>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
