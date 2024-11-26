"use client";
import React from "react";
import Image from "next/image";
import Lottie from "lottie-react";
import Companies from "../../../public/assets/Lottie/companies.json";
// import Coins from "../../public/assets/Lottie/coins.json";
import Item from "./subcomponents/ItemList";

interface TableItem {
  index: number;
  title: string;
  description: string;
  icon: string;
  alt: string;
}

const table1: TableItem[] = [
  {
    index: 1,
    title: "Unlock new revenue streams",
    description:
      "Create a new income stream. Earn a commission on every transaction. It's not just about eco-friendly; it's profitable too.",
    icon: "/assets/Partner/iconDoller.png",
    alt: "money",
  },
  {
    index: 2,
    title: "Get more repeat users",
    description:
      "Cash collected from recycling goes directly into your app as a cashback, encouraging repeat visits and fostering loyalty.",
    icon: "/assets/Partner/UserCircleGear.png",
    alt: "user",
  },
  {
    index: 3,
    title: "Polish your brand, go green",
    description:
      "Green companies attract more customers. Enhance your image by adopting eco-friendly practices. Stand out for the planet.",
    icon: "/assets/Partner/Recycle.png",
    alt: "Recycle",
  },
];

const table2: TableItem[] = [
  {
    index: 1,
    title: "Expand your customer base",
    description:
      "Gain new users and increase recurring revenue without extra marketing costs.",
    icon: "/assets/Partner/UsersThree.png",
    alt: "threeUsers",
  },
  {
    index: 2,
    title: "Accelerate revenue growth",
    description:
      "NoKasa makes it easier to collect more segregated solid waste, directly impacting your bottom line through efficient operations.",
    icon: "/assets/Partner/iconDoller.png",
    alt: "money",
  },
  {
    index: 3,
    title: "Gain valuable insights & analytics",
    description:
      "Access anonymized demographic data from waste collection. Gain insights to better serve your users.",
    icon: "/assets/Partner/ChartDonut.png",
    alt: "chartDonut",
  },
];

export default function Partner() {
  return (
    <div className="md:my-24 relative z-40">
      <Image
        className="w-full h-[20px]"
        src={"/assets/separator-pattern1.png"}
        alt="top"
        width={256}
        height={5}
      />
      <div className="bg-[#387943] text-[#FCF1DC] pt-20">
        <div className="text-center">
          <h3 className="relative inline-block text-[28px] md:text-5xl font-aveira tracking-[-.03em] leading-[34px] md:leading-[59px]">
            <Image
              className="hidden md:block absolute -right-14 -top-10"
              src={"/assets/partner-title-icon.png"}
              alt="pattern"
              width={80}
              height={80}
            />
            Why partner with NoKasa
          </h3>
          <p className=" font-inter text-sm md:text-[22px] leading-[17px] md:leading-[32px]">
            Discover why e-com and scrap dealers should partner with NoKasa
          </p>
        </div>
        <div className="py-16 text-white">
          <div className="md:grid grid-cols-9">
            <div className="mb-5 md:mb-0 order-1 col-span-4 flex justify-center items-center">
              <Lottie
                loop={true}
                animationData={Companies}
                className="max-w-[95%] m-auto"
              />
            </div>
            <div className="p-2 md:pr-2 md:pl-20 col-span-5" id="business">
              <h3 className="text-[28px] md:text-[58px] font-aveira mb-5 text-[#FCF1DC] tracking-[-.03em] leading-[33.87px]  md:leading-[70.15px] ">
                Enpower your business for profit with purpose
              </h3>
              <div className="pb-20">
                {table1.map((item, index) => (
                  <Item key={index} item={item} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div id="companies" className="py-16 text-white">
          <div className="md:grid grid-cols-9">
            <div className="mb-5 md:mb-0 col-span-4 flex justify-center items-center">
              <div style={{ position: "relative" }}>
                <img
                  src="/assets/Trash Companies.gif"
                  className="max-w-[100%] min-w-[90%] m-auto"
                  alt="coins"
                />
                <div
                  className="absolute bottom-0 left-0 right-0"
                  style={{
                    height: "10%",
                    background: "#387943",
                  }}
                ></div>
              </div>
            </div>
            <div className="p-2 pb-10 md:pl-2 md:pr-20 order-2 col-span-5">
              <h3 className="text-[28px] md:text-[58px] font-aveira mb-5 text-[#FCF1DC] tracking-[-.03em] leading-[33.87px]  md:leading-[70.15px]">
                Maximizing revenue for trash companies
              </h3>
              <div>
                <div>
                  {table2.map((item, index) => (
                    <Item key={index} item={item} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Image
        className="w-full h-6"
        src={"/assets/separator-pattern2.png"}
        alt="top"
        width={256}
        height={5}
      />
    </div>
  );
}
