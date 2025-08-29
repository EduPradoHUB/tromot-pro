import { User, Vehicle, Product, Post, Rating, Banner, Question, Advertisement, AdStats } from './types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@tromot.com',
    phone: '(16) 99999-0001',
    role: 'ADM',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@tromot.com',
    phone: '(16) 99999-0002',
    role: 'Técnico Tromot',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c2c4?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '3',
    name: 'Carlos Mendes',
    email: 'carlos@email.com',
    phone: '(16) 99999-0003',
    role: 'Cliente',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  }
];

export const mockVehicles: Vehicle[] = [
  { id: '1', brand: 'Toyota', model: 'Corolla', years: ['2018', '2019', '2020', '2021', '2022', '2023', '2024'] },
  { id: '2', brand: 'Toyota', model: 'Hilux', years: ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'] },
  { id: '3', brand: 'Ford', model: 'Ka', years: ['2018', '2019', '2020', '2021', '2022', '2023', '2024'] },
  { id: '4', brand: 'Ford', model: 'Ranger', years: ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'] },
  { id: '5', brand: 'Volkswagen', model: 'Gol', years: ['2017', '2018', '2019', '2020', '2021', '2022', '2023'] },
  { id: '6', brand: 'Volkswagen', model: 'Amarok', years: ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'] },
  { id: '7', brand: 'Chevrolet', model: 'Onix', years: ['2019', '2020', '2021', '2022', '2023', '2024'] },
  { id: '8', brand: 'Chevrolet', model: 'S10', years: ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'] },
  { id: '9', brand: 'Honda', model: 'Civic', years: ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'] },
  { id: '10', brand: 'Honda', model: 'HR-V', years: ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'] }
];

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Módulo de Vidro Elétrico Universal',
    code: 'MVE-001',
    category: 'Vidros Elétricos',
    compatibility: [mockVehicles[0], mockVehicles[2], mockVehicles[4]],
    manual_url: '/manuals/mve-001.pdf',
    manual_type: 'pdf',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    rating_average: 4.5,
    rating_count: 23,
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    description: 'Módulo universal para automação de vidros elétricos com função antiesmagamento.',
    status: 'active'
  },
  {
    id: '2',
    name: 'Central de Alarme Premium',
    code: 'CAP-200',
    category: 'Alarmes',
    compatibility: [mockVehicles[1], mockVehicles[3], mockVehicles[5]],
    manual_url: '/manuals/cap-200.jpg',
    manual_type: 'image',
    rating_average: 4.8,
    rating_count: 45,
    image_url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop',
    description: 'Central de alarme com 8 zonas, sensor de presença e controle via smartphone.',
    status: 'active'
  },
  {
    id: '3',
    name: 'Kit Travas Elétricas 4 Portas',
    code: 'KTE-400',
    category: 'Travas Elétricas',
    compatibility: [mockVehicles[6], mockVehicles[8]],
    manual_url: '/manuals/kte-400.pdf',
    manual_type: 'pdf',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    rating_average: 4.2,
    rating_count: 67,
    image_url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop',
    description: 'Kit completo com atuadores lineares e central para 4 portas.',
    status: 'active'
  },
  {
    id: '4',
    name: 'Sensor de Ré com Display',
    code: 'SRD-100',
    category: 'Sensores',
    compatibility: [mockVehicles[7], mockVehicles[9]],
    manual_url: '/manuals/srd-100.pdf',
    manual_type: 'pdf',
    rating_average: 4.7,
    rating_count: 34,
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    description: 'Sistema de sensor de ré com 4 sensores e display digital.',
    status: 'active'
  },
  {
    id: '5',
    name: 'Interface de Volante Universal',
    code: 'IVU-300',
    category: 'Interfaces',
    compatibility: [mockVehicles[1], mockVehicles[4], mockVehicles[8]],
    manual_url: '/manuals/ivu-300.pdf',
    manual_type: 'pdf',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    rating_average: 4.3,
    rating_count: 56,
    image_url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop',
    description: 'Interface para manter comandos originais do volante em multimídia aftermarket.',
    status: 'active'
  },
  {
    id: '6',
    name: 'Chicote T Toyota/Lexus',
    code: 'CTL-500',
    category: 'Chicotes',
    compatibility: [mockVehicles[0], mockVehicles[1]],
    manual_url: '/manuals/ctl-500.jpg',
    manual_type: 'image',
    rating_average: 4.9,
    rating_count: 89,
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    description: 'Chicote plug-and-play para instalação de multimídia em Toyota e Lexus.',
    status: 'active'
  }
];

export const mockPosts: Post[] = [
  {
    id: '1',
    product_id: '1',
    author_id: '3',
    author_name: 'Carlos Mendes',
    author_role: 'Cliente',
    photo_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
    caption: 'Instalação perfeita no meu Corolla 2020. Funcionamento impecável!',
    likes_count: 12,
    created_at: '2024-08-28T10:30:00Z',
    status: 'approved'
  },
  {
    id: '2',
    product_id: '2',
    author_id: '2',
    author_name: 'Maria Santos',
    author_role: 'Técnico Tromot',
    photo_url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop',
    caption: 'Instalação técnica demonstrando a conexão correta dos fios.',
    likes_count: 25,
    created_at: '2024-08-27T15:45:00Z',
    status: 'approved'
  },
  {
    id: '3',
    product_id: '1',
    author_id: '3',
    author_name: 'Roberto Costa',
    author_role: 'Cliente',
    photo_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
    caption: 'Muito fácil de instalar seguindo o manual. Recomendo!',
    likes_count: 8,
    created_at: '2024-08-26T09:15:00Z',
    status: 'approved'
  }
];

export const mockRatings: Rating[] = [
  {
    id: '1',
    product_id: '1',
    author_id: '3',
    author_name: 'Carlos Mendes',
    rating: 5,
    comment: 'Produto excelente, instalação fácil e funcionamento perfeito.',
    created_at: '2024-08-28T10:35:00Z'
  },
  {
    id: '2',
    product_id: '2',
    author_id: '3',
    author_name: 'Ana Paula',
    rating: 5,
    comment: 'Melhor central de alarme que já usei. Recomendo!',
    created_at: '2024-08-27T14:20:00Z'
  },
  {
    id: '3',
    product_id: '1',
    author_id: '3',
    author_name: 'Roberto Costa',
    rating: 4,
    comment: 'Bom produto, mas poderia ter mais opções de configuração.',
    created_at: '2024-08-26T16:45:00Z'
  }
];

export const mockBanners: Banner[] = [
  {
    id: '1',
    title: 'Novos Módulos de Vidro Elétrico',
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=1000&fit=crop',
    link: '/produto/1',
    active: true,
    created_at: '2024-08-20T00:00:00Z'
  },
  {
    id: '2',
    title: 'Centrais de Alarme Premium',
    image_url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=1000&fit=crop',
    link: '/produto/2',
    active: true,
    created_at: '2024-08-18T00:00:00Z'
  }
];

export const categories = [
  'Todos',
  'Vidros Elétricos',
  'Alarmes',
  'Travas Elétricas',
  'Sensores',
  'Interfaces',
  'Chicotes'
];

export const mockQuestions: Question[] = [
  {
    id: 'q1',
    product_id: '1',
    author_id: '3',
    author_name: 'João Silva',
    question: 'Qual a melhor posição para instalar esta proteção de cárter?',
    answer: 'A proteção deve ser instalada na parte inferior do motor, seguindo os pontos de fixação originais do veículo.',
    answer_by: 'Maria Santos',
    created_at: '2024-08-25T14:30:00Z',
    answered_at: '2024-08-25T15:45:00Z',
  },
  {
    id: 'q2',
    product_id: '2',
    author_id: '3',
    author_name: 'Carlos Mendes',
    question: 'É necessário alguma ferramenta especial para a instalação?',
    created_at: '2024-08-28T10:15:00Z',
  },
  {
    id: 'q3',
    product_id: '3',
    author_id: '3',
    author_name: 'Ana Costa',
    question: 'O kit funciona em carros com trava original?',
    answer: 'Sim, o kit é compatível com travas originais e pode ser integrado ao sistema existente.',
    answer_by: 'Maria Santos',
    created_at: '2024-08-24T16:20:00Z',
    answered_at: '2024-08-24T17:30:00Z',
  },
];

export const brands = ['Todos', ...Array.from(new Set(mockVehicles.map(v => v.brand)))];

export const mockAdvertisements: Advertisement[] = [
  {
    id: 'ad1',
    advertiser: 'AutoPeças Brasil',
    slot: 'home_hero',
    creative_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=320&h=400&fit=crop',
    creative_aspect_ratio: '4:5',
    target_url: 'https://autopecas.com.br',
    start_date: '2024-08-01T00:00:00Z',
    end_date: '2024-09-30T23:59:59Z',
    daily_cap: 1000,
    status: 'active',
    impressions_count: 15420,
    clicks_count: 312,
    created_at: '2024-07-25T00:00:00Z'
  },
  {
    id: 'ad2',
    advertiser: 'Som & Acessórios',
    slot: 'product_banner',
    creative_url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=640&h=360&fit=crop',
    creative_aspect_ratio: '16:9',
    target_url: 'https://somacessorios.com.br',
    start_date: '2024-08-15T00:00:00Z',
    end_date: '2024-09-15T23:59:59Z',
    daily_cap: 500,
    status: 'active',
    impressions_count: 8750,
    clicks_count: 175,
    created_at: '2024-08-10T00:00:00Z'
  },
  {
    id: 'ad3',
    advertiser: 'ElectroMobile',
    slot: 'feed_sponsored',
    creative_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
    creative_aspect_ratio: '4:5',
    target_url: 'https://electromobile.com.br',
    start_date: '2024-08-20T00:00:00Z',
    end_date: '2024-10-20T23:59:59Z',
    daily_cap: 800,
    status: 'active',
    impressions_count: 5230,
    clicks_count: 94,
    created_at: '2024-08-18T00:00:00Z'
  }
];

export const mockAdStats: AdStats[] = [
  { ad_id: 'ad1', impressions: 1200, clicks: 25, ctr: 2.08, date: '2024-08-29' },
  { ad_id: 'ad1', impressions: 1150, clicks: 23, ctr: 2.00, date: '2024-08-28' },
  { ad_id: 'ad1', impressions: 1300, clicks: 28, ctr: 2.15, date: '2024-08-27' },
  { ad_id: 'ad2', impressions: 650, clicks: 12, ctr: 1.85, date: '2024-08-29' },
  { ad_id: 'ad2', impressions: 700, clicks: 15, ctr: 2.14, date: '2024-08-28' },
  { ad_id: 'ad2', impressions: 580, clicks: 9, ctr: 1.55, date: '2024-08-27' },
  { ad_id: 'ad3', impressions: 420, clicks: 6, ctr: 1.43, date: '2024-08-29' },
  { ad_id: 'ad3', impressions: 380, clicks: 4, ctr: 1.05, date: '2024-08-28' },
  { ad_id: 'ad3', impressions: 450, clicks: 8, ctr: 1.78, date: '2024-08-27' },
];