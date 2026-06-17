import json

log_path = r"C:\Users\Administrador\.gemini\antigravity-ide\brain\5a4fdf85-d523-4954-bae6-bec05f474434\.system_generated\logs\transcript.jsonl"
count = 0
with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        content = data.get("content", "")
        if "File Path: " in content and "views.py" in content:
            count += 1
            fname = f"recovered_views_{count}.txt"
            print(f"Found views.py content of size: {len(content)}, writing to {fname}")
            with open(fname, "w", encoding="utf-8") as out:
                out.write(content)
