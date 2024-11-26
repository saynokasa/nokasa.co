import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";

export default function HowItWorksBoxes({ prop }) {
  return (
    <div className={`m-auto relative h-[450px] pt-0 w-[450px] sm:w-[488px] ${prop.class1}`}>
      <div>
        <div>
          <div>
            <Image
              src={`/assets/Partner/icon-${prop.image}.png`}
              alt={prop.image}
              className={`m-auto relative ${prop.class2}`}
              height={270}
              width={270}
            />
          </div>
        </div>

        <div>
          <div className="absolute top-[350px] w-[440px]">
            <h3 className="text-3xl font-aveira text-[#354E3B]">
              {prop.title}
            </h3>
            <p className="font-inter text-[20xl] text-[#002308]">
              {prop.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}