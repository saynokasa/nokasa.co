import Link from "next/link";
import React from "react";

export default function HowItWorks() {
  const steps = [
    {
      title: "SCHEDULE",
      description: "Choose a convenient date and time for pickup",
      icon: "Schedule",
    },
    {
      title: "PREPARE",
      description: "Gather your recyclables and ensure it meets the minimum weight",
      icon: "Prepare",
    },
    {
      title: "PICKUP",
      description: "Our team arrives to collect your items",
      icon: "Pickup",
    },
    {
      title: "CASH",
      description: "Earn a cash reward for your contribution",
      icon: "Cash",
    },
    {
      title: "RECYCLE",
      description: "We responsibly dispose and recycle your trash",
      icon: "Recycle",
    },
  ];

  return (
    <div className="relative px-5 py-10 overflow-hidden">
      <div className="absolute inset-0 m-auto w-full h-full bg-[#D9F9DA] filter blur-[193px] rounded-[617px] transform rotate-[-90deg] z-0"></div>

      <div className="relative z-10 max-w-[865px] mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">How It Works</h1>
        <p className="text-gray-600 mb-12">
          Simple steps for effortless recycling and rewards
        </p>
        <div className="relative space-y-8 inline-block">
          {steps.map((step, index) => (
            <div key={index} className="relative flex flex-col items-center">
              {index !== steps.length - 1 && (
                <div
                  className={`absolute top-full ${index % 2 === 0 ? "left-10" : "right-10"
                    } flex justify-center`}

                >
                  <img
                    src={`/assets/howitworks/dottedline.svg`}
                    alt="Dotted Connector"
                    className="h-full"
                  />
                </div>
              )}

              <div className="relative flex items-center bg-white py-6 px-2 mx-2 rounded-lg shadow-md max-w-[468px] w-full space-x-4">
                <div className="absolute top-2 right-2 text-[#A0AFA0] font-bold text-3xl">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="flex items-center justify-center h-16 w-16 min-h-[64px] min-w-[64px] rounded-lg bg-green-100">
                  <img
                    src={`/assets/howitworks/${step.icon}.svg`}
                    alt={step.title}
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>




        <div className="mx-auto mt-12 w-[245px]">
          <Link href="#form" passHref scroll={true}>
            <button className="px-6 py-3 w-[245px] border-2 border-[#6CAE73] text-[#387942] bg-transparent shadow hover:bg-[#387942] hover:text-white hover:border-[#387942] transition-all duration-300 ease-in-out">
              Book a Slot
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
