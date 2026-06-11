// AdminApp/script.js
import { APPS_SCRIPT_URL } from './config.js';

// Global catalogs
let storeCatalog = [];
let giftCatalog = [];

// Global active selects for auto-close
const activeSelects = new Set();

// Selected states for Nhập Kho
let nhapSelectedStoreId = '';
let nhapStoreStock = {};

// Selected states for Cập Nhật
let capSelectedStoreId = '';
let selectedStoreStock = {};

// Current items in Nhập Kho
let nhapItems = [{ giftId: '', quantity: '' }];

// Current items in Cập Nhật
let capItems = [{ giftId: '', quantity: '' }];

// SearchableSelect class for managing custom selects
class SearchableSelect {
    constructor(inputElement, dropdownElement, options = [], onSelect = null) {
        this.input = inputElement;
        this.dropdown = dropdownElement;
        this.options = options; // Array of strings or {value, label}
        this.onSelect = onSelect;
        this.isOpen = false;
        this.isProgrammaticChange = false;
        
        activeSelects.add(this);
        this.init();
    }
    
    init() {
        // Toggle dropdown on input click
        this.input.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.isOpen) {
                this.hide();
            } else {
                this.show(true); // Always show all options when clicked directly
            }
        });
        
        // Filter on input typing
        this.input.addEventListener('input', () => {
            if (this.isProgrammaticChange) return;
            this.filter();
        });
        
        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.input.contains(e.target) && !this.dropdown.contains(e.target)) {
                this.hide();
            }
        });
    }
    
    updateOptions(newOptions) {
        this.options = newOptions;
        if (this.isOpen) {
            this.render(false);
        }
    }
    
    show(showAll = false) {
        // Close all other active dropdowns and clean up disconnected ones
        for (const inst of activeSelects) {
            if (!inst.input || !inst.input.isConnected) {
                activeSelects.delete(inst);
            } else if (inst !== this) {
                inst.hide();
            }
        }
        
        this.render(showAll);
        
        // Only show if there are options rendered (or if it's still open and has options)
        if (this.dropdown.children.length > 0) {
            this.dropdown.style.display = 'block';
            this.isOpen = true;
            this.input.parentElement.classList.add('open');
        } else {
            this.hide();
        }
    }
    
    hide() {
        this.dropdown.style.display = 'none';
        this.isOpen = false;
        this.input.parentElement.classList.remove('open');
    }
    
    render(showAll = false) {
        const query = showAll ? '' : this.input.value.trim().toLowerCase();
        const filtered = this.options.filter(opt => {
            const text = typeof opt === 'string' ? opt : opt.label;
            return text.toLowerCase().includes(query);
        });
        
        this.dropdown.innerHTML = '';
        if (filtered.length === 0) {
            // Close dropdown if no options match (treated as raw custom input)
            this.hide();
            return;
        }
        
        filtered.forEach(opt => {
            const item = document.createElement('div');
            item.className = 'select-item';
            item.textContent = typeof opt === 'string' ? opt : opt.label;
            
            item.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Prevents input from losing focus immediately
                e.stopPropagation();
                const val = typeof opt === 'string' ? opt : opt.value;
                this.isProgrammaticChange = true;
                this.input.value = typeof opt === 'string' ? opt : opt.label;
                this.hide();
                if (this.onSelect) {
                    this.onSelect(val);
                }
                this.isProgrammaticChange = false;
            });
            this.dropdown.appendChild(item);
        });
    }
    
    filter() {
        this.show(false);
    }
}

// Global select instances
const selectInstances = {};

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initDatabaseSetup();
    loadCatalogData();
});

// ─── TABS NAVIGATION ───
function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');

            const tabName = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            document.getElementById(`tab-${tabName}`).classList.remove('hidden');
            
            // Clear alert banner on tab change
            hideAlert();
        });
    });
}

