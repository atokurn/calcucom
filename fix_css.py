import re

with open('css/style.css', 'r') as f:
    content = f.read()

# 1. Remove font-size: 17px and height: 44px and vertical padding overrides to fix "komponen menjadi besar"
content = re.sub(r'^\s*padding-top:\s*10px\s*!important;\n?', '', content, flags=re.MULTILINE)
content = re.sub(r'^\s*padding-bottom:\s*10px\s*!important;\n?', '', content, flags=re.MULTILINE)
content = re.sub(r'^\s*font-size:\s*17px\s*!important;.*\n?', '', content, flags=re.MULTILINE)
content = re.sub(r'^\s*height:\s*44px\s*!important;\n?', '', content, flags=re.MULTILINE)
content = re.sub(r'^\s*min-height:\s*44px\s*!important;\n?', '', content, flags=re.MULTILINE)
content = re.sub(r'^\s*min-height:\s*36px\s*!important;\n?', '', content, flags=re.MULTILINE)

# 2. Fix card background colors overriding Tailwind dark mode classes
# Find the block starting with body[data-authenticated="true"] #main-content .bg-white.rounded-lg.shadow-sm
# and replace it or remove the background color
content = re.sub(r'background-color:\s*var\(--apple-white\)\s*!important;\s*border:\s*1px\s*solid\s*var\(--apple-divider\)\s*!important;', 'border: 1px solid var(--apple-divider) !important;', content)
content = re.sub(r'background-color:\s*var\(--apple-card-dark\)\s*!important;\s*border:\s*1px\s*solid\s*var\(--apple-divider-dark\)\s*!important;', 'border: 1px solid var(--apple-divider-dark) !important;', content)

# 3. Remove background gradients
content = re.sub(r'radial-gradient[^;]+;', ';', content)
content = re.sub(r'linear-gradient\([^;]+;\n?', '', content)

with open('css/style.css', 'w') as f:
    f.write(content)
print("CSS fixed")
