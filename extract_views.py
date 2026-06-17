import re

# Parse recovered_views_1.txt
with open("recovered_views_1.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

line_dict = {}
for line in lines:
    m = re.match(r"^\s*(\d+):\s*(.*)", line)
    if m:
        num = int(m.group(1))
        content = m.group(2)
        line_dict[num] = content

print(f"Extracted {len(line_dict)} lines from recovered_views_1.txt")
sorted_nums = sorted(line_dict.keys())
if sorted_nums:
    print(f"Range: {sorted_nums[0]} to {sorted_nums[-1]}")
    # Let's print some ranges to see if we have gaps
    gaps = []
    for i in range(len(sorted_nums)-1):
        if sorted_nums[i+1] - sorted_nums[i] > 1:
            gaps.append((sorted_nums[i], sorted_nums[i+1]))
    if gaps:
        print("Gaps found:", gaps)
    else:
        print("No gaps found!")
