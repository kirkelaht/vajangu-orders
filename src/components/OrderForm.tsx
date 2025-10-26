/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useEffect, useState } from 'react';

type Product = {
  id: string;
  name: string;
  unit?: string | null;
  price_eur?: number | null;
  price_cents?: number | null;
  currentPrice?: number | null;
};

type ProductGroup = {
  group: string;
  products: Product[];
};

type OrderItem = Product & {
  lineId: string;        // unikaalne rea ID tabeli key jaoks
  quantity: number;      // KOGUS TALLETATUD REA-POHISELT
  subtotal: number;      // € arvutus reaal
};

export default function OrderForm() {
  const [products, setProducts] = useState<ProductGroup[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantityInput, setQuantityInput] = useState<string>(''); // VORMI SISEND, mitte tabeli oma
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/products', { cache: 'no-store' });
        const data = await r.json();
        if (Array.isArray(data)) setProducts(data as ProductGroup[]);
        else if (Array.isArray((data as any).items)) {
          // fallback kui API on {ok, items}
          const byGroup: Record<string, Product[]> = {};
          for (const it of (data as any).items) {
            const key = it.groupName ?? it.category ?? 'Muu';
            if (!byGroup[key]) byGroup[key] = [];
            byGroup[key].push({
              id: it.sku,
              name: it.name,
              unit: it.uom ?? it.unit ?? 'tk',
              price_eur: typeof it.currentPrice === 'number'
                ? it.currentPrice
                : (typeof it.price_cents === 'number' ? it.price_cents / 100 : null),
              price_cents: it.price_cents ?? null,
            });
          }
          setProducts(Object.entries(byGroup).map(([group, products]) => ({ group, products })));
        }
      } catch {
        // viimane tagavaravariant: loe publicist
        const r2 = await fetch('/products/2025-11.json', { cache: 'no-store' });
        const json = await r2.json();
        if (Array.isArray(json.groups)) setProducts(json.groups);
      }
    })();
  }, []);

  const categories = products.map(g => g.group);
  const productList = products.find(g => g.group === selectedCategory)?.products ?? [];

  function resolvePriceEUR(p?: Product | null): number {
    const raw =
      (typeof p?.price_eur === 'number' ? p?.price_eur : undefined) ??
      (typeof p?.currentPrice === 'number' ? p?.currentPrice : undefined) ??
      (typeof p?.price_cents === 'number' ? (p?.price_cents! / 100) : undefined) ??
      0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }

  // ✅ "Lisa" lisab uue rea orderItems massiivi
  const handleAddItem = () => {
    if (!selectedProduct) return;
    const q = Number(quantityInput);
    if (!Number.isFinite(q) || q <= 0) return;            // lihtne valideerimine

    const price = resolvePriceEUR(selectedProduct);
    const line: OrderItem = {
      ...selectedProduct,
      lineId: `${selectedProduct.id}-${Date.now()}`,       // unikaalne key
      quantity: q,                                         // TALLETAME rea sees
      subtotal: +(q * price).toFixed(2),
      unit: selectedProduct.unit ?? 'tk',
      price_eur: price,
    };

    setOrderItems(prev => [...prev, line]);
    // puhasta vorm
    setQuantityInput('');
    setSelectedProduct(null);
  };

  // (valikuline) koguse muutmine tabelis rea-kaupa
  const updateRowQuantity = (lineId: string, newQtyStr: string) => {
    const q = Number(newQtyStr);
    setOrderItems(prev =>
      prev.map(row => {
        if (row.lineId !== lineId) return row;
        const price = resolvePriceEUR(row);
        const qty = Number.isFinite(q) && q >= 0 ? q : 0;
        return {
          ...row,
          quantity: qty,
          subtotal: +(qty * price).toFixed(2),
        };
      })
    );
  };

  const removeRow = (lineId: string) => {
    setOrderItems(prev => prev.filter(r => r.lineId !== lineId));
  };

  const totalEUR = orderItems.reduce((sum, r) => sum + r.subtotal, 0);

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold mb-4">Tellimuse vorm</h1>

      {/* Kategooria */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Kategooria</label>
        <select
          value={selectedCategory}
          onChange={(e) => { setSelectedCategory(e.target.value); setSelectedProduct(null); }}
          className="mt-1 block w-full border rounded-md p-2"
        >
          <option value="">Vali kategooria...</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Toode */}
      {selectedCategory && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Toode</label>
          <select
            value={selectedProduct?.id ?? ''}
            onChange={(e) => {
              const prod = productList.find(p => p.id === e.target.value) ?? null;
              setSelectedProduct(prod);
            }}
            className="mt-1 block w-full border rounded-md p-2"
          >
            <option value="">Vali toode...</option>
            {productList.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — {
                  (typeof p.price_eur === 'number' && !Number.isNaN(p.price_eur))
                    ? `${p.price_eur.toFixed(2)} €/${p.unit ?? 'tk'}`
                    : 'hind kokkuleppel'
                }
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Kogus + Lisa */}
      {selectedProduct && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Kogus ({selectedProduct.unit ?? 'tk'})
          </label>
          <input
            type="number"
            value={quantityInput}                           // 👈 ainult vormi sisend
            onChange={(e) => setQuantityInput(e.target.value)}
            className="mt-1 block w-full border rounded-md p-2"
            min="0"
            step="0.1"
            placeholder="nt 2.5"
          />
          <button
            type="button"
            onClick={handleAddItem}
            className="mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Lisa tellimusse
          </button>
        </div>
      )}

      {/* Kokkuvõte */}
      {orderItems.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Tellimus</h2>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Toode</th>
                <th className="p-2 text-right">Kogus</th>
                <th className="p-2 text-right">Hind (€)</th>
                <th className="p-2 text-right">Kokku (€)</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((row) => (
                <tr key={row.lineId} className="border-t">
                  <td className="p-2">{row.name}</td>

                  <td className="p-2 text-right">
                    <input
                      type="number"
                      className="w-24 border rounded p-1 text-right"
                      min="0"
                      step="0.1"
                      value={row.quantity}
                      onChange={(e) => updateRowQuantity(row.lineId, e.target.value)}
                    />
                    {' '}{row.unit ?? 'tk'}
                  </td>

                  <td className="p-2 text-right">
                    {row.price_eur && row.price_eur > 0 ? row.price_eur.toFixed(2) : '—'}
                  </td>
                  <td className="p-2 text-right">{row.subtotal.toFixed(2)}</td>
                  <td className="p-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeRow(row.lineId)}
                      className="text-red-600 hover:underline"
                    >
                      Eemalda
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-right font-semibold mt-3">
            Kokku: {totalEUR.toFixed(2)} €
          </div>
        </div>
      )}
    </div>
  );
}
