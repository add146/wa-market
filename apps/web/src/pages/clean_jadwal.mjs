import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('AdminSettingsPage.jsx', 'utf8');
const lines = content.split(/\r?\n/);

// We need to identify sections
const getSection = (marker) => lines.findIndex(l => l.includes(marker));

const tab1Start = getSection("activeTab === 'toko'");
const tab2Start = getSection("activeTab === 'pengiriman'");
const tab3Start = getSection("activeTab === 'pembayaran'");

// Delete Jadwal Pengiriman Kurir Toko from TAB 1
const tab1KananStart = getSection("{/* Kolom Kanan */} // inside tab 1"); 
// wait, the marker might just be {/* Kolom Kanan */}
let t1Kanan = -1;
for(let i=tab1Start; i<tab2Start; i++) {
    if (lines[i].includes('{/* Kolom Kanan */}')) {
        t1Kanan = i;
        break;
    }
}
let t1JadwalStart = -1;
for(let i=t1Kanan; i<tab2Start; i++) {
    if (lines[i].includes('Jadwal Pengiriman Kurir Toko')) {
        // usually the div starts 2 lines above
        t1JadwalStart = i - 2;
        break;
    }
}

// Delete Jadwal Operasional Kurir from TAB 2
let t2Kanan = -1;
for(let i=tab2Start; i<tab3Start; i++) {
    if (lines[i].includes('{/* Kolom Kanan */}')) {
        t2Kanan = i;
        break;
    }
}
let t2JadwalStart = -1;
for(let i=t2Kanan; i<tab3Start; i++) {
    if (lines[i].includes('{/* Jadwal Pengiriman */}')) {
        t2JadwalStart = i;
        break;
    }
}

console.log("Tab 1 Kanan:", t1Kanan, "Jadwal:", t1JadwalStart);
console.log("Tab 2 Kanan:", t2Kanan, "Jadwal:", t2JadwalStart);

// Let's find exactly the line ranges to delete
const findDivEnd = (startIndex, maxIndex) => {
    let divCount = 0;
    let started = false;
    for(let i = startIndex; i < maxIndex; i++) {
        const line = lines[i];
        if (line.includes('<div')) {
            divCount += (line.match(/<div/g) || []).length;
            started = true;
        }
        if (line.includes('</div')) {
            divCount -= (line.match(/<\/div/g) || []).length;
        }
        if (started && divCount <= 0) {
            return i;
        }
    }
    return -1;
};

let toDelete = new Set();

if (t1JadwalStart !== -1) {
    let t1End = findDivEnd(t1JadwalStart, tab2Start);
    console.log("T1 Jadwal ends at:", t1End);
    for(let i=t1JadwalStart; i<=t1End; i++) toDelete.add(i);
    // There might also be a comment above it, let's look for {/* Day Schedule */}
    for(let i=t1JadwalStart; i>t1JadwalStart-5; i--) {
        if(lines[i].includes('{/* Day Schedule */}')) toDelete.add(i);
    }
}

if (t2JadwalStart !== -1) {
    let t2End = findDivEnd(t2JadwalStart + 1, tab3Start); // +1 because {/* Jadwal Pengiriman */} is not a div
    console.log("T2 Jadwal ends at:", t2End);
    for(let i=t2JadwalStart; i<=t2End; i++) toDelete.add(i);
}

