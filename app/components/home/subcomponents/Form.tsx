"use client"
import React, { useState, useRef } from 'react';
import Image from 'next/image';
import emailjs from "@emailjs/browser";


const Spinner: React.FC = () => (
    <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
    </div>
);

export default function Form() {
    const [user, setUser] = useState({
        name: "",
        email: "",
        message: "",
    });
    const labelClass = "block font-inter text-sm leading-[16.94px] text-[#172327] sm:text-lg sm:leading-[24.2px]";
    const inputClass = "font-inter mt-1 block w-full px-3 py-2 border bg-transparent text-[#919293] border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-xs leading-[14.52px] sm:text-lg sm:leading-[21.78px]";

    const [errorMessage, setErrorMessage] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false); 

    const formRef = useRef<HTMLFormElement>(null);

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const message = e.target.value;
        setUser({ ...user, message });
    };

    const sendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsProcessing(true); 

        const template_params = {
            'name': user.name,
            'email': user.email,
            'message': user.message,
        };

        emailjs.send(
            process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
            process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
            template_params,
            process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
        ).then(
            () => {
                setUser({ name: "", email: "", message: "" });
                setShowSuccess(true);
                setIsProcessing(false); 
            },
            (error: { text: string }) => {
                console.log(error);
                setErrorMessage("Failed to send message. Please try again.");
                setIsProcessing(false); 
            }
        );
    };

    return (
        <form ref={formRef} onSubmit={sendEmail}>
            <div className="relative">
                <div className="absolute -right-9 -top-6 sm:-right-14 sm:-top-9">
                    <Image
                        src="/assets/pricing-pattern.png"
                        alt="money"
                        width={80}
                        height={80}
                        className="w-[50px] h-[50px] relative sm:w-[75px] sm:h-[67px]"
                    />
                </div>
                <div className="mb-4">
                    <label
                        htmlFor="name"
                        className={labelClass}
                    >
                        Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        className={inputClass}
                        value={user.name}
                        onChange={(e) => setUser({ ...user, name: e.target.value })}
                        placeholder="Enter your name"
                    />
                </div>
                <div className="mb-4">
                    <label
                        htmlFor="email"
                        className={labelClass}
                    >
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className={inputClass}
                        placeholder="Enter your email"
                        value={user.email}
                        onChange={(e) => setUser({ ...user, email: e.target.value })}
                    />
                </div>
                <div className="mb-6">
                    <label
                        htmlFor="message"
                        className={labelClass}
                    >
                        Message
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        className={`${inputClass} h-[111px]`}
                        placeholder="Enter your message"
                        required
                        value={user.message}
                        onChange={handleTextareaChange}
                    />
                    {errorMessage && (
                        <p className="text-sm text-[#FF0000] mt-1">{errorMessage}</p>
                    )}
                    {showSuccess && (
                        <p className="text-sm text-[#387943] mt-1">
                            Form Submitted Successfully
                        </p>
                    )}
                </div>
                <button
                    type="submit"
                    className={`w-full font-inter px-4 py-3 bg-[#C5895F] text-white hover:text-[#C5895F] hover:bg-white font-medium rounded-md focus:outline-none transition-all duration-700 ease-in-out focus:bg-brown-600 text-lg leading-[24px] border-[1px] border-solid border-[#C5895F] ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                    disabled={isProcessing}
                >
                    {isProcessing ? <Spinner /> : 'Book now'}
                </button>
            </div>
        </form>
    );
}
