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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Enhanced profile data state
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

  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    totalProducts: 0
  });

  // Revenue chart data state
  const [revenueData, setRevenueData] = useState([]);
  const [timeRange, setTimeRange] = useState('monthly');

  // Currency conversion rates
  const exchangeRates = {
    FRW: 1,
    USD: 0.00081,
    EUR: 0.00074,
  };

  // Backend URL
  const BACKEND_URL = API_URL;

  // RevenueChart Component
  const RevenueChart = ({ data, currency = 'FRW' }) => {
    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
            <p className="font-semibold text-gray-800">{label}</p>
            <p className="text-blue-600">
              {currency} {payload[0].value.toLocaleString()}
            </p>
          </div>
        );
      }
      return null;
    };

    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const colors = ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE', '#EFF6FF'];

    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">Revenue Overview</h3>
            <span className="text-sm text-gray-600">Currency: {currency}</span>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {currency} {totalRevenue.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Revenue</p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => `${currency} ${(value / 1000).toFixed(0)}K`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="revenue" 
                radius={[4, 4, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: colors[index % colors.length] }}
              ></div>
              <span className="text-sm text-gray-600">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Generate revenue data based on completed orders
  const generateRevenueData = () => {
    const completedOrders = orders.filter(order => order.status === 'completed');
    
    if (completedOrders.length === 0) {
      if (timeRange === 'daily') {
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
          name: day,
          revenue: 0
        }));
      } else if (timeRange === 'weekly') {
        return ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map(week => ({
          name: week,
          revenue: 0
        }));
      } else {
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(month => ({
          name: month,
          revenue: 0
        }));
      }
    }

    if (timeRange === 'daily') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayRevenue = days.map(day => ({ name: day, revenue: 0 }));
      
      completedOrders.forEach(order => {
        if (order.created_at) {
          const orderDate = new Date(order.created_at);
          const dayIndex = orderDate.getDay();
          dayRevenue[dayIndex].revenue += order.total_amount || 0;
        }
      });
      
      return dayRevenue;
      
    } else if (timeRange === 'weekly') {
      const weeklyRevenue = [
        { name: 'Week 1', revenue: 0 },
        { name: 'Week 2', revenue: 0 },
        { name: 'Week 3', revenue: 0 },
        { name: 'Week 4', revenue: 0 }
      ];
      
      completedOrders.forEach(order => {
        if (order.created_at) {
          const orderDate = new Date(order.created_at);
          const weekOfMonth = Math.floor((orderDate.getDate() - 1) / 7);
          const weekIndex = Math.min(weekOfMonth, 3);
          weeklyRevenue[weekIndex].revenue += order.total_amount || 0;
        }
      });
      
      return weeklyRevenue;
      
    } else {
      const monthlyRevenue = [
        { name: 'Jan', revenue: 0 },
        { name: 'Feb', revenue: 0 },
        { name: 'Mar', revenue: 0 },
        { name: 'Apr', revenue: 0 },
        { name: 'May', revenue: 0 },
        { name: 'Jun', revenue: 0 },
        { name: 'Jul', revenue: 0 },
        { name: 'Aug', revenue: 0 },
        { name: 'Sep', revenue: 0 },
        { name: 'Oct', revenue: 0 },
        { name: 'Nov', revenue: 0 },
        { name: 'Dec', revenue: 0 }
      ];
      
      completedOrders.forEach(order => {
        if (order.created_at) {
          const orderDate = new Date(order.created_at);
          const monthIndex = orderDate.getMonth();
          monthlyRevenue[monthIndex].revenue += order.total_amount || 0;
        }
      });
      
      const monthsWithData = monthlyRevenue.filter(month => month.revenue > 0);
      if (monthsWithData.length > 0) {
        return monthsWithData.slice(-6);
      }
      
      const currentMonth = new Date().getMonth();
      return monthlyRevenue.slice(Math.max(0, currentMonth - 5), currentMonth + 1);
    }
  };

  // Enhanced authentication headers
  const getAuthHeaders = async () => {
    try {
      const { data: authData } = await supabase.auth.getSession();
      const authUser = authData.session?.user;
      
      if (!authUser) {
        console.error('No user session found');
        toast.error("Please log in again");
        return null;
      }

      const token = authData.session?.access_token;
      
      if (token) {
        return {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
      }

      const { data: user, error } = await supabase
        .from("users")
        .select("id, email, username")
        .eq("email", authUser.email)
        .single();

      if (error || !user) {
        console.error('User not found in users table:', error);
        
        try {
          const { data: newUser, error: createError } = await supabase
            .from("users")
            .insert([{
              email: authUser.email,
              username: authUser.email.split('@')[0],
              password: 'auto-created-from-auth'
            }])
            .select()
            .single();

          if (createError || !newUser) {
            console.error('Failed to auto-create user:', createError);
            toast.error("User account not found. Please contact administrator.");
            return null;
          }

          console.log('Auto-created user in users table:', newUser);
          return {
            'user-id': newUser.id,
            'user-email': newUser.email,
            'Content-Type': 'application/json'
          };
        } catch (createError) {
          console.error('Error auto-creating user:', createError);
          toast.error("Failed to create user account automatically");
          return null;
        }
      }

      console.log('Found user in users table:', user);
      return {
        'user-id': user.id,
        'user-email': user.email,
        'Content-Type': 'application/json'
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      toast.error("Authentication error");
      return null;
    }
  };

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generate revenue data when orders or time range changes
  useEffect(() => {
    setRevenueData(generateRevenueData());
  }, [orders, timeRange]);

  // Fixed image URL handling
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

  // Validate image URL format
  const validateImageUrl = (url) => {
    if (!url || url.trim() === '') return true;
    
    try {
      if (url.startsWith('/uploads/')) return true;
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch (error) {
      return false;
    }
  };

  // Upload image to backend server
  const uploadImage = async (file) => {
    try {
      setUploading(true);
      const authHeaders = await getAuthHeaders();
      
      if (!authHeaders) {
        toast.error("Authentication required");
        return null;
      }

      const formData = new FormData();
      formData.append('image', file);

      const { 'Content-Type': contentType, ...headersWithoutContentType } = authHeaders;

      const response = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        headers: headersWithoutContentType,
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
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

  // Handle file selection
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
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  // Handle image URL change
  const handleImageUrlChange = (url) => {
    setProductForm({...productForm, image_url: url});
    setSelectedFile(null);
    setImagePreview(url && validateImageUrl(url) ? url : "");
  };

  // Check authentication and fetch data
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        navigate("/login");
      } else {
        setUser(data.user);
        setProfileData(prev => ({ ...prev, email: data.user.email }));
        fetchAllData();
      }
    };
    checkSession();
  }, [navigate]);

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchOrders(), fetchProducts(), fetchDashboardStats()]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders from backend
  const fetchOrders = async () => {
    try {
      const authHeaders = await getAuthHeaders();
      
      if (!authHeaders) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        headers: authHeaders
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch orders');
      }
      
      const ordersData = await response.json();
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error(error.message || "Failed to fetch orders");
    }
  };

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    try {
      const authHeaders = await getAuthHeaders();
      
      if (!authHeaders) {
        console.error("Authentication required for dashboard stats");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/dashboard/stats`, {
        headers: authHeaders
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch dashboard stats');
      }
      
      const stats = await response.json();
      setDashboardStats(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  // Calculate total revenue from completed orders only
  const calculateCompletedRevenue = () => {
    const completedOrders = orders.filter(order => order.status === 'completed');
    return completedOrders.reduce((total, order) => total + (order.total_amount || 0), 0);
  };

  // Fetch products from backend
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/products`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch products');
      }
      
      const productsData = await response.json();
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error(error.message || "Failed to fetch products");
    }
  };

  // Fetch order items with proper authentication
  const fetchOrderItems = async (orderId) => {
    try {
      const authHeaders = await getAuthHeaders();
      
      if (!authHeaders) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/orders/${orderId}/items`, {
        headers: authHeaders
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server response error:', errorData);
        throw new Error(errorData.message || `Failed to fetch order items: ${response.status}`);
      }
      
      const itemsData = await response.json();

      const transformedItems = itemsData.map(item => ({
        id: item.product_id || item.id,
        product_id: item.product_id,
        product_name: item.product_name || item.products?.product_name || 'Unknown Product',
        description: item.products?.description || item.description || '',
        image_url: item.products?.image_url || item.image_url || '',
        quantity: item.quantity || 1,
        price: item.price || item.unit_price || item.products?.total_amount || 0,
        total_amount: item.total_amount || (item.quantity * (item.price || item.unit_price || 0)),
        unit_price: item.unit_price || item.price || item.products?.total_amount || 0
      }));

      setOrderItems(transformedItems);
      setSelectedOrder(orderId);
      
    } catch (error) {
      console.error("Error fetching order items:", error);
      
      if (error.message.includes('Failed to fetch')) {
        toast.error("Network error: Cannot connect to server");
      } else if (error.message.includes('401')) {
        toast.error("Session expired. Please log in again.");
      } else if (error.message.includes('404')) {
        toast.error("Order not found");
      } else {
        toast.error(error.message || "Failed to load order items");
      }
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const authHeaders = await getAuthHeaders();
      
      if (!authHeaders) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update order status');
      }
      
      await fetchOrders();
      await fetchDashboardStats();
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error(error.message || "Failed to update order status");
    }
  };

  // Save product (both add and update)
  const saveProduct = async (e) => {
    e.preventDefault();
    
    if (!productForm.name || !productForm.description || !productForm.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const authHeaders = await getAuthHeaders();
      
      if (!authHeaders) {
        toast.error("Authentication required");
        return;
      }

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
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productData)
        });
      } else {
        response = await fetch(`${BACKEND_URL}/api/products`, {
          method: 'POST',
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productData)
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${editingProduct ? 'update' : 'create'} product`);
      }
      
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

  // Delete product
  const deleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;
    
    try {
      const authHeaders = await getAuthHeaders();
      
      if (!authHeaders) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: authHeaders
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete product');
      }
      
      await fetchProducts();
      await fetchDashboardStats();
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(error.message || "Failed to delete product");
    }
  };

  // Update user credentials
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
      let updateData = { email: profileData.email };
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

  // Start editing product
  const startEditingProduct = (product) => {
    setEditingProduct(product.id);
    setProductForm({ 
      name: product.product_name,
      description: product.description,
      price: product.total_amount,
      image_url: product.image_url,
      is_available: product.is_available
    });
    setImagePreview(product.image_url ? getImageUrl(product.image_url) : "");
    setSelectedFile(null);
    setShowProductModal(true);
  };

  // Start adding product
  const startAddingProduct = () => {
    setEditingProduct(null);
    resetProductForm();
    setShowProductModal(true);
  };

  // Reset product form
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

  // Close product modal
  const closeProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    resetProductForm();
  };

  // Close profile modal
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

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully")
    navigate("/login");
  };

  // Filter orders based on search and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_phone?.includes(searchTerm) ||
                         order.customer_address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return faClock;
      case "completed": return faCheckCircle;
      case "cancelled": return faTimesCircle;
      default: return faBox;
    }
  };

  // Format date
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

  // Currency formatting
  const formatCurrency = (amount) => {
    if (!amount) return `FRW 0`;
    const convertedAmount = amount * exchangeRates[currency];
    
    switch (currency) {
      case "FRW": return `FRW ${Math.round(convertedAmount).toLocaleString()}`;
      case "USD": return `$${convertedAmount.toFixed(2)}`;
      case "EUR": return `€${convertedAmount.toFixed(2)}`;
      default: return `FRW ${Math.round(amount).toLocaleString()}`;
    }
  };

  // Calculate statistics for charts
  const getOrderStatusDistribution = () => {
    const statusCounts = { pending: 0, completed: 0, cancelled: 0 };
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    return statusCounts;
  };

  const statusDistribution = getOrderStatusDistribution();

  // Enhanced Image component with better error handling
  const ProductImage = ({ src, alt, className = "w-full h-32 object-cover rounded-lg bg-gray-100" }) => {
    const [imgSrc, setImgSrc] = useState(getImageUrl(src));
    const [hasError, setHasError] = useState(false);

    const handleError = () => {
      setHasError(true);
      setImgSrc("https://via.placeholder.com/300x200/FFA500/FFFFFF?text=No+Image");
    };

    const handleLoad = () => setHasError(false);

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

  // Mobile menu toggle
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar on mobile when clicking outside
  const handleSidebarClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Bottom Navigation Tabs for Mobile
  const MobileBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 lg:hidden">
      <div className="flex justify-around items-center py-2">
        {[
          { id: "dashboard", icon: faHome, label: "Dashboard" },
          { id: "orders", icon: faShoppingCart, label: "Orders" },
          { id: "products", icon: faHamburger, label: "Products" },
          { id: "reports", icon: faChartBar, label: "Reports" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 flex-1 mx-1 ${
              activeTab === item.id
                ? "text-orange-600 bg-orange-50 border border-orange-200"
                : "text-gray-600 hover:text-orange-600 hover:bg-orange-50"
            }`}
          >
            <FontAwesomeIcon icon={item.icon} size={18} className="mb-1" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Toast Container */}
      <div className="toast-container">
        {/* Toast messages will appear here */}
      </div>

      {/* Mobile Header */}
      {isMobile && (
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-sm z-40 p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FontAwesomeIcon icon={sidebarOpen ? faTimes : faBars} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-bold text-orange-600">FastFood Admin</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchAllData}
                disabled={loading}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FontAwesomeIcon icon={faRefresh} className={loading ? "animate-spin text-orange-500" : "text-gray-600"} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar - Increased Height */}
      <div className={`
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0 lg:w-72 w-80 bg-white shadow-xl transition-all duration-300 flex flex-col fixed lg:relative h-screen z-30
      `}>
        {/* Increased padding and spacing in sidebar */}
        <div className="p-6 border-b border-gray-200 bg-orange-50">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-orange-600 flex items-center gap-3">
              <FontAwesomeIcon icon={faStore} className="text-2xl" />
              FastFood Admin
            </h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-orange-100 transition-colors lg:hidden"
            >
              <FontAwesomeIcon icon={faTimes} className="text-gray-600 text-lg" />
            </button>
          </div>
        </div>

        {/* Navigation with increased spacing */}
        <nav className="flex-1 p-6 space-y-3">
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
                handleSidebarClick();
              }}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-orange-500 text-white shadow-lg transform scale-105"
                  : "text-gray-600 hover:bg-orange-50 hover:text-orange-600 hover:shadow-md"
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className="w-6 h-6 flex-shrink-0" />
              <span className="font-semibold text-lg text-left">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer section with increased spacing */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4 p-4 text-gray-600 mb-4 bg-white rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faUserShield} className="text-green-500 text-xl" />
            </div>
            <div className="text-sm min-w-0 flex-1">
              <p className="font-semibold truncate" title={user?.email}>
                {user?.email}
              </p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
          
          <button 
            onClick={() => {
              setShowProfileModal(true);
              handleSidebarClick();
            }}
            className="w-full flex items-center gap-4 p-4 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors mb-3 border border-gray-200 hover:border-blue-200"
          >
            <FontAwesomeIcon icon={faCog} className="flex-shrink-0 text-lg" />
            <span className="font-medium text-left text-lg">Settings</span>
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-4 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors border border-gray-200 hover:border-red-200"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="flex-shrink-0 text-lg" />
            <span className="font-medium text-left text-lg">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-auto transition-all duration-300 ${isMobile ? 'mt-16 pb-16' : ''}`}>
        <div className="p-4 lg:p-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-800 capitalize truncate">
                {activeTab === "dashboard" && "Dashboard Overview"}
                {activeTab === "orders" && "Order Management"}
                {activeTab === "products" && "Product Management"}
                {activeTab === "reports" && "Sales Reports"}
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-sm"
              >
                <option value="FRW">FRW 🇷🇼</option>
                <option value="USD">USD 🇺🇸</option>
                <option value="EUR">EUR 🇪🇺</option>
              </select>
              
              {!isMobile && (
                <button
                  onClick={fetchAllData}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 text-sm"
                >
                  <FontAwesomeIcon icon={faRefresh} className={loading ? "animate-spin" : ""} />
                  <span>Refresh Data</span>
                </button>
              )}
            </div>
          </div>

          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[
                  {
                    title: "Total Orders",
                    value: dashboardStats.totalOrders,
                    icon: faShoppingCart,
                    color: "bg-blue-500",
                    isCurrency: false
                  },
                  {
                    title: "Pending Orders",
                    value: dashboardStats.pendingOrders,
                    icon: faClock,
                    color: "bg-yellow-500",
                    isCurrency: false
                  },
                  {
                    title: "Completed Orders",
                    value: dashboardStats.completedOrders,
                    icon: faCheckCircle,
                    color: "bg-green-500",
                    isCurrency: false
                  },
                  {
                    title: "Total Products",
                    value: dashboardStats.totalProducts,
                    icon: faHamburger,
                    color: "bg-purple-500",
                    isCurrency: false
                  },
                  {
                    title: "Total Revenue",
                    value: calculateCompletedRevenue(),
                    icon: faMoneyBillWave,
                    color: "bg-indigo-500",
                    isCurrency: true
                  },
                  {
                    title: "Cancelled Orders",
                    value: dashboardStats.totalOrders - dashboardStats.pendingOrders - dashboardStats.completedOrders,
                    icon: faTimesCircle,
                    color: "bg-red-500",
                    isCurrency: false
                  },
                  {
                    title: "Success Rate",
                    value: dashboardStats.totalOrders > 0 ? ((dashboardStats.completedOrders / dashboardStats.totalOrders) * 100).toFixed(1) : 0,
                    icon: faChartBar,
                    color: "bg-teal-500",
                    isCurrency: false,
                    suffix: "%"
                  }
                ].map((stat, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                        <p className="text-xl font-bold text-gray-800 mt-1 truncate">
                          {stat.isCurrency ? formatCurrency(stat.value) : stat.value}{stat.suffix || ''}
                        </p>
                      </div>
                      <div className={`${stat.color} w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ml-2`}>
                        <FontAwesomeIcon icon={stat.icon} className="text-white text-base" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts and Recent Data */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Status Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Status Distribution</h2>
                  <div className="space-y-4">
                    {[
                      { status: 'pending', count: statusDistribution.pending, color: 'bg-yellow-500', icon: faClock },
                      { status: 'completed', count: statusDistribution.completed, color: 'bg-green-500', icon: faCheckCircle },
                      { status: 'cancelled', count: statusDistribution.cancelled, color: 'bg-red-500', icon: faTimesCircle }
                    ].map((item, index) => {
                      const percentage = orders.length > 0 ? (item.count / orders.length * 100).toFixed(1) : 0;
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-3 h-3 rounded-full ${item.color} flex-shrink-0`}></div>
                            <FontAwesomeIcon icon={item.icon} className="text-gray-400 w-4 flex-shrink-0" />
                            <span className="font-medium text-gray-700 capitalize truncate">{item.status}</span>
                          </div>
                          <div className="flex items-center gap-3 ml-2">
                            <span className="text-sm text-gray-600 whitespace-nowrap">{item.count} orders</span>
                            <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
                      <button
                        onClick={() => setActiveTab("orders")}
                        className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                      >
                        View All
                      </button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                           onClick={() => fetchOrderItems(order.id)}>
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <FontAwesomeIcon icon={faUserCircle} className="text-gray-400 text-sm flex-shrink-0" />
                              <p className="font-semibold text-gray-800 truncate">{order.customer_name}</p>
                            </div>
                            <p className="text-sm text-gray-600 truncate">{order.customer_phone}</p>
                            <p className="text-xs text-gray-500 mt-1 truncate">{formatDate(order.created_at)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2 ml-2 flex-shrink-0">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)} whitespace-nowrap`}>
                              {order.status}
                            </span>
                            <span className="font-bold text-orange-600 whitespace-nowrap">
                              {formatCurrency(order.total_amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {orders.length === 0 && (
                      <div className="p-8 text-center text-gray-500">
                        <FontAwesomeIcon icon={faShoppingCart} className="text-4xl mb-3 text-gray-300" />
                        <p>No orders found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-left"
                  >
                    <FontAwesomeIcon icon={faList} className="text-orange-500 text-xl mb-2" />
                    <p className="font-semibold text-gray-800">Manage Orders</p>
                    <p className="text-sm text-gray-600 mt-1">View and process orders</p>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab("products")}
                    className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
                  >
                    <FontAwesomeIcon icon={faHamburger} className="text-green-500 text-xl mb-2" />
                    <p className="font-semibold text-gray-800">Manage Products</p>
                    <p className="text-sm text-gray-600 mt-1">Add or edit products</p>
                  </button>
                  
                  <button
                    onClick={startAddingProduct}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-blue-500 text-xl mb-2" />
                    <p className="font-semibold text-gray-800">Add Product</p>
                    <p className="text-sm text-gray-600 mt-1">Create new product</p>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab("reports")}
                    className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-left"
                  >
                    <FontAwesomeIcon icon={faChartBar} className="text-purple-500 text-xl mb-2" />
                    <p className="font-semibold text-gray-800">View Reports</p>
                    <p className="text-sm text-gray-600 mt-1">Sales analytics</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-full sm:w-auto"
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
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Orders List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 order-2 xl:order-1">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-800">All Orders ({filteredOrders.length})</h2>
                  </div>
                  <div className="max-h-[600px] overflow-y-auto">
                    {loading ? (
                      <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                        <p className="mt-2 text-gray-600">Loading orders...</p>
                      </div>
                    ) : filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <div
                          key={order.id}
                          className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                            selectedOrder === order.id ? "bg-orange-50" : "hover:bg-gray-50"
                          }`}
                          onClick={() => fetchOrderItems(order.id)}
                        >
                          <div className="flex justify-between items-start gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-800 truncate">{order.customer_name}</p>
                              <p className="text-sm text-gray-600 truncate">{order.customer_phone}</p>
                              <p className="text-xs text-gray-500 mt-1 truncate">{order.customer_address}</p>
                              <p className="text-xs text-gray-400 mt-1">{formatDate(order.created_at)}</p>
                            </div>
                            <div className="text-right ml-2 flex-shrink-0">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)} whitespace-nowrap`}>
                                <FontAwesomeIcon icon={getStatusIcon(order.status)} className="mr-1" />
                                {order.status}
                              </span>
                              <p className="text-orange-600 font-bold text-lg mt-1 whitespace-nowrap">
                                {formatCurrency(order.total_amount)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, "completed");
                              }}
                              className="flex-1 min-w-[80px] bg-green-500 text-white py-2 px-2 rounded text-sm hover:bg-green-600 transition-colors"
                            >
                              Complete
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, "pending");
                              }}
                              className="flex-1 min-w-[80px] bg-yellow-500 text-white py-2 px-2 rounded text-sm hover:bg-yellow-600 transition-colors"
                            >
                              Pending
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, "cancelled");
                              }}
                              className="flex-1 min-w-[80px] bg-red-500 text-white py-2 px-2 rounded text-sm hover:bg-red-600 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <FontAwesomeIcon icon={faShoppingCart} className="text-4xl mb-3 text-gray-300" />
                        <p>No orders found</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Details */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 order-1 xl:order-2">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-800">
                      Order Details
                    </h2>
                  </div>
                  <div className="p-6">
                    {selectedOrder ? (
                      orderItems.length > 0 ? (
                        <div className="space-y-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold text-blue-800 mb-2">Customer Information</h3>
                            {(() => {
                              const currentOrder = orders.find(o => o.id === selectedOrder);
                              return currentOrder ? (
                                <div className="space-y-2 text-sm">
                                  <p><strong>Name:</strong> {currentOrder.customer_name}</p>
                                  <p><strong>Phone:</strong> {currentOrder.customer_phone}</p>
                                  <p><strong>Address:</strong> {currentOrder.customer_address}</p>
                                  <p><strong>Order Date:</strong> {formatDate(currentOrder.created_at)}</p>
                                  <p><strong>Status:</strong> 
                                    <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(currentOrder.status)}`}>
                                      {currentOrder.status}
                                    </span>
                                  </p>
                                </div>
                              ) : (
                                <p className="text-red-500 text-sm">Order data not found</p>
                              );
                            })()}
                          </div>
                          
                          <h3 className="font-semibold text-gray-800">Order Items ({orderItems.length})</h3>
                          {orderItems.map((item, index) => (
                            <div key={item.id || index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                              <ProductImage
                                src={item.image_url}
                                alt={item.product_name}
                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-gray-100"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800 truncate">
                                  {item.product_name}
                                </p>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {item.description || 'No description'}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Quantity: {item.quantity}
                                </p>
                                <p className="text-orange-600 font-bold mt-1">
                                  {formatCurrency(item.total_amount || (item.quantity * (item.unit_price || item.price)))}
                                </p>
                              </div>
                            </div>
                          ))}
                          
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center font-semibold text-gray-800">
                              <span>Order Total:</span>
                              <span className="text-orange-600 text-lg">
                                {formatCurrency(orderItems.reduce((sum, item) => sum + (item.total_amount || (item.quantity * (item.unit_price || item.price)) || 0), 0))}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <FontAwesomeIcon icon={faBox} className="text-4xl mb-3 text-gray-300" />
                          <p>No items found for this order</p>
                          <button
                            onClick={() => fetchOrderItems(selectedOrder)}
                            className="mt-2 bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
                          >
                            Retry
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <FontAwesomeIcon icon={faEye} className="text-4xl mb-3 text-gray-300" />
                        <p>Select an order to view details</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="space-y-6">
              {/* Products Header */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-800">Product Management</h2>
                    <p className="text-sm text-gray-600">Manage your product catalog ({products.length} products)</p>
                  </div>
                  <button
                    onClick={startAddingProduct}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    <span>Add Product</span>
                  </button>
                </div>
              </div>

              {/* Products Grid */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="relative">
                          <ProductImage
                            src={product.image_url}
                            alt={product.product_name}
                            className="w-full h-32 object-cover rounded-lg mb-3 bg-gray-100"
                          />
                          {!product.image_url && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                              <FontAwesomeIcon icon={faImage} className="text-gray-400 text-2xl" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-800 truncate mb-1">{product.product_name}</h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-orange-600 font-bold">{formatCurrency(product.total_amount)}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            product.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {product.is_available ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditingProduct(product)}
                            className="flex-1 bg-orange-500 text-white py-2 rounded hover:bg-orange-600 transition-colors text-sm flex items-center justify-center gap-1"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                            Edit
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 transition-colors text-sm flex items-center justify-center gap-1"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {products.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <FontAwesomeIcon icon={faHamburger} className="text-4xl mb-3 text-gray-300" />
                      <p>No products found</p>
                      <button
                        onClick={startAddingProduct}
                        className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
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
            <div className="space-y-6">
              {/* Time Range Filter */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-800">Sales Reports</h2>
                    <p className="text-sm text-gray-600">Analyze your revenue and sales performance</p>
                  </div>
                  <div className="flex gap-2">
                    {['daily', 'weekly', 'monthly'].map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors text-sm ${
                          timeRange === range
                            ? 'bg-orange-500 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <RevenueChart 
                  data={revenueData} 
                  currency={currency}
                />

                {/* Order Analytics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Analytics</h2>
                  <div className="space-y-4">
                    {[
                      { label: "Total Orders", value: dashboardStats.totalOrders, isCurrency: false, color: "bg-blue-500" },
                      { label: "Pending Orders", value: dashboardStats.pendingOrders, isCurrency: false, color: "bg-yellow-500" },
                      { label: "Completed Orders", value: dashboardStats.completedOrders, isCurrency: false, color: "bg-green-500" },
                      { label: "Cancelled Orders", value: dashboardStats.totalOrders - dashboardStats.pendingOrders - dashboardStats.completedOrders, isCurrency: false, color: "bg-red-500" },
                      { label: "Total Revenue", value: calculateCompletedRevenue(), isCurrency: true, color: "bg-indigo-500" },
                    ].map((stat, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
                          <span className="font-medium text-gray-700">{stat.label}</span>
                        </div>
                        <span className="font-bold text-orange-600">
                          {stat.isCurrency ? formatCurrency(stat.value) : stat.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{order.customer_name}</p>
                          <p className="text-sm text-gray-600 truncate">{order.customer_phone}</p>
                          <p className="text-xs text-gray-500 truncate">{formatDate(order.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-4 ml-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)} whitespace-nowrap`}>
                            {order.status}
                          </span>
                          <span className="font-bold text-orange-600 whitespace-nowrap">
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

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Enhanced Profile Settings Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-xl w-full max-w-2xl shadow-2xl border border-white/20 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200/50">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                  <FontAwesomeIcon icon={faUserShield} className="text-blue-500" />
                  Account Settings
                </h2>
                <button 
                  onClick={closeProfileModal}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100/50 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            </div>
            
            <form onSubmit={updateCredentials} className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="space-y-6">
                {/* Account Information Section */}
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-200/50">
                  <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <FontAwesomeIcon icon={faUser} />
                    Account Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-gray-400" />
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="mb-2 p-2 bg-white rounded border border-gray-200">
                        <p className="text-sm text-gray-600">Current: <span className="font-medium">{user?.email}</span></p>
                      </div>
                      <input
                        type="email"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm"
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
                <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-200/50">
                  <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                    <FontAwesomeIcon icon={faKey} />
                    Change Password
                  </h3>
                  <div className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={profileData.currentPassword}
                          onChange={(e) => setProfileData({...profileData, currentPassword: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/80 backdrop-blur-sm"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={profileData.newPassword}
                          onChange={(e) => setProfileData({...profileData, newPassword: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/80 backdrop-blur-sm"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={profileData.confirmPassword}
                          onChange={(e) => setProfileData({...profileData, confirmPassword: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/80 backdrop-blur-sm"
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
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeProfileModal}
                    className="flex-1 bg-gray-500/80 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium backdrop-blur-sm flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faCancel} />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="flex-1 bg-blue-500/90 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium backdrop-blur-sm disabled:opacity-50 flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-xl w-full max-w-4xl shadow-2xl border border-white/20 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200/50">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
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
            
            <form onSubmit={saveProduct} className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Image Upload & Preview */}
                <div className="space-y-4">
                  {/* Image Upload Section */}
                  <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-200/50">
                    <h3 className="font-semibold text-gray-800 mb-3">Product Image</h3>
                    
                    {/* File Upload */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FontAwesomeIcon icon={faCloudUpload} className="text-gray-400" />
                        Upload Image
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-400 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer block">
                          <FontAwesomeIcon icon={faUpload} className="text-gray-400 text-2xl mb-2" />
                          <p className="text-sm text-gray-600">
                            {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF, WebP up to 5MB</p>
                        </label>
                      </div>
                    </div>

                    {/* Image URL Input */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FontAwesomeIcon icon={faLink} className="text-gray-400" />
                        Or enter image URL
                      </label>
                      <input
                        type="url"
                        value={productForm.image_url}
                        onChange={(e) => handleImageUrlChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/80"
                        placeholder="https://example.com/image.jpg"
                      />
                      {productForm.image_url && !validateImageUrl(productForm.image_url) && (
                        <p className="text-red-500 text-xs mt-1">Please enter a valid URL</p>
                      )}
                    </div>

                    {/* Image Preview */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                      <div className="border border-gray-200 rounded-lg p-3 bg-white/50">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/300x200/FFA500/FFFFFF?text=Invalid+Image";
                            }}
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FontAwesomeIcon icon={faImage} className="text-gray-400 text-2xl" />
                            <span className="text-gray-500 ml-2">No image selected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Product Details Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/80"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/80"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/80"
                      placeholder="Enter price"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-gray-50/50 rounded-lg border border-gray-200/50">
                    <input
                      type="checkbox"
                      id="product-available"
                      checked={productForm.is_available}
                      onChange={(e) => setProductForm({...productForm, is_available: e.target.checked})}
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 w-4 h-4"
                    />
                    <label htmlFor="product-available" className="text-sm text-gray-700 font-medium">
                      Available for sale
                    </label>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeProductModal}
                      className="flex-1 bg-gray-500/80 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium backdrop-blur-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="flex-1 bg-orange-500/90 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium backdrop-blur-sm disabled:opacity-50 flex items-center justify-center gap-2"
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
    </div>
  );
}