const newJadwalContent = \`                                    {/* Jadwal Pengiriman Cukup Sini */}
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 text-lg">
                                            <Icon name="schedule" size={22} className="text-primary" />
                                            Jadwal Pengiriman Kurir
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Estimasi Pengiriman Setelah Bayar</label>
                                                <div className="flex items-center gap-3">
                                                    <input type="number" value={settings.delivery_hours_after_payment || ''} onChange={(e) => handleChange('delivery_hours_after_payment', e.target.value)} placeholder="3" className={\\\`\${inputClass} w-24\\\`} />
                                                    <span className="text-sm font-medium text-slate-500 uppercase tracking-widest text-[10px]">Jam</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                {(() => {
                                                    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
                                                    const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
                                                    let schedule = {}
                                                    try { schedule = settings.delivery_schedule ? JSON.parse(settings.delivery_schedule) : {} } catch { schedule = {} }

                                                    const updateSchedule = (newSchedule) => handleChange('delivery_schedule', JSON.stringify(newSchedule))

                                                    const getTimes = (dayKey) => {
                                                        const val = schedule[dayKey]
                                                        if (!val) return []
                                                        if (Array.isArray(val)) {
                                                            if (val.length === 2 && /^\\d{2}:\\d{2}$/.test(val[0]) && /^\\d{2}:\\d{2}$/.test(val[1]) && val[0] < val[1]) {
                                                                return val
                                                            }
                                                            return val
                                                        }
                                                        return []
                                                    }

                                                    return days.map((dayName, i) => {
                                                        const dayKey = dayKeys[i]
                                                        const isActive = Array.isArray(schedule[dayKey]) && schedule[dayKey].length > 0
                                                        const times = getTimes(dayKey)

                                                        const addTime = (newTime) => {
                                                            if (!newTime) return
                                                            const current = getTimes(dayKey)
                                                            if (current.includes(newTime)) return
                                                            const updated = [...current, newTime].sort()
                                                            const newSched = { ...schedule, [dayKey]: updated }
                                                            updateSchedule(newSched)
                                                        }

                                                        const removeTime = (time) => {
                                                            const current = getTimes(dayKey)
                                                            const updated = current.filter(t => t !== time)
                                                            const newSched = { ...schedule }
                                                            if (updated.length === 0) delete newSched[dayKey]
                                                            else newSched[dayKey] = updated
                                                            updateSchedule(newSched)
                                                        }

                                                        return (
                                                            <div key={dayKey} className={\\\`rounded-xl border-2 transition-all \${isActive ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}\\\`}>
                                                                <div
                                                                    className="flex items-center justify-between px-4 py-3 cursor-pointer"
                                                                    onClick={() => {
                                                                        const newSched = { ...schedule }
                                                                        if (isActive) delete newSched[dayKey]
                                                                        else newSched[dayKey] = ['08:00', '10:00', '14:00']
                                                                        updateSchedule(newSched)
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <Icon name={isActive ? 'check_circle' : 'radio_button_unchecked'} size={20} className={isActive ? 'text-primary' : 'text-slate-300 dark:text-slate-600'} />
                                                                        <span className={\\\`font-bold text-sm \${isActive ? 'text-primary' : 'text-slate-500'}\\\`}>{dayName}</span>
                                                                    </div>
                                                                    {isActive ? (
                                                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase tracking-wider">{times.length} jam antar</span>
                                                                    ) : (
                                                                        <span className="text-[10px] text-slate-400 italic">Tidak antar</span>
                                                                    )}
                                                                </div>

                                                                {isActive && (
                                                                    <div className="px-4 pb-4 border-t border-primary/10" onClick={(e) => e.stopPropagation()}>
                                                                        {times.length > 0 && (
                                                                            <div className="flex flex-wrap gap-2 mt-3 mb-3">
                                                                                {times.map(time => (
                                                                                    <div key={time} className="flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 border-2 border-primary/30 rounded-xl">
                                                                                        <Icon name="schedule" size={13} className="text-primary" />
                                                                                        <span className="text-sm font-bold text-primary">{time}</span>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => removeTime(time)}
                                                                                            className="ml-1 w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 flex items-center justify-center transition-colors"
                                                                                        >
                                                                                            <Icon name="close" size={11} />
                                                                                        </button>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                        <div className="flex items-center gap-2">
                                                                            <input
                                                                                type="time"
                                                                                id={\\\`add-time-\${dayKey}\\\`}
                                                                                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                                                onKeyDown={(e) => { if (e.key === 'Enter') { addTime(e.target.value); e.target.value = '' } }}
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const input = document.getElementById(\\\`add-time-\${dayKey}\\\`)
                                                                                    if (input?.value) { addTime(input.value); input.value = '' }
                                                                                }}
                                                                                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-colors whitespace-nowrap"
                                                                            >
                                                                                <Icon name="add" size={14} />
                                                                                Tambah Jam
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })
                                                })()}
                                            </div>
                                        </div>
                                    </div>\`;


let finalLines = [];
let t2KiriStart = -1;
let inT2Kiri = false;

for(let i=tab2Start; i<tab3Start; i++) {
    if (lines[i].includes('{/* Kolom Kiri */}')) {
        t2KiriStart = i;
        break;
    }
}

for(let i=0; i<lines.length; i++) {
    if (toDelete.has(i)) continue;

    if (i === t2KiriStart) {
        finalLines.push(lines[i]);
        finalLines.push('                                    <div className="space-y-6">');
        inT2Kiri = true;
        continue;
    }

    if (inT2Kiri && i === t2Kanan) {
        // Close left column
        finalLines.push('');
        finalLines.push(...newJadwalContent.split('\\n'));
        finalLines.push('                                    </div>');
        finalLines.push('');
        inT2Kiri = false;
    }

    finalLines.push(lines[i]);
}

writeFileSync('AdminSettingsPage.jsx', finalLines.join('\\r\\n'));
console.log('Cleanup script finished!');