// ─── UTILITIES: SHOW/HIDE ALERTS ───
function showAlert(message, type = 'success') {
    const alertBanner = document.getElementById('alert-banner');
    alertBanner.textContent = message;
    alertBanner.className = `alert ${type}`;
    alertBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Hide alert banner
function hideAlert() {
    const alertBanner = document.getElementById('alert-banner');
    alertBanner.className = 'alert hidden';
}

// ─── LOAD CATALOG DATA ───
async function loadCatalogData(isBackground = false) {
    const globalLoading = document.getElementById('global-loading');
    const tabsContainer = document.querySelector('.tabs');
    
    if (!isBackground) {
        globalLoading.classList.remove('hidden');
        tabsContainer.classList.add('hidden');
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    }

    try {
        // Fetch Stores
        const resStores = await fetch(`${APPS_SCRIPT_URL}?action=getStores`);
        const dataStores = await resStores.json();
        if (!dataStores.success) throw new Error(dataStores.error || 'Lỗi tải cửa hàng');
        storeCatalog = dataStores.stores;

        // Fetch Gifts
        const resGifts = await fetch(`${APPS_SCRIPT_URL}?action=getGifts`);
        const dataGifts = await resGifts.json();
        if (!dataGifts.success) throw new Error(dataGifts.error || 'Lỗi tải quà tặng');
        giftCatalog = dataGifts.gifts;

        // Update dropdown lists in selector instances
        const regions = [...new Set(storeCatalog.map(s => s.region.toUpperCase()))].filter(Boolean);
        if (selectInstances['nhap-region']) {
            selectInstances['nhap-region'].updateOptions(regions);
            selectInstances['cap-region'].updateOptions(regions);
        } else {
            initStoreSelector('nhap');
            initStoreSelector('cap');
        }

        renderCapItems();
        renderNhapItems();
        
        if (!isBackground) {
            globalLoading.classList.add('hidden');
            tabsContainer.classList.remove('hidden');
        }

        // Always ensure only the active tab content is shown, and other is hidden
        const activeTabBtn = document.querySelector('.tab-btn.active');
        const activeTabName = activeTabBtn ? activeTabBtn.getAttribute('data-tab') : 'nhap';
        
        document.querySelectorAll('.tab-content').forEach(content => {
            const contentId = content.getAttribute('id');
            if (contentId === `tab-${activeTabName}`) {
                content.classList.remove('hidden');
            } else {
                content.classList.add('hidden');
            }
        });
        
    } catch (err) {
        if (!isBackground) {
            globalLoading.classList.add('hidden');
        }
        showAlert(`Không thể kết nối API: ${err.message}.`, 'error');
    }
}


// ─── 4-TIER HIERARCHICAL STORE SELECTORS ───
function getStoreDetailsFromInputs(prefix) {
    const region = document.getElementById(`${prefix}-region`).value.trim();
    const type = document.getElementById(`${prefix}-type`).value.trim();
    const cum = type.toLowerCase() === 'outside' ? 'Outside' : document.getElementById(`${prefix}-cum`).value.trim();
    const name = document.getElementById(`${prefix}-store`).value.trim();
    return { region, type, cum, name };
}

function handleStoreCascade(prefix, changedField) {
    const regionInput = document.getElementById(`${prefix}-region`);
    const typeInput = document.getElementById(`${prefix}-type`);
    const cumGroup = document.getElementById(`${prefix}-cum-group`);
    const cumInput = document.getElementById(`${prefix}-cum`);
    const storeInput = document.getElementById(`${prefix}-store`);

    const rVal = regionInput.value.trim().toUpperCase();
    const tVal = typeInput.value.trim();
    // Capitalize type value for standard checks
    let normalizedType = tVal.charAt(0).toUpperCase() + tVal.slice(1).toLowerCase();
    if (tVal === '') normalizedType = '';
    const cVal = cumInput.value.trim();
    const sVal = storeInput.value.trim();

    // 1. Region changed
    if (changedField === 'region') {
        typeInput.value = '';
        cumInput.value = '';
        storeInput.value = '';
        cumGroup.classList.add('hidden');
        resetFormStoreSelection(prefix);

        const regions = [...new Set(storeCatalog.map(s => s.region.toUpperCase()))].filter(Boolean);
        if (regions.includes(rVal)) {
            const types = [...new Set(storeCatalog.filter(s => s.region.toUpperCase() === rVal).map(s => s.type))].filter(Boolean);
            selectInstances[`${prefix}-type`].updateOptions(types);
        } else {
            selectInstances[`${prefix}-type`].updateOptions(['Mall', 'Outside']);
        }
        selectInstances[`${prefix}-cum`].updateOptions([]);
        selectInstances[`${prefix}-store`].updateOptions([]);
    }

    // 2. Type changed
    else if (changedField === 'type') {
        cumInput.value = '';
        storeInput.value = '';
        resetFormStoreSelection(prefix);

        if (normalizedType === 'Outside') {
            cumGroup.classList.add('hidden');
            selectInstances[`${prefix}-cum`].updateOptions([]);
            populateStores(prefix, rVal, 'Outside', 'Outside');
        } else if (normalizedType === 'Mall') {
            cumGroup.classList.remove('hidden');
            const cums = [...new Set(storeCatalog.filter(s => s.region.toUpperCase() === rVal && s.type.toLowerCase() === 'mall').map(s => s.cum))].filter(Boolean);
            selectInstances[`${prefix}-cum`].updateOptions(cums);
            selectInstances[`${prefix}-store`].updateOptions([]);
        } else {
            cumGroup.classList.add('hidden');
            selectInstances[`${prefix}-cum`].updateOptions([]);
            selectInstances[`${prefix}-store`].updateOptions([]);
        }
    }

    // 3. Cum changed
    else if (changedField === 'cum') {
        storeInput.value = '';
        resetFormStoreSelection(prefix);

        if (normalizedType === 'Mall') {
            populateStores(prefix, rVal, 'Mall', cVal);
        } else {
            selectInstances[`${prefix}-store`].updateOptions([]);
        }
    }

    // 4. Store changed
    else if (changedField === 'store') {
        const currentCum = normalizedType === 'Mall' ? cVal : 'Outside';
        const match = storeCatalog.find(s => 
            s.region.toUpperCase() === rVal && 
            s.type.toLowerCase() === normalizedType.toLowerCase() && 
            s.cum.toLowerCase() === currentCum.toLowerCase() && 
            s.name.toLowerCase() === sVal.toLowerCase()
        );

        if (match) {
            const storeId = match.id;
            if (prefix === 'nhap') {
                if (nhapSelectedStoreId !== storeId) {
                    nhapSelectedStoreId = storeId;
                    loadStoreStockForNhap(storeId);
                }
            } else {
                if (capSelectedStoreId !== storeId) {
                    capSelectedStoreId = storeId;
                    loadStoreStock(storeId);
                }
            }
        } else {
            resetFormStoreSelection(prefix);
        }
    }

    if (prefix === 'nhap') {
        updateNhapFieldsVisibility();
    }
}

function initStoreSelector(prefix) {
    const regionInput = document.getElementById(`${prefix}-region`);
    const regionDropdown = document.getElementById(`${prefix}-region-dropdown`);
    const typeInput = document.getElementById(`${prefix}-type`);
    const typeDropdown = document.getElementById(`${prefix}-type-dropdown`);
    const cumGroup = document.getElementById(`${prefix}-cum-group`);
    const cumInput = document.getElementById(`${prefix}-cum`);
    const cumDropdown = document.getElementById(`${prefix}-cum-dropdown`);
    const storeInput = document.getElementById(`${prefix}-store`);
    const storeDropdown = document.getElementById(`${prefix}-store-dropdown`);

    // 1. Populate Regions list
    const regions = [...new Set(storeCatalog.map(s => s.region))].filter(Boolean);
    
    // Region Select Instance
    selectInstances[`${prefix}-region`] = new SearchableSelect(regionInput, regionDropdown, regions, () => handleStoreCascade(prefix, 'region'));

    // 2. Type Select Instance
    selectInstances[`${prefix}-type`] = new SearchableSelect(typeInput, typeDropdown, [], () => handleStoreCascade(prefix, 'type'));

    // 3. Cum Select Instance
    selectInstances[`${prefix}-cum`] = new SearchableSelect(cumInput, cumDropdown, [], () => handleStoreCascade(prefix, 'cum'));

    // 4. Store Select Instance
    selectInstances[`${prefix}-store`] = new SearchableSelect(storeInput, storeDropdown, [], () => handleStoreCascade(prefix, 'store'));

    // Wire listeners
    regionInput.addEventListener('input', () => handleStoreCascade(prefix, 'region'));
    typeInput.addEventListener('input', () => handleStoreCascade(prefix, 'type'));
    cumInput.addEventListener('input', () => handleStoreCascade(prefix, 'cum'));
    storeInput.addEventListener('input', () => handleStoreCascade(prefix, 'store'));
}

function populateStores(prefix, region, type, cum) {
    const filtered = storeCatalog.filter(s => 
        s.region === region && 
        s.type === type && 
        s.cum.toLowerCase() === cum.toLowerCase()
    );
    const storeNames = filtered.map(s => s.name);
    selectInstances[`${prefix}-store`].updateOptions(storeNames);
}

function updateNhapFieldsVisibility() {
    // Nếu đang tải tồn kho cửa hàng ở Tab 1, giữ ẩn
    const indicator = document.getElementById('loading-stock-indicator-nhap');
    if (indicator && !indicator.classList.contains('hidden')) {
        return;
    }

    const region = document.getElementById('nhap-region').value.trim();
    const type = document.getElementById('nhap-type').value.trim();
    const cumInput = document.getElementById('nhap-cum');
    const cum = cumInput ? cumInput.value.trim() : '';
    const name = document.getElementById('nhap-store').value.trim();
    const fieldsContainer = document.getElementById('nhap-fields');
    if (!fieldsContainer) return;
    
    // Check if store info is fully filled out
    const isTypeValid = type.toLowerCase() === 'outside' || (type.toLowerCase() === 'mall' && cum.length > 0);
    const isFullyFilled = region.length > 0 && type.length > 0 && isTypeValid && name.length > 0;
    
    if (isFullyFilled) {
        fieldsContainer.classList.remove('hidden');
    } else {
        fieldsContainer.classList.add('hidden');
    }
}

function resetFormStoreSelection(prefix) {
    if (prefix === 'nhap') {
        nhapSelectedStoreId = '';
        nhapStoreStock = {};
        renderNhapItems();
        updateNhapFieldsVisibility();
    } else {
        capSelectedStoreId = '';
        selectedStoreStock = {};
        capItems = [{ giftId: '', quantity: '' }];
        
        const warning = document.getElementById('no-gifts-warning');
        const adjustmentFields = document.getElementById('adjustment-fields');
        if (warning) warning.classList.add('hidden');
        if (adjustmentFields) adjustmentFields.classList.add('hidden');
        
        renderCapItems();
    }
}

function resetNhapForm() {
    document.getElementById('nhap-region').value = '';
    document.getElementById('nhap-type').value = '';
    document.getElementById('nhap-cum').value = '';
    document.getElementById('nhap-store').value = '';
    document.getElementById('nhap-cum-group').classList.add('hidden');
    nhapSelectedStoreId = '';
    nhapStoreStock = {};
    nhapItems = [{ giftId: '', quantity: '' }];
    document.getElementById('nhap-ghi-chu').value = '';
    renderNhapItems();
    updateNhapFieldsVisibility();
    
    if (selectInstances['nhap-type']) selectInstances['nhap-type'].updateOptions([]);
    if (selectInstances['nhap-cum']) selectInstances['nhap-cum'].updateOptions([]);
    if (selectInstances['nhap-store']) selectInstances['nhap-store'].updateOptions([]);
}

function resetCapForm() {
    document.getElementById('cap-region').value = '';
    document.getElementById('cap-type').value = '';
    document.getElementById('cap-cum').value = '';
    document.getElementById('cap-store').value = '';
    document.getElementById('cap-cum-group').classList.add('hidden');
    capSelectedStoreId = '';
    selectedStoreStock = {};
    capItems = [{ giftId: '', quantity: '' }];
    document.getElementById('cap-ghi-chu').value = '';
    
    const warning = document.getElementById('no-gifts-warning');
    const adjustmentFields = document.getElementById('adjustment-fields');
    if (warning) warning.classList.add('hidden');
    if (adjustmentFields) adjustmentFields.classList.add('hidden');
    
    renderCapItems();
    
    if (selectInstances['cap-type']) selectInstances['cap-type'].updateOptions([]);
    if (selectInstances['cap-cum']) selectInstances['cap-cum'].updateOptions([]);
    if (selectInstances['cap-store']) selectInstances['cap-store'].updateOptions([]);
}

// ─── TAB 1: NHẬP KHO MỚI (DYNAMIC INPUTS) ───
function renderNhapItems() {
    const container = document.getElementById('nhap-items-container');
    container.innerHTML = '';

    nhapItems.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'dynamic-row';

        // Searchable select wrapper for gift input
        const selectWrapper = document.createElement('div');
        selectWrapper.className = 'searchable-select';
        selectWrapper.style.flex = '2';

        const inputGift = document.createElement('input');
        inputGift.type = 'text';
        inputGift.placeholder = '-- Chọn/Nhập Quà --';
        inputGift.autocomplete = 'off';
        
        const matchingGift = giftCatalog.find(g => g.id === item.giftId);
        inputGift.value = matchingGift ? matchingGift.name : '';

        const arrow = document.createElement('span');
        arrow.className = 'select-arrow';

        const dropdown = document.createElement('div');
        dropdown.className = 'select-dropdown';

        selectWrapper.appendChild(inputGift);
        selectWrapper.appendChild(arrow);
        selectWrapper.appendChild(dropdown);

        // Filter gift catalog: only show gifts with quantity = 0 (or not present in nhapStoreStock yet)
        const filteredGifts = giftCatalog.filter(g => {
            if (!nhapSelectedStoreId) return true;
            return (nhapStoreStock[g.id] || 0) === 0;
        });

        // Instantiate select options
        const giftOptions = filteredGifts.map(g => g.name);
        new SearchableSelect(inputGift, dropdown, giftOptions, (val) => {
            const found = filteredGifts.find(g => g.name === val);
            nhapItems[idx].giftId = found ? found.id : '';
            nhapItems[idx].giftName = val;
        });

        // Add standard input listener for typed entries
        inputGift.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            const found = filteredGifts.find(g => g.name.toLowerCase() === val.toLowerCase());
            nhapItems[idx].giftId = found ? found.id : '';
            nhapItems[idx].giftName = val;
        });

        // Quantity input
        const inputQty = document.createElement('input');
        inputQty.type = 'text';
        inputQty.inputMode = 'numeric';
        inputQty.placeholder = 'Số lượng';
        inputQty.style.flex = '1';
        inputQty.value = item.quantity;
        inputQty.addEventListener('input', (e) => {
            nhapItems[idx].quantity = e.target.value;
        });

        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '&times;';
        if (nhapItems.length === 1) {
            removeBtn.disabled = true;
            removeBtn.style.opacity = '0.4';
        }
        removeBtn.addEventListener('click', () => {
            nhapItems = nhapItems.filter((_, i) => i !== idx);
            renderNhapItems();
        });

        row.appendChild(selectWrapper);
        row.appendChild(inputQty);
        row.appendChild(removeBtn);
        container.appendChild(row);
    });
}

