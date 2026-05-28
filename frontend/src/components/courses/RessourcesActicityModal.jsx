import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  ClipboardList, Folder, File, Link, Upload, Calendar as CalendarIcon, X,
} from "lucide-react";

const ACTIVITES = [
  {
    id: "devoir",
    label: "Devoir",
    icon: <ClipboardList size={28} className="text-pink-500" />,
    type: "activite",
  },
];

const RESSOURCES = [
  {
    id: "dossier",
    label: "Dossier",
    icon: <Folder size={28} className="text-teal-500" />,
    type: "ressource",
  },
  {
    id: "fichier",
    label: "Fichier",
    icon: <File size={28} className="text-blue-500" />,
    type: "ressource",
  },
  {
    id: "url",
    label: "URL",
    icon: <Link size={28} className="text-orange-500" />,
    type: "ressource",
  },
];

const ALL = [...ACTIVITES, ...RESSOURCES];

function ActivityCard({ item, onClick }) {
  return (
    <div 
      onClick={() => onClick(item)}
      className="flex flex-col items-center justify-center gap-2 p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer min-h-[110px]"
    >
      {item.icon}
      <span className="text-xs font-medium text-center text-gray-700 leading-tight">
        {item.label}
      </span>
    </div>
  );
}

function ActivityGrid({ items, onItemClick }) {
  if (items.length === 0)
    return (
      <p className="text-sm text-gray-400 py-6 text-center">
        Aucun résultat trouvé.
      </p>
    );
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {items.map((item) => (
        <ActivityCard key={item.id} item={item} onClick={onItemClick} />
      ))}
    </div>
  );
}

export default function AddActivityModal({ open, onOpenChange }) {
  const [search, setSearch] = useState("");
  const [selectedFormType, setSelectedFormType] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({});

  const filter = (list) =>
    list.filter((i) =>
      i.label.toLowerCase().includes(search.toLowerCase())
    );

  const handleItemClick = (item) => {
    setSelectedFormType(item.id);
    setSelectedFiles({});
  };

  const handleCloseForm = () => {
    setSelectedFormType(null);
    setSelectedFiles({});
  };

  const handleFileUpload = (formType) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => ({ ...prev, [formType]: files }));
    };
    input.click();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl w-full p-0 gap-0">

          {/* Header */}
          <DialogHeader className="px-6 pt-5 pb-3 border-b flex flex-row items-center justify-between">
            <DialogTitle className="text-base font-semibold">
              Ajouter une activité ou ressource
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 pt-4 pb-2">
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Onglets */}
          <Tabs defaultValue="tout" className="px-6 pb-6">
            <TabsList className="bg-transparent border-b border-gray-200 rounded-none w-full justify-start gap-0 p-0 h-auto mb-4">
              {["tout", "activites", "ressources"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none bg-transparent px-4 pb-2 capitalize text-sm text-gray-500"
                >
                  {tab === "tout" ? "Tout" : tab === "activites" ? "Activités" : "Ressources"}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="tout">
              <ActivityGrid items={filter(ALL)} onItemClick={handleItemClick} />
            </TabsContent>

            <TabsContent value="activites">
              <ActivityGrid items={filter(ACTIVITES)} onItemClick={handleItemClick} />
            </TabsContent>

            <TabsContent value="ressources">
              <ActivityGrid items={filter(RESSOURCES)} onItemClick={handleItemClick} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modal Ajout Fichier */}
      <Dialog open={selectedFormType === "fichier"} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Ajout Fichier</DialogTitle>
            <DialogDescription>
              Ajoutez un fichier à cette section du cours.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file-name">Nom</Label>
              <Input id="file-name" placeholder="Nom du fichier" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file-description">Description</Label>
              <Textarea 
                id="file-description" 
                placeholder="Description du fichier..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Sélectionner des fichiers</Label>
              <div 
                onClick={() => handleFileUpload('fichier')}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Glissez-déposez des fichiers ici ou cliquez pour sélectionner
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Taille maximale: 100 Mo
                </p>
                {selectedFiles.fichier && selectedFiles.fichier.length > 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    {selectedFiles.fichier.length} fichier(s) sélectionné(s)
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCloseForm}>
              Annuler
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ajout Dossier */}
      <Dialog open={selectedFormType === "dossier"} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Ajout Dossier</DialogTitle>
            <DialogDescription>
              Créez un dossier pour organiser les ressources de cette section.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Nom</Label>
              <Input id="folder-name" placeholder="Nom du dossier" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="folder-description">Description</Label>
              <Textarea 
                id="folder-description" 
                placeholder="Description du dossier..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Contenu du dossier</Label>
              <div 
                onClick={() => handleFileUpload('dossier')}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              >
                <Folder className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Glissez-déposez des fichiers ici ou cliquez pour sélectionner
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Ajoutez des fichiers au dossier
                </p>
                {selectedFiles.dossier && selectedFiles.dossier.length > 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    {selectedFiles.dossier.length} fichier(s) sélectionné(s)
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCloseForm}>
              Annuler
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ajout URL */}
      <Dialog open={selectedFormType === "url"} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Ajout URL</DialogTitle>
            <DialogDescription>
              Ajoutez un lien externe à cette section du cours.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="url-name">Nom</Label>
              <Input id="url-name" placeholder="Nom du lien" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="external-url">URL externe</Label>
              <Input id="external-url" placeholder="https://example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url-description">Description</Label>
              <Textarea 
                id="url-description" 
                placeholder="Description du lien..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCloseForm}>
              Annuler
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ajout Devoir */}
      <Dialog open={selectedFormType === "devoir"} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Ajout Devoir</DialogTitle>
            <DialogDescription>
              Créez un devoir pour cette section du cours.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assignment-name">Nom</Label>
              <Input id="assignment-name" placeholder="Nom du devoir" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignment-description">Description</Label>
              <Textarea 
                id="assignment-description" 
                placeholder="Description du devoir..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Fichiers de devoir</Label>
              <div 
                onClick={() => handleFileUpload('devoir')}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Glissez-déposez des fichiers ici ou cliquez pour sélectionner
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Ajoutez des fichiers supplémentaires pour le devoir
                </p>
                {selectedFiles.devoir && selectedFiles.devoir.length > 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    {selectedFiles.devoir.length} fichier(s) sélectionné(s)
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="submission-settings">Autoriser la remise des</Label>
              <Input id="submission-settings" placeholder="Ex: fichiers texte, PDF, etc." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due-date">Date limite</Label>
              <div className="flex gap-2">
                <Input id="due-date" type="date" className="flex-1" />
                <Input type="time" className="w-32" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder-date">Rappeler d'évaluer jusqu'au</Label>
              <div className="flex gap-2">
                <Input id="reminder-date" type="date" className="flex-1" />
                <Input type="time" className="w-32" />
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCloseForm}>
              Annuler
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}