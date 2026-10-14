import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';
import DisasterMap from '@/Components/DisasterMap';

function StatCard({ label, value, color = 'blue' }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        green: 'bg-green-50 text-green-700 border-green-200',
        yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
        red: 'bg-red-50 text-red-700 border-red-200',
    };
    return (
        <div className={`border rounded-xl p-5 ${colors[color]}`}>
            <div className="text-3xl font-bold">{value ?? 0}</div>
            <div className="text-sm font-medium mt-1 opacity-80">{label}</div>
        </div>
    );
}

function ReportRow({ report }) {
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
            <div>
                <Link href={`/disaster-reports/${report.id}`} className="font-medium text-gray-800 hover:text-blue-600 text-sm">
                    {report.type} — {report.affected_area}
                </Link>
                <p className="text-xs text-gray-400">{report.reporter?.name} · {report.barangay?.name}</p>
            </div>
            <StatusBadge status={report.status} />
        </div>
    );
}

export default function Dashboard({ stats = {}, recent_reports = [], my_reports = [], my_requests = [], my_donations = [], active_reports = [], recent_distributions = [], recent_donations = [], map_reports = [], map_barangay_ids = [] }) {
    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-gray-800">Dashboard</h1>}>
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(stats).map(([key, val]) => (
                        <StatCard
                            key={key}
                            label={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            value={val}
                            color={key.includes('pending') || key.includes('waiting') ? 'yellow' : key.includes('total') ? 'blue' : 'green'}
                        />
                    ))}
                </div>

                {/* Live situation map */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-gray-800">Live Disaster Map</h2>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600" /> Critical/High</span>
                            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600" /> Confirmed</span>
                            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-500" /> Reported</span>
                        </div>
                    </div>
                    <DisasterMap reports={map_reports} barangayIds={map_barangay_ids} />
                    {map_reports.length === 0 && (
                        <p className="text-xs text-gray-400 mt-2">No pinned active disasters yet. New reports with a location will appear here live.</p>
                    )}
                </div>

                {/* Recent Reports */}
                {(recent_reports.length > 0 || my_reports.length > 0 || active_reports.length > 0) && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-gray-800">
                                {recent_reports.length > 0 ? 'Recent Disaster Reports' : my_reports.length > 0 ? 'My Reports' : 'Active Disasters'}
                            </h2>
                            <Link href="/disaster-reports" className="text-sm text-blue-600 hover:underline">View all →</Link>
                        </div>
                        <div>
                            {[...recent_reports, ...my_reports, ...active_reports].map(r => (
                                <ReportRow key={r.id} report={r} />
                            ))}
                        </div>
                    </div>
                )}

                {/* My Donations (for donors) */}
                {my_donations.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-gray-800">My Donations</h2>
                            <Link href="/donations" className="text-sm text-blue-600 hover:underline">View all →</Link>
                        </div>
                        <div className="space-y-2">
                            {my_donations.map(d => (
                                <div key={d.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                    <div className="text-sm">
                                        <span className="font-medium">{d.type === 'cash' ? `₱${(d.amount_cents / 100).toFixed(2)}` : d.items}</span>
                                        <span className="text-gray-400 ml-2">via {d.delivery_method}</span>
                                    </div>
                                    <StatusBadge status={d.payment_status} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Assistance Requests (for residents) */}
                {my_requests.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-gray-800">My Assistance Requests</h2>
                            <Link href="/assistance-requests" className="text-sm text-blue-600 hover:underline">View all →</Link>
                        </div>
                        <div className="space-y-2">
                            {my_requests.map(r => (
                                <div key={r.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                    <p className="text-sm text-gray-700 truncate max-w-xs">{r.goods_needed}</p>
                                    <StatusBadge status={r.status} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Distributions */}
                {recent_distributions.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-gray-800">Recent Distributions</h2>
                            <Link href="/distributions" className="text-sm text-blue-600 hover:underline">View all →</Link>
                        </div>
                        <div className="space-y-2">
                            {recent_distributions.map(d => (
                                <div key={d.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                    <div className="text-sm">
                                        <span className="font-medium">{d.household?.head_name}</span>
                                        <span className="text-gray-400 ml-2">{d.items}</span>
                                    </div>
                                    <StatusBadge status={d.status} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
