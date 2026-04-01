import { readFileSync, writeFileSync } from 'fs';
let content = readFileSync('AdminSettingsPage.jsx', 'utf8');

const rawLines = content.split(/\r?\n/);
let inJadwal = false;
let jadwalLines = [];
let otherLines = [];

for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    
    // Check if we are starting the Jadwal block
    if (line.includes('{/* Jadwal Pengiriman */}')) {
        inJadwal = true;
    }
    
    if (inJadwal) {
        // Change title safely using a simpler regex or direct replace
        let modifiedLine = line.replace('Jadwal Operasional Kurir', 'Jadwal Pengiriman Kurir');
        jadwalLines.push(modifiedLine);
        
        // Check if we reached the closing div of the Jadwal block
        // In my previous log it was exactly at line 634: '                                    </div>'
        // right before 635 which is also '                                    </div>'
        // Let's rely on line length being exactly `{/* Jadwal Pengiriman */}` to its `</div>`
        // We can just count divs. Or look for the EXACT line signature:
        // Actually, just pushing until we hit the </div> that closes the shadow-sm div.
        // It's 135 lines exactly from earlier analysis. We'll capture exactly 135 lines.
        if (jadwalLines.length === 135) {
            inJadwal = false;
        }
    } else {
        // Not in Jadwal block
        otherLines.push(line);
    }
}

// Now we need to insert `jadwalLines` under `Kolom Kiri`
let finalLines = [];
let startLeft = false;
let insideLeft = false;

for (let i = 0; i < otherLines.length; i++) {
    const line = otherLines[i];
    finalLines.push(line);
    
    if (line.includes('{/* Kolom Kiri */}')) {
        finalLines.push('                                    <div className="space-y-6">');
        insideLeft = true;
    }
    
    // We need to close the `space-y-6` diff of Kolom Kiri right before Kolom Kanan
    if (i < otherLines.length - 1 && otherLines[i+1].includes('{/* Kolom Kanan */}')) {
        if (insideLeft) {
            finalLines.push('');
            finalLines.push(...jadwalLines);
            finalLines.push('                                    </div>');
            finalLines.push('');
            insideLeft = false;
        }
    }
}

writeFileSync('AdminSettingsPage.jsx', finalLines.join('\r\n'));
console.log('Successfully completed movement!');
