from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
from werkzeug.utils import secure_filename
import json

# Für Excel-Dateien
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

# Für PDF und Word
try:
    import PyPDF2
    from docx import Document
    DOC_PARSING_AVAILABLE = True
except ImportError:
    DOC_PARSING_AVAILABLE = False

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = tempfile.gettempdir()
ALLOWED_EXTENSIONS = {'xlsx', 'xls', 'doc', 'docx', 'pdf', 'txt'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_file(filepath, filename):
    """Extrahiert Text aus verschiedenen Dateiformaten"""
    ext = filename.rsplit('.', 1)[1].lower()
    text = ""
    
    if ext in ['xlsx', 'xls']:
        if PANDAS_AVAILABLE:
            try:
                df = pd.read_excel(filepath)
                text = df.to_string()
            except Exception as e:
                return f"Fehler beim Lesen der Excel-Datei: {str(e)}"
        else:
            return "pandas ist nicht installiert. Bitte installieren Sie es mit: pip install pandas openpyxl"
    
    elif ext == 'pdf':
        if DOC_PARSING_AVAILABLE:
            try:
                with open(filepath, 'rb') as f:
                    pdf_reader = PyPDF2.PdfReader(f)
                    text = "\n".join([page.extract_text() for page in pdf_reader.pages])
            except Exception as e:
                return f"Fehler beim Lesen der PDF-Datei: {str(e)}"
        else:
            return "PyPDF2 ist nicht installiert. Bitte installieren Sie es mit: pip install PyPDF2"
    
    elif ext in ['doc', 'docx']:
        if DOC_PARSING_AVAILABLE:
            try:
                doc = Document(filepath)
                text = "\n".join([para.text for para in doc.paragraphs])
            except Exception as e:
                return f"Fehler beim Lesen der Word-Datei: {str(e)}"
        else:
            return "python-docx ist nicht installiert. Bitte installieren Sie es mit: pip install python-docx"
    
    elif ext == 'txt':
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                text = f.read()
        except Exception as e:
            return f"Fehler beim Lesen der Textdatei: {str(e)}"
    
    return text

# Lade Umgebungsvariablen aus .env-Datei
from dotenv import load_dotenv
load_dotenv()

# OpenAI-Integration
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
    # Initialisiere OpenAI Client mit API-Key aus .env
    openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
except ImportError:
    OPENAI_AVAILABLE = False
    openai_client = None

def analyze_with_ai(text):
    """
    Analysiert den Text mit OpenAI und extrahiert Job Profile.
    """
    if not OPENAI_AVAILABLE or openai_client is None:
        raise Exception("OpenAI ist nicht verfügbar. Bitte installieren Sie das openai-Paket und stellen Sie sicher, dass OPENAI_API_KEY in der .env-Datei gesetzt ist.")
    
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise Exception("OPENAI_API_KEY nicht in .env-Datei gefunden. Bitte fügen Sie OPENAI_API_KEY=your_key_here zur .env-Datei hinzu.")
    
    # Begrenze Text auf maximal 12000 Zeichen (um Token-Limit zu vermeiden)
    # GPT-4 hat ein großes Context-Window, aber wir begrenzen für Sicherheit
    if len(text) > 12000:
        text = text[:12000] + "\n\n[... Text wurde gekürzt ...]"
    
    prompt = f"""Analysiere folgenden Text und extrahiere alle Job Profile/Rollenbeschreibungen.

Für jedes gefundene Profil extrahiere folgende Informationen:
- jobTitle: Der Arbeitstitel der Rolle
- function: Die Funktion/Abteilung (z.B. "Transformation Office")
- level: Das Level (nur einer der Werte: "lead", "expert", "support", "pmo")
- summary: Eine Kurzbeschreibung des Kerns der Rolle
- responsibility: Der Verantwortungsbereich (Budget, Ressourcen, Stakeholder, etc.)
- tasks: Typische Aufgaben (kommagetrennt, z.B. "Coaching, Datenanalyse, Steuerung")
- skills: Fähigkeiten (kommagetrennt, z.B. "Moderation, Datenanalyse, strategisches Denken")
- responsibilityDetails: Details zur Verantwortung (kommagetrennt)
- qualifications: Qualifikationen/Zertifikate (kommagetrennt, z.B. "PROSCI, Scrum Master")
- strengths: Typische Stärken (kommagetrennt, z.B. "Stakeholder-Management, Analytik")

WICHTIG: Gib die Antwort NUR als gültiges JSON-Array zurück, ohne zusätzlichen Text davor oder danach.
Jedes Element im Array ist ein Objekt mit den oben genannten Feldern.
Falls ein Feld nicht gefunden werden kann, setze es auf einen leeren String "".

Text zum Analysieren:
{text}

Antwort (nur JSON-Array):"""
    
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",  # Verwende gpt-4o-mini für bessere Performance und niedrigere Kosten
            messages=[
                {
                    "role": "system",
                    "content": "Du bist ein Experte für Job-Profile und Rollenbeschreibungen. Du extrahierst strukturierte Informationen aus Texten und gibst sie IMMER als JSON-Array zurück. Jedes Element im Array ist ein Job-Profil-Objekt."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3
        )
        
        ai_response_text = response.choices[0].message.content.strip()
        
        # Entferne mögliche Markdown-Code-Blöcke
        if ai_response_text.startswith("```json"):
            ai_response_text = ai_response_text[7:]
        if ai_response_text.startswith("```"):
            ai_response_text = ai_response_text[3:]
        if ai_response_text.endswith("```"):
            ai_response_text = ai_response_text[:-3]
        ai_response_text = ai_response_text.strip()
        
        # Versuche JSON zu parsen
        try:
            parsed = json.loads(ai_response_text)
            # Stelle sicher, dass es eine Liste ist
            if isinstance(parsed, dict):
                # Falls es ein Objekt mit "profiles" Schlüssel ist
                if "profiles" in parsed:
                    return json.dumps(parsed["profiles"], ensure_ascii=False)
                # Sonst wrappe es als Array
                else:
                    return json.dumps([parsed], ensure_ascii=False)
            elif isinstance(parsed, list):
                return json.dumps(parsed, ensure_ascii=False)
            else:
                return json.dumps([parsed], ensure_ascii=False)
        except json.JSONDecodeError:
            # Falls JSON-Parsing fehlschlägt, versuche JSON aus dem Text zu extrahieren
            import re
            # Suche nach JSON-Array
            json_match = re.search(r'\[[\s\S]*\]', ai_response_text)
            if json_match:
                try:
                    parsed = json.loads(json_match.group(0))
                    return json.dumps(parsed if isinstance(parsed, list) else [parsed], ensure_ascii=False)
                except:
                    pass
            raise Exception(f"KI-Antwort konnte nicht als JSON geparst werden. Antwort: {ai_response_text[:300]}")
    
    except Exception as e:
        raise Exception(f"Fehler bei OpenAI API-Aufruf: {str(e)}")

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'Keine Datei hochgeladen'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Keine Datei ausgewählt'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Extrahiere Text aus der Datei
            text = extract_text_from_file(filepath, filename)
            
            if text.startswith("Fehler"):
                return jsonify({'error': text}), 400
            
            # Analysiere mit KI
            ai_response = analyze_with_ai(text)
            
            # Parse JSON-Antwort
            try:
                profiles = json.loads(ai_response)
                # Stelle sicher, dass es eine Liste ist
                if not isinstance(profiles, list):
                    profiles = [profiles]
            except json.JSONDecodeError as e:
                # Falls die KI keine gültige JSON zurückgibt
                return jsonify({
                    'error': f'KI-Antwort konnte nicht geparst werden: {str(e)}. Antwort: {ai_response[:200]}'
                }), 500
            
            # Lösche temporäre Datei
            os.remove(filepath)
            
            return jsonify({'profiles': profiles}), 200
        
        except Exception as e:
            # Lösche temporäre Datei bei Fehler
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'error': f'Fehler bei der Verarbeitung: {str(e)}'}), 500
    
    return jsonify({'error': 'Dateityp nicht erlaubt'}), 400

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)

