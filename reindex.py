import json

# Charger les données
with open('family.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Créer la correspondance id
old_to_new = {}
for idx, person in enumerate(data):
    old_to_new[person['id']] = idx + 1

# Remplacer les id dans chaque objet
for person in data:
    person['id'] = old_to_new[person['id']]
    if 'motherId' in person and person['motherId'] in old_to_new:
        person['motherId'] = old_to_new[person['motherId']]
    if 'fatherId' in person and person['fatherId'] in old_to_new:
        person['fatherId'] = old_to_new[person['fatherId']]
    if 'spouseIds' in person:
        person['spouseIds'] = [old_to_new[spouse] for spouse in person['spouseIds'] if spouse in old_to_new]

# Sauvegarder le nouveau fichier
with open('family.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=4)