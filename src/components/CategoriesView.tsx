import React, { useState } from 'react';
import { Category, TagItem, WorkspaceData } from '../types/finance';
import { DynamicIcon } from '../lib/icons';
import { LiquidModal } from './ui/LiquidModal';
import { LiquidSelect } from './ui/LiquidSelect';
import { IconAndColorPicker } from './ui/IconAndColorPicker';
import {
  Plus,
  Edit3,
  Trash2,
  Tag as TagIcon,
  ArrowDownCircle,
  ArrowUpCircle,
  CornerDownRight,
} from 'lucide-react';

interface CategoriesViewProps {
  workspace: WorkspaceData;
  onSaveCategory: (cat: Category, isEdit: boolean) => void;
  onDeleteCategory: (catId: string, reassignToId?: string) => void;
  onSaveTag: (tag: TagItem, isEdit: boolean) => void;
  onDeleteTag: (tagId: string) => void;
}

export function CategoriesView({
  workspace,
  onSaveCategory,
  onDeleteCategory,
  onSaveTag,
  onDeleteTag,
}: CategoriesViewProps) {
  const [activeTab, setActiveTab] = useState<'expense' | 'income' | 'tags'>('expense');

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'expense' | 'income'>('expense');
  const [catParentId, setCatParentId] = useState<string>('');
  const [catIcon, setCatIcon] = useState('Utensils');
  const [catColor, setCatColor] = useState('#0052FF');

  // Delete Category Modal State
  const [catToDelete, setCatToDelete] = useState<Category | null>(null);
  const [reassignId, setReassignId] = useState<string>('');

  // Tag Modal State
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#0052FF');
  const [tagIconDummy, setTagIconDummy] = useState('Tag');

  const openCreateCat = (type: 'expense' | 'income', parentId = '') => {
    setEditingCat(null);
    setCatName('');
    setCatType(type);
    setCatParentId(parentId);
    const parentObj = workspace.categories.find((c) => c.id === parentId);
    setCatIcon(parentObj ? parentObj.icon : type === 'expense' ? 'Utensils' : 'Briefcase');
    setCatColor(parentObj ? parentObj.color : type === 'expense' ? '#FF6D00' : '#00E676');
    setIsCatModalOpen(true);
  };

  const openEditCat = (cat: Category) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatType(cat.type);
    setCatParentId(cat.parentId || '');
    setCatIcon(cat.icon);
    setCatColor(cat.color);
    setIsCatModalOpen(true);
  };

  const handleSaveCategoryForm = (e: React.FormEvent) => {
    e.preventDefault();
    const obj: Category = {
      id: editingCat ? editingCat.id : `cat-${Date.now()}`,
      name: catName.trim() || 'Nova Categoria',
      type: catType,
      icon: catIcon,
      color: catColor,
      parentId: catParentId || null,
    };
    onSaveCategory(obj, Boolean(editingCat));
    setIsCatModalOpen(false);
  };

  const openCreateTag = () => {
    setEditingTag(null);
    setTagName('');
    setTagColor('#00D4FF');
    setIsTagModalOpen(true);
  };

  const openEditTag = (t: TagItem) => {
    setEditingTag(t);
    setTagName(t.name);
    setTagColor(t.color);
    setIsTagModalOpen(true);
  };

  const handleSaveTagForm = (e: React.FormEvent) => {
    e.preventDefault();
    const obj: TagItem = {
      id: editingTag ? editingTag.id : `tag-${Date.now()}`,
      name: tagName.trim().replace(/^#/, '') || 'Tag',
      color: tagColor,
    };
    onSaveTag(obj, Boolean(editingTag));
    setIsTagModalOpen(false);
  };

  const parentCategories = workspace.categories.filter(
    (c) => !c.parentId && c.type === (activeTab === 'income' ? 'income' : 'expense')
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="liquid-glass rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">
            Categorias, Subcategorias & Tags
          </h2>
          <p className="text-xs text-slate-300">
            Todas as categorias (inclusive as que já vêm no sistema) podem ser criadas, editadas ou excluídas livremente
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={openCreateTag}
            className="px-4 py-2.5 rounded-2xl liquid-glass-interactive text-xs font-bold text-[#00D4FF] hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <TagIcon size={15} />
            Nova Tag
          </button>

          <button
            type="button"
            onClick={() =>
              openCreateCat(activeTab === 'income' ? 'income' : 'expense')
            }
            className="px-4 py-2.5 rounded-2xl btn-vivid-blue text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            Nova Categoria
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 rounded-2xl liquid-glass w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('expense')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
            activeTab === 'expense'
              ? 'btn-vivid-crimson text-white shadow-md'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <ArrowDownCircle size={15} />
          Categorias de Despesas
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('income')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
            activeTab === 'income'
              ? 'btn-vivid-emerald text-white shadow-md'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <ArrowUpCircle size={15} />
          Categorias de Receitas
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tags')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
            activeTab === 'tags'
              ? 'btn-vivid-blue text-white shadow-md'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <TagIcon size={15} />
          Tags (#Etiquetas)
        </button>
      </div>

      {activeTab !== 'tags' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {parentCategories.map((cat) => {
            const subcats = workspace.categories.filter((s) => s.parentId === cat.id);
            const txCount = workspace.transactions.filter(
              (t) => t.categoryId === cat.id || subcats.some((s) => s.id === t.subcategoryId)
            ).length;

            return (
              <div
                key={cat.id}
                className="liquid-glass rounded-3xl p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Categoria Pai */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md"
                        style={{
                          backgroundColor: `${cat.color}30`,
                          color: cat.color,
                          border: `1px solid ${cat.color}`,
                        }}
                      >
                        <DynamicIcon name={cat.icon} size={20} />
                      </span>
                      <div>
                        <div className="text-sm font-extrabold text-white">{cat.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {txCount} lançamento(s) • {subcats.length} subcategoria(s)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditCat(cat)}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white cursor-pointer"
                        title="Editar Categoria"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const fallback = parentCategories.find((p) => p.id !== cat.id);
                          setReassignId(fallback?.id || '');
                          setCatToDelete(cat);
                        }}
                        className="p-2 rounded-xl bg-white/10 hover:bg-[#FF1744]/30 text-rose-300 hover:text-[#FF1744] cursor-pointer"
                        title="Excluir Categoria"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Subcategorias */}
                  {subcats.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-white/10">
                      {subcats.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08]"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <CornerDownRight size={13} className="text-slate-500 shrink-0" />
                            <span
                              className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: `${sub.color}28`,
                                color: sub.color,
                              }}
                            >
                              <DynamicIcon name={sub.icon} size={13} />
                            </span>
                            <span className="text-xs font-semibold text-slate-200 truncate">
                              {sub.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditCat(sub)}
                              className="p-1 text-slate-400 hover:text-white cursor-pointer"
                              title="Editar Subcategoria"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteCategory(sub.id)}
                              className="p-1 text-slate-400 hover:text-[#FF5252] cursor-pointer"
                              title="Excluir Subcategoria"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => openCreateCat(cat.type, cat.id)}
                  className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/12 border border-dashed border-white/20 text-xs font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <Plus size={13} /> Adicionar Subcategoria em {cat.name}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* Aba de Tags */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {workspace.tags.map((tag) => {
            const count = workspace.transactions.filter((t) =>
              t.tags.includes(tag.id)
            ).length;
            return (
              <div
                key={tag.id}
                className="liquid-glass rounded-2xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm"
                    style={{
                      backgroundColor: `${tag.color}30`,
                      color: tag.color,
                      border: `1px solid ${tag.color}`,
                    }}
                  >
                    #
                  </span>
                  <div>
                    <div className="text-sm font-bold text-white">#{tag.name}</div>
                    <div className="text-[11px] text-slate-400">{count} lançamento(s)</div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditTag(tag)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white cursor-pointer"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteTag(tag.id)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-[#FF1744]/30 text-rose-300 hover:text-[#FF1744] cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar / Editar Categoria ou Subcategoria */}
      <LiquidModal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={
          editingCat
            ? `Editar ${editingCat.parentId ? 'Subcategoria' : 'Categoria'}`
            : catParentId
            ? 'Nova Subcategoria'
            : 'Nova Categoria'
        }
        headerColor={catColor}
      >
        <form onSubmit={handleSaveCategoryForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Nome da Categoria
              </label>
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Ex: Alimentação, Supermercado, Pets..."
                className="w-full liquid-input rounded-2xl px-4 py-2.5 text-sm text-white"
              />
            </div>

            <LiquidSelect
              label="Tipo"
              value={catType}
              onChange={(v) => {
                setCatType(v as 'expense' | 'income');
                setCatParentId('');
              }}
              options={[
                { value: 'expense', label: 'Despesa (Saída)', icon: 'TrendingDown', color: '#FF1744' },
                { value: 'income', label: 'Receita (Entrada)', icon: 'TrendingUp', color: '#00E676' },
              ]}
            />
          </div>

          <LiquidSelect
            label="Hierarquia (Categoria Principal ou Subcategoria)"
            value={catParentId}
            onChange={setCatParentId}
            options={[
              { value: '', label: 'É uma Categoria Principal (Raiz)', icon: 'Layers', color: '#0052FF' },
              ...workspace.categories
                .filter((c) => !c.parentId && c.type === catType && c.id !== editingCat?.id)
                .map((p) => ({
                  value: p.id,
                  label: `Subcategoria dentro de: ${p.name}`,
                  icon: p.icon,
                  color: p.color,
                })),
            ]}
          />

          <IconAndColorPicker
            selectedIcon={catIcon}
            onSelectIcon={setCatIcon}
            selectedColor={catColor}
            onSelectColor={setCatColor}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsCatModalOpen(false)}
              className="px-4 py-2.5 rounded-2xl liquid-glass-interactive text-xs font-bold text-slate-300 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl btn-vivid-blue text-xs font-bold text-white cursor-pointer"
            >
              Salvar Categoria
            </button>
          </div>
        </form>
      </LiquidModal>

      {/* Modal Excluir Categoria com Reatribuição */}
      <LiquidModal
        isOpen={Boolean(catToDelete)}
        onClose={() => setCatToDelete(null)}
        title={`Excluir Categoria — ${catToDelete?.name}`}
        maxWidth="sm"
        headerColor="#FF1744"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Para qual categoria deseja mover os lançamentos que estavam vinculados a{' '}
            <strong>{catToDelete?.name}</strong>?
          </p>

          <LiquidSelect
            label="Transferir lançamentos existentes para:"
            value={reassignId}
            onChange={setReassignId}
            options={workspace.categories
              .filter((c) => !c.parentId && c.id !== catToDelete?.id)
              .map((c) => ({
                value: c.id,
                label: c.name,
                icon: c.icon,
                color: c.color,
              }))}
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCatToDelete(null)}
              className="px-4 py-2 rounded-xl liquid-glass-interactive text-xs font-bold text-slate-300 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                if (catToDelete) onDeleteCategory(catToDelete.id, reassignId);
                setCatToDelete(null);
              }}
              className="px-4 py-2 rounded-xl btn-vivid-crimson text-xs font-bold text-white cursor-pointer"
            >
              Excluir Categoria
            </button>
          </div>
        </div>
      </LiquidModal>

      {/* Modal Criar / Editar Tag */}
      <LiquidModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        title={editingTag ? 'Editar Tag' : 'Nova Tag (#Etiqueta)'}
        maxWidth="md"
        headerColor={tagColor}
      >
        <form onSubmit={handleSaveTagForm} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Nome da Tag (sem #)
            </label>
            <input
              type="text"
              required
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="Ex: ViagemFerias, Casamento, Reforma..."
              className="w-full liquid-input rounded-2xl px-4 py-2.5 text-sm text-white"
            />
          </div>

          <IconAndColorPicker
            selectedIcon={tagIconDummy}
            onSelectIcon={setTagIconDummy}
            selectedColor={tagColor}
            onSelectColor={setTagColor}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsTagModalOpen(false)}
              className="px-4 py-2 rounded-xl liquid-glass-interactive text-xs font-bold text-slate-300 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl btn-vivid-blue text-xs font-bold text-white cursor-pointer"
            >
              Salvar Tag
            </button>
          </div>
        </form>
      </LiquidModal>
    </div>
  );
}
