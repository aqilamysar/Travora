// GLOBAL APP STATE
let activeTab = 'dashboard';
let currentCurrency = 'MYR';
let currencySymbol = 'RM';
let currencyRate = 1.0;
let hasActiveTrip = true;
let selectedPaymentMethod = 'card';
let activeAuthTab = 'login';

// Registered accounts database for authentication validation
window.userAccounts = {
    'aqil@gmail.com': { password: 'password123', name: 'Aqil Amsyar' },
    'alif.travels@example.com': { password: 'password123', name: 'Alif Traveler' }
};

window.activeSimulatedUser = {
    uid: 'usr_aqil123',
    email: 'aqil@gmail.com',
    displayName: 'Aqil Amsyar',
    isAnonymous: false
};

// Bookings database
window.bookingHistory = [
    { id: 'TRV-88912', title: 'Malaysia Airlines (KUL - DPS)', date: '2026-09-01', amount: 1280, status: 'Confirmed', type: 'Flight' },
    { id: 'TRV-44219', title: 'Seminyak Beach Luxury Resort', date: '2026-09-01', amount: 2450, status: 'Confirmed', type: 'Hotel' }
];

// Saved phrasebook database
window.savedTranslations = [
    { docId: 'p1', source: 'Thank you very much', target: 'ありがとう (Arigatou)', lang: 'ja' },
    { docId: 'p2', source: 'Where is the beach?', target: 'Pantai di mana?', lang: 'ms' }
];

// INITIALIZATION ON LOAD
window.onload = function() {
    initCountdown();
    renderDashboardBookings();
    renderFlights();
    renderHotels();
    renderPaymentHistory();
    renderSavedTranslations();
    updateUserSessionState(window.activeSimulatedUser);
};

// NAVIGATION SWITCHER
function switchTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-sky-50', 'dark:bg-sky-950/50', 'text-sky-600', 'dark:text-sky-400', 'border', 'border-sky-200', 'dark:border-sky-800');
        btn.classList.add('text-slate-600', 'dark:text-slate-400');
    });
    const activeBtn = document.getElementById(`tabBtn-${tabId}`);
    if (activeBtn) {
        activeBtn.classList.add('active', 'bg-sky-50', 'dark:bg-sky-950/50', 'text-sky-600', 'dark:text-sky-400', 'border', 'border-sky-200', 'dark:border-sky-800');
    }

    ['dashboard', 'flights', 'hotels', 'translations', 'payments', 'settings'].forEach(page => {
        const el = document.getElementById(`page-${page}`);
        if (el) el.classList.add('hidden');
    });
    const targetPage = document.getElementById(`page-${tabId}`);
    if (targetPage) targetPage.classList.remove('hidden');
}

// COUNTDOWN TIMER SYSTEM
let countdownTimerInterval = null;
function initCountdown() {
    if (countdownTimerInterval) clearInterval(countdownTimerInterval);
    updateCountdownDisplay();
    countdownTimerInterval = setInterval(updateCountdownDisplay, 1000);
}

function updateCountdownDisplay() {
    const daysEl = document.getElementById('timerDays');
    if (!daysEl) return;

    if (!hasActiveTrip) return;

    const targetDate = new Date('2026-09-01T08:00:00');
    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) {
        daysEl.innerText = '00';
        document.getElementById('timerHours').innerText = '00';
        document.getElementById('timerMins').innerText = '00';
        document.getElementById('timerSecs').innerText = '00';
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.innerText = String(days).padStart(2, '0');
    document.getElementById('timerHours').innerText = String(hours).padStart(2, '0');
    document.getElementById('timerMins').innerText = String(mins).padStart(2, '0');
    document.getElementById('timerSecs').innerText = String(secs).padStart(2, '0');
    
    const daysCountText = document.getElementById('daysCountText');
    if (daysCountText) daysCountText.innerText = days;
}

