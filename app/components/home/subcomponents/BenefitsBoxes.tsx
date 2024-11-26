import React from "react";
import Lottie from "lottie-react";

interface Table {
  title: string;
  description: string;
  lottie: object;
  style:string
}

interface Props {
  item: Table;
}

const BenefitsBoxes: React.FC<Props> = ({ item }) => {
  return (
    <div className=" bg-[#EFEDE6] inline-block px-2 md:px-2 m-3 min-h-[221px] md:min-h-[298px] z-20 max-w-[630px]">
      <div className="md:grid grid-cols-10 gap-1 pl-2 md:pl-5 h-full">
        <div className="col-span-6 pt-8 md:pb-8">
          <h4 className="font-aveira text-[#354E3B] text-[22px] font-medium md:text-3xl tracking-[-.03em]">
            {item.title}
          </h4>
          <p className="font-inter text-sm md:text-lg text-[#002308] mt-2 leading-[19px] md:leading-[27px]">
            {item.description}
          </p>
        </div>
        <div className="col-span-4 relative h-full min-h-[120px]">
          <Lottie
            loop={true}
            animationData={item.lottie}
            className={item.style}
          />
        </div>
      </div>
    </div>
  );
};

export default BenefitsBoxes;