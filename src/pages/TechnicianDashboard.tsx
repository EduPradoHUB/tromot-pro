import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
// Removed Select imports to avoid React hooks conflicts
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { BulkProductUpload } from '@/components/BulkProductUpload';
import { PostModeration } from '@/components/PostModeration';
// Replaced Dialog imports with custom implementation to avoid React hooks conflicts
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/CustomDialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export default function TechnicianDashboard() {
  const { 
    profile, 
    products, 
    categories,
    createProduct, 
    updateProduct, 
    deleteProduct,
    createCategory,
    updateCategory,
    deleteCategory,
    uploadFile
  } = useApp();
  
  const { toast } = useToast();
  
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
    compatibility: '[]'
  });
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    active: true
  });
  
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<'product' | 'category' | null>(null);

  const openDialog = (type: 'product' | 'category') => {
    setDialogContent(type);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogContent(null);
    setDialogOpen(false);
    setEditingProduct(null);
    setEditingCategory(null);
  };

// Verificar se o usuário é ADM, Técnico Tromot ou Suporte Tromot
  if (!profile || !(['ADM', 'Técnico Tromot', 'Suporte Tromot'] as const).includes(profile.role as any)) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Acesso restrito para técnicos, suporte e administradores.</p>
      </div>
    );
  }

  const handleCreateProduct = async () => {
    console.log('[TechnicianDashboard] handleCreateProduct called', productForm);
    if (!productForm.name || !productForm.code || !productForm.category) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha Nome, Código e Categoria.",
        variant: "destructive"
      });
      return;
    }
    if (productForm.barcode_ean && !/^\d{13}$/.test(productForm.barcode_ean)) {
      toast({
        title: "EAN-13 inválido",
        description: "O EAN-13 deve conter exatamente 13 dígitos.",
        variant: "destructive"
      });
      return;
    }

    try {
      const compatibility = productForm.compatibility?.trim()
        ? JSON.parse(productForm.compatibility)
        : [];
      const created = await createProduct({
        ...productForm,
        barcode_ean: productForm.barcode_ean || null,
        compatibility
      });
      console.log('[TechnicianDashboard] product created', created);
      
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
        compatibility: '[]'
      });
      
      setDialogOpen(false);
      
      toast({
        title: "Produto criado",
        description: "Produto adicionado com sucesso!"
      });
    } catch (error: any) {
      console.error('[TechnicianDashboard] createProduct error', error);
      toast({
        title: "Erro",
        description: error?.message || "Falha ao criar produto.",
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
      compatibility: JSON.stringify(product.compatibility || [])
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
        compatibility: '[]'
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

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Técnico</h1>
        <p className="text-muted-foreground">Gerencie produtos e categorias</p>
        {/* Debug: Mostrar papel do usuário */}
        <p className="text-xs text-muted-foreground mt-2">
          Usuário: {profile?.name} | Papel: {profile?.role}
        </p>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="bulk-upload">Upload em Massa</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
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
                  compatibility: '[]'
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Produto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome*</Label>
                    <Input
                      id="name"
                      value={productForm.name}
                      onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome do produto"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="code">Código*</Label>
                    <Input
                      id="code"
                      value={productForm.code}
                      onChange={(e) => setProductForm(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="Código do produto"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="barcode_ean">EAN-13</Label>
                    <Input
                      id="barcode_ean"
                      value={productForm.barcode_ean}
                      onChange={(e) => setProductForm(prev => ({ ...prev, barcode_ean: e.target.value }))}
                      placeholder="1234567890123"
                      maxLength={13}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria*</Label>
                    <select 
                      value={productForm.category} 
                      onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={productForm.description}
                      onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição do produto"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="image_url">URL da Imagem</Label>
                    <Input
                      id="image_url"
                      value={productForm.image_url}
                      onChange={(e) => setProductForm(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="manual_url">URL do Manual</Label>
                    <Input
                      id="manual_url"
                      value={productForm.manual_url}
                      onChange={(e) => setProductForm(prev => ({ ...prev, manual_url: e.target.value }))}
                      placeholder="https://exemplo.com/manual.pdf"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="manual_type">Tipo do Manual</Label>
                    <select 
                      value={productForm.manual_type} 
                      onChange={(e) => setProductForm(prev => ({ ...prev, manual_type: e.target.value as 'pdf' | 'image' }))}
                      className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="pdf">PDF</option>
                      <option value="image">Imagem</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="video_url">URL do Vídeo</Label>
                    <Input
                      id="video_url"
                      value={productForm.video_url}
                      onChange={(e) => setProductForm(prev => ({ ...prev, video_url: e.target.value }))}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                  
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="compatibility">Compatibilidade (JSON)</Label>
                    <Textarea
                      id="compatibility"
                      value={productForm.compatibility}
                      onChange={(e) => setProductForm(prev => ({ ...prev, compatibility: e.target.value }))}
                      placeholder='[{"brand": "Toyota", "model": "Corolla", "years": [2020, 2021]}]'
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={editingProduct ? handleUpdateProduct : handleCreateProduct}>
                    {editingProduct ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id}>
                <CardHeader>
                  <CardTitle className="text-sm">{product.name}</CardTitle>
                  <Badge variant="outline">{product.code}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>Categoria:</strong> {product.category}</p>
                    <p><strong>EAN-13:</strong> {product.barcode_ean || 'N/A'}</p>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        handleEditProduct(product);
                        setDialogOpen(true);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteProduct(product.id)}>
                        <Trash2 className="h-4 w-4" />
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

        {/* Moderation Tab */}
        <TabsContent value="moderation" className="space-y-6">
          <PostModeration />
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
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Categoria
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cat-name">Nome*</Label>
                    <Input
                      id="cat-name"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome da categoria"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cat-description">Descrição</Label>
                    <Textarea
                      id="cat-description"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição da categoria"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="cat-active"
                      checked={categoryForm.active}
                      onCheckedChange={(checked) => setCategoryForm(prev => ({ ...prev, active: checked }))}
                    />
                    <Label htmlFor="cat-active">Categoria ativa</Label>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}>
                    {editingCategory ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm">{category.name}</CardTitle>
                    <Badge variant={category.active ? "default" : "secondary"}>
                      {category.active ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">{category.description || 'Sem descrição'}</p>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        handleEditCategory(category);
                        setDialogOpen(true);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteCategory(category.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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