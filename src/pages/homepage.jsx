import React, { useEffect, useState, useCallback, useMemo } from "react";
import { API_URL } from "../config";
import { createClient } from "@supabase/supabase-js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faPlus, faMinus, faHamburger, faShoppingCart, 
  faSearch, faTrash, faCreditCard, faPhone, 
  faEnvelope, faClock, faMapMarkerAlt, faTimes,
  faBars, faImage, faUser, faStar, faAward,
  faShippingFast, faHeart, faShieldAlt
} from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

// Framer Motion
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";

// Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// Supabase for fetching products only
const supabaseUrl = "https://kuxrbtxmiwjuabxfbqfx.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1eHJidHhtaXdqdWFieGZicWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NjMyMjIsImV4cCI6MjA3NjEzOTIyMn0.AwJEEPyOnq7BFB1PDlXFLt-VC3J5cDilYa3PYnu_048"
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Phone numbers
const PHONE_NUMBERS = {
  whatsapp: "250788295765",
  call: "0788295765",
  international: "+250788295765"
};

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: "easeOut" }
};

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

// Centralized Image Utilities
const FALLBACK_IMAGES = {
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
  pizza: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
  fries: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
  chicken: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
  drink: "https://images.unsplash.com/photo-1544145945-f90425340c7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
  default: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
};

const BACKEND_URL = "https://backend-wgm2.onrender.com";

// Centralized Image Hook
const useProductImage = (product) => {
  const [imgSrc, setImgSrc] = useState("");
  const [hasError, setHasError] = useState(false);

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

  return {
    imgSrc,
    hasError,
    handleError
  };
};

// Optimized ProductImage component with React.memo
const ProductImage = React.memo(({ product, className = "h-40 sm:h-48 w-full object-cover" }) => {
  const { imgSrc, handleError } = useProductImage(product);

  return (
    <motion.img
      src={imgSrc}
      alt={product.product_name}
      className={className}
      onError={handleError}
      loading="lazy"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
    />
  );
});

ProductImage.displayName = 'ProductImage';

// Memoized Product Card component
const ProductCard = React.memo(({ product, onAddToCart, user }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const handleAddToCart = useCallback(() => {
    if (!user) {
      window.location.href = '/userlogin';
      return;
    }
    onAddToCart(product);
  }, [product, onAddToCart, user]);

  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat("rw-RW", { 
      style: "currency", 
      currency: "RWF" 
    }).format(price);
  }, []);

  return (
    <motion.div
      ref={ref}
      initial="initial"
      animate={inView ? "animate" : "initial"}
      variants={scaleIn}
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      <div className="relative overflow-hidden">
        <ProductImage
          product={product}
          className="h-40 sm:h-48 w-full object-cover"
        />
        <motion.div 
          className="absolute top-3 right-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          Popular
        </motion.div>
      </div>
      <div className="p-4 sm:p-5">
        <div className="mb-3 sm:mb-4">
          <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-2 line-clamp-2">{product.product_name}</h3>
          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-2">{product.description}</p>
        </div>
        <div className="flex flex-col items-center space-y-2 sm:space-y-3">
          <p className="text-green-600 font-bold text-lg sm:text-xl text-center">
            {formatPrice(product.total_amount)}
          </p>
          <motion.button 
            onClick={handleAddToCart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`w-full py-2 sm:py-3 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 font-semibold shadow-lg text-sm sm:text-base ${
              user 
                ? 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-xl' 
                : 'bg-orange-400 text-white hover:bg-orange-500 hover:shadow-xl'
            }`}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>{user ? 'Add to Cart' : 'Login to Order'}</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';

// Memoized Cart Item component
const CartItem = React.memo(({ item, onUpdateQuantity, onRemove, user }) => {
  const { imgSrc, handleError } = useProductImage(item);

  const handleDecrease = useCallback(() => {
    if (!user) {
      window.location.href = '/userlogin';
      return;
    }
    onUpdateQuantity(item.id, item.quantity - 1);
  }, [item.id, item.quantity, onUpdateQuantity, user]);

  const handleIncrease = useCallback(() => {
    if (!user) {
      window.location.href = '/userlogin';
      return;
    }
    onUpdateQuantity(item.id, item.quantity + 1);
  }, [item.id, item.quantity, onUpdateQuantity, user]);

  const handleRemove = useCallback(() => {
    if (!user) {
      window.location.href = '/userlogin';
      return;
    }
    onRemove(item.id);
  }, [item.id, onRemove, user]);

  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat("rw-RW", { 
      style: "currency", 
      currency: "RWF" 
    }).format(price);
  }, []);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex items-center space-x-3 sm:space-x-4 bg-white/80 backdrop-blur-sm p-3 sm:p-4 rounded-2xl border border-gray-200/50 hover:bg-white transition-colors"
    >
      <div className="relative">
        <motion.img
          src={imgSrc}
          alt={item.product_name}
          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl flex-shrink-0 bg-gray-200"
          onError={handleError}
          loading="lazy"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-base sm:text-lg text-gray-800 truncate">{item.product_name}</h3>
        <p className="text-green-600 font-bold text-base sm:text-lg">{formatPrice(item.total_amount)}</p>
        <div className="flex items-center space-x-2 sm:space-x-3 mt-2">
          <div className="flex items-center space-x-2 bg-white rounded-lg px-2 sm:px-3 py-1 border border-gray-300">
            <motion.button 
              onClick={handleDecrease}
              whileTap={{ scale: 0.9 }}
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <FontAwesomeIcon icon={faMinus} className="text-gray-600 text-xs" />
            </motion.button>
            <span className="w-6 sm:w-8 text-center font-bold text-gray-800 text-sm sm:text-base">{item.quantity}</span>
            <motion.button 
              onClick={handleIncrease}
              whileTap={{ scale: 0.9 }}
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="text-gray-600 text-xs" />
            </motion.button>
          </div>
          <motion.button 
            onClick={handleRemove}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
          >
            <FontAwesomeIcon icon={faTrash} className="text-sm" />
          </motion.button>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-gray-800 text-base sm:text-lg">
          {formatPrice(item.total_amount * item.quantity)}
        </p>
      </div>
    </motion.div>
  );
});