function toggleTripState() {
    hasActiveTrip = !hasActiveTrip;
    const heading = document.getElementById('welcomeHeading');
    const subtext = document.getElementById('welcomeSubtext');
    const countdownBox = document.getElementById('countdownBox');

    const userName = window.activeSimulatedUser ? (window.activeSimulatedUser.displayName || 'Traveler') : 'Traveler';

    if (hasActiveTrip) {
        heading.innerHTML = `Welcome Back, <span class="text-sky-300">${userName}</span>. Your trip to <span class="text-amber-300">Bali</span> is in <span id="daysCountText" class="text-emerald-300">14</span> days!`;
        subtext.innerText = "Pack your bags! Everything is synced for your upcoming trip to Ngurah Rai Airport (DPS).";
        countdownBox.classList.remove('hidden');
        showToast("Switched to Active Trip View", "info");
    } else {
        heading.innerHTML = `Welcome Back, <span class="text-sky-300">${userName}</span>. No trips planned yet—let’s find your next great getaway!`;
        subtext.innerText = "Explore hundreds of flights and luxury stays for your next vacation.";
        countdownBox.classList.add('hidden');
        showToast("Switched to New User Empty State", "info");
    }
}

// CURRENCY & LOCALIZATION
function changeCurrency(val) {
    currentCurrency = val;
    const rates = { MYR: 1.0, USD: 0.22, EUR: 0.20, IDR: 3500, JPY: 33.5 };
    const symbols = { MYR: 'RM', USD: '$', EUR: '€', IDR: 'Rp', JPY: '¥' };
    currencyRate = rates[val] || 1.0;
    currencySymbol = symbols[val] || 'RM';
    
    renderFlights();
    renderHotels();
    renderPaymentHistory();
    renderDashboardBookings();
    showToast(`Currency changed to ${val}`, "success");
}

function formatMoney(amountMYR) {
    const converted = amountMYR * currencyRate;
    return `${currencySymbol} ${converted.toLocaleString(undefined, { minimumFractionDigits: currentCurrency === 'IDR' ? 0 : 2, maximumFractionDigits: currentCurrency === 'IDR' ? 0 : 2 })}`;
}

const sampleFlights = [
    { id: 1, airline: 'Malaysia Airlines', code: 'MH-715', dept: '09:30 AM', arr: '12:35 PM', duration: '3h 05m', price: 640, class: 'Economy' },
    { id: 2, airline: 'AirAsia', code: 'AK-380', dept: '01:15 PM', arr: '04:20 PM', duration: '3h 05m', price: 420, class: 'Economy' },
    { id: 3, airline: 'Singapore Airlines', code: 'SQ-942', dept: '06:00 AM', arr: '11:10 AM', duration: '5h 10m', price: 980, class: 'Business' }
];

function renderFlights() {
    const container = document.getElementById('flightResultsList');
    if (!container) return;

    container.innerHTML = sampleFlights.map(f => `
        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-black text-lg">
                    <i class="fa-solid fa-plane"></i>
                </div>
                <div>
                    <span class="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">${f.airline}</span>
                    <h4 class="font-bold text-sm text-slate-900 dark:text-white">${f.dept} ➔ ${f.arr}</h4>
                    <p class="text-[11px] text-slate-400">Flight ${f.code} • Direct (${f.duration}) • ${f.class}</p>
                </div>
            </div>
            <div class="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0">
                <div class="text-right">
                    <span class="text-[10px] text-slate-400 block uppercase font-bold">Price per person</span>
                    <span class="text-lg font-black text-slate-900 dark:text-white">${formatMoney(f.price)}</span>
                </div>
                <button onclick="bookFlightItem('${f.airline} (${f.code})', ${f.price})" class="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition">
                    Book Flight
                </button>
            </div>
        </div>
    `).join('');
}

function handleFlightSearch(e) {
    e.preventDefault();
    const from = document.getElementById('flightFrom').value;
    const to = document.getElementById('flightTo').value;
    showToast(`Found flight options from ${from} to ${to}`, "success");
    renderFlights();
}

function bookFlightItem(title, amount) {
    document.getElementById('summaryTitle').innerText = title;
    document.getElementById('summaryBasePrice').innerText = formatMoney(amount);
    document.getElementById('summaryTotalPrice').innerText = formatMoney(amount);
    switchTab('payments');
    showToast(`Selected ${title} for checkout`, "info");
}

