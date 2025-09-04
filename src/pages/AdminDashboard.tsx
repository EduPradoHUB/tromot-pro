import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { Plus, Edit, Trash2, Upload, Eye, EyeOff, Trophy, Medal, Award, FileSpreadsheet, FileText, Image, Check, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { BulkProductUpload } from '@/components/BulkProductUpload';
import { PostModeration } from '@/components/PostModeration';
import { medals, computeUserMedals, getProgressToNextMedal } from '@/lib/gamification';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const { 
    profile, 
    products, 
    banners, 
    advertisements, 
    vehicles,
    categories,
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
    uploadFile,
    fetchInstallationLeaderboard
  } = useApp();
  
  const { toast } = useToast();
  
  // Estado para o sistema de desfazer
  const [deletedProduct, setDeletedProduct] = useState<any>(null);
  
  // Load leaderboard on component mount
  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoadingLeaderboard(true);
      try {
        const data = await fetchInstallationLeaderboard();
        setLeaderboard(data);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      } finally {
        setLoadingLeaderboard(false);
      }
    };
    
    loadLeaderboard();
  }, [fetchInstallationLeaderboard]);
  
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
  
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [editingAdvertisement, setEditingAdvertisement] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<Array<{
    user_id: string;
    name: string;
    avatar_url: string | null;
    role: string;
    posts_count: number;
  }>>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Usar products diretamente do contexto agora que no_manual_available está incluído

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

      // Mostrar toast com opção de desfazer
      toast({
        title: "Produto deletado",
        description: `${productToDelete.name} foi removido.`,
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndoDelete}
          >
            Desfazer
          </Button>
        ),
      });

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


  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">Gerencie produtos, manuais, banners e propagandas</p>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="bulk-upload">Upload em Massa</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="banners">Banners</TabsTrigger>
          <TabsTrigger value="advertisements">Propagandas</TabsTrigger>
          <TabsTrigger value="vehicles">Veículos</TabsTrigger>
          <TabsTrigger value="moderation">Moderação</TabsTrigger>
          <TabsTrigger value="ranking">Ranking & Medalhas</TabsTrigger>
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
                    <Label htmlFor="barcode_ean">EAN-13 (opcional)</Label>
                    <Input
                      id="barcode_ean"
                      value={productForm.barcode_ean}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 13);
                        setProductForm({...productForm, barcode_ean: value});
                      }}
                      placeholder="7891234567890"
                      inputMode="numeric"
                      pattern="\d{13}"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      13 dígitos para busca por código de barras (ex: 7891234567890)
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={productForm.category} onValueChange={(value) => setProductForm({...productForm, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(cat => cat.active).map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Select value={productForm.manual_type} onValueChange={(value: 'pdf' | 'image') => setProductForm({...productForm, manual_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="image">Imagem</SelectItem>
                      </SelectContent>
                    </Select>
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
          
          <div className="grid gap-4">
            {products
              .sort((a, b) => {
                // Considerar produtos com "manual não disponível" como tendo manual
                const hasManualA = a.manual_url || a.no_manual_available;
                const hasManualB = b.manual_url || b.no_manual_available;
                
                // Calcular score de completude (0 = incompleto, 2 = completo)
                const scoreA = (hasManualA ? 1 : 0) + (a.image_url ? 1 : 0);
                const scoreB = (hasManualB ? 1 : 0) + (b.image_url ? 1 : 0);
                
                // Produtos menos completos primeiro (mais precisam de edição)
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
                    <Select value={adForm.slot} onValueChange={(value: any) => setAdForm({...adForm, slot: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home_hero">Banner Home</SelectItem>
                        <SelectItem value="product_banner">Banner Produto</SelectItem>
                        <SelectItem value="feed_sponsored">Feed Patrocinado</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Select value={adForm.creative_aspect_ratio} onValueChange={(value: any) => setAdForm({...adForm, creative_aspect_ratio: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4:5">4:5</SelectItem>
                        <SelectItem value="16:9">16:9</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Select value={adForm.target_type} onValueChange={(value: any) => setAdForm({...adForm, target_type: value, target_category: '', target_products: []})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Em todos os produtos</SelectItem>
                          <SelectItem value="category">Apenas em uma categoria específica</SelectItem>
                          <SelectItem value="products">Apenas em produtos específicos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {adForm.target_type === 'category' && (
                      <div>
                        <Label htmlFor="target_category">Categoria</Label>
                        <Select value={adForm.target_category} onValueChange={(value) => setAdForm({...adForm, target_category: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.filter(cat => cat.active).map((cat) => (
                              <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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

        {/* Ranking & Medalhas Tab */}
        <TabsContent value="ranking" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Ranking & Sistema de Medalhas</h2>
            <Button 
              variant="outline" 
              onClick={async () => {
                setLoadingLeaderboard(true);
                try {
                  const data = await fetchInstallationLeaderboard();
                  setLeaderboard(data);
                  toast({
                    title: "Dados atualizados",
                    description: "Ranking foi atualizado com sucesso!"
                  });
                } catch (error) {
                  toast({
                    title: "Erro",
                    description: "Falha ao carregar ranking.",
                    variant: "destructive"
                  });
                } finally {
                  setLoadingLeaderboard(false);
                }
              }}
              disabled={loadingLeaderboard}
            >
              {loadingLeaderboard ? 'Carregando...' : 'Atualizar Dados'}
            </Button>
          </div>

          {/* Sistema de Medalhas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Sistema de Medalhas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {medals.map((medal) => (
                  <div key={medal.id} className="text-center p-4 border rounded-lg">
                    <div className="text-2xl mb-2">{medal.icon}</div>
                    <h4 className="font-medium text-sm mb-1">{medal.name}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{medal.description}</p>
                    <Badge variant="outline" className="text-xs">
                      {medal.postsRequired} post{medal.postsRequired > 1 ? 's' : ''}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ranking de Instalações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medal className="h-5 w-5" />
                Ranking de Instalações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLeaderboard ? (
                <p className="text-center text-muted-foreground py-8">Carregando ranking...</p>
              ) : leaderboard.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado no ranking.</p>
              ) : (
                <div className="space-y-4">
                  {leaderboard.map((user, index) => {
                    const userMedals = computeUserMedals(user.posts_count);
                    const progress = getProgressToNextMedal(user.posts_count);
                    const isTopThree = index < 3;
                    
                    return (
                      <div 
                        key={user.user_id} 
                        className={`flex items-center gap-4 p-4 rounded-lg border ${
                          isTopThree ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : 'bg-card'
                        }`}
                      >
                        {/* Posição */}
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-amber-600 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>

                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Informações do usuário */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{user.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {user.role}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-semibold text-primary">
                              {user.posts_count} instalações
                            </span>
                            {userMedals.length > 0 && (
                              <div className="flex gap-1">
                                {userMedals.map((medal) => (
                                  <span 
                                    key={medal.id} 
                                    className="text-lg" 
                                    title={medal.name}
                                  >
                                    {medal.icon}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Progresso para próxima medalha */}
                          {progress.percentage < 100 && (
                            <div className="mt-2">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Progresso para próxima medalha:</span>
                                <span className="font-medium">{progress.current}/{progress.target}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                                <div 
                                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${progress.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Ícone de destaque para top 3 */}
                        {isTopThree && (
                          <div className="text-yellow-500">
                            <Award className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}