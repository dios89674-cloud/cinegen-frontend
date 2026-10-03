"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Star, Download, Search, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, type MarketplaceListing } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const CATEGORIES = ["Todos", "Cinemático", "Documental", "Publicidad", "Music Video", "Corporativo", "Narrativo"];

const CATEGORY_GRADIENTS: Record<string, string> = {
  "Cinemático":  "from-blue-950 to-slate-900",
  "Documental":  "from-stone-900 to-zinc-800",
  "Publicidad":  "from-orange-950 to-amber-900",
  "Music Video": "from-purple-950 to-pink-900",
  "Corporativo": "from-gray-900 to-slate-800",
  "Narrativo":   "from-green-950 to-emerald-900",
};

function StarRating({ rating = 0 }: { rating?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={11}
          className={cn(i <= Math.round(rating) ? "text-[#ff9f0a] fill-[#ff9f0a]" : "text-[#3a3a3c]")}
        />
      ))}
    </div>
  );
}

function ListingCard({ listing, onDownload, downloading }: {
  listing: MarketplaceListing;
  onDownload: (id: string) => void;
  downloading: boolean;
}) {
  const gradient = CATEGORY_GRADIENTS[listing.category ?? ""] ?? "from-slate-900 to-slate-800";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }} transition={{ duration: 0.2 }}
      className="group bg-[#0f0f0f] border border-white/[0.05] hover:border-white/10 rounded-[20px] overflow-hidden cursor-pointer transition-all duration-300"
    >
      {/* Preview gradient */}
      <div className={cn("h-28 bg-gradient-to-br relative", gradient)}>
        <div className="absolute inset-0 flex items-end p-4">
          {listing.category && (
            <span className="bg-black/40 backdrop-blur-sm text-white/70 text-[10px] font-medium px-2.5 py-1 rounded-full">
              {listing.category}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <p className="text-white font-semibold text-sm mb-1 truncate">{listing.name}</p>
        {listing.description && (
          <p className="text-[#48484a] text-xs line-clamp-2 mb-3">{listing.description}</p>
        )}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <StarRating rating={listing.rating} />
            {listing.rating != null && <span className="text-[#48484a] text-xs">{listing.rating.toFixed(1)}</span>}
          </div>
          {listing.downloads != null && (
            <div className="flex items-center gap-1 text-[#48484a] text-xs">
              <Download size={10} /> {listing.downloads.toLocaleString()}
            </div>
          )}
        </div>
        <Button
          size="sm"
          variant="secondary"
          loading={downloading}
          onClick={() => onDownload(listing.listing_id)}
          className="w-full"
        >
          <Download size={13} /> Obtener kit
        </Button>
      </div>
    </motion.div>
  );
}

export default function MarketplacePage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const cat = category === "Todos" ? undefined : category;
      const data = await api.listMarketplace(token, cat);
      setListings(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [token, category]);

  useEffect(() => { if (!authLoading && !user) router.replace("/"); }, [user, authLoading, router]);
  useEffect(() => { if (token) load(); }, [token, load]);

  const handleDownload = async (id: string) => {
    if (!token) return;
    setDownloading(id);
    try {
      await api.downloadListing(token, id);
    } catch { /* ignore */ }
    finally { setDownloading(null); }
  };

  const filtered = listings.filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase()));

  // Fallback listings for display
  const displayListings: MarketplaceListing[] = filtered.length > 0 ? filtered : loading ? [] : [
    { listing_id: "1", kit_id: "k1", name: "Noir Urbano", description: "Paleta de colores fría y contrastada. Perfecta para thrillers y drama noir.", category: "Cinemático", rating: 4.8, downloads: 1240 },
    { listing_id: "2", kit_id: "k2", name: "Documental Natural", description: "Tonos cálidos y naturales. Ideal para documentales y narrativa realista.", category: "Documental", rating: 4.5, downloads: 890 },
    { listing_id: "3", kit_id: "k3", name: "Publicidad Premium", description: "Estilo brillante y dinámico para marcas y productos de lujo.", category: "Publicidad", rating: 4.7, downloads: 567 },
    { listing_id: "4", kit_id: "k4", name: "Neón & Noche", description: "Luces de neón y ambiente nocturno. Perfecto para music videos y sci-fi.", category: "Music Video", rating: 4.9, downloads: 2100 },
    { listing_id: "5", kit_id: "k5", name: "Corporativo Moderno", description: "Limpio, profesional y minimalista. Para presentaciones y comunicados.", category: "Corporativo", rating: 4.2, downloads: 330 },
    { listing_id: "6", kit_id: "k6", name: "Épico Narrativo", description: "Paleta dramática y oscura para historias de gran escala.", category: "Narrativo", rating: 4.6, downloads: 780 },
  ];

  if (authLoading || (!user && !authLoading)) return null;

  return (
    <div className="min-h-screen pt-24 pb-28 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl font-semibold text-white tracking-tight" style={{ letterSpacing: "-0.025em" }}>Marketplace</h1>
          <p className="text-[#48484a] mt-1.5 text-sm">Brand kits y estilos visuales para tus producciones</p>
        </motion.div>

        {/* Search + filter */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#48484a]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar kits..."
              className="w-full bg-[#0f0f0f] border border-white/[0.06] text-white placeholder-[#3a3a3c] rounded-[12px] pl-9 pr-4 py-2.5 text-sm outline-none focus:border-white/15 transition-colors"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-[10px] text-sm font-medium border transition-all duration-200",
                  category === cat ? "bg-white text-black border-white" : "border-white/[0.07] text-[#48484a] hover:text-white hover:border-white/15"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#0f0f0f] rounded-[20px] overflow-hidden border border-white/[0.05]">
                <div className="shimmer h-28 w-full" />
                <div className="p-5 space-y-3">
                  <div className="shimmer h-3 w-2/3 rounded-full" />
                  <div className="shimmer h-2.5 w-full rounded-full" />
                  <div className="shimmer h-8 w-full rounded-[10px]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayListings.map(listing => (
              <ListingCard
                key={listing.listing_id}
                listing={listing}
                onDownload={handleDownload}
                downloading={downloading === listing.listing_id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
