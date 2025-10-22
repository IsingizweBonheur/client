// components/UserDashboard.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { API_URL } from "../config";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faHistory, faBox, faEdit, faSignOutAlt,
  faSpinner, faCheckCircle, faTimesCircle,
  faShoppingCart, faDollarSign, faCalendarAlt,
  faPlus, faMinus, faTrash, faCreditCard, faPhone,
  faEnvelope, faMapMarkerAlt, faHamburger, faSearch,
  faBars, faTimes, faSave, faUndo, faTruck, faExclamationTriangle,
  faEye, faMapPin, faClock, faMobileAlt, faQrcode,
  faMoneyBill, faUserCircle, faStar, faCrown, faBell,
  faUserShield, faIdCard, faLocationDot, faShieldAlt, faChartBar,
  faReceipt, faCheck
} from '@fortawesome/free-solid-svg-icons';

const UserDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('menu');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.username || "",
    phone: user?.phone || "",
    address: user?.address || ""
  });
  const [error, setError] = useState('');
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState('momo');

  const makeApiRequest = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'user-id': user?.id?.toString() || '',
          'user-email': user?.email || '',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  };

  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await makeApiRequest('/orders/user');
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await makeApiRequest('/products');
      setProducts(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { 
        ...product, 
        quantity: 1, 
        id: product.id,
        total_amount: product.total_amount
      }];
    });
    setShowCart(true);
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, qty) => { 
    if (qty < 1) {
      removeFromCart(productId);
      return;
    } 
    setCart(prev => prev.map(item => 
      item.id === productId 
        ? { ...item, quantity: qty } 
        : item
    ));
  }, [removeFromCart]);

  const calculateTotal = useCallback(() => {
    return cart.reduce((total, item) => total + (item.total_amount * item.quantity), 0);
  }, [cart]);

  const calculateItemCount = useCallback(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      alert("Please fill in all required fields");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty");
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const orderData = {
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_address: customerInfo.address,
        customer_email: user.email,
        cart: cart,
        total: calculateTotal(),
      };

      const data = await makeApiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });

      if (selectedPayment === 'momo') {
        alert(`Order placed successfully!\n\nPayment Instructions:\nSend ${formatPrice(calculateTotal())} to MoMo: 0788295765\nAccount: TUYISENGE Gashugi Arnaud\nUse your name as reference`);
      } else {
        alert('Order placed successfully! Pay with cash when your order arrives.');
      }
      
      setOrderSuccess(true);
      setCart([]);
      setShowCheckout(false);
      
      setTimeout(() => {
        fetchUserOrders();
      }, 1000);
      
      setTimeout(() => setOrderSuccess(false), 5000);

    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.message);
      alert(`Failed to place order: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat("rw-RW", { 
      style: "currency", 
      currency: "RWF" 
    }).format(price);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'on the way': return 'bg-amber-100 text-amber-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTrackOrder = useCallback((order) => {
    setTrackingOrder(order);
  }, []);

  const closeTracking = useCallback(() => {
    setTrackingOrder(null);
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchUserOrders();
    } else if (activeTab === 'menu') {
      fetchProducts();
    }
  }, [activeTab]);

  const cartSummary = useMemo(() => ({
    itemCount: calculateItemCount(),
    total: calculateTotal()
  }), [calculateItemCount, calculateTotal]);

  // Product Card Component
  const ProductCard = ({ product, onAddToCart }) => {
    const handleAddToCart = () => {
      onAddToCart(product);
    };

    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 hover:border-orange-300 group h-full flex flex-col">
        <div className="relative overflow-hidden flex-shrink-0">
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=200&fit=crop'}
            alt={product.product_name}
            className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=200&fit=crop';
            }}
          />
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="mb-3 flex-1">
            <h3 className="font-bold text-gray-800 mb-2 text-lg line-clamp-1">{product.product_name}</h3>
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 min-h-[3rem]">{product.description}</p>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <p className="text-green-600 font-bold text-xl">
              {formatPrice(product.total_amount)}
            </p>
            <button 
              onClick={handleAddToCart}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 text-sm font-semibold shadow-lg hover:shadow-xl"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Cart Item Component
  const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
    const handleDecrease = () => {
      onUpdateQuantity(item.id, item.quantity - 1);
    };

    const handleIncrease = () => {
      onUpdateQuantity(item.id, item.quantity + 1);
    };

    const handleRemove = () => {
      onRemove(item.id);
    };

    return (
      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <img
          src={item.image_url || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=200&fit=crop'}
          alt={item.product_name}
          className="w-16 h-16 object-cover rounded-lg bg-gray-200 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 truncate">{item.product_name}</h3>
          <p className="text-green-600 font-bold mt-1">{formatPrice(item.total_amount)}</p>
          <div className="flex items-center space-x-3 mt-2">
            <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
              <button onClick={handleDecrease} className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-200">
                <FontAwesomeIcon icon={faMinus} className="text-gray-600 text-xs" />
              </button>
              <span className="w-8 text-center font-bold text-gray-800">{item.quantity}</span>
              <button onClick={handleIncrease} className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-200">
                <FontAwesomeIcon icon={faPlus} className="text-gray-600 text-xs" />
              </button>
            </div>
            <button onClick={handleRemove} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50">
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-gray-800">
            {formatPrice(item.total_amount * item.quantity)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-500 p-3 rounded-xl shadow-lg">
                <FontAwesomeIcon icon={faHamburger} className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">FastFood</h1>
                <p className="text-gray-600 text-sm">User Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCart(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-all duration-300 relative flex items-center space-x-2 font-semibold shadow-lg"
              >
                <FontAwesomeIcon icon={faShoppingCart} />
                <span>Cart ({cartSummary.itemCount})</span>
                {cartSummary.itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {cartSummary.itemCount}
                  </span>
                )}
              </button>
              
              <div className="relative">
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 font-semibold shadow-lg">
                  <FontAwesomeIcon icon={faUserCircle} />
                  <span>{user.username}</span>
                </button>
              </div>

              <button
                onClick={onLogout}
                className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <FontAwesomeIcon icon={faSignOutAlt} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-lg border-b border-gray-200 sticky top-16 z-30">
        <div className="container mx-auto px-6">
          <nav className="flex space-x-1 py-4">
            {[
              { id: 'menu', name: 'Our Menu', icon: faShoppingCart },
              { id: 'orders', name: 'My Orders', icon: faHistory },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 px-6 border-b-2 font-bold whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600 bg-orange-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FontAwesomeIcon icon={tab.icon} />
                <span>{tab.name}</span>
                {tab.id === 'orders' && orders.length > 0 && (
                  <span className="bg-orange-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center">
                    {orders.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-3 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="ml-4 text-red-500 hover:text-red-700">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">Our Delicious Menu</h2>
              <p className="text-gray-600 text-xl max-w-2xl mx-auto">
                Discover our mouth-watering selection of freshly prepared meals
              </p>
            </div>

            {loading ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-lg">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-5xl text-orange-600 mb-4" />
                <p className="text-gray-600 text-xl">Loading menu...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addToCart}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-800 mb-2">My Orders</h2>
                <p className="text-gray-600 text-xl">Track your order history and status</p>
              </div>
              <button 
                onClick={fetchUserOrders}
                disabled={loading}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-all duration-300 disabled:opacity-50 flex items-center space-x-2"
              >
                <FontAwesomeIcon icon={faSpinner} className={loading ? 'animate-spin' : 'hidden'} />
                <span>Refresh Orders</span>
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-lg">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-5xl text-orange-600 mb-4" />
                <p className="text-gray-600 text-xl">Loading your orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-lg">
                <FontAwesomeIcon icon={faBox} className="text-6xl text-gray-300 mb-4" />
                <h4 className="text-2xl font-semibold text-gray-600 mb-3">No orders yet</h4>
                <p className="text-gray-500 text-lg mb-6">Start shopping to see your orders here!</p>
                <button 
                  onClick={() => setActiveTab('menu')}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg transition-all duration-300"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="bg-orange-500 text-white p-3 rounded-xl shadow-lg">
                          <FontAwesomeIcon icon={faShoppingCart} />
                        </div>
                        <div>
                          <p className="text-gray-600">{formatDate(order.created_at)}</p>
                          <p className="font-bold text-gray-800 text-xl">Total: {formatPrice(order.total)}</p>
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(order.status)}`}>
                        {order.status || 'Pending'}
                      </span>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-bold text-gray-700 mb-3 flex items-center">
                            <FontAwesomeIcon icon={faBox} className="text-orange-500 mr-2" />
                            Order Items:
                          </h5>
                          <div className="space-y-2">
                            {order.cart?.map((item, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-800">{item.product_name}</p>
                                  <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
                                </div>
                                <span className="font-bold text-green-600">
                                  {formatPrice((item.total_amount || item.price) * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-700 mb-3 flex items-center">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500 mr-2" />
                            Delivery Information:
                          </h5>
                          <div className="space-y-2 text-sm bg-orange-50 p-4 rounded-lg border border-orange-200">
                            <p><strong>Name:</strong> {order.customer_name}</p>
                            <p><strong>Phone:</strong> {order.customer_phone}</p>
                            <p><strong>Address:</strong> {order.customer_address}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center">
                        <span className="font-bold text-gray-800 text-xl">
                          Total: {formatPrice(order.total)}
                        </span>
                        <button 
                          onClick={() => handleTrackOrder(order)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2"
                        >
                          <FontAwesomeIcon icon={faEye} />
                          <span>Track Order</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 flex flex-col">
            <div className="bg-orange-500 p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Your Cart</h2>
                <button onClick={() => setShowCart(false)} className="text-white hover:text-orange-200 p-2">
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              {cartSummary.itemCount > 0 && (
                <p className="text-orange-100 mt-2">
                  {cartSummary.itemCount} item{cartSummary.itemCount !== 1 ? 's' : ''} • Total: {formatPrice(cartSummary.total)}
                </p>
              )}
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto flex-1">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">🛒</div>
                  <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
                  <button onClick={() => setShowCart(false)} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-all duration-300">
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeFromCart}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex justify-between items-center text-xl mb-4">
                  <span className="font-bold text-gray-800">Total Amount:</span>
                  <span className="font-bold text-green-600 text-2xl">
                    {formatPrice(cartSummary.total)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setShowCart(false)} className="bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg transition-all duration-300 font-semibold">
                    Continue Shopping
                  </button>
                  <button onClick={() => { setShowCart(false); setShowCheckout(true); }} className="bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg transition-all duration-300 font-bold flex items-center justify-center space-x-2">
                    <FontAwesomeIcon icon={faCreditCard} />
                    <span>Checkout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 flex flex-col">
            <div className="border-b border-gray-200 p-6 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Complete Your Order</h2>
                <button onClick={() => setShowCheckout(false)} className="text-gray-500 hover:text-gray-700 p-2">
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleCheckout} className="space-y-6">
                {/* Customer Information */}
                <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <FontAwesomeIcon icon={faUser} className="text-orange-500 mr-3" />
                    Customer Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Address *</label>
                      <textarea
                        required
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white resize-none"
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                        placeholder="Enter your complete delivery address"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <FontAwesomeIcon icon={faCreditCard} className="text-orange-500 mr-3" />
                    Payment Method
                  </h3>
                  
                  <div className="space-y-4">
                    <div 
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                        selectedPayment === 'momo' ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-300'
                      }`}
                      onClick={() => setSelectedPayment('momo')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-orange-500 p-3 rounded-lg">
                            <FontAwesomeIcon icon={faMobileAlt} className="text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800">Mobile Money (MoMo)</h4>
                            <p className="text-gray-600">Pay with MTN Mobile Money</p>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedPayment === 'momo' ? 'bg-orange-500 border-orange-500' : 'border-gray-400'
                        }`}>
                          {selectedPayment === 'momo' && <FontAwesomeIcon icon={faCheck} className="text-white text-xs" />}
                        </div>
                      </div>
                    </div>

                    <div 
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                        selectedPayment === 'cash' ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-300'
                      }`}
                      onClick={() => setSelectedPayment('cash')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-orange-500 p-3 rounded-lg">
                            <FontAwesomeIcon icon={faMoneyBill} className="text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800">Cash on Delivery</h4>
                            <p className="text-gray-600">Pay when you receive your order</p>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedPayment === 'cash' ? 'bg-orange-500 border-orange-500' : 'border-gray-400'
                        }`}>
                          {selectedPayment === 'cash' && <FontAwesomeIcon icon={faCheck} className="text-white text-xs" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <FontAwesomeIcon icon={faShoppingCart} className="text-green-500 mr-3" />
                    Order Summary
                  </h3>
                  
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {cart.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <img
                            src={item.image_url || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=200&fit=crop'}
                            alt={item.product_name}
                            className="w-12 h-12 object-cover rounded-lg bg-gray-200"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{item.product_name}</p>
                            <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-bold text-green-600 whitespace-nowrap ml-4">
                          {formatPrice(item.total_amount * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-green-200 mt-4 pt-4">
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-bold text-gray-800">Total Amount:</span>
                      <span className="font-bold text-green-600 text-xl">
                        {formatPrice(cartSummary.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <button 
                type="submit"
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 font-bold disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCreditCard} />
                    <span>
                      {selectedPayment === 'momo' ? 'Place Order & Pay with MoMo' : 'Place Order (Cash on Delivery)'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
