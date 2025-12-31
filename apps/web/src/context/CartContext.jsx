import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

// Initial cart state from localStorage
const getInitialCart = () => {
    try {
        const saved = localStorage.getItem('tokoindo_cart')
        return saved ? JSON.parse(saved) : []
    } catch {
        return []
    }
}

export function CartProvider({ children }) {
    const [items, setItems] = useState(getInitialCart)
    const [notification, setNotification] = useState(null)

    // Save to localStorage whenever cart changes
    useEffect(() => {
        localStorage.setItem('tokoindo_cart', JSON.stringify(items))
    }, [items])

    // Add item to cart
    const addToCart = (product, quantity = 1, variantInfo = '') => {
        setItems(prevItems => {
            const existingIndex = prevItems.findIndex(
                item => item.productId === product.id && item.variantInfo === variantInfo
            )

            if (existingIndex >= 0) {
                // Update quantity if item exists
                const newItems = [...prevItems]
                newItems[existingIndex].quantity += quantity
                return newItems
            } else {
                // Add new item
                return [...prevItems, {
                    id: `${product.id}-${Date.now()}`,
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    originalPrice: product.originalPrice,
                    image: product.image,
                    variantInfo,
                    quantity,
                }]
            }
        })

        // Show notification
        showNotification(`${product.name} ditambahkan ke keranjang!`)
    }

    // Update item quantity
    const updateQuantity = (itemId, quantity) => {
        if (quantity <= 0) {
            removeItem(itemId)
            return
        }
        setItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId ? { ...item, quantity } : item
            )
        )
    }

    // Remove item from cart
    const removeItem = (itemId) => {
        setItems(prevItems => prevItems.filter(item => item.id !== itemId))
        showNotification('Item dihapus dari keranjang')
    }

    // Clear cart
    const clearCart = () => {
        setItems([])
        localStorage.removeItem('tokoindo_cart')
    }

    // Show notification
    const showNotification = (message) => {
        setNotification(message)
        setTimeout(() => setNotification(null), 3000)
    }

    // Calculate totals
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const totalDiscount = items.reduce((sum, item) => {
        const discount = item.originalPrice ? (item.originalPrice - item.price) * item.quantity : 0
        return sum + discount
    }, 0)

    const value = {
        items,
        itemCount,
        subtotal,
        totalDiscount,
        notification,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        showNotification,
    }

    return (
        <CartContext.Provider value={value}>
            {children}

            {/* Toast Notification */}
            {notification && (
                <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
                    <div className="bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
                        <span className="text-xl">✓</span>
                        <span className="font-medium">{notification}</span>
                    </div>
                </div>
            )}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}

export default CartContext
