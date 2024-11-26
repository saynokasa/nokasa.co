"use client";
import React from "react";
import BenefitsBoxes from "./subcomponents/BenefitsBoxes";
import Treasure from "../../../public/assets/Lottie/Treasure.json";
import Core from "../../../public/assets/Lottie/Core.json";
import Circular from "../../../public/assets/Lottie/circular.json";
import Car from "../../../public/assets/Lottie/Driving.json";
import Image from "next/image";

interface Table {
  index:number;
  title: string;
  description: string;
  lottie: object;
  style: string;
}

const table: Table[] = [
  {
    index:1,
    title: "Turning trash into treasure",
    description:
      "Turn recyclables into cashback rewards, making each contribution to the environment rewarding and fulfilling.",
    lottie: Treasure,
    style:
      "h-[120px] w-[140px] md:h-[235px] md:w-[274px] absolute -right-2 bottom-0",
  },
  {
    index:2,
    title: "Fostering a circular economy",
    description:
      "Join us in building a circular economy where waste is transformed into valuable resources, ensuring a more sustainable future for all.",
    lottie: Circular,
    style:
      "h-[111px] w-[106px] md:h-[216px] md:w-[206px] absolute right-0 bottom-4",
  },
  {
    index:3,
    title: "Addressing the core",
    description:
      "We are at the forefront of tackling waste at its source, offering a sustainable solution to minimise environmental impact.",
    lottie: Core,
    style:
      "h-[120px] w-[140px] md:h-[235px] md:w-[274px] absolute -right-8 bottom-0",
  },
  {
    index:4,
    title: "Driving green initiatives forward",
    description:
      "With NoKasa, increase the collection of recyclable waste, driving up recycling rates and creating a cleaner, greener future.",
    lottie: Car,
    style:
      "h-[207px] w-[220px] md:h-[380px] md:w-[390px] absolute -right-6 -bottom-8 md:-right-9 md:-bottom-16",
  },
];


export default function Benefits() {
  return (
    <div className=" pt-20 mb-20 md:mb-10 px-2 max-w-[1400px] mx-auto">
      <div className="md:px-8">
        <div className="text-center pb-8">
          <h1 className="text-3xl md:text-5xl inline-block relative font-aveira text-[#354E3B]">
            Benefits of NoKasa
            <Image
              className="absolute -right-16 -top-14"
              src={"/assets/pricing-pattern5.png"}
              alt="ball"
              width={80}
              height={80}
            />
          </h1>
          <h4 className="text-sm md:text-xl text-[#002308] font-inter my-1">
          Discover the benefits of NoKasa
          </h4>
        </div>
        <div className="relative">
          <Image
            className="hidden md:block absolute -right-7 -top-7 z-0"
            src={"/assets/benefits-before-img.png"}
            alt="ball"
            width={120}
            height={120}
          />
          <div className="md:grid grid-cols-2 relative my-2">
            {table.map((item,index) => (
              <BenefitsBoxes key={index} item={item} />
            ))}
          </div>
          <Image
            className="hidden md:block absolute -left-6 -bottom-4"
            src={"/assets/benefits-after-img.png"}
            alt="ball"
            width={51}
            height={60}
          />
        </div>
      </div>
    </div>
  );
}
