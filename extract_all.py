import re
import glob

all_lines = {}
for fn in glob.glob("recovered_views_*.txt"):
    with open(fn, "r", encoding="utf-8") as f:
        for line in f:
            m = re.match(r"^\s*(\d+):\s*(.*)", line)
            if m:
                num = int(m.group(1))
                content = m.group(2)
                all_lines[num] = content

print(f"Total unique lines recovered across all files: {len(all_lines)}")
sorted_nums = sorted(all_lines.keys())
if sorted_nums:
    print(f"Range: {sorted_nums[0]} to {sorted_nums[-1]}")
    gaps = []
    start = sorted_nums[0]
    for i in range(len(sorted_nums)-1):
        if sorted_nums[i+1] - sorted_nums[i] > 1:
            gaps.append((sorted_nums[i], sorted_nums[i+1]))
    if gaps:
        print("Gaps found:", gaps)
    else:
        print("No gaps found!")
    
    # Save the recovered lines to a file
    with open("recovered_views.py", "w", encoding="utf-8") as out:
        for n in sorted_nums:
            out.write(f"{n}: {all_lines[n]}\n")
        print("Wrote lines to recovered_views.py")
