import { readFileSync, writeFileSync } from 'fs';
let content = readFileSync('AdminSettingsPage.jsx', 'utf8');

const rawLines = content.split(/\r?\n/);

// Find TAB 2: PENGIRIMAN
const tab2Start = rawLines.findIndex(l => l.includes("activeTab === 'pengiriman'"));

if (tab2Start === -1) {
    console.error("Tab 2 not found");
    process.exit(1);
}

// Kolom Kiri in Tab 2 is around here
const leftStart = rawLines.findIndex((l, i) => i > tab2Start && l.includes('{/* Kolom Kiri */}'));
const rajStart = rawLines.findIndex((l, i) => i > leftStart && l.includes('{/* Kolom Kanan */}'));
const jadwalStart = rawLines.findIndex((l, i) => i > rajStart && l.includes('{/* Jadwal Pengiriman */}'));

let jadwalEnd = jadwalStart;
if (jadwalStart !== -1) {
    // Find the end </div>. Jadwal block has multiple nested divs.
    // Easiest is to search forward for '{/* TAB 3: PEMBAYARAN */}' and go back a few lines.
    const tab3Start = rawLines.findIndex(l => l.includes('TAB 3: PEMBAYARAN'));
    jadwalEnd = tab3Start - 3;
    while (!rawLines[jadwalEnd].includes('</div>')) {
        jadwalEnd--;
    }
}

console.log('Left Start:', leftStart);
console.log('Raj Start:', rajStart);
console.log('Jadwal Start:', jadwalStart);
console.log('Jadwal End:', jadwalEnd);

// New Jadwal Block using the requested "Array of times" Logic:
const newJadwalContent = `                                    {/* Jadwal Pengiriman */}
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 text-lg">
                                            <Icon name="schedule" size={22} className="text-primary" />
                                            Jadwal Pengiriman Kurir
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Estimasi Pengiriman Setelah Bayar</label>
                                                <div className="flex items-center gap-3">
                                                    <input type="number" value={settings.delivery_hours_after_payment || ''} onChange={(e) => handleChange('delivery_hours_after_payment', e.target.value)} placeholder="3" className={\`\${inputClass} w-24\`} />
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

                                                    // Normalize legacy [open, close] format → array of times
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
                                                            <div key={dayKey} className={\`rounded-xl border-2 transition-all \${isActive ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}\`}>
                                                                {/* Day Header */}
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
                                                                        <span className={\`font-bold text-sm \${isActive ? 'text-primary' : 'text-slate-500'}\`}>{dayName}</span>
                                                                    </div>
                                                                    {isActive ? (
                                                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase tracking-wider">{times.length} jam antar</span>
                                                                    ) : (
                                                                        <span className="text-[10px] text-slate-400 italic">Tidak antar</span>
                                                                    )}
                                                                </div>

                                                                {/* Time slots */}
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
                                                                                id={\`add-time-\${dayKey}\`}
                                                                                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                                                onKeyDown={(e) => { if (e.key === 'Enter') { addTime(e.target.value); e.target.value = '' } }}
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const input = document.getElementById(\`add-time-\${dayKey}\`)
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
                                    </div>`;

// Construct new lines:
let finalLines = [];

for (let i = 0; i < rawLines.length; i++) {
   if (i === leftStart) {
       finalLines.push(rawLines[i]); // {/* Kolom Kiri */}
       finalLines.push('                                    <div className="space-y-6">');
   } else if (i === rajStart - 1 && rawLines[i].includes('</div>')) {
       // Just before Kolom Kanan starts, close the space-y-6 wrapping Kolom Kiri
       // Insert the new Jadwal Block right before closing Space-y-6
       finalLines.push(rawLines[i]); // close the Map/Radius block
       finalLines.push('');
       finalLines.push(newJadwalContent);
       finalLines.push('                                    </div>'); // close space-y-6 context
   } else if (i >= jadwalStart && i <= jadwalEnd) {
       // Skip original Jadwal block
       continue;
   } else {
       finalLines.push(rawLines[i]);
   }
}

writeFileSync('AdminSettingsPage.jsx', finalLines.join('\\r\\n'));
console.log('Re-applied script and moved Jadwal!');
