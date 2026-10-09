'use client';

import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Sparkles,
  Thermometer,
  ShieldAlert,
  Layers,
  Check,
  X,
} from 'lucide-react';
import { store } from '@/lib/db/store';
import { Product, ProduceCategory } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { getQualityScoreColor } from '@/lib/utils';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(() => store.getProducts());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'quality' | 'stock' | 'freshness'>('quality');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'FRUITS' as ProduceCategory,
    batchNumber: '',
    stock: 100,
    unit: 'kg',
    optimalTempMin: 2.0,
    optimalTempMax: 6.0,
    maxVibrationG: 0.5,
    fragilityScore: 5,
    freshnessIndex: 95,
    avgQualityScore: 92,
    defectRate: 1.5,
    imageUrl:
      'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80',
  });

  const refreshList = () => {
    setProducts(store.getProducts());
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    store.addProduct({
      ...formData,
      organizationId: store.getOrganization().id,
    });
    refreshList();
    setIsAddModalOpen(false);
    // Reset form
    setFormData({
      name: '',
      sku: '',
      category: 'FRUITS',
      batchNumber: '',
      stock: 100,
      unit: 'kg',
      optimalTempMin: 2.0,
      optimalTempMax: 6.0,
      maxVibrationG: 0.5,
      fragilityScore: 5,
      freshnessIndex: 95,
      avgQualityScore: 92,
      defectRate: 1.5,
      imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80',
    });
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    store.updateProduct(selectedProduct.id, formData);
    refreshList();
    setIsEditModalOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to remove this product from inventory?')) {
      store.deleteProduct(id);
      refreshList();
      if (selectedProduct?.id === id) {
        setIsViewModalOpen(false);
      }
    }
  };

  const openEditModal = (p: Product) => {
    setSelectedProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      category: p.category,
      batchNumber: p.batchNumber,
      stock: p.stock,
      unit: p.unit,
      optimalTempMin: p.optimalTempMin,
      optimalTempMax: p.optimalTempMax,
      maxVibrationG: p.maxVibrationG,
      fragilityScore: p.fragilityScore,
      freshnessIndex: p.freshnessIndex,
      avgQualityScore: p.avgQualityScore,
      defectRate: p.defectRate,
      imageUrl: p.imageUrl,
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (p: Product) => {
    setSelectedProduct(p);
    setIsViewModalOpen(true);
  };

  // Filter and Sort
  const filteredProducts = products
    .filter((p) => {
      const matchQuery =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      return matchQuery && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'quality') return b.avgQualityScore - a.avgQualityScore;
      if (sortBy === 'freshness') return b.freshnessIndex - a.freshnessIndex;
      if (sortBy === 'stock') return b.stock - a.stock;
      return 0;
    });

  const categories: { id: string; label: string }[] = [
    { id: 'ALL', label: 'All Categories' },
    { id: 'FRUITS', label: 'Fruits' },
    { id: 'VEGETABLES', label: 'Vegetables' },
    { id: 'LEAFY_GREENS', label: 'Leafy Greens' },
    { id: 'DAIRY', label: 'Dairy' },
    { id: 'BAKERY', label: 'Bakery' },
    { id: 'PERISHABLES', label: 'Perishables' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-400" /> Produce Catalog & Batches
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time fresh inventory, shelf-life indexes, and cold-chain temperature thresholds
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Produce Item
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search produce, SKU, or batch..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-slate-500 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="quality">Quality Score</option>
                <option value="freshness">Freshness Index</option>
                <option value="stock">Stock Volume</option>
                <option value="name">Product Name</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No produce found"
          description="Try adjusting your search query or category filters, or register a new batch."
          actionLabel="Register Produce"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Produce & SKU</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Batch</th>
                  <th className="py-3 px-4 font-semibold">Stock</th>
                  <th className="py-3 px-4 font-semibold">Freshness</th>
                  <th className="py-3 px-4 font-semibold">AI Quality</th>
                  <th className="py-3 px-4 font-semibold">Defect Rate</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProducts.map((p) => {
                  const scoreColors = getQualityScoreColor(p.avgQualityScore);
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => openViewModal(p)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                          />
                          <div>
                            <div className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                              {p.name}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500">{p.sku}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 text-[10px]">
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-400">{p.batchNumber}</td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white">{p.stock}</span>{' '}
                        <span className="text-slate-400 text-[11px]">{p.unit}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-400"
                              style={{ width: `${p.freshnessIndex}%` }}
                            />
                          </div>
                          <span className="font-mono text-emerald-400 font-semibold">
                            {p.freshnessIndex}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${scoreColors.bg} ${scoreColors.text} ${scoreColors.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${scoreColors.dot}`} />
                          {p.avgQualityScore}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`font-mono ${
                            p.defectRate > 3 ? 'text-amber-400' : 'text-slate-400'
                          }`}
                        >
                          {p.defectRate}%
                        </span>
                      </td>

                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openViewModal(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Produce SKU"
        description="Register fresh batch into warehouse intake and configure cold-chain limits"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Product Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Organic Blackberries"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">SKU Code</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="FRU-BLA-007"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="FRUITS">FRUITS</option>
                <option value="VEGETABLES">VEGETABLES</option>
                <option value="LEAFY_GREENS">LEAFY_GREENS</option>
                <option value="DAIRY">DAIRY</option>
                <option value="BAKERY">BAKERY</option>
                <option value="PERISHABLES">PERISHABLES</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Batch Number</label>
              <input
                type="text"
                required
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                placeholder="BATCH-BLA-201"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Initial Stock</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="kg"
                  className="w-16 px-2 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-center focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Temperature & Fragility Limits */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5" /> Cold-Chain & Fragility Specification
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Min Temp (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.optimalTempMin}
                  onChange={(e) =>
                    setFormData({ ...formData, optimalTempMin: Number(e.target.value) })
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Max Temp (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.optimalTempMax}
                  onChange={(e) =>
                    setFormData({ ...formData, optimalTempMax: Number(e.target.value) })
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Fragility Score (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.fragilityScore}
                  onChange={(e) =>
                    setFormData({ ...formData, fragilityScore: Number(e.target.value) })
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Image URL</label>
            <input
              type="url"
              required
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Produce Batch</Button>
          </div>
        </form>
      </Modal>

      {/* View Product Details Modal */}
      {selectedProduct && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={selectedProduct.name}
          description={`SKU: ${selectedProduct.sku} • Category: ${selectedProduct.category}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="flex gap-4">
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                className="w-32 h-32 rounded-2xl object-cover border border-slate-700 flex-shrink-0"
              />
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Stock Available:</span>
                  <span className="font-bold text-white text-sm">
                    {selectedProduct.stock} {selectedProduct.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Intake Batch:</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {selectedProduct.batchNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Freshness Index:</span>
                  <span className="font-mono text-emerald-300 font-semibold">
                    {selectedProduct.freshnessIndex}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">AI Quality Grade:</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {selectedProduct.avgQualityScore}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Defect Rate:</span>
                  <span className="font-mono text-amber-400">
                    {selectedProduct.defectRate}%
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-white flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-cyan-400" /> Cold-Chain Requirements
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  Optimal Temperature: {selectedProduct.optimalTempMin}°C to{' '}
                  {selectedProduct.optimalTempMax}°C
                </div>
                <div>Max Permissible Vibration: {selectedProduct.maxVibrationG}g</div>
                <div>Fragility Rating: {selectedProduct.fragilityScore} / 10</div>
                <div>Packaging Standard: Bio-Cushioned Tray</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsViewModalOpen(false);
                  openEditModal(selectedProduct);
                }}
                icon={<Edit2 className="w-3.5 h-3.5" />}
              >
                Edit Details
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsViewModalOpen(false);
                  window.location.href = `/dashboard/inspection?productId=${selectedProduct.id}`;
                }}
              >
                Run AI Inspection
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
