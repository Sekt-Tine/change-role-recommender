# KI-Integration für Dokumentenanalyse

## Übersicht

Die Anwendung unterstützt das Hochladen von Excel-, Word-, PDF- und Textdateien, die automatisch mit KI analysiert werden, um Job Profile zu extrahieren.

## Installation

1. Installieren Sie die benötigten Python-Pakete:
```bash
pip install -r requirements.txt
```

2. Starten Sie den Backend-Server:
```bash
python server.py
```

Der Server läuft auf `http://localhost:5000`

## KI-Integration

Die Funktion `analyze_with_ai()` in `server.py` muss mit einer KI-API verbunden werden.

### Option 1: OpenAI API

```python
import openai

def analyze_with_ai(text):
    openai.api_key = "YOUR_API_KEY"
    
    prompt = f"""
    Analysiere folgenden Text und extrahiere alle Job Profile/Rollenbeschreibungen.
    Für jedes Profil extrahiere:
    - Arbeitstitel (jobTitle)
    - Funktion (function)
    - Einordnung/Level (level: lead, expert, support, pmo)
    - Kurzbeschreibung (summary)
    - Verantwortungsbereich (responsibility)
    - Typische Aufgaben (tasks)
    - Fähigkeiten (skills, kommagetrennt)
    - Verantwortung Details (responsibilityDetails, kommagetrennt)
    - Qualifikationen (qualifications, kommagetrennt)
    - Typische Stärken (strengths, kommagetrennt)
    
    Text:
    {text}
    
    Gib die Antwort als JSON-Array zurück, wobei jedes Element ein Job-Profil ist.
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    
    return response.choices[0].message.content
```


Installation: `pip install anthropic`

### Option 3: Lokale LLM (Ollama)

```python
import requests

def analyze_with_ai(text):
    prompt = f"""
    Analysiere folgenden Text und extrahiere alle Job Profile/Rollenbeschreibungen.
    Für jedes Profil extrahiere:
    - Arbeitstitel (jobTitle)
    - Funktion (function)
    - Einordnung/Level (level: lead, expert, support, pmo)
    - Kurzbeschreibung (summary)
    - Verantwortungsbereich (responsibility)
    - Typische Aufgaben (tasks)
    - Fähigkeiten (skills, kommagetrennt)
    - Verantwortung Details (responsibilityDetails, kommagetrennt)
    - Qualifikationen (qualifications, kommagetrennt)
    - Typische Stärken (strengths, kommagetrennt)
    
    Text:
    {text}
    
    Gib die Antwort als JSON-Array zurück, wobei jedes Element ein Job-Profil ist.
    """
    
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama2",  # oder ein anderes Modell
            "prompt": prompt,
            "stream": False
        }
    )
    
    return response.json()["response"]
```

## Verwendung

1. Starten Sie den Backend-Server (`python server.py`)
2. Öffnen Sie die Web-Anwendung
3. Klicken Sie auf "Dokument hochladen (KI)" in der Job Profile Sidebar
4. Wählen Sie eine Datei aus (Excel, Word, PDF oder Text)
5. Die Datei wird analysiert und Job Profile werden automatisch erstellt

## Unterstützte Dateiformate

- Excel: `.xlsx`, `.xls`
- Word: `.doc`, `.docx`
- PDF: `.pdf`
- Text: `.txt`

## Fehlerbehebung

- Stellen Sie sicher, dass der Backend-Server läuft
- Überprüfen Sie die Browser-Konsole auf Fehler
- Stellen Sie sicher, dass alle Python-Pakete installiert sind
- Für KI-Integration: Überprüfen Sie Ihre API-Keys und Verbindung

