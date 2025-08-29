import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { useAppContext } from '../context/AppContext';

export default function AddItem({ onItemAdded }) {
    const { axios } = useAppContext();
    const [formData, setFormData] = useState({
        name: "",
        price: 0,
        category: "",
        description: "",
        stock: 0,
        unit:""
    });
    const [units, setUnits] = useState([]);

    // Fetch units from backend when category changes
    useEffect(() => {
        if (formData.category) {
            fetchUnits(formData.category);
        } else {
            setUnits([]);
        }
    }, [formData.category]);

    const fetchUnits = async (category) => {
        try {
            console.log('Fetching units for category:', category);
            const response = await axios.get(`/api/items/unit-types`, {
                params: { category: category }
            });
            console.log('Full response:', response);
            console.log('Response data:', response.data);
            console.log('Response data type:', typeof response.data);
            
            // Extract units based on category from the response structure
            let unitsData = [];
            if (response.data.data) {
                if (category === '1' && response.data.data.medical) {
                    unitsData = response.data.data.medical;
                } else if (category === '2' && response.data.data.optical) {
                    unitsData = response.data.data.optical;
                }
            }
            
            console.log('Category:', category, 'Extracted units:', unitsData);
            setUnits(unitsData);
        } catch (error) {
            console.error('Failed to fetch units from backend:', error);
            console.error('Error details:', error.response?.data);
            setUnits([]);
        }
    };

    

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: name === "price" || name === "stock" ? Number(value) : value,
            // Reset unit when category changes
            ...(name === "category" && { unit: "" })
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.price || !formData.category || !formData.stock || !formData.description.trim() || !formData.unit) {
            toast.error("Please fill all required fields including unit!");
            console.log("Form data is invalid:", formData); // Debug form data
            return;
        }

        if (formData.price <= 0 || formData.stock <= 0) {
            toast.error("Price and quantity must be greater than 0!");
            return;
        }

        try {
            const payload = {
                name: formData.name,
                price: Number(formData.price),
                category: Number(formData.category),
                description: formData.description,
                stock: Number(formData.stock),
                unitType: formData.unit
            };
            
            const response = await axios.post(`/api/items`, payload);
            console.log('Success response:', response.data);
            toast.success("Item added successfully!");

            // Reset form
            setFormData({
                name: "",
                price: 0,
                category: "",
                description: "",
                stock: 0,
                unit: ""
            });
            if (typeof onItemAdded === "function") onItemAdded();
        } catch (err) {
            console.error("Item creation error:", err.response?.data || err.message);
            if (err.response?.status === 500) {
                toast.error("Backend server error. Please contact the administrator or try again later.");
            } else {
                toast.error(err.response?.data?.message || "Failed to add item");
            }
        }
    };

    const handleBack = () => {
        window.history.back();
    };
    return (
        <div className="w-full h-screen bg-white shadow-lg rounded-none p-8" style={{overflow: 'auto'}}>
            <div className="flex items-center gap-3 mb-4">
                <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                >
                    <span style={{fontSize: '18px'}}>&larr;</span> Back
                </button>
                <h2 className="text-2xl font-bold text-gray-800">➕ Add New Item</h2>
            </div>
            <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-600 mb-1">Item Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter item name"
                            className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none w-full"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600 mb-1">Price (₹)</label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="Enter price"
                            className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none w-full"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600 mb-1">Category *</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none w-full"
                        >
                            <option value="">Select category</option>
                            <option value="1">Surya Medical</option>
                            <option value="2">Surya Optical</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600 mb-1">Stock</label>
                        <input
                            type="number"
                            name="stock"
                            value={formData.stock}
                            onChange={handleChange}
                            placeholder="Enter stock"
                            min="0"
                            className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none w-full"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600 mb-1">Unit</label>
                        <select
                            name="unit"
                            value={formData.unit}
                            onChange={handleChange}
                            disabled={!formData.category}
                            className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none w-full disabled:bg-gray-100"
                        >
                            <option value="">{!formData.category ? "Select category first" : "Select unit"}</option>
                            {Array.isArray(units) && units.map((unit, index) => (
                                <option key={index} value={unit}>{unit}</option>
                            ))}
                        </select>
                    </div>
                    
                </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600 mb-1">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Enter description"
                            rows="3"
                            className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none w-full"
                        ></textarea>
                    </div>
                
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md"
                    >
                        Add Item
                    </button>
                </div>
            </form>
        </div>
    );
}
