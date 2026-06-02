import re
import os

def fix_gradients(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    # 1. Main result cards
    content = content.replace('bg-gradient-to-br from-orange-500 to-red-500', 'bg-slate-900')
    content = content.replace('bg-gradient-to-br from-purple-500 to-indigo-600', 'bg-slate-900')
    content = content.replace('bg-gradient-to-br from-amber-500 to-orange-600', 'bg-slate-900')
    
    # 2. Header sections / inner cards
    content = content.replace('bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30', 'bg-slate-50 dark:bg-slate-700/50')
    content = content.replace('bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/30 dark:to-teal-900/30', 'bg-slate-50 dark:bg-slate-700/50')
    content = content.replace('bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800', 'bg-slate-50 dark:bg-slate-700/50')
    
    # 3. Specific buttons or small icons
    content = content.replace('bg-gradient-to-r from-indigo-500 to-purple-600', 'bg-blue-600')
    content = content.replace('hover:from-indigo-600 hover:to-purple-700', 'hover:bg-blue-700')

    with open(file_path, 'w') as f:
        f.write(content)
    print(f"Fixed gradients in {file_path}")

fix_gradients('index.html')

# Also check JS files that might render HTML
for root, _, files in os.walk('js'):
    for file in files:
        if file.endswith('.js'):
            fix_gradients(os.path.join(root, file))

