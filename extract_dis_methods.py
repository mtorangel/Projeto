def extract_method(method_name, start_line, num_lines=1500):
    lines = open("disassembled_views_utf8.txt", encoding="utf-8").readlines()
    out_lines = []
    found = False
    for i, line in enumerate(lines):
        if i + 1 >= start_line:
            out_lines.append(f"{i+1}: {line}")
            if len(out_lines) >= num_lines:
                break
    with open(f"dis_{method_name}.txt", "w", encoding="utf-8") as out:
        out.writelines(out_lines)
    print(f"Wrote {method_name} disassembly to dis_{method_name}.txt")

# get of RegulacaoFilaView starts at 3834
extract_method("RegulacaoFilaView_get", 3834, 750)

# get of MatrizRiscoView starts at 4582
extract_method("MatrizRiscoView_get", 4582, 1200)

# post of ExplicarIndicadorView starts at 5790
extract_method("ExplicarIndicadorView_post", 5790, 1120)

# get of DatabaseStatsView starts at 6915
extract_method("DatabaseStatsView_get", 6915, 456)

# post of SeedDataView starts at 7371
extract_method("SeedDataView_post", 7371, 400)
