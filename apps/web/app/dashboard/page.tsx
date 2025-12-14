"use client";

import DonationForm from '../../components/DonationForm';

export default function Dashboard() {
    // In real app, get token from AuthContext
    const mockToken = "eyJ...";

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-8 border-b pb-4">BorderRelief Operation Center</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <DonationForm token={mockToken} />
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-bold mb-4">Verification & Traceability</h2>
                        <div className="p-4 border border-dashed border-gray-300 rounded text-center text-gray-500">
                            Scan QR Code functionality coming soon.
                            <br />
                            Ensures batch traceability.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
