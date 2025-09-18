import React, { useState, useRef } from 'react';
import { Camera, X, Upload, Image, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';

interface PostUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
}

interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

export function PostUploadModal({ isOpen, onClose, productId }: PostUploadModalProps) {
  const { uploadFile, currentUser } = useApp();
  const [loading, setLoading] = React.useState(false);
  const [imageFiles, setImageFiles] = React.useState<ImageFile[]>([]);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);
  const maxImages = 10;
  
  const [formData, setFormData] = React.useState({
    caption: '',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleYear: ''
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      // Verificar se já temos o máximo de imagens
      if (imageFiles.length >= maxImages) {
        console.error(`Máximo de ${maxImages} fotos permitido`);
        return;
      }

      // Validação de tipo de arquivo
      if (!file.type.startsWith('image/')) {
        console.error("Tipo de arquivo inválido. Por favor, selecione apenas arquivos de imagem.");
        return;
      }

      // Validação de tamanho
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        console.error("Arquivo muito grande. A imagem deve ter no máximo 10MB.");
        return;
      }

      // Aviso para formatos problemáticos
      if (file.type === 'image/heic' || file.type === 'image/heif') {
        console.warn("Imagens HEIC podem ter problemas. Considere converter para JPG.");
      }

      console.log('📷 Imagem selecionada:', { name: file.name, size: file.size, type: file.type });

      const id = Math.random().toString(36).substr(2, 9);
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImageFile: ImageFile = {
          file,
          preview: e.target?.result as string,
          id
        };

        setImageFiles(prev => [...prev, newImageFile]);
      };
      reader.readAsDataURL(file);
    });

    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
  };

  const removeImage = (id: string) => {
    setImageFiles(prev => prev.filter(img => img.id !== id));
  };

  const openCamera = () => {
    if (imageFiles.length >= maxImages) {
      console.error(`Máximo de ${maxImages} fotos permitido`);
      return;
    }
    cameraInputRef.current?.click();
  };

  const openGallery = () => {
    if (imageFiles.length >= maxImages) {
      console.error(`Máximo de ${maxImages} fotos permitido`);
      return;
    }
    galleryInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (imageFiles.length === 0 || !formData.caption.trim() || !formData.vehicleBrand.trim() || 
        !formData.vehicleModel.trim() || !formData.vehicleYear.trim()) {
      console.error("Campos obrigatórios. Por favor, preencha todos os campos e selecione pelo menos uma foto.");
      return;
    }

    if (!currentUser) {
      console.error("Erro. Você precisa estar logado para compartilhar uma instalação.");
      return;
    }

    setLoading(true);

    try {
      console.log('🔄 Iniciando upload de post:', { 
        productId, 
        userId: currentUser.id, 
        imagesCount: imageFiles.length
      });

      // Upload de todas as imagens
      const uploadPromises = imageFiles.map(async (imageFile) => {
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${imageFile.file.name}`;
        return await uploadFile('posts', fileName, imageFile.file);
      });

      const imageUrls = await Promise.all(uploadPromises);

      console.log('✅ Upload de imagens concluído:', imageUrls);

      // Criar o post no Supabase com múltiplas fotos
      const postData = {
        product_id: productId,
        author_id: currentUser.id,
        photo_url: imageUrls[0], // Primeira imagem para compatibilidade
        photos_urls: imageUrls, // Todas as imagens
        caption: `${formData.caption}\n\nVeículo: ${formData.vehicleBrand} ${formData.vehicleModel} ${formData.vehicleYear}`,
        status: 'pending' as const
      };

      console.log('🔄 Criando post com dados:', postData);

      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar post:', error);
        throw new Error(error.message || 'Erro ao criar post');
      }

      console.log('✅ Post criado com sucesso:', data);

      console.log("Sucesso! Sua instalação foi enviada para análise. Aguarde a aprovação do administrador.");
      
      // Atualizar dados após criação bem-sucedida
      window.location.reload();
      
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('❌ Erro completo no upload de post:', error);
      
      let errorMessage = "Não foi possível enviar sua instalação. Tente novamente.";
      
      if (error.message?.includes('row-level security')) {
        errorMessage = "Erro de permissão. Verifique se você está logado corretamente.";
      } else if (error.message?.includes('Arquivo muito grande')) {
        errorMessage = error.message;
      } else if (error.message?.includes('upload')) {
        errorMessage = "Falha no upload da imagem. Verifique sua conexão e tente novamente.";
      }

      console.error("Erro: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      caption: '',
      vehicleBrand: '',
      vehicleModel: '',
      vehicleYear: ''
    });
    setImageFiles([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={handleClose}
          />
          <div className="relative bg-background rounded-2xl shadow-lg border max-w-md mx-4 w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Compartilhar Instalação</h2>
              </div>
              <p className="text-muted-foreground mb-6 text-sm">
                Compartilhe sua experiência de instalação com a comunidade (até {maxImages} fotos)
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Upload de Fotos */}
                <div className="space-y-2">
                  <Label>Fotos da Instalação * ({imageFiles.length}/{maxImages})</Label>
                  
                  {/* Grid de previews das imagens */}
                  {imageFiles.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {imageFiles.map((imageFile) => (
                        <div key={imageFile.id} className="relative aspect-square">
                          <img
                            src={imageFile.preview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={() => removeImage(imageFile.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      
                      {/* Botão para adicionar mais fotos */}
                      {imageFiles.length < maxImages && (
                        <div 
                          className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                          onClick={openGallery}
                        >
                          <Plus className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Botões de upload inicial */}
                  {imageFiles.length === 0 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-24 flex flex-col gap-2"
                          onClick={openCamera}
                        >
                          <Camera className="h-6 w-6" />
                          <span className="text-sm">Usar Câmera</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-24 flex flex-col gap-2"
                          onClick={openGallery}
                        >
                          <Image className="h-6 w-6" />
                          <span className="text-sm">Da Galeria</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Inputs ocultos */}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handleImageChange}
                  />
                  <input
                    ref={galleryInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                  />
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                  <Label htmlFor="caption">Descrição da Instalação *</Label>
                  <Textarea
                    id="caption"
                    placeholder="Descreva como foi a instalação, dificuldades encontradas, dicas importantes..."
                    value={formData.caption}
                    onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                    className="min-h-[80px]"
                  />
                </div>

                {/* Dados do Veículo */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleBrand">Marca *</Label>
                    <Input
                      id="vehicleBrand"
                      placeholder="Ex: Honda"
                      value={formData.vehicleBrand}
                      onChange={(e) => setFormData({ ...formData, vehicleBrand: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleModel">Modelo *</Label>
                    <Input
                      id="vehicleModel"
                      placeholder="Ex: Civic"
                      value={formData.vehicleModel}
                      onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleYear">Ano *</Label>
                  <Input
                    id="vehicleYear"
                    placeholder="Ex: 2023"
                    value={formData.vehicleYear}
                    onChange={(e) => setFormData({ ...formData, vehicleYear: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleClose}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={loading || imageFiles.length === 0}
                  >
                    {loading ? 'Enviando...' : 'Compartilhar'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}