import React from 'react';
import {
  Wallet, CreditCard, Landmark, PiggyBank, Banknote, Coins, TrendingUp, TrendingDown,
  ShoppingCart, ShoppingBag, Utensils, Coffee, Pizza, Wine, Home, Key, Lightbulb,
  Wifi, Tv, Smartphone, Car, Fuel, Bus, Plane, MapPin, HeartPulse, Pill, Stethoscope,
  Dumbbell, GraduationCap, BookOpen, Gamepad2, Film, Music, Ticket, Gift, Sparkles,
  Dog, Cat, Scissors, Shirt, Watch, Wrench,Hammer, ShieldCheck, Briefcase, Laptop,
  Award, DollarSign, Percent, Receipt, Tag, Target, Flame, Zap, Star, Crown, Gem,
  Calendar, Clock, Bell, Users, User, Heart, Smile, Sun, Umbrella, Camera, Headphones,
  Package, Truck, Globe, Layers, CircleDollarSign, HandCoins, ArrowLeftRight
} from 'lucide-react';

export const VIVID_PALETTE = [
  { name: 'Azul Elétrico', hex: '#0052FF' },
  { name: 'Ciano Neon', hex: '#00D4FF' },
  { name: 'Verde Esmeralda', hex: '#00E676' },
  { name: 'Verde Limão Vivo', hex: '#10B981' },
  { name: 'Vermelho Carmesim', hex: '#FF1744' },
  { name: 'Rosa Choque Vivo', hex: '#FF2E93' },
  { name: 'Roxo Intenso', hex: '#7C3AED' },
  { name: 'Violeta Elétrico', hex: '#A855F7' },
  { name: 'Laranja Solar', hex: '#FF6D00' },
  { name: 'Âmbar Ouro', hex: '#FFB300' },
  { name: 'Turquesa Oceano', hex: '#00BFA5' },
  { name: 'Índigo Profundo', hex: '#3D5AFE' },
  { name: 'Coral Vibrante', hex: '#FF5252' },
  { name: 'Magenta Vivo', hex: '#D500F9' },
  { name: 'Azul Royal', hex: '#2563EB' },
  { name: 'Amarelo Cyber', hex: '#FFD600' },
];

