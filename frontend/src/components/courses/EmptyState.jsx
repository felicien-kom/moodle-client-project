import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Composant d'état vide réutilisable
 * Affiche un message avec icône et bouton d'action optionnel
 */
export function EmptyState({ title, description, actionLabel, onAction, icon: IconComponent = BookOpen }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="rounded-full bg-[#2A78C2]/10 p-4 mb-6">
        <IconComponent size={48} className="text-[#2A78C2]" />
      </div>
      <h3 className="text-xl font-bold text-indigo-900 mb-2 text-center">
        {title}
      </h3>
      <p className="text-slate-600 text-center mb-8 max-w-md leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button 
          onClick={onAction} 
          className="bg-indigo-900 hover:bg-indigo-800 text-white font-semibold transition-all duration-200"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
