import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

/**
 * Composant contrôlé générique de sélection avec icône.
 *
 * @param {Object[]} list           - Liste des options : { id, label, icon }
 * @param {string}   selectedId     - ID de l'option actuellement sélectionnée (source de vérité externe)
 * @param {Function} onSelect       - Callback appelé avec l'id de l'option choisie
 * @param {string}   [triggerLabel] - Label sr-only du bouton déclencheur (accessibilité)
 */
export function IconLabelPicker({
  list,
  selectedId,
  onSelect,
  triggerLabel = "Open the menu",
}) {
  // On dérive l'item sélectionné depuis la prop, jamais depuis un state local
  const selectedItem = list.find((item) => item.id === selectedId) ?? list[0];
  const SelectedIcon = selectedItem.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <SelectedIcon className="h-[1.2rem] w-[1.2rem] transition-all" />
          <span className="sr-only">{triggerLabel}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-35">
        {list.map((item) => {
          const Icon = item.icon;
          const isSelected = item.id === selectedItem.id;

          return (
            <DropdownMenuItem
              key={item.id}
              onClick={() => onSelect(item.id)}
              className="flex items-center justify-between cursor-pointer"
              // Accessibilité : indique l'état sélectionné aux lecteurs d'écran
              aria-current={isSelected ? "true" : undefined}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </div>

              {isSelected && <Check className="h-4 w-4 opacity-50" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}