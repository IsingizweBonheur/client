import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { API_URL } from "../config";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faHistory, faBox, faEdit, faSignOutAlt,
  faSpinner, faCheckCircle, faTimesCircle, faCheck,
  faShoppingCart, faDollarSign, faCalendarAlt,
  faPlus, faMinus, faTrash, faCreditCard, faPhone,
  faEnvelope, faMapMarkerAlt, faHamburger, faSearch,
  faBars, faTimes, faSave, faUndo, faTruck, faExclamationTriangle,
  faEye, faMapPin, faClock, faMobileAlt, faQrcode,
  faMoneyBill, faUserCircle, faStar, faCrown, faBell,
  faUserShield, faIdCard, faLocationDot, faShieldAlt, faChartBar,
  faReceipt
} from '@fortawesome/free-solid-svg-icons';

// User context simulation
const useUser = () => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return { user, login, logout };
};

// Reuse ProductImage component from HomePage
const ProductImage = React.memo(({ product, className = "h-40 sm:h-48 w-full object-cover" }) => {
  const [imgSrc, setImgSrc] = useState("");
  const [hasError, setHasError] = useState(false);

  const FALLBACK_IMAGES = {
    burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop",
    pizza: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=200&fit=crop",
    fries: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&h=200&fit=crop",
    chicken: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=300&h=200&fit=crop",
    drink: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&h=200&fit=crop",
    default: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=200&fit=crop"
  };

  const BACKEND_URL = API_URL;

  const getImageUrl = useCallback((imageUrl) => {
    if (!imageUrl) return null;
    
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const separator = imageUrl.includes('?') ? '&' : '?';
      return `${imageUrl}${separator}t=${Date.now()}`;
    }
    
    if (imageUrl.startsWith('/uploads/')) {
      return `${BACKEND_URL}${imageUrl}?t=${Date.now()}`;
    }
    
    return `${BACKEND_URL}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}?t=${Date.now()}`;
  }, [BACKEND_URL]);

  const getFallbackImage = useCallback((productName) => {
    const name = productName?.toLowerCase() || '';
    if (name.includes('burger')) return FALLBACK_IMAGES.burger;
    if (name.includes('pizza')) return FALLBACK_IMAGES.pizza;
    if (name.includes('fries') || name.includes('fry')) return FALLBACK_IMAGES.fries;
    if (name.includes('chicken')) return FALLBACK_IMAGES.chicken;
    if (name.includes('drink') || name.includes('soda') || name.includes('juice')) return FALLBACK_IMAGES.drink;
    
    return FALLBACK_IMAGES.default;
  }, []);

  useEffect(() => {
    if (!product.image_url) {
      setImgSrc(getFallbackImage(product.product_name));
      return;
    }
    
    if (product.image_url) {
      setImgSrc(getImageUrl(product.image_url));
    }
  }, [product.image_url, product.product_name, getImageUrl, getFallbackImage]);

  const handleError = useCallback(() => {
    setHasError(true);
    setImgSrc(getFallbackImage(product.product_name));
  }, [product.product_name, getFallbackImage]);

  return (
    <img
      src={imgSrc}
      alt={product.product_name}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
});

// Enhanced Product Card with better responsive design
const ProductCard = React.memo(({ product, onAddToCart }) => {
  const handleAddToCart = useCallback(() => {
    onAddToCart(product);
  }, [product, onAddToCart]);

  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat("rw-RW", { 
      style: "currency", 
      currency: "RWF" 
    }).format(price || 0);
  }, []);

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-orange-300 group">
      <div className="relative overflow-hidden">
        <ProductImage
          product={product}
          className="h-48 sm:h-56 w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.is_popular && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            <span>🔥 Popular</span>
          </div>
        )}
      </div>
      <div className="p-4 sm:p-6">
        <div className="mb-4">
          <h3 className="font-bold text-gray-800 mb-2 text-lg sm:text-xl line-clamp-1">{product.product_name}</h3>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed line-clamp-2 min-h-[3rem]">{product.description}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-green-600 font-bold text-xl sm:text-2xl">
            {formatPrice(product.total_amount)}
          </p>
          <button 
            onClick={handleAddToCart}
            disabled={!product.is_available}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 flex items-center space-x-2 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 ${
              product.is_available 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white' 
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
          >
            <FontAwesomeIcon icon={faPlus} className="text-sm" />
            <span>{product.is_available ? 'Add to Cart' : 'Out of Stock'}</span>
          </button>
        </div>
      </div>
    </div>
  );
});

