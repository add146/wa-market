import { useState, useEffect } from 'react'
import AdminHeader from '../components/organisms/AdminHeader'
import { Icon, Modal } from '../components/atoms'
import api from '../api/client'
import { formatDateTimeWIB } from '../utils/dateWIB'

/**
 * AddressModal - Shows unique addresses used by a specific customer
 */
function AddressModal({ isOpen, onClose, customer }) {
    const [addresses, setAddresses] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!isOpen || !customer) return
        
        const fetchAddresses = async () => {
            setIsLoading(true)
            try {
                const response = await api.get(`/customers/${customer.id}/addresses`)
                setAddresses(response.data?.addresses || [])
            } catch (err) {
                console.error('Failed to fetch addresses:', err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchAddresses()
    }, [isOpen, customer])

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`Daftar Alamat: ${customer?.name}`}
            size="lg"
        >
            {isLoading ? (
                <div className="py-12 text-center text-slate-500">Memuat data alamat...</div>
            ) : addresses.length === 0 ? (
                <div className="py-12 text-center text-slate-500 italic">Belum ada riwayat alamat pengiriman.</div>
            ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {addresses.map((addr, idx) => (
                        <div key={idx} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{addr.address}</p>
                                    <p className="text-xs text-slate-500 font-medium">
                                        {addr.district}, {addr.city}, {addr.province}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-tight">Terakhir digunakan: {formatDateTimeWIB(addr.lastUsed)}</p>
                                </div>
                                {addr.latitude && addr.longitude && (
                                    <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${addr.latitude},${addr.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                    >
                                        <Icon name="map" size={16} />
                                        Gmaps
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    )
}

/**
 * HistoryModal - Shows order history for a specific customer
 */
function HistoryModal({ isOpen, onClose, customer }) {
    const [orders, setOrders] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [expandedOrder, setExpandedOrder] = useState(null)
    const [orderItems, setOrderItems] = useState({})

    useEffect(() => {
        if (!isOpen || !customer) return
        
        const fetchOrders = async () => {
            setIsLoading(true)
            try {
                const response = await api.get(`/orders?userId=${customer.id}`)
                setOrders(response.data?.orders || [])
            } catch (err) {
                console.error('Failed to fetch orders:', err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchOrders()
    }, [isOpen, customer])

    const fetchItems = async (orderId) => {
        if (orderItems[orderId]) {
            setExpandedOrder(expandedOrder === orderId ? null : orderId)
            return
        }

        try {
            const response = await api.get(`/orders/${orderId}/items`)
            setOrderItems(prev => ({ ...prev, [orderId]: response.data?.items || [] }))
            setExpandedOrder(orderId)
        } catch (err) {
            console.error('Failed to fetch items:', err)
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700'
            case 'on_delivery': return 'bg-blue-100 text-blue-700'
            case 'cancelled': return 'bg-red-100 text-red-700'
            default: return 'bg-yellow-100 text-yellow-700'
        }
    }

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`Riwayat Pesanan: ${customer?.name}`}
            size="lg"
        >
            {isLoading ? (
                <div className="py-12 text-center text-slate-500">Memuat data...</div>
            ) : orders.length === 0 ? (
                <div className="py-12 text-center text-slate-500 italic">Belum ada riwayat pesanan.</div>
            ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {orders.map((order) => (
                        <div key={order.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                            <div 
                                onClick={() => fetchItems(order.id)}
                                className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">{order.orderNumber}</div>
                                    <div className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                </div>
                                <div className="flex items-center gap-3 text-right">
                                    <div>
                                        <div className="text-sm font-bold text-primary">Rp {order.total.toLocaleString('id-ID')}</div>
                                        <div className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </div>
                                    </div>
                                    <Icon 
                                        name={expandedOrder === order.id ? 'expand_less' : 'expand_more'} 
                                        size={20} 
                                        className="text-slate-400" 
                                    />
                                </div>
                            </div>
                            
                            {expandedOrder === order.id && (
                                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                                    <h5 className="text-xs font-bold text-slate-400 uppercase mb-3">Item Pesanan</h5>
                                    {orderItems[order.id] ? (
                                        <div className="space-y-3">
                                            {orderItems[order.id].map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                    <div className="flex-1">
                                                        <div className="font-medium text-slate-800 dark:text-slate-200">{item.productName}</div>
                                                        <div className="text-xs text-slate-500">{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</div>
                                                    </div>
                                                    <div className="font-bold text-slate-900 dark:text-white">
                                                        Rp {(item.quantity * item.price).toLocaleString('id-ID')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-xs text-slate-500 py-2 italic font-medium tracking-wide">Memuat item...</div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    )
}

/**
 * AdminCustomersPage - Enhanced customer list with order history popup
 */
function AdminCustomersPage() {
    const [customers, setCustomers] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await api.get('/customers')
                setCustomers(response.data?.customers || [])
            } catch (err) {
                console.error('Failed to fetch customers:', err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchCustomers()
    }, [])

    const openHistory = (customer) => {
        setSelectedCustomer(customer)
        setIsHistoryModalOpen(true)
    }

    const openAddresses = (customer) => {
        setSelectedCustomer(customer)
        setIsAddressModalOpen(true)
    }

    const formatPhone = (phone) => {
        if (!phone) return '-'
        let clean = phone.replace(/\D/g, '')
        if (clean.startsWith('0')) clean = '62' + clean.substring(1)
        if (clean.startsWith('62') && clean.length > 10) {
            return `+${clean.slice(0, 2)} ${clean.slice(2, 5)}-${clean.slice(5, 9)}-${clean.slice(9)}`
        }
        return `+${clean}`
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
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
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 ring-offset-2"
                        />
                    </div>
                </div>

                {/* Customer List */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    {isLoading ? (
                        <div className="p-12 text-center text-slate-500 font-medium tracking-wide">Memuat data customer...</div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <Icon name="group" size={48} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium">{searchQuery ? 'Tidak ditemukan' : 'Belum ada customer'}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-500 uppercase text-left tracking-wider cursor-default select-none">
                                    <tr>
                                        <th className="px-6 py-4">Customer</th>
                                        <th className="px-6 py-4">WhatsApp</th>
                                        <th className="px-6 py-4 text-center">History Order</th>
                                        <th className="px-6 py-4 font-black">Total Belanja</th>
                                        <th className="px-6 py-4">Terakhir Order</th>
                                        <th className="px-6 py-4">Password Akun</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {filteredCustomers.map((customer) => (
                                        <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all duration-200">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div 
                                                    onClick={() => openAddresses(customer)}
                                                    className="flex items-center gap-3 cursor-pointer group"
                                                >
                                                    <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm border-2 border-primary/20 group-hover:scale-110 transition-transform">
                                                        {customer.name?.charAt(0).toUpperCase() || 'C'}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors underline decoration-dotted decoration-slate-300 underline-offset-4">{customer.name}</div>
                                                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{customer.role === 'guest' ? 'Non-Member' : 'Member'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <a
                                                    href={`https://wa.me/${customer.phone?.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold ring-offset-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-green-500/30 transition-all px-1.5 py-0.5"
                                                >
                                                    <Icon name="chat" size={16} />
                                                    {formatPhone(customer.phone)}
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <button 
                                                    onClick={() => openHistory(customer)}
                                                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-black uppercase tracking-tight hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all active:scale-95 shadow-sm"
                                                >
                                                    {customer.totalOrders || 0} Orders
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-primary font-black tracking-tight">
                                                Rp {(customer.totalSpent || 0).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                                                {formatDate(customer.lastOrderDate)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {customer.initialPassword ? (
                                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-md text-xs font-mono font-black border border-yellow-200 dark:border-yellow-700/50">
                                                        {customer.initialPassword}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs italic opacity-50">---</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div className="mt-6 text-sm text-slate-400 text-center font-bold tracking-tighter uppercase opacity-70">
                    Menampilkan {filteredCustomers.length} dari {customers.length} customer terdaftar
                </div>
            </div>

            <HistoryModal 
                isOpen={isHistoryModalOpen} 
                onClose={() => setIsHistoryModalOpen(false)} 
                customer={selectedCustomer} 
            />

            <AddressModal
                isOpen={isAddressModalOpen}
                onClose={() => setIsAddressModalOpen(false)}
                customer={selectedCustomer}
            />
        </>
    )
}

export default AdminCustomersPage
