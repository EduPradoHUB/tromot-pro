import * as React from 'react';
import { Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';

interface EditableContentProps {
  section: string;
  title?: string;
  subtitle?: string;
  description?: string;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  descriptionClassName?: string;
  onContentUpdate?: (content: { title?: string; subtitle?: string; description?: string }) => void;
}

export const EditableContent: React.FC<EditableContentProps> = ({
  section,
  title,
  subtitle,
  description,
  className = "",
  titleClassName = "",
  subtitleClassName = "",
  descriptionClassName = "",
  onContentUpdate
}) => {
  const { profile, updateEditableContent } = useApp();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(title || '');
  const [editSubtitle, setEditSubtitle] = React.useState(subtitle || '');
  const [editDescription, setEditDescription] = React.useState(description || '');
  const [loading, setLoading] = React.useState(false);

  const isAdmin = profile?.role === 'ADM';

  const handleSave = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const updated = await updateEditableContent(section, {
        title: editTitle,
        subtitle: editSubtitle,
        description: editDescription
      });
      
      if (updated) {
        onContentUpdate?.({ 
          title: editTitle, 
          subtitle: editSubtitle, 
          description: editDescription 
        });
        setIsEditing(false);
        toast({
          title: "Conteúdo atualizado!",
          description: "As alterações foram salvas com sucesso."
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(title || '');
    setEditSubtitle(subtitle || '');
    setEditDescription(description || '');
    setIsEditing(false);
  };

  if (!isAdmin) {
    return (
      <div className={className}>
        {title && <h1 className={titleClassName}>{title}{subtitle && <span className={subtitleClassName}>{subtitle}</span>}</h1>}
        {description && <p className={descriptionClassName}>{description}</p>}
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      {!isEditing && (
        <Button
          size="sm"
          variant="ghost"
          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm border"
          onClick={() => setIsEditing(true)}
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      )}
      
      {isEditing ? (
        <div className="space-y-4 p-4 bg-slate-800/95 backdrop-blur-sm border rounded-lg shadow-lg">
          <div>
            <label className="text-sm font-medium mb-2 block">Título</label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Título principal"
              className="text-black"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Subtítulo</label>
            <Input
              value={editSubtitle}
              onChange={(e) => setEditSubtitle(e.target.value)}
              placeholder="Subtítulo"
              className="text-black"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Descrição</label>
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Descrição"
              rows={3}
              className="text-black"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={loading}
            >
              <Save className="h-3 w-3 mr-1" />
              Salvar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCancel}
              disabled={loading}
              className="text-black hover:text-black"
            >
              <X className="h-3 w-3 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {title && (
            <h1 className={titleClassName}>
              {title}
              {subtitle && <span className={subtitleClassName}>{subtitle}</span>}
            </h1>
          )}
          {description && <p className={descriptionClassName}>{description}</p>}
        </div>
      )}
    </div>
  );
};