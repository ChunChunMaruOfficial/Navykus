"""Revert all useTranslation(['common', ...]) calls back to useTranslation()"""
import os, re

project = 'D:/Navykus'
files = ['src/App.tsx']
components = os.path.join(project, 'src/components')
for f in os.listdir(components):
    if f.endswith('.tsx'):
        files.append(f'src/components/{f}')

fixed = 0
for rel_path in files:
    full = os.path.join(project, rel_path)
    if not os.path.exists(full):
        continue
    with open(full, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern: useTranslation(['common', '...', ...])
    new_content = re.sub(
        r"(const\s*\{\s*t\s*(?:,\s*i18n\s*)?\}\s*=\s*)useTranslation\(\s*\[[^\]]*\]\s*\)",
        r"\1useTranslation()",
        content
    )
    
    if new_content != content:
        with open(full, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'[FIX] {rel_path}')
        fixed += 1

print(f'Total files fixed: {fixed}')

# Verify no namespace arrays remain
print('\n=== Verification ===')
for rel_path in files:
    full = os.path.join(project, rel_path)
    if not os.path.exists(full):
        continue
    with open(full, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f, 1):
            if 'useTranslation([' in line:
                print(f'  STILL HAS: {rel_path}:{i}: {line.strip()[:80]}')

print('Done!')