// Add row listener
document.getElementById('add-item-btn').addEventListener('click', () => {
    nhapItems.push({ giftId: '', quantity: '' });
    renderNhapItems();
});

function validateStoreDetails(details) {
    if (!details.region) return 'Vui lòng chọn hoặc nhập Khu vực.';
    if (!details.type) return 'Vui lòng chọn hoặc nhập Phân loại.';
    if (details.type.toLowerCase() === 'mall' && !details.cum) return 'Cửa hàng loại Mall yêu cầu chọn/nhập Tên cụm.';
    if (!details.name) return 'Vui lòng chọn hoặc nhập Tên Cửa Hàng.';
    return null;
}

// Submit Nhập Kho handler
document.getElementById('submit-nhap-btn').addEventListener('click', async () => {
    const storeDetails = getStoreDetailsFromInputs('nhap');
    const storeError = validateStoreDetails(storeDetails);
    if (storeError) {
        showAlert(storeError, 'error');
        return;
    }
    const valid = nhapItems.filter(i => (i.giftId || i.giftName) && i.quantity && /^\d+$/.test(String(i.quantity).trim()) && parseInt(i.quantity) > 0);
    if (!valid.length) {
        showAlert('Vui lòng chọn quà tặng và điền số lượng là số nguyên lớn hơn 0 cho ít nhất 1 dòng.', 'error');
        return;
    }

    // Check duplicates
    const seenGifts = new Set();
    for (let item of valid) {
        const identifier = (item.giftId || item.giftName || '').trim().toLowerCase();
        if (seenGifts.has(identifier)) {
            showAlert('Các dòng nhập không được chọn trùng quà tặng. Vui lòng gộp số lượng hoặc chọn quà tặng khác.', 'error');
            return;
        }
        seenGifts.add(identifier);
    }

    const submitBtn = document.getElementById('submit-nhap-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'ĐANG LƯU...';

    try {
        const payload = {
            action: 'adminAddStock',
            storeId: nhapSelectedStoreId,
            storeDetails,
            items: valid.map(i => ({ 
                giftId: i.giftId || '', 
                giftName: i.giftName || '', 
                quantity: parseInt(i.quantity) 
            })),
            ghiChu: document.getElementById('nhap-ghi-chu').value.trim()
        };

        const res = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });
        const resData = await res.json();
        if (!resData.success) throw new Error(resData.error || 'Lỗi gửi yêu cầu nhập kho');

        alert('Nhập kho thành công! Nhật ký đã được ghi nhận.');
        resetNhapForm();
        
        // Reload database catalog options in background
        await loadCatalogData(true);

    } catch (err) {
        showAlert(`Lưu nhập kho thất bại: ${err.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'LƯU DỮ LIỆU NHẬP KHO';
    }
});

async function loadStoreStockForNhap(storeId) {
    const indicator = document.getElementById('loading-stock-indicator-nhap');
    const fields = document.getElementById('nhap-fields');
    if (indicator) indicator.classList.remove('hidden');
    if (fields) fields.classList.add('hidden');
    
    try {
        const res = await fetch(`${APPS_SCRIPT_URL}?action=getStock&storeId=${encodeURIComponent(storeId)}`);
        const data = await res.json();
        if (data.success) {
            nhapStoreStock = data.stock || {};
        } else {
            nhapStoreStock = {};
        }
    } catch (err) {
        console.error('Error loading stock for Nhập Mới:', err);
        nhapStoreStock = {};
    } finally {
        if (indicator) indicator.classList.add('hidden');
        renderNhapItems();
        updateNhapFieldsVisibility();
    }
}

// ─── TAB 2: BÙ/TRỪ KHO (CẬP NHẬT KHO) ───
async function loadStoreStock(storeId) {
    const indicator = document.getElementById('loading-stock-indicator');
    const warning = document.getElementById('no-gifts-warning');
    const adjustmentFields = document.getElementById('adjustment-fields');

    indicator.classList.remove('hidden');
    warning.classList.add('hidden');
    adjustmentFields.classList.add('hidden');

    try {
        const res = await fetch(`${APPS_SCRIPT_URL}?action=getStock&storeId=${encodeURIComponent(storeId)}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Lỗi lấy thông tin tồn kho');

        selectedStoreStock = data.stock || {};
        
        const validGiftsCount = Object.keys(selectedStoreStock).length;
        if (validGiftsCount === 0) {
            warning.textContent = 'Cửa hàng này hiện không có quà tặng nào trong kho. Vui lòng sử dụng màn hình "NHẬP KHO MỚI" để bổ sung quà.';
            warning.classList.remove('hidden');
            adjustmentFields.classList.add('hidden');
        } else {
            warning.classList.add('hidden');
            adjustmentFields.classList.remove('hidden');
            capItems = [{ giftId: '', quantity: '' }];
            renderCapItems();
        }
    } catch (err) {
        showAlert(`Lỗi nạp kho: ${err.message}`, 'error');
        adjustmentFields.classList.add('hidden');
    } finally {
        indicator.classList.add('hidden');
    }
}

function renderCapItems() {
    const container = document.getElementById('cap-items-container');
    container.innerHTML = '';

    const giftOptions = giftCatalog
        .filter(g => (selectedStoreStock[g.id] || 0) > 0)
        .map(g => {
            const qty = selectedStoreStock[g.id];
            return {
                value: g.id,
                label: `${g.name} (Hiện tại: ${qty})`
            };
        });

    capItems.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'dynamic-row';

        // Searchable select wrapper for gift input
        const selectWrapper = document.createElement('div');
        selectWrapper.className = 'searchable-select';
        selectWrapper.style.flex = '2';

        const inputGift = document.createElement('input');
        inputGift.type = 'text';
        inputGift.placeholder = '-- Chọn Quà Cần Điều Chỉnh --';
        inputGift.autocomplete = 'off';
        
        const matchingGift = giftCatalog.find(g => g.id === item.giftId);
        const currentQty = matchingGift ? (selectedStoreStock[matchingGift.id] || 0) : 0;
        inputGift.value = matchingGift ? `${matchingGift.name} (Hiện tại: ${currentQty})` : '';

        const arrow = document.createElement('span');
        arrow.className = 'select-arrow';

        const dropdown = document.createElement('div');
        dropdown.className = 'select-dropdown';

        selectWrapper.appendChild(inputGift);
        selectWrapper.appendChild(arrow);
        selectWrapper.appendChild(dropdown);

        new SearchableSelect(inputGift, dropdown, giftOptions, (val) => {
            capItems[idx].giftId = val;
            const found = giftCatalog.find(g => g.id === val);
            capItems[idx].giftName = found ? found.name : '';
            const qty = selectedStoreStock[val] || 0;
            inputGift.value = found ? `${found.name} (Hiện tại: ${qty})` : '';
        });

        inputGift.addEventListener('input', (e) => {
            const val = e.target.value.trim().split(' (Hiện tại:')[0].trim();
            const found = giftCatalog.find(g => g.name.toLowerCase() === val.toLowerCase() && (selectedStoreStock[g.id] || 0) > 0);
            capItems[idx].giftId = found ? found.id : '';
            capItems[idx].giftName = found ? found.name : '';
        });

        // Quantity input
        const inputQty = document.createElement('input');
        inputQty.type = 'text';
        inputQty.placeholder = 'Lượng +/-';
        inputQty.style.flex = '1';
        inputQty.value = item.quantity;
        inputQty.addEventListener('input', (e) => {
            capItems[idx].quantity = e.target.value;
        });

        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '&times;';
        if (capItems.length === 1) {
            removeBtn.disabled = true;
            removeBtn.style.opacity = '0.4';
        }
        removeBtn.addEventListener('click', () => {
            capItems = capItems.filter((_, i) => i !== idx);
            renderCapItems();
        });

        row.appendChild(selectWrapper);
        row.appendChild(inputQty);
        row.appendChild(removeBtn);
        container.appendChild(row);
    });
}

