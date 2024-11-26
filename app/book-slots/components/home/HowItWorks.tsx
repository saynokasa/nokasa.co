"use client";
import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import HowItWorksBoxes from "./subcomponents/HowItWorksBoxes";

interface Table {
  class1: string;
  class2: string;
  image: string;
  title: string;
  description: string;
}

const table: Table[] = [
  {
    class1: "ml-8",
    class2: "top-20",
    image: "HowItWork01",
    title: "Integrate NoKasa's API",
    description: "Incorporate NoKasa's API into your app. Place it strategically to ensure it's visible to a broad audience."
  },
  {
    class1: "pl-24",
    class2: "top-16",
    image: "HowItWork02",
    title: "Users book a pickup slot",
    description: "Users can easily schedule a pickup at their convenience,choosing a time slot that fits their schedule."
  },
  {
    class1: "pl-8",
    class2: "top-16",
    image: "HowItWork03",
    title: "Pickup by our partner",
    description: "Our partner will visit to collect and weigh the waste, and issue a receipt for the transaction."
  },
  {
    class1: "pl-0",
    class2: "top-28",
    image: "HowItWork04",
    title: "Cashback rewards for users",
    description: "Following the pickup, users get cashback directly in the app, enhancing their satisfaction and loyalty."
  },
  {
    class1: "pl-0",
    class2: "top-24",
    image: "HowItWork05",
    title: "Go green together",
    description: "Celebrate our joint environmental efforts. Every recycling action counts towards having a better earth."
  },
]

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState<boolean>(false);
  const [animationPaused, setAnimationPaused] = useState<boolean>(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      {
        threshold: 0.1,
      }
    );

    const currentRef = ref.current;

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  useEffect(() => {
    const currentElement = ref.current;

    if (!currentElement) return;

    const toggleAnimation = (isRunning: boolean) => {
      currentElement.style.animationPlayState = isRunning ? "running" : "paused";
      setAnimationPaused(!isRunning);
    };

    const handleAnimationEnd = () => toggleAnimation(false);
    const handleAnimationStart = () => toggleAnimation(true);

    currentElement.addEventListener("animationend", handleAnimationEnd);

    if (inView) {
      currentElement.style.animation = "none";
      currentElement.offsetHeight; 
      currentElement.style.animation = "";
      handleAnimationStart();
    } else {
      handleAnimationEnd();
    }

    return () => {
      currentElement.removeEventListener("animationend", handleAnimationEnd);
    };
  }, [inView]);

  const handleAnimationClick = () => {
    const currentElement = ref.current;
    currentElement.style.animationPlayState = animationPaused ? "running" : "paused";
    setAnimationPaused(!animationPaused);
  };
  return (
    <div className="h-[650px]" id="works">
      <div className="text-center py-4">
        <h3 className="relative inline-block font-aveira text-[#354E3B] tracking-[-.03em] leading-[33.87px] text-[28px] sm:text-5xl sm:leading-[58.05px]">
          <Image
            className="hidden sm:block absolute -left-12 -top-14"
            src={"/assets/boosting-recycling-top-icon.png"}
            alt="ball"
            width={80}
            height={80}
          />
          How it works
        </h3>
        <p className="m-1 font-inter text-[#002308] text-sm leading-[16.94px] sm:text-[22px] sm:leading-[32px] mb-20">
          Let&apos;s see the workflow in action
        </p>
      </div>
      <div className="relative h-screen">
        <div
          ref={ref}
          onClick={handleAnimationClick}
          className={`flex absolute right-0 ${inView ? "animate-loop-scroll" : "static-scroll"
            } fill-mode-forwards cursor-pointer`}
          style={{ animationPlayState: animationPaused ? "paused" : "running" }}
        >
          <div className="z-0">
            <Image
              src={"/assets/Hand-Element.png"}
              alt="hand"
              height={329}
              width={2600}
            />
          </div>
          <div className="grid grid-cols-5 gap-16 z-10 absolute right-0 w-full h-full text-center">
            {table.map((item, index) => (
              <HowItWorksBoxes key={index} prop={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}