CartItem.displayName = 'CartItem';

// New About Section Component
const AboutSection = React.memo(() => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section id="about" className="py-16 bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          initial="initial"
          animate={inView ? "animate" : "initial"}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">Our Story</h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            From humble beginnings to becoming Rwanda's favorite fast food destination
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial="initial"
          animate={inView ? "animate" : "initial"}
          variants={staggerContainer}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-16"
        >
          {[
            { number: "10K+", label: "Happy Customers" },
            { number: "5+", label: "Years Experience" },
            { number: "50+", label: "Menu Items" },
            { number: "24/7", label: "Delivery Service" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              variants={scaleIn}
              whileHover={{ scale: 1.05 }}
              className="text-center bg-white p-6 rounded-2xl shadow-lg border border-orange-100"
            >
              <div className="text-3xl font-bold text-orange-500 mb-2">{stat.number}</div>
              <div className="text-gray-600 font-semibold">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

// New Services Section Component
const ServicesSection = React.memo(() => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const services = [
    {
      icon: faShippingFast,
      title: "Fast Delivery",
      description: "Get your food delivered in under 30 minutes or it's free!",
      features: ["30-min guarantee", "Live tracking", "Free delivery over RWF 10,000"]
    },
    {
      icon: faAward,
      title: "Quality Food",
      description: "Fresh ingredients and authentic recipes for the best taste",
      features: ["Fresh ingredients", "Quality certified", "Daily preparation"]
    },
    {
      icon: faShieldAlt,
      title: "Safe & Secure",
      description: "Your safety and satisfaction are our top priorities",
      features: ["Contactless delivery", "Hygiene certified", "Secure payments"]
    }
  ];

  return (
    <section id="services" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          initial="initial"
          animate={inView ? "animate" : "initial"}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">Our Services</h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            We go beyond just great food to provide an exceptional experience
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate={inView ? "animate" : "initial"}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={scaleIn}
              whileHover={{ y: -10 }}
              className="bg-gradient-to-br from-orange-50 to-red-50 p-8 rounded-3xl shadow-lg border border-orange-100 text-center"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6"
              >
                <FontAwesomeIcon icon={service.icon} className="text-white text-2xl" />
              </motion.div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-4">{service.title}</h3>
              <p className="text-gray-600 mb-6">{service.description}</p>
              
              <ul className="space-y-2">
                {service.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                    <FontAwesomeIcon icon={faStar} className="text-orange-500 mr-2 text-xs" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

// Enhanced Header with fixed positioning
const Header = React.memo(({
  user,
  searchQuery,
  onSearchChange,
  onToggleCart,
  onRefresh,
  isRefreshing,
  cartItemCount,
  isMobileMenuOpen,
  onToggleMobileMenu,
  onLoginLogout
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect for header background
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-orange-100/50' 
          : 'bg-white shadow-sm border-b border-orange-100'
      }`}
    >
      <div className="container mx-auto px-3 sm:px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo and Mobile Menu */}
          <div className="flex items-center space-x-3 flex-1">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="lg:hidden p-2 rounded-lg hover:bg-orange-50 transition-colors"
              onClick={onToggleMobileMenu}
            >
              <FontAwesomeIcon icon={faBars} className="text-orange-500 text-xl" />
            </motion.button>
            
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div 
                className="bg-orange-500 p-2 sm:p-3 rounded-2xl shadow-lg"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <FontAwesomeIcon icon={faHamburger} className="text-white text-lg sm:text-2xl" />
              </motion.div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600">FastFood</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Delicious & Fast</p>
              </div>
            </motion.div>
          </div>
          
          {/* Search Bar - Hidden on mobile when menu is open */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`hidden md:block relative flex-1 max-w-lg mx-4 ${
              isMobileMenuOpen ? 'md:hidden' : ''
            }`}
          >
            <input
              type="text"
              placeholder="Search burgers, pizzas, drinks..."
              className="w-full px-4 py-3 pl-12 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white text-sm sm:text-base"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
          </motion.div>
          
          {/* User Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* User Profile / Login */}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLoginLogout}
              className="flex items-center space-x-2 bg-orange-100 text-orange-600 px-3 sm:px-4 py-2 rounded-xl hover:bg-orange-200 transition-colors text-sm sm:text-base"
            >
              <FontAwesomeIcon icon={faUser} className="text-sm" />
              <span className="hidden sm:inline">
                {user ? 'Logout' : 'Login'}
              </span>
            </motion.button>

            {/* Mobile Search Button */}
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="md:hidden p-2 sm:p-3 rounded-2xl hover:bg-orange-50 transition-colors"
              onClick={() => {
                // Toggle mobile search visibility
                const mobileSearch = document.querySelector('.mobile-search');
                if (mobileSearch) {
                  mobileSearch.classList.toggle('hidden');
                }
              }}
            >
              <FontAwesomeIcon icon={faSearch} className="text-orange-500 text-lg" />
            </motion.button>

            {/* Cart Button */}
            <div className="relative">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="bg-orange-500 p-2 sm:p-3 md:p-4 rounded-2xl hover:bg-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                onClick={onToggleCart}
              >
                <FontAwesomeIcon icon={faShoppingCart} className="text-white text-lg sm:text-xl" />
              </motion.button>
              {cartItemCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex items-center justify-center text-xs font-bold animate-pulse shadow-lg"
                >
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </motion.span>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar - Always visible on mobile */}
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 md:hidden mobile-search"
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Search burgers, pizzas, drinks..."
              className="w-full px-4 py-3 pl-12 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white text-sm"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </motion.div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 md:hidden bg-white/95 backdrop-blur-md rounded-2xl shadow-lg p-4 border border-orange-100 overflow-hidden"
            >
              <div className="space-y-3">
                <motion.button 
                  whileHover={{ x: 10 }}
                  onClick={() => {
                    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                    onToggleMobileMenu();
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl bg-orange-50 text-orange-600 font-semibold hover:bg-orange-100 transition-colors text-sm"
                >
                  Browse Menu
                </motion.button>
                {user ? (
                  <>
                    <motion.button 
                      whileHover={{ x: 10 }}
                      onClick={() => {
                        window.location.href = '/userdashboard';
                        onToggleMobileMenu();
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl bg-blue-50 text-orange-500 font-semibold hover:bg-blue-100 transition-colors text-sm"
                    >
                      My Dashboard
                    </motion.button>
                    <motion.button 
                      whileHover={{ x: 10 }}
                      onClick={() => {
                        onLoginLogout();
                        onToggleMobileMenu();
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors text-sm"
                    >
                      Logout
                    </motion.button>
                  </>
                ) : (
                  <motion.button 
                    whileHover={{ x: 10 }}
                    onClick={() => {
                      onLoginLogout();
                      onToggleMobileMenu();
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl bg-green-50 text-green-600 font-semibold hover:bg-green-100 transition-colors text-sm"
                  >
                    Login / Sign Up
                  </motion.button>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <a 
                    href={`tel:${PHONE_NUMBERS.call}`} 
                    className="flex items-center space-x-3 px-4 py-2 text-gray-600 hover:text-orange-600 transition-colors text-sm"
                    onClick={onToggleMobileMenu}
                  >
                    <FontAwesomeIcon icon={faPhone} className="text-orange-500" />
                    <span>Call Us: {PHONE_NUMBERS.call}</span>
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
});

// Enhanced Hero Section with Swiper
const HeroSection = React.memo(({ user }) => {
  const heroSlides = [
    {
      image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      title: "Delicious Burgers",
      subtitle: "Fresh, juicy, and made to order"
    },
    {
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      title: "Amazing Pizzas",
      subtitle: "Crispy crust with premium toppings"
    },
    {
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      title: "Fast Delivery",
      subtitle: "Hot and fresh at your doorstep"
    }
  ];

  return (
    <section className="relative h-screen overflow-hidden mt-0">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation
        loop={true}
        className="h-full w-full"
      >
        {heroSlides.map((slide, index) => (
          <SwiperSlide key={index}>
            <div 
              className="h-full w-full bg-cover bg-center relative"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="relative z-10 flex items-center justify-center h-full">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="text-center text-white px-4"
                >
                  <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-4"
                  >
                    {slide.title}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-xl sm:text-2xl mb-8 text-orange-200"
                  >
                    {slide.subtitle}
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}
                      className="bg-orange-500 text-white font-bold px-8 py-4 rounded-2xl hover:bg-orange-600 transition-all duration-300 shadow-2xl text-lg"
                    >
                      Order Now
                    </motion.button>
                    {!user && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.location.href = '/userlogin'}
                        className="bg-transparent border-2 border-white text-white font-bold px-8 py-4 rounded-2xl hover:bg-white hover:text-orange-500 transition-all duration-300 text-lg"
                      >
                        Login Now
                      </motion.button>
                    )}
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-white text-center"
        >
          <div className="text-sm mb-2">Scroll Down</div>
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-white rounded-full mt-2"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
});

// Enhanced Products Section with Featured Carousel
const ProductsSection = React.memo(({
  products,
  allProducts,
  searchQuery,
  onSearchClear,
  onRefresh,
  isRefreshing,
  onAddToCart,
  debugInfo,
  user
}) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const featuredProducts = products.slice(0, 8); // Show first 8 as featured

  return (
    <main id="products-section" className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 lg:py-16">
      <motion.div
        ref={ref}
        initial="initial"
        animate={inView ? "animate" : "initial"}
        variants={fadeInUp}
        className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4"
      >
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Our Menu</h2>
          {!user && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-semibold"
            >
              Login to order
            </motion.span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600 hidden sm:block">
            {allProducts.length} products available
          </span>
        </div>
      </motion.div>

      {/* Featured Products Carousel */}
      {products.length > 0 && (
        <motion.div
          initial="initial"
          animate={inView ? "animate" : "initial"}
          variants={fadeInUp}
          className="mb-12"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Featured Items</h3>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="custom-swiper-buttons flex space-x-2"
            >
              <button className="swiper-button-prev-custom bg-orange-500 text-white p-2 rounded-lg">
                ‹
              </button>
              <button className="swiper-button-next-custom bg-orange-500 text-white p-2 rounded-lg">
                ›
              </button>
            </motion.div>
          </div>

          <Swiper
            modules={[Navigation]}
            navigation={{
              nextEl: '.swiper-button-next-custom',
              prevEl: '.swiper-button-prev-custom',
            }}
            breakpoints={{
              320: { slidesPerView: 1, spaceBetween: 10 },
              640: { slidesPerView: 2, spaceBetween: 20 },
              768: { slidesPerView: 3, spaceBetween: 30 },
              1024: { slidesPerView: 4, spaceBetween: 30 },
            }}
            className="pb-10"
          >
            {featuredProducts.map((product) => (
              <SwiperSlide key={product.id}>
                <ProductCard
                  product={product}
                  onAddToCart={onAddToCart}
                  user={user}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      )}

      {/* All Products Grid */}
      {products.length === 0 && allProducts.length === 0 ? (
        <motion.div
          initial="initial"
          animate={inView ? "animate" : "initial"}
          variants={fadeInUp}
          className="text-center py-8 sm:py-12"
        >
          <div className="text-gray-400 text-4xl sm:text-6xl mb-4 sm:mb-6">🍕</div>
          <p className="text-gray-500 text-lg sm:text-xl mb-4">Loading products...</p>
          <p className="text-gray-400 text-sm">{debugInfo}</p>
        </motion.div>
      ) : products.length === 0 ? (
        <motion.div
          initial="initial"
          animate={inView ? "animate" : "initial"}
          variants={fadeInUp}
          className="text-center py-8 sm:py-12"
        >
          <p className="text-gray-500 text-lg sm:text-xl">No products found. Try a different search term.</p>
          {searchQuery && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSearchClear}
              className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition text-sm sm:text-base"
            >
              Clear search
            </motion.button>
          )}
        </motion.div>
      ) : (
        <>
          {searchQuery && (
            <motion.div
              initial="initial"
              animate={inView ? "animate" : "initial"}
              variants={fadeInUp}
              className="mb-6 sm:mb-8 text-center"
            >
              <p className="text-gray-600 text-base sm:text-lg">
                Showing results for: <span className="font-semibold text-orange-600">"{searchQuery}"</span>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onSearchClear}
                  className="ml-3 sm:ml-4 bg-orange-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-orange-600 transition text-sm sm:text-base"
                >
                  Clear search
                </motion.button>
              </p>
            </motion.div>
          )}
          
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate={inView ? "animate" : "initial"}
            className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
          >
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                user={user}
              />
            ))}
          </motion.div>
        </>
      )}
    </main>
  );
});

// Enhanced Footer with animations
const Footer = React.memo(() => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.footer
      ref={ref}
      initial="initial"
      animate={inView ? "animate" : "initial"}
      variants={fadeInUp}
      className="bg-orange-500 text-white py-8 sm:py-12"
    >
      <div className="container mx-auto px-4">
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
        >
          <motion.div variants={scaleIn} className="text-center md:text-left">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center justify-center md:justify-start space-x-2">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <FontAwesomeIcon icon={faHamburger} />
              </motion.div>
              <span>FastFood</span>
            </h3>
            <p className="text-orange-100 text-sm sm:text-base">Delicious fast food delivered to your doorstep. Quality ingredients, amazing taste, exceptional service.</p>
          </motion.div>
          <motion.div variants={scaleIn} className="text-center md:text-left">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Quick Links</h3>
            <div className="space-y-2 text-orange-100 text-sm sm:text-base">
              <motion.button 
                whileHover={{ x: 5 }}
                onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="hover:text-white transition-colors"
              >
                Browse Menu
              </motion.button>
              <motion.button 
                whileHover={{ x: 5 }}
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                className="hover:text-white transition-colors"
              >
                Our Services
              </motion.button>
              <motion.button 
                whileHover={{ x: 5 }}
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                className="hover:text-white transition-colors"
              >
                Our Story
              </motion.button>
            </div>
          </motion.div>
          <motion.div variants={scaleIn} className="text-center md:text-left">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Connect With Us</h3>
            <div className="flex justify-center md:justify-start space-x-4">
              <motion.a 
                whileHover={{ scale: 1.2, rotate: 360 }}
                href="https://wa.me/250788295765" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white p-2 sm:p-3 rounded-full hover:bg-white transition text-orange-500 font-bold"
              >
                <FontAwesomeIcon icon={faWhatsapp} />
              </motion.a>
              <motion.a 
                whileHover={{ scale: 1.2 }}
                href={`tel:${PHONE_NUMBERS.call}`}
                className="bg-orange-500 p-2 sm:p-3 rounded-full transition shadow-xl border hover:scale-110"
              >
                <FontAwesomeIcon icon={faPhone} />
              </motion.a>
              <motion.a 
                whileHover={{ scale: 1.2 }}
                href="mailto:gashugiarnaud@gmail.com"
                className="bg-amber-500 p-2 sm:p-3 rounded-full transition hover:scale-110 shadow-lg"
              >
                <FontAwesomeIcon icon={faEnvelope} />
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Creator Information */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-orange-400"
        >
          <div className="text-center text-orange-200 text-sm sm:text-base">
            <p className="mb-2">
              <span className="font-semibold">Created by I. Bonheur</span>
            </p>
            <p className="mb-3">
              Want a website like this? Visit my portfolio:
            </p>
            <motion.a 
              whileHover={{ scale: 1.05 }}
              href="https://ibonheurportifolio.netlify.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-white/20 hover:bg-white/30 text-orange-100 hover:text-white px-4 py-2 rounded-lg transition-all duration-300 font-medium text-xs sm:text-sm backdrop-blur-sm"
            >
              🌐 ibonheurportifolio.netlify.app
            </motion.a>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="border-t border-orange-400 mt-4 sm:mt-6 pt-4 sm:pt-6 text-center text-orange-200 text-sm sm:text-base"
        >
          <p>&copy; {new Date().getFullYear()} FastFood. All rights reserved. | Delivering happiness one meal at a time 🍔</p>
        </motion.div>
      </div> 
    </motion.footer>
  );
});

// Enhanced Contact Section
const ContactSection = React.memo(() => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.section
      ref={ref}
      initial="initial"
      animate={inView ? "animate" : "initial"}
      variants={fadeInUp}
      className="bg-white py-8 sm:py-12 lg:py-16 border-t border-gray-200"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
            Get In Touch
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            We're here to serve you the best fast food experience. Contact us anytime!
          </p>
        </div>
        
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate={inView ? "animate" : "initial"}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12"
        >
          {/* Contact Info */}
          <motion.div variants={scaleIn} className="text-center lg:text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center justify-center lg:justify-start space-x-2">
              <motion.div
                whileHover={{ scale: 1.2 }}
              >
                <FontAwesomeIcon icon={faPhone} className="text-orange-500" />
              </motion.div>
              <span>Contact Us</span>
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <motion.a 
                whileHover={{ x: 5 }}
                href="https://wa.me/250788295765" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center lg:justify-start space-x-3 text-green-600 hover:text-green-700 transition-colors"
              >
                <FontAwesomeIcon icon={faWhatsapp} className="text-xl" />
                <div>
                  <span className="font-semibold text-sm sm:text-base">+250 788 295 765</span>
                  <p className="text-sm text-gray-500">WhatsApp</p>
                </div>
              </motion.a>
              <motion.a 
                whileHover={{ x: 5 }}
                href={`tel:${PHONE_NUMBERS.call}`}
                className="flex items-center justify-center lg:justify-start space-x-3 text-orange-500 hover:text-orange-700 transition-colors"
              >
                <FontAwesomeIcon icon={faPhone} className="text-lg" />
                <div>
                  <span className="font-semibold text-sm sm:text-base">{PHONE_NUMBERS.call}</span>
                  <p className="text-sm text-gray-500">Direct Call</p>
                </div>
              </motion.a>
              <motion.a 
                whileHover={{ x: 5 }}
                href="mailto:gashugiarnaud@gmail.com"
                className="flex items-center justify-center lg:justify-start space-x-3 text-orange-500 hover:text-orange-600 transition-colors"
              >
                <FontAwesomeIcon icon={faEnvelope} className="text-lg" />
                <div>
                  <span className="font-semibold text-sm sm:text-base">gashugiarnaud@gmail.com</span>
                  <p className="text-sm text-gray-500">Email</p>
                </div>
              </motion.a>
              <div className="flex items-center justify-center lg:justify-start space-x-3 text-gray-600">
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                <span className="text-sm sm:text-base">Kigali, Rwanda</span>
              </div>
            </div>
          </motion.div>

          {/* Opening Hours */}
          <motion.div variants={scaleIn} className="text-center lg:text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center justify-center lg:justify-start space-x-2">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <FontAwesomeIcon icon={faClock} className="text-orange-500" />
              </motion.div>
              <span>Opening Hours</span>
            </h3>
            <div className="space-y-3 text-gray-600">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-orange-50 p-3 sm:p-4 rounded-2xl"
              >
                <p className="font-semibold text-orange-600 text-sm sm:text-base">Monday - Sunday</p>
                <p className="text-sm sm:text-base">8:00 AM - 11:00 PM</p>
              </motion.div>
              <p className="text-xs sm:text-sm text-orange-500 font-semibold">🚚 24/7 Delivery Available</p>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={scaleIn} className="text-center lg:text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Quick Order</h3>
            <div className="space-y-3">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full bg-orange-500 text-white py-3 rounded-xl hover:bg-orange-600 transition font-semibold text-sm sm:text-base"
              >
                Browse Menu
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full bg-white border border-orange-500 text-orange-500 py-3 rounded-xl hover:bg-orange-50 transition font-semibold text-sm sm:text-base"
              >
                Our Services
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
});

// Enhanced Cart Modal with animations
const CartModal = React.memo(({
  cart,
  onClose,
  onUpdateQuantity,
  onRemoveFromCart,
  onCheckout,
  onWhatsAppOrder,
  cartSummary,
  formatPrice,
  user
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm"
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="relative bg-white/95 backdrop-blur-md rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/20"
    >
      <div className="bg-orange-500 p-4 sm:p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Your Cart</h2>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="text-white hover:text-orange-200 p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-lg sm:text-xl" />
          </motion.button>
        </div>
        {cartSummary.itemCount > 0 && (
          <p className="text-orange-100 mt-2 text-sm">
            {cartSummary.itemCount} item{cartSummary.itemCount !== 1 ? 's' : ''} in cart
          </p>
        )}
      </div>
      
      <div className="p-4 sm:p-6 max-h-96 overflow-y-auto">
        {cart.length === 0 ? (
          <EmptyCart onClose={onClose} user={user} />
        ) : (
          <AnimatePresence>
            <div className="space-y-3 sm:space-y-4">
              {cart.map(item => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemove={onRemoveFromCart}
                  user={user}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
      
      {cart.length > 0 && (
        <CartFooter
          onClose={onClose}
          onCheckout={onCheckout}
          onWhatsAppOrder={onWhatsAppOrder}
          cartSummary={cartSummary}
          formatPrice={formatPrice}
          user={user}
        />
      )}
    </motion.div>
  </motion.div>
));

// Enhanced Empty Cart Component
const EmptyCart = React.memo(({ onClose, user }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-8 sm:py-12"
  >
    <motion.div
      animate={{ 
        scale: [1, 1.1, 1],
        rotate: [0, 5, -5, 0]
      }}
      transition={{ duration: 2, repeat: Infinity }}
      className="text-gray-400 text-4xl sm:text-6xl mb-4 sm:mb-6"
    >
      🛒
    </motion.div>
    <p className="text-gray-500 text-lg sm:text-xl mb-4 sm:mb-6">
      {user ? 'Your cart is empty' : 'Please login to add items to cart'}
    </p>
    <motion.button 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={user ? onClose : () => window.location.href = '/userlogin'}
      className="bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition text-base sm:text-lg font-semibold"
    >
      {user ? 'Continue Shopping' : 'Go to Login'}
    </motion.button>
  </motion.div>
));

// Enhanced Cart Footer Component
const CartFooter = React.memo(({
  onClose,
  onCheckout,
  onWhatsAppOrder,
  cartSummary,
  formatPrice,
  user
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="border-t border-gray-200/50 p-4 sm:p-6 bg-white/80 backdrop-blur-sm"
  >
    <div className="flex justify-between items-center text-lg sm:text-xl mb-4 sm:mb-6">
      <span className="font-bold text-gray-800">Total Amount:</span>
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="font-bold text-green-600 text-xl sm:text-2xl"
      >
        {formatPrice(cartSummary.total)}
      </motion.span>
    </div>
    
    {!user ? (
      <div className="text-center space-y-3">
        <p className="text-gray-600 mb-4">Please login to complete your order</p>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.href = '/userlogin'}
          className="w-full bg-orange-500 text-white py-4 rounded-xl hover:bg-orange-600 transition font-bold text-lg"
        >
          Login to Order
        </motion.button>
      </div>
    ) : (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="bg-gray-500 text-white py-3 rounded-xl hover:bg-gray-600 transition font-semibold text-sm sm:text-base backdrop-blur-sm"
          >
            Continue Shopping
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCheckout}
            className="bg-orange-500 text-white py-3 rounded-xl hover:bg-orange-600 transition flex items-center justify-center space-x-2 font-bold text-sm sm:text-base backdrop-blur-sm"
          >
            <FontAwesomeIcon icon={faCreditCard} />
            <span>Checkout</span>
          </motion.button>
        </div>
      </>
    )}
  </motion.div>
));

// Enhanced Checkout Modal Component
const CheckoutModal = React.memo(({
  customerInfo,
  onCustomerInfoChange,
  onClose,
  onSubmit,
  onWhatsAppOrder,
  isLoading,
  cartSummary,
  formatPrice,
  user
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm"
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="relative bg-white/95 backdrop-blur-md rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/20"
    >
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Complete Your Order</h2>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-lg sm:text-xl" />
          </motion.button>
        </div>
        
        <CheckoutForm
          customerInfo={customerInfo}
          onCustomerInfoChange={onCustomerInfoChange}
          onSubmit={onSubmit}
          onWhatsAppOrder={onWhatsAppOrder}
          isLoading={isLoading}
          cartSummary={cartSummary}
          formatPrice={formatPrice}
          user={user}
        />
      </div>
    </motion.div>
  </motion.div>
));

// Enhanced Checkout Form Component
const CheckoutForm = React.memo(({
  customerInfo,
  onCustomerInfoChange,
  onSubmit,
  onWhatsAppOrder,
  isLoading,
  cartSummary,
  formatPrice,
  user
}) => (
  <motion.form
    initial="initial"
    animate="animate"
    variants={staggerContainer}
    onSubmit={onSubmit}
    className="space-y-4"
  >
    {!user ? (
      <motion.div
        variants={scaleIn}
        className="text-center py-8"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-gray-400 text-4xl mb-4"
        >
          🔒
        </motion.div>
        <p className="text-gray-600 text-lg mb-6">Please login to complete your order</p>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => window.location.href = '/userlogin'}
          className="w-full bg-orange-500 text-white py-4 rounded-xl hover:bg-orange-600 transition font-bold text-lg"
        >
          Login to Continue
        </motion.button>
      </motion.div>
    ) : (
      <>
        <motion.div variants={scaleIn}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-sm sm:text-base"
            value={customerInfo.name}
            onChange={(e) => onCustomerInfoChange({...customerInfo, name: e.target.value})}
            placeholder="Enter your full name"
          />
        </motion.div>
        
        <motion.div variants={scaleIn}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-sm sm:text-base"
            value={customerInfo.phone}
            onChange={(e) => onCustomerInfoChange({...customerInfo, phone: e.target.value})}
            placeholder="Enter your phone number"
          />
        </motion.div>
        
        <motion.div variants={scaleIn}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Delivery Address *
          </label>
          <textarea
            required
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none transition-all duration-300 bg-white/80 backdrop-blur-sm text-sm sm:text-base"
            value={customerInfo.address}
            onChange={(e) => onCustomerInfoChange({...customerInfo, address: e.target.value})}
            placeholder="Enter your complete delivery address"
          />
        </motion.div>
        
        <motion.div
          variants={scaleIn}
          className="border-t border-gray-200 pt-4"
        >
          <div className="flex justify-between items-center text-lg mb-4">
            <span className="font-bold text-gray-800">Order Total:</span>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="font-bold text-green-600 text-xl"
            >
              {formatPrice(cartSummary.total)}
            </motion.span>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 text-white py-4 rounded-xl hover:bg-orange-600 transition flex items-center justify-center space-x-3 font-bold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="rounded-full h-6 w-6 border-b-2 border-white"
              ></motion.div>
            ) : (
              <>
                <FontAwesomeIcon icon={faCreditCard} />
                <span>Place Order - {formatPrice(cartSummary.total)}</span>
              </>
            )}
          </motion.button>
        </motion.div>
      </>
    )}
  </motion.form>
));

export default function HomePage() {
  const { user, login, logout } = useUser();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.username || "",
    phone: "",
    address: ""
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  // Memoized functions
  const fetchProducts = useCallback(async () => {
    try {
      console.log("Fetching products...");
      const { data, error } = await supabase.from("products").select("*");
      
      if (error) {
        console.error("Supabase error:", error);
        setDebugInfo(`Error: ${error.message}`);
        return;
      }
      
      console.log("Products fetched:", data?.length || 0);
      setProducts(data || []);
      setDebugInfo(`Loaded ${data?.length || 0} products`);
      
    } catch (error) {
      console.error("Error fetching products:", error);
      setDebugInfo(`Fetch error: ${error.message}`);
    }
  }, []);

  const refreshProducts = useCallback(async () => {
    setIsRefreshing(true);
    await fetchProducts();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [fetchProducts]);

  const addToCart = useCallback((product) => {
    if (!user) {
      window.location.href = '/userlogin';
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
        total_amount: product.total_amount
      }];
    });
    setShowCart(true);
  }, [user]);

  const removeFromCart = useCallback((productId) => {
    if (!user) {
      window.location.href = '/userlogin';
      return;
    }
    setCart(prev => prev.filter(item => item.id !== productId));
  }, [user]);

  const updateQuantity = useCallback((productId, qty) => { 
    if (!user) {
      window.location.href = '/userlogin';
      return;
    }
    if (qty < 1) {
      removeFromCart(productId);
      return;
    } 
    setCart(prev => prev.map(item => 
      item.id === productId 
        ? { ...item, quantity: qty } 
        : item
    ));
  }, [removeFromCart, user]);

  // Memoized calculations
  const calculateTotal = useCallback(() => {
    return cart.reduce((total, item) => total + (item.total_amount * item.quantity), 0);
  }, [cart]);

  const calculateItemCount = useCallback(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  // Memoized filtered products
  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return products.filter(p => 
      p.product_name?.toLowerCase().includes(query) || 
      p.description?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const handleCheckout = useCallback(async (e) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/userlogin';
      return;
    }

    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      alert("Please fill in all required fields");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty");
      return;
    }

    setIsLoading(true);
    
    try {
      const orderData = {
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_address: customerInfo.address,
        cart: cart,
        total: calculateTotal()
      };

      console.log("Sending order:", orderData);

      const res = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || `HTTP error! status: ${res.status}`);
      }

      setOrderSuccess(true);
      setCart([]);
      setShowCheckout(false);
      setCustomerInfo({ name: user?.username || "", phone: "", address: "" });
      
      setTimeout(() => setOrderSuccess(false), 5000);

    } catch (err) {
      console.error("Checkout error:", err);
      alert(`Failed to place order: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [customerInfo, cart, calculateTotal, user]);

  const handleWhatsAppOrder = useCallback(() => {
    if (!user) {
      window.location.href = '/userlogin';
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty");
      return;
    }

    const phoneNumber = PHONE_NUMBERS.whatsapp;
    const itemsText = cart.map(item => 
      `${item.product_name} x ${item.quantity} - ${formatPrice(item.total_amount * item.quantity)}`
    ).join('%0A');
    
    const totalText = `Total: ${formatPrice(calculateTotal())}`;
    const message = `Hello! I would like to order:%0A%0A${itemsText}%0A%0A${totalText}%0A%0APlease contact me for delivery details.`;
    
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  }, [cart, calculateTotal, user]);

  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat("rw-RW", { 
      style: "currency", 
      currency: "RWF" 
    }).format(price);
  }, []);

  const handleLoginLogout = () => {
    if (user) {
      logout();
      setCart([]);
    } else {
      window.location.href = '/userlogin';
    }
  };

  // Effects
  useEffect(() => { 
    console.log("Component mounted, fetching products...");
    fetchProducts(); 
  }, [fetchProducts]);

  // Memoized cart summary
  const cartSummary = useMemo(() => ({
    itemCount: calculateItemCount(),
    total: calculateTotal()
  }), [calculateItemCount, calculateTotal]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed bottom-4 left-4 bg-black text-white p-2 rounded text-xs z-50 hidden sm:block"
        >
          {debugInfo || "Loading..."}
        </motion.div>
      )}

      {/* Success Message */}
      <AnimatePresence>
        {orderSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 mx-4 text-sm sm:text-base sm:px-6"
            style={{ marginTop: '1rem' }}
          >
            ✅ Order placed successfully! We'll contact you soon.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <Header 
        user={user}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleCart={() => setShowCart(!showCart)}
        onRefresh={refreshProducts}
        isRefreshing={isRefreshing}
        cartItemCount={cartSummary.itemCount}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onLoginLogout={handleLoginLogout}
      />

      {/* Main Content with padding for fixed header */}
      <div className="pt-16 sm:pt-20">
        
        {/* Shopping Cart */}
        <AnimatePresence>
          {showCart && (
            <CartModal
              cart={cart}
              onClose={() => setShowCart(false)}
              onUpdateQuantity={updateQuantity}
              onRemoveFromCart={removeFromCart}
              onCheckout={() => {
                setShowCart(false);
                setShowCheckout(true);
              }}
              onWhatsAppOrder={handleWhatsAppOrder}
              cartSummary={cartSummary}
              formatPrice={formatPrice}
              user={user}
            />
          )}
        </AnimatePresence>

        {/* Checkout Modal */}
        <AnimatePresence>
          {showCheckout && (
            <CheckoutModal
              customerInfo={customerInfo}
              onCustomerInfoChange={setCustomerInfo}
              onClose={() => setShowCheckout(false)}
              onSubmit={handleCheckout}
              onWhatsAppOrder={handleWhatsAppOrder}
              isLoading={isLoading}
              cartSummary={cartSummary}
              formatPrice={formatPrice}
              user={user}
            />
          )}
        </AnimatePresence>

        {/* Hero Section */}
        <HeroSection user={user} />

        {/* About Section */}
        <AboutSection />

        {/* Services Section */}
        <ServicesSection />

        {/* Products Section */}
       // Enhanced Products Section with Featured Carousel - COMPLETELY FIXED DUPLICATION
const ProductsSection = React.memo(({
  products,
  allProducts,
  searchQuery,
  onSearchClear,
  onRefresh,
  isRefreshing,
  onAddToCart,
  debugInfo,
  user
}) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const featuredProducts = products.slice(0, 8); // Show first 8 as featured
  const remainingProducts = products.slice(8); // Products not in featured section

  // Check if we should show featured section
  const shouldShowFeatured = products.length > 8;

  return (
    <main id="products-section" className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 lg:py-16">
      <motion.div
        ref={ref}
        initial="initial"
        animate={inView ? "animate" : "initial"}
        variants={fadeInUp}
        className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4"
      >
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Our Menu</h2>
          {!user && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-semibold"
            >
              Login to order
            </motion.span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600 hidden sm:block">
            {allProducts.length} products available
          </span>
        </div>
      </motion.div>

      {/* Featured Products Carousel - Only show when we have more than 8 products */}
      {shouldShowFeatured && (
        <motion.div
          initial="initial"
          animate={inView ? "animate" : "initial"}
          variants={fadeInUp}
          className="mb-12"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Featured Items</h3>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="custom-swiper-buttons flex space-x-2"
            >
              <button className="swiper-button-prev-custom bg-orange-500 text-white p-2 rounded-lg">
                ‹
              </button>
              <button className="swiper-button-next-custom bg-orange-500 text-white p-2 rounded-lg">
                ›
              </button>
            </motion.div>
          </div>

          <Swiper
            modules={[Navigation]}
            navigation={{
              nextEl: '.swiper-button-next-custom',
              prevEl: '.swiper-button-prev-custom',
            }}
            breakpoints={{
              320: { slidesPerView: 1, spaceBetween: 10 },
              640: { slidesPerView: 2, spaceBetween: 20 },
              768: { slidesPerView: 3, spaceBetween: 30 },
              1024: { slidesPerView: 4, spaceBetween: 30 },
            }}
            className="pb-10"
          >
            {featuredProducts.map((product) => (
              <SwiperSlide key={product.id}>
                <ProductCard
                  product={product}
                  onAddToCart={onAddToCart}
                  user={user}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      )}

      {/* All Products Grid */}
      {products.length === 0 && allProducts.length === 0 ? (
        <motion.div
          initial="initial"
          animate={inView ? "animate" : "initial"}
          variants={fadeInUp}
          className="text-center py-8 sm:py-12"
        >
          <div className="text-gray-400 text-4xl sm:text-6xl mb-4 sm:mb-6">🍕</div>
          <p className="text-gray-500 text-lg sm:text-xl mb-4">Loading products...</p>
          <p className="text-gray-400 text-sm">{debugInfo}</p>
        </motion.div>
      ) : products.length === 0 ? (
        <motion.div
          initial="initial"
          animate={inView ? "animate" : "initial"}
          variants={fadeInUp}
          className="text-center py-8 sm:py-12"
        >
          <p className="text-gray-500 text-lg sm:text-xl">No products found. Try a different search term.</p>
          {searchQuery && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSearchClear}
              className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition text-sm sm:text-base"
            >
              Clear search
            </motion.button>
          )}
        </motion.div>
      ) : (
        <>
          {searchQuery && (
            <motion.div
              initial="initial"
              animate={inView ? "animate" : "initial"}
              variants={fadeInUp}
              className="mb-6 sm:mb-8 text-center"
            >
              <p className="text-gray-600 text-base sm:text-lg">
                Showing results for: <span className="font-semibold text-orange-600">"{searchQuery}"</span>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onSearchClear}
                  className="ml-3 sm:ml-4 bg-orange-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-orange-600 transition text-sm sm:text-base"
                >
                  Clear search
                </motion.button>
              </p>
            </motion.div>
          )}

          {/* Show "All Menu Items" heading only when we have featured section */}
          {shouldShowFeatured && remainingProducts.length > 0 && (
            <motion.h3
              initial="initial"
              animate={inView ? "animate" : "initial"}
              variants={fadeInUp}
              className="text-xl sm:text-2xl font-bold text-gray-800 mb-6"
            >
              All Menu Items
            </motion.h3>
          )}
          
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate={inView ? "animate" : "initial"}
            className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
          >
            {/* 
              NO DUPLICATION: 
              - If featured section is shown: only show remaining products (products 9+)
              - If no featured section: show all products
            */}
            {shouldShowFeatured 
              ? remainingProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                    user={user}
                  />
                ))
              : products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                    user={user}
                  />
                ))
            }
          </motion.div>
        </>
      )}
    </main>
  );
});
        {/* Contact & Info Section */}
        <ContactSection />

        {/* Footer */}
        <Footer />
      </div>

      {/* Add custom animation and responsive utilities */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        @media (min-width: 475px) {
          .xs\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        /* Custom Swiper Styles */
        .swiper-pagination-bullet {
          background: white;
          opacity: 0.6;
        }
        
        .swiper-pagination-bullet-active {
          background: #f97316;
          opacity: 1;
        }
        
        .swiper-button-next, .swiper-button-prev {
          color: #f97316;
        }
        
        .swiper-button-next:after, .swiper-button-prev:after {
          font-size: 1.5rem;
        }

        /* Ensure modals are above fixed header */
        .fixed.inset-0 {
          z-index: 60;
        }

        /* Mobile search visibility */
        @media (max-width: 767px) {
          .mobile-search {
            display: block !important;
          }
        }

        /* Improve touch targets on mobile */
        @media (max-width: 768px) {
          button, a {
            min-height: 44px;
            min-width: 44px;
          }
        }

        /* Prevent horizontal scroll */
        body {
          overflow-x: hidden;
        }
      `}</style>
    </div>
  );
}