let sampleHotels = [
    { id: 101, name: 'Seminyak Beach Luxury Resort', rating: 4.9, reviews: 312, price: 350, img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80' },
    { id: 102, name: 'Ubud Jungle Sanctuary Villa', rating: 4.7, reviews: 184, price: 280, img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=400&q=80' },
    { id: 103, name: 'Canggu Ocean View Suites', rating: 4.5, reviews: 96, price: 190, img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=400&q=80' }
];

function renderHotels() {
    const container = document.getElementById('hotelResultsList');
    if (!container) return;

    container.innerHTML = sampleHotels.map(h => `
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div class="h-44 bg-slate-200 dark:bg-slate-800 relative">
                <img src="${h.img}" alt="${h.name}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/400x250/0f172a/ffffff?text=Luxury+Hotel'">
                <span class="absolute top-3 right-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-amber-400 rounded-full text-[11px] font-bold">
                    <i class="fa-solid fa-star mr-1"></i> ${h.rating} (${h.reviews})
                </span>
            </div>
            <div class="p-5 flex-1 flex flex-col justify-between">
                <div>
                    <h4 class="font-bold text-sm text-slate-900 dark:text-white mb-1">${h.name}</h4>
                    <p class="text-[11px] text-slate-400"><i class="fa-solid fa-wifi text-emerald-500 mr-1"></i> Free High-Speed WiFi • Pool Access</p>
                </div>
                <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <span class="text-[10px] text-slate-400 block font-bold uppercase">Per Night</span>
                        <span class="text-base font-black text-slate-900 dark:text-white">${formatMoney(h.price)}</span>
                    </div>
                    <button onclick="bookHotelItem('${h.name}', ${h.price})" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition">
                        Reserve Room
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function sortHotels(criteria) {
    if (criteria === 'price-asc') sampleHotels.sort((a,b) => a.price - b.price);
    if (criteria === 'price-desc') sampleHotels.sort((a,b) => b.price - a.price);
    if (criteria === 'rating-desc') sampleHotels.sort((a,b) => b.rating - a.rating);
    if (criteria === 'rating-asc') sampleHotels.sort((a,b) => a.rating - b.rating);
    renderHotels();
}

function handleHotelSearch(e) {
    e.preventDefault();
    const loc = document.getElementById('hotelLocation').value;
    showToast(`Searched hotel accommodations in ${loc}`, "success");
    renderHotels();
}

function bookHotelItem(title, amount) {
    document.getElementById('summaryTitle').innerText = title;
    document.getElementById('summaryBasePrice').innerText = formatMoney(amount);
    document.getElementById('summaryTotalPrice').innerText = formatMoney(amount);
    switchTab('payments');
    showToast(`Selected ${title} for booking`, "info");
}

const travelDictionary = {
    "thank you": { ja: "ありがとう (Arigatou)", ms: "Terima kasih", id: "Terima kasih", phonetic: "Ah-ree-gah-too" },
    "thank you very much": { ja: "ありがとうございます (Arigatou gozaimasu)", ms: "Terima kasih banyak", id: "Terima kasih banyak", phonetic: "Ah-ree-gah-too Go-zah-ee-mas" },
    "good morning": { ja: "おはようございます (Ohayou gozaimasu)", ms: "Selamat pagi", id: "Selamat pagi", phonetic: "Oh-hah-yoo Go-zah-ee-mas" },
    "where is the beach?": { ja: "ビーチはどこですか？ (Biichi wa doko desu ka?)", ms: "Di manakah pantai?", id: "Di mana pantainya?", phonetic: "Bee-chee wah doh-koh des-kah" },
    "how much is this?": { ja: "これはいくらですか？ (Kore wa ikura desu ka?)", ms: "Berapakah harga ini?", id: "Berapa harganya ini?", phonetic: "Koh-reh wah ee-koo-rah des-kah" }
};

async function performTranslation() {
    const input = document.getElementById('transInputText').value.trim();
    const targetLang = document.getElementById('targetLangSelect').value;
    const outputText = document.getElementById('translationOutputText');
    const phoneticGuide = document.getElementById('phoneticGuideText');

    if (!input) {
        showToast("Please enter a sentence to translate first!", "warning");
        return;
    }

    outputText.innerText = "Translating sentence...";
    phoneticGuide.innerText = "Generating audio pronunciation guide...";

    const lower = input.toLowerCase();
    if (travelDictionary[lower] && travelDictionary[lower][targetLang]) {
        const match = travelDictionary[lower];
        outputText.innerText = match[targetLang];
        phoneticGuide.innerText = match.phonetic || `[Phonetic: ${match[targetLang]}]`;
        showToast("Translation completed", "success");
        return;
    }

    // Fetch live API translation
    try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(input)}&langpair=autodetect|${targetLang}`);
        const data = await res.json();
        if (data && data.responseData && data.responseData.translatedText) {
            let transText = data.responseData.translatedText;
            outputText.innerText = transText;
            phoneticGuide.innerText = `[Phonetic: ${transText.split('').join('-')}]`;
            showToast("Live Translation finished", "success");
        } else {
            outputText.innerText = `${input} (${targetLang.toUpperCase()})`;
            phoneticGuide.innerText = `[Phonetic: ${input}]`;
        }
    } catch (err) {
        outputText.innerText = `${input} [Translated]`;
        phoneticGuide.innerText = `[Phonetic: ${input}]`;
    }
}

// Voice Dictation Trigger
function triggerVoiceDictation() {
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.onstart = () => showToast("Listening... Speak into microphone", "info");
        recognition.onresult = (e) => {
            const text = e.results[0][0].transcript;
            document.getElementById('transInputText').value = text;
            performTranslation();
        };
        recognition.start();
    } else {
        document.getElementById('transInputText').value = "Where is the nearest beach?";
        performTranslation();
        showToast("Voice input simulated", "info");
    }
}

// Camera OCR Upload Simulation
function handleCameraUpload(e) {
    const file = e.target.files[0];
    if (file) {
        document.getElementById('transInputText').value = "Thank you very much";
        performTranslation();
        showToast(`Scanned image: ${file.name}`, "success");
    }
}

function setInputMode(mode) {
    ['text', 'voice', 'camera'].forEach(m => {
        const btn = document.getElementById(`modeBtn-${m}`);
        if (btn) btn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-white/50';
    });
    document.getElementById(`modeBtn-${mode}`).className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm';

    if (mode === 'camera') {
        document.getElementById('inputBoxContainer').classList.add('hidden');
        document.getElementById('cameraUploadContainer').classList.remove('hidden');
    } else {
        document.getElementById('inputBoxContainer').classList.remove('hidden');
        document.getElementById('cameraUploadContainer').classList.add('hidden');
    }
}

function swapTranslationLangs() {
    const source = document.getElementById('sourceLangSelect');
    const target = document.getElementById('targetLangSelect');
    const temp = source.value === 'auto' ? 'en' : source.value;
    source.value = target.value;
    target.value = temp;
    showToast("Translation languages swapped", "info");
}

// Japanese Voice Utterance Functionality
let availableVoices = [];
if ('speechSynthesis' in window) {
    const loadVoices = () => { availableVoices = window.speechSynthesis.getVoices(); };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
}

function speakTranslation() {
    const textToSpeak = document.getElementById('translationOutputText').innerText;
    const targetLang = document.getElementById('targetLangSelect').value;

    if (!textToSpeak || textToSpeak.includes('Translation will appear here')) {
        showToast("No translated text to speak yet!", "warning");
        return;
    }

    const cleanText = textToSpeak.replace(/\([^)]*\)/g, '').trim() || textToSpeak;

    const speakBtn = document.getElementById('speakBtn');
    if (speakBtn) speakBtn.classList.add('animate-pulse', 'bg-amber-600');

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        const langCodes = { ja: 'ja-JP', ms: 'ms-MY', id: 'id-ID', en: 'en-US', fr: 'fr-FR', es: 'es-ES' };
        utterance.lang = langCodes[targetLang] || 'ja-JP';
        utterance.rate = 0.88;

        utterance.onend = () => { if (speakBtn) speakBtn.classList.remove('animate-pulse', 'bg-amber-600'); };
        utterance.onerror = () => { if (speakBtn) speakBtn.classList.remove('animate-pulse', 'bg-amber-600'); };

        window.speechSynthesis.speak(utterance);
    } else {
        showToast("Audio playback not supported on this browser.", "warning");
    }
}

