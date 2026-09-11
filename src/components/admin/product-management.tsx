'use client';

import React, { useState } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useFirestore, useCollection, useMemoFirebase, useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  Upload, 
  Package, 
  Sparkles, 
  Calculator, 
  Search, 
  ExternalLink,
  Layers,
  Database
} from 'lucide-react';
import { ProductItem, DEFAULT_PRODUCTS, ProductSpec } from '@/lib/products-data';

export function ProductManagement() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { firebaseApp } = useFirebase();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Dialog State
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'beams' | 'blocks' | 'packages' | 'accessories'>('beams');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('');
  const [badge, setBadge] = useState('');
  const [badgeColor, setBadgeColor] = useState('bg-amber-500 text-slate-950 font-bold');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [highlight, setHighlight] = useState('');
  const [beamType, setBeamType] = useState<string>('none');
  const [order, setOrder] = useState(1);

  // Specifications
  const [specs, setSpecs] = useState<ProductSpec[]>([
    { label: '', value: '' }
  ]);

  // Image Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Fetch products from Firestore
  const productsQuery = useMemoFirebase(
    () => query(collection(firestore, 'products'), orderBy('order', 'asc')),
    [firestore]
  );
  const { data: dbProducts, isLoading } = useCollection<ProductItem>(productsQuery);

  // Filter products
  const productsToDisplay = dbProducts || [];
  const filteredProducts = productsToDisplay.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.price?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Open Add Dialog
  const handleOpenNew = () => {
    setEditingProduct(null);
    setName('');
    setCategory('beams');
    setPrice('');
    setUnit('per linear meter');
    setBadge('Direct Factory');
    setBadgeColor('bg-amber-500 text-slate-950 font-bold');
    setImage('/beam-block-system.png');
    setDescription('');
    setHighlight('');
    setBeamType('none');
    setOrder((dbProducts?.length || 0) + 1);
    setSpecs([
      { label: 'Profile', value: '' },
      { label: 'Concrete Grade', value: 'C50/60 High Strength' }
    ]);
    setIsOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (p: ProductItem) => {
    setEditingProduct(p);
    setName(p.name || '');
    setCategory(p.category || 'beams');
    setPrice(p.price || '');
    setUnit(p.unit || '');
    setBadge(p.badge || '');
    setBadgeColor(p.badgeColor || 'bg-amber-500 text-slate-950 font-bold');
    setImage(p.image || '');
    setDescription(p.description || '');
    setHighlight(p.highlight || '');
    setBeamType(p.beamType || 'none');
    setOrder(p.order ?? 1);
    setSpecs(p.specs && p.specs.length > 0 ? p.specs : [{ label: '', value: '' }]);
    setIsOpen(true);
  };

  // File Upload to Firebase Storage
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const storage = getStorage(firebaseApp);
      const filename = `products/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const storageRef = ref(storage, filename);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          console.error('Upload failed:', error);
          setIsUploading(false);
          toast({
            title: 'Upload Failed',
            description: 'Could not upload product image. Try external URL fallback.',
            variant: 'destructive',
          });
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setImage(downloadUrl);
          setIsUploading(false);
          toast({
            title: 'Image Uploaded',
            description: `Successfully uploaded ${file.name}`,
          });
        }
      );
    } catch (err) {
      console.error('Storage error:', err);
      setIsUploading(false);
      toast({
        title: 'Storage Error',
        description: 'Failed to access Firebase Storage. Use image URL fallback.',
        variant: 'destructive',
      });
    }
  };

  // Spec helper functions
  const handleAddSpec = () => {
    setSpecs((prev) => [...prev, { label: '', value: '' }]);
  };

  const handleSpecChange = (index: number, field: 'label' | 'value', val: string) => {
    setSpecs((prev) => {
      const next = [...prev];
      next[index][field] = val;
      return next;
    });
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  // Save product (Add or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim() || !image.trim()) {
      toast({
        title: 'Missing Details',
        description: 'Please provide at least the Product Name, Price, and an Image.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const cleanSpecs = specs.filter((s) => s.label.trim() && s.value.trim());

      const productPayload: any = {
        name: name.trim(),
        category,
        price: price.trim(),
        unit: unit.trim(),
        badge: badge.trim(),
        badgeColor,
        image: image.trim(),
        description: description.trim(),
        highlight: highlight.trim(),
        order: Number(order) || 1,
        specs: cleanSpecs,
        updatedAt: serverTimestamp(),
      };

      if (beamType && beamType !== 'none') {
        productPayload.beamType = beamType;
      } else {
        productPayload.beamType = null;
      }

      if (editingProduct) {
        const productRef = doc(firestore, 'products', editingProduct.id);
        await updateDoc(productRef, productPayload);
        toast({
          title: 'Product Updated',
          description: `"${name}" has been updated successfully.`,
        });
      } else {
        productPayload.createdAt = serverTimestamp();
        await addDoc(collection(firestore, 'products'), productPayload);
        toast({
          title: 'Product Added',
          description: `"${name}" is now listed in the products catalog.`,
        });
      }

      setIsOpen(false);
    } catch (err: any) {
      console.error('Error saving product:', err);
      toast({
        title: 'Error Saving',
        description: err.message || 'Failed to save product.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string, prodName: string) => {
    if (!confirm(`Are you sure you want to delete "${prodName}"?`)) return;

    try {
      await deleteDoc(doc(firestore, 'products', id));
      toast({
        title: 'Product Removed',
        description: `"${prodName}" was deleted from the catalog.`,
      });
    } catch (err: any) {
      console.error('Delete error:', err);
      toast({
        title: 'Delete Failed',
        description: err.message || 'Failed to delete product.',
        variant: 'destructive',
      });
    }
  };

  // Seed default products if collection is empty
  const handleSeedDefaults = async () => {
    if (productsToDisplay.length > 0) {
      if (!confirm('You already have products listed. Do you want to add the standard factory catalog items?')) {
        return;
      }
    }

    setIsSeeding(true);
    try {
      for (const item of DEFAULT_PRODUCTS) {
        const { id, ...data } = item;
        await addDoc(collection(firestore, 'products'), {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      toast({
        title: 'Catalog Initialized',
        description: `Successfully loaded ${DEFAULT_PRODUCTS.length} standard SI-LATECH factory products.`,
      });
    } catch (err: any) {
      console.error('Seed error:', err);
      toast({
        title: 'Seed Error',
        description: err.message || 'Failed to initialize catalog.',
        variant: 'destructive',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-700">
            <Package size={14} className="text-amber-600" />
            <span>Storefront Products &amp; Materials</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Product Catalog Management</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Upload product photos, configure prices, and customize products visible on the website and calculator.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {productsToDisplay.length === 0 && !isLoading && (
            <Button
              onClick={handleSeedDefaults}
              disabled={isSeeding}
              variant="outline"
              className="border-slate-300 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              {isSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4 text-amber-600" />}
              Load Standard Catalog
            </Button>
          )}

          <Button 
            onClick={handleOpenNew}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} />
            Add New Product
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search products by title, price, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11 rounded-xl bg-white border-slate-200 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-11 w-full sm:w-48 bg-white rounded-xl border-slate-200 text-xs font-bold">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all" className="text-xs">All Categories</SelectItem>
              <SelectItem value="beams" className="text-xs">Precast Beams</SelectItem>
              <SelectItem value="blocks" className="text-xs">Infill Blocks</SelectItem>
              <SelectItem value="packages" className="text-xs">Full Packages</SelectItem>
              <SelectItem value="accessories" className="text-xs">BRC &amp; Accessories</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Products Table */}
      <Card className="rounded-2xl border-slate-200 shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-600" />
              Active Storefront Products ({filteredProducts.length})
            </CardTitle>
            <span className="text-xs text-slate-400">Updates sync in real-time across public pages</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin text-amber-600" />
              <p className="text-xs font-semibold">Loading product items...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center space-y-4 px-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">No products found</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery || categoryFilter !== 'all' 
                    ? 'No products matched your search or category filter.'
                    : 'Get started by clicking Add New Product or load standard factory items.'}
                </p>
              </div>
              {productsToDisplay.length === 0 && (
                <Button 
                  onClick={handleSeedDefaults}
                  disabled={isSeeding}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs"
                >
                  {isSeeding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Load Factory Defaults
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="w-16 text-xs font-bold text-slate-700">Image</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Product Name &amp; Category</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Price &amp; Unit</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Badge &amp; Highlight</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Calculator Preset</TableHead>
                    <TableHead className="text-right text-xs font-bold text-slate-700 w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Image Thumbnail */}
                      <TableCell className="align-middle">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 relative shrink-0">
                          {p.image ? (
                            <img 
                              src={p.image} 
                              alt={p.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as any).src = '/beam-block-system.png';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <Package size={16} />
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Name & Category */}
                      <TableCell className="align-middle">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                            {p.name}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider py-0 px-2 rounded-md">
                              {p.category}
                            </Badge>
                            {p.order && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                Pos #{p.order}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Price & Unit */}
                      <TableCell className="align-middle">
                        <div className="space-y-0.5">
                          <span className="font-black text-slate-900 text-xs sm:text-sm block text-amber-600">
                            {p.price}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium block">
                            {p.unit}
                          </span>
                        </div>
                      </TableCell>

                      {/* Badge & Highlight */}
                      <TableCell className="align-middle max-w-xs">
                        <div className="space-y-1">
                          {p.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 inline-block">
                              {p.badge}
                            </span>
                          )}
                          {p.highlight && (
                            <p className="text-[11px] text-slate-500 truncate" title={p.highlight}>
                              {p.highlight}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Calculator Preset */}
                      <TableCell className="align-middle">
                        {p.beamType ? (
                          <Badge className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold">
                            <Calculator className="h-3 w-3 mr-1" />
                            {p.beamType === 'tbeam' ? 'T-Beam' : 'Flat Beam'}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            onClick={() => handleOpenEdit(p)}
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                            title="Edit product"
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button 
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Delete product"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-2xl p-6 sm:p-8 scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-600" />
              {editingProduct ? 'Edit Product Item' : 'Add New Product Item'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-5 pt-3">
            {/* Image Upload Area */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 block">
                Product Image (Upload or URL)
              </Label>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                {/* Image Preview Box */}
                <div className="relative w-28 h-24 rounded-xl overflow-hidden bg-slate-900 border border-slate-300 shrink-0 flex items-center justify-center">
                  {image ? (
                    <img 
                      src={image} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as any).src = '/beam-block-system.png';
                      }}
                    />
                  ) : (
                    <div className="text-slate-500 text-[10px] flex flex-col items-center gap-1">
                      <Upload size={16} />
                      <span>No image</span>
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center text-white p-2">
                      <Loader2 className="h-5 w-5 animate-spin text-amber-400 mb-1" />
                      <span className="text-[10px] font-bold">{uploadProgress}%</span>
                    </div>
                  )}
                </div>

                {/* Upload & URL Controls */}
                <div className="flex-1 space-y-3 w-full">
                  <div>
                    <Input 
                      id="product-img-file"
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                    <Label
                      htmlFor="product-img-file"
                      className={`h-9 border border-dashed border-slate-300 rounded-lg flex items-center justify-center gap-2 cursor-pointer text-xs font-bold hover:bg-white hover:border-amber-500 transition-all ${
                        isUploading ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      <Upload size={14} className="text-amber-600" />
                      Upload Photo from Computer
                    </Label>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Or Paste Direct Image URL:
                    </span>
                    <Input 
                      placeholder="https://... or /beam-block-real.jpg"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      className="h-9 rounded-lg border-slate-200 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Product Name & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="prod-name" className="text-xs font-bold text-slate-700">
                  Product Name *
                </Label>
                <Input 
                  id="prod-name"
                  placeholder="e.g. Prestressed Concrete T-Beam"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-10 rounded-xl border-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prod-cat" className="text-xs font-bold text-slate-700">
                  Category *
                </Label>
                <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                  <SelectTrigger id="prod-cat" className="h-10 rounded-xl border-slate-200 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="beams" className="text-xs">Precast Beams</SelectItem>
                    <SelectItem value="blocks" className="text-xs">Infill Blocks</SelectItem>
                    <SelectItem value="packages" className="text-xs">Full Packages</SelectItem>
                    <SelectItem value="accessories" className="text-xs">BRC &amp; Accessories</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price & Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="prod-price" className="text-xs font-bold text-slate-700">
                  Display Price *
                </Label>
                <Input 
                  id="prod-price"
                  placeholder="e.g. KES 1,200 or KES 90"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="h-10 rounded-xl border-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prod-unit" className="text-xs font-bold text-slate-700">
                  Price Unit Text
                </Label>
                <Input 
                  id="prod-unit"
                  placeholder="e.g. per linear meter (KES 2,800 – 3,500 / m² slab)"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="h-10 rounded-xl border-slate-200 text-xs"
                />
              </div>
            </div>

            {/* Badge & Highlight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="prod-badge" className="text-xs font-bold text-slate-700">
                  Card Badge Text
                </Label>
                <Input 
                  id="prod-badge"
                  placeholder="e.g. Heavy Duty • NO Formwork Needed"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="h-10 rounded-xl border-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prod-order" className="text-xs font-bold text-slate-700">
                  Display Order / Position
                </Label>
                <Input 
                  id="prod-order"
                  type="number"
                  placeholder="1, 2, 3..."
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  className="h-10 rounded-xl border-slate-200 text-xs"
                />
              </div>
            </div>

            {/* Highlight Banner */}
            <div className="space-y-1.5">
              <Label htmlFor="prod-highlight" className="text-xs font-bold text-slate-700">
                Key Highlight (Sparkle Callout)
              </Label>
              <Input 
                id="prod-highlight"
                placeholder="e.g. NO formwork needed • Spans up to 6.5m+ with zero deflection"
                value={highlight}
                onChange={(e) => setHighlight(e.target.value)}
                className="h-10 rounded-xl border-slate-200 text-xs"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="prod-desc" className="text-xs font-bold text-slate-700">
                Product Description
              </Label>
              <Textarea 
                id="prod-desc"
                placeholder="Detailed description of structural features, spans, and materials..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="rounded-xl border-slate-200 text-xs resize-none"
              />
            </div>

            {/* Calculator Integration */}
            <div className="space-y-1.5">
              <Label htmlFor="prod-beamtype" className="text-xs font-bold text-slate-700">
                Link to Interactive Calculator
              </Label>
              <Select value={beamType} onValueChange={setBeamType}>
                <SelectTrigger id="prod-beamtype" className="h-10 rounded-xl border-slate-200 text-xs">
                  <SelectValue placeholder="No calculator link" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="none" className="text-xs">None (Show "Details &amp; Specs" button)</SelectItem>
                  <SelectItem value="tbeam" className="text-xs">Pre-select T-Beam in SilaCalc</SelectItem>
                  <SelectItem value="flat" className="text-xs">Pre-select Flat Beam in SilaCalc</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Specifications Section */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-700">
                  Key Specifications Table
                </Label>
                <Button 
                  type="button" 
                  onClick={handleAddSpec}
                  variant="outline" 
                  size="sm"
                  className="h-7 text-[11px] rounded-lg border-slate-200 font-bold"
                >
                  <Plus size={12} className="mr-1" /> Add Spec
                </Button>
              </div>

              <div className="space-y-2">
                {specs.map((spec, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input 
                      placeholder="e.g. Concrete Grade"
                      value={spec.label}
                      onChange={(e) => handleSpecChange(idx, 'label', e.target.value)}
                      className="h-8 rounded-lg border-slate-200 text-xs flex-1"
                    />
                    <Input 
                      placeholder="e.g. C50/60 Prestressed"
                      value={spec.value}
                      onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                      className="h-8 rounded-lg border-slate-200 text-xs flex-1"
                    />
                    <Button 
                      type="button"
                      onClick={() => handleRemoveSpec(idx)}
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-rose-600 rounded-lg shrink-0"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                className="rounded-xl border-slate-300 text-xs font-bold"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving || isUploading}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
