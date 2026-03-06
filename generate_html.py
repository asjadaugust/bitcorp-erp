import markdown

try:
    with open('PRD_Innovation_ES.md', 'r', encoding='utf-8') as f:
        text = f.read()

    # The markdown package needs extensions to render tables and code blocks properly
    html_content = markdown.markdown(text, extensions=['tables', 'fenced_code'])

    with open('aero_pdf_style.css', 'r', encoding='utf-8') as f:
        css_content = f.read()

    # Injecting CSS and HTML Content
    full_html = f'''<!DOCTYPE html>
    <html lang="es">
    <head>
    <meta charset="utf-8">
    <style>
    {css_content}
    </style>
    </head>
    <body>
    {html_content}
    </body>
    </html>'''

    with open('PRD_Innovation_ES.html', 'w', encoding='utf-8') as f:
        f.write(full_html)
        
    print("HTML Generated successfully.")
except Exception as e:
    print(f"Error: {e}")