// Add item listener
document.getElementById('add-cap-item-btn').addEventListener('click', () => {
    capItems.push({ giftId: '', quantity: '' });
    renderCapItems();
});

// Submit Cập Nhật Kho handler
document.getElementById('submit-cap-btn').addEventListener('click', async () => {
    // 1. Kiểm tra cửa hàng bắt buộc phải có sẵn trong danh mục (Chặn tạo mới cửa hàng ở màn hình bù/trừ)
    if (!capSelectedStoreId) {
        showAlert('Cửa hàng không tồn tại trong hệ thống. Vui lòng chọn cửa hàng từ danh sách có sẵn.', 'error');
        return;
    }

    const valid = capItems.filter(i => i.giftId && i.quantity && /^-?\d+$/.test(String(i.quantity).trim()) && parseInt(i.quantity) !== 0);
    if (!valid.length) {
        showAlert('Vui lòng chọn ít nhất 1 quà tặng và nhập số lượng điều chỉnh là số nguyên khác 0.', 'error');
        return;
    }

    // Check duplicates
    const seenGifts = new Set();
    for (let item of valid) {
        if (seenGifts.has(item.giftId)) {
            showAlert('Các dòng điều chỉnh không được chọn trùng quà tặng. Vui lòng gộp số lượng hoặc chọn quà tặng khác.', 'error');
            return;
        }
        seenGifts.add(item.giftId);
    }

    // 2. Kiểm tra tồn kho chống âm kho
    for (let item of valid) {
        const giftId = item.giftId;
        const qty = parseInt(item.quantity);
        const currentQty = selectedStoreStock[giftId] || 0;
        if (currentQty + qty < 0) {
            const foundGift = giftCatalog.find(g => g.id === giftId);
            const giftName = foundGift ? foundGift.name : giftId;
            showAlert(`Số lượng giảm (${Math.abs(qty)}) vượt quá số lượng tồn kho hiện tại (${currentQty}) của ${giftName}. Tồn kho không thể âm.`, 'error');
            return;
        }
    }

    const reason = document.getElementById('cap-ghi-chu').value.trim();
    if (!reason) {
        showAlert('Vui lòng điền lý do điều chỉnh kho (Ghi chú).', 'error');
        return;
    }

    const submitBtn = document.getElementById('submit-cap-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'ĐANG LƯU...';

    try {
        const payload = {
            action: 'adminUpdateStock',
            storeId: capSelectedStoreId,
            items: valid.map(i => ({
                giftId: i.giftId,
                quantity: parseInt(i.quantity)
            })),
            ghiChu: reason
        };

        const res = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });
        const resData = await res.json();
        if (!resData.success) throw new Error(resData.error || 'Lỗi gửi yêu cầu điều chỉnh kho');

        alert('Điều chỉnh kho thành công!');
        resetCapForm();
        
        // Reload catalog & stock data in background
        await loadCatalogData(true);

    } catch (err) {
        showAlert(`Lưu điều chỉnh thất bại: ${err.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'LƯU ĐIỀU CHỈNH KHO';
    }
});

// ─── ADVANCED SETTINGS: DATABASE SETUP ───
function initDatabaseSetup() {
    const wipeBtn = document.getElementById('wipe-db-btn');
    if (wipeBtn) {
        wipeBtn.addEventListener('click', async () => {
            if (!confirm('Bạn có chắc chắn muốn KHÔI PHỤC LẠI DỮ LIỆU BAN ĐẦU? Lịch sử nhật ký và tồn kho sẽ được reset sạch, chỉ GIỮ LẠI danh mục Cửa hàng và danh mục Quà tặng hiện có.')) {
                return;
            }

            wipeBtn.disabled = true;
            wipeBtn.textContent = 'ĐANG KHÔI PHỤC...';

            try {
                const res = await fetch(`${APPS_SCRIPT_URL}?action=resetDatabaseWipe`);
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Lỗi khôi phục dữ liệu database');

                showAlert(data.message || 'Khôi phục dữ liệu ban đầu thành công! Hãy nạp lại trang.');
                loadCatalogData();

            } catch (err) {
                showAlert(`Khôi phục dữ liệu thất bại: ${err.message}`, 'error');
            } finally {
                wipeBtn.disabled = false;
                wipeBtn.textContent = 'Khôi phục lại dữ liệu ban đầu';
            }
        });
    }
}
