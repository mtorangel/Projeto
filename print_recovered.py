import glob

files = glob.glob("recovered_views_*.txt")
for fn in sorted(files):
    with open(fn, "r", encoding="utf-8") as f:
        content = f.read()
        print(f"=== File: {fn} (size: {len(content)}) ===")
        # Print first 5 lines and last 5 lines
        lines = content.splitlines()
        print("\n".join(lines[:10]))
        print("...")
        print("\n".join(lines[-10:]))
        print("==============================\n")
