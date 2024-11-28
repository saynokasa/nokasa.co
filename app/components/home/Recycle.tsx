"use client";
import { useEffect } from "react";
import React from "react";
import Image from "next/image";
export default function Recycle() {
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const left_hand = document.querySelector(".hand-left") as HTMLElement;
      const right_hand = document.querySelector(".hand-right") as HTMLElement;

      if (left_hand && right_hand) {
        const translateXY = scrollPosition * 0.05;
        left_hand.style.transform = `translate(-${translateXY}px, ${translateXY}px)`;
        right_hand.style.transform = `translate(${translateXY}px, -${translateXY}px)`;
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  return (
    <div className="pt-32 md:pt-16 pb-20 md:pb-28 relative mb-24 flex items-center justify-center custom-height">
      <Image
        className="absolute hand-right -top-0 md:-top-20 -right-5 m-2 z-10  max-w-[100%] md:w-[735px]"
        alt="right-hand"
        src="/assets/boosting-recycling-hand-right.png"
        width={900}
        height={600}
      />
      <div className="max-w-[722px]">
        <div className="max-w-[520px] md:max-w-[720px] px-10 m-auto text-center relative">
          <h1 className="font-aveira text-[#354E3B] tracking-[-.03em] leading-[33.87px] text-[28px] md:text-[54px] md:leading-[65.31px]">
            <Image
              alt="recycle-icon"
              className="relative top-2"
              src="/assets/boosting-recycling-top-icon.png"
              width={70}
              height={70}
            />
            Boosting recycling, one transaction at a time
          </h1>
          <p className="mt-2 text-xs md:text-xl font-inter text-[#002308] leading-[21px] md:leading-[36px] ">
            <span className="font-semibold">In India, where most waste goes unrecycled, NoKasa is here to change the game.</span> Get rid of clutter and earn cashback rewards on your favorite e-commerce apps. Integrated with e-commerce platforms,  <span className="font-semibold">NoKasa makes scheduling scrap pickups simple, convenient, and rewarding.</span>
            Join us in our mission to increase recycling rates and create a
            cleaner planet.
          </p>
          <Image
            className="absolute  md:-bottom-12 right-0 m-2 "
            src="/assets/boosting-recycling-bottom-icon.png"
            alt="design"
            width={70}
            height={70}
          />
        </div>
      </div>

      <Image
        className="absolute object hand-left -bottom-16 left-0 max-w-[100%] sm:w-[735px]"
        src="/assets/boosting-recycling-hand-left.png"
        alt="hand"
        width={735}
        height={448}
      />
    </div>
  );
}
