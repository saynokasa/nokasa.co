import React from "react";
import Image from "next/image";

// Define the prop type for HowItWorksBoxes
interface HowItWorksBoxesProps {
  class1: string;
  class2: string;
  image: string;
  title: string;
  description: string;
}

export default function HowItWorksBoxes({ class1, class2, image, title, description }: HowItWorksBoxesProps) {
  return (
    <div className={`m-auto relative h-[450px] pt-0 w-[450px] sm:w-[488px] ${class1}`}>
      <div className="relative">
        <div>
          <Image
            src={`/assets/Partner/icon-${image}.png`}
            alt={image}
            className={`m-auto relative ${class2}`}
            height={270}
            width={270}
          />
        </div>

        <div className="absolute top-[350px] w-full px-4">
          <h3 className="text-3xl font-aveira text-[#354E3B]">
            {title}
          </h3>
          <p className="text-xl font-inter text-[#002308]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
