import { useState, useEffect } from 'react'
import AdminHeader from '../components/organisms/AdminHeader'
import { Icon } from '../components/atoms'
import api from '../api/client'

/**
 * AdminCustomersPage - Simple customer list with name and WhatsApp
 */
function AdminCustomersPage() {
    const [customers, setCustomers] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await api.get('/users')
                const allUsers = response.data?.users || []
                // Filter only customers
                const customerList = allUsers.filter(u => u.role === 'customer')
                setCustomers(customerList)
            } catch (err) {
                console.error('Failed to fetch customers:', err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchCustomers()
    }, [])

    const formatPhone = (phone) => {
        if (!phone) return '-'
        let clean = phone.replace(/\D/g, '')
        // Convert leading 0 to 62
        if (clean.startsWith('0')) {
            clean = '62' + clean.substring(1)
        }
        // Format: +62 812-3456-7890
        if (clean.startsWith('62') && clean.length > 10) {
            return `+${clean.slice(0, 2)} ${clean.slice(2, 5)}-${clean.slice(5, 9)}-${clean.slice(9)}`
        }
        return `+${clean}`
    }

    const filteredCustomers = customers.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery)
    )

    return (
        <>
            <AdminHeader
                title="Daftar Customer"
                subtitle={`${customers.length} customer terdaftar`}
            />

            <div className="flex-1 overflow-y-auto p-6">
                {/* Search */}
                <div className="mb-4">
                    <div className="relative max-w-md">
                        <Icon name="search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama atau no. WA..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* Customer List */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500">Loading...</div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <Icon name="group" size={48} className="mx-auto mb-2 opacity-50" />
                            <p>{searchQuery ? 'Tidak ditemukan' : 'Belum ada customer'}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-500 uppercase">
                                <div className="col-span-1">#</div>
                                <div className="col-span-5">Nama</div>
                                <div className="col-span-6">No. WhatsApp</div>
                            </div>

                            {/* Rows */}
                            {filteredCustomers.map((customer, index) => (
                                <div key={customer.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 items-center">
                                    <div className="col-span-1 text-sm text-slate-500">
                                        {index + 1}
                                    </div>
                                    <div className="col-span-5 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                                            {customer.name?.charAt(0).toUpperCase() || 'C'}
                                        </div>
                                        <span className="font-medium text-slate-900 dark:text-white">
                                            {customer.name}
                                        </span>
                                    </div>
                                    <div className="col-span-6">
                                        <a
                                            href={`https://wa.me/${customer.phone?.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700"
                                        >
                                            <Icon name="chat" size={16} />
                                            {formatPhone(customer.phone)}
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div className="mt-4 text-sm text-slate-500 text-center">
                    Menampilkan {filteredCustomers.length} dari {customers.length} customer
                </div>
            </div>
        </>
    )
}

export default AdminCustomersPage
