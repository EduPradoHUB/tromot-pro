import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';
import { parseFile, validateProductData, generateCSVTemplate, generateExcelTemplate } from '@/lib/csvUtils';

interface ParsedProduct {
  name: string;
  code: string;
  barcode_ean?: string;
  category: string;
  description?: string;
  image_url?: string;
  manual_url?: string;
  manual_type?: 'pdf' | 'image';
  video_url?: string;
  compatibility: string;
  isValid: boolean;
  errors: string[];
}

interface ImportResult {
  success: number;
  errors: number;
  created: number;
  updated: number;
  details: string[];
}

export const BulkProductUpload: React.FC = () => {
  const { createProduct, updateProduct, products, categories, createCategory } = useApp();
  const { toast } = useToast();
  
  const [file, setFile] = React.useState<File | null>(null);
  const [parsedData, setParsedData] = React.useState<ParsedProduct[]>([]);
  const [showPreview, setShowPreview] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [importProgress, setImportProgress] = React.useState(0);
  const [importMode, setImportMode] = React.useState<'create' | 'update_code' | 'update_ean'>('create');
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedExtensions = ['.csv', '.xlsx', '.xls'];
      const hasValidExtension = allowedExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));
      
      if (hasValidExtension) {
        setFile(selectedFile);
        parseFileData(selectedFile);
      } else {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo CSV ou Excel (.xlsx/.xls).",
          variant: "destructive"
        });
      }
    }
  };

  const parseFileData = async (file: File) => {
    try {
      const parsed = await parseFile(file);
      const validated = parsed.map(item => validateProductData(item));
      setParsedData(validated);
      setShowPreview(true);
    } catch (error) {
      toast({
        title: "Erro ao processar arquivo",
        description: "Não foi possível processar o arquivo.",
        variant: "destructive"
      });
    }
  };

  const downloadTemplate = () => {
    const csv = generateCSVTemplate();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_produtos_tromot.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadExcelTemplate = () => {
    generateExcelTemplate();
  };

  const handleImport = async () => {
    const validProducts = parsedData.filter(p => p.isValid);
    if (validProducts.length === 0) {
      toast({
        title: "Nenhum produto válido",
        description: "Corrija os erros antes de importar.",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);
    setImportProgress(0);
    
    const result: ImportResult = {
      success: 0,
      errors: 0,
      created: 0,
      updated: 0,
      details: []
    };

    // Criar categorias não existentes
    const existingCategories = categories.map(c => c.name);
    const newCategories = [...new Set(validProducts.map(p => p.category).filter(cat => !existingCategories.includes(cat)))];
    
    for (const categoryName of newCategories) {
      try {
        await createCategory({ name: categoryName, description: '', active: true });
        result.details.push(`Categoria criada: ${categoryName}`);
      } catch (error) {
        result.details.push(`Erro ao criar categoria ${categoryName}: ${error}`);
      }
    }

    for (let i = 0; i < validProducts.length; i++) {
      const product = validProducts[i];
      setImportProgress((i / validProducts.length) * 100);

      try {
        let compatibility;
        try {
          compatibility = JSON.parse(product.compatibility || '[]');
        } catch {
          compatibility = [];
        }

        const productData = {
          name: product.name,
          code: product.code,
          barcode_ean: product.barcode_ean || '',
          category: product.category,
          description: product.description || '',
          image_url: product.image_url || '',
          manual_url: product.manual_url || '',
          manual_type: product.manual_type || 'pdf',
          video_url: product.video_url || '',
          compatibility,
          status: 'active' as const
        };

        let shouldUpdate = false;
        let existingProduct = null;

        if (importMode === 'update_code') {
          existingProduct = products.find(p => p.code === product.code);
          shouldUpdate = !!existingProduct;
        } else if (importMode === 'update_ean' && product.barcode_ean) {
          existingProduct = products.find(p => p.barcode_ean === product.barcode_ean);
          shouldUpdate = !!existingProduct;
        }

        if (shouldUpdate && existingProduct) {
          await updateProduct(existingProduct.id, productData);
          result.updated++;
          result.details.push(`Produto atualizado: ${product.name} (${product.code})`);
        } else {
          await createProduct(productData);
          result.created++;
          result.details.push(`Produto criado: ${product.name} (${product.code})`);
        }

        result.success++;
      } catch (error) {
        result.errors++;
        result.details.push(`Erro no produto ${product.name} (${product.code}): ${error}`);
      }
    }

    setImportProgress(100);
    setImportResult(result);
    setImporting(false);
    setShowPreview(false);
    
    toast({
      title: "Importação concluída",
      description: `${result.success} produtos processados com sucesso, ${result.errors} erros.`,
      variant: result.errors === 0 ? "default" : "destructive"
    });
  };

  const getValidationIcon = (isValid: boolean, errors: string[]) => {
    if (isValid) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (errors.length > 0) return <XCircle className="h-4 w-4 text-red-500" />;
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload em Massa de Produtos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Template CSV
            </Button>
            
            <Button
              variant="outline"
              onClick={downloadExcelTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Template Excel
            </Button>
            
            <div className="flex-1">
              <Label htmlFor="csvFile">Arquivo CSV ou Excel</Label>
              <Input
                id="csvFile"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="mt-1"
              />
            </div>
          </div>

          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              Arquivo selecionado: {file.name}
            </div>
          )}

          {parsedData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {parsedData.length} produtos encontrados
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {parsedData.filter(p => p.isValid).length} válidos, {parsedData.filter(p => !p.isValid).length} com erros
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div>
                    <Label htmlFor="importMode">Modo de Importação</Label>
                    <Select value={importMode} onValueChange={(value: any) => setImportMode(value)}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="create">Apenas Criar Novos</SelectItem>
                        <SelectItem value="update_code">Atualizar por Código</SelectItem>
                        <SelectItem value="update_ean">Atualizar por EAN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={() => setShowPreview(true)}
                    variant="outline"
                  >
                    Visualizar Dados
                  </Button>
                  
                  <Button
                    onClick={handleImport}
                    disabled={parsedData.filter(p => p.isValid).length === 0 || importing}
                  >
                    {importing ? 'Importando...' : 'Importar Produtos'}
                  </Button>
                </div>
              </div>

              {importing && (
                <div className="space-y-2">
                  <Progress value={importProgress} />
                  <p className="text-sm text-muted-foreground">
                    Importando produtos... {Math.round(importProgress)}%
                  </p>
                </div>
              )}
            </div>
          )}

          {importResult && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-700">Resultado da Importação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                    <div className="text-sm text-muted-foreground">Sucessos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
                    <div className="text-sm text-muted-foreground">Erros</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{importResult.created}</div>
                    <div className="text-sm text-muted-foreground">Criados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{importResult.updated}</div>
                    <div className="text-sm text-muted-foreground">Atualizados</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setImportResult(null)}
                  className="w-full"
                >
                  Fechar Relatório
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview dos Dados</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>EAN</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Erros</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {getValidationIcon(product.isValid, product.errors)}
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.code}</TableCell>
                      <TableCell>{product.barcode_ean || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {product.errors.length > 0 && (
                          <div className="text-sm text-red-600">
                            {product.errors.join(', ')}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Fechar
            </Button>
            <Button onClick={() => setShowPreview(false)}>
              Prosseguir com Importação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};