import pandas as pd
import sys

try:
    df = pd.read_excel('../data/Báo cáo tháng 8 (1).xlsx', sheet_name=None)
    for sheet_name, sheet_df in df.items():
        print(f"Sheet: {sheet_name}")
        print(sheet_df.head())
        print(sheet_df.columns.tolist())
        print("---")
except Exception as e:
    print(f"Error: {e}")