function saveCurrentTranslation() {
    const source = document.getElementById('transInputText').value;
    const target = document.getElementById('translationOutputText').innerText;
    const lang = document.getElementById('targetLangSelect').value;

    if (!source || target.includes('Translation will appear')) {
        showToast("Please translate a sentence before saving!", "warning");
        return;
    }

    window.savedTranslations.push({
        docId: 'trans_' + Date.now(),
        source: source,
        target: target,
        lang: lang
    });
    renderSavedTranslations();
    showToast("Saved to your personal phrasebook!", "success");
}

function renderSavedTranslations() {
    const container = document.getElementById('savedTranslationsList');
    const countEl = document.getElementById('savedCountText');
    if (!container) return;

    if (countEl) countEl.innerText = `${window.savedTranslations.length} phrases saved`;

    if (window.savedTranslations.length === 0) {
        container.innerHTML = `
            <div class="col-span-2 p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <i class="fa-solid fa-bookmark text-2xl mb-2"></i>
                <p class="text-xs font-semibold">No saved translations yet.</p>
                <p class="text-[11px]">Translate phrases above and click the bookmark icon to save them!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = window.savedTranslations.map(item => `
        <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
            <div>
                <span class="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">${item.lang}</span>
                <h5 class="font-bold text-xs text-slate-900 dark:text-white">${item.target}</h5>
                <p class="text-[11px] text-slate-400 font-medium">"${item.source}"</p>
            </div>
            <div class="flex items-center gap-1">
                <button onclick="speakSavedPhrase('${item.target.replace(/'/g, "\\'")}', '${item.lang}')" class="p-2 text-amber-600 hover:bg-amber-500/10 rounded-lg">
                    <i class="fa-solid fa-volume-high text-xs"></i>
                </button>
                <button onclick="deleteSavedTranslation('${item.docId}')" class="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg">
                    <i class="fa-solid fa-trash text-xs"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function speakSavedPhrase(text, lang) {
    if ('speechSynthesis' in window) {
        const cleanText = text.replace(/\([^)]*\)/g, '').trim() || text;
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = lang === 'ja' ? 'ja-JP' : (lang === 'ms' ? 'ms-MY' : 'en-US');
        window.speechSynthesis.speak(utterance);
    }
}

