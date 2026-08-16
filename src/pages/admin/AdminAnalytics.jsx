import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { supabase } from '../../lib/supabaseClient';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('7d');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    averageOrderValue: 0,
  });
  const [salesByDay, setSalesByDay] = useState([]);
  const [ordersByStatus, setOrdersByStatus] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, [period]);

  async function fetchAllData() {
    setLoading(true);

    // تحديد التاريخ
    const now = new Date();
    let startDate = new Date();

    if (period === '7d') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === '30d') {
      startDate.setDate(now.getDate() - 30);
    } else if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const startISO = startDate.toISOString();

    // 1. Total Revenue
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total_amount, status')
      .gte('created_at', startISO)
      .not('status', 'eq', 'cancelled');

    const totalRevenue = (revenueData || []).reduce(
      (sum, order) => sum + parseFloat(order.total_amount),
      0
    );

    // 2. Total Orders
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startISO);

    // 3. Total Customers
    const { count: totalCustomers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer');

    // 4. Total Products
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    // 5. Orders by Status
    const { data: statusData } = await supabase
      .from('orders')
      .select('status')
      .gte('created_at', startISO);

    const pendingOrders = (statusData || []).filter((o) => o.status === 'pending').length;
    const deliveredOrders = (statusData || []).filter((o) => o.status === 'delivered').length;
    const cancelledOrders = (statusData || []).filter((o) => o.status === 'cancelled').length;

    // 6. Sales by Day
    const { data: allOrders } = await supabase
      .from('orders')
      .select('created_at, total_amount, status')
      .gte('created_at', startISO)
      .not('status', 'eq', 'cancelled')
      .order('created_at');

    const salesMap = {};
    (allOrders || []).forEach((order) => {
      const day = new Date(order.created_at).toLocaleDateString();
      if (!salesMap[day]) salesMap[day] = 0;
      salesMap[day] += parseFloat(order.total_amount);
    });

    const salesByDayData = Object.entries(salesMap).map(([day, total]) => ({
      day,
      total: Math.round(total * 100) / 100,
    }));

    // 7. Orders by Status for Pie Chart
    const statusCounts = {
      Pending: pendingOrders,
      Confirmed: (statusData || []).filter((o) => o.status === 'confirmed').length,
      Preparing: (statusData || []).filter((o) => o.status === 'preparing').length,
      Shipped: (statusData || []).filter((o) => o.status === 'shipped').length,
      Delivered: deliveredOrders,
      Cancelled: cancelledOrders,
    };

    const ordersByStatusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
    }));

    // 8. Best Selling Products
    const { data: orderItems } = await supabase
      .from('order_items')
      .select(`
        product_name,
        quantity,
        products (name)
      `)
      .gte('created_at', startISO);

    const productSales = {};
    (orderItems || []).forEach((item) => {
      const name = item.product_name || item.products?.name || 'Deleted Product';
      if (!productSales[name]) productSales[name] = 0;
      productSales[name] += item.quantity;
    });

    const bestSellingData = Object.entries(productSales)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 9. Category Sales
    const { data: orderItemsWithCategory } = await supabase
      .from('order_items')
      .select(`
        quantity,
        products (
          name,
          categories (name)
        )
      `)
      .gte('created_at', startISO);

    const categorySalesMap = {};
    (orderItemsWithCategory || []).forEach((item) => {
      const categoryName = item.products?.categories?.name || 'Uncategorized';
      if (!categorySalesMap[categoryName]) categorySalesMap[categoryName] = 0;
      categorySalesMap[categoryName] += item.quantity;
    });

    const categorySalesData = Object.entries(categorySalesMap).map(([name, quantity]) => ({
      name,
      quantity,
    }));

    // Update Stats
    setStats({
      totalRevenue,
      totalOrders: totalOrders || 0,
      totalCustomers: totalCustomers || 0,
      totalProducts: totalProducts || 0,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    });

    setSalesByDay(salesByDayData);
    setOrdersByStatus(ordersByStatusData);
    setBestSelling(bestSellingData);
    setCategorySales(categorySalesData);
    setLoading(false);
  }

  const COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#f97316', '#10b981', '#ef4444'];

  return (
    <AdminLayout title="Analytics">
      {/* Period Selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setPeriod('today')}
          className={`px-4 py-2 rounded-lg transition ${
            period === 'today' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setPeriod('7d')}
          className={`px-4 py-2 rounded-lg transition ${
            period === '7d' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600'
          }`}
        >
          Last 7 Days
        </button>
        <button
          onClick={() => setPeriod('30d')}
          className={`px-4 py-2 rounded-lg transition ${
            period === '30d' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600'
          }`}
        >
          Last 30 Days
        </button>
        <button
          onClick={() => setPeriod('month')}
          className={`px-4 py-2 rounded-lg transition ${
            period === 'month' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600'
          }`}
        >
          This Month
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-gray-500 text-sm mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold text-gray-800">
                ج.م {stats.totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-gray-500 text-sm mb-2">Total Orders</h3>
              <p className="text-3xl font-bold text-gray-800">{stats.totalOrders}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-gray-500 text-sm mb-2">Total Customers</h3>
              <p className="text-3xl font-bold text-gray-800">{stats.totalCustomers}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-gray-500 text-sm mb-2">Total Products</h3>
              <p className="text-3xl font-bold text-gray-800">{stats.totalProducts}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-gray-500 text-sm mb-2">Pending Orders</h3>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-gray-500 text-sm mb-2">Delivered Orders</h3>
              <p className="text-3xl font-bold text-green-600">{stats.deliveredOrders}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-gray-500 text-sm mb-2">Cancelled Orders</h3>
              <p className="text-3xl font-bold text-red-600">{stats.cancelledOrders}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-gray-500 text-sm mb-2">Average Order Value</h3>
              <p className="text-3xl font-bold text-gray-800">
                ج.م {stats.averageOrderValue.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Line Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Sales Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Revenue (ج.م)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Orders by Status Pie Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Orders by Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Best Selling Products Bar Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Best Selling Products</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={bestSelling}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantity" fill="#10b981" name="Units Sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Sales Bar Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Sales by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categorySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantity" fill="#f59e0b" name="Units Sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}