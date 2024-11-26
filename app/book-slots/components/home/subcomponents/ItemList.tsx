import React from 'react';
import Image from 'next/image';

interface TableItem {
  title: string;
  description: string;
  icon: string;
  alt: string;
}

interface ItemProps {
  item: TableItem;
}

const Item: React.FC<ItemProps> = ({ item }) => {
  return (
    <div>
      <div className="grid grid-cols-9 py-5 gap-1">
        <div className="flex justify-center items-center">
          <Image
            src={item.icon}
            alt={item.alt}
            width={40}
            height={30}
          />
        </div>
        <div className="col-span-8">
          <div className="text-[22px] md:text-3xl font-normal font-aveira md:tracking-[-.03em] leading-[26.21px] md:leading-[36.28px] mb-1">
            {item.title}
          </div>
          <div className="text-[#ffffff90] font-inter text-xs leading-[19px] md:text-lg md:leading-[27x] ">
            {item.description}
          </div>
        </div>
      </div>
      <hr />
    </div>
  );
};

export default Item;
