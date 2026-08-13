// Supabase Configuration
const supabaseUrl = 'https://ngtvuupayujyabulddgr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ndHZ1dXBheXVqeWFidWxkZGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MTAxODgsImV4cCI6MjEwMjA4NjE4OH0.CsLBiMWuQHbY3EuexyWFOq3MRKE99KcE_eyL-92VxKk';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let state = {
    records: [],
    totalRemitted: 0,
    currentView: 'dashboard'
};

// Expose to window for inline event handlers in HTML
window.app = {};
window.switchView = switchView;
window.logout = handleLogout;

// DOM Elements
const mainApp = document.getElementById('mainApp');

// Auto Init
document.getElementById('displayUserName').textContent = 'Admin';
initApp();

function handleLogout() {
    location.reload();
}

// Initialize App Data
async function initApp() {
    lucide.createIcons();
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('vi-VN', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    try {
        console.log("Đang khôi phục dữ liệu từ Cloud...");
        
        // 1. Luôn ưu tiên lấy từ Cloud trước
        const { data, error } = await supabase.from('app_state').select('data').eq('id', 'main_store').single();
        
        if (data && data.data) {
            state = data.data;
            applyStateDefaults();
            console.log("Đã tải dữ liệu từ Cloud thành công!");
        } else {
            // 2. Nếu Cloud lỗi hoặc trống, thử lấy từ máy tính dự phòng
            console.log("Không tải được từ Cloud, thử dùng dữ liệu cục bộ...");
            const savedState = localStorage.getItem('motodash_state');
            if (savedState && savedState !== "undefined" && savedState !== "null") {
                try {
                    state = JSON.parse(savedState);
                    applyStateDefaults();
                } catch(e) {
                    console.error("Lỗi khi đọc dữ liệu cục bộ:", e);
                }
            }
        }
        
        // --- AUTO IMPORT DATA ---
        console.log("Khôi phục danh sách khách hàng...");
        const newRecords = [
            { name: 'PHAN LÝ MỸ NGÂN', car: 'feliz_2025', tax: 518000 },
            { name: 'NGUYỄN THỊ THU THUẬN', car: 'evo_grand_lite', tax: 378000 },
            { name: 'ĐỖ THANH NHƠN', car: 'feliz_2', tax: 498000 },
            { name: 'LÊ PHẠM HUỲNH BÁ KHUÊ', car: 'evo_grand', tax: 480000, skipPlatePolice: true },
            { name: 'ĐINH THỊ TUYẾT NHUNG', car: 'amio', tax: 278000 },
            { name: 'PHAN ĐỨC TÂM', car: 'flazz', tax: 320000 },
            { name: 'PHAN TRUNG HIẾU', car: 'feliz_2025', tax: 518000 },
            { name: 'VÕ THÀNH NHÂN', car: 'feliz_2', tax: 498000 },
            { name: 'TRẦN ĐẠI HƯNG', car: 'evo_lite', tax: 340000 },
            { name: 'TRẦN ĐẠI HƯNG (2)', car: 'evo_lite', tax: 340000 },
            { name: 'TỐNG VĂN SONG', car: 'evo_grand', tax: 480000 },
            { name: 'NGUYỄN QUỐC HOÀNG', car: 'flazz', tax: 320000 },
            { name: 'NGUYỄN THỊ SÔNG HƯƠNG', car: 'evo_grand_lite', tax: 378000 },
            { name: 'NGUYỄN THỊ HẢO', car: 'evo_grand_lite', tax: 0 },
            { name: 'HOÀNG KHÁNH TRÂM', car: 'evo_grand', tax: 480000 },
            { name: 'ĐỖ CÔNG VƯỢNG', car: 'evo_grand_lite', tax: 378000 },
            { name: 'LÊ THỊ LỘC', car: 'evo_lite', tax: 340000 }
        ];

        let changed = false;
        if (!state.records) state.records = [];
        
        newRecords.forEach(r => {
            if (!state.records.find(x => x.customerName && x.customerName.trim().toUpperCase() === r.name.trim().toUpperCase())) {
                state.records.push({
                    id: Date.now().toString() + Math.floor(Math.random()*1000),
                    customerName: r.name,
                    carType: r.car,
                    plateFee: r.skipPlatePolice ? r.tax : r.tax + 100000 + 105000,
                    platePaymentMethod: 'cash',
                    stage: 1,
                    actualCost: r.skipPlatePolice ? r.tax : r.tax + 100000 + 105000,
                    taxCost: r.tax,
                    policeCost: r.skipPlatePolice ? 0 : 100000,
                    plateCost: r.skipPlatePolice ? 0 : 105000,
                    hasTaxCode: true
                });
                changed = true;
            }
        });
        
        let khue = state.records.find(r => r.customerName.trim().toUpperCase() === 'LÊ PHẠM HUỲNH BÁ KHUÊ');
        if (khue && khue.taxCost === 0) {
            khue.taxCost = 480000;
            khue.actualCost = 480000;
            khue.plateFee = 480000;
            khue.policeCost = 0;
            khue.plateCost = 0;
            changed = true;
        }
        
        if (changed) {
            await supabase.from('app_state').upsert({ id: 'main_store', data: state });
        }
    } catch (e) {
        console.error("Lỗi:", e);
    }
    
    // Cleanup old UI state
    document.getElementById('loadingOverlay')?.remove();

    switchView(state.currentView);
    updateStats();
}

function applyStateDefaults() {
    if (state.totalRemitted === undefined) state.totalRemitted = 0;
    if (state.expenses === undefined) state.expenses = [];
    if (state.currentView === undefined) state.currentView = 'dashboard';
    if (state.tasks === undefined) {
        state.tasks = [
            { id: 't1', text: 'Báo lệnh sửa chữa lên hệ thống DMS', completed: false },
            { id: 't2', text: 'Nhập footprint khách hàng lên hệ thống Kosmos', completed: false },
            { id: 't3', text: 'Sắp xếp nhân sự đi Khai báo thuế và làm thủ tục Bấm biển số cho khách', completed: false },
            { id: 't4', text: 'Làm hồ sơ Claim cho các khách hàng mua lẻ xe', completed: false },
            { id: 't5', text: 'Nhắc NV: Tiền bảo dưỡng & phụ tùng ngoài chuyển vào tài khoản Chị', completed: false },
            { id: 't6', text: 'Nhắc NV: Tiền xuất hàng chính hãng VinFast chuyển STK Công ty hoặc thu Tiền mặt', completed: false },
            { id: 't7', text: 'Tổng kết các giao dịch khách mua xe cà thẻ trong hôm nay', completed: false },
            { id: 't8', text: 'Check mail liên tục, theo dõi mail đặt Pin 2 cho khách', completed: false }
        ];
    }
    if (state.carTypes === undefined) {
        state.carTypes = [
            { id: 'evo_grand', name: 'EVO GRAND (Có bằng)', fee: 685000 },
            { id: 'evo_lite', name: 'EVO LITE (Không bằng)', fee: 345000 },
            { id: 'feliz_2025', name: 'Feliz 2025', fee: 518000+205000 },
            { id: 'evo_grand_lite', name: 'EVO GRAND LITE', fee: 378000+205000 },
            { id: 'feliz_2', name: 'FELIZ 2', fee: 498000+205000 },
            { id: 'flazz', name: 'Flazz', fee: 320000+205000 }
        ];
    }
}

function loadLocalFallback() {
    const savedState = localStorage.getItem('motodash_state');
    if (savedState) {
        state = JSON.parse(savedState);
    }
    applyStateDefaults();
}

async function saveState() {
    // Lưu Local Backup
    localStorage.setItem('motodash_state', JSON.stringify(state));
    updateStats();
    
    // Lưu lên Supabase
    try {
        await supabase.from('app_state').upsert({ id: 'main_store', data: state });
    } catch (e) {
        console.error("Lỗi lưu Supabase:", e);
    }
}

// Format Currency & Date
function formatMoney(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
}

// Navigation
function switchView(viewName) {
    state.currentView = viewName;
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navEl = document.getElementById(`nav-${viewName}`);
    if (navEl) navEl.classList.add('active');

    if (viewName === 'dashboard') {
        document.getElementById('dashboardView').style.display = 'block';
        document.getElementById('tableView').style.display = 'none';
        document.getElementById('expensesView').style.display = 'none';
        document.getElementById('settingsView').style.display = 'none';
        renderBoard();
    } else if (viewName === 'table') {
        document.getElementById('dashboardView').style.display = 'none';
        document.getElementById('tableView').style.display = 'block';
        document.getElementById('expensesView').style.display = 'none';
        document.getElementById('settingsView').style.display = 'none';
        renderTable();
    } else if (viewName === 'expenses') {
        document.getElementById('dashboardView').style.display = 'none';
        document.getElementById('tableView').style.display = 'none';
        document.getElementById('expensesView').style.display = 'block';
        document.getElementById('settingsView').style.display = 'none';
        renderExpenses();
    } else if (viewName === 'settings') {
        document.getElementById('dashboardView').style.display = 'none';
        document.getElementById('tableView').style.display = 'none';
        document.getElementById('expensesView').style.display = 'none';
        document.getElementById('settingsView').style.display = 'block';
        renderSettings();
    }
}

// Expose app methods
window.app.openExpenseModal = () => { document.getElementById('expenseModal').classList.add('active'); };
window.app.closeExpenseModal = () => { 
    document.getElementById('expenseModal').classList.remove('active'); 
    document.getElementById('expenseForm').reset();
};
window.app.submitExpenseForm = (e) => {
    e.preventDefault();
    const newExpense = {
        id: Date.now().toString(),
        type: document.getElementById('expenseType').value,
        amount: Number(document.getElementById('expenseAmount').value),
        reason: document.getElementById('expenseReason').value,
        payer: document.getElementById('expensePayer').value,
        date: new Date().toISOString()
    };
    state.expenses = state.expenses || [];
    state.expenses.push(newExpense);
    saveState();
    window.app.closeExpenseModal();
    window.app.updateStats();
    if (state.currentView === 'expenses') {
        renderExpenses();
    } else {
        alert("Đã lưu thành công vào Sổ Thu/Chi!");
    }
};

// Render Settings (Car Types)
function renderSettings() {
    const tbody = document.getElementById('carTypesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    let types = state.carTypes || [];
    types.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><code>${c.id}</code></td>
            <td style="font-weight: 500;">${c.name}</td>
            <td style="color: var(--brand-orange);">${formatMoney(c.fee)} đ</td>
            <td>
                <button class="btn-outline-small" style="padding: 4px 8px;" onclick="window.app.editCarType('${c.id}')"><i data-lucide="edit-2" style="width: 14px; height: 14px;"></i></button>
                <button class="btn-outline-small" style="padding: 4px 8px; color: var(--status-red); border-color: rgba(239, 68, 68, 0.3);" onclick="window.app.deleteCarType('${c.id}')"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    lucide.createIcons();
    updateCarTypeDropdowns();
}

function updateCarTypeDropdowns() {
    let types = state.carTypes || [];
    let optionsHtml = types.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    optionsHtml += `<option value="other">Loại khác (Tự nhập)</option>`;
    
    const carTypeSelect = document.getElementById('carType');
    if (carTypeSelect) {
        let currentVal = carTypeSelect.value;
        carTypeSelect.innerHTML = optionsHtml;
        if (types.find(t => t.id === currentVal) || currentVal === 'other') carTypeSelect.value = currentVal;
    }
}

// Car Type Modal Actions
window.app.addCarType = () => {
    document.getElementById('carTypeModalTitle').innerText = "Thêm Loại Xe Mới";
    document.getElementById('editCarTypeId').value = '';
    document.getElementById('carTypeIdInput').value = '';
    document.getElementById('carTypeIdInput').disabled = false;
    document.getElementById('carTypeNameInput').value = '';
    document.getElementById('carTypeFeeInput').value = '';
    document.getElementById('carTypeModal').classList.add('active');
};

window.app.editCarType = (id) => {
    let c = state.carTypes.find(x => x.id === id);
    if (!c) return;
    document.getElementById('carTypeModalTitle').innerText = "Sửa Loại Xe";
    document.getElementById('editCarTypeId').value = c.id;
    document.getElementById('carTypeIdInput').value = c.id;
    document.getElementById('carTypeIdInput').disabled = true; // Không cho sửa ID
    document.getElementById('carTypeNameInput').value = c.name;
    document.getElementById('carTypeFeeInput').value = c.fee;
    document.getElementById('carTypeModal').classList.add('active');
};

window.app.deleteCarType = (id) => {
    if (confirm(`Bạn có chắc muốn xóa loại xe ${id} không?`)) {
        state.carTypes = state.carTypes.filter(x => x.id !== id);
        saveState();
        renderSettings();
    }
};

window.app.closeCarTypeModal = () => {
    document.getElementById('carTypeModal').classList.remove('active');
};

window.app.submitCarTypeForm = (e) => {
    e.preventDefault();
    let editId = document.getElementById('editCarTypeId').value;
    let inputId = document.getElementById('carTypeIdInput').value.trim().toLowerCase();
    let name = document.getElementById('carTypeNameInput').value.trim();
    let fee = Number(document.getElementById('carTypeFeeInput').value) || 0;
    
    state.carTypes = state.carTypes || [];
    
    if (editId) {
        let c = state.carTypes.find(x => x.id === editId);
        if (c) {
            c.name = name;
            c.fee = fee;
        }
    } else {
        if (state.carTypes.find(x => x.id === inputId)) {
            alert("Mã xe này đã tồn tại! Vui lòng chọn mã khác.");
            return;
        }
        state.carTypes.push({ id: inputId, name: name, fee: fee });
    }
    
    saveState();
    window.app.closeCarTypeModal();
    renderSettings();
};

window.app.autoFillFees = () => {
    const type = document.getElementById('carType').value;
    const plateFeeEl = document.getElementById('plateFee');
    const actualCostEl = document.getElementById('actualCost');
    if (type === 'evo_grand') {
        plateFeeEl.value = 1000000;
        actualCostEl.value = 685000;
    } else if (type === 'evo_lite') {
        plateFeeEl.value = 800000;
        actualCostEl.value = 545000;
    }
};

window.app.openModal = () => { 
    document.getElementById('addModal').classList.add('active'); 
    window.app.autoFillFees(); // Fill default values
};
window.app.closeModal = () => { 
    document.getElementById('addModal').classList.remove('active'); 
    document.getElementById('recordForm').reset();
};
window.app.submitForm = (e) => {
    e.preventDefault();
    const newRecord = {
        id: Date.now().toString(),
        customerName: document.getElementById('customerName').value,
        carPrice: 0,
        carPaymentMethod: 'cash',
        plateFee: Number(document.getElementById('plateFee').value),
        platePaymentMethod: document.getElementById('platePaymentMethod').value,
        actualCost: Number(document.getElementById('actualCost').value) || 0,
        hasTaxCode: document.getElementById('hasTaxCode').checked,
        stage: 1, 
        taxPaidBy: null, fee105kPaidBy: null, fee100kPaidBy: null, staffReimbursed: 0,
        taxDate: '', pressPlateDate: '', sendServiceDate: '', callCustomerDate: '',
        deliverCarDate: '', plateNumber: '', promisePlateDate: '', regNote: '',
        plateNote: '', receivePlateDate: '', deliverPlateDate: '', deliverStaff: ''
    };
    state.records.push(newRecord);
    saveState();
    window.app.closeModal();
    state.currentView === 'dashboard' ? renderBoard() : renderTable();
};

window.app.openEditModal = (id) => {
    const record = state.records.find(r => r.id === id);
    if (!record) return;
    
    document.getElementById('editId').value = record.id;
    document.getElementById('editCustomerName').value = record.customerName;
    document.getElementById('editPlateNumber').value = record.plateNumber || '';
    document.getElementById('editPlatePaymentMethod').value = record.platePaymentMethod || 'cash';
    document.getElementById('editHasTaxCode').checked = record.hasTaxCode;
    
    // Check if editTaxCost exists before assigning, otherwise fallback to backward compatible properties
    if (document.getElementById('editTaxCost')) {
        document.getElementById('editTaxCost').value = record.taxCost || 0;
        document.getElementById('editPlateCost').value = record.plateCost || 0;
        document.getElementById('editPoliceCost').value = record.policeCost || 0;
        document.getElementById('editStaffReimbursed').value = record.staffReimbursed || 0;
    }

    document.getElementById('editTaxDate').value = record.taxDate || '';
    document.getElementById('editPayTaxDate').value = record.payTaxDate || '';
    document.getElementById('editPayPlateDate').value = record.payPlateDate || '';
    document.getElementById('editPayPoliceDate').value = record.payPoliceDate || '';
    
    if (document.getElementById('editTaxSource')) {
        document.getElementById('editTaxSource').value = record.taxSource || record.taxPaidBy || 'store';
        document.getElementById('editPlateSource').value = record.plateSource || record.fee105kPaidBy || 'store';
        document.getElementById('editPoliceSource').value = record.policeSource || record.fee100kPaidBy || 'store';
    }

    document.getElementById('editPressPlateDate').value = record.pressPlateDate || '';
    document.getElementById('editSendServiceDate').value = record.sendServiceDate || '';
    document.getElementById('editCallCustomerDate').value = record.callCustomerDate || '';
    document.getElementById('editDeliverCarDate').value = record.deliverCarDate || '';
    document.getElementById('editPromisePlateDate').value = record.promisePlateDate || '';
    document.getElementById('editReceivePlateDate').value = record.receivePlateDate || '';
    document.getElementById('editDeliverPlateDate').value = record.deliverPlateDate || '';
    document.getElementById('editDeliverStaff').value = record.deliverStaff || '';
    document.getElementById('editRegNote').value = record.regNote || '';
    document.getElementById('editPlateNote').value = record.plateNote || '';
    
    document.getElementById('editModal').classList.add('active');
};

window.app.closeEditModal = () => {
    document.getElementById('editModal').classList.remove('active');
    document.getElementById('editForm').reset();
};

window.app.submitEditForm = (e) => {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const record = state.records.find(r => r.id === id);
    if (record) {
        record.customerName = document.getElementById('editCustomerName').value;
        record.plateNumber = document.getElementById('editPlateNumber').value;
        if (document.getElementById('editPlatePaymentMethod')) {
            record.platePaymentMethod = document.getElementById('editPlatePaymentMethod').value;
        }
        record.hasTaxCode = document.getElementById('editHasTaxCode').checked;
        
        if (document.getElementById('editTaxCost')) {
            record.taxCost = Number(document.getElementById('editTaxCost').value) || 0;
            record.plateCost = Number(document.getElementById('editPlateCost').value) || 0;
            record.policeCost = Number(document.getElementById('editPoliceCost').value) || 0;
            record.staffReimbursed = Number(document.getElementById('editStaffReimbursed').value) || 0;
            record.actualCost = record.taxCost + record.plateCost + record.policeCost;
        }
        
        record.taxDate = document.getElementById('editTaxDate').value;
        record.payTaxDate = document.getElementById('editPayTaxDate').value;
        record.payPlateDate = document.getElementById('editPayPlateDate').value;
        record.payPoliceDate = document.getElementById('editPayPoliceDate').value;
        
        if (document.getElementById('editTaxSource')) {
            record.taxSource = document.getElementById('editTaxSource').value;
            record.plateSource = document.getElementById('editPlateSource').value;
            record.policeSource = document.getElementById('editPoliceSource').value;
        }

        record.pressPlateDate = document.getElementById('editPressPlateDate').value;
        record.sendServiceDate = document.getElementById('editSendServiceDate').value;
        record.callCustomerDate = document.getElementById('editCallCustomerDate').value;
        record.deliverCarDate = document.getElementById('editDeliverCarDate').value;
        record.promisePlateDate = document.getElementById('editPromisePlateDate').value;
        record.receivePlateDate = document.getElementById('editReceivePlateDate').value;
        record.deliverPlateDate = document.getElementById('editDeliverPlateDate').value;
        record.deliverStaff = document.getElementById('editDeliverStaff').value;
        record.regNote = document.getElementById('editRegNote').value;
        record.plateNote = document.getElementById('editPlateNote').value;
        
        // Tự động nhảy cột (stage) dựa trên dữ liệu đã nhập
        let autoStage = 1;
        if (record.payTaxDate) autoStage = 2; // Đã nộp thuế -> Chờ bấm biển
        if (record.pressPlateDate || (record.plateNumber && record.plateNumber.trim() !== '')) autoStage = 3; // Đã bấm biển / Có biển -> Chờ đóng 105k
        if (record.payPlateDate) autoStage = 4; // Đã đóng 105k -> Chờ lấy biển 100k
        if (record.receivePlateDate) autoStage = 5; // Đã lấy biển -> Hoàn thành
        
        // Chỉ đẩy thẻ đi tới, không tự động kéo thẻ lùi lại để tránh mất thao tác thủ công của người dùng
        if (autoStage > record.stage) {
            record.stage = autoStage;
        }

        saveState();
        window.app.closeEditModal();
        updateStats(); // Update calculations immediately
        state.currentView === 'dashboard' ? renderBoard() : renderTable();
    }
};

window.app.deleteRecord = () => {
    const id = document.getElementById('editId').value;
    const record = state.records.find(r => r.id === id);
    if (!record) return;
    
    if (confirm(`Bạn có chắc muốn xóa vĩnh viễn hồ sơ của khách hàng "${record.customerName}" không?`)) {
        state.records = state.records.filter(r => r.id !== id);
        saveState();
        window.app.closeEditModal();
        updateStats();
        state.currentView === 'dashboard' ? renderBoard() : renderTable();
    }
};

// Drag & Drop
window.app.allowDrop = (e) => e.preventDefault();
window.app.drag = (e) => e.dataTransfer.setData("text", e.target.id);
window.app.drop = (e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text");
    const column = e.target.closest('.column-body');
    if (column) {
        const newStage = parseInt(column.id.split('-')[1]);
        const recordId = data.replace('task-', '');
        const recordIndex = state.records.findIndex(r => r.id === recordId);
        if (recordIndex > -1) {
            const record = state.records[recordIndex];
            record.stage = newStage;
            if (newStage >= 2 && !record.taxPaidBy) record.taxPaidBy = record.platePaymentMethod === 'cash' ? 'staff' : 'owner';
            if (newStage >= 3 && !record.fee105kPaidBy) record.fee105kPaidBy = record.platePaymentMethod === 'cash' ? 'staff' : 'owner';
            if (newStage >= 4 && !record.fee100kPaidBy) record.fee100kPaidBy = record.platePaymentMethod === 'cash' ? 'staff' : 'owner';
            saveState();
            renderBoard();
        }
    }
};

window.app.reimburseAdvance = () => {
    let availableFund = calculateCurrentFund();
    if (availableFund <= 0) { alert("Quỹ tiền mặt đã hết, không thể hoàn ứng lúc này!"); return; }
    let totalAdvancedNotReimbursed = 0;
    state.records.forEach(r => {
        let actualTax = r.taxCost || (r.actualCost > 0 ? r.actualCost - 205000 : 0);
        let actualPlate = r.plateCost || (r.actualCost > 0 ? 105000 : 0);
        let actualPolice = r.policeCost || (r.actualCost > 0 ? 100000 : 0);

        let advancedForRecord = 0;
        if ((r.payTaxDate || r.stage >= 2) && r.taxSource !== 'store') advancedForRecord += actualTax;
        if ((r.payPlateDate || r.stage >= 4) && r.plateSource !== 'store') advancedForRecord += actualPlate;
        if ((r.payPoliceDate || r.stage >= 4) && r.policeSource !== 'store') advancedForRecord += actualPolice;
        
        let pendingReimbursement = advancedForRecord - (r.staffReimbursed || 0);
        if (pendingReimbursement > 0 && availableFund > 0) {
            let amountToReimburse = Math.min(pendingReimbursement, availableFund);
            r.staffReimbursed += amountToReimburse;
            availableFund -= amountToReimburse;
            totalAdvancedNotReimbursed += amountToReimburse;
        }
    });
    if (totalAdvancedNotReimbursed > 0) {
        saveState();
        alert(`Đã rút ${formatMoney(totalAdvancedNotReimbursed)} từ quỹ để hoàn ứng vào túi bạn!`);
    } else { alert("Bạn không có khoản ứng nào cần hoàn!"); }
};

window.app.remitCash = () => {
    let currentFund = calculateCurrentFund();
    if (currentFund <= INITIAL_FUND) { alert(`Quỹ hiện tại là ${formatMoney(currentFund)}, không có dôi dư.`); return; }
    let excessAmount = currentFund - INITIAL_FUND;
    if (confirm(`Bạn sẽ nộp ${formatMoney(excessAmount)} về công ty để chốt quỹ. Xác nhận?`)) {
        state.totalRemitted += excessAmount;
        saveState();
        alert(`Đã nộp thành công! Quỹ hiện tại đã reset về ${formatMoney(INITIAL_FUND)}.`);
        window.location.reload();
    }
};

window.app.undoRemitCash = () => {
    if ((state.totalRemitted || 0) > 0) {
        if(confirm(`Bạn có chắc muốn HỦY CHỐT QUỸ và khôi phục lại ${formatMoney(state.totalRemitted)} vào két sắt?`)) {
            state.totalRemitted = 0;
            saveState();
            alert("Đã khôi phục thành công! Tiền đã về lại Két Sắt.");
            window.location.reload();
        }
    } else {
        alert("Bạn chưa chốt khoản nào cả!");
    }
};

// Calculations
function calculateCurrentFund() {
    let totalCashIn = 0; let totalReimbursed = 0; let otherFundChanges = 0;
    state.records.forEach(r => {
        let expectedCost = 0;
        let actualTax = r.taxCost || (r.actualCost > 0 ? r.actualCost - 205000 : 0);
        let actualPlate = r.plateCost || (r.actualCost > 0 ? 105000 : 0);
        let actualPolice = r.policeCost || (r.actualCost > 0 ? 100000 : 0);
        expectedCost = actualTax + actualPlate + actualPolice;

        if (r.carPaymentMethod === 'cash') totalCashIn += (Number(r.carPrice) || 0);
        if (r.platePaymentMethod === 'cash') {
            totalCashIn += (Number(r.plateFee) || 0); // Khách nộp tiền mặt vào quỹ
            totalCashIn -= expectedCost; // Quỹ xuất tiền mặt giao cho NV để đi đóng phí
        }
        totalReimbursed += (Number(r.staffReimbursed) || 0);
    });

    if(state.expenses) {
        state.expenses.forEach(e => {
            if(e.payer === 'fund') {
                if(e.type === 'chi') otherFundChanges -= e.amount;
                if(e.type === 'thu') otherFundChanges += e.amount;
            }
        });
    }
    return INITIAL_FUND + totalCashIn - totalReimbursed + otherFundChanges - (state.totalRemitted || 0);
}

function updateStats() {
    let transferToOwner = 0;
    let totalCashHeldByStaff = 0;
    let totalPoliceCashNeeded = 0;
    let totalTaxPlateCashNeeded = 0;
    let staffAdvance = 0;
    state.records.forEach(r => {
        if (r.carPaymentMethod === 'transfer') transferToOwner += r.carPrice;
        if (r.platePaymentMethod === 'transfer') transferToOwner += r.plateFee;
        
        let autoStage = 1;
        if (r.payTaxDate) autoStage = 2;
        if (r.pressPlateDate || (r.plateNumber && r.plateNumber.trim() !== '')) autoStage = 3;
        if (r.payPlateDate) autoStage = 4;
        if (r.receivePlateDate) autoStage = 5;
        if (!r.stage || autoStage > r.stage) r.stage = autoStage;

        let actualTax = r.taxCost || (r.actualCost > 0 ? r.actualCost - 205000 : 0);
        let actualPlate = r.plateCost || (r.actualCost > 0 ? 105000 : 0);
        let actualPolice = r.policeCost || (r.actualCost > 0 ? 100000 : 0);
        
        let expectedCost = actualTax + actualPlate + actualPolice;

        // Tự động tính Hẹn trả biển (15 ngày) nếu đã có ngày nộp phí biển mà chưa có hẹn
        if (r.payPlateDate && !r.promisePlateDate) {
            let d = new Date(r.payPlateDate);
            d.setDate(d.getDate() + 15);
            r.promisePlateDate = d.toISOString().split('T')[0];
        }
        let totalPaidStore = 0;
        let advancedForRecord = 0;

        if (r.payTaxDate || r.stage >= 2) {
            if (r.taxSource === 'staff' || r.taxPaidBy === 'staff') advancedForRecord += actualTax;
            else totalPaidStore += actualTax;
        }
        if (r.payPlateDate || r.stage >= 4) {
            if (r.plateSource === 'staff' || r.fee105kPaidBy === 'staff') advancedForRecord += actualPlate;
            else totalPaidStore += actualPlate;
        }
        if (r.payPoliceDate || r.stage >= 4) {
            if (r.policeSource === 'staff' || r.fee100kPaidBy === 'staff') advancedForRecord += actualPolice;
            else totalPaidStore += actualPolice;
        }

        let staffReimbursed = r.staffReimbursed || 0;

        let totalCost = 0;
        if (r.payTaxDate || r.stage >= 2) totalCost += actualTax;
        if (r.payPlateDate || r.stage >= 4) totalCost += actualPlate;
        if (r.payPoliceDate || r.stage >= 4) totalCost += actualPolice;

        // Theo yêu cầu: cái nào nộp rồi trừ ra khỏi tiền đang giữ luôn
        // Tiền đang giữ = Tổng dự kiến - Tổng đã nộp (bất kể nguồn nào)
        let currentCash = expectedCost - totalCost;
        if (currentCash > 0) {
            totalCashHeldByStaff += currentCash;
            
            let isPolicePaid = r.payPoliceDate || r.stage >= 4;
            let policeSource = r.policeSource || r.fee100kPaidBy || 'store';
            if (!isPolicePaid && policeSource === 'store') {
                totalPoliceCashNeeded += actualPolice;
            }
            
            let isTaxPaid = r.payTaxDate || r.stage >= 2;
            let taxSource = r.taxSource || r.taxPaidBy || 'store';
            if (!isTaxPaid && taxSource === 'store') {
                totalTaxPlateCashNeeded += actualTax;
            }
            
            let isPlatePaid = r.payPlateDate || r.stage >= 4;
            let plateSource = r.plateSource || r.fee105kPaidBy || 'store';
            if (!isPlatePaid && plateSource === 'store') {
                totalTaxPlateCashNeeded += actualPlate;
            }
        }
        
        let pendingReimbursement = advancedForRecord - staffReimbursed;
        if (pendingReimbursement > 0) {
            staffAdvance += pendingReimbursement;
        }
    });
    
    if(state.expenses) {
        state.expenses.forEach(e => {
            if(e.payer === 'staff') {
                if(e.type === 'chi') staffAdvance += e.amount;
                if(e.type === 'thu') staffAdvance -= e.amount;
            }
        });
    }

    // Set UI stats
    document.getElementById('stat-cash').innerText = formatMoney(calculateCurrentFund());
    document.getElementById('stat-transfer').innerText = formatMoney(transferToOwner);
    document.getElementById('stat-staff-holding').innerText = formatMoney(totalCashHeldByStaff);
    document.getElementById('stat-owner-pending').innerText = formatMoney(staffAdvance);
    
    if (document.getElementById('stat-police-cash')) {
        document.getElementById('stat-police-cash').innerText = `⚠️ Chờ nộp CA: ${formatMoney(totalPoliceCashNeeded)}`;
    }
    if (document.getElementById('stat-taxplate-cash')) {
        document.getElementById('stat-taxplate-cash').innerText = `⚠️ Chờ nộp Thuế/Biển: ${formatMoney(totalTaxPlateCashNeeded)}`;
    }
    
    // Update chart
    if(window.app.renderChart) window.app.renderChart();
}

// Render Board (Kanban)
function renderBoard() {
    for (let i = 1; i <= 5; i++) {
        const stageEl = document.getElementById(`stage-${i}`);
        if(stageEl) stageEl.innerHTML = '';
        const countEl = document.getElementById(`count-stage-${i}`);
        if(countEl) countEl.textContent = '0';
    }
    const counts = { 1:0, 2:0, 3:0, 4:0, 5:0 };
    const moneySums = { 1:0, 2:0, 3:0, 4:0, 5:0 };
    state.records.forEach(r => {
        // Auto-sync stage based on dates if stage is lagging behind
        let autoStage = 1;
        if (r.payTaxDate) autoStage = 2;
        if (r.pressPlateDate || (r.plateNumber && r.plateNumber.trim() !== '')) autoStage = 3;
        if (r.payPlateDate) autoStage = 4;
        if (r.receivePlateDate) autoStage = 5;
        if (!r.stage || autoStage > r.stage) r.stage = autoStage;

        const stageBody = document.getElementById(`stage-${r.stage}`);
        if (stageBody) {
            counts[r.stage]++;
            
            // Tally money for stages
            if (r.stage === 2) {
                let actualTax = r.taxCost || (r.actualCost > 0 ? r.actualCost - 205000 : 0);
                moneySums[2] += actualTax;
            } else if (r.stage === 3) {
                let actualPlate = r.plateCost || (r.actualCost > 0 ? 105000 : 0);
                moneySums[3] += actualPlate;
            } else if (r.stage === 4) {
                let actualPolice = r.policeCost || (r.actualCost > 0 ? 100000 : 0);
                moneySums[4] += actualPolice;
            }
            
            let paymentTag = '';
            if (r.platePaymentMethod === 'cash') {
                paymentTag = `<span class="payment-tag tag-cash">Tiền mặt</span>`;
            } else if (r.platePaymentMethod === 'transfer') {
                paymentTag = `<span class="payment-tag tag-transfer">Chuyển khoản</span>`;
            } else {
                paymentTag = `<span class="payment-tag" style="background: rgba(148, 163, 184, 0.1); color: var(--text-secondary); border-color: rgba(148, 163, 184, 0.2);">CHƯA XĐ</span>`;
            }
            let highlightClass = ''; let actionText = '';
            
            let actualTax = r.taxCost || (r.actualCost > 0 ? r.actualCost - 205000 : 0);
            let actualPlate = r.plateCost || (r.actualCost > 0 ? 105000 : 0);
            let actualPolice = r.policeCost || (r.actualCost > 0 ? 100000 : 0);
            let expectedCost = actualTax + actualPlate + actualPolice;

            // Tự động tính Hẹn trả biển (15 ngày) nếu đã có ngày nộp phí biển mà chưa có hẹn
            if (r.payPlateDate && !r.promisePlateDate) {
                let d = new Date(r.payPlateDate);
                d.setDate(d.getDate() + 15);
                r.promisePlateDate = d.toISOString().split('T')[0];
            }

            let totalPaidStore = 0;
            let advancedForRecord = 0;

            let totalCost = 0;
            if (r.payTaxDate || r.stage >= 2) totalCost += actualTax;
            if (r.payPlateDate || r.stage >= 4) totalCost += actualPlate;
            if (r.payPoliceDate || r.stage >= 4) totalCost += actualPolice;

            if (r.payTaxDate || r.stage >= 2) {
                if (r.taxSource === 'staff' || r.taxPaidBy === 'staff') advancedForRecord += actualTax;
                else totalPaidStore += actualTax;
            }
            if (r.payPlateDate || r.stage >= 4) {
                if (r.plateSource === 'staff' || r.fee105kPaidBy === 'staff') advancedForRecord += actualPlate;
                else totalPaidStore += actualPlate;
            }
            if (r.payPoliceDate || r.stage >= 4) {
                if (r.policeSource === 'staff' || r.fee100kPaidBy === 'staff') advancedForRecord += actualPolice;
                else totalPaidStore += actualPolice;
            }

            let staffReimbursed = r.staffReimbursed || 0;
            let currentCash = expectedCost - totalCost;
            let pendingReimbursement = advancedForRecord - staffReimbursed;

            let debtBadge = '';
            let badges = [];
            if (currentCash > 0) {
                badges.push(`<span class="debt-badge" style="background: rgba(16, 185, 129, 0.1); color: var(--brand-green); border-color: rgba(16, 185, 129, 0.2)">Chờ nộp: ${formatMoney(currentCash)}</span>`);
            } else if (currentCash === 0 && expectedCost > 0) {
                badges.push(`<span class="debt-badge" style="background: #f1f5f9; color: #64748b; border-color: #cbd5e1">Đã chi hết tạm ứng</span>`);
            }
            debtBadge = badges.join(' ');
            
            if (r.stage === 1 && r.hasTaxCode === false) {
                highlightClass = 'owner-action-needed';
                actionText += '<div class="text-danger" style="font-size: 11px; margin-top: 8px;"><i data-lucide="alert-triangle" style="width:12px; height:12px;"></i> Đợi đăng ký MST (2-3 ngày)</div>';
            }
            const plateDisplay = r.plateNumber ? `<div style="font-size: 12px; font-weight: 700; color: var(--accent-blue); margin-top: 4px;">BS: ${r.plateNumber}</div>` : '';
            const cardHTML = `
                <div class="task-card ${highlightClass}" id="task-${r.id}" draggable="true" ondragstart="window.app.drag(event)" ondblclick="window.app.openEditModal('${r.id}')">
                    <div class="task-title">${r.customerName}</div>
                    <div class="task-meta">
                        <div class="meta-row">
                            <span>Tạm ứng: ${formatMoney(expectedCost)}</span>
                            ${paymentTag}
                        </div>
                    </div>
                    ${plateDisplay}
                    ${actionText}
                </div>
            `;
            stageBody.insertAdjacentHTML('beforeend', cardHTML);
        }
    });
    for (let i = 1; i <= 5; i++) {
        const countEl = document.getElementById(`count-stage-${i}`);
        if(countEl) countEl.textContent = counts[i];
        
        const moneyEl = document.getElementById(`money-stage-${i}`);
        if (moneyEl) {
            if (moneySums[i] > 0) {
                moneyEl.textContent = `Tổng tiền cần: ${formatMoney(moneySums[i])}`;
                moneyEl.style.display = 'block';
            } else {
                moneyEl.style.display = 'none';
            }
        }
    }
    lucide.createIcons();
}

// Render Table
function renderTable() {
    const tbody = document.getElementById('tableBody');
    const tfoot = document.getElementById('tableFooter');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    let sumExpected = 0, sumTax = 0, sumPlate = 0, sumPolice = 0, sumTotalCost = 0;
    
    state.records.forEach(r => {
        let actualTax = r.taxCost || (r.actualCost > 0 ? r.actualCost - 205000 : 0);
        let actualPlate = r.plateCost || (r.actualCost > 0 ? 105000 : 0);
        let actualPolice = r.policeCost || (r.actualCost > 0 ? 100000 : 0);
        
        let expectedCost = actualTax + actualPlate + actualPolice;
        let totalPaidStore = 0;
        let advancedForRecord = 0;
        let totalCost = 0;

        if (r.payTaxDate || r.stage >= 2) {
            totalCost += actualTax;
            if (r.taxSource === 'staff' || r.taxPaidBy === 'staff') advancedForRecord += actualTax;
            else totalPaidStore += actualTax;
        }
        if (r.payPlateDate || r.stage >= 4) {
            totalCost += actualPlate;
            if (r.plateSource === 'staff' || r.fee105kPaidBy === 'staff') advancedForRecord += actualPlate;
            else totalPaidStore += actualPlate;
        }
        if (r.payPoliceDate || r.stage >= 4) {
            totalCost += actualPolice;
            if (r.policeSource === 'staff' || r.fee100kPaidBy === 'staff') advancedForRecord += actualPolice;
            else totalPaidStore += actualPolice;
        }
        
        sumExpected += expectedCost;
        if(actualTax > 0) sumTax += actualTax;
        if(actualPlate > 0) sumPlate += actualPlate;
        if(actualPolice > 0) sumPolice += actualPolice;
        sumTotalCost += totalCost;

        let staffReimbursed = r.staffReimbursed || 0;
        let currentCash = expectedCost - totalPaidStore - staffReimbursed;
        let pendingReimbursement = advancedForRecord - staffReimbursed;
        
        let badges = [];
        if (currentCash > 0) {
            badges.push(`<div class="badge green" style="margin-top: 4px;">Chờ nộp: ${formatMoney(currentCash)}</div>`);
        } else if (currentCash === 0 && expectedCost > 0) {
            badges.push(`<div class="badge" style="margin-top: 4px; background: #f1f5f9; color: #64748b;">Đã chi hết tạm ứng</div>`);
        }
        if (pendingReimbursement > 0) {
            badges.push(`<div class="badge red" style="margin-top: 4px;">Cần rút bù: ${formatMoney(pendingReimbursement)}</div>`);
        }

        let missingOrFullHtml = `
            <div style="text-align: left;">
                <div style="font-size: 11px; color: var(--text-secondary);">Nhận tạm ứng: <strong style="color: var(--text-primary);">${formatMoney(expectedCost)}</strong></div>
                ${totalCost > 0 ? `<div style="font-size: 11px; color: var(--text-secondary);">Đã chi: -${formatMoney(totalCost)}</div>` : ''}
                ${badges.join('')}
            </div>
        `;

        const moneyStyle = 'background: rgba(245, 158, 11, 0.03); border-left: 1px solid rgba(245, 158, 11, 0.1);';
        const moneyText = 'color: #F59E0B; font-weight: 600; font-size: 1.05em;';
        const totalStyle = 'background: rgba(16, 185, 129, 0.05); border-left: 1px solid rgba(16, 185, 129, 0.2);';
        
        let paymentMethodText = 'Tiền mặt';
        let paymentMethodClass = 'text-success';
        if (r.platePaymentMethod === 'transfer') {
            paymentMethodText = 'Chuyển khoản';
            paymentMethodClass = 'text-warning';
        } else if (r.platePaymentMethod === 'unknown') {
            paymentMethodText = 'Chưa xác định';
            paymentMethodClass = 'text-secondary';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <button class="btn-outline-small" onclick="window.app.openEditModal('${r.id}')">Sửa</button>
            </td>
            <td>${r.customerName}</td>
            <td>${formatDate(r.taxDate)}</td>
            <td style="background: rgba(59, 130, 246, 0.05);">
                <div style="font-weight: 700; color: #3B82F6;">${formatMoney(expectedCost)}</div>
                <small class="text-secondary">
                    Tạm ứng (Đủ)
                </small>
            </td>
            <td style="${moneyStyle}"><div style="${moneyText}">${formatMoney(actualTax)}</div><small class="${r.payTaxDate ? '' : 'text-secondary'}" style="${r.payTaxDate ? 'color: #10B981; font-weight: 600;' : ''}">${r.payTaxDate ? 'Đã nộp: ' + formatDate(r.payTaxDate) : 'Chưa nộp'}</small></td>
            <td>${formatDate(r.pressPlateDate)}</td>
            <td style="${moneyStyle}"><div style="${moneyText}">${formatMoney(actualPlate)}</div><small class="${r.payPlateDate ? '' : 'text-secondary'}" style="${r.payPlateDate ? 'color: #10B981; font-weight: 600;' : ''}">${r.payPlateDate ? 'Đã nộp: ' + formatDate(r.payPlateDate) : 'Chưa nộp'}</small></td>
            <td style="${moneyStyle}"><div style="${moneyText}">${formatMoney(actualPolice)}</div><small class="${r.payPoliceDate ? '' : 'text-secondary'}" style="${r.payPoliceDate ? 'color: #10B981; font-weight: 600;' : ''}">${r.payPoliceDate ? 'Đã nộp: ' + formatDate(r.payPoliceDate) : 'Chưa nộp'}</small></td>
            <td style="${totalStyle}"><strong style="color: #10B981; font-size: 1.1em;">${formatMoney(totalCost)}</strong></td>
            <td>${missingOrFullHtml}</td>
            <td>${formatDate(r.sendServiceDate)}</td>
            <td>${formatDate(r.callCustomerDate)}</td>
            <td>${formatDate(r.deliverCarDate)}</td>
            <td>${r.plateNumber || '...'}</td>
            <td>${formatDate(r.promisePlateDate)}</td>
            <td>${r.regNote || ''}</td>
            <td>${r.plateNote || ''}</td>
            <td>${formatDate(r.receivePlateDate)}</td>
            <td>${formatDate(r.deliverPlateDate)}</td>
            <td>${r.deliverStaff || ''}</td>
        `;
        tbody.appendChild(tr);
    });
    
    if (tfoot) {
        tfoot.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: right; padding-right: 16px;">TỔNG CỘNG:</td>
                <td style="color: #3B82F6;">${formatMoney(sumExpected)}</td>
                <td style="color: var(--text-primary);">${formatMoney(sumTax)}</td>
                <td style="color: var(--text-primary);">${formatMoney(sumPlate)}</td>
                <td style="color: var(--text-primary);">${formatMoney(sumPolice)}</td>
                <td style="color: #10B981; font-size: 1.1em;">${formatMoney(sumTotalCost)}</td>
                <td colspan="12"></td>
            </tr>
        `;
    }
}

function renderExpenses() {
    const tbody = document.getElementById('expensesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if(!state.expenses || state.expenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">Chưa có giao dịch nào</td></tr>';
        return;
    }

    const sortedExpenses = [...state.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedExpenses.forEach(e => {
        const tr = document.createElement('tr');
        const isChi = e.type === 'chi';
        const typeHtml = isChi 
            ? `<span class="badge red">Chi tiền</span>` 
            : `<span class="badge green">Thu tiền</span>`;
        const amountHtml = isChi
            ? `<span class="text-red">-${formatMoney(e.amount)}</span>`
            : `<span class="text-green">+${formatMoney(e.amount)}</span>`;
        const payerText = e.payer === 'staff' ? 'Nhân viên ứng' : 'Quỹ cửa hàng';

        tr.innerHTML = `
            <td>${formatDate(e.date)}</td>
            <td>${typeHtml}</td>
            <td>${e.reason}</td>
            <td>${amountHtml}</td>
            <td>${payerText}</td>
            <td>
                <button class="btn-outline-small" onclick="window.app.deleteExpense('${e.id}')" style="color: var(--status-red); border-color: rgba(239, 68, 68, 0.3);">Xóa</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.app.deleteExpense = (id) => {
    if(confirm('Bạn có chắc muốn xóa giao dịch này?')) {
        state.expenses = state.expenses.filter(e => e.id !== id);
        saveState();
        window.app.updateStats();
        if (state.currentView === 'expenses') renderExpenses();
    }
};

// End of modal logic

// Legacy injection scripts removed

// Auto-calculate Plate Promise Date (15 days after payPlateDate)
function attachPromiseDateAutoFill(payDateId, promiseDateId) {
    let payEl = document.getElementById(payDateId);
    if (payEl) {
        payEl.addEventListener('change', function(e) {
            if (this.value) {
                let promiseDateEl = document.getElementById(promiseDateId);
                if (promiseDateEl && !promiseDateEl.value) {
                    let payDate = new Date(this.value);
                    payDate.setDate(payDate.getDate() + 15);
                    promiseDateEl.value = payDate.toISOString().split('T')[0];
                }
            }
        });
    }
}
attachPromiseDateAutoFill('editPayPlateDate', 'editPromisePlateDate');
attachPromiseDateAutoFill('payPlateDate', 'promisePlateDate');

// --- TO-DO LIST LOGIC ---
window.app.toggleTodoPanel = () => {
    const panel = document.getElementById('todoPanel');
    if (panel.classList.contains('active')) {
        panel.classList.remove('active');
    } else {
        panel.classList.add('active');
        window.app.renderTodos();
        setTimeout(() => document.getElementById('newTodoInput').focus(), 300);
    }
};

window.app.renderTodos = () => {
    const list = document.getElementById('todoList');
    if (!list) return;
    
    if (!state.tasks) state.tasks = [];
    
    list.innerHTML = state.tasks.map(t => `
        <li class="todo-item ${t.completed ? 'completed' : ''}" id="todo-${t.id}">
            <input type="checkbox" class="todo-checkbox" ${t.completed ? 'checked' : ''} onchange="window.app.toggleTodo('${t.id}')">
            <span class="todo-text" onclick="window.app.toggleTodo('${t.id}')">${t.text}</span>
            <button class="todo-delete" onclick="window.app.deleteTodo('${t.id}')"><i data-lucide="trash-2" style="width:16px;height:16px"></i></button>
        </li>
    `).join('');
    lucide.createIcons();
};

window.app.addTodo = () => {
    const input = document.getElementById('newTodoInput');
    const text = input.value.trim();
    if (!text) return;
    
    if (!state.tasks) state.tasks = [];
    state.tasks.unshift({
        id: 'todo_' + Date.now(),
        text: text,
        completed: false
    });
    
    input.value = '';
    saveState();
    window.app.renderTodos();
};

window.app.toggleTodo = (id) => {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveState();
        window.app.renderTodos();
    }
};

window.app.deleteTodo = (id) => {
    if (confirm('Bạn có chắc muốn xóa công việc này?')) {
        state.tasks = state.tasks.filter(t => t.id !== id);
        saveState();
        window.app.renderTodos();
    }
};

// --- CHART LOGIC ---
let progressChartInstance = null;

window.app.renderChart = () => {
    const ctx = document.getElementById('progressChart');
    if (!ctx) return;
    
    const counts = { 1:0, 2:0, 3:0, 4:0, 5:0 };
    let totalProgressMoney = 0;
    state.records.forEach(r => {
        counts[r.stage]++;
        if (r.stage === 2) {
            totalProgressMoney += r.taxCost || (r.actualCost > 0 ? r.actualCost - 205000 : 0);
        } else if (r.stage === 3) {
            totalProgressMoney += r.plateCost || (r.actualCost > 0 ? 105000 : 0);
        } else if (r.stage === 4) {
            totalProgressMoney += r.policeCost || (r.actualCost > 0 ? 100000 : 0);
        }
    });
    
    const moneyEl = document.getElementById('progressTotalMoney');
    if (moneyEl) {
        if (totalProgressMoney > 0) moneyEl.textContent = `Tổng tiền đi nộp CA/Thuế: ${formatMoney(totalProgressMoney)}`;
        else moneyEl.textContent = '';
    }
    
    const data = [counts[1], counts[2], counts[3], counts[4], counts[5]];
    const total = data.reduce((a, b) => a + b, 0);
    
    const totalEl = document.getElementById('totalRecordsChart');
    if (totalEl) totalEl.innerText = total;
    
    if (progressChartInstance) {
        progressChartInstance.data.datasets[0].data = data;
        progressChartInstance.update();
    } else {
        progressChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Khai báo & HĐ', 'Chờ Bấm Biển', 'Chờ Đóng Phí', 'Chờ Lấy Biển', 'Hoàn Thành'],
                datasets: [{
                    data: data,
                    backgroundColor: ['#4B5563', '#2563EB', '#EA580C', '#7C3AED', '#21A05E'],
                    borderWidth: 0,
                    cutout: '75%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
    
    const legendEl = document.getElementById('chartLegend');
    if (legendEl) {
        const labels = ['Khai báo & HĐ', 'Chờ Bấm Biển', 'Chờ Đóng Phí', 'Chờ Lấy Biển', 'Hoàn Thành'];
        const colors = ['#4B5563', '#2563EB', '#EA580C', '#7C3AED', '#21A05E'];
        
        let legendHTML = '';
        labels.forEach((label, i) => {
            const val = data[i];
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            legendHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${colors[i]};"></span>
                        <span style="color: var(--text-secondary);">${label}</span>
                    </div>
                    <div style="display: flex; gap: 16px; font-weight: 600;">
                        <span>${val}</span>
                        <span style="color: var(--text-secondary); width: 32px; text-align: right;">${pct}%</span>
                    </div>
                </div>
            `;
        });
        legendEl.innerHTML = legendHTML;
    }
};

// --- MOBILE UI LOGIC ---
window.app.toggleSidebar = () => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
};
