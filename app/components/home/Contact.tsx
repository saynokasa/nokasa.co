import React from "react";
import Image from "next/image";
import Form from "./subcomponents/Form";

export default function Contact() {
  return (
    <div className="h-screen flex items-center mt-28" id="contact">
      <div className="max-w-[1202px] sm:grid grid-cols-2 gap-5 m-auto p-12 sm:px-16 bg-[#FEFBF4] pt-12 relative">
        <div className="pr-5 pb-4 max-w-[456px]">
          <h1 className="max-w-[350px] text-[#354E3B] font-aveira text-[28px] tracking-[-.03em] leading-[33.87px] sm:text-5xl sm:leading-[58.05px]">
            Not fully convinced yet?
          </h1>
          <p className="text-[#002308] mt-3 font-inter text-sm leading-[18.51px] sm:text-lg sm:leading-[27px]">
            If you have any doubts or questions, let&apos;s clear them up with a
            quick call. Simply provide us with your basic details, and
            we&apos;ll handle the rest.
          </p>
        </div>
        <div className="pr-3 relative">
          <Form/>
        </div>
        <div className="absolute left-12 sm:bottom-4">
          <Image
            src="/assets/contact1.png"
            alt="money"
            height={40}
            width={80}
            className="w-[40px] h-[40px] relative right-8 sm:w-[100px] sm:h-[100px]"
          />
        </div>
      </div>
    </div>
  );
}