function deleteSavedTranslation(docId) {
    window.savedTranslations = window.savedTranslations.filter(t => t.docId !== docId);
    renderSavedTranslations();
    showToast("Phrase removed from phrasebook", "info");
}

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    ['card', 'fpx', 'ewallet', 'qr'].forEach(m => {
        const btn = document.getElementById(`payMethod-${m}`);
        if (btn) {
            btn.className = 'p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-center font-bold text-xs transition flex flex-col items-center gap-2 text-slate-600 dark:text-slate-300';
        }
    });
    const selectedBtn = document.getElementById(`payMethod-${method}`);
    if (selectedBtn) {
        selectedBtn.className = 'p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-center font-bold text-xs transition flex flex-col items-center gap-2 text-emerald-700 dark:text-emerald-300';
    }
}

function applyVoucher() {
    const input = document.getElementById('voucherInput').value.trim();
    if (input === 'TRAVORA10') {
        document.getElementById('summaryDiscount').innerText = '- RM 128.00';
        document.getElementById('summaryTotalPrice').innerText = formatMoney(1152);
        showToast("Voucher TRAVORA10 Applied! 10% Discount received.", "success");
    } else {
        showToast("Invalid voucher code. Try TRAVORA10", "warning");
    }
}

function processPayment() {
    const newBooking = {
        id: 'TRV-' + Math.floor(10000 + Math.random() * 90000),
        title: document.getElementById('summaryTitle').innerText,
        date: new Date().toISOString().split('T')[0],
        amount: 1280,
        status: 'Confirmed',
        type: 'Booking'
    };

    window.bookingHistory.unshift(newBooking);
    renderPaymentHistory();
    renderDashboardBookings();
    showToast(`Payment Successful! Booking ID: ${newBooking.id}`, "success");
    viewBooking(newBooking.id);
}

