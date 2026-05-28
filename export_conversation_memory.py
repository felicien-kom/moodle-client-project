import json
import os
import re
from datetime import datetime

# Paths
LOGS_PATH = r"C:\Users\Achille\.gemini\antigravity\brain\b9623a4a-a649-4b73-a9a1-555a512f1ee8\.system_generated\logs\transcript.jsonl"
OUTPUT_PATH = r"c:\Users\Achille\Desktop\Projet dev\Moodle new\moodle-client-project\conversation_memory.md"

def format_timestamp(ts_str):
    try:
        dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d %H:%M:%S UTC")
    except Exception:
        return ts_str

def main():
    if not os.path.exists(LOGS_PATH):
        print(f"Error: Transcript file not found at {LOGS_PATH}")
        return

    steps = []
    with open(LOGS_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                steps.append(json.loads(line))
            except Exception as e:
                print(f"Warning: Failed to parse line: {e}")

    md = []
    md.append("# 🧠 Mémoire de la Conversation (Détails Complets)")
    md.append("")
    md.append("> **Identifiant Unique de Conversation :** `b9623a4a-a649-4b73-a9a1-555a512f1ee8`  ")
    md.append(f"> **Dernière mise à jour :** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  ")
    md.append(f"> **Fichier source de log :** `{LOGS_PATH}`")
    md.append("")
    md.append("Ce document contient l'historique complet et ultra-détaillé de notre session de pair programming. Vous y trouverez toutes les étapes de réflexion, les commandes exécutées, les outils sollicités, et les réponses apportées.")
    md.append("")
    
    # Statistics
    total_steps = len(steps)
    user_messages = sum(1 for s in steps if s.get("source") == "USER_EXPLICIT")
    model_responses = sum(1 for s in steps if s.get("source") == "MODEL" and s.get("type") == "PLANNER_RESPONSE")
    tool_calls_count = sum(len(s.get("tool_calls", [])) for s in steps if "tool_calls" in s)
    
    md.append("## 📊 Statistiques de la Session")
    md.append(f"- **Nombre total d'étapes :** {total_steps}")
    md.append(f"- **Messages de l'Utilisateur :** {user_messages}")
    md.append(f"- **Réponses du Modèle AI :** {model_responses}")
    md.append(f"- **Appels d'outils (Tools) effectués :** {tool_calls_count}")
    md.append("")
    
    md.append("## 📜 Fil d'Ariane des Échanges (Chronologique)")
    md.append("")
    
    for idx, step in enumerate(steps):
        source = step.get("source", "UNKNOWN")
        step_type = step.get("type", "UNKNOWN")
        created_at = format_timestamp(step.get("created_at", ""))
        status = step.get("status", "")
        
        md.append(f"### 📍 Étape {idx + 1} — {source} ({step_type})")
        md.append(f"*Horodatage : {created_at}* | *Statut : {status}*")
        md.append("")
        
        # Content formatting based on source/type
        if source == "USER_EXPLICIT":
            content = step.get("content", "")
            # Clean up user request tags if present
            clean_content = content
            # Highlight user requests nicely
            md.append("> [!NOTE]")
            md.append("> **Requête Utilisateur :**")
            md.append("> ")
            for line in clean_content.split("\n"):
                md.append(f"> {line}")
            md.append("")
            
        elif source == "SYSTEM":
            md.append("🤖 *Action du Système : Récupération ou initialisation de l'historique de la conversation.*")
            md.append("")
            
        elif source == "MODEL":
            # Thinking block
            thinking = step.get("thinking", "")
            if thinking:
                md.append("<details>")
                md.append("<summary>💭 <b>Chemin de Pensée du Modèle (Thinking Process)</b></summary>")
                md.append("")
                md.append(thinking)
                md.append("")
                md.append("</details>")
                md.append("")
                
            # Content (if any)
            content = step.get("content", "")
            if content:
                md.append("#### 📝 Réponse formulée :")
                md.append(content)
                md.append("")
                
            # Tool calls
            tool_calls = step.get("tool_calls", [])
            if tool_calls:
                md.append("🛠️ **Outils sollicités par l'AI :**")
                md.append("")
                for tc in tool_calls:
                    name = tc.get("name")
                    args = tc.get("args", {})
                    # Clean up backslashes in JSON strings if args has string keys/values
                    args_str = json.dumps(args, indent=2, ensure_ascii=False)
                    # Unescape twice if needed
                    md.append(f"- **Outil :** `{name}`")
                    md.append("  ```json")
                    md.append(f"  {args_str}")
                    md.append("  ```")
                md.append("")
                
        else: # Tool outputs or other steps
            content = step.get("content", "")
            md.append("📥 **Résultat ou Retour d'Information :**")
            if content:
                # Format long output as code block
                md.append("```text")
                # Truncate content in display if it's too massive, but keep it substantial
                if len(content) > 10000:
                    md.append(content[:10000] + "\n\n... [Contenu tronqué pour lisibilité, voir fichier original] ...")
                else:
                    md.append(content)
                md.append("```")
            else:
                md.append("*Aucune donnée renvoyée.*")
            md.append("")
            
        md.append("---")
        md.append("")
        
    md.append("## ⚙️ Comment mettre à jour cette mémoire ?")
    md.append("Ce fichier a été généré dynamiquement à l'aide du script `export_conversation_memory.py` présent à la racine de votre projet.")
    md.append("Pour actualiser cette mémoire avec les derniers échanges à tout moment, ouvrez votre terminal dans le projet et lancez :")
    md.append("```powershell")
    md.append("python export_conversation_memory.py")
    md.append("```")
    
    with open(OUTPUT_PATH, "w", encoding="utf-8") as out:
        out.write("\n".join(md))
        
    print(f"Memory successfully exported to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
