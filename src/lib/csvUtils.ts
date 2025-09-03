import * as XLSX from 'xlsx';

interface ProductCSVRow {
  nome: string;
  codigo: string;
  ean?: string;
  categoria: string;
  descricao?: string;
  imagem_url?: string;
  manual_url?: string;
  tipo_manual?: string;
  video_url?: string;
  compatibilidade?: string;
}

export const parseFile = async (file: File): Promise<ProductCSVRow[]> => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    return parseExcel(file);
  } else {
    const csvText = await file.text();
    return parseCSV(csvText);
  }
};

export const parseCSV = (csvText: string): ProductCSVRow[] => {
  const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows: ProductCSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: any = {};

    headers.forEach((header, index) => {
      const normalizedHeader = normalizeHeader(header);
      row[normalizedHeader] = values[index]?.trim().replace(/"/g, '') || '';
    });

    if (row.nome && row.codigo) {
      rows.push(row);
    }
  }

  return rows;
};

const parseExcel = async (file: File): Promise<ProductCSVRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          resolve([]);
          return;
        }
        
        const headers = (jsonData[0] as string[]).map(h => String(h || '').trim());
        const rows: ProductCSVRow[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const values = jsonData[i] as any[];
          const row: any = {};
          
          headers.forEach((header, index) => {
            const normalizedHeader = normalizeHeader(header);
            row[normalizedHeader] = String(values[index] || '').trim();
          });
          
          if (row.nome && row.codigo) {
            rows.push(row);
          }
        }
        
        resolve(rows);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
};

const normalizeHeader = (header: string): string => {
  const mapping: Record<string, string> = {
    'nome': 'nome',
    'name': 'nome',
    'produto': 'nome',
    'codigo': 'codigo',
    'code': 'codigo',
    'ean': 'ean',
    'barcode': 'ean',
    'codigo_barras': 'ean',
    'categoria': 'categoria',
    'category': 'categoria',
    'descricao': 'descricao',
    'description': 'descricao',
    'imagem': 'imagem_url',
    'imagem_url': 'imagem_url',
    'image': 'imagem_url',
    'image_url': 'imagem_url',
    'manual': 'manual_url',
    'manual_url': 'manual_url',
    'tipo_manual': 'tipo_manual',
    'manual_type': 'tipo_manual',
    'video': 'video_url',
    'video_url': 'video_url',
    'compatibilidade': 'compatibilidade',
    'compatibility': 'compatibilidade',
    'veiculos': 'compatibilidade'
  };

  const normalized = header.toLowerCase().replace(/\s+/g, '_');
  return mapping[normalized] || normalized;
};

export const validateProductData = (product: ProductCSVRow) => {
  const errors: string[] = [];
  
  if (!product.nome || product.nome.trim().length === 0) {
    errors.push('Nome é obrigatório');
  }
  
  if (!product.codigo || product.codigo.trim().length === 0) {
    errors.push('Código é obrigatório');
  }
  
  if (!product.categoria || product.categoria.trim().length === 0) {
    errors.push('Categoria é obrigatória');
  }

  if (product.tipo_manual && !['pdf', 'image'].includes(product.tipo_manual.toLowerCase())) {
    errors.push('Tipo de manual deve ser "pdf" ou "image"');
  }

  if (product.imagem_url && !isValidUrl(product.imagem_url)) {
    errors.push('URL da imagem inválida');
  }

  if (product.manual_url && !isValidUrl(product.manual_url)) {
    errors.push('URL do manual inválida');
  }

  if (product.video_url && !isValidUrl(product.video_url)) {
    errors.push('URL do vídeo inválida');
  }

  if (product.compatibilidade) {
    try {
      JSON.parse(product.compatibilidade);
    } catch {
      errors.push('Formato de compatibilidade inválido (deve ser JSON válido)');
    }
  }

  return {
    name: product.nome?.trim() || '',
    code: product.codigo?.trim() || '',
    barcode_ean: product.ean?.trim() || '',
    category: product.categoria?.trim() || '',
    description: product.descricao?.trim() || '',
    image_url: product.imagem_url?.trim() || '',
    manual_url: product.manual_url?.trim() || '',
    manual_type: (product.tipo_manual?.toLowerCase() === 'image' ? 'image' : 'pdf') as 'pdf' | 'image',
    video_url: product.video_url?.trim() || '',
    compatibility: product.compatibilidade?.trim() || '[]',
    isValid: errors.length === 0,
    errors
  };
};

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const generateCSVTemplate = (): string => {
  const headers = [
    'nome',
    'codigo', 
    'ean',
    'categoria',
    'descricao',
    'imagem_url',
    'manual_url',
    'tipo_manual',
    'video_url',
    'compatibilidade'
  ];

  const exampleRows = [
    [
      'Kit Trava Elétrica Universal',
      'TE-001',
      '7894567890123',
      'Travas Elétricas',
      'Kit completo de trava elétrica para veículos universais',
      'https://exemplo.com/imagem1.jpg',
      'https://exemplo.com/manual1.pdf',
      'pdf',
      'https://www.youtube.com/watch?v=exemplo1',
      '[{"brand":"Volkswagen","model":"Gol","years":["2019","2020","2021"]}]'
    ],
    [
      'Alarme Automotivo Premium',
      'AL-002',
      '7894567890124', 
      'Alarmes',
      'Alarme automotivo com controle remoto',
      'https://exemplo.com/imagem2.jpg',
      'https://exemplo.com/manual2.pdf',
      'pdf',
      '',
      '[{"brand":"Fiat","model":"Uno","years":["2018","2019"]}]'
    ]
  ];

  let csv = headers.join(',') + '\n';
  
  exampleRows.forEach(row => {
    const escapedRow = row.map(cell => {
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    });
    csv += escapedRow.join(',') + '\n';
  });

  return csv;
};

export const generateExcelTemplate = (): void => {
  const headers = [
    'nome',
    'codigo', 
    'ean',
    'categoria',
    'descricao',
    'imagem_url',
    'manual_url',
    'tipo_manual',
    'video_url',
    'compatibilidade'
  ];

  const exampleRows = [
    [
      'Kit Trava Elétrica Universal',
      'TE-001',
      '7894567890123',
      'Travas Elétricas',
      'Kit completo de trava elétrica para veículos universais',
      'https://exemplo.com/imagem1.jpg',
      'https://exemplo.com/manual1.pdf',
      'pdf',
      'https://www.youtube.com/watch?v=exemplo1',
      '[{"brand":"Volkswagen","model":"Gol","years":["2019","2020","2021"]}]'
    ],
    [
      'Alarme Automotivo Premium',
      'AL-002',
      '7894567890124', 
      'Alarmes',
      'Alarme automotivo com controle remoto',
      'https://exemplo.com/imagem2.jpg',
      'https://exemplo.com/manual2.pdf',
      'pdf',
      '',
      '[{"brand":"Fiat","model":"Uno","years":["2018","2019"]}]'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
  
  // Auto-fit columns
  const colWidths = headers.map((_, i) => {
    const maxLength = Math.max(
      headers[i].length,
      ...exampleRows.map(row => String(row[i] || '').length)
    );
    return { width: Math.min(Math.max(maxLength + 2, 10), 50) };
  });
  ws['!cols'] = colWidths;
  
  XLSX.writeFile(wb, 'template-produtos.xlsx');
};