function renderPaymentHistory() {
    const tbody = document.getElementById('paymentHistoryTbody');
    if (!tbody) return;

    if (window.bookingHistory.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="py-8 text-center text-slate-400">No payment history yet.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = window.bookingHistory.map(b => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
            <td class="py-3.5 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">${b.id}</td>
            <td class="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">${b.title}</td>
            <td class="py-3.5 px-4 text-slate-400">${b.date}</td>
            <td class="py-3.5 px-4 font-mono font-black">${formatMoney(b.amount)}</td>
            <td class="py-3.5 px-4">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${b.status === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}">
                    ${b.status}
                </span>
            </td>
            <td class="py-3.5 px-4 text-right space-x-2">
                <button onclick="viewBooking('${b.id}')" class="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-bold">Receipt</button>
                ${b.status === 'Confirmed' ? `<button onclick="cancelBooking('${b.id}')" class="px-3 py-1 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-lg text-[11px] font-bold">Cancel</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function renderDashboardBookings() {
    const container = document.getElementById('dashBookingsPreview');
    if (!container) return;

    if (window.bookingHistory.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 py-2">No active bookings available.</p>`;
        return;
    }

    container.innerHTML = window.bookingHistory.slice(0, 2).map(b => `
        <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                    <i class="fa-solid fa-ticket"></i>
                </div>
                <div>
                    <h5 class="font-bold text-xs text-slate-900 dark:text-white">${b.title}</h5>
                    <span class="text-[10px] text-slate-400 font-mono">${b.id} • ${b.date}</span>
                </div>
            </div>
            <div class="text-right">
                <span class="text-xs font-black text-slate-900 dark:text-white block">${formatMoney(b.amount)}</span>
                <span class="text-[10px] font-bold text-emerald-500 uppercase">${b.status}</span>
            </div>
        </div>
    `).join('');
}

function viewBooking(id) {
    const b = window.bookingHistory.find(x => x.id === id);
    if (!b) return;

    const content = document.getElementById('receiptContent');
    if (content) {
        content.innerHTML = `
            <div class="text-center pb-3 border-b border-slate-200 dark:border-slate-700">
                <h4 class="font-black text-base uppercase tracking-wider text-slate-900 dark:text-white">TRAVORA OFFICIAL RECEIPT</h4>
                <a href="https://www.travora.com" target="_blank" class="text-[11px] text-sky-600 hover:underline font-semibold block">www.travora.com</a>
                <span class="text-slate-400 font-mono text-[11px]">${b.id}</span>
            </div>
            <div class="space-y-2 pt-2">
                <div class="flex justify-between"><span>Service Item:</span><span class="font-bold text-slate-900 dark:text-white">${b.title}</span></div>
                <div class="flex justify-between"><span>Booking Date:</span><span class="font-medium">${b.date}</span></div>
                <div class="flex justify-between"><span>Payment Status:</span><span class="font-bold text-emerald-500">${b.status}</span></div>
                <div class="flex justify-between pt-2 border-t font-black text-sm text-slate-900 dark:text-white"><span>Total Paid:</span><span class="text-sky-600">${formatMoney(b.amount)}</span></div>
            </div>
        `;
    }
    document.getElementById('receiptModal').classList.remove('hidden');
}

function cancelBooking(id) {
    const b = window.bookingHistory.find(x => x.id === id);
    if (b) {
        b.status = 'Cancelled';
        renderPaymentHistory();
        renderDashboardBookings();
        showToast(`Booking ${id} has been cancelled.`, "warning");
    }
}

function openAuthModal() {
    document.getElementById('authModal').classList.remove('hidden');
}

function closeAuthModal() {
    document.getElementById('authModal').classList.add('hidden');
}

function setAuthTab(tab) {
    activeAuthTab = tab;
    const errBox = document.getElementById('authErrorMessage');
    if (errBox) errBox.classList.add('hidden');

    const loginBtn = document.getElementById('authTabBtn-login');
    const regBtn = document.getElementById('authTabBtn-register');
    const nameField = document.getElementById('authNameField');
    const submitBtn = document.getElementById('authSubmitBtn');

    if (tab === 'login') {
        loginBtn.className = 'flex-1 py-2.5 text-xs font-bold border-b-2 border-sky-600 text-sky-600 dark:text-sky-400';
        regBtn.className = 'flex-1 py-2.5 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-600';
        nameField.classList.add('hidden');
        submitBtn.innerText = 'Log In Now';
    } else {
        regBtn.className = 'flex-1 py-2.5 text-xs font-bold border-b-2 border-sky-600 text-sky-600 dark:text-sky-400';
        loginBtn.className = 'flex-1 py-2.5 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-600';
        nameField.classList.remove('hidden');
        submitBtn.innerText = 'Create New Account';
    }
}

function submitAuthForm(e) {
    e.preventDefault();
    const email = document.getElementById('authEmailInput').value.trim().toLowerCase();
    const password = document.getElementById('authPasswordInput').value;
    const name = document.getElementById('authNameInput').value.trim();
    const errBox = document.getElementById('authErrorMessage');

    if (activeAuthTab === 'login') {
        if (!window.userAccounts[email]) {
            errBox.innerText = "Account not found with this email. Please check your credentials or create a new account.";
            errBox.classList.remove('hidden');
            return;
        }
        if (window.userAccounts[email].password !== password) {
            errBox.innerText = "Incorrect password. Please try again.";
            errBox.classList.remove('hidden');
            return;
        }

        const userAcc = window.userAccounts[email];
        window.activeSimulatedUser = {
            uid: 'usr_' + Math.random().toString(36).substring(2, 9),
            email: email,
            displayName: userAcc.name,
            isAnonymous: false
        };
        updateUserSessionState(window.activeSimulatedUser);
        showToast(`Welcome back, ${userAcc.name}!`, "success");
        closeAuthModal();
    } else {
        if (window.userAccounts[email]) {
            errBox.innerText = "An account with this email already exists. Please log in instead.";
            errBox.classList.remove('hidden');
            return;
        }

        const displayName = name || email.split('@')[0];
        window.userAccounts[email] = { password: password, name: displayName };
        
        window.activeSimulatedUser = {
            uid: 'usr_' + Math.random().toString(36).substring(2, 9),
            email: email,
            displayName: displayName,
            isAnonymous: false
        };
        updateUserSessionState(window.activeSimulatedUser);
        showToast(`Account created! Welcome to Travora, ${displayName}.`, "success");
        closeAuthModal();
    }
}

function updateUserSessionState(user) {
    const userLabel = document.getElementById('userAccountLabel');
    const syncBadge = document.getElementById('cloudSyncBadge');
    const welcomeHeading = document.getElementById('welcomeHeading');
    const loggedInView = document.getElementById('loggedInView');
    const authForm = document.getElementById('authForm');
    const authTabsContainer = document.getElementById('authTabsContainer');

    if (user) {
        const displayName = user.displayName || 'Traveler';
        if (userLabel) userLabel.innerText = displayName;
        if (syncBadge) syncBadge.classList.remove('hidden');
        
        if (welcomeHeading && hasActiveTrip) {
            welcomeHeading.innerHTML = `Welcome Back, <span class="text-sky-300">${displayName}</span>. Your trip to <span class="text-amber-300">Bali</span> is in <span id="daysCountText" class="text-emerald-300">14</span> days!`;
        }

        if (loggedInView) {
            loggedInView.classList.remove('hidden');
            document.getElementById('profileDisplayName').innerText = displayName;
            document.getElementById('profileEmail').innerText = user.email || 'guest@travora.com';
            document.getElementById('profileAvatarText').innerText = displayName.charAt(0).toUpperCase();
        }
        if (authForm) authForm.classList.add('hidden');
        if (authTabsContainer) authTabsContainer.classList.add('hidden');
    } else {
        if (userLabel) userLabel.innerText = 'Log In';
        if (syncBadge) syncBadge.classList.add('hidden');
        if (loggedInView) loggedInView.classList.add('hidden');
        if (authForm) authForm.classList.remove('hidden');
        if (authTabsContainer) authTabsContainer.classList.remove('hidden');
    }
}

function handleSignOut() {
    window.activeSimulatedUser = null;
    updateUserSessionState(null);
    showToast("Signed out. Operating in Guest Mode.", "info");
    closeAuthModal();
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const colors = {
        success: 'bg-emerald-600 text-white',
        warning: 'bg-amber-500 text-white',
        info: 'bg-sky-600 text-white',
        error: 'bg-rose-600 text-white'
    };

    toast.className = `px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 transition transform translate-y-2 pointer-events-auto ${colors[type] || colors.info}`;
    toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${message}`;

    container.appendChild(toast);
    setTimeout(() => { toast.classList.remove('translate-y-2'); }, 10);
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    showToast("Theme toggled", "info");
}

function toggleHighContrast(enabled) {
    if (enabled) document.body.classList.add('high-contrast');
    else document.body.classList.remove('high-contrast');
}

function toggleLargeText(enabled) {
    if (enabled) document.body.classList.add('large-text');
    else document.body.classList.remove('large-text');
}

function toggleLangDropdown() {
    document.getElementById('navLangDropdown').classList.toggle('hidden');
}

function selectNavLang(code, flag, text) {
    document.getElementById('navFlagIcon').innerText = flag;
    document.getElementById('navLangText').innerText = text;
    toggleLangDropdown();
    showToast(`Language set to ${text}`, "success");
}

function triggerGlobalSearch(query) {
    if (!query) return;
    switchTab('flights');
    document.getElementById('flightTo').value = query;
    renderFlights();
    showToast(`Searching Travora for: ${query}`, "info");
}