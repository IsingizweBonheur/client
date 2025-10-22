import React, { useEffect, useState } from "react";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSignOutAlt, faUserShield, faShoppingCart,
  faChartBar, faEdit, faTrash, faEye, 
  faCheckCircle, faTimesCircle, faClock,
  faBox, faHome, faBars, faTimes, faRefresh,
  faSearch, faFilter, faMoneyBillWave,
  faHamburger, faSave, faCancel, faUsers,
  faCog, faLock, faEnvelope, faUser,
  faPlus, faUpload, faList, faDatabase,
  faReceipt, faUserCircle, faStore,
  faImage, faLink, faCloudUpload,
  faKey, faShieldAlt, faEyeSlash, faEye as faEyeOpen,
  faEllipsisV, faEllipsisH
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currency, setCurrency] = useState("FRW");
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showMobileActions, setShowMobileActions] = useState(null);
  
  const [profileData, setProfileData] = useState({
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false
  });
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    is_available: true
  });

  const [dashboardStats, setDashboardStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    totalProducts: 0
  });

  const exchangeRates = {
    FRW: 1,
    USD: 0.00081,
    EUR: 0.00074,
  };

  const BACKEND_URL = API_URL;

  // Enhanced authentication headers
  const getAuthHeaders = async () => {
    const token = await getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      if (!mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, sidebarOpen]);

  const getImageUrl = (url) => {
    if (!url) return "https://via.placeholder.com/300x200/FFA500/FFFFFF?text=No+Image";
    
    if (url.startsWith('http')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}t=${Date.now()}`;
    }
    
    if (url.startsWith('/uploads/')) {
      return `${BACKEND_URL}${url}?t=${Date.now()}`;
    }
    
    return `${BACKEND_URL}${url.startsWith('/') ? url : '/' + url}?t=${Date.now()}`;
  };

  const uploadImage = async (file) => {
    try {
      setUploading(true);
      
      const token = await getToken();
      if (!token) {
        toast.error("Authentication required");
        return null;
      }

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', response.status, errorText);
        
        if (response.status === 404) {
          throw new Error("Image upload endpoint not available.");
        }
        
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      toast.success("Image uploaded successfully");
      return result.imageUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(`Failed to upload image: ${error.message}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, GIF, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        navigate("/login");
      } else {
        setUser(data.user);
        setProfileData(prev => ({ 
          ...prev, 
          email: data.user.email 
        }));
        fetchAllData();
      }
    };
    checkSession();
  }, [navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOrders(),
        fetchProducts(),
        fetchDashboardStats()
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  };

  const fetchOrders = async () => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        headers: headers
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Authentication failed. Please login again.");
          await supabase.auth.signOut();
          navigate("/login");
          return;
        }
        
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch orders' }));
        throw new Error(errorData.message || `Failed to fetch orders: ${response.status}`);
      }
      
      const ordersData = await response.json();
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error(error.message || "Failed to fetch orders");
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${BACKEND_URL}/api/dashboard/stats`, {
        headers: headers
      });

      if (!response.ok) {
        const fallbackStats = {
          totalOrders: orders.length,
          pendingOrders: orders.filter(o => o.status === 'pending').length,
          completedOrders: orders.filter(o => o.status === 'completed').length,
          totalRevenue: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
          totalProducts: products.length
        };
        setDashboardStats(fallbackStats);
        return;
      }
      
      const stats = await response.json();
      setDashboardStats(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      const fallbackStats = {
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        totalRevenue: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
        totalProducts: products.length
      };
      setDashboardStats(fallbackStats);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/products`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch products' }));
        throw new Error(errorData.message || `Failed to fetch products: ${response.status}`);
      }
      
      const productsData = await response.json();
      
      const mappedProducts = productsData.map(product => ({
        id: product.id,
        product_name: product.name || product.product_name,
        name: product.name || product.product_name,
        description: product.description,
        price: product.price || product.total_amount,
        total_amount: product.price || product.total_amount,
        image_url: product.image_url,
        is_available: product.is_available !== undefined ? product.is_available : true
      }));
      
      setProducts(mappedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error(error.message || "Failed to fetch products");
    }
  };

  const fetchOrderItems = async (orderId) => {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${BACKEND_URL}/api/orders/${orderId}/items`, {
        headers: headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch order items' }));
        throw new Error(errorData.message || 'Failed to fetch order items');
      }
      
      const itemsData = await response.json();
      setOrderItems(itemsData);
      setSelectedOrder(orderId);
      
      if (isMobile) {
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error("Error fetching order items:", error);
      toast.error(error.message || "Failed to fetch order items");
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${BACKEND_URL}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update order status' }));
        throw new Error(errorData.message || 'Failed to update order status');
      }
      
      await fetchOrders();
      await fetchDashboardStats();
      toast.success(`Order status updated to ${newStatus}`);
      setShowMobileActions(null);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error(error.message || "Failed to update order status");
    }
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    
    if (!productForm.name || !productForm.description || !productForm.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const headers = await getAuthHeaders();
      let imageUrl = productForm.image_url;

      if (selectedFile) {
        const uploadedUrl = await uploadImage(selectedFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          return;
        }
      }

      const productData = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        image_url: imageUrl,
        is_available: productForm.is_available
      };

      let response;
      if (editingProduct) {
        response = await fetch(`${BACKEND_URL}/api/products/${editingProduct}`, {
          method: 'PUT',
          headers: headers,
          body: JSON.stringify(productData)
        });
      } else {
        response = await fetch(`${BACKEND_URL}/api/products`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(productData)
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `Failed to ${editingProduct ? 'update' : 'create'} product` 
        }));
        throw new Error(errorData.message || `Failed to ${editingProduct ? 'update' : 'create'} product`);
      }
      
      await response.json();
      
      await fetchProducts();
      await fetchDashboardStats();
      
      setShowProductModal(false);
      resetProductForm();
      
      toast.success(`Product ${editingProduct ? 'updated' : 'added'} successfully`);
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(error.message || `Failed to ${editingProduct ? 'update' : 'create'} product`);
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;
    
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete product' }));
        throw new Error(errorData.message || 'Failed to delete product');
      }
      
      await fetchProducts();
      await fetchDashboardStats();
      toast.success("Product deleted successfully");
      setShowMobileActions(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(error.message || "Failed to delete product");
    }
  };

  const updateCredentials = async (e) => {
    e.preventDefault();
    
    if (profileData.newPassword) {
      if (profileData.newPassword.length < 6) {
        toast.error("Password must be at least 6 characters long");
        return;
      }
      
      if (profileData.newPassword !== profileData.confirmPassword) {
        toast.error("New passwords don't match");
        return;
      }

      if (!profileData.currentPassword) {
        toast.error("Please enter your current password to change password");
        return;
      }
    }

    setUpdatingProfile(true);

    try {
      let updateData = {
        email: profileData.email
      };

      if (profileData.newPassword) {
        updateData.password = profileData.newPassword;
      }

      const { data: updatedUser, error } = await supabase.auth.updateUser(updateData);

      if (error) throw error;

      if (updatedUser && updatedUser.user) {
        setUser(updatedUser.user);
        toast.success("Profile updated successfully");
        
        setProfileData({
          email: updatedUser.user.email,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
          twoFactorEnabled: profileData.twoFactorEnabled
        });
        
        setShowProfileModal(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const startEditingProduct = (product) => {
    setEditingProduct(product.id);
    setProductForm({ 
      name: product.name || product.product_name,
      description: product.description,
      price: product.price || product.total_amount,
      image_url: product.image_url,
      is_available: product.is_available !== undefined ? product.is_available : true
    });
    
    if (product.image_url) {
      setImagePreview(getImageUrl(product.image_url));
    } else {
      setImagePreview("");
    }
    
    setSelectedFile(null);
    setShowProductModal(true);
    setShowMobileActions(null);
  };

  const startAddingProduct = () => {
    setEditingProduct(null);
    resetProductForm();
    setShowProductModal(true);
  };

  const resetProductForm = () => {
    setProductForm({
      name: "",
      description: "",
      price: "",
      image_url: "",
      is_available: true
    });
    setImagePreview("");
    setSelectedFile(null);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    resetProductForm();
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setProfileData({
      email: user?.email || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      twoFactorEnabled: false
    });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully")
    navigate("/login");
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_phone?.includes(searchTerm) ||
                         order.customer_address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return faClock;
      case "completed": return faCheckCircle;
      case "cancelled": return faTimesCircle;
      default: return faBox;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return `FRW 0`;
    
    const convertedAmount = amount * exchangeRates[currency];
    
    switch (currency) {
      case "FRW":
        return `FRW ${Math.round(convertedAmount).toLocaleString()}`;
      case "USD":
        return `$${convertedAmount.toFixed(2)}`;
      case "EUR":
        return `€${convertedAmount.toFixed(2)}`;
      default:
        return `FRW ${Math.round(amount).toLocaleString()}`;
    }
  };

  const getOrderStatusDistribution = () => {
    const statusCounts = {
      pending: 0,
      completed: 0,
      cancelled: 0
    };
    
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    
    return statusCounts;
  };

  const statusDistribution = getOrderStatusDistribution();

  const ProductImage = ({ src, alt, className = "w-full h-32 object-cover rounded-lg bg-gray-100" }) => {
    const [imgSrc, setImgSrc] = useState(getImageUrl(src));
    const [hasError, setHasError] = useState(false);

    const handleError = () => {
      setHasError(true);
      setImgSrc("https://via.placeholder.com/300x200/FFA500/FFFFFF?text=No+Image");
    };

    const handleLoad = () => {
      setHasError(false);
    };

    return (
      <img
        src={imgSrc}
        alt={alt}
        className={className}
        onError={handleError}
        onLoad={handleLoad}
      />
    );
  };

  const MobileOrderActions = ({ order, onClose }) => (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-end justify-center p-4 lg:hidden">
      <div className="bg-white rounded-t-2xl w-full max-w-md shadow-2xl animate-slide-up">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Order Actions</h3>
            <button onClick={onClose} className="p-2">
              <FontAwesomeIcon icon={faTimes} className="text-gray-500" />
            </button>
          </div>
        </div>
        <div className="p-4 space-y-2">
          <button
            onClick={() => updateOrderStatus(order.id, "completed")}
            className="w-full bg-green-500 text-white py-3 rounded-lg text-sm font-medium"
          >
            Mark as Completed
          </button>
          <button
            onClick={() => updateOrderStatus(order.id, "pending")}
            className="w-full bg-yellow-500 text-white py-3 rounded-lg text-sm font-medium"
          >
            Mark as Pending
          </button>
          <button
            onClick={() => updateOrderStatus(order.id, "cancelled")}
            className="w-full bg-red-500 text-white py-3 rounded-lg text-sm font-medium"
          >
            Cancel Order
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-500 text-white py-3 rounded-lg text-sm font-medium mt-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  const MobileProductActions = ({ product, onClose }) => (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-end justify-center p-4 lg:hidden">
      <div className="bg-white rounded-t-2xl w-full max-w-md shadow-2xl animate-slide-up">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Product Actions</h3>
            <button onClick={onClose} className="p-2">
              <FontAwesomeIcon icon={faTimes} className="text-gray-500" />
            </button>
          </div>
        </div>
        <div className="p-4 space-y-2">
          <button
            onClick={() => {
              startEditingProduct(product);
              onClose();
            }}
            className="w-full bg-orange-500 text-white py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={faEdit} />
            Edit Product
          </button>
          <button
            onClick={() => {
              deleteProduct(product.id);
              onClose();
            }}
            className="w-full bg-red-500 text-white py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={faTrash} />
            Delete Product
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-500 text-white py-3 rounded-lg text-sm font-medium mt-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} 
        w-64 lg:w-20 xl:w-64 bg-white shadow-lg transition-all duration-300 flex flex-col fixed lg:relative h-full z-30
      `}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {(!isMobile || sidebarOpen) && (
              <h1 className="text-xl font-bold text-orange-600 flex items-center gap-2">
                <FontAwesomeIcon icon={faStore} />
                <span className="hidden xl:inline">FastFood Admin</span>
                <span className="xl:hidden">Admin</span>
              </h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
            >
              <FontAwesomeIcon icon={sidebarOpen ? faTimes : faBars} className="text-gray-600" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4">
          {[
            { id: "dashboard", icon: faHome, label: "Dashboard" },
            { id: "orders", icon: faShoppingCart, label: "Orders" },
            { id: "products", icon: faHamburger, label: "Products" },
            { id: "reports", icon: faChartBar, label: "Reports" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile) setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg mb-2 transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-orange-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className="w-5 h-5 flex-shrink-0" />
              {(!isMobile || sidebarOpen) && (
                <span className="font-medium hidden xl:inline">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-3 text-gray-600 mb-2">
            <FontAwesomeIcon icon={faUserShield} className="text-green-500 flex-shrink-0" />
            {(!isMobile || sidebarOpen) && (
              <div className="text-sm min-w-0 hidden xl:block">
                <p className="font-medium truncate" title={user?.email}>
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => {
              setShowProfileModal(true);
              if (isMobile) setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 p-3 text-gray-600 hover:bg-blue-50 hover:text-orange-600 rounded-lg transition-colors mb-2"
          >
            <FontAwesomeIcon icon={faCog} className="flex-shrink-0" />
            {(!isMobile || sidebarOpen) && <span className="hidden xl:inline">Settings</span>}
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="flex-shrink-0" />
            {(!isMobile || sidebarOpen) && <span className="hidden xl:inline">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto lg:ml-0 min-w-0">
        <div className="p-4 lg:p-6">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FontAwesomeIcon icon={faBars} className="text-gray-600" />
            </button>
            <div className="text-center flex-1">
              <h1 className="text-lg font-bold text-gray-800 capitalize">
                {activeTab === "dashboard" && "Dashboard"}
                {activeTab === "orders" && "Orders"}
                {activeTab === "products" && "Products"}
                {activeTab === "reports" && "Reports"}
              </h1>
              <p className="text-xs text-gray-600 truncate">{user?.email}</p>
            </div>
            <div className="w-9"></div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 capitalize">
                {activeTab === "dashboard" && "Dashboard Overview"}
                {activeTab === "orders" && "Order Management"}
                {activeTab === "products" && "Product Management"}
                {activeTab === "reports" && "Sales Reports"}
              </h1>
              <p className="text-gray-600">
                Welcome back, <span className="font-semibold text-orange-600">{user?.email}</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-sm"
              >
                <option value="FRW">FRW 🇷🇼</option>
                <option value="USD">USD 🇺🇸</option>
                <option value="EUR">EUR 🇪🇺</option>
              </select>
              
              <button
                onClick={fetchAllData}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 text-sm"
              >
                <FontAwesomeIcon icon={faRefresh} className={loading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                {[
                  {
                    title: "Total Orders",
                    value: dashboardStats.totalOrders,
                    icon: faShoppingCart,
                    color: "bg-blue-500",
                    isCurrency: false,
                    description: "All time orders"
                  },
                  {
                    title: "Pending",
                    value: dashboardStats.pendingOrders,
                    icon: faClock,
                    color: "bg-yellow-500",
                    isCurrency: false,
                    description: "Awaiting"
                  },
                  {
                    title: "Completed",
                    value: dashboardStats.completedOrders,
                    icon: faCheckCircle,
                    color: "bg-green-500",
                    isCurrency: false,
                    description: "Delivered"
                  },
                  {
                    title: "Products",
                    value: dashboardStats.totalProducts,
                    icon: faHamburger,
                    color: "bg-purple-500",
                    isCurrency: false,
                    description: "Active"
                  },
                ].map((stat, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 lg:p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                        <p className="text-lg lg:text-2xl font-bold text-gray-800 mt-1">
                          {stat.isCurrency ? formatCurrency(stat.value) : stat.value}{stat.suffix || ''}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{stat.description}</p>
                      </div>
                      <div className={`${stat.color} w-8 h-8 lg:w-12 lg:h-12 rounded-full flex items-center justify-center flex-shrink-0 ml-2`}>
                        <FontAwesomeIcon icon={stat.icon} className="text-white text-sm lg:text-lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional Stats for larger screens */}
              <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
                {[
                  {
                    title: "Total Revenue",
                    value: dashboardStats.totalRevenue,
                    icon: faMoneyBillWave,
                    color: "bg-indigo-500",
                    isCurrency: true,
                    description: "All time revenue"
                  },
                  {
                    title: "Cancelled",
                    value: dashboardStats.totalOrders - dashboardStats.pendingOrders - dashboardStats.completedOrders,
                    icon: faTimesCircle,
                    color: "bg-red-500",
                    isCurrency: false,
                    description: "Cancelled orders"
                  },
                  {
                    title: "Success Rate",
                    value: dashboardStats.totalOrders > 0 ? ((dashboardStats.completedOrders / dashboardStats.totalOrders) * 100).toFixed(1) : 0,
                    icon: faChartBar,
                    color: "bg-teal-500",
                    isCurrency: false,
                    suffix: "%",
                    description: "Completion rate"
                  }
                ].map((stat, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 lg:p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                        <p className="text-lg lg:text-2xl font-bold text-gray-800 mt-1">
                          {stat.isCurrency ? formatCurrency(stat.value) : stat.value}{stat.suffix || ''}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{stat.description}</p>
                      </div>
                      <div className={`${stat.color} w-8 h-8 lg:w-12 lg:h-12 rounded-full flex items-center justify-center flex-shrink-0 ml-2`}>
                        <FontAwesomeIcon icon={stat.icon} className="text-white text-sm lg:text-lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts and Recent Data */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Order Status Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
                  <h2 className="text-base lg:text-lg font-semibold text-gray-800 mb-4">Order Status</h2>
                  <div className="space-y-3 lg:space-y-4">
                    {[
                      { status: 'pending', count: statusDistribution.pending, color: 'bg-yellow-500', icon: faClock },
                      { status: 'completed', count: statusDistribution.completed, color: 'bg-green-500', icon: faCheckCircle },
                      { status: 'cancelled', count: statusDistribution.cancelled, color: 'bg-red-500', icon: faTimesCircle }
                    ].map((item, index) => {
                      const percentage = orders.length > 0 ? (item.count / orders.length * 100).toFixed(1) : 0;
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 lg:gap-3">
                            <div className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full ${item.color}`}></div>
                            <FontAwesomeIcon icon={item.icon} className="text-gray-400 w-3 lg:w-4" />
                            <span className="font-medium text-gray-700 text-sm capitalize">{item.status}</span>
                          </div>
                          <div className="flex items-center gap-2 lg:gap-3">
                            <span className="text-xs lg:text-sm text-gray-600">{item.count} orders</span>
                            <span className="text-xs lg:text-sm font-semibold text-gray-800">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 lg:p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h2 className="text-base lg:text-lg font-semibold text-gray-800">Recent Orders</h2>
                      <button
                        onClick={() => setActiveTab("orders")}
                        className="text-orange-600 hover:text-orange-700 font-medium text-xs lg:text-sm"
                      >
                        View All
                      </button>
                    </div>
                  </div>
                  <div className="max-h-64 lg:max-h-96 overflow-y-auto">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="p-3 lg:p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                           onClick={() => fetchOrderItems(order.id)}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 lg:gap-2 mb-1">
                              <FontAwesomeIcon icon={faUserCircle} className="text-gray-400 text-xs lg:text-sm" />
                              <p className="font-semibold text-gray-800 text-sm lg:text-base truncate">{order.customer_name}</p>
                            </div>
                            <p className="text-xs text-gray-600 truncate">{order.customer_phone}</p>
                            <p className="text-xs text-gray-500 mt-1 truncate">{formatDate(order.created_at)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 lg:gap-2 ml-2 lg:ml-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                            <span className="font-bold text-orange-600 text-sm lg:text-base">
                              {formatCurrency(order.total_amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {orders.length === 0 && (
                      <div className="p-6 lg:p-8 text-center text-gray-500">
                        <FontAwesomeIcon icon={faShoppingCart} className="text-3xl lg:text-4xl mb-2 lg:mb-3 text-gray-300" />
                        <p className="text-sm lg:text-base">No orders found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
                <h2 className="text-base lg:text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="p-3 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-left"
                  >
                    <FontAwesomeIcon icon={faList} className="text-orange-500 text-lg lg:text-xl mb-2" />
                    <p className="font-semibold text-gray-800 text-sm">Manage Orders</p>
                    <p className="text-xs text-gray-600">View and process</p>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab("products")}
                    className="p-3 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
                  >
                    <FontAwesomeIcon icon={faHamburger} className="text-green-500 text-lg lg:text-xl mb-2" />
                    <p className="font-semibold text-gray-800 text-sm">Products</p>
                    <p className="text-xs text-gray-600">Add or edit</p>
                  </button>
                  
                  <button
                    onClick={startAddingProduct}
                    className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-orange-500 text-lg lg:text-xl mb-2" />
                    <p className="font-semibold text-gray-800 text-sm">Add Product</p>
                    <p className="text-xs text-gray-600">Create new</p>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab("reports")}
                    className="p-3 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-left"
                  >
                    <FontAwesomeIcon icon={faChartBar} className="text-purple-500 text-lg lg:text-xl mb-2" />
                    <p className="font-semibold text-gray-800 text-sm">Reports</p>
                    <p className="text-xs text-gray-600">Analytics</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="space-y-4 lg:space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
                <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-gray-400 text-sm" />
                      <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm flex-1"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Orders Grid */}
              <div className="grid xl:grid-cols-2 gap-4 lg:gap-6">
                {/* Orders List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 lg:p-6 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-800 text-sm lg:text-base">All Orders ({filteredOrders.length})</h2>
                  </div>
                  <div className="max-h-[500px] lg:max-h-[600px] overflow-y-auto">
                    {loading ? (
                      <div className="p-6 lg:p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-b-2 border-orange-600"></div>
                        <p className="mt-2 text-gray-600 text-sm">Loading orders...</p>
                      </div>
                    ) : filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <div
                          key={order.id}
                          className={`p-3 lg:p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                            selectedOrder === order.id ? "bg-orange-50" : "hover:bg-gray-50"
                          }`}
                          onClick={() => fetchOrderItems(order.id)}
                        >
                          <div className="flex justify-between items-start mb-2 lg:mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-800 text-sm lg:text-base truncate">{order.customer_name}</p>
                              <p className="text-xs text-gray-600 truncate">{order.customer_phone}</p>
                              <p className="text-xs text-gray-500 mt-1 truncate">{order.customer_address}</p>
                              <p className="text-xs text-gray-400 mt-1">{formatDate(order.created_at)}</p>
                            </div>
                            <div className="text-right ml-2 lg:ml-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                <FontAwesomeIcon icon={getStatusIcon(order.status)} className="mr-1" />
                                {order.status}
                              </span>
                              <p className="text-orange-600 font-bold text-base lg:text-lg mt-1">
                                {formatCurrency(order.total_amount)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1 lg:gap-2 flex-wrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isMobile) {
                                  setShowMobileActions({ type: 'order', data: order });
                                } else {
                                  updateOrderStatus(order.id, "completed");
                                }
                              }}
                              className="flex-1 min-w-[60px] lg:min-w-[80px] bg-green-500 text-white py-1 lg:py-2 px-2 rounded text-xs lg:text-sm hover:bg-green-600 transition-colors"
                            >
                              {isMobile ? 'Complete' : 'Complete'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isMobile) {
                                  setShowMobileActions({ type: 'order', data: order });
                                } else {
                                  updateOrderStatus(order.id, "pending");
                                }
                              }}
                              className="flex-1 min-w-[60px] lg:min-w-[80px] bg-yellow-500 text-white py-1 lg:py-2 px-2 rounded text-xs lg:text-sm hover:bg-yellow-600 transition-colors"
                            >
                              {isMobile ? 'Pending' : 'Pending'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isMobile) {
                                  setShowMobileActions({ type: 'order', data: order });
                                } else {
                                  updateOrderStatus(order.id, "cancelled");
                                }
                              }}
                              className="flex-1 min-w-[60px] lg:min-w-[80px] bg-red-500 text-white py-1 lg:py-2 px-2 rounded text-xs lg:text-sm hover:bg-red-600 transition-colors"
                            >
                              {isMobile ? 'Cancel' : 'Cancel'}
                            </button>
                            {isMobile && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowMobileActions({ type: 'order', data: order });
                                }}
                                className="px-3 bg-gray-500 text-white py-1 lg:py-2 rounded text-xs lg:text-sm hover:bg-gray-600 transition-colors"
                              >
                                <FontAwesomeIcon icon={faEllipsisV} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 lg:p-8 text-center text-gray-500">
                        <FontAwesomeIcon icon={faShoppingCart} className="text-3xl lg:text-4xl mb-2 lg:mb-3 text-gray-300" />
                        <p className="text-sm lg:text-base">No orders found</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Details */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 lg:p-6 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-800 text-sm lg:text-base">Order Details</h2>
                  </div>
                  <div className="p-3 lg:p-6">
                    {selectedOrder ? (
                      orderItems.length > 0 ? (
                        <div className="space-y-3 lg:space-y-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 lg:p-4">
                            <h3 className="font-semibold text-orange-800 text-sm lg:text-base mb-2">Customer Information</h3>
                            {orders.find(o => o.id === selectedOrder) && (
                              <div className="space-y-1 text-xs lg:text-sm">
                                <p><strong>Name:</strong> {orders.find(o => o.id === selectedOrder).customer_name}</p>
                                <p><strong>Phone:</strong> {orders.find(o => o.id === selectedOrder).customer_phone}</p>
                                <p><strong>Address:</strong> {orders.find(o => o.id === selectedOrder).customer_address}</p>
                                <p><strong>Order Date:</strong> {formatDate(orders.find(o => o.id === selectedOrder).created_at)}</p>
                                <p><strong>Status:</strong> 
                                  <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(orders.find(o => o.id === selectedOrder).status)}`}>
                                    {orders.find(o => o.id === selectedOrder).status}
                                  </span>
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <h3 className="font-semibold text-gray-800 text-sm lg:text-base">Order Items</h3>
                          {orderItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 p-2 lg:p-3 border border-gray-200 rounded-lg">
                              <ProductImage
                                src={item.image_url}
                                alt={item.product_name}
                                className="w-12 h-12 lg:w-16 lg:h-16 object-cover rounded-lg flex-shrink-0 bg-gray-100"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800 text-sm lg:text-base truncate">{item.product_name}</p>
                                <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {item.quantity} × {formatCurrency(item.unit_price)}
                                </p>
                                <p className="text-orange-600 font-bold text-sm lg:text-base mt-1">
                                  {formatCurrency(item.total_amount)}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div className="mt-3 lg:mt-4 p-3 lg:p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center font-semibold text-gray-800 text-sm lg:text-base">
                              <span>Order Total:</span>
                              <span className="text-base lg:text-lg text-orange-600">
                                {formatCurrency(orderItems.reduce((sum, item) => sum + (item.total_amount || 0), 0))}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-6 lg:py-8">
                          <FontAwesomeIcon icon={faBox} className="text-3xl lg:text-4xl mb-2 lg:mb-3 text-gray-300" />
                          <p className="text-sm lg:text-base">No items found for this order</p>
                        </div>
                      )
                    ) : (
                      <div className="text-center text-gray-500 py-6 lg:py-8">
                        <FontAwesomeIcon icon={faEye} className="text-3xl lg:text-4xl mb-2 lg:mb-3 text-gray-300" />
                        <p className="text-sm lg:text-base">Select an order to view details</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="space-y-4 lg:space-y-6">
              {/* Products Header */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 lg:gap-4">
                  <div>
                    <h2 className="font-semibold text-gray-800 text-sm lg:text-base">Product Management</h2>
                    <p className="text-xs lg:text-sm text-gray-600">{products.length} products</p>
                  </div>
                  <button
                    onClick={startAddingProduct}
                    className="bg-orange-500 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 text-sm lg:text-base"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    <span>Add Product</span>
                  </button>
                </div>
              </div>

              {/* Products Grid */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-3 lg:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-6">
                    {products.map((product) => (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-3 lg:p-4 hover:shadow-md transition-shadow">
                        <div className="relative">
                          <ProductImage
                            src={product.image_url}
                            alt={product.product_name}
                            className="w-full h-24 lg:h-32 object-cover rounded-lg mb-2 lg:mb-3 bg-gray-100"
                          />
                          {!product.image_url && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                              <FontAwesomeIcon icon={faImage} className="text-gray-400 text-xl lg:text-2xl" />
                            </div>
                          )}
                          {isMobile && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowMobileActions({ type: 'product', data: product });
                              }}
                              className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full w-6 h-6 flex items-center justify-center"
                            >
                              <FontAwesomeIcon icon={faEllipsisH} className="text-xs" />
                            </button>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-800 text-sm lg:text-base truncate">{product.product_name}</h3>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                        <div className="flex justify-between items-center mb-2 lg:mb-3">
                          <span className="text-orange-600 font-bold text-sm lg:text-base">{formatCurrency(product.total_amount)}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            product.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {product.is_available ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                        <div className={`flex gap-2 ${isMobile ? 'hidden' : 'flex'}`}>
                          <button
                            onClick={() => startEditingProduct(product)}
                            className="flex-1 bg-orange-500 text-white py-2 rounded hover:bg-orange-600 transition-colors text-xs lg:text-sm flex items-center justify-center gap-1"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                            Edit
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 transition-colors text-xs lg:text-sm flex items-center justify-center gap-1"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {products.length === 0 && (
                    <div className="text-center py-8 lg:py-12 text-gray-500">
                      <FontAwesomeIcon icon={faHamburger} className="text-3xl lg:text-4xl mb-2 lg:mb-3 text-gray-300" />
                      <p className="text-sm lg:text-base">No products found</p>
                      <button
                        onClick={startAddingProduct}
                        className="mt-3 lg:mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm lg:text-base"
                      >
                        Add Your First Product
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div className="space-y-4 lg:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Revenue Overview */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
                  <div className="flex justify-between items-center mb-3 lg:mb-4">
                    <h2 className="text-base lg:text-lg font-semibold text-gray-800">Revenue Overview</h2>
                    <div className="text-xs lg:text-sm text-gray-500">
                      Currency: <span className="font-bold">{currency}</span>
                    </div>
                  </div>
                  <div className="h-48 lg:h-64 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
                    <div className="text-center">
                      <FontAwesomeIcon icon={faChartBar} className="text-3xl lg:text-4xl text-gray-300 mb-2 lg:mb-3" />
                      <p className="text-gray-500 text-sm lg:text-base">Revenue chart in {currency}</p>
                      <p className="text-xs lg:text-sm text-gray-400 mt-1 lg:mt-2">Total: {formatCurrency(dashboardStats.totalRevenue)}</p>
                    </div>
                  </div>
                </div>

                {/* Order Analytics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
                  <h2 className="text-base lg:text-lg font-semibold text-gray-800 mb-3 lg:mb-4">Order Analytics</h2>
                  <div className="space-y-3 lg:space-y-4">
                    {[
                      { label: "Total Orders", value: dashboardStats.totalOrders, isCurrency: false, color: "bg-blue-500" },
                      { label: "Pending Orders", value: dashboardStats.pendingOrders, isCurrency: false, color: "bg-yellow-500" },
                      { label: "Completed Orders", value: dashboardStats.completedOrders, isCurrency: false, color: "bg-green-500" },
                      { label: "Cancelled Orders", value: dashboardStats.totalOrders - dashboardStats.pendingOrders - dashboardStats.completedOrders, isCurrency: false, color: "bg-red-500" },
                      { label: "Total Revenue", value: dashboardStats.totalRevenue, isCurrency: true, color: "bg-indigo-500" },
                    ].map((stat, index) => (
                      <div key={index} className="flex items-center justify-between p-2 lg:p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 lg:gap-3">
                          <div className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full ${stat.color}`}></div>
                          <span className="font-medium text-gray-700 text-xs lg:text-sm">{stat.label}</span>
                        </div>
                        <span className="font-bold text-orange-600 text-xs lg:text-sm">
                          {stat.isCurrency ? formatCurrency(stat.value) : stat.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 lg:p-6 border-b border-gray-200">
                  <h2 className="text-base lg:text-lg font-semibold text-gray-800">Recent Activity</h2>
                </div>
                <div className="p-3 lg:p-6">
                  <div className="space-y-2 lg:space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-2 lg:p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm lg:text-base truncate">{order.customer_name}</p>
                          <p className="text-xs text-gray-600 truncate">{order.customer_phone}</p>
                          <p className="text-xs text-gray-500 truncate">{formatDate(order.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-2 lg:gap-4 ml-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <span className="font-bold text-orange-600 text-sm lg:text-base">
                            {formatCurrency(order.total_amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Actions Modals */}
      {showMobileActions?.type === 'order' && (
        <MobileOrderActions 
          order={showMobileActions.data} 
          onClose={() => setShowMobileActions(null)} 
        />
      )}

      {showMobileActions?.type === 'product' && (
        <MobileProductActions 
          product={showMobileActions.data} 
          onClose={() => setShowMobileActions(null)} 
        />
      )}

      {/* Enhanced Profile Settings Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl w-full max-w-2xl shadow-2xl border border-white/20 max-h-[90vh] overflow-hidden">
            <div className="p-4 lg:p-6 border-b border-gray-200/50">
              <div className="flex justify-between items-center">
                <h2 className="text-lg lg:text-xl font-bold text-gray-800 flex items-center gap-2 lg:gap-3">
                  <FontAwesomeIcon icon={faUserShield} className="text-orange-500" />
                  <span className="text-sm lg:text-xl">Account Settings</span>
                </h2>
                <button 
                  onClick={closeProfileModal}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100/50 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            </div>
            
            <form onSubmit={updateCredentials} className="p-4 lg:p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="space-y-4 lg:space-y-6">
                {/* Account Information Section */}
                <div className="bg-blue-50/50 rounded-xl p-3 lg:p-4 border border-blue-200/50">
                  <h3 className="font-semibold text-orange-800 text-sm lg:text-base mb-2 lg:mb-3 flex items-center gap-2">
                    <FontAwesomeIcon icon={faUser} />
                    Account Information
                  </h3>
                  <div className="space-y-3 lg:space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-gray-400" />
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="mb-2 p-2 bg-white rounded border border-gray-200 text-xs lg:text-sm">
                        <p className="text-gray-600">Current: <span className="font-medium">{user?.email}</span></p>
                      </div>
                      <input
                        type="email"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm text-sm"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        placeholder="Enter new email address"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter your new email address. You may need to verify it.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Password Change Section */}
                <div className="bg-orange-50/50 rounded-xl p-3 lg:p-4 border border-orange-200/50">
                  <h3 className="font-semibold text-orange-800 text-sm lg:text-base mb-2 lg:mb-3 flex items-center gap-2">
                    <FontAwesomeIcon icon={faKey} />
                    Change Password
                  </h3>
                  <div className="space-y-3 lg:space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={profileData.currentPassword}
                          onChange={(e) => setProfileData({...profileData, currentPassword: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/80 backdrop-blur-sm text-sm"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <FontAwesomeIcon icon={showCurrentPassword ? faEyeSlash : faEyeOpen} />
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={profileData.newPassword}
                          onChange={(e) => setProfileData({...profileData, newPassword: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/80 backdrop-blur-sm text-sm"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEyeOpen} />
                        </button>
                      </div>
                      {profileData.newPassword && (
                        <p className={`text-xs mt-1 ${
                          profileData.newPassword.length >= 6 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          Password must be at least 6 characters long
                        </p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={profileData.confirmPassword}
                          onChange={(e) => setProfileData({...profileData, confirmPassword: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/80 backdrop-blur-sm text-sm"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEyeOpen} />
                        </button>
                      </div>
                      {profileData.confirmPassword && profileData.newPassword !== profileData.confirmPassword && (
                        <p className="text-red-600 text-xs mt-1">Passwords do not match</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 lg:gap-3 pt-2 lg:pt-4">
                  <button
                    type="button"
                    onClick={closeProfileModal}
                    className="flex-1 bg-gray-500/80 text-white py-2 lg:py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium backdrop-blur-sm text-sm lg:text-base flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faCancel} />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="flex-1 bg-blue-500/90 text-white py-2 lg:py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium backdrop-blur-sm disabled:opacity-50 flex items-center justify-center gap-2 text-sm lg:text-base"
                  >
                    {updatingProfile ? (
                      <>
                        <FontAwesomeIcon icon={faRefresh} className="animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl w-full max-w-4xl shadow-2xl border border-white/20 max-h-[90vh] overflow-hidden">
            <div className="p-4 lg:p-6 border-b border-gray-200/50">
              <div className="flex justify-between items-center">
                <h2 className="text-lg lg:text-xl font-bold text-gray-800">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button 
                  onClick={closeProductModal}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100/50 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            </div>
            
            <form onSubmit={saveProduct} className="p-4 lg:p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Left Column - Image Upload & Preview */}
                <div className="space-y-3 lg:space-y-4">
                  {/* Image Upload Section */}
                  <div className="bg-gray-50/50 rounded-xl p-3 lg:p-4 border border-gray-200/50">
                    <h3 className="font-semibold text-gray-800 text-sm lg:text-base mb-2 lg:mb-3">Product Image</h3>
                    
                    {/* File Upload */}
                    <div className="mb-3 lg:mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FontAwesomeIcon icon={faCloudUpload} className="text-gray-400" />
                        Upload Image
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 lg:p-4 text-center hover:border-orange-400 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer block">
                          <FontAwesomeIcon icon={faUpload} className="text-gray-400 text-xl lg:text-2xl mb-2" />
                          <p className="text-xs lg:text-sm text-gray-600">
                            {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF, WebP up to 5MB</p>
                        </label>
                      </div>
                    </div>

                    {/* Image Preview */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                      <div className="border border-gray-200 rounded-lg p-2 lg:p-3 bg-white/50">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-24 lg:h-32 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/300x200/FFA500/FFFFFF?text=Invalid+Image";
                            }}
                          />
                        ) : (
                          <div className="w-full h-24 lg:h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FontAwesomeIcon icon={faImage} className="text-gray-400 text-xl lg:text-2xl" />
                            <span className="text-gray-500 ml-2 text-sm">No image selected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Product Details Form */}
                <div className="space-y-3 lg:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/80 text-sm"
                      placeholder="Enter product name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/80 text-sm"
                      placeholder="Enter product description"
                      rows="3"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (FRW) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/80 text-sm"
                      placeholder="Enter price"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 p-2 lg:p-3 bg-gray-50/50 rounded-lg border border-gray-200/50">
                    <input
                      type="checkbox"
                      id="product-available"
                      checked={productForm.is_available}
                      onChange={(e) => setProductForm({...productForm, is_available: e.target.checked})}
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <label htmlFor="product-available" className="text-sm text-gray-700 font-medium">
                      Available for sale
                    </label>
                  </div>
                  
                  <div className="flex gap-2 lg:gap-3 pt-2 lg:pt-4">
                    <button
                      type="button"
                      onClick={closeProductModal}
                      className="flex-1 bg-gray-500/80 text-white py-2 lg:py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium backdrop-blur-sm text-sm lg:text-base"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="flex-1 bg-orange-500/90 text-white py-2 lg:py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium backdrop-blur-sm disabled:opacity-50 flex items-center justify-center gap-2 text-sm lg:text-base"
                    >
                      {uploading ? (
                        <>
                          <FontAwesomeIcon icon={faRefresh} className="animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={editingProduct ? faSave : faPlus} />
                          {editingProduct ? 'Update Product' : 'Add Product'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
