"use client";

import { useState } from 'react';
import { apiRequest } from '../lib/api';

export default function DonationForm({ token }: { token: string }) {
    const [formData, setFormData] = useState({
        description: '',
        quantity: 0,
        unit: 'units',
        category: 'OTHER',
    });
    const [status, setStatus] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await apiRequest('/donations', 'POST', formData, token);
            if (res.offline) {
                setStatus('Saved offline. Will sync when online.');
            } else {
                setStatus('Donation submitted successfully!');
            }
            setFormData({ description: '', quantity: 0, unit: 'units', category: 'OTHER' });
        } catch (err) {
            setStatus('Failed to submit donation.');
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">New Donation Entry</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                    />
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Quantity</label>
                        <input
                            type="number"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Unit</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            value={formData.unit}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        >
                            <option value="units">Units</option>
                            <option value="kg">Kg</option>
                            <option value="boxes">Boxes</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                        <option value="FOOD">Food</option>
                        <option value="WATER">Water</option>
                        <option value="MEDICINE">Medicine</option>
                        <option value="CLOTHING">Clothing</option>
                        <option value="SHELTER">Shelter</option>
                        <option value="OTHER">Other</option>
                    </select>
                </div>
                <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Submit Donation
                </button>
                {status && <p className="text-center text-sm font-medium text-green-600 mt-2">{status}</p>}
            </form>
        </div>
    );
}
