import sys
import re
from deep_translator import GoogleTranslator

def translate_markdown(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    translator = GoogleTranslator(source='en', target='es')
    
    # We need to preserve markdown formatting. A simple approach is translating paragraph by paragraph
    paragraphs = content.split('\n\n')
    translated_paragraphs = []
    
    print(f"Translating {len(paragraphs)} paragraphs...")
    
    for i, p in enumerate(paragraphs):
        # Skip empty or just markdown separators
        if not p.strip() or p.strip() == '---':
            translated_paragraphs.append(p)
            continue
            
        # Protect image links
        if p.strip().startswith('!['):
            translated_paragraphs.append(p)
            continue
            
        # For simple paragraphs, we translate avoiding breaking code blocks or tables if possible.
        # Deep translator handles markdown poorly if we just throw it in, but for PRD it's mostly text with bold/italics.
        # We'll translate chunks of up to 4000 chars.
        try:
            # Deep translator has a length limit of 5000 chars
            if len(p) < 4500:
                translated = translator.translate(p)
                translated_paragraphs.append(translated)
            else:
                # If a paragraph is too long, split by newline
                lines = p.split('\n')
                translated_lines = []
                for line in lines:
                    if line.strip() and len(line) < 4500:
                        translated_lines.append(translator.translate(line))
                    else:
                        translated_lines.append(line)
                translated_paragraphs.append('\n'.join(translated_lines))
                
        except Exception as e:
            print(f"Error on batch {i}: {e}")
            translated_paragraphs.append(p) # fallback to original
            
        if i % 10 == 0:
            print(f"Progress: {i}/{len(paragraphs)}")
            
    # Fix some common markdown issues caused by translation
    result = '\n\n'.join(translated_paragraphs)
    
    # Write to new file
    with open('PRD_Innovation_ES.md', 'w', encoding='utf-8') as f:
        f.write(result)
        
    print("Translation completed. Saved to PRD_Innovation_ES.md")

if __name__ == "__main__":
    translate_markdown('PRD_Innovation.md')
