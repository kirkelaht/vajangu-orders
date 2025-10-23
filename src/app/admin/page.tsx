'use client';

import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingWeights, setEditingWeights] = useState<{[key: string]: number}>({});
  const [filters, setFilters] = useState({
    ring: '',
    stop: '',
    status: '',
    month: 'current'
  });

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    weight: '',
    uom: 'kg'
  });
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({
    subject: '',
    message: ''
  });

  // Check for existing authentication on component mount
  useEffect(() => {
    const isAuth = sessionStorage.getItem('vajangu_admin_auth') === 'true';
    if (isAuth) {
      setIsAuthenticated(true);
    }
  }, []);

  // Load orders when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  async function fetchOrders() {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (data.ok) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...orders];

    if (filters.ring) {
      filtered = filtered.filter(order => 
        order.ring.region.toLowerCase().includes(filters.ring.toLowerCase())
      );
    }

    if (filters.stop) {
      filtered = filtered.filter(order => 
        order.stop.name.toLowerCase().includes(filters.stop.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    if (filters.month === 'current') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      });
    } else if (filters.month === 'previous') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return !(orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear);
      });
    }
    // If filters.month === 'all', no additional filtering is applied

    setFilteredOrders(filtered);
  }

  function clearFilters() {
    setFilters({
      ring: '',
      stop: '',
      status: '',
      month: 'current'
    });
  }

  function getUniqueRings() {
    const rings = [...new Set(orders.map(order => order.ring.region))];
    return rings.sort();
  }

  function getUniqueStops() {
    const stops = [...new Set(orders.map(order => order.stop.name))];
    return stops.sort();
  }

  function openOrderDetails(order: any) {
    setSelectedOrder(order);
    setShowModal(true);
    // Initialize editing weights with current values
    const weights: {[key: string]: number} = {};
    order.lines.forEach((line: any) => {
      weights[line.id] = line.packedWeight || line.requestedQty;
    });
    setEditingWeights(weights);
  }

  function openOrderEdit(order: any) {
    setSelectedOrder(order);
    setShowModal(true);
    // Initialize editing weights with current values
    const weights: {[key: string]: number} = {};
    order.lines.forEach((line: any) => {
      weights[line.id] = line.packedWeight || line.requestedQty;
    });
    setEditingWeights(weights);
    // Scroll to weight editing section after modal opens
    setTimeout(() => {
      const weightSection = document.querySelector('[data-weight-section]');
      if (weightSection) {
        weightSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  function printOrder(order: any) {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Tellimus ${order.id.slice(-8)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .order-info { margin-bottom: 20px; }
            .customer-info { margin-bottom: 20px; }
            .products { margin-bottom: 20px; }
            .product-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🐷 VAJANGU PEREFARM</h1>
            <h2>Tellimus #${order.id.slice(-8)}</h2>
            <p>Loodud: ${formatDate(order.createdAt)}</p>
          </div>
          
          <div class="order-info">
            <h3>Tellimuse andmed</h3>
            <p><strong>Ring:</strong> ${order.ring.region}</p>
            <p><strong>Peatus:</strong> ${order.stop.name}</p>
            <p><strong>Tarne tüüp:</strong> ${order.deliveryType === 'HOME' ? 'Kodune tarne' : 'Peatusse tarne'}</p>
            ${order.deliveryAddress ? `<p><strong>Tarneaadress:</strong> ${order.deliveryAddress}</p>` : ''}
            <p><strong>Maksemeetod:</strong> ${order.paymentMethod === 'TRANSFER' ? 'Ülekandega' : 'Sularaha'}</p>
            <p><strong>Staatus:</strong> ${getStatusText(order.status)}</p>
            ${order.notesCustomer ? `<p><strong>Kliendi märkused:</strong> ${order.notesCustomer}</p>` : ''}
            ${order.notesInternal ? `<p><strong>Lisainfo:</strong> ${order.notesInternal}</p>` : ''}
          </div>
          
          <div class="customer-info">
            <h3>Kliendi andmed</h3>
            <p><strong>Nimi:</strong> ${order.customer.name}</p>
            <p><strong>Telefon:</strong> ${order.customer.phone}</p>
            <p><strong>E-post:</strong> ${order.customer.email}</p>
            ${order.customer.orgName ? `<p><strong>Ettevõte:</strong> ${order.customer.orgName}</p>` : ''}
          </div>
          
          <div class="products">
            <h3>Tooted</h3>
            ${order.lines.map((line: any) => `
              <div class="product-row">
                <span>${line.product.name} (${line.product.sku})</span>
                <span>Tellitud: ${line.requestedQty} ${line.uom.toLowerCase()}</span>
                <span>Pakis: ${line.packedWeight || line.requestedQty} ${line.uom.toLowerCase()}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="order-total" style="margin: 20px 0; padding: 15px; background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 18px; font-weight: bold; color: #1f2937;">Eeldatav maksumus:</div>
                <div style="font-size: 14px; color: #6b7280;">Täpne summa selgub peale kauba komplekteerimist!</div>
              </div>
              <span style="font-size: 24px; font-weight: bold; color: #059669;">
                ${calculateOrderTotal(order).toFixed(2)}€
              </span>
            </div>
          </div>
          
          <div class="footer">
            <p>Vajangu Perefarm | Kõrgekvaliteediline kodumaine sealiha</p>
            <p>Trükitud: ${new Date().toLocaleString('et-EE')}</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      });
      if (res.ok) {
        fetchOrders(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }

  async function updatePackedWeights(orderId: string, lineId: string, weight: number) {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, lineId, packedWeight: weight })
      });
      if (res.ok) {
        fetchOrders(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to update weight:', error);
    }
  }

  function printPackingList() {
    // Group products by stop and ring
    const groupedOrders: {[key: string]: any[]} = {};
    filteredOrders.forEach(order => {
      const key = `${order.stop.name} - ${order.ring.region}`;
      if (!groupedOrders[key]) {
        groupedOrders[key] = [];
      }
      groupedOrders[key].push(order);
    });

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Pakkimise nimekiri - Vajangu Perefarm</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .ring-section { margin-bottom: 40px; page-break-inside: avoid; }
            .ring-title { background: #f0f0f0; padding: 10px; font-weight: bold; margin-bottom: 15px; }
            .order { margin-bottom: 20px; border: 1px solid #ddd; padding: 10px; }
            .customer-name { font-weight: bold; margin-bottom: 8px; }
            .products { margin-left: 20px; }
            .product-item { margin-bottom: 5px; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🐷 VAJANGU PEREFARM</h1>
            <h2>Pakkimise nimekiri</h2>
            <p>Trükitud: ${new Date().toLocaleString('et-EE')}</p>
          </div>
          
          ${Object.entries(groupedOrders).map(([ringStop, orders]) => `
            <div class="ring-section">
              <div class="ring-title">${ringStop}</div>
              ${orders.map(order => `
                <div class="order">
                  <div class="customer-name">${order.customer.name} - 📞 ${order.customer.phone}</div>
                  <div class="products">
                    ${order.lines.map((line: any) => `
                      <div class="product-item">
                        ${line.packedWeight || line.requestedQty} ${line.uom.toLowerCase()} - ${line.product.name}
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          `).join('')}
          
          <div class="footer">
            <p>Vajangu Perefarm | Kõrgekvaliteediline kodumaine sealiha</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }

  function printTransportSheet() {
    // Group orders by stop name and include ring info for sorting
    const groupedByStop: {[key: string]: {orders: any[], ring: string, sortOrder: number}} = {};
    filteredOrders.forEach(order => {
      const stopName = order.stop.name;
      if (!groupedByStop[stopName]) {
        groupedByStop[stopName] = {
          orders: [],
          ring: order.ring.region,
          sortOrder: order.stop.sortOrder || 0
        };
      }
      groupedByStop[stopName].orders.push(order);
    });

    // Sort stops by ring name first, then by sortOrder
    const sortedStops = Object.entries(groupedByStop).sort((a, b) => {
      const [stopA, dataA] = a;
      const [stopB, dataB] = b;
      
      // First sort by ring name
      if (dataA.ring !== dataB.ring) {
        return dataA.ring.localeCompare(dataB.ring);
      }
      
      // Then sort by sortOrder within the same ring
      return dataA.sortOrder - dataB.sortOrder;
    });

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Transpordi leht - Vajangu Perefarm</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .stop-section { margin-bottom: 40px; page-break-inside: avoid; }
            .stop-title { background: #e3f2fd; padding: 15px; font-weight: bold; font-size: 18px; margin-bottom: 20px; border-left: 4px solid #2196f3; }
            .order { margin-bottom: 15px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
            .customer-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            .customer-name { font-weight: bold; font-size: 16px; }
            .customer-phone { color: #666; font-size: 14px; }
            .order-content { margin: 10px 0; }
            .product-item { margin: 5px 0; padding: 3px 0; border-bottom: 1px solid #f0f0f0; }
            .order-total { text-align: right; font-weight: bold; font-size: 16px; color: #2e7d32; margin-top: 10px; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🐷 VAJANGU PEREFARM</h1>
            <h2>Transpordi leht</h2>
            <p>Trükitud: ${new Date().toLocaleString('et-EE')}</p>
          </div>
          
          ${sortedStops.map(([stopName, data]) => `
            <div class="stop-section">
              <div class="stop-title">📍 ${stopName} (${data.ring})</div>
              ${data.orders.map(order => `
                <div class="order">
                  <div class="customer-info">
                    <div class="customer-name">${order.customer.name}</div>
                    <div class="customer-phone">📞 ${order.customer.phone}</div>
                  </div>
                  <div class="order-content">
                    ${order.lines.map((line: any) => `
                      <div class="product-item">
                        ${line.packedWeight || line.requestedQty} ${line.uom.toLowerCase()} - ${line.product.name}
                      </div>
                    `).join('')}
                  </div>
                  <div class="order-total">
                    Summa: ${calculateOrderTotal(order).toFixed(2)}€
                  </div>
                </div>
              `).join('')}
            </div>
          `).join('')}
          
          <div class="footer">
            <p>Vajangu Perefarm | Kõrgekvaliteediline kodumaine sealiha</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }

  function exportToExcel() {
    // Create Excel data with each product as separate row
    const excelData: any[] = [];
    
    filteredOrders.forEach(order => {
      // If order has no products, still create one row
      if (order.lines.length === 0) {
        excelData.push({
          'Ring': order.ring.region,
          'Peatus': order.stop.name,
          'Kliendi nimi': order.customer.name,
          'Telefon': order.customer.phone,
          'E-post': order.customer.email,
          'Ettevõte': order.customer.orgName || '',
          'Tarne tüüp': order.deliveryType === 'HOME' ? 'Kodune tarne' : 'Peatusse tarne',
          'Tarneaadress': order.deliveryAddress || '',
          'Maksemeetod': order.paymentMethod === 'TRANSFER' ? 'Ülekandega' : 'Sularaha',
          'Staatus': getStatusText(order.status),
          'Loodud': formatDate(order.createdAt),
          'Toote nimi': '',
          'Toote kood': '',
          'Kogus': '',
          'Ühik': '',
          'Tellimuse ID': order.id.slice(-8)
        });
      } else {
        // Create one row for each product
        order.lines.forEach((line: any) => {
          excelData.push({
            'Ring': order.ring.region,
            'Peatus': order.stop.name,
            'Kliendi nimi': order.customer.name,
            'Telefon': order.customer.phone,
            'E-post': order.customer.email,
            'Ettevõte': order.customer.orgName || '',
            'Tarne tüüp': order.deliveryType === 'HOME' ? 'Kodune tarne' : 'Peatusse tarne',
            'Tarneaadress': order.deliveryAddress || '',
            'Maksemeetod': order.paymentMethod === 'TRANSFER' ? 'Ülekandega' : 'Sularaha',
            'Staatus': getStatusText(order.status),
            'Loodud': formatDate(order.createdAt),
            'Toote nimi': line.product.name,
            'Toote kood': line.product.sku,
            'Kogus': line.packedWeight || line.requestedQty,
            'Ühik': line.uom.toLowerCase(),
            'Tellimuse ID': order.id.slice(-8)
          });
        });
      }
    });

    // Convert to CSV
    const headers = Object.keys(excelData[0]);
    const csvContent = [
      headers.join(','),
      ...excelData.map(row => 
        headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    // Download CSV
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tellimused_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('et-EE');
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800';
      case 'ACCEPTED': return 'bg-green-100 text-green-800';
      case 'FULFILLING': return 'bg-yellow-100 text-yellow-800';
      case 'READY': return 'bg-purple-100 text-purple-800';
      case 'ON_THE_WAY': return 'bg-orange-100 text-orange-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'CREDIT': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'NEW': return 'Uus';
      case 'ACCEPTED': return 'Tellimus vastu võetud';
      case 'FULFILLING': return 'Täitmisel';
      case 'READY': return 'Saada arve';
      case 'ON_THE_WAY': return 'Teel';
      case 'DELIVERED': return 'Kättetoimetatud';
      case 'CANCELLED': return 'Tühistatud';
      case 'CREDIT': return 'Krediitarve';
      default: return status;
    }
  }

  function calculateOrderTotal(order: any) {
    return order.lines.reduce((total: number, line: any) => {
      const unitPrice = line.unitPrice ? parseFloat(line.unitPrice) : 0;
      const quantity = line.packedWeight || line.requestedQty;
      return total + (unitPrice * quantity);
    }, 0);
  }

  function calculateOrderTotalWithEditingWeights(order: any) {
    return order.lines.reduce((total: number, line: any) => {
      const unitPrice = line.unitPrice ? parseFloat(line.unitPrice) : 0;
      const quantity = editingWeights[line.id] !== undefined ? editingWeights[line.id] : (line.packedWeight || line.requestedQty);
      return total + (unitPrice * quantity);
    }, 0);
  }

  async function addNewProduct() {
    if (!newProduct.name.trim() || !newProduct.price || !newProduct.weight) {
      alert('Palun täitke kõik väljad!');
      return;
    }

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          productName: newProduct.name,
          unitPrice: parseFloat(newProduct.price),
          weight: parseFloat(newProduct.weight),
          uom: newProduct.uom
        })
      });

      if (res.ok) {
        // Refresh the order data and update selected order
        await fetchOrders();
        // Find and update the selected order with fresh data
        const updatedOrders = await fetch('/api/admin/orders').then(r => r.json());
        if (updatedOrders.ok) {
          const updatedOrder = updatedOrders.orders.find((o: any) => o.id === selectedOrder.id);
          if (updatedOrder) {
            setSelectedOrder(updatedOrder);
            // Update editing weights for the new product
            const newWeights: {[key: string]: number} = {};
            updatedOrder.lines.forEach((line: any) => {
              newWeights[line.id] = line.packedWeight || line.requestedQty;
            });
            setEditingWeights(newWeights);
          }
        }
        // Reset form
        setNewProduct({ name: '', price: '', weight: '', uom: 'kg' });
        setShowAddProduct(false);
        alert('Toode lisatud!');
      } else {
        const error = await res.json();
        alert('Viga: ' + error.error);
      }
    } catch (error) {
      console.error('Failed to add product:', error);
      alert('Viga toote lisamisel');
    }
  }

  async function sendInvoice() {
    if (!selectedOrder) return;

    const confirmed = confirm(`Kas soovite saata arve kliendile ${selectedOrder.customer.name} (${selectedOrder.customer.email})?`);
    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id
        })
      });

      const result = await res.json();
      
      if (result.ok) {
        alert(`Arve ${result.invoiceNumber} on saadetud kliendile!`);
        // Update order status to INVOICED
        await updateOrderStatus(selectedOrder.id, 'INVOICED');
        // Refresh orders to show updated status
        await fetchOrders();
      } else {
        alert('Viga arve saatmisel: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to send invoice:', error);
      alert('Viga arve saatmisel');
    }
  }

  async function sendEmailToClient() {
    if (!selectedOrder || !emailData.subject.trim() || !emailData.message.trim()) {
      alert('Palun täitke kõik väljad!');
      return;
    }

    try {
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          subject: emailData.subject,
          message: emailData.message
        })
      });

      const result = await res.json();
      
      if (result.ok) {
        alert('E-kiri on saadetud kliendile!');
        setShowEmailModal(false);
        setEmailData({ subject: '', message: '' });
      } else {
        alert('Viga e-kirja saatmisel: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Viga e-kirja saatmisel');
    }
  }

  // Authentication functions
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Get admin password from environment or use default
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'vajangu2025';
    
    if (password === adminPassword) {
      setIsAuthenticated(true);
      setLoginError('');
      // Store authentication in sessionStorage for persistence
      sessionStorage.setItem('vajangu_admin_auth', 'true');
    } else {
      setLoginError('Vale parool!');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setLoginError('');
    // Clear authentication from sessionStorage
    sessionStorage.removeItem('vajangu_admin_auth');
  };

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Vajangu Perefarm</h1>
            <p className="text-gray-600">Admin sisselogimine</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Parool
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                placeholder="Sisestage parool"
                required
              />
            </div>
            
            {loginError && (
              <div className="text-red-600 text-sm text-center">
                {loginError}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Logi sisse
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Kontakt: info@perefarm.ee</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Laen tellimusi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 flex items-center justify-center">
                <img 
                  src="/perefarm_logo.png" 
                  alt="Vajangu Perefarm Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling.style.display = 'block';
                  }}
                />
                <span className="text-gray-800 font-bold text-xl hidden">🐷</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">VAJANGU PEREFARM</h1>
                <p className="text-sm text-gray-600">Tellimuste haldus</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Logi välja
              </button>
              <button 
                onClick={printPackingList}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Prindi pakkimise nimekiri
              </button>
              <button 
                onClick={printTransportSheet}
                className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors"
              >
                Prindi transpordi leht
              </button>
              <button 
                onClick={exportToExcel}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                Ekspordi Excel
              </button>
              <button 
                onClick={fetchOrders}
                className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
              >
                Värskenda
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Filtrid</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Ring Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ring</label>
                <select
                  value={filters.ring}
                  onChange={(e) => setFilters({...filters, ring: e.target.value})}
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="">Kõik ringid</option>
                  {getUniqueRings().map(ring => (
                    <option key={ring} value={ring}>{ring}</option>
                  ))}
                </select>
              </div>

              {/* Stop Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Peatus</label>
                <select
                  value={filters.stop}
                  onChange={(e) => setFilters({...filters, stop: e.target.value})}
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="">Kõik peatused</option>
                  {getUniqueStops().map(stop => (
                    <option key={stop} value={stop}>{stop}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Staatus</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="">Kõik staatused</option>
                  <option value="NEW">Uus</option>
                  <option value="ACCEPTED">Tellimus vastu võetud</option>
                  <option value="FULFILLING">Täitmisel</option>
                  <option value="READY">Saada arve</option>
                  <option value="ON_THE_WAY">Teel</option>
                  <option value="DELIVERED">Kättetoimetatud</option>
                  <option value="CANCELLED">Tühistatud</option>
                  <option value="CREDIT">Krediitarve</option>
                </select>
              </div>

              {/* Month Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kuupäev</label>
                <select
                  value={filters.month}
                  onChange={(e) => setFilters({...filters, month: e.target.value})}
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="current">Käesolev kuu</option>
                  <option value="previous">Eelmised kuud</option>
                  <option value="all">Kõik tellimused</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Tühjenda filtrid
                </button>
              </div>
            </div>
            
            {/* Filter Summary */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-800">
                  <span className="font-medium">Näidatakse:</span> {filteredOrders.length} tellimust
                  {filters.month === 'current' && ' (käesolev kuu)'}
                  {filters.month === 'previous' && ' (eelmised kuud)'}
                  {filters.month === 'all' && ' (kõik tellimused)'}
                </div>
                <div className="text-xs text-blue-600">
                  Kokku andmebaasis: {orders.length} tellimust
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Tellimused ({filteredOrders.length} / {orders.length})
            </h2>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>{orders.length === 0 ? 'Tellimusi ei leitud' : 'Filtritele vastavaid tellimusi ei leitud'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tegevused
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Klient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ring
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Peatus
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tooted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Summa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Maksemeetod
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staatus
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loodud
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tellimuse ID
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => openOrderDetails(order)}
                            className="text-blue-600 hover:text-blue-900 text-left"
                          >
                            Vaata
                          </button>
                          <button
                            onClick={() => openOrderEdit(order)}
                            className="text-orange-600 hover:text-orange-900 text-left"
                            title="Muuda toodete kaalu"
                          >
                            Muuda
                          </button>
                          <button
                            onClick={() => printOrder(order)}
                            className="text-green-600 hover:text-green-900 text-left"
                          >
                            Prindi
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                        <div className="text-sm text-gray-500">{order.customer.email}</div>
                        <div className="text-sm text-gray-500">{order.customer.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.ring.region}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.stop.name}
                        {order.deliveryType === 'HOME' && (
                          <div className="text-xs text-blue-600 mt-1">
                            Kodune tarne: {order.deliveryAddress || 'Aadress puudub'}
                          </div>
                        )}
                        <div className="text-xs mt-1">
                          {order.notesCustomer && (
                            <div className="text-blue-600">🏠 Aadress</div>
                          )}
                          {order.notesInternal && (
                            <div className="text-orange-600">💬 Lisainfo</div>
                          )}
                          {!order.notesCustomer && !order.notesInternal && (
                            <div className="text-gray-400">-</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.lines.map((line: any, index: number) => (
                            <div key={index} className="text-xs">
                              {line.product.name} - {line.requestedQty} {line.uom.toLowerCase()}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {calculateOrderTotal(order).toFixed(2)}€
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.paymentMethod === 'TRANSFER' ? 'Ülekandega' : 'Sularaha'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {order.id.slice(-8)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Tellimus #{selectedOrder.id.slice(-8)}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Sulge</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Order Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Customer Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Kliendi andmed</h4>
                  <p><strong>Nimi:</strong> {selectedOrder.customer.name}</p>
                  <p><strong>Telefon:</strong> {selectedOrder.customer.phone}</p>
                  <p><strong>E-post:</strong> {selectedOrder.customer.email}</p>
                  {selectedOrder.customer.orgName && (
                    <p><strong>Ettevõte:</strong> {selectedOrder.customer.orgName}</p>
                  )}
                </div>

                {/* Order Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Tellimuse andmed</h4>
                  <p><strong>Ring:</strong> {selectedOrder.ring.region}</p>
                  <p><strong>Peatus:</strong> {selectedOrder.stop.name}</p>
                  <p><strong>Tarne tüüp:</strong> {selectedOrder.deliveryType === 'HOME' ? 'Kodune tarne' : 'Peatusse tarne'}</p>
                  {selectedOrder.deliveryAddress && (
                    <p><strong>Tarneaadress:</strong> {selectedOrder.deliveryAddress}</p>
                  )}
                  <p><strong>Maksemeetod:</strong> {selectedOrder.paymentMethod === 'TRANSFER' ? 'Ülekandega' : 'Sularaha'}</p>
                </div>
              </div>

              {/* Customer Comments */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Kliendi märkused ja lisainfo</h4>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  {selectedOrder.notesCustomer ? (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">🏠 Tarneaadress:</p>
                      <p className="text-gray-800 bg-white p-2 rounded border">{selectedOrder.notesCustomer}</p>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 italic">Tarneaadress puudub</p>
                    </div>
                  )}
                  {selectedOrder.notesInternal ? (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">💬 Lisainfo tellimuse kohta:</p>
                      <p className="text-gray-800 bg-white p-2 rounded border">{selectedOrder.notesInternal}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-500 italic">Lisainfo puudub</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Management */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Staatus</h4>
                <div className="flex space-x-2">
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="NEW">Uus</option>
                    <option value="ACCEPTED">Tellimus vastu võetud</option>
                    <option value="FULFILLING">Täitmisel</option>
                    <option value="READY">Saada arve</option>
                    <option value="ON_THE_WAY">Teel</option>
                    <option value="DELIVERED">Kättetoimetatud</option>
                    <option value="CANCELLED">Tühistatud</option>
                    <option value="CREDIT">Krediitarve</option>
                  </select>
                </div>
              </div>

              {/* Products with Weight Editing */}
              <div className="mb-6" data-weight-section>
                <h4 className="font-semibold text-gray-800 mb-3">Tooted ja kaalud</h4>
                {selectedOrder.status === 'FULFILLING' && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ℹ️ <strong>Täitmisel</strong> staatuses saate korrigeerida toodete koguseid
                    </p>
                  </div>
                )}
                
                {/* Add New Product Section */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-800">Lisa uus toode</h4>
                    <button
                      onClick={() => setShowAddProduct(!showAddProduct)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      {showAddProduct ? 'Tühista' : 'Lisa toode'}
                    </button>
                  </div>
                  
                  {showAddProduct && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Toote nimi</label>
                        <input
                          type="text"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                          placeholder="Sisesta toote nimi"
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hind (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                          placeholder="0.00"
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kaal/Kogus</label>
                        <input
                          type="number"
                          step="0.1"
                          value={newProduct.weight}
                          onChange={(e) => setNewProduct({...newProduct, weight: e.target.value})}
                          placeholder="0.0"
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ühik</label>
                        <select
                          value={newProduct.uom}
                          onChange={(e) => setNewProduct({...newProduct, uom: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="kg">kg</option>
                          <option value="tk">tk</option>
                        </select>
                      </div>
                    </div>
                  )}
                  
                  {showAddProduct && (
                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setNewProduct({ name: '', price: '', weight: '', uom: 'kg' });
                          setShowAddProduct(false);
                        }}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Tühista
                      </button>
                      <button
                        onClick={addNewProduct}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Lisa toode
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {selectedOrder.lines.map((line: any) => (
                    <div key={line.id} className="flex items-center justify-between p-4 bg-white border border-gray-300 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-700 font-medium">{line.product.name} ({line.uom.toLowerCase()})</span>
                          <span className="text-sm text-gray-500">
                            {line.unitPrice ? `${parseFloat(line.unitPrice).toFixed(2)}€/${line.uom.toLowerCase()}` : 'Hind puudub'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-green-600">
                            {line.unitPrice ? `${(parseFloat(line.unitPrice) * (editingWeights[line.id] || line.packedWeight || line.requestedQty)).toFixed(2)}€` : 'Hind puudub'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Tellitud: {line.requestedQty} {line.uom.toLowerCase()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <label className="text-sm text-gray-600">Pakis:</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="0"
                          value={editingWeights[line.id] !== undefined ? editingWeights[line.id] : line.requestedQty}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Handle empty string and valid numbers
                            if (value === '') {
                              setEditingWeights({
                                ...editingWeights,
                                [line.id]: 0
                              });
                            } else {
                              // Replace comma with dot for proper parsing (Estonian keyboard support)
                              const normalizedValue = value.replace(',', '.');
                              const parsedValue = parseFloat(normalizedValue);
                              if (!isNaN(parsedValue)) {
                                setEditingWeights({
                                  ...editingWeights,
                                  [line.id]: parsedValue
                                });
                              }
                            }
                          }}
                          onKeyDown={(e) => {
                            // Allow all number keys, decimal point, backspace, delete, arrow keys, etc.
                            if (e.key >= '0' && e.key <= '9') {
                              return; // Allow all numbers
                            }
                            if (e.key === '.' || e.key === ',') {
                              return; // Allow both . and , as decimal separators
                            }
                            if (e.key === 'Backspace' || e.key === 'Delete' || 
                                e.key === 'ArrowLeft' || e.key === 'ArrowRight' || 
                                e.key === 'Tab' || e.key === 'Enter' || e.key === 'Escape') {
                              return; // Allow navigation and control keys
                            }
                            if (e.key === '-') {
                              return; // Allow minus sign for negative numbers
                            }
                            // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X for copy/paste
                            if (e.ctrlKey && (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x')) {
                              return;
                            }
                            // Prevent other keys
                            e.preventDefault();
                          }}
                          className="w-20 p-2 border border-gray-300 rounded text-center"
                        />
                        <span className="text-sm text-gray-600">{line.uom.toLowerCase()}</span>
                        <button
                          onClick={() => updatePackedWeights(selectedOrder.id, line.id, editingWeights[line.id] !== undefined ? editingWeights[line.id] : line.requestedQty)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Salvesta
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Order Total */}
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-lg font-bold text-gray-800">Eeldatav maksumus:</div>
                      <div className="text-sm text-gray-600">Täpne summa selgub peale kauba komplekteerimist!</div>
                    </div>
                    <span className="text-2xl font-bold text-green-600">
                      {calculateOrderTotalWithEditingWeights(selectedOrder).toFixed(2)}€
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => printOrder(selectedOrder)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Prindi tellimus
                  </button>
                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    E-kiri kliendile
                  </button>
                  {selectedOrder.status !== 'INVOICED' && selectedOrder.status !== 'CANCELLED' && (
                    <button
                      onClick={sendInvoice}
                      className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                    >
                      Saada arve
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Sulge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Saada e-kiri kliendile</h3>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailData({ subject: '', message: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Saadetakse:</strong> {selectedOrder.customer.name} ({selectedOrder.customer.email})
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teema *
                  </label>
                  <input
                    type="text"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                    placeholder="Sisestage e-kirja teema"
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sõnum *
                  </label>
                  <textarea
                    value={emailData.message}
                    onChange={(e) => setEmailData({...emailData, message: e.target.value})}
                    placeholder="Sisestage e-kirja sisu"
                    rows={8}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailData({ subject: '', message: '' });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Tühista
                </button>
                <button
                  onClick={sendEmailToClient}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Saada e-kiri
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
