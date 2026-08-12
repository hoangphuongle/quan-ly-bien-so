import pandas as pd
import numpy as np

file_path = 'data/Báo cáo tháng 8 (2).xlsx'
df = pd.read_excel(file_path, sheet_name=None, header=None)

total_cash_in = 0
total_cash_out = 0

print("=== PHÂN TÍCH TIỀN MẶT TỪ NGÀY 01/08 ĐẾN 08/08 ===")

for sheet_name, sheet_data in df.items():
    # Convert all string to uppercase for easier matching
    sheet_data = sheet_data.applymap(lambda x: str(x).upper().strip() if pd.notnull(x) else x)
    
    cash_in_today = 0
    cash_out_today = 0
    
    for idx, row in sheet_data.iterrows():
        # Identify rows with "TIỀN MẶT" columns or explicit amounts
        # This is a bit manual, let's just extract all numbers from columns that might be Cash
        pass

# Since the format is messy (merged cells, no strict headers), I will dump the specific cells manually or use a keyword search.
