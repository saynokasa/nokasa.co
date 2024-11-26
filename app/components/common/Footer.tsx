"use client";
import React, { MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import Socialmedia from "../home/subcomponents/Socialmedia";

export default function Footer() {
  return (
    <div className="max-w-[1180px] pt-3 mt-16 md:mt-10 m-auto mx-min-10">
      <div className="md:grid grid-cols-12">
        <div className="col-span-4 pl-3 pr-14 text-center">
          <div className="text-left">
            <div className="inline-flex items-center">
              <Image
                src={"/assets/icons/symbol.png"}
                alt="money"
                width={32}
                height={32}
                className="inline-block ml-4 md:ml-0"
              />
              <h4 className="inline-block font-inter font-bold text-[26px] text-[#354E3B] pl-2 leading-8 tracking-[-1px]">
                NoKasa
              </h4>
            </div>
          </div>

          <p className="font-inter text-left text-[#354E3B] leading-6 mt-4 hidden md:block">
            At NoKasa, we boost recycling by bringing together consumers,
            q-commerce apps and scrap dealers.
          </p>
        </div>
        <div className="col-span-3 pl-8">
          <h4 className="font-inter text-[#354E3B] text-lg font-bold mb-2 hidden md:block">
            Important links
          </h4>
          <div className="text-sm font-inter font-medium leading-4 text-[#354E3B]">
            <div className="grid grid-cols-2 md:block">
              <Link
                href="/#companies"
                className="block my-4 pr-6 md:pr-0 group relative w-max scroll-smooth"
              >
                For companies
                <span className="absolute -bottom-1 right-0 w-0 transition-all h-0.5 bg-[#E3803B] group-hover:w-full"></span>
              </Link>
              <Link
                href="/#business"
                className="block my-4 group relative w-max scroll-smooth"
              >
                For scrap dealers
                <span className="absolute -bottom-1 right-0 w-0 transition-all h-0.5 bg-[#E3803B] group-hover:w-full"></span>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:block">
              <Link
                href="/#works"
                className="block my-4 pr-6 md:pr-0 group relative w-max scroll-smooth"
              >
                How it works
                <span className="absolute -bottom-1 right-0 w-0 transition-all h-0.5 bg-[#E3803B] group-hover:w-full"></span>
              </Link>
              <Link
                href="/#contact"
                className="block my-4 group relative w-max scroll-smooth"
              >
                Contact us
                <span className="absolute -bottom-1 right-0 w-0 transition-all h-0.5 bg-[#E3803B] group-hover:w-full"></span>
              </Link>
            </div>
            <div className="grid grid-cols-2  md:hidden">
              <Link
                href="/privacy"
                className="block my-4 pr-6"
              >
                Privacy and Policy
              </Link>
              <Link href="/terms-of-service" className="block my-4">
                Terms and Conditions
              </Link>
            </div>
          </div>
        </div>
        <div className="col-span-2"></div>
        <div className="col-span-3">
          <div className="hidden md:block">
            <h4 className="font-inter text-[#354E3B] text-lg font-bold mb-2">
              Join us
              <span className="absolute -bottom-1 right-0 w-0 transition-all h-0.5 bg-[#E3803B] group-hover:w-full"></span>
            </h4>
            <Socialmedia />
          </div>
          <div className="hidden md:block mt-10">
            <h4 className="font-inter text-[#354E3B] text-lg font-bold mb-2">
              Write us on
              <span className="absolute -bottom-1 right-0 w-0 transition-all h-0.5 bg-[#E3803B] group-hover:w-full"></span>
            </h4>
            <Link
              href="mailto:founders@nokasa.com"
              className="texl-lg font-inter leading-[19.8px] group relative w-max"
            >
              founders@nokasa.com
              <span className="absolute -bottom-1 right-0 w-0 transition-all h-0.5 bg-[#E3803B] group-hover:w-full"></span>
            </Link>
          </div>
        </div>
      </div>
      <hr className="my-12 md:my-10" />
      <div className="py-8 text-center">
        <div className="block md:grid grid-cols-3 text-sm leading-[19.6px]">
          <div className="py-0 text-left hidden md:block">
            NoKasa @ 2024. All rights reserved.
          </div>
          <div className="text-[#048F25]">Made with ❤ in Bengaluru</div>
          <div className="py-4 md:hidden">
            NoKasa @ 2024. All rights reserved.
          </div>
          <div className="hidden md:grid grid-cols-2">
            <Link href="/privacy" className="block my-1 m-6 group relative w-max">
              Privacy and Policy
              <span className="absolute -bottom-1 right-0 w-0 transition-all h-0.5 bg-[#E3803B] group-hover:w-full"></span>
            </Link>
            <Link href="/terms-of-service" className="block my-1 m-6 group relative w-max">
              Terms and Conditions
              <span className="absolute -bottom-1 right-0 w-0 transition-all h-0.5 bg-[#E3803B] group-hover:w-full"></span>
            </Link>
          </div>
        </div>
        <div className="m-auto inline-block md:hidden text-center">
          <Socialmedia />
        </div>
      </div>
    </div>
  );
}
