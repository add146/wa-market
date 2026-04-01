const fs = require('fs');
let content = fs.readFileSync('AdminSettingsPage.jsx', 'utf8');

// The exact string starting from {/* Jadwal Pengiriman */} to its closing div.
// It's located right after the RajaOngkir div which ends with:
//                                          )}
//                                      </div>
//  
//                                      {/* Jadwal Pengiriman */}

const lines = content.split('\n');

const leftStartIdx = lines.findIndex(l => l.includes('{/* Kolom Kiri */}'));
const rajStartIdx = lines.findIndex(l => l.includes('{/* Kolom Kanan */}'));
const jadwalStartIdx = lines.findIndex(l => l.includes('{/* Jadwal Pengiriman */}'));

if (leftStartIdx === -1 || rajStartIdx === -1 || jadwalStartIdx === -1) {
    console.error("Could not find required section markers");
    process.exit(1);
}

// Find Jadwal block bounds
let jadwalEndIdx = jadwalStartIdx;
let divCount = 0;
while (jadwalEndIdx < lines.length) {
    if(jadwalEndIdx > jadwalStartIdx + 130 && lines[jadwalEndIdx].includes('</div>')) {
        // Find the exact matching line index for the close of the block 
        // which has the exact indentation '                                    </div>'
        if (lines[jadwalEndIdx].startsWith('                                    </div>')) {
             break;
        }
    }
    jadwalEndIdx++;
}

console.log("Jadwal Start:", jadwalStartIdx);
console.log("Jadwal End:", jadwalEndIdx);

// Extract the block
let jadwalBlock = lines.slice(jadwalStartIdx, jadwalEndIdx + 1);

// Rename title
for(let i=0; i<jadwalBlock.length; i++) {
   if (jadwalBlock[i].includes('Jadwal Operasional Kurir')) {
      jadwalBlock[i] = jadwalBlock[i].replace('Jadwal Operasional Kurir', 'Jadwal Pengiriman Kurir');
   }
}

// Rebuild the file
let newLines = [];
let i = 0;

while(i < lines.length) {
    if (i === leftStartIdx) {
        // We're at Kolom Kiri
        newLines.push(lines[i]); // {/* Kolom Kiri */}
        newLines.push('                                    <div className="space-y-6">');
        i++;
    } else if (i === rajStartIdx) {
        // We reached Kolom Kanan. We need to close Left Kolom space-y-6 right before this.
        // Wait! The last line of Left Kolom is lines[rajStartIdx - X] (the </div>)
        // Let's insert the Jadwal Block RIGHT BEFORE {/* Kolom Kanan */}
        // But first insert the closing </div> for space-y-6
        // Actually, let's insert Jadwal Block right inside space-y-6.
        newLines.push('');
        newLines.push(...jadwalBlock);
        newLines.push('                                    </div>'); // close space-y-6 wrapper
        newLines.push('');
        newLines.push(lines[i]); // {/* Kolom Kanan */}
        i++;
    } else if (i >= jadwalStartIdx && i <= jadwalEndIdx) {
        // Skip the original Jadwal Block
        i++;
    } else {
        newLines.push(lines[i]);
        i++;
    }
}

content = newLines.join('\n');
fs.writeFileSync('AdminSettingsPage.jsx', content);
console.log("Done successfully!");
