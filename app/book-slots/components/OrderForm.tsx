'use client'
import React, { useState } from 'react'
import Image from 'next/image'

interface Waste {
    type: string;
    quantity: number;
}

interface FormData {
    personalInfo: {
        name: string;
        email: string;
        phone: string;
    };
    pickupDetails: {
        pickupDate: string;
        pickupTime: string;
        estimatedWeight: string;
    };
    address: {
        area: string;
        apartment: string;
        address2: string;
        landmark: string;
        city: string;
        pinCode: string;
    };
    selectedWastes: Waste[]; // Added selectedWastes
}

export default function OrderForm() {
    const [formData, setFormData] = useState<FormData>({
        personalInfo: {
            name: '',
            email: '',
            phone: '',
        },
        pickupDetails: {
            pickupDate: '',
            pickupTime: '',
            estimatedWeight: '',
        },
        address: {
            area: '',
            apartment: '',
            address2: '',
            landmark: '',
            city: '',
            pinCode: '',
        },
        selectedWastes: [],
    });

    const [step, setStep] = useState(0);
    const [selectedWasteType, setSelectedWasteType] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unchosenWastes, setUnchosenWastes] = useState(['Plastic', 'Glass', 'Paper', 'Metal']);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };
    const handleNext = () => {
        setStep((step+1)%2);
    };
    const handleAddWaste = () => {
        if (selectedWasteType && quantity) {
            setFormData((prevData) => ({
                ...prevData,
                selectedWastes: [
                    ...prevData.selectedWastes,
                    { type: selectedWasteType, quantity: parseFloat(quantity) },
                ],
            }));
            setQuantity('');
            setSelectedWasteType('');
        }
    };

    const handleDeleteWaste = (index: number) => {
        const updatedWastes = [...formData.selectedWastes];
        updatedWastes.splice(index, 1);
        setFormData((prevData) => ({
            ...prevData,
            selectedWastes: updatedWastes,
        }));
    };

    return (
        <div className="bg-form bg-cover bg-center bg-[#D9F9DA] rounded-lg text-center max-w-[1200px] m-auto relative pt-10 z-0" id="form">
            <div className="absolute inset-0 bg-form bg-cover"></div>
            <div className="max-w-[900px] mx-auto z-40">
                <div>
                    <h3 className="text-[40px] font-semibold leading-[48px] text-[#313131]">Book your pickup slot</h3>
                    <p className="text-lg py-2 text-[#3D4A3D]">
                        Schedule your pickup slot for hassle-free recycling and a greener tomorrow
                    </p>
                </div>
                <div className="mt-2 md:grid grid-cols-2 pb-[350px] md:pb-0">
                    {(step == 0) && (<div className="order-2 z-40">
                        <div>
                            <input
                                type="text"
                                name="name"
                                value={formData.personalInfo.name}
                                onChange={handleChange}
                                placeholder="Full Name"
                                className="w-full p-3 mb-4 border border-gray-300 rounded-md"
                            />
                            <input
                                type="email"
                                name="email"
                                value={formData.personalInfo.email}
                                onChange={handleChange}
                                placeholder="Email"
                                className="w-full p-3 mb-4 border border-gray-300 rounded-md"
                            />
                            <input
                                type="tel"
                                name="phone"
                                value={formData.personalInfo.phone}
                                onChange={handleChange}
                                placeholder="Phone Number"
                                className="w-full p-3 mb-4 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div className="flex space-x-4">
                            <input
                                type="date"
                                name="pickupDate"
                                value={formData.pickupDetails.pickupDate}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                            <input
                                type="time"
                                name="pickupTime"
                                value={formData.pickupDetails.pickupTime}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                        </div>

                        <div className="mt-4">
                            {formData.selectedWastes.map((waste, index) => (
                                <div key={index} className="flex justify-between items-center p-2 border rounded-md mb-2">
                                    <span>{waste.type}</span>
                                    <span>{waste.quantity.toFixed(2)} kg</span>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteWaste(index)}
                                        className="text-red-500 hover:text-red-600"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>

                        {unchosenWastes.length !== 0 && (
                            <div className="mt-4">
                                <h4 className="text-lg font-semibold">Add Waste:</h4>
                                <div className="flex space-x-2">
                                    <select
                                        value={selectedWasteType}
                                        onChange={(e) => setSelectedWasteType(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                                    >
                                        <option value="" disabled>
                                            Select waste
                                        </option>
                                        {unchosenWastes.map((waste) => (
                                            <option key={waste} value={waste}>
                                                {waste}
                                            </option>
                                        ))}
                                    </select>

                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={quantity}
                                            min="0.01"
                                            step="0.01"
                                            onChange={(e) => setQuantity(e.target.value)}
                                            className="w-full p-3 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                                            placeholder="Enter quantity"
                                        />
                                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">kg</span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleAddWaste}
                                        className="p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={handleNext}
                            className="w-full py-2 bg-[#6CAE73] text-white font-semibold rounded-md hover:bg-[#387942] focus:outline-none my-5"
                        >
                            NEXT
                        </button>
                    </div>)}
                    {(step == 1) && (<div className="order-2 z-40">
                        <div className="space-y-4">
                            <input
                                type="text"
                                name="area"
                                placeholder="Enter your area/location"
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                            <input
                                type="text"
                                name="apartment"
                                placeholder="Enter your apartment details"
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                            <input
                                type="text"
                                name="address2"
                                placeholder="Address 2"
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                            <input
                                type="text"
                                name="landmark"
                                placeholder="Landmark"
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                            <div className="flex space-x-4">
                                <input
                                    type="text"
                                    name="city"
                                    disabled
                                    value={formData.address.city}
                                    placeholder="City"
                                    className="w-1/2 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                                />
                                <input
                                    type="text"
                                    name="pinCode"
                                    value={formData.address.pinCode}
                                    disabled
                                    onChange={handleChange}
                                    placeholder="Pin code"
                                    className="w-1/2 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                                />
                            </div>
                        </div>

                        <div className="my-6 flex justify-between">
                            <button
                                type="button"
                                onClick={handleNext}
                                className="w-1/2 py-3 bg-gray-400 text-white font-semibold rounded-md hover:bg-gray-500 focus:outline-none mr-2"
                            >
                                BACK
                            </button>
                            <button
                                type="button"
                                className="w-1/2 py-3  bg-[#6CAE73] text-white font-semibold rounded-md hover:bg-[#387942] focus:outline-none ml-2"
                            >
                                BOOK PICKUP
                            </button>
                        </div>
                    </div>)}
                    <div className="order-1 md:relative z-40">
                        <Image
                            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[55vw] max-w-[350px] md:w-full h-auto mx-auto"
                            src="/assets/formImage.svg"
                            alt="person"
                            width={475}
                            height={500}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
