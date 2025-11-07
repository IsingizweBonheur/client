import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  faReceipt
} from '@fortawesome/free-solid-svg-icons';

// Backend URL configuration - Single source of truth
const BACKEND_URL = "https://backend-wgm2.onrender.com";
const API_URL = `${BACKEND_URL}/api`;

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
  };

  return { user, login, logout };
};

// Enhanced ProductImage with better error handling and responsive sizing
const ProductImage = React.memo(({ product, className = "h-40 sm:h-48 w-full object-cover" }) => {
  const [imgSrc, setImgSrc] = useState("");
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const FALLBACK_IMAGES = {
    burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop",
    pizza: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=200&fit=crop",
    fries: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&h=200&fit=crop",
    chicken: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=300&h=200&fit=crop",
    drink: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&h=200&fit=crop",
    default: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=200&fit=crop"
  };

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
  }, []);

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
      setIsLoading(false);
      return;
    }
    
    if (product.image_url) {
      setIsLoading(true);
      setImgSrc(getImageUrl(product.image_url));
    }
  }, [product.image_url, product.product_name, getImageUrl, getFallbackImage]);

  const handleError = useCallback(() => {
    setHasError(true);
    setImgSrc(getFallbackImage(product.product_name));
    setIsLoading(false);
  }, [product.product_name, getFallbackImage]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <div className="relative overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-orange-500 text-xl" />
        </div>
      )}
      <img
        src={imgSrc}
        alt={product.product_name}
        className={`${className} transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />
    </div>
  );
});

// Enhanced Product Card with better touch targets and responsive design
const ProductCard = React.memo(({ product, onAddToCart }) => {
  const handleAddToCart = useCallback(() => {
    onAddToCart(product);
  }, [product, onAddToCart]);

  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat("rw-RW", { 
      style: "currency", 
      currency: "RWF" 
    }).format(price);
  }, []);

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-orange-300 group h-full flex flex-col">
      <div className="relative overflow-hidden flex-shrink-0">
        <ProductImage
          product={product}
          className="h-40 xs:h-48 sm:h-56 w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.is_popular && (
          <div className="absolute top-2 xs:top-3 left-2 xs:left-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-2 xs:px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            <span className="text-xs">🔥 Popular</span>
          </div>
        )}
      </div>
      <div className="p-3 xs:p-4 sm:p-6 flex flex-col flex-1">
        <div className="mb-3 xs:mb-4 flex-1">
          <h3 className="font-bold text-gray-800 mb-1 xs:mb-2 text-base xs:text-lg sm:text-xl line-clamp-1 leading-tight">
            {product.product_name}
          </h3>
          <p className="text-gray-600 text-xs xs:text-sm sm:text-base leading-relaxed line-clamp-2 min-h-[2.5rem] xs:min-h-[3rem]">
            {product.description}
          </p>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <p className="text-green-600 font-bold text-lg xs:text-xl sm:text-2xl">
            {formatPrice(product.total_amount)}
          </p>
          <button 
            onClick={handleAddToCart}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 flex items-center space-x-1 xs:space-x-2 text-xs xs:text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 min-h-[44px] min-w-[44px]"
            aria-label={`Add ${product.product_name} to cart`}
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs xs:text-sm" />
            <span className="hidden xs:inline">Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
});

// Enhanced Cart Item with better mobile touch targets
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
    }).format(price);
  }, []);

  return (
    <div className="flex items-center space-x-3 xs:space-x-4 bg-white p-3 xs:p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
      <ProductImage
        product={item}
        className="w-12 h-12 xs:w-16 xs:h-16 sm:w-20 sm:h-20 object-cover rounded-lg bg-gray-200 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-800 text-sm xs:text-base sm:text-lg truncate leading-tight">
          {item.product_name}
        </h3>
        <p className="text-green-600 font-bold text-xs xs:text-sm sm:text-base mt-0.5 xs:mt-1">
          {formatPrice(item.total_amount)}
        </p>
        <div className="flex items-center space-x-2 xs:space-x-3 mt-1 xs:mt-2">
          <div className="flex items-center space-x-2 xs:space-x-3 bg-gray-50 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2 border border-gray-200">
            <button 
              onClick={handleDecrease}
              className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center hover:bg-gray-200 transition-colors duration-200 active:bg-gray-300 min-h-[20px] min-w-[20px]"
              aria-label="Decrease quantity"
            >
              <FontAwesomeIcon icon={faMinus} className="text-gray-600 text-xs" />
            </button>
            <span className="w-6 xs:w-8 text-center font-bold text-gray-800 text-sm xs:text-base sm:text-lg">
              {item.quantity}
            </span>
            <button 
              onClick={handleIncrease}
              className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center hover:bg-gray-200 transition-colors duration-200 active:bg-gray-300 min-h-[20px] min-w-[20px]"
              aria-label="Increase quantity"
            >
              <FontAwesomeIcon icon={faPlus} className="text-gray-600 text-xs" />
            </button>
          </div>
          <button 
            onClick={handleRemove}
            className="text-red-500 hover:text-red-700 p-1.5 xs:p-2 rounded-lg hover:bg-red-50 transition-colors duration-200 active:bg-red-100 min-h-[32px] min-w-[32px]"
            aria-label="Remove item from cart"
          >
            <FontAwesomeIcon icon={faTrash} className="text-sm xs:text-base" />
          </button>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-gray-800 text-sm xs:text-base sm:text-lg">
          {formatPrice(item.total_amount * item.quantity)}
        </p>
      </div>
    </div>
  );
});

// Enhanced Order Tracking Component with Call Restaurant button
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
  
  const RESTAURANT_PHONE = "0788295765";

  const handleCallRestaurant = useCallback(() => {
    if (window.confirm(`Call restaurant at ${RESTAURANT_PHONE}?`)) {
      window.open(`tel:${RESTAURANT_PHONE}`, '_self');
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 xs:p-4 bg-black/50 animate-fade-in">
      <div className="bg-white rounded-xl xs:rounded-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden shadow-2xl border border-gray-200 animate-slide-up flex flex-col">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 xs:p-5 sm:p-6 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-lg xs:text-xl sm:text-2xl font-bold text-white">Order Tracking</h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-orange-200 p-1 xs:p-2 rounded-full hover:bg-white/20 transition-colors duration-200 min-h-[32px] min-w-[32px]"
              aria-label="Close tracking"
            >
              <FontAwesomeIcon icon={faTimes} className="text-base xs:text-lg" />
            </button>
          </div>
        </div>
        
        <div className="p-3 xs:p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="mb-4 xs:mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 xs:mb-4 flex items-center text-base xs:text-lg">
              <FontAwesomeIcon icon={faReceipt} className="text-orange-500 mr-2 xs:mr-3 text-base xs:text-lg" />
              Order Summary
            </h3>
            <div className="space-y-2 xs:space-y-3">
              {order.cart?.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 p-3 xs:p-4 rounded-lg border border-gray-200">
                  <span className="text-gray-700 text-sm xs:text-base flex-1 truncate mr-2">
                    {item.product_name} x {item.quantity}
                  </span>
                  <span className="font-semibold text-green-600 text-sm xs:text-base whitespace-nowrap">
                    {new Intl.NumberFormat("rw-RW", { style: "currency", currency: "RWF" }).format((item.total_amount || item.price) * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-3 xs:pt-4 mt-3 xs:mt-4">
                <div className="flex justify-between items-center font-bold text-base xs:text-lg">
                  <span>Total</span>
                  <span className="text-green-600">
                    {new Intl.NumberFormat("rw-RW", { style: "currency", currency: "RWF" }).format(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4 xs:mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 xs:mb-4 flex items-center text-base xs:text-lg">
              <FontAwesomeIcon icon={faTruck} className="text-orange-500 mr-2 xs:mr-3 text-base xs:text-lg" />
              Order Status
            </h3>
            <div className="space-y-3 xs:space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-start space-x-3 xs:space-x-4 relative">
                  <div className={`flex-shrink-0 w-8 h-8 xs:w-10 xs:h-10 rounded-full flex items-center justify-center ${
                    step.status === 'completed' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {step.status === 'completed' && (
                      <FontAwesomeIcon icon={faCheckCircle} className="text-sm xs:text-lg" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold text-base xs:text-lg ${
                      step.status === 'completed' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {step.name}
                    </p>
                    <p className="text-gray-500 text-sm xs:text-base">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-orange-50 rounded-xl p-3 xs:p-4 sm:p-6 border border-orange-200">
            <h3 className="font-semibold text-gray-800 mb-3 xs:mb-4 flex items-center text-base xs:text-lg">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500 mr-2 xs:mr-3 text-base xs:text-lg" />
              Delivery Information
            </h3>
            <div className="space-y-2 xs:space-y-3 text-sm xs:text-base">
              <div className="flex items-center space-x-2 xs:space-x-3">
                <FontAwesomeIcon icon={faMapPin} className="text-orange-500 text-base xs:text-lg flex-shrink-0" />
                <span><strong>Address:</strong> {order.customer_address}</span>
              </div>
              <div className="flex items-center space-x-2 xs:space-x-3">
                <FontAwesomeIcon icon={faPhone} className="text-orange-500 text-base xs:text-lg flex-shrink-0" />
                <span><strong>Phone:</strong> {order.customer_phone}</span>
              </div>
            </div>
          </div>

          {/* Call Restaurant Section - Only show for completed orders */}
          {order.status === 'completed' && (
            <div className="mt-4 xs:mt-6 bg-green-50 rounded-xl p-3 xs:p-4 sm:p-6 border border-green-200">
              <h3 className="font-semibold text-gray-800 mb-3 xs:mb-4 flex items-center text-base xs:text-lg">
                <FontAwesomeIcon icon={faPhone} className="text-green-500 mr-2 xs:mr-3 text-base xs:text-lg" />
                Need Help With Your Order?
              </h3>
              <div className="space-y-3 xs:space-y-4">
                <p className="text-gray-700 text-sm xs:text-base">
                  If you have any questions about your completed order or want to provide feedback, feel free to call our restaurant.
                </p>
                <button 
                  onClick={handleCallRestaurant}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 xs:py-4 px-4 xs:px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 xs:space-x-3 font-semibold text-sm xs:text-base shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[44px]"
                >
                  <FontAwesomeIcon icon={faPhone} className="text-base xs:text-lg" />
                  <span>Call Restaurant: {RESTAURANT_PHONE}</span>
                </button>
                <p className="text-gray-600 text-xs xs:text-sm text-center">
                  Our team is happy to assist you with any inquiries
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-200 p-3 xs:p-4 sm:p-6 bg-gray-50 flex-shrink-0">
          <div className={`flex flex-col ${order.status === 'completed' ? 'sm:flex-row' : ''} gap-3 xs:gap-4`}>
            {/* Call Restaurant Button for completed orders - shown alongside Close button on larger screens */}
            {order.status === 'completed' && (
              <button 
                onClick={handleCallRestaurant}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-2.5 xs:py-3 px-4 xs:px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 xs:space-x-3 font-semibold text-sm xs:text-base shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[44px] order-2 sm:order-1"
              >
                <FontAwesomeIcon icon={faPhone} className="text-sm xs:text-base" />
                <span>Call Restaurant</span>
              </button>
            )}
            
            {/* Close Tracking Button */}
            <button 
              onClick={onClose}
              className={`bg-gray-500 hover:bg-gray-600 text-white py-2.5 xs:py-3 px-4 xs:px-6 rounded-xl transition-colors duration-200 font-semibold text-sm xs:text-base shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[44px] ${
                order.status === 'completed' 
                  ? 'w-full sm:w-auto order-1 sm:order-2' 
                  : 'w-full'
              }`}
            >
              Close Tracking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// Enhanced Payment Methods Component with better mobile layout
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
    <div className="space-y-3 xs:space-y-4 sm:space-y-6">
      <h3 className="text-lg xs:text-xl font-bold text-gray-800 mb-3 xs:mb-4 sm:mb-6 flex items-center">
        <FontAwesomeIcon icon={faCreditCard} className="text-orange-500 mr-2 xs:mr-3 text-lg xs:text-xl" />
        Payment Method
      </h3>
      
      <div 
        className={`border-2 rounded-xl sm:rounded-2xl p-3 xs:p-4 sm:p-6 cursor-pointer transition-all duration-300 ${
          selectedPayment === 'momo' 
            ? 'border-orange-500 bg-orange-50' 
            : 'border-gray-300 hover:border-orange-300 bg-white hover:bg-orange-50'
        }`}
        onClick={() => onPaymentChange('momo')}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => e.key === 'Enter' && onPaymentChange('momo')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 xs:space-x-4">
            <div className="bg-orange-500 p-2 xs:p-3 sm:p-4 rounded-lg xs:rounded-xl">
              <FontAwesomeIcon icon={faMobileAlt} className="text-white text-base xs:text-lg sm:text-xl" />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-base xs:text-lg">Mobile Money (MoMo)</h4>
              <p className="text-gray-600 text-sm xs:text-base">Pay with MTN Mobile Money</p>
            </div>
          </div>
          <div className={`w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center ${
            selectedPayment === 'momo' 
              ? 'bg-orange-500 border-orange-500' 
              : 'border-gray-400'
          }`}>
            {selectedPayment === 'momo' && (
              <FontAwesomeIcon icon={faCheckCircle} className="text-white text-xs" />
            )}
          </div>
        </div>

        {selectedPayment === 'momo' && (
          <div className="mt-3 xs:mt-4 p-3 xs:p-4 sm:p-6 bg-orange-100 rounded-xl border border-orange-200">
            <div className="space-y-3 xs:space-y-4">
              <div className="bg-white p-3 xs:p-4 sm:p-6 rounded-xl border border-orange-300">
                <div className="space-y-2 xs:space-y-3 text-sm xs:text-base">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Send to:</span>
                    <span className="font-bold text-orange-600 text-right">{MOMO_OWNER}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">MoMo Number:</span>
                    <div className="flex items-center space-x-2 xs:space-x-3">
                      <span className="font-mono font-bold text-orange-600 text-sm xs:text-base">{MOMO_NUMBER}</span>
                      <button 
                        onClick={handleCopyNumber}
                        className="text-orange-500 hover:text-orange-700 text-xs xs:text-sm bg-orange-100 px-2 xs:px-3 py-1.5 xs:py-2 rounded-lg font-medium min-h-[32px]"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Amount:</span>
                    <span className="font-bold text-green-600 text-base xs:text-lg">
                      {formatPrice(cartSummary.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div 
        className={`border-2 rounded-xl sm:rounded-2xl p-3 xs:p-4 sm:p-6 cursor-pointer transition-all duration-300 ${
          selectedPayment === 'cash' 
            ? 'border-orange-500 bg-orange-50' 
            : 'border-gray-300 hover:border-orange-300 bg-white hover:bg-orange-50'
        }`}
        onClick={() => onPaymentChange('cash')}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => e.key === 'Enter' && onPaymentChange('cash')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 xs:space-x-4">
            <div className="bg-orange-500 p-2 xs:p-3 sm:p-4 rounded-lg xs:rounded-xl">
              <FontAwesomeIcon icon={faMoneyBill} className="text-white text-base xs:text-lg sm:text-xl" />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-base xs:text-lg">Cash on Delivery</h4>
              <p className="text-gray-600 text-sm xs:text-base">Pay when you receive your order</p>
            </div>
          </div>
          <div className={`w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center ${
            selectedPayment === 'cash' 
              ? 'bg-orange-500 border-orange-500' 
              : 'border-gray-400'
          }`}>
            {selectedPayment === 'cash' && (
              <FontAwesomeIcon icon={faCheckCircle} className="text-white text-xs" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// Enhanced Stats Card Component with better responsive text
const StatsCard = React.memo(({ icon, title, value, color }) => {
  return (
    <div className="bg-white rounded-xl xs:rounded-2xl p-3 xs:p-4 sm:p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
      <div className="flex items-center justify-between h-full">
        <div className="flex-1">
          <p className="text-gray-600 text-xs xs:text-sm sm:text-base mb-1 xs:mb-2">{title}</p>
          <p className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-800 break-words">{value}</p>
        </div>
        <div className={`p-2 xs:p-3 sm:p-4 rounded-xl xs:rounded-2xl ${color} flex-shrink-0 ml-3`}>
          <FontAwesomeIcon icon={icon} className="text-white text-lg xs:text-xl sm:text-2xl" />
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Use the centralized API_URL constant
  const API_BASE_URL = API_URL;

  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/orders/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.id.toString(),
          'user-email': user.email,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/products`);
      
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
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

  const handleCheckout = useCallback(async (e) => {
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
        payment_method: selectedPayment,
        payment_status: selectedPayment === 'cash' ? 'pending' : 'paid'
      };

      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || `HTTP error! status: ${res.status}`);
      }

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

  const cartSummary = useMemo(() => ({
    itemCount: calculateItemCount(),
    total: calculateTotal()
  }), [calculateItemCount, calculateTotal]);

  if (!user) {
    window.location.href = '/userlogin';
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Success Message */}
      {orderSuccess && (
        <div className="fixed top-2 xs:top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 xs:px-6 py-3 xs:py-4 rounded-xl shadow-2xl z-50 mx-2 xs:mx-4 text-sm xs:text-base flex items-center space-x-2 xs:space-x-3 animate-bounce max-w-[95vw]">
          <FontAwesomeIcon icon={faCheckCircle} />
          <span>Order placed successfully!</span>
        </div>
      )}

      {/* Enhanced Header with Mobile Menu */}
      <header className="bg-white shadow-2xl border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="container mx-auto px-3 xs:px-4 sm:px-6 py-3 xs:py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Mobile Menu Button */}
            <div className="flex items-center space-x-3 xs:space-x-4">
              <button
                className="lg:hidden text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
              </button>
              <div className="flex items-center space-x-2 xs:space-x-4">
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-2 xs:p-3 rounded-xl xs:rounded-2xl shadow-lg">
                  <FontAwesomeIcon icon={faHamburger} className="text-white text-xl xs:text-2xl" />
                </div>
                <div>
                  <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-800 bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent leading-tight">
                    FastFood
                  </h1>
                  <p className="text-gray-600 text-xs xs:text-sm">User Dashboard</p>
                </div>
              </div>
            </div>
            
            {/* Desktop User Actions */}
            <div className="hidden lg:flex items-center space-x-3 xs:space-x-4">
              <button
                onClick={() => setShowCart(true)}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 xs:px-6 py-2.5 xs:py-3 rounded-xl transition-all duration-300 relative flex items-center space-x-2 xs:space-x-3 text-sm xs:text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[44px]"
              >
                <FontAwesomeIcon icon={faShoppingCart} className="text-base xs:text-lg" />
                <span>Cart ({cartSummary.itemCount})</span>
                {cartSummary.itemCount > 0 && (
                  <span className="absolute -top-1 xs:-top-2 -right-1 xs:-right-2 bg-red-500 text-white rounded-full w-5 h-5 xs:w-6 xs:h-6 text-xs flex items-center justify-center animate-pulse">
                    {cartSummary.itemCount}
                  </span>
                )}
              </button>
              
              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 xs:px-6 py-2.5 xs:py-3 rounded-xl transition-all duration-300 flex items-center space-x-2 xs:space-x-3 text-sm xs:text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[44px]"
                >
                  <FontAwesomeIcon icon={faUserCircle} className="text-lg xs:text-xl" />
                  <span className="max-w-24 xs:max-w-32 truncate">{user.username}</span>
                  <FontAwesomeIcon icon={faBars} className="text-xs" />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 xs:w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 py-3 z-50 animate-in fade-in-80">
                    <div className="px-4 xs:px-5 py-3 xs:py-4 border-b border-gray-200">
                      <p className="font-bold text-gray-800 text-base xs:text-lg truncate">{user.username}</p>
                      <p className="text-gray-600 text-xs xs:text-sm truncate">{user.email}</p>
                    </div>
                    <button 
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowEditProfile(true);
                      }}
                      className="w-full text-left px-4 xs:px-5 py-3 xs:py-4 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center space-x-2 xs:space-x-3 text-sm xs:text-base border-b border-gray-100"
                    >
                      <FontAwesomeIcon icon={faUser} className="text-base xs:text-lg" />
                      <span>Edit Profile</span>
                    </button>
                    <button 
                      onClick={() => {
                        setShowUserMenu(false);
                        setActiveTab('orders');
                      }}
                      className="w-full text-left px-4 xs:px-5 py-3 xs:py-4 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center space-x-2 xs:space-x-3 text-sm xs:text-base border-b border-gray-100"
                    >
                      <FontAwesomeIcon icon={faHistory} className="text-base xs:text-lg" />
                      <span>My Orders</span>
                    </button>
                    <div className="pt-2">
                      <button 
                        onClick={logout}
                        className="w-full text-left px-4 xs:px-5 py-3 xs:py-4 text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2 xs:space-x-3 text-sm xs:text-base"
                      >
                        <FontAwesomeIcon icon={faSignOutAlt} className="text-base xs:text-lg" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Cart Button */}
            <button
              onClick={() => setShowCart(true)}
              className="lg:hidden bg-gradient-to-r from-orange-500 to-amber-500 text-white p-3 rounded-xl relative shadow-lg min-h-[44px] min-w-[44px]"
              aria-label="Open cart"
            >
              <FontAwesomeIcon icon={faShoppingCart} className="text-lg" />
              {cartSummary.itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center animate-pulse">
                  {cartSummary.itemCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-2 border-t border-gray-200 pt-4 animate-slide-down">
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    setActiveTab('menu');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center space-x-3 py-3 px-4 rounded-xl text-left transition-colors ${
                    activeTab === 'menu' 
                      ? 'bg-orange-50 text-orange-600 border border-orange-200' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FontAwesomeIcon icon={faShoppingCart} className="text-lg" />
                  <span className="font-semibold">Our Menu</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('orders');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center space-x-3 py-3 px-4 rounded-xl text-left transition-colors ${
                    activeTab === 'orders' 
                      ? 'bg-orange-50 text-orange-600 border border-orange-200' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FontAwesomeIcon icon={faHistory} className="text-lg" />
                  <span className="font-semibold">My Orders</span>
                  {orders.length > 0 && (
                    <span className="bg-orange-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center ml-auto">
                      {orders.length}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setShowEditProfile(true);
                  }}
                  className="flex items-center space-x-3 py-3 px-4 rounded-xl text-left text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FontAwesomeIcon icon={faUser} className="text-lg" />
                  <span className="font-semibold">Edit Profile</span>
                </button>
                <button 
                  onClick={logout}
                  className="flex items-center space-x-3 py-3 px-4 rounded-xl text-left text-red-600 hover:bg-red-50 transition-colors border-t border-gray-200 mt-2 pt-4"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="text-lg" />
                  <span className="font-semibold">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Enhanced Welcome Section */}
      <section className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-8 xs:py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-3 xs:px-4 sm:px-6">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 xs:mb-6 sm:mb-8 leading-tight">
              Welcome back, {user.username}! 👋
            </h2>
            <p className="text-orange-100 text-base xs:text-lg sm:text-xl lg:text-2xl xl:text-3xl mb-6 xs:mb-8 sm:mb-12 leading-relaxed px-2">
              Ready to explore our delicious menu? Order now and get your favorite food delivered fast!
            </p>
            
            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 xs:gap-6 sm:gap-8 max-w-4xl mx-auto">
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

      {/* Enhanced Navigation Tabs - Hidden on mobile */}
      <div className="bg-white shadow-2xl border-b border-gray-200 sticky top-[76px] xs:top-[84px] z-30 backdrop-blur-sm bg-white/95 hidden lg:block">
        <div className="container mx-auto px-3 xs:px-4 sm:px-6">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-3 xs:py-4 hide-scrollbar">
            {[
              { id: 'menu', name: 'Our Menu', icon: faShoppingCart },
              { id: 'orders', name: 'My Orders', icon: faHistory },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 xs:space-x-3 py-3 xs:py-4 px-4 xs:px-6 border-b-2 font-bold text-sm xs:text-base whitespace-nowrap transition-all duration-300 min-w-max rounded-t-lg ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600 bg-orange-50 shadow-inner'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={tab.icon} className="text-base xs:text-lg" />
                <span>{tab.name}</span>
                {tab.id === 'orders' && orders.length > 0 && (
                  <span className="bg-orange-500 text-white rounded-full w-5 h-5 xs:w-6 xs:h-6 text-xs flex items-center justify-center">
                    {orders.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Enhanced Main Content */}
      <main className="container mx-auto px-3 xs:px-4 sm:px-6 py-6 xs:py-8 sm:py-12">
        {/* Enhanced Error Message */}
        {error && (
          <div className="mb-4 xs:mb-6 bg-red-100 border border-red-400 text-red-700 px-4 xs:px-6 py-3 xs:py-4 rounded-xl flex items-center animate-shake">
            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-3 xs:mr-4 text-lg flex-shrink-0" />
            <span className="flex-1 text-sm xs:text-base">{error}</span>
            <button 
              onClick={() => setError('')}
              className="ml-3 xs:ml-4 text-red-500 hover:text-red-700 p-1 xs:p-2 rounded-full hover:bg-red-50 transition-colors flex-shrink-0 min-h-[32px] min-w-[32px]"
              aria-label="Dismiss error"
            >
              <FontAwesomeIcon icon={faTimes} className="text-lg" />
            </button>
          </div>
        )}

        {/* Enhanced Success Message */}
        {message && (
          <div className="mb-4 xs:mb-6 bg-green-100 border border-green-400 text-green-700 px-4 xs:px-6 py-3 xs:py-4 rounded-xl animate-fade-in">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faCheckCircle} className="mr-3 xs:mr-4 text-lg flex-shrink-0" />
              <span className="text-sm xs:text-base">{message}</span>
            </div>
          </div>
        )}

        {/* Enhanced Menu Tab */}
        {activeTab === 'menu' && (
          <div className="space-y-6 xs:space-y-8 sm:space-y-12">
            <div className="text-center">
              <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3 xs:mb-4 leading-tight">
                Our Delicious Menu
              </h2>
              <p className="text-gray-600 text-base xs:text-lg sm:text-xl max-w-2xl mx-auto px-2">
                Discover our mouth-watering selection of freshly prepared meals
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12 xs:py-16 sm:py-24 bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-lg">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl xs:text-5xl sm:text-6xl text-orange-600 mb-4 xs:mb-6" />
                <p className="text-gray-600 text-lg xs:text-xl sm:text-2xl">Loading menu...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 xs:gap-6 sm:gap-8">
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
          <div className="space-y-6 xs:space-y-8 sm:space-y-12">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-3 xs:gap-4">
              <div className="text-center lg:text-left mb-4 lg:mb-0">
                <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2 leading-tight">
                  My Orders
                </h2>
                <p className="text-gray-600 text-base xs:text-lg sm:text-xl">Track your order history and status</p>
              </div>
              <button 
                onClick={fetchUserOrders}
                disabled={loading}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 xs:px-8 py-3 xs:py-4 rounded-xl transition-all duration-300 text-sm xs:text-base disabled:opacity-50 flex items-center space-x-2 xs:space-x-3 w-full lg:w-auto justify-center shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[44px]"
              >
                <FontAwesomeIcon icon={faSpinner} className={loading ? 'animate-spin' : 'hidden'} />
                <span>Refresh Orders</span>
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-12 xs:py-16 sm:py-24 bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-lg">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl xs:text-5xl sm:text-6xl text-orange-600 mb-4 xs:mb-6" />
                <p className="text-gray-600 text-lg xs:text-xl sm:text-2xl">Loading your orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 xs:py-16 sm:py-24 bg-white rounded-xl xs:rounded-2xl border border-gray-200 shadow-lg">
                <FontAwesomeIcon icon={faBox} className="text-5xl xs:text-6xl sm:text-7xl text-gray-300 mb-4 xs:mb-6" />
                <h4 className="text-xl xs:text-2xl sm:text-3xl font-semibold text-gray-600 mb-3 xs:mb-4">No orders yet</h4>
                <p className="text-gray-500 text-base xs:text-lg sm:text-xl mb-6 xs:mb-8 px-4">Start shopping to see your orders here!</p>
                <button 
                  onClick={() => setActiveTab('menu')}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 xs:px-8 py-3 xs:py-4 rounded-xl transition-all duration-300 text-base xs:text-lg w-full sm:w-auto shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[44px]"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <div className="space-y-4 xs:space-y-6 sm:space-y-8">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 p-4 xs:p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 xs:mb-6">
                      <div className="flex items-center space-x-3 xs:space-x-4 mb-3 xs:mb-4 lg:mb-0">
                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-3 xs:p-4 rounded-xl xs:rounded-2xl shadow-lg">
                          <FontAwesomeIcon icon={faShoppingCart} className="text-lg xs:text-xl" />
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs xs:text-sm">
                            {formatDate(order.created_at)}
                          </p>
                          <p className="font-bold text-gray-800 text-lg xs:text-xl">
                            Total: {formatPrice(order.total)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 xs:space-x-3">
                        <span className={`px-3 xs:px-4 py-1.5 xs:py-2 rounded-full text-xs xs:text-sm font-bold ${getStatusColor(order.status)}`}>
                          {order.status || 'Pending'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4 xs:pt-6">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xs:gap-6 sm:gap-8">
                        <div>
                          <h5 className="font-bold text-gray-700 mb-3 xs:mb-4 text-lg xs:text-xl flex items-center">
                            <FontAwesomeIcon icon={faBox} className="text-orange-500 mr-2 xs:mr-3 text-lg xs:text-xl" />
                            Order Items:
                          </h5>
                          <div className="space-y-2 xs:space-y-3">
                            {order.cart?.map((item, index) => (
                              <div key={index} className="flex items-center justify-between p-3 xs:p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <div className="flex-1 min-w-0 mr-2">
                                  <p className="font-semibold text-gray-800 text-sm xs:text-base truncate">{item.product_name}</p>
                                  <p className="text-gray-600 text-xs xs:text-sm">Qty: {item.quantity}</p>
                                </div>
                                <span className="font-bold text-green-600 text-sm xs:text-base whitespace-nowrap">
                                  {formatPrice((item.total_amount || item.price) * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-700 mb-3 xs:mb-4 text-lg xs:text-xl flex items-center">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500 mr-2 xs:mr-3 text-lg xs:text-xl" />
                            Delivery Information:
                          </h5>
                          <div className="space-y-1 xs:space-y-2 text-sm xs:text-base bg-orange-50 p-3 xs:p-4 sm:p-6 rounded-xl border border-orange-200">
                            <p><strong>Name:</strong> {order.customer_name}</p>
                            <p><strong>Phone:</strong> {order.customer_phone}</p>
                            <p><strong>Address:</strong> {order.customer_address}</p>
                            <p><strong>Payment:</strong> <span className="capitalize"> {formatPrice(order.total)}</span></p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 mt-4 xs:mt-6 pt-4 xs:pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 xs:gap-4">
                        <span className="font-bold text-gray-800 text-xl xs:text-2xl order-2 sm:order-1">
                          Total: {formatPrice(order.total)}
                        </span>
                        <button 
                          onClick={() => handleTrackOrder(order)}
                          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 xs:px-6 py-2.5 xs:py-3 rounded-xl transition-all duration-300 text-sm xs:text-base flex items-center space-x-2 xs:space-x-3 w-full sm:w-auto justify-center shadow-lg hover:shadow-xl transform hover:scale-105 order-1 sm:order-2 min-h-[44px]"
                        >
                          <FontAwesomeIcon icon={faEye} className="text-sm xs:text-base" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 xs:p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-xl xs:rounded-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden shadow-2xl border border-gray-200 flex flex-col animate-slide-up">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 xs:p-5 sm:p-6 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="text-xl xs:text-2xl font-bold text-white">Your Cart</h2>
                <button 
                  onClick={() => setShowCart(false)}
                  className="text-white hover:text-orange-200 p-1 xs:p-2 rounded-full hover:bg-white/20 transition-colors duration-200 min-h-[32px] min-w-[32px]"
                  aria-label="Close cart"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-lg xs:text-xl" />
                </button>
              </div>
              {cartSummary.itemCount > 0 && (
                <p className="text-orange-100 mt-1 xs:mt-2 text-sm xs:text-lg">
                  {cartSummary.itemCount} item{cartSummary.itemCount !== 1 ? 's' : ''} • Total: {formatPrice(cartSummary.total)}
                </p>
              )}
            </div>
            
            <div className="p-3 xs:p-4 sm:p-6 max-h-96 overflow-y-auto flex-1">
              {cart.length === 0 ? (
                <div className="text-center py-8 xs:py-12">
                  <div className="text-gray-400 text-5xl xs:text-6xl mb-4 xs:mb-6">🛒</div>
                  <p className="text-gray-500 text-lg xs:text-xl mb-4 xs:mb-6">Your cart is empty</p>
                  <button 
                    onClick={() => setShowCart(false)}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 xs:px-8 py-3 xs:py-4 rounded-xl transition-all duration-300 text-base xs:text-lg font-semibold w-full shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[44px]"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-3 xs:space-y-4">
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
              <div className="border-t border-gray-200 p-3 xs:p-4 sm:p-6 bg-gray-50 flex-shrink-0">
                <div className="flex justify-between items-center text-xl xs:text-2xl mb-4 xs:mb-6">
                  <span className="font-bold text-gray-800">Total Amount:</span>
                  <span className="font-bold text-green-600 text-2xl xs:text-3xl">
                    {formatPrice(cartSummary.total)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                  <button 
                    onClick={() => setShowCart(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white py-3 xs:py-4 rounded-xl transition-all duration-300 font-semibold text-sm xs:text-base shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[44px]"
                  >
                    Continue Shopping
                  </button>
                  <button 
                    onClick={() => {
                      setShowCart(false);
                      setShowCheckout(true);
                    }}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-3 xs:py-4 rounded-xl transition-all duration-300 font-bold flex items-center justify-center space-x-2 xs:space-x-3 text-sm xs:text-base shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[44px]"
                  >
                    <FontAwesomeIcon icon={faCreditCard} className="text-lg xs:text-xl" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 xs:p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-xl xs:rounded-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden shadow-2xl border border-gray-200 flex flex-col animate-slide-up">
            <div className="border-b border-gray-200 p-4 xs:p-5 sm:p-6 bg-white flex-shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="text-xl xs:text-2xl font-bold text-gray-800">Complete Your Order</h2>
                <button 
                  onClick={() => setShowCheckout(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 xs:p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 min-h-[32px] min-w-[32px]"
                  aria-label="Close checkout"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-lg xs:text-xl" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 xs:p-4 sm:p-6">
              <form onSubmit={handleCheckout} className="space-y-4 xs:space-y-6">
                {/* Customer Information */}
                <div className="bg-orange-50 rounded-xl xs:rounded-2xl p-3 xs:p-4 sm:p-6 border border-orange-200">
                  <h3 className="text-lg xs:text-xl font-bold text-gray-800 mb-4 xs:mb-6 flex items-center">
                    <FontAwesomeIcon icon={faUser} className="text-orange-500 mr-3 xs:mr-4 text-lg xs:text-xl" />
                    Customer Information
                  </h3>
                  
                  <div className="space-y-3 xs:space-y-4">
                    <div>
                      <label className="block text-sm xs:text-base font-semibold text-gray-700 mb-2 xs:mb-3">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 xs:px-4 py-2.5 xs:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-sm xs:text-base"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm xs:text-base font-semibold text-gray-700 mb-2 xs:mb-3">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        className="w-full px-3 xs:px-4 py-2.5 xs:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-sm xs:text-base"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm xs:text-base font-semibold text-gray-700 mb-2 xs:mb-3">
                        Delivery Address *
                      </label>
                      <textarea
                        required
                        rows="3"
                        className="w-full px-3 xs:px-4 py-2.5 xs:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white resize-none text-sm xs:text-base"
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                        placeholder="Enter your complete delivery address"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-orange-50 rounded-xl xs:rounded-2xl p-3 xs:p-4 sm:p-6 border border-orange-200">
                  <PaymentMethods
                    selectedPayment={selectedPayment}
                    onPaymentChange={setSelectedPayment}
                    cartSummary={cartSummary}
                    formatPrice={formatPrice}
                  />
                </div>

                {/* Order Summary */}
                <div className="bg-green-50 rounded-xl xs:rounded-2xl p-3 xs:p-4 sm:p-6 border border-green-200">
                  <h3 className="text-lg xs:text-xl font-bold text-gray-800 mb-4 xs:mb-6 flex items-center">
                    <FontAwesomeIcon icon={faShoppingCart} className="text-green-500 mr-3 xs:mr-4 text-lg xs:text-xl" />
                    Order Summary
                  </h3>
                  
                  <div className="space-y-3 xs:space-y-4 max-h-32 xs:max-h-48 overflow-y-auto pr-1 xs:pr-2">
                    {cart.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 xs:p-4 bg-white rounded-xl border border-gray-200">
                        <div className="flex items-center space-x-3 xs:space-x-4 flex-1 min-w-0">
                          <ProductImage
                            product={item}
                            className="w-12 h-12 xs:w-16 xs:h-16 object-cover rounded-lg bg-gray-200 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm xs:text-base truncate">{item.product_name}</p>
                            <p className="text-gray-600 text-xs xs:text-sm">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-bold text-green-600 text-sm xs:text-base whitespace-nowrap ml-2 xs:ml-4">
                          {formatPrice(item.total_amount * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-green-200 mt-4 xs:mt-6 pt-4 xs:pt-6">
                    <div className="flex justify-between items-center text-lg xs:text-xl">
                      <span className="font-bold text-gray-800">Total Amount:</span>
                      <span className="font-bold text-green-600 text-xl xs:text-2xl">
                        {formatPrice(cartSummary.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="border-t border-gray-200 p-3 xs:p-4 sm:p-6 bg-gray-50 flex-shrink-0">
              <button 
                type="submit"
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-3 xs:py-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 xs:space-x-3 font-bold text-sm xs:text-base disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100 min-h-[44px]"
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-lg xs:text-xl" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCreditCard} className="text-lg xs:text-xl" />
                    <span>
                      {selectedPayment === 'momo' ? 'Place Order & Pay with MoMo' : 'Place Order (Cash on Delivery)'}
                    </span>
                  </>
                )}
              </button>
              
              {/* Security Notice */}
              <div className="mt-3 xs:mt-4 text-center">
                <div className="flex items-center justify-center space-x-1 xs:space-x-2 text-xs xs:text-sm text-gray-500">
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

        @keyframes slide-down {
          from { 
            opacity: 0;
            transform: translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }

        /* Enhanced responsive breakpoints */
        @media (max-width: 480px) {
          .container {
            padding-left: 12px;
            padding-right: 12px;
          }
        }

        @media (max-width: 360px) {
          .container {
            padding-left: 8px;
            padding-right: 8px;
          }
        }
      `}</style>
    </div>
  );
};

// Enhanced Edit Profile Modal with better responsive design
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 xs:p-4 bg-black/50 animate-fade-in">
      <div className="bg-white rounded-xl xs:rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 animate-slide-up max-h-[95vh] overflow-hidden flex flex-col">
        <div className="border-b border-gray-200 p-4 xs:p-5 sm:p-6 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h3 className="text-xl xs:text-2xl font-bold text-gray-800 flex items-center">
              <FontAwesomeIcon icon={faEdit} className="text-orange-500 mr-3 xs:mr-4 text-xl xs:text-2xl" />
              Edit Profile 
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 xs:p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 min-h-[32px] min-w-[32px]"
              aria-label="Close modal"
            >
              <FontAwesomeIcon icon={faTimes} className="text-lg xs:text-xl" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-3 xs:p-4 sm:p-6 flex-1 overflow-y-auto">
          <div className="space-y-3 xs:space-y-4">
            <div>
              <label className="block text-sm xs:text-base font-semibold text-gray-700 mb-2 xs:mb-3">
                Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full px-3 xs:px-4 py-2.5 xs:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-sm xs:text-base"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm xs:text-base font-semibold text-gray-700 mb-2 xs:mb-3">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 xs:px-4 py-2.5 xs:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-sm xs:text-base"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm xs:text-base font-semibold text-gray-700 mb-2 xs:mb-3">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 xs:px-4 py-2.5 xs:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-sm xs:text-base"
                placeholder="+250 78 123 4567"
              />
            </div>
            
            <div>
              <label className="block text-sm xs:text-base font-semibold text-gray-700 mb-2 xs:mb-3">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                rows="3"
                className="w-full px-3 xs:px-4 py-2.5 xs:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white resize-none text-sm xs:text-base"
                placeholder="Enter your delivery address"
              />
            </div>
          </div>
          
          <div className="flex flex-col xs:flex-row space-y-3 xs:space-y-0 xs:space-x-3 xs:space-x-4 mt-6 xs:mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 xs:py-4 rounded-xl transition-colors duration-200 font-semibold text-sm xs:text-base shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-3 xs:py-4 rounded-xl transition-colors duration-200 font-semibold text-sm xs:text-base shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[44px]"
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
