import pandas as pd
import json

file_path = 'data/Báo cáo tháng 8 (1).xlsx'

xl = pd.ExcelFile(file_path)

for sheet_name in ['01', '02', '03', '04', '05', '06', '07']:
    if sheet_name not in xl.sheet_names:
        continue
    
    print(f"\n========== NGÀY {sheet_name} ==========")
    try:
        df = xl.parse(sheet_name, header=None)
        
        thu_bien_so = []
        chi_bien_so = []
        
        current_section = None
        for idx, row in df.iterrows():
            row_str = ' '.join([str(x).strip() for x in row.values if pd.notna(x)])
            
            if "THU BIỂN SỐ" in row_str.upper():
                current_section = "THU"
                continue
            elif "CHI THUẾ + ĐĂNG KÝ BIỂN SỐ" in row_str.upper():
                current_section = "CHI"
                continue
            elif "THU KHOẢN KHÁC" in row_str.upper() or "CHI PHÍ" in row_str.upper() or "THU BÁN XE" in row_str.upper():
                if current_section in ["THU", "CHI"]:
                    current_section = None
            
            # extract data
            if current_section == "THU":
                # Col 1: Ten, Col 3: CK, Col 4: TM
                ten = str(row[1]).strip()
                if ten and ten != 'nan' and ten != 'HỌ VÀ TÊN':
                    ck = row[3] if pd.notna(row[3]) else 0
                    tm = row[4] if pd.notna(row[4]) else 0
                    try: ck = float(ck)
                    except: ck = 0
                    try: tm = float(tm)
                    except: tm = 0
                    if ck > 0 or tm > 0:
                        thu_bien_so.append(f"  + {ten}: CK: {ck:,.0f} | TM: {tm:,.0f}")
                        
            elif current_section == "CHI":
                # Col 1: Ten, Col 3: Thue, Col 4: Phi bien, Col 5: Phi cong an
                ten = str(row[1]).strip()
                if ten and ten != 'nan' and ten != 'HỌ VÀ TÊN':
                    thue = row[3] if pd.notna(row[3]) else 0
                    phi_bien = row[4] if pd.notna(row[4]) else 0
                    phi_ca = row[5] if pd.notna(row[5]) else 0
                    
                    try: thue = float(thue)
                    except: thue = 0
                    try: phi_bien = float(phi_bien)
                    except: phi_bien = 0
                    try: phi_ca = float(phi_ca)
                    except: phi_ca = 0
                    
                    if thue > 0 or phi_bien > 0 or phi_ca > 0:
                        chi_bien_so.append(f"  - {ten}: Thuế: {thue:,.0f} | Phí Biển: {phi_bien:,.0f} | Phí CA: {phi_ca:,.0f}")
        
        print(f"[THU BIỂN SỐ]")
        if thu_bien_so:
            for item in thu_bien_so: print(item)
        else:
            print("  (Không có dữ liệu)")
            
        print(f"[CHI BIỂN SỐ]")
        if chi_bien_so:
            for item in chi_bien_so: print(item)
        else:
            print("  (Không có dữ liệu)")
            
    except Exception as e:
        print(f"Error reading {sheet_name}: {e}")