export const ICON_CATALOG: Record<string, { component: React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }>; label: string; group: string }> = {
  // Finanças & Contas
  Wallet: { component: Wallet, label: 'Carteira', group: 'Finanças' },
  Landmark: { component: Landmark, label: 'Banco', group: 'Finanças' },
  CreditCard: { component: CreditCard, label: 'Cartão', group: 'Finanças' },
  PiggyBank: { component: PiggyBank, label: 'Cofre / Reserva', group: 'Finanças' },
  Banknote: { component: Banknote, label: 'Dinheiro', group: 'Finanças' },
  Coins: { component: Coins, label: 'Moedas', group: 'Finanças' },
  TrendingUp: { component: TrendingUp, label: 'Investimento', group: 'Finanças' },
  TrendingDown: { component: TrendingDown, label: 'Baixa', group: 'Finanças' },
  CircleDollarSign: { component: CircleDollarSign, label: 'Cifrão', group: 'Finanças' },
  HandCoins: { component: HandCoins, label: 'Proventos', group: 'Finanças' },
  DollarSign: { component: DollarSign, label: 'Dólar / Real', group: 'Finanças' },
  Percent: { component: Percent, label: 'Juros / Taxa', group: 'Finanças' },
  Receipt: { component: Receipt, label: 'Boleto / Fatura', group: 'Finanças' },
  ArrowLeftRight: { component: ArrowLeftRight, label: 'Transferência', group: 'Finanças' },

  // Alimentação
  ShoppingCart: { component: ShoppingCart, label: 'Supermercado', group: 'Alimentação' },
  Utensils: { component: Utensils, label: 'Restaurante', group: 'Alimentação' },
  Coffee: { component: Coffee, label: 'Café / Padaria', group: 'Alimentação' },
  Pizza: { component: Pizza, label: 'Delivery / Lanche', group: 'Alimentação' },
  Wine: { component: Wine, label: 'Bar / Bebidas', group: 'Alimentação' },

  // Casa & Contas Fixas
  Home: { component: Home, label: 'Moradia / Casa', group: 'Moradia' },
  Key: { component: Key, label: 'Aluguel', group: 'Moradia' },
  Lightbulb: { component: Lightbulb, label: 'Energia / Luz', group: 'Moradia' },
  Wifi: { component: Wifi, label: 'Internet', group: 'Moradia' },
  Tv: { component: Tv, label: 'Streaming / TV', group: 'Moradia' },
  Smartphone: { component: Smartphone, label: 'Celular', group: 'Moradia' },
  Wrench: { component: Wrench, label: 'Manutenção', group: 'Moradia' },
  Hammer: { component: Hammer, label: 'Reforma', group: 'Moradia' },

  // Transporte & Viagem
  Car: { component: Car, label: 'Carro / Uber', group: 'Transporte' },
  Fuel: { component: Fuel, label: 'Combustível', group: 'Transporte' },
  Bus: { component: Bus, label: 'Transporte Público', group: 'Transporte' },
  Plane: { component: Plane, label: 'Viagem / Avião', group: 'Transporte' },
  MapPin: { component: MapPin, label: 'Passeio / Pedágio', group: 'Transporte' },

  // Saúde & Bem-estar
  HeartPulse: { component: HeartPulse, label: 'Saúde', group: 'Saúde' },
  Pill: { component: Pill, label: 'Farmácia', group: 'Saúde' },
  Stethoscope: { component: Stethoscope, label: 'Consulta / Exame', group: 'Saúde' },
  Dumbbell: { component: Dumbbell, label: 'Academia / Esporte', group: 'Saúde' },
  Scissors: { component: Scissors, label: 'Salão / Barbearia', group: 'Saúde' },

  // Lazer, Compras & Estilo
  ShoppingBag: { component: ShoppingBag, label: 'Compras', group: 'Lazer & Compras' },
  Shirt: { component: Shirt, label: 'Roupas', group: 'Lazer & Compras' },
  Watch: { component: Watch, label: 'Acessórios', group: 'Lazer & Compras' },
  Gamepad2: { component: Gamepad2, label: 'Jogos / Games', group: 'Lazer & Compras' },
  Film: { component: Film, label: 'Cinema', group: 'Lazer & Compras' },
  Music: { component: Music, label: 'Show / Música', group: 'Lazer & Compras' },
  Ticket: { component: Ticket, label: 'Ingresso / Evento', group: 'Lazer & Compras' },
  Gift: { component: Gift, label: 'Presente', group: 'Lazer & Compras' },
  Camera: { component: Camera, label: 'Fotografia', group: 'Lazer & Compras' },
  Headphones: { component: Headphones, label: 'Assinatura Áudio', group: 'Lazer & Compras' },

  // Educação & Trabalho
  GraduationCap: { component: GraduationCap, label: 'Educação / Curso', group: 'Trabalho & Estudo' },
  BookOpen: { component: BookOpen, label: 'Livros', group: 'Trabalho & Estudo' },
  Briefcase: { component: Briefcase, label: 'Trabalho / Salário', group: 'Trabalho & Estudo' },
  Laptop: { component: Laptop, label: 'Freelance / Tech', group: 'Trabalho & Estudo' },
  Award: { component: Award, label: 'Bônus / Prêmio', group: 'Trabalho & Estudo' },

  // Família, Pets & Metas
  Heart: { component: Heart, label: 'Casal / Encontro', group: 'Casal & Metas' },
  Users: { component: Users, label: 'Família', group: 'Casal & Metas' },
  User: { component: User, label: 'Pessoal', group: 'Casal & Metas' },
  Dog: { component: Dog, label: 'Pet / Cachorro', group: 'Casal & Metas' },
  Cat: { component: Cat, label: 'Gato / Vet', group: 'Casal & Metas' },
  Target: { component: Target, label: 'Meta / Objetivo', group: 'Casal & Metas' },
  Sparkles: { component: Sparkles, label: 'Sonho / Especial', group: 'Casal & Metas' },
  Flame: { component: Flame, label: 'Urgente / Destaque', group: 'Casal & Metas' },
  Zap: { component: Zap, label: 'Rápido', group: 'Casal & Metas' },
  Star: { component: Star, label: 'Favorito', group: 'Casal & Metas' },
  Crown: { component: Crown, label: 'Premium', group: 'Casal & Metas' },
  Gem: { component: Gem, label: 'Joia / Casamento', group: 'Casal & Metas' },
  ShieldCheck: { component: ShieldCheck, label: 'Seguro / Reserva', group: 'Casal & Metas' },
  Tag: { component: Tag, label: 'Etiqueta', group: 'Casal & Metas' },
  Package: { component: Package, label: 'Encomenda', group: 'Casal & Metas' },
  Truck: { component: Truck, label: 'Frete / Mudança', group: 'Casal & Metas' },
  Globe: { component: Globe, label: 'Internacional', group: 'Casal & Metas' },
  Layers: { component: Layers, label: 'Outros', group: 'Casal & Metas' },
  Calendar: { component: Calendar, label: 'Mensalidade', group: 'Casal & Metas' },
  Clock: { component: Clock, label: 'Temporário', group: 'Casal & Metas' },
  Bell: { component: Bell, label: 'Lembrete', group: 'Casal & Metas' },
  Smile: { component: Smile, label: 'Bem-estar', group: 'Casal & Metas' },
  Sun: { component: Sun, label: 'Férias / Verão', group: 'Casal & Metas' },
  Umbrella: { component: Umbrella, label: 'Imprevisto', group: 'Casal & Metas' },
};

export function DynamicIcon({
  name,
  size = 18,
  className = '',
  style,
}: {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const entry = ICON_CATALOG[name] || ICON_CATALOG.Wallet;
  const IconComponent = entry.component;
  return <IconComponent size={size} className={className} style={style} />;
}
