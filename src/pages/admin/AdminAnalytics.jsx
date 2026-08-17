import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { supabase } from '../../lib/supabaseClient';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('7d');
  const [stats, setStats] = useState({
    totalRevenue: 0, totalOrders: 0, totalCustomers: 0, totalProducts: 0,
    pendingOrders: 0, deliveredOrders: 0, cancelledOrders: 0, averageOrderValue: 0,
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
    const now = new Date();
    let startDate = new Date();

    if (period === '7d') startDate.setDate(now.getDate() - 7);
    else if (period === '30d') startDate.setDate(now.getDate() - 30);
    else if (period === 'today') startDate.setHours(0, 0, 0, 0);
    else if (period === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);

    const startISO = startDate.toISOString();

    const { data: revenueData } = await supabase.from('orders').select('total_amount, status').gte('created_at', startISO).not('status', 'eq', 'cancelled');
    const totalRevenue = (revenueData || []).reduce((sum, order) => sum + parseFloat(order.total_amount), 0);

    const { count: totalOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', startISO);
    const { count: totalCustomers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: totalProducts } = await supabase.from('products').select('*', { count: 'exact', head: true });

    const { data: statusData } = await supabase.from('orders').select('status').gte('created_at', startISO);
    const pendingOrders = (statusData || []).filter((o) => o.status === 'pending').length;
    const deliveredOrders = (statusData || []).filter((o) => o.status === 'delivered').length;
    const cancelledOrders = (statusData || []).filter((o) => o.status === 'cancelled').length;

    const { data: allOrders } = await supabase.from('orders').select('created_at, total_amount, status').gte('created_at', startISO).not('status', 'eq', 'cancelled').order('created_at');
    const salesMap = {};
    (allOrders || []).forEach((order) => {
      const day = new Date(order.created_at).toLocaleDateString();
      if (!salesMap[day]) salesMap[day] = 0;
      salesMap[day] += parseFloat(order.total_amount);
    });
    const salesByDayData = Object.entries(salesMap).map(([day, total]) => ({ day, total: Math.round(total * 100) / 100 }));

    const statusCounts = {
      Pending: pendingOrders,
      Confirmed: (statusData || []).filter((o) => o.status === 'confirmed').length,
      Preparing: (statusData || []).filter((o) => o.status === 'preparing').length,
      Shipped: (statusData || []).filter((o) => o.status === 'shipped').length,
      Delivered: deliveredOrders,
      Cancelled: cancelledOrders,
    };
    const ordersByStatusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    const { data: orderItems } = await supabase.from('order_items').select('product_name, quantity, products (name)').gte('created_at', startISO);
    const productSales = {};
    (orderItems || []).forEach((item) => {
      const name = item.product_name || item.products?.name || 'Deleted Product';
      if (!productSales[name]) productSales[name] = 0;
      productSales[name] += item.quantity;
    });
    const bestSellingData = Object.entries(productSales).map(([name, quantity]) => ({ name, quantity })).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    const { data: orderItemsWithCategory } = await supabase.from('order_items').select('quantity, products (name, categories (name))').gte('created_at', startISO);
    const categorySalesMap = {};
    (orderItemsWithCategory || []).forEach((item) => {
      const categoryName = item.products?.categories?.name || 'Uncategorized';
      if (!categorySalesMap[categoryName]) categorySalesMap[categoryName] = 0;
      categorySalesMap[categoryName] += item.quantity;
    });
    const categorySalesData = Object.entries(categorySalesMap).map(([name, quantity]) => ({ name, quantity }));

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
      <div className="flex gap-2 mb-4 md:mb-6 flex-wrap">
        {['today', '7d', '30d', 'month'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm transition ${
              period === p ? 'bg-gray-800 text-white' : 'bg-white text-gray-600'
            }`}
          >
            {p === 'today' ? 'Today' : p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : 'Month'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12"><p className="text-gray-500">Loading analytics...</p></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-gray-500 text-[10px] md:text-xs">Revenue</h3>
              <p className="text-lg md:text-xl font-bold">ج.م {stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-gray-500 text-[10px] md:text-xs">Orders</h3>
              <p className="text-lg md:text-xl font-bold">{stats.totalOrders}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-gray-500 text-[10px] md:text-xs">Customers</h3>
              <p className="text-lg md:text-xl font-bold">{stats.totalCustomers}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-gray-500 text-[10px] md:text-xs">Products</h3>
              <p className="text-lg md:text-xl font-bold">{stats.totalProducts}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Sales Over Time</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Orders by Status</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={ordersByStatus} cx="50%" cy="50%" outerRadius={70} fill="#8884d8" dataKey="value" label>
                    {ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Best Selling</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={bestSelling}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Category Sales</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categorySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}