// Enhanced Cart Item with better responsive design
const CartItem = React.memo(({ item, onUpdateQuantity, onRemove }) => {
  const handleDecrease = useCallback(() => {
    onUpdateQuantity(item.id, item.quantity - 1);
  }, [item.id, item.quantity, onUpdateQuantity]);

  const handleIncrease = useCallback(() => {
    onUpdateQuantity(item.id, item.quantity + 1);
  }, [item.id, item.quantity, onUpdateQuantity]);

  const handleRemove = useCallback(() => {
    onRemove(item.id);
  }, [item.id, onRemove]);

  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat("rw-RW", { 
      style: "currency", 
      currency: "RWF" 
    }).format(price || 0);
  }, []);

  return (
    <div className="flex items-center space-x-4 bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
      <ProductImage
        product={item}
        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg bg-gray-200 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-800 text-base sm:text-lg truncate">{item.product_name}</h3>
        <p className="text-green-600 font-bold text-sm sm:text-base mt-1">{formatPrice(item.total_amount)}</p>
        <div className="flex items-center space-x-3 mt-2">
          <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
            <button 
              onClick={handleDecrease}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
            >
              <FontAwesomeIcon icon={faMinus} className="text-gray-600 text-xs" />
            </button>
            <span className="w-8 text-center font-bold text-gray-800 text-base sm:text-lg">{item.quantity}</span>
            <button 
              onClick={handleIncrease}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
            >
              <FontAwesomeIcon icon={faPlus} className="text-gray-600 text-xs" />
            </button>
          </div>
          <button 
            onClick={handleRemove}
            className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
          >
            <FontAwesomeIcon icon={faTrash} className="text-base" />
          </button>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-gray-800 text-base sm:text-lg">
          {formatPrice((item.total_amount || 0) * item.quantity)}
        </p>
      </div>
    </div>
  );
});

