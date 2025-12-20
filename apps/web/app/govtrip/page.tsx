import dynamic from 'next/dynamic';

const GovTripApp = dynamic(() => import('@/components/GovTripApp'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-amber-500 mb-4"></div>
                <p className="text-slate-600 font-bold text-lg">กำลังโหลดระบบ GovTrip...</p>
            </div>
        </div>
    ),
});

export const metadata = {
    title: 'GovTrip - ระบบจัดการการเดินทางราชการ',
    description: 'Government Trip Management System with AI Analytics',
};

export default function GovTripPage() {
    return <GovTripApp />;
}
