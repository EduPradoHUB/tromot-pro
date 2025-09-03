import React, { useState, useRef } from 'react';
import { Camera, X, Upload, Image } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PostUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
}

export function PostUploadModal({ isOpen, onClose, productId }: PostUploadModalProps) {
  const { uploadFile, currentUser } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    caption: '',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleYear: ''
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Erro",
          description: "Por favor, selecione apenas arquivos de imagem.",
          variant: "destructive",
        });
      }
    }
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const openGallery = () => {
    galleryInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile || !formData.caption.trim() || !formData.vehicleBrand.trim() || 
        !formData.vehicleModel.trim() || !formData.vehicleYear.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos e selecione uma foto.",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para compartilhar uma instalação.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Upload da imagem
      const fileName = `${Date.now()}_${imageFile.name}`;
      const imageUrl = await uploadFile('posts', fileName, imageFile);

      // Criar o post no Supabase
      const { data, error } = await supabase
        .from('posts')
        .insert({
          product_id: productId,
          author_id: currentUser.id,
          photo_url: imageUrl,
          caption: `${formData.caption}\n\nVeículo: ${formData.vehicleBrand} ${formData.vehicleModel} ${formData.vehicleYear}`,
          status: 'pending'
        })
        .select()
        .single();

      if (!error) {
        toast({
          title: "Sucesso!",
          description: "Sua instalação foi enviada para análise. Aguarde a aprovação do administrador.",
        });
        
        // Atualizar dados após criação bem-sucedida
        window.location.reload();
        
        onClose();
        resetForm();
      } else {
        throw new Error(error.message || 'Erro ao criar post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar sua instalação. Tente novamente.",
        variant: "destructive",
      });
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
    setImageFile(null);
    setImagePreview(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Compartilhar Instalação
          </DialogTitle>
          <DialogDescription>
            Compartilhe sua experiência de instalação com a comunidade
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload de Foto */}
          <div className="space-y-2">
            <Label>Foto da Instalação *</Label>
            {!imagePreview ? (
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
                
                {/* Hidden inputs */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
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
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Compartilhar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}