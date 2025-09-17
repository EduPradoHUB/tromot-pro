import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
// Removed Select imports to avoid React hooks conflicts
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { useAdminDistributors } from '@/hooks/useAdminDistributors';
import { Plus, Edit, Trash2, Upload, Eye, EyeOff, FileSpreadsheet, FileText, Image, Check, X, Search, Filter } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { BulkProductUpload } from '@/components/BulkProductUpload';
import { PostModeration } from '@/components/PostModeration';

// Replaced Dialog imports with custom implementation to avoid React hooks conflicts
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/CustomDialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  console.log('🔧 AdminDashboard: Componente iniciado');
  
  const { 
    profile, 
    products, 
    banners, 
    advertisements, 
    vehicles,
    categories,
    editableContent,
    updateSectionVisibility,
    createProduct, 
    updateProduct, 
    deleteProduct,
    createBanner,
    updateBanner,
    deleteBanner,
    createAdvertisement,
    updateAdvertisement,
    deleteAdvertisement,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    createCategory,
    updateCategory,
    deleteCategory,
    uploadFile
  } = useApp();
  
  console.log('🔧 AdminDashboard: Context carregado, profile:', profile?.role);
  
  // Use admin-specific hook for distributors to get complete data
  const { 
    distributors, 
    createDistributor: createAdminDistributor,
    updateDistributor: updateAdminDistributor,
    deleteDistributor: deleteAdminDistributor 
  } = useAdminDistributors();
  
  console.log('🔧 AdminDashboard: Hook distributors carregado');
  
  const { toast } = useToast();
  
  // Estado para o sistema de desfazer
  const [deletedProduct, setDeletedProduct] = useState<any>(null);
  
  
  const [productForm, setProductForm] = useState({
    name: '',
    code: '',
    barcode_ean: '',
    category: '',
    description: '',
    image_url: '',
    manual_url: '',
    manual_type: 'pdf' as 'pdf' | 'image',
    video_url: '',
    compatibility: '[]',
    out_of_production: false
  });
  
  const [bannerForm, setBannerForm] = useState({
    title: '',
    image_url: '',
    link_url: '',
    active: true
  });
  
  const [adForm, setAdForm] = useState({
    advertiser: '',
    slot: 'home_hero' as 'home_hero' | 'product_banner' | 'feed_sponsored',
    creative_url: '',
    creative_aspect_ratio: '4:5' as '4:5' | '16:9',
    target_url: '',
    start_date: '',
    end_date: '',
    daily_cap: 1000,
    target_type: 'all' as 'all' | 'category' | 'products',
    target_category: '',
    target_products: [] as string[]
  });
  
  const [vehicleForm, setVehicleForm] = useState({
    brand: '',
    model: '',
    years: ''
  });
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    active: true
  });
  
  const [distributorForm, setDistributorForm] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    state: '',
    city: '',
    cover_entire_state: false,
    active: true
  });
  
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [editingAdvertisement, setEditingAdvertisement] = useState<any>(null);
  const [editingDistributor, setEditingDistributor] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<'product' | 'banner' | 'ad' | 'vehicle' | 'category' | 'distributor' | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Estados para filtros e busca de produtos
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    withoutManual: false,
    withoutPhoto: false,
    outOfProduction: false,
    category: 'all',
    missingData: false,
    withoutCategory: false,
    withoutEAN: false
  });
  

  // Usar products diretamente do contexto agora que no_manual_available está incluído
  
  // Função para filtrar produtos
  const filteredProducts = products.filter(product => {
    // Busca por nome ou código
    const matchesSearch = searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtros
    const matchesFilters = 
      (!filters.withoutManual || (!product.manual_url && !product.no_manual_available)) &&
      (!filters.withoutPhoto || !product.image_url) &&
      (!filters.outOfProduction || product.out_of_production) &&
      (!filters.category || filters.category === 'all' || product.category === filters.category) &&
      (!filters.missingData || (!product.manual_url && !product.no_manual_available) || !product.image_url) &&
      (!filters.withoutCategory || !product.category || product.category.trim() === '') &&
      (!filters.withoutEAN || !product.barcode_ean || product.barcode_ean.trim() === '');
      
    return matchesSearch && matchesFilters;
  });

  const handleNoManualChange = async (productId: string, noManualAvailable: boolean) => {
    console.log('Atualizando produto:', productId, 'no_manual_available:', noManualAvailable);
    try {
      const { error } = await supabase
        .from('products')
        .update({ no_manual_available: noManualAvailable })
        .eq('id', productId);

      if (error) throw error;

      console.log('Produto atualizado no banco, chamando updateProduct...');
      // Atualizar no contexto também
      await updateProduct(productId, { no_manual_available: noManualAvailable });

      toast({
        title: noManualAvailable ? "Produto marcado como sem manual" : "Marca removida do produto",
        description: noManualAvailable 
          ? "O produto agora exibirá 'Manual digital não disponível'"
          : "O produto voltará a exibir o botão de download se houver manual"
      });
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o produto.",
        variant: "destructive"
      });
    }
  };

  // Função para deletar produto com opção de desfazer
  const handleDeleteProduct = async (productId: string) => {
    try {
      // Encontrar o produto antes de deletar
      const productToDelete = products.find(p => p.id === productId);
      if (!productToDelete) return;

      // Salvar o produto para poder desfazer
      setDeletedProduct(productToDelete);

      // Deletar o produto
      await deleteProduct(productId);

      // Mostrar toast de confirmação
      toast({
        title: "Produto deletado",
        description: `${productToDelete.name} foi removido.`,
      })

      // Limpar o produto salvo após 10 segundos se não foi restaurado
      setTimeout(() => {
        setDeletedProduct(null);
      }, 10000);

    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar o produto.",
        variant: "destructive"
      });
    }
  };

  // Função para desfazer a exclusão
  const handleUndoDelete = async () => {
    if (!deletedProduct) return;

    try {
      await createProduct(deletedProduct);
      setDeletedProduct(null);

      toast({
        title: "Produto restaurado",
        description: `${deletedProduct.name} foi restaurado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao restaurar produto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível restaurar o produto.",
        variant: "destructive"
      });
    }
  };

  if (!profile || profile.role !== 'ADM') {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Acesso restrito para administradores.</p>
      </div>
    );
  }

  const handleFileUpload = async (file: File, bucket: string) => {
    setUploadingFile(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const url = await uploadFile(bucket, fileName, file);
      toast({
        title: "Upload realizado",
        description: "Arquivo enviado com sucesso!"
      });
      return url;
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Falha ao enviar arquivo.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setUploadingFile(false);
    }
  };

  // Distributor handlers  
  const handleCreateDistributor = async () => {
    try {
      await createAdminDistributor(distributorForm);
      
      setDistributorForm({
        name: '',
        phone: '',
        whatsapp: '',
        state: '',
        city: '',
        cover_entire_state: false,
        active: true
      });
      
      setDialogOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Distribuidor criado com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar distribuidor.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateDistributor = async () => {
    if (!editingDistributor) return;
    
    try {
      await updateAdminDistributor(editingDistributor.id, distributorForm);
      
      setDistributorForm({
        name: '',
        phone: '',
        whatsapp: '',
        state: '',
        city: '',
        cover_entire_state: false,
        active: true
      });
      
      setEditingDistributor(null);
      setDialogOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Distribuidor atualizado com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar distribuidor.",
        variant: "destructive"
      });
    }
  };

  const openDialog = (type: 'product' | 'banner' | 'ad' | 'vehicle' | 'category' | 'distributor') => {
    setDialogContent(type);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogContent(null);
    setDialogOpen(false);
    setEditingProduct(null);
    setEditingCategory(null);
    setEditingVehicle(null);
    setEditingAdvertisement(null);
    setEditingDistributor(null);
  };

  const handleDeleteDistributor = async (id: string) => {
    try {
      await deleteAdminDistributor(id);
      
      toast({
        title: "Sucesso",
        description: "Distribuidor excluído com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir distribuidor.",
        variant: "destructive"
      });
    }
  };

  const handleCreateProduct = async () => {
    // Validate EAN-13
    if (productForm.barcode_ean && !/^\d{13}$/.test(productForm.barcode_ean)) {
      toast({
        title: "EAN-13 inválido",
        description: "O EAN-13 deve conter exatamente 13 dígitos.",
        variant: "destructive"
      });
      return;
    }

    try {
      await createProduct({
        ...productForm,
        barcode_ean: productForm.barcode_ean || null,
        compatibility: JSON.parse(productForm.compatibility)
      });
      
      setProductForm({
        name: '',
        code: '',
        barcode_ean: '',
        category: '',
        description: '',
        image_url: '',
        manual_url: '',
        manual_type: 'pdf',
        video_url: '',
        compatibility: '[]',
        out_of_production: false
      });
      
      setDialogOpen(false);
      
      toast({
        title: "Produto criado",
        description: "Produto adicionado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar produto.",
        variant: "destructive"
      });
    }
  };

  const handleCreateBanner = async () => {
    try {
      await createBanner(bannerForm);
      
      setBannerForm({
        title: '',
        image_url: '',
        link_url: '',
        active: true
      });
      
      setDialogOpen(false);
      
      toast({
        title: "Banner criado",
        description: "Banner adicionado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar banner.",
        variant: "destructive"
      });
    }
  };

  const handleCreateAdvertisement = async () => {
    try {
      await createAdvertisement(adForm);
      
      setAdForm({
        advertiser: '',
        slot: 'home_hero',
        creative_url: '',
        creative_aspect_ratio: '4:5',
        target_url: '',
        start_date: '',
        end_date: '',
        daily_cap: 1000,
        target_type: 'all',
        target_category: '',
        target_products: []
      });
      
      setDialogOpen(false);
      
      toast({
        title: "Propaganda criada",
        description: "Propaganda adicionada com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar propaganda.",
        variant: "destructive"
      });
    }
  };

  const handleCreateVehicle = async () => {
    try {
      await createVehicle({
        ...vehicleForm,
        years: vehicleForm.years.split(',').map(y => y.trim())
      });
      
      setVehicleForm({
        brand: '',
        model: '',
        years: ''
      });
      
      setDialogOpen(false);
      
      toast({
        title: "Veículo criado",
        description: "Veículo adicionado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar veículo.",
        variant: "destructive"
      });
    }
  };

  const handleEditVehicle = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      brand: vehicle.brand,
      model: vehicle.model,
      years: vehicle.years.join(', ')
    });
    setDialogOpen(true);
  };

  const handleUpdateVehicle = async () => {
    if (!editingVehicle) return;
    
    try {
      await updateVehicle(editingVehicle.id, {
        ...vehicleForm,
        years: vehicleForm.years.split(',').map(y => y.trim())
      });
      
      setVehicleForm({
        brand: '',
        model: '',
        years: ''
      });
      
      setEditingVehicle(null);
      setDialogOpen(false);
      
      toast({
        title: "Veículo atualizado",
        description: "Veículo atualizado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar veículo.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm('Tem certeza que deseja excluir este veículo?')) return;
    
    try {
      await deleteVehicle(vehicleId);
      
      toast({
        title: "Veículo excluído",
        description: "Veículo excluído com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir veículo.",
        variant: "destructive"
      });
    }
  };

  const handleCreateCategory = async () => {
    try {
      await createCategory(categoryForm);
      
      setCategoryForm({
        name: '',
        description: '',
        active: true
      });
      
      setDialogOpen(false);
      
      toast({
        title: "Categoria criada",
        description: "Categoria adicionada com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar categoria.",
        variant: "destructive"
      });
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      code: product.code,
      barcode_ean: product.barcode_ean || '',
      category: product.category,
      description: product.description || '',
      image_url: product.image_url || '',
      manual_url: product.manual_url || '',
      manual_type: product.manual_type || 'pdf',
      video_url: product.video_url || '',
      compatibility: JSON.stringify(product.compatibility || []),
      out_of_production: product.out_of_production || false
    });
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      active: category.active
    });
  };

  const handleUpdateProduct = async () => {
    // Validate EAN-13
    if (productForm.barcode_ean && !/^\d{13}$/.test(productForm.barcode_ean)) {
      toast({
        title: "EAN-13 inválido",
        description: "O EAN-13 deve conter exatamente 13 dígitos.",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateProduct(editingProduct.id, {
        ...productForm,
        barcode_ean: productForm.barcode_ean || null,
        compatibility: JSON.parse(productForm.compatibility)
      });
      
      setProductForm({
        name: '',
        code: '',
        barcode_ean: '',
        category: '',
        description: '',
        image_url: '',
        manual_url: '',
        manual_type: 'pdf',
        video_url: '',
        compatibility: '[]',
        out_of_production: false
      });
      
      setEditingProduct(null);
      setDialogOpen(false);
      
      toast({
        title: "Produto atualizado",
        description: "Produto editado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar produto.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateCategory = async () => {
    try {
      await updateCategory(editingCategory.id, categoryForm);
      
      setCategoryForm({
        name: '',
        description: '',
        active: true
      });
      
      setEditingCategory(null);
      setDialogOpen(false);
      
      toast({
        title: "Categoria atualizada",
        description: "Categoria editada com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar categoria.",
        variant: "destructive"
      });
    }
  };

  const handleEditAdvertisement = (ad: any) => {
    setEditingAdvertisement(ad);
    setAdForm({
      advertiser: ad.advertiser,
      slot: ad.slot,
      creative_url: ad.creative_url,
      creative_aspect_ratio: ad.creative_aspect_ratio,
      target_url: ad.target_url || '',
      start_date: ad.start_date,
      end_date: ad.end_date,
      daily_cap: ad.daily_cap,
      target_type: ad.target_type || 'all',
      target_category: ad.target_category || '',
      target_products: ad.target_products || []
    });
  };

  const handleUpdateAdvertisement = async () => {
    try {
      await updateAdvertisement(editingAdvertisement.id, adForm);
      
      setAdForm({
        advertiser: '',
        slot: 'home_hero',
        creative_url: '',
        creative_aspect_ratio: '4:5',
        target_url: '',
        start_date: '',
        end_date: '',
        daily_cap: 1000,
        target_type: 'all',
        target_category: '',
        target_products: []
      });
      
      setEditingAdvertisement(null);
      setDialogOpen(false);
      
      toast({
        title: "Propaganda atualizada",
        description: "Propaganda editada com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar propaganda.",
        variant: "destructive"
      });
    }
  };


  if (!profile || profile.role !== 'ADM') {
    return <div>Acesso negado. Apenas administradores podem acessar esta página.</div>;
  }

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">Gerencie produtos, manuais, banners e propagandas</p>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="bulk-upload">Upload em Massa</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="distributors">Distribuidores</TabsTrigger>
          <TabsTrigger value="banners">Banners</TabsTrigger>
          <TabsTrigger value="advertisements">Propagandas</TabsTrigger>
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="vehicles">Veículos</TabsTrigger>
          <TabsTrigger value="moderation">Moderação</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Produtos</h2>
            
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditingProduct(null);
                setProductForm({
                  name: '',
                  code: '',
                  barcode_ean: '',
                  category: '',
                  description: '',
                  image_url: '',
                  manual_url: '',
                  manual_type: 'pdf',
                  video_url: '',
                  compatibility: '[]',
                  out_of_production: false
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Produto
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome</Label>
                      <Input
                        id="name"
                        value={productForm.name}
                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="code">Código</Label>
                      <Input
                        id="code"
                        value={productForm.code}
                        onChange={(e) => setProductForm({...productForm, code: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="barcode_ean">Código de Barras/EAN</Label>
                    <Input
                      id="barcode_ean"
                      value={productForm.barcode_ean}
                      onChange={(e) => setProductForm({...productForm, barcode_ean: e.target.value})}
                      inputMode="numeric"
                      pattern="\d{13}"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      13 dígitos para busca por código de barras (ex: 7891234567890)
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <select 
                      value={productForm.category} 
                      onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                      className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="">Selecione a categoria</option>
                      {categories.filter(cat => cat.active).map((cat) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="image_url">URL da Imagem</Label>
                    <Input
                      id="image_url"
                      value={productForm.image_url}
                      onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                      placeholder="Cole a URL da imagem ou faça upload abaixo"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="product_image_upload">Ou faça upload da imagem do produto</Label>
                    <Input
                      id="product_image_upload"
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const url = await handleFileUpload(file, 'product-images');
                            setProductForm({...productForm, image_url: url});
                          } catch (error) {
                            console.error('Erro no upload:', error);
                          }
                        }
                      }}
                      disabled={uploadingFile}
                    />
                    {uploadingFile && <p className="text-sm text-muted-foreground mt-1">Enviando arquivo...</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="manual_url">URL do Manual</Label>
                    <Input
                      id="manual_url"
                      value={productForm.manual_url}
                      onChange={(e) => setProductForm({...productForm, manual_url: e.target.value})}
                      placeholder="Cole a URL do manual ou faça upload abaixo"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="manual_upload">Ou faça upload do manual</Label>
                    <Input
                      id="manual_upload"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const url = await handleFileUpload(file, 'manuals');
                            const type = file.type.includes('pdf') ? 'pdf' : 'image';
                            setProductForm({
                              ...productForm, 
                              manual_url: url,
                              manual_type: type
                            });
                          } catch (error) {
                            console.error('Erro no upload:', error);
                          }
                        }
                      }}
                      disabled={uploadingFile}
                    />
                    {uploadingFile && <p className="text-sm text-muted-foreground mt-1">Enviando arquivo...</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="manual_type">Tipo do Manual</Label>
                    <select 
                      value={productForm.manual_type} 
                      onChange={(e) => setProductForm({...productForm, manual_type: e.target.value as 'pdf' | 'image'})}
                      className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="pdf">PDF</option>
                      <option value="image">Imagem</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="video_url">URL do Vídeo (opcional)</Label>
                    <Input
                      id="video_url"
                      value={productForm.video_url}
                      onChange={(e) => setProductForm({...productForm, video_url: e.target.value})}
                    />
                   </div>
                   
                   <div className="flex items-center space-x-2">
                     <Switch
                       id="out_of_production"
                       checked={productForm.out_of_production}
                       onCheckedChange={(checked) => setProductForm({...productForm, out_of_production: checked})}
                     />
                     <Label htmlFor="out_of_production">Fora de produção</Label>
                   </div>
                   
                    <Button onClick={editingProduct ? handleUpdateProduct : handleCreateProduct} disabled={uploadingFile}>
                     {uploadingFile ? 'Enviando...' : (editingProduct ? 'Atualizar Produto' : 'Criar Produto')}
                   </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Filtros e Busca */}
          <div className="space-y-4">
            <div className="flex gap-4 flex-wrap items-center">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <select 
                value={filters.category} 
                onChange={(e) => setFilters(prev => ({...prev, category: e.target.value}))}
                className="w-[200px] h-10 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="all">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filters.withoutManual ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters(prev => ({...prev, withoutManual: !prev.withoutManual}))}
              >
                <Filter className="w-4 h-4 mr-2" />
                Sem manual
              </Button>
              
              <Button
                variant={filters.withoutPhoto ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters(prev => ({...prev, withoutPhoto: !prev.withoutPhoto}))}
              >
                <Filter className="w-4 h-4 mr-2" />
                Sem foto
              </Button>
              
              <Button
                variant={filters.outOfProduction ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters(prev => ({...prev, outOfProduction: !prev.outOfProduction}))}
              >
                <Filter className="w-4 h-4 mr-2" />
                Fora de produção
              </Button>
              
              <Button
                variant={filters.missingData ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters(prev => ({...prev, missingData: !prev.missingData}))}
              >
                <Filter className="w-4 h-4 mr-2" />
                Faltando dados
              </Button>
              
              <Button
                variant={filters.withoutCategory ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters(prev => ({...prev, withoutCategory: !prev.withoutCategory}))}
              >
                <Filter className="w-4 h-4 mr-2" />
                Sem categoria
              </Button>
              
              <Button
                variant={filters.withoutEAN ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters(prev => ({...prev, withoutEAN: !prev.withoutEAN}))}
              >
                <Filter className="w-4 h-4 mr-2" />
                Sem EAN13
              </Button>
              
              {(searchTerm || Object.values(filters).some(f => f)) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilters({
                      withoutManual: false,
                      withoutPhoto: false,
                      outOfProduction: false,
                      category: '',
                      missingData: false,
                      withoutCategory: false,
                      withoutEAN: false
                    });
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpar filtros
                </Button>
              )}
            </div>
          </div>
          
          <div className="grid gap-4">
            {filteredProducts
              .sort((a, b) => {
                const hasManualA = a.manual_url || a.no_manual_available;
                const hasManualB = b.manual_url || b.no_manual_available;
                const scoreA = (hasManualA ? 1 : 0) + (a.image_url ? 1 : 0);
                const scoreB = (hasManualB ? 1 : 0) + (b.image_url ? 1 : 0);
                return scoreA - scoreB;
              })
              .map((product) => (
              <Card key={product.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{product.name}</h3>
                        <div className="flex gap-1">
                          {/* Ícone de manual */}
                          <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs" 
                               style={{
                                 backgroundColor: (product.manual_url || product.no_manual_available) ? '#dcfce7' : '#fef2f2',
                                 color: (product.manual_url || product.no_manual_available) ? '#166534' : '#dc2626'
                               }}>
                            <FileText className="w-3 h-3" />
                            {product.no_manual_available ? 'Manual não disponível' : 
                             product.manual_url ? 'Manual' : 'Sem manual'}
                          </div>
                          {/* Ícone de foto */}
                          <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                               style={{
                                 backgroundColor: product.image_url ? '#dcfce7' : '#fef2f2', 
                                 color: product.image_url ? '#166534' : '#dc2626'
                               }}>
                            <Image className="w-3 h-3" />
                            {product.image_url ? 'Foto' : 'Sem foto'}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{product.code}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{product.category}</Badge>
                        {product.out_of_production && (
                          <Badge variant="destructive">Fora de produção</Badge>
                        )}
                      </div>
                      
                      {/* Checkbox para marcar produto sem manual */}
                      <div className="flex items-center space-x-2 mt-3">
                        <Checkbox
                          id={`no-manual-${product.id}`}
                          checked={product.no_manual_available || false}
                          onCheckedChange={(checked) => handleNoManualChange(product.id, !!checked)}
                        />
                        <label 
                          htmlFor={`no-manual-${product.id}`} 
                          className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Manual não disponível
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        handleEditProduct(product);
                        setDialogOpen(true);
                      }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                       <Button variant="outline" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                         <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                 </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Bulk Upload Tab */}
        <TabsContent value="bulk-upload" className="space-y-6">
          <BulkProductUpload />
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Categorias</h2>
            
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditingCategory(null);
                setCategoryForm({
                  name: '',
                  description: '',
                  active: true
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Categoria
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="category_name">Nome</Label>
                    <Input
                      id="category_name"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category_description">Descrição</Label>
                    <Textarea
                      id="category_description"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="category_active"
                      checked={categoryForm.active}
                      onCheckedChange={(checked) => setCategoryForm({...categoryForm, active: checked})}
                    />
                    <Label htmlFor="category_active">Ativa</Label>
                  </div>
                  
                   <Button onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}>
                     {editingCategory ? 'Atualizar Categoria' : 'Criar Categoria'}
                   </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid gap-4">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                      <Badge variant={category.active ? "default" : "secondary"} className="mt-2">
                        {category.active ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                     <div className="flex gap-2">
                       <Button variant="outline" size="sm" onClick={() => {
                         handleEditCategory(category);
                         setDialogOpen(true);
                       }}>
                         <Edit className="w-4 h-4" />
                       </Button>
                       <Button variant="outline" size="sm" onClick={() => deleteCategory(category.id)}>
                         <Trash2 className="w-4 h-4" />
                       </Button>
                     </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Distributors Tab */}
        <TabsContent value="distributors" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Distribuidores</h2>
            
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditingDistributor(null);
                setDistributorForm({
                  name: '',
                  phone: '',
                  whatsapp: '',
                  state: '',
                  city: '',
                  cover_entire_state: false,
                  active: true
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingDistributor(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Distribuidor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingDistributor ? 'Editar Distribuidor' : 'Novo Distribuidor'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="distributor_name">Nome</Label>
                    <Input
                      id="distributor_name"
                      value={distributorForm.name}
                      onChange={(e) => setDistributorForm({...distributorForm, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={distributorForm.phone}
                        onChange={(e) => setDistributorForm({...distributorForm, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        value={distributorForm.whatsapp}
                        onChange={(e) => setDistributorForm({...distributorForm, whatsapp: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        value={distributorForm.state}
                        onChange={(e) => setDistributorForm({...distributorForm, state: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={distributorForm.city}
                        onChange={(e) => setDistributorForm({...distributorForm, city: e.target.value})}
                        disabled={distributorForm.cover_entire_state}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="cover_entire_state"
                      checked={distributorForm.cover_entire_state}
                      onCheckedChange={(checked) => setDistributorForm({...distributorForm, cover_entire_state: checked, city: checked ? '' : distributorForm.city})}
                    />
                    <Label htmlFor="cover_entire_state">Atende todo o estado</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="distributor_active"
                      checked={distributorForm.active}
                      onCheckedChange={(checked) => setDistributorForm({...distributorForm, active: checked})}
                    />
                    <Label htmlFor="distributor_active">Ativo</Label>
                  </div>
                  
                   <Button onClick={editingDistributor ? handleUpdateDistributor : handleCreateDistributor}>
                     {editingDistributor ? 'Atualizar Distribuidor' : 'Criar Distribuidor'}
                   </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid gap-4">
            {distributors.map((distributor) => (
              <Card key={distributor.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{distributor.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {distributor.cover_entire_state 
                          ? `Todo o estado - ${distributor.state}`
                          : `${distributor.city}, ${distributor.state}`
                        }
                      </p>
                      {distributor.phone && (
                        <p className="text-sm text-muted-foreground">Tel: {distributor.phone}</p>
                      )}
                      {distributor.whatsapp && (
                        <p className="text-sm text-muted-foreground">WhatsApp: {distributor.whatsapp}</p>
                      )}
                      <Badge variant={distributor.active ? "default" : "secondary"}>
                        {distributor.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingDistributor(distributor);
                        setDistributorForm({
                          name: distributor.name,
                          phone: distributor.phone || '',
                          whatsapp: distributor.whatsapp || '',
                          state: distributor.state,
                          city: distributor.city || '',
                          cover_entire_state: distributor.cover_entire_state,
                          active: distributor.active
                        });
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteDistributor(distributor.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Banners Tab */}
        <TabsContent value="banners" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Banners</h2>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Banner
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Banner</DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm({...bannerForm, title: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="image_url">URL da Imagem</Label>
                    <Input
                      id="image_url"
                      value={bannerForm.image_url}
                      onChange={(e) => setBannerForm({...bannerForm, image_url: e.target.value})}
                      placeholder="Cole a URL da imagem ou faça upload abaixo"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="banner_upload">Ou faça upload da imagem</Label>
                    <Input
                      id="banner_upload"
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const url = await handleFileUpload(file, 'banners');
                            setBannerForm({...bannerForm, image_url: url});
                          } catch (error) {
                            console.error('Erro no upload:', error);
                          }
                        }
                      }}
                      disabled={uploadingFile}
                    />
                    {uploadingFile && <p className="text-sm text-muted-foreground mt-1">Enviando arquivo...</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="link_url">URL do Link (opcional)</Label>
                    <Input
                      id="link_url"
                      value={bannerForm.link_url}
                      onChange={(e) => setBannerForm({...bannerForm, link_url: e.target.value})}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={bannerForm.active}
                      onCheckedChange={(checked) => setBannerForm({...bannerForm, active: checked})}
                    />
                    <Label htmlFor="active">Ativo</Label>
                  </div>
                  
                  <Button onClick={handleCreateBanner} disabled={uploadingFile}>
                    Criar Banner
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid gap-4">
            {banners.map((banner) => (
              <Card key={banner.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{banner.title}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        {banner.active ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Eye className="w-3 h-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteBanner(banner.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Advertisements Tab */}
        <TabsContent value="advertisements" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Propagandas</h2>
            
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditingAdvertisement(null);
                setAdForm({
                  advertiser: '',
                  slot: 'home_hero',
                  creative_url: '',
                  creative_aspect_ratio: '4:5',
                  target_url: '',
                  start_date: '',
                  end_date: '',
                  daily_cap: 1000,
                  target_type: 'all',
                  target_category: '',
                  target_products: []
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Propaganda
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingAdvertisement ? 'Editar Propaganda' : 'Nova Propaganda'}</DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="advertiser">Anunciante</Label>
                    <Input
                      id="advertiser"
                      value={adForm.advertiser}
                      onChange={(e) => setAdForm({...adForm, advertiser: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="slot">Posição</Label>
                    <select 
                      value={adForm.slot} 
                      onChange={(e) => setAdForm({...adForm, slot: e.target.value as 'home_hero' | 'product_banner' | 'feed_sponsored'})}
                      className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="home_hero">Banner Home</option>
                      <option value="product_banner">Banner Produto</option>
                      <option value="feed_sponsored">Feed Patrocinado</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="creative_url">URL do Criativo</Label>
                    <Input
                      id="creative_url"
                      value={adForm.creative_url}
                      onChange={(e) => setAdForm({...adForm, creative_url: e.target.value})}
                      placeholder="Cole a URL da imagem ou faça upload abaixo"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="creative_upload">Ou faça upload da imagem</Label>
                    <Input
                      id="creative_upload"
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const url = await handleFileUpload(file, 'advertisements');
                            setAdForm({...adForm, creative_url: url});
                          } catch (error) {
                            console.error('Erro no upload:', error);
                          }
                        }
                      }}
                      disabled={uploadingFile}
                    />
                    {uploadingFile && <p className="text-sm text-muted-foreground mt-1">Enviando arquivo...</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="aspect_ratio">Proporção</Label>
                    <select 
                      value={adForm.creative_aspect_ratio} 
                      onChange={(e) => setAdForm({...adForm, creative_aspect_ratio: e.target.value as '4:5' | '16:9'})}
                      className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="4:5">4:5</option>
                      <option value="16:9">16:9</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="target_url">URL de Destino</Label>
                    <Input
                      id="target_url"
                      value={adForm.target_url}
                      onChange={(e) => setAdForm({...adForm, target_url: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Data Início</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={adForm.start_date}
                        onChange={(e) => setAdForm({...adForm, start_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">Data Fim</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={adForm.end_date}
                        onChange={(e) => setAdForm({...adForm, end_date: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="daily_cap">Limite Diário</Label>
                    <Input
                      id="daily_cap"
                      type="number"
                      value={adForm.daily_cap}
                      onChange={(e) => setAdForm({...adForm, daily_cap: parseInt(e.target.value)})}
                    />
                  </div>
                  
                  {/* Campos de Segmentação */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium">Segmentação</h4>
                    
                    <div>
                      <Label htmlFor="target_type">Onde exibir</Label>
                      <select 
                        value={adForm.target_type} 
                        onChange={(e) => setAdForm({...adForm, target_type: e.target.value as 'all' | 'category' | 'products', target_category: '', target_products: []})}
                        className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <option value="all">Em todos os produtos</option>
                        <option value="category">Apenas em uma categoria específica</option>
                        <option value="products">Apenas em produtos específicos</option>
                      </select>
                    </div>
                    
                    {adForm.target_type === 'category' && (
                      <div>
                        <Label htmlFor="target_category">Categoria</Label>
                        <select 
                          value={adForm.target_category} 
                          onChange={(e) => setAdForm({...adForm, target_category: e.target.value})}
                          className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <option value="">Selecione a categoria</option>
                          {categories.filter(cat => cat.active).map((cat) => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {adForm.target_type === 'products' && (
                      <div>
                        <Label>Produtos específicos</Label>
                        <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                          {products.map((product) => (
                            <div key={product.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`product-${product.id}`}
                                checked={adForm.target_products.includes(product.id)}
                                onChange={(e) => {
                                  const productIds = e.target.checked
                                    ? [...adForm.target_products, product.id]
                                    : adForm.target_products.filter(id => id !== product.id);
                                  setAdForm({...adForm, target_products: productIds});
                                }}
                                className="rounded"
                              />
                              <label htmlFor={`product-${product.id}`} className="text-sm cursor-pointer">
                                {product.name} ({product.code})
                              </label>
                            </div>
                          ))}
                        </div>
                        {adForm.target_products.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {adForm.target_products.length} produto(s) selecionado(s)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                   <Button onClick={editingAdvertisement ? handleUpdateAdvertisement : handleCreateAdvertisement} disabled={uploadingFile}>
                      {editingAdvertisement ? 'Atualizar Propaganda' : 'Criar Propaganda'}
                    </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Explicativo sobre tamanhos das artes */}
          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-xl">📐</span>
                Guia de Tamanhos para Artes dos Anúncios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-primary">Banner Home</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Tamanho ideal:</strong> 1080x1350px</p>
                    <p><strong>Proporção:</strong> 4:5</p>
                    <p><strong>Local:</strong> Página inicial principal</p>
                    <p className="text-muted-foreground">Exibido em destaque na home, formato vertical otimizado para mobile</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-primary">Banner Produto</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Tamanho ideal:</strong> 1920x1080px</p>
                    <p><strong>Proporção:</strong> 16:9</p>
                    <p><strong>Local:</strong> Páginas de produtos</p>
                    <p className="text-muted-foreground">Aparece entre o manual e o feed de instalações, formato horizontal</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-primary">Feed Patrocinado</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Tamanho ideal:</strong> 1080x1350px</p>
                    <p><strong>Proporção:</strong> 4:5</p>
                    <p><strong>Local:</strong> No meio do feed</p>
                    <p className="text-muted-foreground">Integrado ao feed de posts, com selo "Patrocinado"</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-3 mt-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Dica:</strong> As imagens devem ser em alta resolução (mínimo 72 DPI) e em formato JPG ou PNG. 
                  Evite textos muito pequenos que possam ficar ilegíveis em dispositivos móveis.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-4">
            {advertisements.map((ad) => (
              <Card key={ad.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{ad.advertiser}</h3>
                      <p className="text-sm text-muted-foreground">{ad.slot}</p>
                      <Badge variant="outline" className="mt-2">{ad.status}</Badge>
                    </div>
                     <div className="flex gap-2">
                       <Button variant="outline" size="sm" onClick={() => {
                         handleEditAdvertisement(ad);
                         setDialogOpen(true);
                       }}>
                         <Edit className="w-4 h-4" />
                       </Button>
                       <Button variant="outline" size="sm" onClick={() => deleteAdvertisement(ad.id)}>
                         <Trash2 className="w-4 h-4" />
                       </Button>
                     </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Visibilidade de Seções</h2>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Controle de Exibição</CardTitle>
              <p className="text-muted-foreground">
                Gerencie quais seções aparecem no aplicativo
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {editableContent.map((content) => (
                <div key={content.section} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">{content.title || content.section}</h4>
                    <p className="text-sm text-muted-foreground">
                      Seção: {content.section}
                    </p>
                    {content.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {content.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={content.visible !== false}
                      onCheckedChange={(checked) => updateSectionVisibility(content.section, checked)}
                    />
                    <span className="text-sm">
                      {content.visible !== false ? 'Visível' : 'Oculta'}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vehicles Tab */}
        <TabsContent value="vehicles" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Veículos</h2>
            
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditingVehicle(null);
                setVehicleForm({
                  brand: '',
                  model: '',
                  years: ''
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Veículo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingVehicle ? 'Editar Veículo' : 'Novo Veículo'}</DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="brand">Marca</Label>
                    <Input
                      id="brand"
                      value={vehicleForm.brand}
                      onChange={(e) => setVehicleForm({...vehicleForm, brand: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      value={vehicleForm.model}
                      onChange={(e) => setVehicleForm({...vehicleForm, model: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="years">Anos (separados por vírgula)</Label>
                    <Input
                      id="years"
                      placeholder="2020, 2021, 2022"
                      value={vehicleForm.years}
                      onChange={(e) => setVehicleForm({...vehicleForm, years: e.target.value})}
                    />
                  </div>
                  
                  <Button onClick={editingVehicle ? handleUpdateVehicle : handleCreateVehicle}>
                    {editingVehicle ? 'Atualizar Veículo' : 'Criar Veículo'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid gap-4">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{vehicle.brand} {vehicle.model}</h3>
                      <p className="text-sm text-muted-foreground">
                        Anos: {vehicle.years.join(', ')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditVehicle(vehicle)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Moderação Tab */}
        <TabsContent value="moderation" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Moderação de Posts</h2>
          </div>
          
          <PostModeration />
        </TabsContent>

      </Tabs>
    </div>
  );
}
