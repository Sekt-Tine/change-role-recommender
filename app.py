import webview
from pathlib import Path

# Pfad zu deiner index.html (liegt im gleichen Ordner wie app.py)
html_path = Path(__file__).parent / "index.html"

def main():
    window = webview.create_window(
        "Change Role Recommender",
        html_path.as_uri(),
        width=1200,
        height=800,
        resizable=True
    )
    webview.start()

if __name__ == "__main__":
    main()
