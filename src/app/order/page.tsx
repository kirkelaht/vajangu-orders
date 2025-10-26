/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { Ring, Stop, Product } from "@/types";

// API Product type
type ApiProduct = {
  id: string;
  name: string;
  unit?: string | null;
  price_eur?: number | null;
  price_cents?: number | null;
};

// API ProductGroup type
type ApiProductGroup = {
  group: string;
  products: ApiProduct[];
};

// Form-specific order line type
interface FormOrderLine {
  sku: string;
  name: string;
  uom: string;
  ordered_qty: number;
  substitution_allowed: boolean;
  unit_price: number;
}

export default function OrderPage(){
  const [rings,setRings]=useState<Ring[]>([]);
  const [stops,setStops]=useState<Stop[]>([]);
  const [products,setProducts]=useState<Product[]>([]);
  const [productGroups,setProductGroups]=useState<ApiProductGroup[]>([]);
  const [categories,setCategories]=useState<string[]>([]);
  const [selectedCategory,setSelectedCategory]=useState<string>("");
  const [productQuantities,setProductQuantities]=useState<{[key:string]:number}>({});
  const [lastError,setLastError]=useState<string | null>(null);
  const [rawPayload,setRawPayload]=useState<any>(null);
  const [form,setForm]=useState<{
    channel: string;
    customer: {
      name: string;
      phone: string;
      email: string;
      org_name?: string;
      reg_code?: string;
    };
    ring_id: string;
    stop_id: string;
    delivery_address?: string;
    notes_customer?: string;
    notes_internal?: string;
    payment_method: string;
    order_lines: FormOrderLine[];
  }>({
    channel:"veeb",
    customer:{ name:"", phone:"", email:"", org_name:"", reg_code:"" },
    ring_id:"", stop_id:"",
    payment_method:"sularaha",
    notes_customer:"",
    notes_internal:"",
    order_lines:[]
  });
  const [loading,setLoading]=useState(false);
  const [privacyConsent,setPrivacyConsent]=useState(false);
  const [customPrices,setCustomPrices]=useState<{[key:string]:number}>({});

  // Helper function to get display text for UOM, with special case for Puhastatud seasool
  function getUomDisplayText(uom: string, sku: string, product?: Product): string {
    // If product has unit field from API, use it
    if (product?.unit) return product.unit;
    
    const uomLower = uom.toLowerCase();
    if (uomLower === 'tk' && sku === 'PORK-031') return 'meeter';
    return uomLower;
  }

  useEffect(()=>{ 
    // Fetch rings from API
    fetch("/api/rings").then(r=>r.json()).then(j=>{
      if(Array.isArray(j)) setRings(j);
    }).catch(console.error);
    // Robust products fetching with static fallback
    let cancelled = false;
    async function loadProducts() {
      setLastError(null);
      setRawPayload(null);
      let apiSucceeded = false;
      
      // 1) Try API first
      try {
        const r = await fetch('/api/products', { cache: 'no-store' });
        const data = await r.json();
        if (!cancelled) setRawPayload(data);
        // Accept either array shape or {items: []}
        if (Array.isArray(data) && data.length > 0) {
          if (!cancelled) {
            setProductGroups(data as ApiProductGroup[]);
            const cats = data.map((g: ApiProductGroup) => g.group);
            setCategories(cats);
          }
          apiSucceeded = true;
          return;
        }
        if (Array.isArray((data as any).items) && (data as any).items.length > 0) {
          // Transform flat items (category) to grouped array
          const byGroup: Record<string, any[]> = {};
          for (const item of (data as any).items) {
            const key = item.groupName ?? item.category ?? 'Muu';
            if (!byGroup[key]) byGroup[key] = [];
            byGroup[key].push({
              id: item.sku,
              name: item.name,
              unit: item.uom ?? item.unit ?? 'tk',
              price_eur: typeof item.currentPrice === 'number' ? item.currentPrice : (typeof item.price_cents === 'number' ? item.price_cents/100 : null),
              price_cents: item.price_cents ?? null,
            });
          }
          const grouped = Object.entries(byGroup).map(([group, products]) => ({ group, products }));
          if (!cancelled) {
            setProductGroups(grouped as ApiProductGroup[]);
            const cats = grouped.map((g: any) => g.group);
            setCategories(cats);
          }
          apiSucceeded = true;
          return;
        }
        // If we got here, data empty — fall through to static
        if (!cancelled) {
          console.log('[order page] API returned empty or unrecognized shape:', data);
          setLastError('API returned empty or unrecognized shape, loading static fallback…');
        }
      } catch (e:any) {
        if (!cancelled) {
          console.error('[order page] API fetch failed:', e?.message);
          setLastError('API fetch failed: ' + (e?.message ?? 'unknown'));
        }
      }

      // 2) Static fallback from /public
      if (!apiSucceeded) {
        try {
          const r2 = await fetch('/products/2025-11.json', { cache: 'no-store' });
          const json = await r2.json();
          if (!cancelled) setRawPayload(json);
          if (Array.isArray(json.groups)) {
            const transformed = json.groups.map((g: any) => ({
              group: g.group,
              products: g.products.map((p: any) => ({
                id: p.id,
                name: p.name,
                unit: p.unit,
                price_cents: p.price_cents,
                price_eur: typeof p.price_cents === 'number' ? p.price_cents / 100 : null,
              }))
            }));
            if (!cancelled) {
              setProductGroups(transformed as ApiProductGroup[]);
              const cats = transformed.map((g: ApiProductGroup) => g.group);
              setCategories(cats);
            }
          } else {
            if (!cancelled) setLastError('Fallback file missing groups[]');
          }
        } catch (e:any) {
          if (!cancelled) setLastError('Fallback fetch failed: ' + (e?.message ?? 'unknown'));
        }
      }
    }
    loadProducts();
    
    return () => { cancelled = true; };
  },[]);
  
  useEffect(()=>{
    if(form.ring_id) {
      // Fetch stops from API
      fetch(`/api/stops?ringId=${encodeURIComponent(form.ring_id)}`).then(r=>r.json()).then(j=>{
        if(Array.isArray(j)) setStops(j);
      }).catch(console.error);
    } else {
      setStops([]);
    }
  },[form.ring_id]);

  // Get products for selected category from grouped data
  const categoryProducts = productGroups.length > 0 
    ? productGroups.find(g => g.group === selectedCategory)?.products ?? []
    : products.filter(p => p.category === selectedCategory);
  
  // Check if selected ring is for home delivery
  const selectedRing = rings.find((r: Ring) => r.id === form.ring_id);
  const isHomeDelivery = selectedRing?.region === 'Viru-Nigula-Sonda ring';

  function addProduct(sku:string, name:string, uom:string, quantity:number = 1, price:number = 0){
    const existing = form.order_lines.find((l: FormOrderLine)=>l.sku===sku);
    if(existing){
      setForm({...form, order_lines: form.order_lines.map((l: FormOrderLine)=>l.sku===sku ? {...l, ordered_qty: l.ordered_qty + quantity} : l)});
    } else {
      setForm({...form, order_lines: [...form.order_lines, {sku, name, uom, ordered_qty: quantity, substitution_allowed: false, unit_price: price}]});
    }
  }

  function removeProduct(sku:string){
    setForm({...form, order_lines: form.order_lines.filter((l: FormOrderLine)=>l.sku!==sku)});
  }

  function updateQuantity(sku:string, qty:number){
    setForm({...form, order_lines: form.order_lines.map((l: FormOrderLine)=>l.sku===sku ? {...l, ordered_qty: qty} : l)});
  }

  async function submit(e: React.FormEvent){
    e.preventDefault(); 
    if(form.order_lines.length === 0){
      alert("Valige vähemalt üks toode!");
      return;
    }
    if(isHomeDelivery && !form.notes_customer?.trim()){
      alert("Koduse tarne puhul tuleb sisestada tarneaadress!");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/orders",{method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form)});
    const j = await res.json(); 
    
    if(j.ok) {
      alert(`Aitäh, Teie tellimus on edastatud!\n\nKoopia tellimusest tuleb ka Teie e-posti aadressile`);
      // Clear the form after successful submission
      setForm({
        channel:"veeb",
        customer:{ name:"", phone:"", email:"", org_name:"", reg_code:"" },
        ring_id:"", stop_id:"",
        payment_method:"sularaha",
        notes_customer:"",
        notes_internal:"",
        order_lines:[]
      });
      setSelectedCategory("");
      setProductQuantities({});
      setCustomPrices({});
      setPrivacyConsent(false);
    } else {
      alert(j.error);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header matching the website */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <div className="w-48 h-48 flex items-center justify-center">
                <img 
                  src="/perefarm_logo.png" 
                  alt="Vajangu Perefarm Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to pig emoticon if logo doesn't exist
                    e.currentTarget.style.display = 'none';
                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                    if (nextElement) {
                      nextElement.style.display = 'block';
                    }
                  }}
                />
                <span className="text-gray-800 font-bold text-2xl hidden">🐷</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">VAJANGU PEREFARM</h1>
                <p className="text-sm text-gray-600">Kõrgekvaliteediline kodumaine sealiha</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Tellimuse vorm</h2>
              <p className="text-gray-600">Valige tooted ja esitage tellimus</p>
            </div>

            <form onSubmit={submit} className="space-y-6">
              {/* Customer Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Kliendi andmed</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Mandatory fields - Left side */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-700 mb-3">Kohustuslikud andmed *</h4>
                    <input placeholder="Nimi *" className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      value={form.customer.name}
                      onChange={e=>setForm({...form, customer:{...form.customer, name:e.target.value}})} />
                    <input placeholder="Telefon *" className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      value={form.customer.phone}
                      onChange={e=>setForm({...form, customer:{...form.customer, phone:e.target.value}})} />
                    <input type="email" placeholder="E-post *" className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      value={form.customer.email}
                      onChange={e=>setForm({...form, customer:{...form.customer, email:e.target.value}})} />
                  </div>
                  
                  {/* Optional fields - Right side */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-500 mb-3">Valikulised andmed</h4>
                    <input placeholder="Ettevõtte nimi" className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      value={form.customer.org_name}
                      onChange={e=>setForm({...form, customer:{...form.customer, org_name:e.target.value}})} />
                    <input placeholder="Registrikood" className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      value={form.customer.reg_code}
                      onChange={e=>setForm({...form, customer:{...form.customer, reg_code:e.target.value}})} />
                  </div>
                </div>
              </div>

              {/* Ring and Stop Selection */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Tarneinfo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vali ring *</label>
                    <select className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-gray-500 focus:border-transparent" value={form.ring_id}
                      onChange={e=>setForm({...form, ring_id:e.target.value, stop_id:""})}>
                      <option value="">Vali ring</option>
       {rings.map((r: Ring)=><option key={r.id} value={r.id}>
         {new Date(r.ring_date).toLocaleDateString("et-EE", {day: '2-digit', month: '2-digit'})} {r.region}
       </option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isHomeDelivery ? "Vali piirkond *" : "Vali peatus *"}
                    </label>
                    <select className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-gray-500 focus:border-transparent" value={form.stop_id}
                      onChange={e=>setForm({...form, stop_id:e.target.value})}>
                      <option value="">{isHomeDelivery ? "Vali piirkond" : "Vali peatus"}</option>
                      {stops.map((s: Stop)=><option key={s.id} value={s.id}>
                        {isHomeDelivery ? s.name : `${s.name} (${s.place})`}
                      </option>)}
                    </select>
                  </div>
                </div>
                
                {/* Address field for home delivery */}
                {isHomeDelivery && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tarneaadress *</label>
                    <textarea 
                      placeholder="Sisestage täpne tarneaadress (tänav, maja number, linn, postiindeks)"
                      className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-gray-500 focus:border-transparent h-20 resize-none"
                      value={form.notes_customer}
                      onChange={e=>setForm({...form, notes_customer:e.target.value})}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      ℹ️ Koduse tarne puhul tuleb sisestada täpne aadress, kuhu toode toimetada
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Makseviis</h3>
                <div className="flex space-x-6">
                  <label className="flex items-center cursor-pointer">
                    <input type="radio" value="sularaha" checked={form.payment_method==="sularaha"}
                      onChange={e=>setForm({...form, payment_method:e.target.value})} className="mr-3 h-4 w-4 text-gray-600" />
                    <span className="text-gray-700">Sularaha</span>
                  </label>
                </div>
              </div>

              {/* Product Selection */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Tooted</h3>
                
                {/* Category Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valige kategooria</label>
                  <select className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-gray-500 focus:border-transparent" value={selectedCategory}
                    onChange={e=>setSelectedCategory(e.target.value)}>
                    <option value="">Valige kategooria</option>
                    {categories.map(cat=><option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                {/* Products in Category */}
                {selectedCategory && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-4">{selectedCategory}</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {categoryProducts.map((p: Product)=>(
                        <div key={p.sku} className="flex items-center space-x-4 p-4 border border-gray-300 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-700 font-medium">{p.name} ({getUomDisplayText(p.uom, p.sku, p)})</span>
                              {p.sku === 'PORK-008' ? (
                                <span className="text-lg font-bold text-blue-600">
                                  Küsi lisainfot
                                </span>
                              ) : p.sku === 'PORK-056' ? (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600">Hind:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={customPrices[p.sku] || ''}
                                    onChange={(e) => setCustomPrices({...customPrices, [p.sku]: parseFloat(e.target.value) || 0})}
                                    placeholder="0.00"
                                    className="w-20 p-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                                  />
                                  <span className="text-sm text-gray-600">€</span>
                                </div>
                              ) : (
                                <span className="text-lg font-bold text-green-600">
                                  {p.price_eur ? `${p.price_eur.toFixed(2)}€` : p.current_price ? `${p.current_price.toFixed(2)}€` : 'hind kokkuleppel'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {p.sku === 'PORK-008' ? (
                              <div className="text-sm text-gray-600 italic">
                                Kontakteeru meiega hinna ja koguse kohta
                              </div>
                            ) : p.sku === 'PORK-056' ? (
                              <>
                                <label className="text-sm text-gray-600">Kogus:</label>
                                <input 
                                  type="number" 
                                  min="1" 
                                  step="1" 
                                  value={productQuantities[p.sku] || 1}
                                  onChange={(e) => setProductQuantities({...productQuantities, [p.sku]: parseInt(e.target.value) || 1})}
                                  className="w-20 p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                                />
                                <button 
                                  type="button" 
                                  onClick={()=>addProduct(p.sku, p.name, p.uom, productQuantities[p.sku] || 1, customPrices[p.sku] || 0)}
                                  disabled={!customPrices[p.sku] || customPrices[p.sku] <= 0}
                                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                  Lisa
                                </button>
                              </>
                            ) : (
                              <>
                                <label className="text-sm text-gray-600">Kogus:</label>
                                <input 
                                  type="number" 
                                  min="0.1" 
                                  step="0.1" 
                                  value={productQuantities[p.sku] || 1}
                                  onChange={(e) => setProductQuantities({...productQuantities, [p.sku]: parseFloat(e.target.value) || 1})}
                                  className="w-20 p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                                />
                                <button 
                                  type="button" 
                                  onClick={()=>addProduct(p.sku, p.name, p.uom, productQuantities[p.sku] || 1, p.price_eur || p.current_price || 0)}
                                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
                                  Lisa
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Products */}
                {form.order_lines.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4">Valitud tooted</h4>
                    <div className="space-y-3">
                      {form.order_lines.map((line: FormOrderLine)=>(
                        <div key={line.sku} className="flex items-center justify-between p-4 bg-white border border-gray-300 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-700 font-medium">{line.name} ({getUomDisplayText(line.uom, line.sku)})</span>
                              <span className="text-sm text-gray-500">
                                {line.unit_price ? `${line.unit_price.toFixed(2)}€/${getUomDisplayText(line.uom, line.sku)}` : 'Hind puudub'}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold text-green-600">
                                Eeldatav maksumus: {line.unit_price ? `${(line.unit_price * line.ordered_qty).toFixed(2)}€` : 'Hind puudub'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 ml-4">
                            <input type="number" min="0.1" step="0.1" value={line.ordered_qty}
                              onChange={e=>updateQuantity(line.sku, parseFloat(e.target.value) || 0)}
                              className="w-20 p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-gray-500 focus:border-transparent" />
                            <button type="button" onClick={()=>removeProduct(line.sku)}
                              className="text-red-600 hover:text-red-800 font-bold text-lg">×</button>
                          </div>
                        </div>
                      ))}
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-lg font-bold text-gray-800">Eeldatav maksumus:</div>
                            <div className="text-sm text-gray-600">Täpne summa selgub peale kauba komplekteerimist!</div>
                          </div>
                          <span className="text-2xl font-bold text-green-600">
                            {form.order_lines.reduce((total:number, line: FormOrderLine) => 
                              total + (line.unit_price ? line.unit_price * line.ordered_qty : 0), 0
                            ).toFixed(2)}€
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Comments */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Lisainfo tellimuse kohta</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kommentaar (valikuline)
                  </label>
                  <textarea 
                    placeholder="Sisestage täiendav info tellimuse kohta (nt. erisoovid, kontaktinfo, jne.)"
                    className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-gray-500 focus:border-transparent h-20 resize-none"
                    value={form.notes_internal}
                    onChange={e=>setForm({...form, notes_internal:e.target.value})}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    ℹ️ Lisateave tellimuse täitmiseks (nt. erisoovid, kontaktinfo, jne.)
                  </p>
                </div>
              </div>

              {/* Privacy Consent */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="privacy-consent"
                    checked={privacyConsent}
                    onChange={(e) => setPrivacyConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                    required
                  />
                  <label htmlFor="privacy-consent" className="text-sm text-gray-700">
                    Kinnitan, et olen tutvunud{" "}
                    <a 
                      href="/privacy-policy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Vajangu Perefarm OÜ isikunadmete töötlemise eeskirja
                    </a>{" "}
                    sisuga ja annan nõusoleku oma isikuandmete töötlemiseks eeskirjas toodud eesmärkidel ja tingimustel.
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center pt-6">
                <button 
                  disabled={loading || !privacyConsent} 
                  className="bg-gray-800 text-white px-12 py-4 rounded-lg text-lg font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  {loading? "Esitatakse..." : "Esita tellimus"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Debug box */}
      <div className="container mx-auto px-4 py-4">
        <div className="text-sm text-gray-600 border rounded p-3 bg-gray-50">
          <div><strong>Debug:</strong></div>
          <div>Groups loaded: {Array.isArray(productGroups) ? productGroups.length : 0}</div>
          {Array.isArray(productGroups) && productGroups.slice(0,3).map((g: ApiProductGroup) => (
            <div key={g.group}>• {g.group}: {g.products?.length ?? 0} toodet</div>
          ))}
          {lastError && <div className="text-red-600 mt-2">Error: {lastError}</div>}
        </div>
      </div>

      {/* Footer matching the website */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="w-36 h-36 flex items-center justify-center">
                <img 
                  src="/perefarm_logo.png" 
                  alt="Vajangu Perefarm Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to pig emoticon if logo doesn't exist
                    e.currentTarget.style.display = 'none';
                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                    if (nextElement) {
                      nextElement.style.display = 'block';
                    }
                  }}
                />
                <span className="text-gray-800 font-bold text-xl hidden">🐷</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800">VAJANGU PEREFARM OÜ</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">Registrikood: 16109182 | KMKR: EE102313446</p>
            <p className="text-sm text-gray-600">Lääne-Viru maakond, Tapa vald, Vajangu küla, Rammo tee 3, 46002</p>
            <p className="text-sm text-gray-600 mt-2">Tegevusaadress: Lõõtspilli 2, Rakvere, Estonia</p>
            <p className="text-sm text-gray-600">© 2025 VAJANGU PEREFARM OÜ</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
