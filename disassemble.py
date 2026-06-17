import marshal
import dis
import sys

pyc_path = r"c:\Users\Administrador\OneDrive\MBACD\Projeto\painel-saude-backend\indicadores\__pycache__\views.cpython-312.pyc"
try:
    with open(pyc_path, 'rb') as f:
        # Python 3.7+ has 16-byte headers
        header = f.read(16)
        code_obj = marshal.load(f)
        
        # We can also recursively disassemble inner code objects
        with open("disassembled_views.txt", "w", encoding="utf-8") as out:
            dis.dis(code_obj, file=out)
            
        print("Successfully disassembled views.cpython-312.pyc to disassembled_views.txt")
except Exception as e:
    print(f"Error: {e}")
