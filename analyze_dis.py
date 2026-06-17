def extract_lines(start, end):
    print(f"=== Extracting lines {start} to {end} ===")
    lines = open("disassembled_views_utf8.txt", encoding="utf-8").readlines()
    for idx in range(start - 1, min(end, len(lines))):
        print(f"{idx+1}: {lines[idx]}", end="")

extract_lines(3340, 3500)
