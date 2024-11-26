"use client";
import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

export default function Carousel() {
  const totalItems = 4;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleItemsCount, setVisibleItemsCount] = useState(1);
  const items = ["PAPER", "PLASTIC", "CARDBOARDS", "APPLIANCES"];

  const updateVisibleItemsCount = () => {
    if (window.innerWidth >= 1024) {
      setVisibleItemsCount(4);
    } else if (window.innerWidth >= 640) {
      setVisibleItemsCount(2);
    } else {
      setVisibleItemsCount(1);
    }
  };

  useEffect(() => {
    updateVisibleItemsCount();
    window.addEventListener("resize", updateVisibleItemsCount);
    return () => window.removeEventListener("resize", updateVisibleItemsCount);
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalItems - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const getVisibleItems = (): number[] => {
    const start = currentIndex;
    const end = start + visibleItemsCount;

    if (end <= totalItems) {
      return Array.from({ length: end - start }, (_, i) => start + i);
    }

    return [
      ...Array.from({ length: totalItems - start }, (_, i) => start + i),
      ...Array.from({ length: end % totalItems }, (_, i) => i),
    ];
  };

  const visibleItems = getVisibleItems();

  return (
    <div className="relative mb-10">
      <div className="bg-hover bg-cover h-3/5 bg-[#0AC05E] text-white" style={{
        backgroundPosition: "40% 12%",
      }}>
        <div className="relative max-w-[1100px] mx-auto h-full flex flex-col z-10 pt-10">
          <div className="md:flex justify-between items-center mb-12">
            <div className="text-center md:text-left px-3 mx-auto md:ml-0">
              <h3 className="text-3xl md:text-5xl font-bold text-white mb-4">
                What we accept
              </h3>
              <p className="text-white md:text-lg">
              Explore the items that you can hand over to us
              </p>
            </div>
            <div className="gap-4 block relative mx-3">
              <button
                onClick={handlePrev}
                className="absolute left-0 md:relative  md:left-auto mx-5 bg-transparent border-2 rounded-full p-3 shadow-lg transition-all duration-300 ease-in-out opacity-60 text-white border-white hover:opacity-100"
              >
                <FaArrowLeft />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-0 md:relative md:right-auto bg-transparent border-2 rounded-full p-3 shadow-lg transition-all duration-300 ease-in-out opacity-60 text-white border-white hover:opacity-100"
              >
                <FaArrowRight />
              </button>
            </div>
          </div>

          <div className="relative mt-12">
            <div className="flex justify-center gap-4 overflow-visible px-10 relative">
              {visibleItems.map((itemIndex) => (
                <div
                  key={itemIndex}
                  className="text-center w-full md:w-1/2 lg:w-1/4 max-w-[500px] h-[300px] mx-6 sm:mx-0 hover:-translate-y-10 transition-transform"
                >
                  <div className="bg-gradient-to-br from-[#D9F9DA] via-white to-white rounded-lg shadow-lg p-4 flex-shrink-0 relative transition-transform duration-500 ease-in-out transform h-40">
                    <img
                      src={`/assets/carousel/image${itemIndex + 1}.svg`}
                      alt={items[itemIndex]}
                      className="w-full h-40 object-contain absolute -top-16 z-20"
                    />
                  </div>
                  <h4 className="text-lg font-semibold mt-4 text-[#030C1B]">{items[itemIndex]}</h4>
                </div>
              ))}

            </div>
          </div>


          <div className="flex justify-center mt-0 space-x-2">
            {Array.from({ length: totalItems }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-3 w-3 rounded-full transition-all duration-300 ease-in-out ${currentIndex === index ? "bg-green-500" : "bg-gray-300"}`}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-2/5 bg-white z-0 pb-10"></div>
    </div>
  );
}
