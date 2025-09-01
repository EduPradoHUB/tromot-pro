import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { Plus, Edit, Trash2, Upload, Eye, EyeOff } from 'lucide-react';
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
    uploadFile
  } = useApp();
  
  const { toast } = useToast();
  
  const [productForm, setProductForm] = useState({
    name: '',
    code: '',
    category: '',
    description: '',
    image_url: '',
    manual_url: '',
    manual_type: 'pdf' as 'pdf' | 'image',
    video_url: '',
    compatibility: '[]'
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
    daily_cap: 1000
  });
  
  const [vehicleForm, setVehicleForm] = useState({
    brand: '',
    model: '',
    years: ''
  });
  
  const [editingItem, setEditingItem] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

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
      console.log('handleFileUpload chamado com:', { fileName: file.name, bucket, fileSize: file.size });
      const fileName = `${Date.now()}-${file.name}`;
      const url = await uploadFile(bucket, fileName, file);
      console.log('URL recebida do uploadFile:', url);
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
    try {
      await createProduct({
        ...productForm,
        compatibility: JSON.parse(productForm.compatibility)
      });
      
      setProductForm({
        name: '',
        code: '',
        category: '',
        description: '',
        image_url: '',
        manual_url: '',
        manual_type: 'pdf',
        video_url: '',
        compatibility: '[]'
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
      console.log('Criando banner com dados:', bannerForm);
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
        daily_cap: 1000
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

  const categories = ['Alarmes', 'Vidros Elétricos', 'Travas', 'Sensores', 'Outros'];

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">Gerencie produtos, manuais, banners e propagandas</p>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="banners">Banners</TabsTrigger>
          <TabsTrigger value="advertisements">Propagandas</TabsTrigger>
          <TabsTrigger value="vehicles">Veículos</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Produtos</h2>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Novo Produto</DialogTitle>
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
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={productForm.category} onValueChange={(value) => setProductForm({...productForm, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
                  
                  <Button onClick={handleCreateProduct} disabled={uploadingFile}>
                    {uploadingFile ? 'Enviando...' : 'Criar Produto'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid gap-4">
            {products.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.code}</p>
                      <Badge variant="outline" className="mt-2">{product.category}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteProduct(product.id)}>
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
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Propaganda
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Propaganda</DialogTitle>
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
                  
                  <Button onClick={handleCreateAdvertisement} disabled={uploadingFile}>
                    Criar Propaganda
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
                      <Button variant="outline" size="sm">
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
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Veículo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Veículo</DialogTitle>
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
                  
                  <Button onClick={handleCreateVehicle}>
                    Criar Veículo
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}