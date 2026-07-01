import xlsxwriter

def create_or_techniques_excel():
    file_path = "/home/kc/Documents/or-techniques-simulator/Northwest_Corner_Rule_Solver.xlsx"
    workbook = xlsxwriter.Workbook(file_path)
    
    # 🎨 Create Worksheets
    ws = workbook.add_worksheet("NW Corner Rule")
    ws.hide_gridlines(0) # Keep gridlines visible
    
    # Colors matching Warm Academic Editorial Theme
    c_navy = "#2A3E59"
    c_sand = "#F3EFE6"
    c_green = "#EAF2EC"
    c_red = "#FDECEB"
    c_border = "#E3DED5"
    c_dark = "#1C1F24"
    c_text = "#505663"
    
    # Formats
    title_fmt = workbook.add_format({
        'font_name': 'Georgia', 'font_size': 16, 'bold': True, 'font_color': c_dark
    })
    italic_fmt = workbook.add_format({
        'font_name': 'Georgia', 'font_size': 9, 'italic': True, 'font_color': "#8F96A3"
    })
    section_fmt = workbook.add_format({
        'font_name': 'Georgia', 'font_size': 12, 'bold': True, 'font_color': c_navy
    })
    
    header_fmt = workbook.add_format({
        'font_name': 'Arial', 'font_size': 10, 'bold': True, 'font_color': '#FFFFFF',
        'bg_color': c_navy, 'align': 'center', 'valign': 'vcenter', 'border': 1, 'border_color': c_border
    })
    
    label_fmt = workbook.add_format({
        'font_name': 'Arial', 'font_size': 10, 'bold': True, 'font_color': c_dark,
        'bg_color': c_sand, 'align': 'center', 'valign': 'vcenter', 'border': 1, 'border_color': c_border
    })
    
    cell_center_fmt = workbook.add_format({
        'font_name': 'Consolas', 'font_size': 10, 'align': 'center', 'valign': 'vcenter',
        'border': 1, 'border_color': c_border
    })
    
    cell_right_fmt = workbook.add_format({
        'font_name': 'Consolas', 'font_size': 10, 'align': 'right', 'valign': 'vcenter',
        'border': 1, 'border_color': c_border
    })
    
    allocated_fmt = workbook.add_format({
        'font_name': 'Consolas', 'font_size': 10, 'bold': True, 'bg_color': c_green,
        'align': 'center', 'valign': 'vcenter', 'border': 1, 'border_color': c_border
    })
    
    crossed_fmt = workbook.add_format({
        'font_name': 'Arial', 'font_size': 10, 'bold': True, 'font_color': '#A83E3E',
        'bg_color': c_red, 'align': 'center', 'valign': 'vcenter', 'border': 1, 'border_color': c_border
    })
    
    total_lbl_fmt = workbook.add_format({
        'font_name': 'Arial', 'font_size': 10, 'bold': True, 'font_color': c_dark,
        'align': 'left', 'valign': 'vcenter', 'top': 1, 'bottom': 6, 'bottom_color': c_dark
    })
    
    total_val_fmt = workbook.add_format({
        'font_name': 'Arial', 'font_size': 11, 'bold': True, 'font_color': c_dark,
        'bg_color': c_sand, 'align': 'right', 'valign': 'vcenter', 'top': 1, 'bottom': 6, 'bottom_color': c_dark
    })
    
    bold_txt_fmt = workbook.add_format({
        'font_name': 'Arial', 'font_size': 10, 'bold': True, 'align': 'right', 'valign': 'vcenter',
        'border': 1, 'border_color': c_border
    })

    # Columns width
    ws.set_column("A:A", 18)
    ws.set_column("B:C", 14)
    ws.set_column("D:D", 38)
    ws.set_column("E:F", 14)
    
    # --- Title ---
    ws.write("A2", "Operational Research – Northwest Corner Rule", title_fmt)
    ws.write("A3", "Initial Basic Feasible Solution (BFS) step-by-step solver.", italic_fmt)
    
    # --- 1. Cost Matrix ---
    ws.write("A5", "1. Input Cost Matrix", section_fmt)
    
    cost_headers = ["", "Destination 1", "Destination 2", "Destination 3", "Destination 4", "Supply"]
    for c_idx, text in enumerate(cost_headers):
        ws.write(5, c_idx, text, header_fmt)
        
    cost_data = [
        ["Source 1", 2, 3, 1, 5, 120],
        ["Source 2", 7, 3, 4, 6, 80],
        ["Source 3", 8, 5, 2, 3, 80],
    ]
    
    for r_offset, row_data in enumerate(cost_data):
        r_idx = 6 + r_offset
        ws.write(r_idx, 0, row_data[0], label_fmt)
        ws.write(r_idx, 1, row_data[1], cell_center_fmt)
        ws.write(r_idx, 2, row_data[2], cell_center_fmt)
        ws.write(r_idx, 3, row_data[3], cell_center_fmt)
        ws.write(r_idx, 4, row_data[4], cell_center_fmt)
        ws.write(r_idx, 5, row_data[5], bold_txt_fmt)
        
    ws.write("A10", "Demand", label_fmt)
    ws.write("B10", 150, bold_txt_fmt)
    ws.write("C10", 70, bold_txt_fmt)
    ws.write("D10", 60, bold_txt_fmt)
    ws.write("E10", 0, bold_txt_fmt)
    ws.write_formula("F10", "=SUM(F7:F9)", bold_txt_fmt)
    
    # --- 2. Step-by-Step Allocation ---
    ws.write("A12", "2. Step-by-Step NWCR Allocation Process", section_fmt)
    
    step_headers = ["Step", "Cell Location", "Allocation Formula", "Quantity Allocated", "Unit Cost", "Subtotal"]
    for c_idx, text in enumerate(step_headers):
        ws.write(12, c_idx, text, header_fmt)
        
    step_rows = [
        [1, "(S1, D1)", "min(Supply S1 = 120, Demand D1 = 150)", 120, 2, "=D14*E14"],
        [2, "(S2, D1)", "min(Supply S2 = 80, Demand D1 = 30)", 30, 7, "=D15*E15"],
        [3, "(S2, D2)", "min(Supply S2 = 50, Demand D2 = 70)", 50, 3, "=D16*E16"],
        [4, "(S3, D2)", "min(Supply S3 = 80, Demand D2 = 20)", 20, 5, "=D17*E17"],
        [5, "(S3, D3)", "min(Supply S3 = 60, Demand D3 = 60)", 60, 2, "=D18*E18"],
        [6, "(S3, D4)", "min(Supply S3 = 0, Demand D4 = 0)", 0, 3, "=D19*E19"]
    ]
    
    for r_offset, row_data in enumerate(step_rows):
        r_idx = 13 + r_offset
        ws.write(r_idx, 0, row_data[0], label_fmt)
        ws.write(r_idx, 1, row_data[1], label_fmt)
        ws.write(r_idx, 2, row_data[2], cell_center_fmt)
        ws.write(r_idx, 3, row_data[3], cell_right_fmt)
        ws.write(r_idx, 4, row_data[4], cell_right_fmt)
        ws.write_formula(r_idx, 5, row_data[5], allocated_fmt)
        
    ws.merge_range("A20:E20", "Total BFS Cost", total_lbl_fmt)
    ws.write_formula("F20", "=SUM(F14:F19)", total_val_fmt)
    
    # --- 3. Final Grid ---
    ws.write("A22", "3. Final Allocation Grid", section_fmt)
    
    for c_idx, text in enumerate(cost_headers):
        ws.write(22, c_idx, text, header_fmt)
        
    final_grid = [
        ["Source 1", 120, "✕", "✕", "✕", "=SUM(B24:E24)"],
        ["Source 2", 30, 50, "✕", "✕", "=SUM(B25:E25)"],
        ["Source 3", "✕", 20, 60, 0, "=SUM(B26:E26)"],
    ]
    
    for r_offset, row_data in enumerate(final_grid):
        r_idx = 23 + r_offset
        ws.write(r_idx, 0, row_data[0], label_fmt)
        
        for c_idx in range(1, 5):
            val = row_data[c_idx]
            if val == "✕":
                ws.write(r_idx, c_idx, val, crossed_fmt)
            else:
                ws.write(r_idx, c_idx, val, allocated_fmt)
                
        ws.write_formula(r_idx, 5, row_data[5], bold_txt_fmt)
        
    ws.write("A27", "Demand", label_fmt)
    ws.write_formula("B27", "=SUM(B24:B26)", bold_txt_fmt)
    ws.write_formula("C27", "=SUM(C24:C26)", bold_txt_fmt)
    ws.write_formula("D27", "=SUM(D24:D26)", bold_txt_fmt)
    ws.write_formula("E27", "=SUM(E24:E26)", bold_txt_fmt)
    ws.write_formula("F27", "=SUM(F24:F26)", bold_txt_fmt)
    
    workbook.close()
    print("Excel creation done")

create_or_techniques_excel()
