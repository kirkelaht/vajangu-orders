'use client';

import { useState, useEffect } from 'react';
import { Order, FilterState, NewProduct, EmailData } from '@/types';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingWeights, setEditingWeights] = useState<{[key: string]: number}>({});
  const [filters, setFilters] = useState<FilterState>({
    ring: '',
    stop: '',
    status: '',
    month: 'current'
  });

  const [newProduct, setNewProduct] = useState<NewProduct>({
    name: '',
    price: '',
    weight: '',
    uom: 'kg'
  });

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState<EmailData>({
    subject: '',
    message: ''
  });
  const [adding, setAdding] = useState(false);

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

  // Auto-refresh orders every 60 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const intervalId = setInterval(() => {
      console.log('[Admin] Auto-refreshing orders...');
      fetchOrders();
    }, 60000); // 60 seconds

    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  async function fetchOrders() {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (data.ok) {
        setOrders(data.orders as Order[]);
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
      filtered = filtered.filter(order => order.ring.region === filters.ring);
    }

    if (filters.stop) {
      filtered = filtered.filter(order => order.stop.name === filters.stop);
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

  function openOrderDetails(order: Order) {
    setSelectedOrder(order);
    setShowModal(true);
    setEditingWeights({});
  }

  function openOrderEdit(order: Order) {
    setSelectedOrder(order);
    setShowModal(true);
    setEditingWeights({});
    setTimeout(() => {
      const weightSection = document.querySelector('[data-weight-section]');
      if (weightSection) {
        weightSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  function printOrder(order: Order) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const orderContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tellimus ${order.id.slice(-8)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          .section h3 { background: #f5f5f5; padding: 10px; margin: 0 0 10px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; font-size: 1.2em; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🐷 Vajangu Perefarm</h1>
          <h2>Tellimus ${order.id.slice(-8)}</h2>
          <p>Kuupäev: ${new Date(order.createdAt).toLocaleDateString('et-EE')}</p>
        </div>
        
        <div class="section">
          <h3>Kliendi andmed</h3>
          <p><strong>Nimi:</strong> ${order.customer.name}</p>
          <p><strong>E-post:</strong> ${order.customer.email}</p>
          <p><strong>Telefon:</strong> ${order.customer.phone}</p>
          ${order.customer.orgName ? `<p><strong>Ettevõte:</strong> ${order.customer.orgName}</p>` : ''}
        </div>
        
        <div class="section">
          <h3>Tarneinfo</h3>
          <p><strong>Ring:</strong> ${order.ring.region}</p>
          <p><strong>Peatus:</strong> ${order.stop.name}</p>
          <p><strong>Kohtumispaik:</strong> ${order.stop.meetingPoint}</p>
          <p><strong>Kuupäev:</strong> ${new Date(order.ring.ringDate).toLocaleDateString('et-EE')}</p>
        </div>
        
        <div class="section">
          <h3>Tooted</h3>
          <table>
            <thead>
              <tr>
                <th>Toode</th>
                <th>Kogus</th>
                <th>Hind</th>
                <th>Summa</th>
              </tr>
            </thead>
            <tbody>
              ${order.lines.map(line => `
                <tr>
                  <td>${line.product.name}</td>
                  <td>${line.requestedQty} ${line.uom.toLowerCase()}</td>
                  <td>${line.unitPrice ? `${parseFloat(line.unitPrice.toString()).toFixed(2)}€` : 'Hind puudub'}</td>
                  <td>${line.unitPrice ? `${(parseFloat(line.unitPrice.toString()) * line.requestedQty).toFixed(2)}€` : 'Hind puudub'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        ${order.notesCustomer || order.notesInternal ? `
          <div class="section">
            <h3>Lisainfo</h3>
            ${order.notesCustomer ? `<p><strong>Kliendi märkused:</strong> ${order.notesCustomer}</p>` : ''}
            ${order.notesInternal ? `<p><strong>Sisemised märkused:</strong> ${order.notesInternal}</p>` : ''}
          </div>
        ` : ''}
      </body>
      </html>
    `;

    printWindow.document.write(orderContent);
    printWindow.document.close();
    printWindow.print();
  }

  async function printPackingList() {
    // Get the first ring from filtered orders
    const firstRing = filteredOrders[0]?.ring?.id;
    if (!firstRing) {
      alert('Ei ole tellimusi printimiseks!');
      return;
    }

    try {
      const res = await fetch(`/api/admin/print/packing?ringId=${firstRing}`);
      const data = await res.json();

      if (!data.ok) {
        alert('Viga andmete laadimisel: ' + data.error);
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const packingContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Pakkimise nimekiri</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 30px; page-break-inside: avoid; }
            .section h2 { background: #f0f0f0; padding: 10px; margin: 0 0 15px 0; }
            .order { margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; }
            .order-header { font-weight: bold; margin-bottom: 10px; }
            .products { margin-left: 20px; }
            .product { margin-bottom: 5px; }
            .total { margin-top: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🐷 Vajangu Perefarm</h1>
            <h2>Pakkimise nimekiri</h2>
            <p>Ring: ${data.ring.region}</p>
            <p>Kuupäev: ${new Date(data.ring.ringDate).toLocaleDateString('et-EE')}</p>
          </div>
          
          ${data.stopGroups.map((group: any) => `
            <div class="section">
              <h2>${group.stop.name} - ${data.ring.region}</h2>
              ${group.orders.map((order: any) => `
                <div class="order">
                  <div class="order-header">
                    ${order.customer.name} (${order.customer.phone}) - Tellimus ${order.id.slice(-8)}
                  </div>
                  <div class="products">
                    ${order.lines.map((line: any) => `
                      <div class="product">
                        ${line.product.name} - ${line.requestedQty} ${line.uom.toLowerCase()}
                      </div>
                    `).join('')}
                  </div>
                  <div class="total">
                    Kokku: ${order.orderTotal.toFixed(2)}€
                  </div>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </body>
        </html>
      `;

      printWindow.document.write(packingContent);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error('Failed to print packing list:', error);
      alert('Viga pakkimise nimekirja printimisel');
    }
  }

  async function printTransportSheet() {
    // Get the first ring from filtered orders
    const firstRing = filteredOrders[0]?.ring?.id;
    if (!firstRing) {
      alert('Ei ole tellimusi printimiseks!');
      return;
    }

    try {
      const res = await fetch(`/api/admin/print/transport?ringId=${firstRing}`);
      const data = await res.json();

      if (!data.ok) {
        alert('Viga andmete laadimisel: ' + data.error);
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const transportContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Transpordi leht</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 30px; page-break-inside: avoid; }
            .section h2 { background: #f0f0f0; padding: 10px; margin: 0 0 15px 0; }
            .order { margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; }
            .order-header { font-weight: bold; margin-bottom: 5px; }
            .order-details { margin-left: 20px; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🐷 Vajangu Perefarm</h1>
            <h2>Transpordi leht</h2>
            <p>Ring: ${data.ring.region}</p>
            <p>Kuupäev: ${new Date(data.ring.ringDate).toLocaleDateString('et-EE')}</p>
          </div>
          
          ${data.stopGroups.map((group: any) => `
            <div class="section">
              <h2>${group.stopName}</h2>
              ${group.orders.map((order: any) => `
                <div class="order">
                  <div class="order-header">
                    ${order.customerName} (${order.customerPhone})
                  </div>
                  <div class="order-details">
                    <p><strong>Tooted:</strong> ${order.orderContent}</p>
                    <p><strong>Summa:</strong> ${order.orderTotal.toFixed(2)}€</p>
                  </div>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </body>
        </html>
      `;

      printWindow.document.write(transportContent);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error('Failed to print transport sheet:', error);
      alert('Viga transpordi lehe printimisel');
    }
  }

  function exportToExcel() {
    const excelData: Array<{
      'Tellimuse ID': string;
      'Kliendi nimi': string;
      'Telefon': string;
      'E-post': string;
      'Ring': string;
      'Peatus': string;
      'Toode': string;
      'Kogus': number;
      'Ühik': string;
      'Hind': number;
      'Summa': number;
      'Staatus': string;
      'Kuupäev': string;
    }> = [];
    
    filteredOrders.forEach(order => {
      order.lines.forEach(line => {
        excelData.push({
          'Tellimuse ID': order.id.slice(-8),
          'Kliendi nimi': order.customer.name,
          'Telefon': order.customer.phone,
          'E-post': order.customer.email,
          'Ring': order.ring.region,
          'Peatus': order.stop.name,
          'Toode': line.product.name,
          'Kogus': line.requestedQty,
          'Ühik': line.uom,
          'Hind': line.unitPrice || 0,
          'Summa': (line.unitPrice || 0) * line.requestedQty,
          'Staatus': order.status,
          'Kuupäev': new Date(order.createdAt).toLocaleDateString('et-EE')
        });
      });
    });

    const csvContent = [
      Object.keys(excelData[0] || {}).join(','),
      ...excelData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tellimused_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      });

      if (res.ok) {
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
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
        setOrders(orders.map(order => 
          order.id === orderId 
            ? {
                ...order,
                lines: order.lines.map(line =>
                  line.id === lineId ? { ...line, packedWeight: weight } : line
                )
              }
            : order
        ));
      }
    } catch (error) {
      console.error('Failed to update weight:', error);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('et-EE');
  }

  function getStatusColor(status: string) {
    const colors: {[key: string]: string} = {
      'NEW': 'bg-gray-100 text-gray-800',
      'ACCEPTED': 'bg-blue-100 text-blue-800',
      'FULFILLING': 'bg-yellow-100 text-yellow-800',
      'READY': 'bg-green-100 text-green-800',
      'ON_THE_WAY': 'bg-purple-100 text-purple-800',
      'DONE': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'INVOICED': 'bg-indigo-100 text-indigo-800',
      'CREDIT': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  function getStatusText(status: string) {
    const texts: {[key: string]: string} = {
      'NEW': 'Uus',
      'ACCEPTED': 'Tellimus vastu võetud',
      'FULFILLING': 'Täitmisel',
      'READY': 'Valmis',
      'ON_THE_WAY': 'Teel',
      'DONE': 'Valmis',
      'CANCELLED': 'Tühistatud',
      'INVOICED': 'Saada arve',
      'CREDIT': 'Krediitarve'
    };
    return texts[status] || status;
  }

  function calculateOrderTotal(order: Order) {
    return order.lines.reduce((total, line) => {
      const unitPrice = line.unitPrice ? parseFloat(line.unitPrice.toString()) : 0;
      const quantity = line.packedWeight || line.requestedQty;
      return total + (unitPrice * quantity);
    }, 0);
  }

  function calculateOrderTotalWithEditingWeights(order: Order) {
    return order.lines.reduce((total, line) => {
      const unitPrice = line.unitPrice ? parseFloat(line.unitPrice.toString()) : 0;
      const quantity = editingWeights[line.id] !== undefined ? editingWeights[line.id] : (line.packedWeight || line.requestedQty);
      return total + (unitPrice * quantity);
    }, 0);
  }

  async function addNewProduct() {
    const normalizedPrice = parseFloat((newProduct.price || '').toString().replace(',', '.'));
    const normalizedWeight = parseFloat((newProduct.weight || '').toString().replace(',', '.'));

    if (!newProduct.name.trim() || !Number.isFinite(normalizedPrice) || normalizedPrice <= 0 || !Number.isFinite(normalizedWeight) || normalizedWeight <= 0) {
      alert('Palun täitke kõik väljad!');
      return;
    }

    if (!selectedOrder) return;

    try {
      setAdding(true);
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          productName: newProduct.name,
          unitPrice: normalizedPrice,
          weight: normalizedWeight,
          uom: newProduct.uom
        })
      });

      const result = await res.json();
      
      if (result.ok && result.orderLine) {
        alert('Toode lisatud!');
        // Keep section open but clear fields
        setNewProduct({ name: '', price: '', weight: '', uom: newProduct.uom });

        // Merge new line (API already formatted it with product info)
        setSelectedOrder(prev => prev ? { ...prev, lines: [...prev.lines, result.orderLine] } : prev);
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, lines: [...o.lines, result.orderLine] } : o));
      } else {
        alert('Viga toote lisamisel: ' + (result.error || 'Teadet ei tagastatud'));
      }
    } catch (error) {
      console.error('Failed to add product:', error);
      alert('Viga toote lisamisel');
    } finally {
      setAdding(false);
    }
  }

  async function sendInvoice() {
    if (!selectedOrder) return;

    try {
      const res = await fetch('/api/admin/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: selectedOrder.id })
      });

      const result = await res.json();
      
      if (result.ok) {
        alert('Arve saadetud kliendile!');
        // Update order status
        setOrders(orders.map(order => 
          order.id === selectedOrder.id 
            ? { ...order, status: 'INVOICED', invoiceNumber: result.invoiceNumber }
            : order
        ));
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
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const result = await res.json();
      
      if (result.success) {
        setIsAuthenticated(true);
        setLoginError('');
        sessionStorage.setItem('vajangu_admin_auth', 'true');
      } else {
        setLoginError('Vale parool!');
      }
    } catch (error) {
      setLoginError('Viga sisselogimisel');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setLoginError('');
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
                Admin Parool
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                placeholder="Sisestage admin parool"
                required
                autoComplete="current-password"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ainult parool on vajalik, kasutajanimi pole vaja
              </p>
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
              <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                <img 
                  src="/perefarm_logo.png" 
                  alt="Vajangu Perefarm Logo" 
                  className="w-full h-full object-contain"
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
                onClick={() => fetchOrders()}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                title="Värskenda tellimusi (uuendub automaatselt iga 60 sekundi järel)"
              >
                Värskenda
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                <option value="READY">Valmis</option>
                <option value="ON_THE_WAY">Teel</option>
                <option value="DONE">Valmis</option>
                <option value="CANCELLED">Tühistatud</option>
                <option value="INVOICED">Saada arve</option>
                <option value="CREDIT">Krediitarve</option>
              </select>
            </div>
            
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
            
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors w-full"
              >
                Tühjenda filtrid
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Summary */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg mx-4">
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

      {/* Orders Table */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tegevused</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kliendi nimi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ring</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peatus</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tooted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Summa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maksemeetod</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staatus</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loodud</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tellimuse ID</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={() => openOrderDetails(order)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 text-left"
                      >
                        Vaata
                      </button>
                      <button
                        onClick={() => openOrderEdit(order)}
                        className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 text-left"
                      >
                        Muuda
                      </button>
                      <button
                        onClick={() => printOrder(order)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 text-left"
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
                      <div className="text-xs text-blue-600">🏠 Aadress</div>
                    )}
                    {(order.notesCustomer || order.notesInternal) && (
                      <div className="text-xs text-green-600">💬 Lisainfo</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">
                      {order.lines.map(line => line.product.name).join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {calculateOrderTotal(order).toFixed(2)}€
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.paymentMethod === 'CASH' ? 'Sularaha' : 'Ülekandega'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                    {order.id.slice(-8)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Tellimuse üksikasjad - {selectedOrder.id.slice(-8)}</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Kliendi andmed</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p><strong>Nimi:</strong> {selectedOrder.customer.name}</p>
                      <p><strong>E-post:</strong> {selectedOrder.customer.email}</p>
                      <p><strong>Telefon:</strong> {selectedOrder.customer.phone}</p>
                    </div>
                    <div>
                      {selectedOrder.customer.orgName && (
                        <p><strong>Ettevõte:</strong> {selectedOrder.customer.orgName}</p>
                      )}
                      {selectedOrder.customer.regCode && (
                        <p><strong>Registrikood:</strong> {selectedOrder.customer.regCode}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Tellimuse andmed</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p><strong>Ring:</strong> {selectedOrder.ring.region}</p>
                      <p><strong>Peatus:</strong> {selectedOrder.stop.name}</p>
                      <p><strong>Kohtumispaik:</strong> {selectedOrder.stop.meetingPoint}</p>
                    </div>
                    <div>
                      <p><strong>Kuupäev:</strong> {formatDate(selectedOrder.ring.ringDate)}</p>
                      <p><strong>Maksemeetod:</strong> {selectedOrder.paymentMethod === 'CASH' ? 'Sularaha' : 'Ülekandega'}</p>
                      <p><strong>Staatus:</strong> {getStatusText(selectedOrder.status)}</p>
                    </div>
                  </div>
                </div>

                {/* Status Management */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Staatus</h4>
                  <div className="flex items-center space-x-4">
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => {
                        updateOrderStatus(selectedOrder.id, e.target.value);
                        setSelectedOrder({...selectedOrder, status: e.target.value});
                      }}
                      className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="NEW">Uus</option>
                      <option value="ACCEPTED">Tellimus vastu võetud</option>
                      <option value="FULFILLING">Täitmisel</option>
                      <option value="READY">Valmis</option>
                      <option value="ON_THE_WAY">Teel</option>
                      <option value="DONE">Valmis</option>
                      <option value="CANCELLED">Tühistatud</option>
                      <option value="INVOICED">Saada arve</option>
                      <option value="CREDIT">Krediitarve</option>
                    </select>
                    {selectedOrder.status === 'FULFILLING' && (
                      <div className="text-sm text-blue-600 bg-blue-100 px-3 py-2 rounded">
                        ℹ️ Koguseid saab siin parandada
                      </div>
                    )}
                  </div>
                </div>

                {/* Add New Product */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">Lisa uus toode</h4>
                    <button
                      onClick={() => setShowAddProduct(!showAddProduct)}
                      className="text-green-600 hover:text-green-800"
                    >
                      {showAddProduct ? 'Peida' : 'Näita'}
                    </button>
                  </div>
                  
                  {showAddProduct && (
                    <div className="grid grid-cols-4 gap-4">
                      <input
                        type="text"
                        placeholder="Toote nimi"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        placeholder="Hind"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({...newProduct, price: e.target.value.replace(',', '.')})}
                        className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        placeholder="Kaal"
                        value={newProduct.weight}
                        onChange={(e) => setNewProduct({...newProduct, weight: e.target.value.replace(',', '.')})}
                        className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <select
                        value={newProduct.uom}
                        onChange={(e) => setNewProduct({...newProduct, uom: e.target.value})}
                        className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="kg">kg</option>
                        <option value="tk">tk</option>
                      </select>
                      <button
                        type="button"
                        onClick={addNewProduct}
                        disabled={adding || !newProduct.name.trim() || !(Number.isFinite(parseFloat((newProduct.price||'').toString())) && parseFloat((newProduct.price||'').toString()) > 0) || !(Number.isFinite(parseFloat((newProduct.weight||'').toString())) && parseFloat((newProduct.weight||'').toString()) > 0)}
                        className={`col-span-4 px-4 py-2 rounded ${adding || !newProduct.name.trim() || !(Number.isFinite(parseFloat((newProduct.price||'').toString())) && parseFloat((newProduct.price||'').toString()) > 0) || !(Number.isFinite(parseFloat((newProduct.weight||'').toString())) && parseFloat((newProduct.weight||'').toString()) > 0) ? 'bg-green-400 cursor-not-allowed text-white' : 'bg-green-600 text-white hover:bg-green-700'}`}
                      >
                        {adding ? 'Lisamine…' : 'Lisa toode'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Products with Weight Editing */}
                <div className="bg-yellow-50 p-4 rounded-lg" data-weight-section>
                  <h4 className="font-semibold text-gray-800 mb-4">Tooted ja kaalud</h4>
                  <div className="space-y-4">
                    {selectedOrder.lines.map((line) => (
                      <div key={line.id} className="flex items-center justify-between p-3 bg-white rounded border">
                        <div className="flex-1">
                          <p className="font-medium">{line.product.name}</p>
                          <p className="text-sm text-gray-600">
                            {line.unitPrice ? `${parseFloat(line.unitPrice.toString()).toFixed(2)}€/${line.uom.toLowerCase()}` : 'Hind puudub'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-sm text-gray-600">
                            Tellitud: {line.requestedQty} {line.uom.toLowerCase()}
                          </div>
                          <div className="flex items-center space-x-2">
                            <label className="text-sm text-gray-600">Pakitud:</label>
                            <input
                              type="number"
                              step="0.1"
                              placeholder="0"
                              value={editingWeights[line.id] !== undefined ? editingWeights[line.id] : line.requestedQty}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                  setEditingWeights({
                                    ...editingWeights,
                                    [line.id]: 0
                                  });
                                } else {
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
                                if (e.key >= '0' && e.key <= '9') return;
                                if (e.key === '.' || e.key === ',') return;
                                if (e.key === 'Backspace' || e.key === 'Delete' || 
                                    e.key === 'ArrowLeft' || e.key === 'ArrowRight' || 
                                    e.key === 'Tab' || e.key === 'Enter' || e.key === 'Escape') return;
                                if (e.key === '-') return;
                                if (e.ctrlKey && (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x')) return;
                                e.preventDefault();
                              }}
                              className="w-20 p-2 border border-gray-300 rounded text-center"
                            />
                            <span className="text-sm text-gray-600">{line.uom.toLowerCase()}</span>
                          </div>
                          <div className="text-sm font-medium">
                            {line.unitPrice ? 
                              `${(parseFloat(line.unitPrice.toString()) * (editingWeights[line.id] !== undefined ? editingWeights[line.id] : line.requestedQty)).toFixed(2)}€` : 
                              'Hind puudub'
                            }
                          </div>
                          <button
                            onClick={() => {
                              const weight = editingWeights[line.id] !== undefined ? editingWeights[line.id] : line.requestedQty;
                              updatePackedWeights(selectedOrder.id, line.id, weight);
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Salvesta
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Comments */}
                {(selectedOrder.notesCustomer || selectedOrder.notesInternal) && (
                  <div className="bg-yellow-100 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Kliendi märkused</h4>
                    {selectedOrder.deliveryType === 'HOME' && selectedOrder.deliveryAddress && (
                      <p className="mb-2"><strong>🏠 Tarneaadress:</strong> {selectedOrder.deliveryAddress}</p>
                    )}
                    {selectedOrder.notesCustomer && (
                      <p className="mb-2"><strong>💬 Lisainfo tellimuse kohta:</strong> {selectedOrder.notesCustomer}</p>
                    )}
                    {selectedOrder.notesInternal && (
                      <p><strong>📝 Sisemised märkused:</strong> {selectedOrder.notesInternal}</p>
                    )}
                  </div>
                )}

                {/* Order Total */}
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Tellimuse summa:</span>
                    <span className="text-xl font-bold text-green-600">
                      {calculateOrderTotalWithEditingWeights(selectedOrder).toFixed(2)}€
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
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
                  {selectedOrder.status !== 'INVOICED' && (
                    <button
                      onClick={sendInvoice}
                      className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                    >
                      Saada arve
                    </button>
                  )}
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
