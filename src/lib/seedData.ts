import { WorkspaceData } from '../types/finance';

/**
 * Retorna o banco de dados completamente ZERADO para o casal começar do absoluto zero.
 * Apenas as categorias essenciais de receitas e despesas são fornecidas como base limpa.
 */
export function getInitialSeedData(): WorkspaceData {
  return {
    updatedAt: new Date().toISOString(),
    members: [
      {
        id: 'member-me',
        name: 'Membro 1',
        role: 'me',
        avatarColor: '#2563EB',
        email: '',
        isRegistered: false,
      },
      {
        id: 'member-partner',
        name: 'Membro 2',
        role: 'partner',
        avatarColor: '#EC4899',
        email: '',
        isRegistered: false,
      },
    ],
    accounts: [],
    cards: [],
    invoicePayments: [],
    transactions: [],
    budgets: [],
    goals: [],
    approvals: [],
    tags: [
      { id: 'tag-essencial', name: 'Essencial', color: '#10B981' },
      { id: 'tag-casa', name: 'Casa', color: '#2563EB' },
      { id: 'tag-lazer', name: 'Lazer', color: '#EC4899' },
    ],
    categories: [
      // Categorias de Despesas Base
      { id: 'cat-moradia', name: 'Moradia & Casa', type: 'expense', icon: 'Home', color: '#2563EB', parentId: null },
      { id: 'cat-alimentacao', name: 'Alimentação', type: 'expense', icon: 'Utensils', color: '#F97316', parentId: null },
      { id: 'cat-transporte', name: 'Transporte', type: 'expense', icon: 'Car', color: '#06B6D4', parentId: null },
      { id: 'cat-lazer', name: 'Lazer & Encontros', type: 'expense', icon: 'Heart', color: '#EC4899', parentId: null },
      { id: 'cat-saude', name: 'Saúde & Cuidados', type: 'expense', icon: 'HeartPulse', color: '#F43F5E', parentId: null },
      { id: 'cat-compras', name: 'Compras & Estilo', type: 'expense', icon: 'ShoppingBag', color: '#8B5CF6', parentId: null },
      { id: 'cat-assinaturas', name: 'Assinaturas', type: 'expense', icon: 'Tv', color: '#3B82F6', parentId: null },
      { id: 'cat-educacao', name: 'Educação', type: 'expense', icon: 'GraduationCap', color: '#10B981', parentId: null },

      // Subcategorias
      { id: 'sub-mercado', name: 'Supermercado', type: 'expense', icon: 'ShoppingCart', color: '#F97316', parentId: 'cat-alimentacao' },
      { id: 'sub-delivery', name: 'Delivery / Restaurante', type: 'expense', icon: 'Pizza', color: '#F97316', parentId: 'cat-alimentacao' },
      { id: 'sub-aluguel', name: 'Aluguel / Condomínio', type: 'expense', icon: 'Key', color: '#2563EB', parentId: 'cat-moradia' },
      { id: 'sub-contas', name: 'Energia / Água / Internet', type: 'expense', icon: 'Lightbulb', color: '#2563EB', parentId: 'cat-moradia' },

      // Categorias de Receitas Base
      { id: 'cat-salario', name: 'Salário', type: 'income', icon: 'Briefcase', color: '#10B981', parentId: null },
      { id: 'cat-extra', name: 'Renda Extra / Freelance', type: 'income', icon: 'Laptop', color: '#06B6D4', parentId: null },
      { id: 'cat-rendimentos', name: 'Rendimentos', type: 'income', icon: 'TrendingUp', color: '#8B5CF6', parentId: null },
      { id: 'cat-outros', name: 'Outras Entradas', type: 'income', icon: 'HandCoins', color: '#F59E0B', parentId: null },
    ],
  };
}
