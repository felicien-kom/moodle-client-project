import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * Génère les initiales à partir du nom.
 * Pierre Dupont -> PD
 * Pierre -> PI
 * P -> P
 */
function getInitials(name) {
  if (!name) return "?";
  const trimmedName = name.trim();
  const parts = trimmedName.split(/\s+/); // Gère plusieurs espaces

  if (parts.length > 1) {
    // Premier et dernier mot (ex: Pierre Jean Dupont -> PD)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // Un seul mot : deux premières lettres si possible, sinon une seule
  return trimmedName.length > 1 
    ? trimmedName.substring(0, 2).toUpperCase() 
    : trimmedName.charAt(0).toUpperCase();
}

/**
 * Génère une couleur déterministe basée sur une chaîne de caractères
 */
function getColorFromName(name) {
  if (!name) return "bg-slate-500";
  
  const colors = [
    "bg-red-600", "bg-orange-600", "bg-amber-600", "bg-yellow-600",
    "bg-lime-600", "bg-green-600", "bg-emerald-600", "bg-teal-600",
    "bg-cyan-600", "bg-sky-600", "bg-blue-600", "bg-[#2A78C2]",
    "bg-violet-600", "bg-purple-600", "bg-fuchsia-600", "bg-pink-600", "bg-rose-600"
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export default function DynamicAvatar({ name, photo, className = "h-9 w-9" }) {
  const initials = getInitials(name);
  const bgColor = getColorFromName(name);

  return (
    <Avatar className={className}>
      {/* L'image s'affiche si photo est valide */}
      <AvatarImage src={photo} alt={name} className="object-cover" />
      
      {/* Le Fallback s'affiche si photo est null ou en cours de chargement */}
      <AvatarFallback className={`${bgColor} text-white font-bold uppercase`}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}