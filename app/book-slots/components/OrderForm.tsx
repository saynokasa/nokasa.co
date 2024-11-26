'use client'
import React, { useState } from 'react'
import Image from 'next/image'

interface Waste {
    type: string;
    quantity: number;
}

interface FormData {
    name: string;
    address: string;
    email: string;
    phone: string;
    pickupDate: string;
    pickupTime: string;
    selectedWastes: Waste[];
}

export default function OrderForm() {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        address: '',
        email: '',
        phone: '',
        pickupDate: '',
        pickupTime: '',
        selectedWastes: [],
    });

    const wasteList = ["Paper", "Plastic", "Metal", "Glass", "E-Waste"];
    const [selectedWasteType, setSelectedWasteType] = useState('');
    const [quantity, setQuantity] = useState<string>('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleAddWaste = () => {
        const parsedQuantity = parseFloat(quantity);
        if (!selectedWasteType || isNaN(parsedQuantity) || parsedQuantity <= 0) return;

        const updatedWastes = [...formData.selectedWastes];
        const existingWaste = updatedWastes.find((waste) => waste.type === selectedWasteType);
        if (existingWaste) {
            existingWaste.quantity += parsedQuantity;
        } else {
            updatedWastes.push({ type: selectedWasteType, quantity: parsedQuantity });
        }
        setFormData((prevData) => ({ ...prevData, selectedWastes: updatedWastes }));
        setSelectedWasteType('');
        setQuantity('');
    };

    const handleDeleteWaste = (index: number) => {
        const updatedWastes = [...formData.selectedWastes];
        updatedWastes.splice(index, 1);
        setFormData((prevData) => ({ ...prevData, selectedWastes: updatedWastes }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log(formData);
    };

    const unchosenWastes = wasteList.filter(
        (waste) => !formData.selectedWastes.some((selected) => selected.type === waste)
    );

    return (
        <div className='bg-form bg-cover bg-center bg-[#D9F9DA] rounded-lg text-center max-w-[1200px] m-auto relative pt-10 z-0' id='form'>
            <div className="absolute inset-0 bg-form bg-cover"></div>
            <div className='max-w-[900px] mx-auto z-40'>
                <div>
                    <h3 className='text-[40px] font-semibold leading-[48px] text-[#313131]'>Book your pickup slot</h3>
                    <p className='text-lg py-2 text-[#3D4A3D]'>Schedule your pickup slot for hassle-free recycling and a greener tomorrow
                    </p>
                </div>
                <div className='mt-2 md:grid grid-cols-2 pb-[350px] md:pb-0'>
                    <div className='order-2 z-40'>
                        <form onSubmit={handleSubmit} className="mx-auto p-6 space-y-4 z-40">
                            <input
                                type="text"
                                name="name"
                                placeholder="Name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                            <input
                                type="text"
                                name="address"
                                placeholder="Address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                            <input
                                type="tel"
                                name="phone"
                                placeholder="Phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                            <div className="flex space-x-4">
                                <input
                                    type="date"
                                    name="pickupDate"
                                    value={formData.pickupDate}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                                />
                                <input
                                    type="time"
                                    name="pickupTime"
                                    value={formData.pickupTime}
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

                            {unchosenWastes.length !== 0 && (<div className="mt-4">
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
                                type="submit"
                                className="z-40 w-full p-3 bg-[#6CAE73] text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                            >
                                BOOK PICKUP
                            </button>
                        </form>
                    </div>
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