// Order Tracking Component - Enhanced responsive design
const OrderTracking = React.memo(({ order, onClose }) => {
  const getStatusSteps = (status) => {
    const steps = [
      { id: 1, name: 'Order Placed', status: 'completed', description: 'Your order has been received' },
      { id: 2, name: 'Preparing', status: status === 'preparing' || status === 'on the way' || status === 'completed' ? 'completed' : 'pending', description: 'Kitchen is preparing your food' },
      { id: 3, name: 'On the Way', status: status === 'on the way' || status === 'completed' ? 'completed' : 'pending', description: 'Driver is delivering your order' },
      { id: 4, name: 'Delivered', status: status === 'completed' ? 'completed' : 'pending', description: 'Order has been delivered' }
    ];
    return steps;
  };

  const steps = getStatusSteps(order.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 animate-slide-up">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 sm:p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Order Tracking</h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-orange-200 p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
            >
              <FontAwesomeIcon icon={faTimes} className="text-lg" />
            </button>
          </div>
        </div>
        
        <div className="p-4 sm:p-6 max-h-96 overflow-y-auto">
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center text-lg">
              <FontAwesomeIcon icon={faReceipt} className="text-orange-500 mr-3 text-lg" />
              Order Summary
            </h3>
            <div className="space-y-3">
              {order.cart?.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <span className="text-gray-700 text-sm sm:text-base">{item.product_name} x {item.quantity}</span>
                  <span className="font-semibold text-green-600 text-sm sm:text-base">
                    {new Intl.NumberFormat("rw-RW", { style: "currency", currency: "RWF" }).format((item.total_amount || item.price || 0) * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span className="text-green-600">
                    {new Intl.NumberFormat("rw-RW", { style: "currency", currency: "RWF" }).format(order.total || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center text-lg">
              <FontAwesomeIcon icon={faTruck} className="text-orange-500 mr-3 text-lg" />
              Order Status
            </h3>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-start space-x-4 relative">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    step.status === 'completed' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {step.status === 'completed' && (
                      <FontAwesomeIcon icon={faCheckCircle} className="text-lg" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold text-lg ${
                      step.status === 'completed' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {step.name}
                    </p>
                    <p className="text-gray-500 text-base">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-orange-50 rounded-xl p-4 sm:p-6 border border-orange-200">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center text-lg">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500 mr-3 text-lg" />
              Delivery Information
            </h3>
            <div className="space-y-3 text-base">
              <div className="flex items-center space-x-3">
                <FontAwesomeIcon icon={faMapPin} className="text-orange-500 text-lg" />
                <span><strong>Address:</strong> {order.customer_address}</span>
              </div>
              <div className="flex items-center space-x-3">
                <FontAwesomeIcon icon={faPhone} className="text-orange-500 text-lg" />
                <span><strong>Phone:</strong> {order.customer_phone}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
          <div className="flex justify-center">
            <button 
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-8 rounded-xl transition-colors duration-200 font-semibold text-base"
            >
              Close Tracking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// Payment Methods Component - Enhanced responsive design
const PaymentMethods = React.memo(({ 
  selectedPayment, 
  onPaymentChange, 
  cartSummary, 
  formatPrice 
}) => {
  const MOMO_NUMBER = "0788295765";
  const MOMO_OWNER = "TUYISENGE Gashugi Arnaud";

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(MOMO_NUMBER);
    alert('MoMo number copied to clipboard!');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
        <FontAwesomeIcon icon={faCreditCard} className="text-orange-500 mr-3 text-xl" />
        Payment Method
      </h3>
      
      <div 
        className={`border-2 rounded-xl sm:rounded-2xl p-4 sm:p-6 cursor-pointer transition-all duration-300 ${
          selectedPayment === 'momo' 
            ? 'border-orange-500 bg-orange-50' 
            : 'border-gray-300 hover:border-orange-300 bg-white hover:bg-orange-50'
        }`}
        onClick={() => onPaymentChange('momo')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-orange-500 p-3 sm:p-4 rounded-xl">
              <FontAwesomeIcon icon={faMobileAlt} className="text-white text-xl" />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-lg">Mobile Money (MoMo)</h4>
              <p className="text-gray-600 text-base">Pay with MTN Mobile Money</p>
            </div>
          </div>
          <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center ${
            selectedPayment === 'momo' 
              ? 'bg-orange-500 border-orange-500' 
              : 'border-gray-400'
          }`}>
            {selectedPayment === 'momo' && (
              <FontAwesomeIcon icon={faCheck} className="text-white text-xs" />
            )}
          </div>
        </div>

        {selectedPayment === 'momo' && (
          <div className="mt-4 p-4 sm:p-6 bg-orange-100 rounded-xl border border-orange-200">
            <div className="space-y-4">
              <div className="bg-white p-4 sm:p-6 rounded-xl border border-orange-300">
                <div className="space-y-3 text-base">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Send to:</span>
                    <span className="font-bold text-orange-600">{MOMO_OWNER}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">MoMo Number:</span>
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-orange-600 text-lg">{MOMO_NUMBER}</span>
                      <button 
                        onClick={handleCopyNumber}
                        className="text-orange-500 hover:text-orange-700 text-sm bg-orange-100 px-3 py-2 rounded-lg font-medium"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Amount:</span>
                    <span className="font-bold text-green-600 text-lg">{formatPrice(cartSummary.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div 
        className={`border-2 rounded-xl sm:rounded-2xl p-4 sm:p-6 cursor-pointer transition-all duration-300 ${
          selectedPayment === 'cash' 
            ? 'border-orange-500 bg-orange-50' 
            : 'border-gray-300 hover:border-orange-300 bg-white hover:bg-orange-50'
        }`}
        onClick={() => onPaymentChange('cash')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-orange-500 p-3 sm:p-4 rounded-xl">
              <FontAwesomeIcon icon={faMoneyBill} className="text-white text-xl" />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-lg">Cash on Delivery</h4>
              <p className="text-gray-600 text-base">Pay when you receive your order</p>
            </div>
          </div>
          <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center ${
            selectedPayment === 'cash' 
              ? 'bg-orange-500 border-orange-500' 
              : 'border-gray-400'
          }`}>
            {selectedPayment === 'cash' && (
              <FontAwesomeIcon icon={faCheck} className="text-white text-xs" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// Stats Card Component - Enhanced responsive design
const StatsCard = React.memo(({ icon, title, value, color }) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm sm:text-base mb-2">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`p-3 sm:p-4 rounded-2xl ${color}`}>
          <FontAwesomeIcon icon={icon} className="text-white text-xl sm:text-2xl" />
        </div>
      </div>
    </div>
  );
});

const UserDashboard = () => {
  const { user, logout } = useUser();
  const [activeTab, setActiveTab] = useState('menu');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [userProfile, setUserProfile] = useState(user || {});
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
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [error, setError] = useState('');
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState('momo');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Use the Render backend URL directly
  const API_BASE_URL = 'https://backend-wgm2.onrender.com/api';

  // Enhanced fetch function with better error handling
  const fetchWithAuth = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add user authentication headers if user exists
    if (user) {
      headers['user-id'] = user.id?.toString() || '';
      headers['user-email'] = user.email || '';
    }

    try {
      console.log(`Making request to: ${API_BASE_URL}${url}`);
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
      });

      console.log(`Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Success response:', data);
      return data;

    } catch (error) {
      console.error(`Fetch error for ${url}:`, error);
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Please check your internet connection and try again.');
      }
      throw error;
    }
  };

  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!user || !user.id || !user.email) {
        throw new Error('User information is missing. Please log in again.');
      }

      console.log('Fetching orders for user:', user.email);
      const data = await fetchWithAuth('/orders/user');
      setOrders(Array.isArray(data) ? data : []);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(`Failed to fetch orders: ${error.message}`);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching products from:', `${API_BASE_URL}/products`);
      const data = await fetchWithAuth('/products');
      setProducts(Array.isArray(data) ? data : []);
      
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(`Failed to fetch products: ${error.message}`);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Test API connection
  const testApiConnection = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        console.log('API health check:', data);
        setMessage('API connection successful!');
        return true;
      } else {
        setError('API health check failed');
        return false;
      }
    } catch (error) {
      console.error('API connection test failed:', error);
      setError(`API connection failed: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addToCart = useCallback((product) => {
    if (!product.is_available) {
      alert('This product is currently out of stock');
      return;
    }
    
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
        total_amount: product.total_amount || 0
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
    return cart.reduce((total, item) => total + ((item.total_amount || 0) * item.quantity), 0);
  }, [cart]);

  const calculateItemCount = useCallback(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  const handleCheckout = useCallback(async (e) => {
    e.preventDefault();
    
    // Validation
    if (!customerInfo.name?.trim() || !customerInfo.phone?.trim() || !customerInfo.address?.trim()) {
      alert("Please fill in all required fields (name, phone, and address)");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty");
      return;
    }

    if (!user?.email) {
      alert("User information is missing. Please log in again.");
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const orderData = {
        customer_name: customerInfo.name.trim(),
        customer_phone: customerInfo.phone.trim(),
        customer_address: customerInfo.address.trim(),
        customer_email: user.email,
        cart: cart.map(item => ({
          id: item.id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.total_amount || 0,
          total_amount: item.total_amount || 0
        })),
        total: calculateTotal(),
        payment_method: selectedPayment,
        status: 'pending'
      };

      console.log('Submitting order:', orderData);
      const data = await fetchWithAuth('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });

      // Success handling
      if (selectedPayment === 'momo') {
        alert(`Order placed successfully!\n\nPayment Instructions:\nSend ${formatPrice(calculateTotal())} to MoMo: 0788295765\nAccount: TUYISENGE Gashugi Arnaud\nUse your name as reference`);
      } else {
        alert('Order placed successfully! Pay with cash when your order arrives.');
      }
      
      setOrderSuccess(true);
      setCart([]);
      setShowCheckout(false);
      
      // Refresh orders after successful order
      setTimeout(() => {
        fetchUserOrders();
      }, 1000);
      
      setTimeout(() => setOrderSuccess(false), 5000);

    } catch (err) {
      console.error("Checkout error:", err);
      setError(`Failed to place order: ${err.message}`);
      alert(`Failed to place order: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [customerInfo, cart, calculateTotal, user, selectedPayment]);

  const handleProfileUpdate = async (updatedUser) => {
    try {
      setUserProfile(updatedUser);
      setShowEditProfile(false);
      setMessage('Profile updated successfully (local storage only)!');
      
      setCustomerInfo(prev => ({
        ...prev,
        name: updatedUser.username,
        phone: updatedUser.phone || "",
        address: updatedUser.address || ""
      }));

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setError('Failed to update profile: ' + error.message);
    }
  };

  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat("rw-RW", { 
      style: "currency", 
      currency: "RWF" 
    }).format(price || 0);
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
    const statusLower = status?.toLowerCase() || 'pending';
    switch (statusLower) {
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

  // Effect to fetch data when tabs change
  useEffect(() => {
    if (activeTab === 'orders') {
      fetchUserOrders();
    } else if (activeTab === 'menu') {
      fetchProducts();
    }
  }, [activeTab]);

  // Effect to update customer info when user changes
  useEffect(() => {
    if (user) {
      setCustomerInfo({
        name: user.username || "",
        phone: user.phone || "",
        address: user.address || ""
      });
      setUserProfile(user);
    }
  }, [user]);

  // Test API connection on component mount
  useEffect(() => {
    console.log('Using API URL:', API_BASE_URL);
    testApiConnection();
  }, []);

  const cartSummary = useMemo(() => ({
    itemCount: calculateItemCount(),
    total: calculateTotal()
  }), [calculateItemCount, calculateTotal]);

  // Redirect if no user
  if (!user) {
    window.location.href = '/userlogin';
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Success Message */}
      {orderSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 mx-4 text-base flex items-center space-x-3 animate-bounce">
          <FontAwesomeIcon icon={faCheckCircle} />
          <span>Order placed successfully!</span>
        </div>
      )}

      {/* Debug Info */}
      <div className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded text-xs opacity-70">
        API: {API_BASE_URL}
      </div>

      {/* Enhanced Header */}
      <header className="bg-white shadow-2xl border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-3 rounded-2xl shadow-lg">
                <FontAwesomeIcon icon={faHamburger} className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                  FastFood
                </h1>
                <p className="text-gray-600 text-sm">User Dashboard</p>
              </div>
            </div>
            
            {/* User Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCart(true)}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 rounded-xl transition-all duration-300 relative flex items-center space-x-3 text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <FontAwesomeIcon icon={faShoppingCart} className="text-lg" />
                <span>Cart ({cartSummary.itemCount})</span>
                {cartSummary.itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center animate-pulse">
                    {cartSummary.itemCount}
                  </span>
                )}
              </button>
              
              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-3 text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <FontAwesomeIcon icon={faUserCircle} className="text-xl" />
                  <span className="max-w-32 truncate">{user.username}</span>
                  <FontAwesomeIcon icon={faBars} className="text-sm" />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 py-3 z-50 animate-in fade-in-80">
                    <div className="px-5 py-4 border-b border-gray-200">
                      <p className="font-bold text-gray-800 text-lg truncate">{user.username}</p>
                      <p className="text-gray-600 text-sm truncate">{user.email}</p>
                    </div>
                    <button 
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowEditProfile(true);
                      }}
                      className="w-full text-left px-5 py-4 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center space-x-3 text-base border-b border-gray-100"
                    >
                      <FontAwesomeIcon icon={faUser} className="text-lg" />
                      <span>Edit Profile</span>
                    </button>
                    <button 
                      onClick={() => {
                        setShowUserMenu(false);
                        setActiveTab('orders');
                      }}
                      className="w-full text-left px-5 py-4 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center space-x-3 text-base border-b border-gray-100"
                    >
                      <FontAwesomeIcon icon={faHistory} className="text-lg" />
                      <span>My Orders</span>
                    </button>
                    <div className="pt-2">
                      <button 
                        onClick={logout}
                        className="w-full text-left px-5 py-4 text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-3 text-base"
                      >
                        <FontAwesomeIcon icon={faSignOutAlt} className="text-lg" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Welcome Section */}
      <section className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8 animate-pulse">
              Welcome back, {user.username}! 👋
            </h2>
            <p className="text-orange-100 text-xl sm:text-2xl lg:text-3xl mb-8 sm:mb-12 leading-relaxed">
              Ready to explore our delicious menu? Order now and get your favorite food delivered fast!
            </p>
            
            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <StatsCard
                icon={faShoppingCart}
                title="Total Orders"
                value={orders.length}
                color="bg-blue-500"
              />
              <StatsCard
                icon={faCheckCircle}
                title="Completed"
                value={orders.filter(order => order.status === 'completed').length}
                color="bg-green-500"
              />
              <StatsCard
                icon={faDollarSign}
                title="Total Spent"
                value={formatPrice(orders.reduce((sum, order) => sum + (order.total || 0), 0))}
                color="bg-amber-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Navigation Tabs */}
      <div className="bg-white shadow-2xl border-b border-gray-200 sticky top-[84px] z-30 backdrop-blur-sm bg-white/95">
        <div className="container mx-auto px-4 sm:px-6">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-4 hide-scrollbar">
            {[
              { id: 'menu', name: 'Our Menu', icon: faShoppingCart },
              { id: 'orders', name: 'My Orders', icon: faHistory },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 py-4 px-6 border-b-2 font-bold text-base whitespace-nowrap transition-all duration-300 min-w-max rounded-t-lg ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600 bg-orange-50 shadow-inner'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={tab.icon} className="text-lg" />
                <span>{tab.name}</span>
                {tab.id === 'orders' && orders.length > 0 && (
                  <span className="bg-orange-500 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center">
                    {orders.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Enhanced Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Enhanced Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-xl flex items-center animate-shake">
            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-4 text-xl flex-shrink-0" />
            <span className="flex-1 text-base">{error}</span>
            <button 
              onClick={() => setError('')}
              className="ml-4 text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors flex-shrink-0"
            >
              <FontAwesomeIcon icon={faTimes} className="text-xl" />
            </button>
          </div>
        )}

        {/* Enhanced Success Message */}
        {message && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-xl animate-fade-in">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faCheckCircle} className="mr-4 text-xl flex-shrink-0" />
              <span className="text-base">{message}</span>
            </div>
          </div>
        )}

        {/* Connection Troubleshooting */}
        {error && error.includes('Cannot connect to server') && (
          <div className="mb-6 bg-yellow-100 border border-yellow-400 text-yellow-700 px-6 py-4 rounded-xl">
            <h4 className="font-bold mb-2">Connection Issue</h4>
            <p className="mb-2">Unable to connect to the server. Please check:</p>
            <ul className="list-disc list-inside text-sm space-y-1 mb-3">
              <li>Your internet connection</li>
              <li>If the backend server is running</li>
              <li>Browser console for detailed errors</li>
            </ul>
            <button 
              onClick={testApiConnection}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm"
            >
              Test Connection Again
            </button>
          </div>
        )}

        {/* Enhanced Menu Tab */}
        {activeTab === 'menu' && (
          <div className="space-y-8 sm:space-y-12">
            <div className="text-center">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-800 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
                Our Delicious Menu
              </h2>
              <p className="text-gray-600 text-xl max-w-2xl mx-auto">
                Discover our mouth-watering selection of freshly prepared meals
              </p>
            </div>

            {loading ? (
              <div className="text-center py-16 sm:py-24 bg-white rounded-2xl border border-gray-200 shadow-lg">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-5xl sm:text-6xl text-orange-600 mb-6" />
                <p className="text-gray-600 text-xl sm:text-2xl">Loading menu...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 sm:py-24 bg-white rounded-2xl border border-gray-200 shadow-lg">
                <FontAwesomeIcon icon={faBox} className="text-6xl sm:text-7xl text-gray-300 mb-6" />
                <h4 className="text-2xl sm:text-3xl font-semibold text-gray-600 mb-4">
                  {error ? 'Failed to load products' : 'No products available'}
                </h4>
                <p className="text-gray-500 text-lg sm:text-xl mb-8">
                  {error ? 'Please check your connection and try again' : 'Please check back later or contact support.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={fetchProducts}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-4 rounded-xl transition-all duration-300 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Retry Loading Products
                  </button>
                  <button 
                    onClick={testApiConnection}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-4 rounded-xl transition-all duration-300 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Test Connection
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 sm:gap-8">
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

        {/* Enhanced Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-8 sm:space-y-12">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
              <div className="text-center lg:text-left">
                <h2 className="text-4xl sm:text-5xl font-bold text-gray-800 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                  My Orders
                </h2>
                <p className="text-gray-600 text-xl">Track your order history and status</p>
              </div>
              <button 
                onClick={fetchUserOrders}
                disabled={loading}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-4 rounded-xl transition-all duration-300 text-base disabled:opacity-50 flex items-center space-x-3 w-full lg:w-auto justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <FontAwesomeIcon icon={faSpinner} className={loading ? 'animate-spin' : 'hidden'} />
                <span>Refresh Orders</span>
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-16 sm:py-24 bg-white rounded-2xl border border-gray-200 shadow-lg">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-5xl sm:text-6xl text-orange-600 mb-6" />
                <p className="text-gray-600 text-xl sm:text-2xl">Loading your orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 sm:py-24 bg-white rounded-2xl border border-gray-200 shadow-lg">
                <FontAwesomeIcon icon={faBox} className="text-6xl sm:text-7xl text-gray-300 mb-6" />
                <h4 className="text-2xl sm:text-3xl font-semibold text-gray-600 mb-4">
                  {error ? 'Failed to load orders' : 'No orders yet'}
                </h4>
                <p className="text-gray-500 text-lg sm:text-xl mb-8">
                  {error ? 'Please check your connection and try again' : 'Start shopping to see your orders here!'}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {!error && (
                    <button 
                      onClick={() => setActiveTab('menu')}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-4 rounded-xl transition-all duration-300 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Browse Menu
                    </button>
                  )}
                  <button 
                    onClick={fetchUserOrders}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-4 rounded-xl transition-all duration-300 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Retry Loading Orders
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 sm:space-y-8">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                      <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-2xl shadow-lg">
                          <FontAwesomeIcon icon={faShoppingCart} className="text-xl" />
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">
                            {formatDate(order.created_at)}
                          </p>
                          <p className="font-bold text-gray-800 text-xl">
                            Total: {formatPrice(order.total)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(order.status)}`}>
                          {order.status || 'Pending'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-6">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                        <div>
                          <h5 className="font-bold text-gray-700 mb-4 text-xl flex items-center">
                            <FontAwesomeIcon icon={faBox} className="text-orange-500 mr-3 text-xl" />
                            Order Items:
                          </h5>
                          <div className="space-y-3">
                            {order.cart?.map((item, index) => (
                              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-800 text-base">{item.product_name}</p>
                                  <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
                                </div>
                                <span className="font-bold text-green-600 text-base">
                                  {formatPrice((item.total_amount || item.price || 0) * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-700 mb-4 text-xl flex items-center">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500 mr-3 text-xl" />
                            Delivery Information:
                          </h5>
                          <div className="space-y-2 text-base bg-orange-50 p-4 sm:p-6 rounded-xl border border-orange-200">
                            <p><strong>Name:</strong> {order.customer_name}</p>
                            <p><strong>Phone:</strong> {order.customer_phone}</p>
                            <p><strong>Address:</strong> {order.customer_address}</p>
                            <p><strong>Payment:</strong> <span className="capitalize">{order.payment_method}</span></p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 mt-6 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <span className="font-bold text-gray-800 text-2xl">
                          Total: {formatPrice(order.total)}
                        </span>
                        <button 
                          onClick={() => handleTrackOrder(order)}
                          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 rounded-xl transition-all duration-300 text-base flex items-center space-x-3 w-full sm:w-auto justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <FontAwesomeIcon icon={faEye} className="text-base" />
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

      {/* Enhanced Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 flex flex-col animate-slide-up">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Your Cart</h2>
                <button 
                  onClick={() => setShowCart(false)}
                  className="text-white hover:text-orange-200 p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>
              </div>
              {cartSummary.itemCount > 0 && (
                <p className="text-orange-100 mt-2 text-lg">
                  {cartSummary.itemCount} item{cartSummary.itemCount !== 1 ? 's' : ''} • Total: {formatPrice(cartSummary.total)}
                </p>
              )}
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto flex-1">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-6">🛒</div>
                  <p className="text-gray-500 text-xl mb-6">Your cart is empty</p>
                  <button 
                    onClick={() => setShowCart(false)}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-4 rounded-xl transition-all duration-300 text-lg font-semibold w-full shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
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
                <div className="flex justify-between items-center text-2xl mb-6">
                  <span className="font-bold text-gray-800">Total Amount:</span>
                  <span className="font-bold text-green-600 text-3xl">
                    {formatPrice(cartSummary.total)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setShowCart(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white py-4 rounded-xl transition-all duration-300 font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Continue Shopping
                  </button>
                  <button 
                    onClick={() => {
                      setShowCart(false);
                      setShowCheckout(true);
                    }}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-4 rounded-xl transition-all duration-300 font-bold flex items-center justify-center space-x-3 text-base shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <FontAwesomeIcon icon={faCreditCard} className="text-xl" />
                    <span>Checkout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 flex flex-col animate-slide-up">
            <div className="border-b border-gray-200 p-6 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Complete Your Order</h2>
                <button 
                  onClick={() => setShowCheckout(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleCheckout} className="space-y-6">
                {/* Customer Information */}
                <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                    <FontAwesomeIcon icon={faUser} className="text-orange-500 mr-4 text-xl" />
                    Customer Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-3">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-base"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-3">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-base"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-3">
                        Delivery Address *
                      </label>
                      <textarea
                        required
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white resize-none text-base"
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                        placeholder="Enter your complete delivery address"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
                  <PaymentMethods
                    selectedPayment={selectedPayment}
                    onPaymentChange={setSelectedPayment}
                    cartSummary={cartSummary}
                    formatPrice={formatPrice}
                  />
                </div>

                {/* Order Summary */}
                <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                    <FontAwesomeIcon icon={faShoppingCart} className="text-green-500 mr-4 text-xl" />
                    Order Summary
                  </h3>
                  
                  <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                    {cart.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <ProductImage
                            product={item}
                            className="w-16 h-16 object-cover rounded-lg bg-gray-200"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-base truncate">{item.product_name}</p>
                            <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-bold text-green-600 text-base whitespace-nowrap ml-4">
                          {formatPrice((item.total_amount || 0) * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-green-200 mt-6 pt-6">
                    <div className="flex justify-between items-center text-xl">
                      <span className="font-bold text-gray-800">Total Amount:</span>
                      <span className="font-bold text-green-600 text-2xl">
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
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 font-bold text-base disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCreditCard} className="text-xl" />
                    <span>
                      {selectedPayment === 'momo' ? 'Place Order & Pay with MoMo' : 'Place Order (Cash on Delivery)'}
                    </span>
                  </>
                )}
              </button>
              
              {/* Security Notice */}
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <FontAwesomeIcon icon={faShieldAlt} className="text-green-500" />
                  <span>Secure checkout • Your data is protected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Tracking Modal */}
      {trackingOrder && (
        <OrderTracking 
          order={trackingOrder} 
          onClose={closeTracking}
        />
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfileModal
          user={userProfile}
          onSave={handleProfileUpdate}
          onClose={() => setShowEditProfile(false)}
          loading={loading}
        />
      )}

      {/* Custom CSS for enhanced responsive behavior */}
      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

// Edit Profile Modal - Enhanced responsive design
const EditProfileModal = React.memo(({ user, onSave, onClose, loading }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.username.trim() || !formData.email.trim()) {
      alert('Username and email are required');
      return;
    }

    // For now, just update local storage and state
    const updatedUser = {
      ...user,
      username: formData.username,
      email: formData.email,
      phone: formData.phone,
      address: formData.address
    };

    // Update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Call the onSave callback to update parent state
    onSave(updatedUser);
    
    // Show success message
    alert('Profile updated successfully (local storage only)!');
    
    // Close modal
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 animate-slide-up">
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center">
              <FontAwesomeIcon icon={faEdit} className="text-orange-500 mr-4 text-2xl" />
              Edit Profile 
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              <FontAwesomeIcon icon={faTimes} className="text-xl" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-3">
                Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-base"
                required
              />
            </div>
            
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-3">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-base"
                required
              />
            </div>
            
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-3">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-base"
                placeholder="+250 78 123 4567"
              />
            </div>
            
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-3">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white resize-none text-base"
                placeholder="Enter your delivery address"
              />
            </div>
          </div>
          
          <div className="flex space-x-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-4 rounded-xl transition-colors duration-200 font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-4 rounded-xl transition-colors duration-200 font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Save Changes Locally
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default UserDashboard;
