/**
 * Prayaas Gurukul — Student PWA Frontend Logic (Phase 1)
 * Purple theme, login auth state, dynamic view rendering, test runner,
 * DPP PDF reader, YouTube lecture player & leaderboard.
 */

// ==========================================
// 1. STATE & DATA STORE
// ==========================================
const APP_STATE = {
    // Current route/view
    currentTab: 'home',
    isAuthenticated: false,
    
    // Logged in student details (Loaded from session in Phase 4)
    studentClass: 10,
    activeLeaderboardTab: 'class', // 'class' or 'overall'
    activeStudyTab: 'all', // 'all', 'videos', 'dpps'

    user: {
        id: "PG-10-108",
        name: "Rahul Verma",
        class: 10,
        avatarInitial: "R",
        avgScore: 84.5,
        testsAttempted: 14,
        classRank: 4,
        overallRank: 12
    },

    // Announcements / Notices
    notifications: [
        { id: 1, title: "Sunday Board Mock Test 03", body: "Science Class 10 mock test begins at 10:00 AM this Sunday. Full syllabus revision test.", time: "1 hour ago", unread: true },
        { id: 2, title: "New DPP Uploaded", body: "Electricity DPP 04 solutions uploaded by Faculty.", time: "Yesterday", unread: false },
        { id: 3, title: "Class 9 & 10 Leaderboard Rebuilt", body: "Weekly test rankings have been updated. Check your badges!", time: "2 days ago", unread: false }
    ],

    // Study Materials (Tagged with Class 6, 9, 10)
    materials: [
        { id: 1, type: "video", title: "Light: Reflection & Refraction Concept 01", class: 10, subject: "Physics", youtubeId: "kJQP7kiw5Fk", duration: "24 mins" },
        { id: 2, type: "dpp", title: "Electricity & Circuit Laws - DPP 04", class: 10, subject: "Physics", fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", pages: "4 Pages PDF", questions: "15 MCQs" },
        { id: 3, type: "video", title: "Chemical Reactions & Equations One Shot", class: 10, subject: "Chemistry", youtubeId: "L_LUpnjgPso", duration: "42 mins" },
        { id: 4, type: "dpp", title: "Triangles & Coordinate Geometry DPP", class: 10, subject: "Maths", fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", pages: "6 Pages PDF", questions: "20 MCQs" },
        { id: 5, type: "video", title: "Force and Laws of Motion Masterclass", class: 9, subject: "Physics", youtubeId: "kJQP7kiw5Fk", duration: "32 mins" },
        { id: 6, type: "dpp", title: "Class 9 Matter In Our Surroundings DPP", class: 9, subject: "Chemistry", fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", pages: "3 Pages PDF", questions: "12 MCQs" },
        { id: 7, type: "video", title: "Components of Food & Nutrients", class: 6, subject: "Science", youtubeId: "L_LUpnjgPso", duration: "18 mins" },
        { id: 8, type: "dpp", title: "Knowing Our Numbers Practice Sheet", class: 6, subject: "Maths", fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", pages: "2 Pages PDF", questions: "10 MCQs" }
    ],

    // Scheduled & Live Tests
    tests: [
        {
            id: 101,
            title: "Board Booster Science Mock Test #03",
            class: 10,
            subject: "Science",
            totalMarks: 40,
            durationMin: 30,
            questionCount: 5,
            status: "live",
            dateStr: "Live Today • Ends 8:00 PM"
        },
        {
            id: 102,
            title: "Maths: Quadratic Equations & AP Blitz",
            class: 10,
            subject: "Mathematics",
            totalMarks: 50,
            durationMin: 45,
            questionCount: 20,
            status: "upcoming",
            dateStr: "Tomorrow • 10:00 AM"
        },
        {
            id: 103,
            title: "Class 9 Motion & Gravitation Test",
            class: 9,
            subject: "Physics",
            totalMarks: 30,
            durationMin: 25,
            questionCount: 15,
            status: "live",
            dateStr: "Live Now"
        },
        {
            id: 104,
            title: "Class 6 Basic Mathematics & Reasoning",
            class: 6,
            subject: "Maths",
            totalMarks: 25,
            durationMin: 20,
            questionCount: 10,
            status: "live",
            dateStr: "Live Now"
        }
    ],

    // Real-Time Leaderboards
    leaderboards: {
        class: [
            { rank: 1, name: "Aarav Sharma", score: 96.4, tests: 15, delta: "+1", badge: "Gold" },
            { rank: 2, name: "Isha Patel", score: 94.8, tests: 15, delta: "0", badge: "Silver" },
            { rank: 3, name: "Sneha Reddy", score: 92.2, tests: 14, delta: "+2", badge: "Bronze" },
            { rank: 4, name: "Rahul Verma (You)", score: 84.5, tests: 14, delta: "+1", badge: "Star" },
            { rank: 5, name: "Aditya Mishra", score: 82.0, tests: 13, delta: "-1", badge: null },
            { rank: 6, name: "Pooja Gupta", score: 79.5, tests: 12, delta: "0", badge: null },
            { rank: 7, name: "Kunal Bansal", score: 77.0, tests: 11, delta: "-2", badge: null }
        ],
        overall: [
            { rank: 1, name: "Tanmay Jha", class: 10, score: 98.1, tests: 18, delta: "0" },
            { rank: 2, name: "Aarav Sharma", class: 10, score: 96.4, tests: 15, delta: "+1" },
            { rank: 3, name: "Devansh Roy", class: 9, score: 95.2, tests: 16, delta: "+3" },
            { rank: 4, name: "Isha Patel", class: 10, score: 94.8, tests: 15, delta: "-1" },
            { rank: 12, name: "Rahul Verma (You)", class: 10, score: 84.5, tests: 14, delta: "+2" }
        ]
    },

    // Active Test Engine Session
    activeTestSession: {
        testId: 101,
        title: "Science Mock Test #03",
        currentQIdx: 0,
        secondsLeft: 1800,
        timerInterval: null,
        userAnswers: {},
        reviewedStatus: {},
        questions: [
            {
                id: 1,
                question: "Which of the following compounds gives a brisk effervescence with sodium bicarbonate solution?",
                options: ["Ethanol", "Ethanoic Acid", "Ethyl Ethanoate", "Methane"],
                correct: 1
            },
            {
                id: 2,
                question: "A ray of light passes from glass into water. What happens to its speed and direction?",
                options: ["Slows down and bends towards normal", "Speeds up and bends away from normal", "Slows down without deviation", "Speeds up and bends towards normal"],
                correct: 1
            },
            {
                id: 3,
                question: "The focal length of a concave mirror is 15 cm. At what distance should an object be placed to get an inverted image of the same size?",
                options: ["15 cm", "30 cm", "60 cm", "7.5 cm"],
                correct: 1
            },
            {
                id: 4,
                question: "Which gland secretes the hormone 'Calcitonin' in the human body?",
                options: ["Pituitary gland", "Thyroid gland", "Adrenal gland", "Pancreas"],
                correct: 1
            },
            {
                id: 5,
                question: "What is the SI unit of electric resistivity (ρ)?",
                options: ["Ohm", "Ohm-meter", "Ohm per meter", "Volt-meter"],
                correct: 1
            }
        ]
    }
};

// ==========================================
// 2. AUTHENTICATION & LOGIN FLOW
// ==========================================
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('login-password');
    const eyeIcon = document.getElementById('eye-icon');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.classList.remove('ph-eye');
        eyeIcon.classList.add('ph-eye-slash');
    } else {
        passwordInput.type = 'password';
        eyeIcon.classList.remove('ph-eye-slash');
        eyeIcon.classList.add('ph-eye');
    }
}

function handleLoginSubmit(event) {
    event.preventDefault();
    const studentId = document.getElementById('login-student-id').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const errorDiv = document.getElementById('login-error-msg');

    if (!studentId || !password) {
        errorDiv.innerText = "Please enter both Student ID and Password.";
        errorDiv.classList.remove('hidden');
        return;
    }

    // In Phase 4, this calls POST /api/auth/login.php
    // In Phase 1 frontend, we simulate successful verification:
    APP_STATE.isAuthenticated = true;
    localStorage.setItem('prayaas_token', 'mock_token_pg_2026');

    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');

    switchTab('home');
}

function confirmLogout() {
    if (confirm("Are you sure you want to log out from Prayaas Gurukul?")) {
        localStorage.removeItem('prayaas_token');
        APP_STATE.isAuthenticated = false;
        document.getElementById('app-container').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
    }
}

// ==========================================
// 3. NAVIGATION ROUTING
// ==========================================
function switchTab(tabId) {
    APP_STATE.currentTab = tabId;
    
    // Update active tab buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const targetNav = document.getElementById('nav-' + tabId);
    if (targetNav) targetNav.classList.add('active');

    const contentArea = document.getElementById('content-area');
    contentArea.classList.remove('animate-fade-in');

    setTimeout(() => {
        if (tabId === 'home') renderHomeView();
        else if (tabId === 'study') renderStudyView();
        else if (tabId === 'tests') renderTestsView();
        else if (tabId === 'leaderboard') renderLeaderboardView();
        else if (tabId === 'profile') renderProfileView();

        contentArea.classList.add('animate-fade-in');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 40);
}

// ==========================================
// 4. VIEW BUILDERS
// ==========================================

// --- HOME VIEW ---
function renderHomeView() {
    const classFilteredMaterials = APP_STATE.materials.filter(m => m.class === APP_STATE.studentClass);
    const classTests = APP_STATE.tests.filter(t => t.class === APP_STATE.studentClass && t.status === 'live');

    let studyCardsHTML = classFilteredMaterials.slice(0, 3).map(item => `
        <div onclick="${item.type === 'video' ? `openVideoModal('${item.title}', '${item.youtubeId}')` : `openDppModal('${item.title}', '${item.fileUrl}')`}" 
             class="min-w-[210px] p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between cursor-pointer hover:border-prayaas-300 transition">
            <div>
                <div class="flex items-center justify-between mb-2">
                    <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${item.type === 'video' ? 'bg-rose-50 text-rose-600' : 'bg-prayaas-50 text-prayaas-700'}">
                        ${item.type.toUpperCase()}
                    </span>
                    <span class="text-[10px] font-semibold text-gray-400">${item.subject}</span>
                </div>
                <h4 class="font-bold text-gray-900 text-xs leading-snug line-clamp-2">${item.title}</h4>
            </div>
            <div class="flex items-center justify-between mt-3 pt-2 border-t border-gray-50 text-[11px] font-semibold text-prayaas-700">
                <span>${item.type === 'video' ? item.duration : item.questions}</span>
                <i class="ph ph-arrow-right"></i>
            </div>
        </div>
    `).join('');

    let testBannersHTML = classTests.map(test => `
        <div class="bg-gradient-prayaas rounded-2xl p-4 text-white shadow-lg shadow-prayaas-800/20 relative overflow-hidden mt-2">
            <div class="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <div class="flex justify-between items-start">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-bold">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live Exam
                </span>
                <span class="text-xs bg-black/20 px-2 py-0.5 rounded-md font-semibold">${test.durationMin} Mins</span>
            </div>
            <h3 class="font-extrabold text-base mt-2.5 leading-snug">${test.title}</h3>
            <p class="text-xs text-prayaas-100 mt-1">${test.totalMarks} Marks • ${test.questionCount} Questions</p>
            <div class="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
                <span class="text-[11px] text-prayaas-100">${test.dateStr}</span>
                <button onclick="startTest(${test.id})" class="bg-white hover:bg-gray-100 text-prayaas-800 font-extrabold text-xs px-4 py-2 rounded-xl shadow-sm transition transform active:scale-95">
                    Start Test Now
                </button>
            </div>
        </div>
    `).join('');

    const html = `
        <!-- Hero Card -->
        <div class="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            <div>
                <p class="text-xs font-semibold text-gray-400">Welcome Back,</p>
                <h1 class="text-xl font-extrabold text-gray-900 tracking-tight">${APP_STATE.user.name}</h1>
                <div class="flex items-center gap-2 mt-1">
                    <span class="text-[11px] font-bold text-prayaas-700 bg-prayaas-50 px-2 py-0.5 rounded-md">Class ${APP_STATE.studentClass} Enrolled</span>
                    <span class="text-[11px] text-gray-400">ID: ${APP_STATE.user.id}</span>
                </div>
            </div>
            <div class="text-right">
                <div class="w-12 h-12 rounded-2xl bg-prayaas-100 border border-prayaas-200 flex flex-col items-center justify-center">
                    <span class="text-[10px] font-bold text-prayaas-700">RANK</span>
                    <span class="text-base font-extrabold text-prayaas-800 leading-none">#${APP_STATE.user.classRank}</span>
                </div>
            </div>
        </div>

        <!-- 4 Action Buttons -->
        <div class="grid grid-cols-4 gap-2.5 pt-1">
            <button onclick="switchStudyTabFilter('videos')" class="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs flex flex-col items-center justify-center gap-1.5 hover:shadow-md transition">
                <div class="w-11 h-11 rounded-xl bg-purple-50 text-prayaas-700 flex items-center justify-center">
                    <i class="ph ph-play-circle text-2xl"></i>
                </div>
                <span class="text-[11px] font-bold text-gray-700">Videos</span>
            </button>
            <button onclick="switchStudyTabFilter('dpps')" class="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs flex flex-col items-center justify-center gap-1.5 hover:shadow-md transition">
                <div class="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <i class="ph ph-file-pdf text-2xl"></i>
                </div>
                <span class="text-[11px] font-bold text-gray-700">DPPs</span>
            </button>
            <button onclick="switchTab('tests')" class="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs flex flex-col items-center justify-center gap-1.5 hover:shadow-md transition">
                <div class="w-11 h-11 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center">
                    <i class="ph ph-exam text-2xl"></i>
                </div>
                <span class="text-[11px] font-bold text-gray-700">Tests</span>
            </button>
            <button onclick="switchTab('leaderboard')" class="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs flex flex-col items-center justify-center gap-1.5 hover:shadow-md transition">
                <div class="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <i class="ph ph-crown text-2xl"></i>
                </div>
                <span class="text-[11px] font-bold text-gray-700">Ranking</span>
            </button>
        </div>

        <!-- Featured Test -->
        <div>
            <div class="flex justify-between items-center mb-1">
                <h3 class="font-extrabold text-sm text-gray-900">Featured Test</h3>
                <button onclick="switchTab('tests')" class="text-xs font-bold text-prayaas-700 hover:underline">View All</button>
            </div>
            ${testBannersHTML}
        </div>

        <!-- Horizontal Learning Vault -->
        <div>
            <div class="flex justify-between items-center mb-2">
                <div class="flex items-center gap-1.5">
                    <i class="ph ph-sparkle text-prayaas-600"></i>
                    <h3 class="font-extrabold text-sm text-gray-900">Class ${APP_STATE.studentClass} Learning Vault</h3>
                </div>
                <button onclick="switchTab('study')" class="text-xs font-bold text-prayaas-700 hover:underline">See All</button>
            </div>
            <div class="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
                ${studyCardsHTML}
            </div>
        </div>

        <!-- Daily Motivation Quote -->
        <div class="bg-amber-50 border border-amber-200/60 p-3.5 rounded-2xl flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                <i class="ph ph-lightbulb text-xl"></i>
            </div>
            <p class="text-xs text-amber-900 font-medium">"Consistent practice in Gurukul builds leaders of tomorrow. Revise DPPs daily!"</p>
        </div>
    `;

    document.getElementById('content-area').innerHTML = html;
}

// --- STUDY VIEW (VIDEOS & DPPS) ---
function renderStudyView() {
    const filter = APP_STATE.activeStudyTab;
    let list = APP_STATE.materials.filter(m => m.class === APP_STATE.studentClass);
    if (filter === 'videos') list = list.filter(m => m.type === 'video');
    if (filter === 'dpps') list = list.filter(m => m.type === 'dpp');

    let itemsHTML = list.map(item => `
        <div class="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between gap-3 hover:border-prayaas-200 transition">
            <div class="flex items-center gap-3 min-w-0">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${item.type === 'video' ? 'bg-rose-50 text-rose-600' : 'bg-prayaas-50 text-prayaas-700'}">
                    <i class="ph ${item.type === 'video' ? 'ph-youtube-logo text-2xl' : 'ph-file-pdf text-2xl'}"></i>
                </div>
                <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                        <span class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${item.type === 'video' ? 'bg-rose-100 text-rose-700' : 'bg-prayaas-100 text-prayaas-800'}">
                            ${item.type.toUpperCase()}
                        </span>
                        <span class="text-[10px] font-semibold text-gray-400">${item.subject}</span>
                    </div>
                    <h4 class="font-bold text-xs text-gray-900 truncate mt-0.5">${item.title}</h4>
                    <p class="text-[10px] text-gray-400 mt-0.5">${item.type === 'video' ? item.duration : `${item.pages} • ${item.questions}`}</p>
                </div>
            </div>
            <div class="flex items-center gap-1.5 flex-shrink-0">
                ${item.type === 'video' ? `
                    <button onclick="openVideoModal('${item.title}', '${item.youtubeId}')" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white shadow-xs">
                        Watch
                    </button>
                ` : `
                    <button onclick="openDppModal('${item.title}', '${item.fileUrl}')" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-prayaas-700 text-white shadow-xs">
                        Open
                    </button>
                `}
            </div>
        </div>
    `).join('');

    const html = `
        <div class="space-y-4">
            <div>
                <h2 class="text-xl font-extrabold text-gray-900">Study Vault</h2>
                <p class="text-xs text-gray-500">Curated lectures and DPPs for Class ${APP_STATE.studentClass}</p>
            </div>

            <!-- Segmented Pill Filter -->
            <div class="flex bg-gray-100 p-1 rounded-xl">
                <button onclick="setStudyFilter('all')" class="flex-1 py-1.5 text-xs font-bold rounded-lg transition ${filter === 'all' ? 'bg-white text-prayaas-800 shadow-xs' : 'text-gray-500'}">
                    All
                </button>
                <button onclick="setStudyFilter('videos')" class="flex-1 py-1.5 text-xs font-bold rounded-lg transition ${filter === 'videos' ? 'bg-white text-prayaas-800 shadow-xs' : 'text-gray-500'}">
                    Lectures
                </button>
                <button onclick="setStudyFilter('dpps')" class="flex-1 py-1.5 text-xs font-bold rounded-lg transition ${filter === 'dpps' ? 'bg-white text-prayaas-800 shadow-xs' : 'text-gray-500'}">
                    DPP PDFs
                </button>
            </div>

            <!-- List -->
            <div class="space-y-2.5">
                ${itemsHTML || '<p class="text-center text-xs text-gray-400 py-8">No content found for this filter.</p>'}
            </div>
        </div>
    `;

    document.getElementById('content-area').innerHTML = html;
}

function setStudyFilter(f) {
    APP_STATE.activeStudyTab = f;
    renderStudyView();
}

function switchStudyTabFilter(f) {
    APP_STATE.activeStudyTab = f;
    switchTab('study');
}

// --- TESTS VIEW ---
function renderTestsView() {
    let testsList = APP_STATE.tests.map(test => {
        const isMyClass = test.class === APP_STATE.studentClass;
        return `
            <div class="bg-white p-4 rounded-2xl border ${isMyClass ? 'border-gray-100' : 'border-dashed border-gray-200 opacity-60'} shadow-xs flex flex-col gap-3">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="flex items-center gap-1.5">
                            <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isMyClass ? 'bg-prayaas-100 text-prayaas-800' : 'bg-gray-100 text-gray-600'}">
                                Class ${test.class}
                            </span>
                            <span class="text-[10px] font-semibold text-gray-400">${test.subject}</span>
                        </div>
                        <h4 class="font-extrabold text-sm text-gray-900 mt-1.5 leading-snug">${test.title}</h4>
                    </div>
                    ${!isMyClass ? '<span class="text-xs text-gray-400 font-bold flex items-center gap-1"><i class="ph ph-lock-key"></i> Other Batch</span>' : ''}
                </div>

                <div class="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-50">
                    <div class="flex items-center gap-3">
                        <span><i class="ph ph-clock inline"></i> ${test.durationMin} mins</span>
                        <span><i class="ph ph-check-circle inline"></i> ${test.totalMarks} Marks</span>
                    </div>
                    ${isMyClass 
                        ? `<button onclick="startTest(${test.id})" class="px-4 py-1.5 bg-prayaas-700 hover:bg-prayaas-800 text-white rounded-xl font-extrabold text-xs shadow-xs transition">
                            Attempt
                           </button>`
                        : `<button disabled class="px-3 py-1.5 bg-gray-100 text-gray-400 rounded-xl font-bold text-xs cursor-not-allowed">
                            Class ${test.class} Only
                           </button>`
                    }
                </div>
            </div>
        `;
    }).join('');

    const html = `
        <div class="space-y-4">
            <div>
                <h2 class="text-xl font-extrabold text-gray-900">Exam Center</h2>
                <p class="text-xs text-gray-500">Live, upcoming, and practice mock tests</p>
            </div>

            <div class="space-y-3">
                ${testsList}
            </div>
        </div>
    `;

    document.getElementById('content-area').innerHTML = html;
}

// --- LEADERBOARD VIEW ---
function renderLeaderboardView() {
    const isClassTab = APP_STATE.activeLeaderboardTab === 'class';
    const list = isClassTab ? APP_STATE.leaderboards.class : APP_STATE.leaderboards.overall;

    const top1 = list.find(s => s.rank === 1);
    const top2 = list.find(s => s.rank === 2);
    const top3 = list.find(s => s.rank === 3);
    const rest = list.filter(s => s.rank > 3);

    let podiumHTML = `
        <div class="grid grid-cols-3 gap-2 items-end pt-4 pb-2 px-1">
            <!-- Rank 2 -->
            <div class="flex flex-col items-center">
                <div class="w-12 h-12 rounded-full border-2 border-slate-300 bg-slate-100 flex items-center justify-center font-extrabold text-slate-700 text-sm shadow-sm relative mb-2">
                    ${top2 ? top2.name.charAt(0) : '-'}
                    <span class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-400 text-white rounded-full text-[10px] flex items-center justify-center font-bold">2</span>
                </div>
                <p class="font-bold text-[11px] text-gray-800 truncate max-w-[85px] text-center">${top2 ? top2.name : '-'}</p>
                <span class="text-[10px] font-extrabold text-slate-600">${top2 ? top2.score + '%' : '-'}</span>
                <div class="podium-2 w-full rounded-t-xl mt-1 flex items-center justify-center text-xs font-black text-slate-500">2nd</div>
            </div>

            <!-- Rank 1 -->
            <div class="flex flex-col items-center -mt-3">
                <i class="ph ph-crown-simple text-amber-500 text-xl animate-bounce"></i>
                <div class="w-14 h-14 rounded-full border-2 border-amber-400 bg-amber-50 flex items-center justify-center font-extrabold text-amber-700 text-base shadow-md relative mb-2">
                    ${top1 ? top1.name.charAt(0) : '-'}
                    <span class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">1</span>
                </div>
                <p class="font-bold text-xs text-gray-900 truncate max-w-[95px] text-center">${top1 ? top1.name : '-'}</p>
                <span class="text-xs font-black text-amber-600">${top1 ? top1.score + '%' : '-'}</span>
                <div class="podium-1 w-full rounded-t-xl mt-1 flex items-center justify-center text-sm font-black text-amber-600">1st</div>
            </div>

            <!-- Rank 3 -->
            <div class="flex flex-col items-center">
                <div class="w-12 h-12 rounded-full border-2 border-amber-700/40 bg-amber-50 flex items-center justify-center font-extrabold text-amber-900 text-sm shadow-sm relative mb-2">
                    ${top3 ? top3.name.charAt(0) : '-'}
                    <span class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-700 text-white rounded-full text-[10px] flex items-center justify-center font-bold">3</span>
                </div>
                <p class="font-bold text-[11px] text-gray-800 truncate max-w-[85px] text-center">${top3 ? top3.name : '-'}</p>
                <span class="text-[10px] font-extrabold text-amber-800">${top3 ? top3.score + '%' : '-'}</span>
                <div class="podium-3 w-full rounded-t-xl mt-1 flex items-center justify-center text-xs font-black text-amber-800">3rd</div>
            </div>
        </div>
    `;

    let restRowsHTML = rest.map(student => {
        const isUser = student.name.includes('(You)');
        return `
            <div class="p-3 rounded-2xl flex items-center justify-between border ${isUser ? 'bg-prayaas-50 border-prayaas-300 font-bold' : 'bg-white border-gray-100'} shadow-xs">
                <div class="flex items-center gap-3">
                    <span class="w-6 text-center text-xs font-extrabold ${isUser ? 'text-prayaas-800' : 'text-gray-400'}">#${student.rank}</span>
                    <div class="w-8 h-8 rounded-full ${isUser ? 'bg-prayaas-700 text-white' : 'bg-gray-100 text-gray-600'} flex items-center justify-center text-xs font-bold">
                        ${student.name.charAt(0)}
                    </div>
                    <div>
                        <p class="text-xs text-gray-900 leading-tight">${student.name}</p>
                        <p class="text-[10px] text-gray-400 font-normal">${student.tests} tests given</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="text-xs font-extrabold text-gray-900">${student.score}%</span>
                    <span class="block text-[10px] font-bold ${student.delta.startsWith('+') ? 'text-emerald-600' : student.delta.startsWith('-') ? 'text-rose-600' : 'text-gray-400'}">
                        ${student.delta === '0' ? '• same' : student.delta + ' rank'}
                    </span>
                </div>
            </div>
        `;
    }).join('');

    const html = `
        <div class="space-y-4">
            <div>
                <h2 class="text-xl font-extrabold text-gray-900">Hall of Fame</h2>
                <p class="text-xs text-gray-500">Auto-updated every 10 minutes via cron</p>
            </div>

            <!-- Tab Switcher: Class vs Overall -->
            <div class="flex bg-gray-100 p-1 rounded-xl">
                <button onclick="setLeaderboardTab('class')" class="flex-1 py-1.5 text-xs font-bold rounded-lg transition ${isClassTab ? 'bg-white text-prayaas-800 shadow-xs' : 'text-gray-500'}">
                    Meri Class (${APP_STATE.studentClass}th)
                </button>
                <button onclick="setLeaderboardTab('overall')" class="flex-1 py-1.5 text-xs font-bold rounded-lg transition ${!isClassTab ? 'bg-white text-prayaas-800 shadow-xs' : 'text-gray-500'}">
                    Poora Gurukul
                </button>
            </div>

            <!-- Podium -->
            <div class="bg-white rounded-3xl p-3 border border-gray-100 shadow-xs">
                ${podiumHTML}
            </div>

            <!-- List Below Podium -->
            <div class="space-y-2">
                ${restRowsHTML}
            </div>

            <!-- Sticky User Rank Card -->
            <div class="user-rank-floating bg-prayaas-950 text-white p-3.5 rounded-2xl flex items-center justify-between mt-4">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-prayaas-700 flex items-center justify-center font-black text-sm">
                        #${isClassTab ? APP_STATE.user.classRank : APP_STATE.user.overallRank}
                    </div>
                    <div>
                        <p class="text-xs font-bold">Your Standing</p>
                        <p class="text-[10px] text-prayaas-200">Based on ${APP_STATE.user.testsAttempted} completed tests</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="text-sm font-extrabold text-amber-400">${APP_STATE.user.avgScore}%</span>
                    <span class="block text-[10px] text-emerald-400 font-semibold">Top 15%</span>
                </div>
            </div>
        </div>
    `;

    document.getElementById('content-area').innerHTML = html;
}

function setLeaderboardTab(tab) {
    APP_STATE.activeLeaderboardTab = tab;
    renderLeaderboardView();
}

// --- PROFILE VIEW ---
function renderProfileView() {
    const html = `
        <div class="space-y-4">
            <!-- Student ID Card -->
            <div class="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs text-center relative overflow-hidden">
                <div class="w-20 h-20 mx-auto rounded-full bg-prayaas-100 text-prayaas-800 flex items-center justify-center text-3xl font-extrabold border-4 border-white shadow-md">
                    ${APP_STATE.user.avatarInitial}
                </div>
                <h3 class="font-extrabold text-base text-gray-900 mt-3">${APP_STATE.user.name}</h3>
                <p class="text-xs font-semibold text-prayaas-700">Class ${APP_STATE.studentClass} • ID: ${APP_STATE.user.id}</p>

                <div class="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                    <div class="bg-gray-50 p-2.5 rounded-xl">
                        <span class="text-[10px] text-gray-400 font-bold uppercase">Tests Done</span>
                        <p class="text-sm font-extrabold text-gray-800">${APP_STATE.user.testsAttempted}</p>
                    </div>
                    <div class="bg-gray-50 p-2.5 rounded-xl">
                        <span class="text-[10px] text-gray-400 font-bold uppercase">Avg Accuracy</span>
                        <p class="text-sm font-extrabold text-emerald-600">${APP_STATE.user.avgScore}%</p>
                    </div>
                </div>
            </div>

            <!-- Profile Menu -->
            <div class="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 shadow-xs overflow-hidden">
                <div class="w-full p-3.5 flex items-center justify-between text-left bg-gray-50/50">
                    <div class="flex items-center gap-3">
                        <i class="ph ph-identification-badge text-lg text-prayaas-700"></i>
                        <span class="text-xs font-bold text-gray-700">Enrolled Batch</span>
                    </div>
                    <span class="text-xs font-bold text-prayaas-700">Class ${APP_STATE.studentClass}</span>
                </div>
                <button onclick="alert('Student analytics breakdown will load in Phase 4')" class="w-full p-3.5 flex items-center justify-between text-left hover:bg-gray-50">
                    <div class="flex items-center gap-3">
                        <i class="ph ph-chart-polar text-lg text-gray-500"></i>
                        <span class="text-xs font-bold text-gray-700">Performance Report</span>
                    </div>
                    <i class="ph ph-caret-right text-gray-400"></i>
                </button>
                <button onclick="alert('Hostinger App Version: 1.0.0-Beta')" class="w-full p-3.5 flex items-center justify-between text-left hover:bg-gray-50">
                    <div class="flex items-center gap-3">
                        <i class="ph ph-info text-lg text-gray-500"></i>
                        <span class="text-xs font-bold text-gray-700">About Prayaas Gurukul</span>
                    </div>
                    <span class="text-[10px] font-semibold text-gray-400">v1.0 (PWA)</span>
                </button>
            </div>

            <button onclick="confirmLogout()" class="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl font-extrabold text-xs transition">
                Logout Session
            </button>
        </div>
    `;

    document.getElementById('content-area').innerHTML = html;
}

// ==========================================
// 5. TEST RUNNER LOGIC
// ==========================================
function startTest(testId) {
    const test = APP_STATE.tests.find(t => t.id === testId);
    if (!test) return;

    if (test.class !== APP_STATE.studentClass) {
        alert("This test is reserved for Class " + test.class + " students.");
        return;
    }

    const session = APP_STATE.activeTestSession;
    session.testId = testId;
    session.title = test.title;
    session.currentQIdx = 0;
    session.secondsLeft = test.durationMin * 60;
    session.userAnswers = {};
    session.reviewedStatus = {};

    document.getElementById('tr-test-title').innerText = test.title;
    document.getElementById('test-runner-overlay').classList.remove('hidden');
    document.getElementById('test-runner-overlay').classList.add('flex');

    if (session.timerInterval) clearInterval(session.timerInterval);
    session.timerInterval = setInterval(updateTestTimer, 1000);

    renderCurrentQuestion();
    renderPaletteGrid();
}

function updateTestTimer() {
    const session = APP_STATE.activeTestSession;
    if (session.secondsLeft <= 0) {
        clearInterval(session.timerInterval);
        alert("Time is up! Your answers are being submitted.");
        finalizeTestSubmission();
        return;
    }
    session.secondsLeft--;
    const mins = Math.floor(session.secondsLeft / 60);
    const secs = session.secondsLeft % 60;
    document.getElementById('tr-timer').innerText = 
        `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function renderCurrentQuestion() {
    const session = APP_STATE.activeTestSession;
    const q = session.questions[session.currentQIdx];
    const total = session.questions.length;

    document.getElementById('tr-question-tracker').innerText = `Question ${session.currentQIdx + 1} of ${total}`;

    const selectedOption = session.userAnswers[session.currentQIdx];
    const isReviewed = session.reviewedStatus[session.currentQIdx];

    const optionsHTML = q.options.map((opt, i) => `
        <div onclick="selectTestOption(${i})" 
             class="option-card p-3.5 rounded-2xl border-2 cursor-pointer flex items-center gap-3 transition ${selectedOption === i ? 'selected' : 'border-gray-100 bg-white hover:border-gray-200'}">
            <span class="option-badge w-7 h-7 rounded-lg bg-gray-100 text-gray-700 font-extrabold text-xs flex items-center justify-center">
                ${String.fromCharCode(65 + i)}
            </span>
            <span class="text-xs font-semibold text-gray-800 leading-snug">${opt}</span>
        </div>
    `).join('');

    const html = `
        <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            <div class="flex justify-between items-center mb-3">
                <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-gray-100 text-gray-600">Q.${session.currentQIdx + 1}</span>
                <span class="text-[10px] font-bold text-emerald-600">+4 / -1 Mark</span>
            </div>
            <p class="font-extrabold text-sm text-gray-900 leading-relaxed">${q.question}</p>
        </div>

        <div class="space-y-2.5">
            ${optionsHTML}
        </div>
    `;

    document.getElementById('tr-question-container').innerHTML = html;

    const reviewBtn = document.getElementById('tr-review-btn');
    if (isReviewed) {
        reviewBtn.classList.remove('bg-amber-50', 'text-amber-700');
        reviewBtn.classList.add('bg-amber-500', 'text-white');
    } else {
        reviewBtn.classList.add('bg-amber-50', 'text-amber-700');
        reviewBtn.classList.remove('bg-amber-500', 'text-white');
    }

    const nextBtn = document.getElementById('tr-next-btn');
    if (session.currentQIdx === total - 1) {
        nextBtn.innerHTML = 'Finish <i class="ph ph-check inline"></i>';
    } else {
        nextBtn.innerHTML = 'Next <i class="ph ph-caret-right inline"></i>';
    }

    renderPaletteGrid();
}

function selectTestOption(optIdx) {
    const session = APP_STATE.activeTestSession;
    session.userAnswers[session.currentQIdx] = optIdx;
    renderCurrentQuestion();
}

function markQuestionForReview() {
    const session = APP_STATE.activeTestSession;
    session.reviewedStatus[session.currentQIdx] = !session.reviewedStatus[session.currentQIdx];
    renderCurrentQuestion();
}

function nextQuestion() {
    const session = APP_STATE.activeTestSession;
    if (session.currentQIdx < session.questions.length - 1) {
        session.currentQIdx++;
        renderCurrentQuestion();
    } else {
        promptSubmitTest();
    }
}

function togglePaletteDrawer() {
    const drawer = document.getElementById('tr-palette-drawer');
    drawer.classList.toggle('hidden');
}

function renderPaletteGrid() {
    const session = APP_STATE.activeTestSession;
    const grid = document.getElementById('tr-palette-grid');
    if (!grid) return;

    grid.innerHTML = session.questions.map((_, i) => {
        const isAnswered = session.userAnswers[i] !== undefined;
        const isReview = session.reviewedStatus[i];
        const isCurrent = session.currentQIdx === i;

        let statusClass = "bg-gray-100 text-gray-600";
        if (isReview) statusClass = "bg-amber-500 text-white";
        else if (isAnswered) statusClass = "bg-emerald-500 text-white";

        return `
            <button onclick="jumpToQuestion(${i})" class="w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center transition ${statusClass} ${isCurrent ? 'ring-2 ring-prayaas-800' : ''}">
                ${i + 1}
            </button>
        `;
    }).join('');
}

function jumpToQuestion(idx) {
    APP_STATE.activeTestSession.currentQIdx = idx;
    document.getElementById('tr-palette-drawer').classList.add('hidden');
    renderCurrentQuestion();
}

function promptSubmitTest() {
    const session = APP_STATE.activeTestSession;
    const answeredCount = Object.keys(session.userAnswers).length;
    const total = session.questions.length;

    const confirmed = confirm(`Are you sure you want to submit?\nAnswered: ${answeredCount} / ${total}\nUnanswered: ${total - answeredCount}`);
    if (confirmed) {
        finalizeTestSubmission();
    }
}

function finalizeTestSubmission() {
    const session = APP_STATE.activeTestSession;
    clearInterval(session.timerInterval);

    let score = 0;
    session.questions.forEach((q, idx) => {
        if (session.userAnswers[idx] === q.correct) {
            score += 4;
        } else if (session.userAnswers[idx] !== undefined) {
            score -= 1;
        }
    });

    document.getElementById('test-runner-overlay').classList.add('hidden');
    alert(`🎉 Test Submitted!\nScore: ${score} Marks.\nLeaderboard rankings will update automatically.`);
    switchTab('leaderboard');
}

// ==========================================
// 6. MODALS & MEDIA CONTROLLERS
// ==========================================
function openVideoModal(title, youtubeId) {
    document.getElementById('video-modal-title').innerText = title;
    document.getElementById('video-frame').src = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&modestbranding=1&rel=0`;
    const modal = document.getElementById('video-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeVideoModal() {
    document.getElementById('video-frame').src = "";
    const modal = document.getElementById('video-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function openDppModal(title, fileUrl) {
    document.getElementById('dpp-modal-title').innerText = title;
    document.getElementById('dpp-frame').src = fileUrl;
    document.getElementById('dpp-download-link').href = fileUrl;
    const modal = document.getElementById('dpp-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeDppModal() {
    document.getElementById('dpp-frame').src = "";
    const modal = document.getElementById('dpp-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function openNotificationModal() {
    const modal = document.getElementById('notification-modal');
    const container = document.getElementById('notifications-list');

    container.innerHTML = APP_STATE.notifications.map(n => `
        <div class="py-2.5">
            <div class="flex justify-between items-start">
                <h4 class="font-bold text-xs text-gray-900">${n.title}</h4>
                <span class="text-[10px] text-gray-400">${n.time}</span>
            </div>
            <p class="text-xs text-gray-600 mt-1 leading-normal">${n.body}</p>
        </div>
    `).join('');

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeNotificationModal() {
    const modal = document.getElementById('notification-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// ==========================================
// 7. INITIALIZATION & PWA
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    // Check if user has an active token in localStorage
    const savedToken = localStorage.getItem('prayaas_token');

    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        splash.style.opacity = '0';

        setTimeout(() => {
            splash.style.display = 'none';

            if (savedToken) {
                // User already logged in -> Go straight to App
                APP_STATE.isAuthenticated = true;
                document.getElementById('app-container').classList.remove('hidden');
                switchTab('home');
            } else {
                // First time or logged out -> Show Login Screen
                document.getElementById('login-screen').classList.remove('hidden');
            }
        }, 500);
    }, 1800);

    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }
});