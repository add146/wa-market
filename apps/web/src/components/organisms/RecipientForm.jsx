import { Icon, Select, Textarea } from '../atoms'
import { FormField, PhoneInput } from '../molecules'

/**
 * RecipientForm - Data Penerima & Alamat section
 */
function RecipientForm({
    recipientName,
    onRecipientNameChange,
    phone,
    onPhoneChange,
    province,
    onProvinceChange,
    city,
    onCityChange,
    district,
    onDistrictChange,
    address,
    onAddressChange,
    provinces = [],
    cities = [],
    districts = [],
}) {
    return (
        <section className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-color dark:border-surface-dark shadow-sm p-6 lg:p-8">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border-color dark:border-gray-800">
                <Icon name="person_pin" size={24} className="text-primary" />
                <h2 className="text-xl font-bold text-text-main-light dark:text-white">
                    Data Penerima & Alamat
                </h2>
            </div>

            {/* Name & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <FormField label="Nama Penerima">
                    <input
                        type="text"
                        value={recipientName}
                        onChange={onRecipientNameChange}
                        placeholder="Contoh: Budi Santoso"
                        className="w-full rounded-lg border border-input-border bg-background-light dark:bg-background-dark focus:border-primary focus:ring-primary/20 h-12 px-4 transition-all text-text-main-light dark:text-text-main-dark placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark"
                    />
                </FormField>
                <FormField label="No. WhatsApp">
                    <PhoneInput
                        value={phone}
                        onChange={onPhoneChange}
                    />
                </FormField>
            </div>

            {/* Province & City */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <FormField label="Provinsi">
                    <Select
                        value={province}
                        onChange={onProvinceChange}
                        placeholder="Pilih Provinsi"
                    >
                        <option value="">Pilih Provinsi</option>
                        {provinces.map((prov) => (
                            <option key={prov.value} value={prov.value}>
                                {prov.label}
                            </option>
                        ))}
                    </Select>
                </FormField>
                <FormField label="Kota/Kabupaten">
                    <Select
                        value={city}
                        onChange={onCityChange}
                        placeholder="Pilih Kota/Kab"
                    >
                        <option value="">Pilih Kota/Kab</option>
                        {cities.map((c) => (
                            <option key={c.value} value={c.value}>
                                {c.label}
                            </option>
                        ))}
                    </Select>
                </FormField>
            </div>

            {/* District */}
            <div className="mb-5">
                <FormField label="Kecamatan">
                    <Select
                        value={district}
                        onChange={onDistrictChange}
                        placeholder="Pilih Kecamatan"
                    >
                        <option value="">Pilih Kecamatan</option>
                        {districts.map((d) => (
                            <option key={d.value} value={d.value}>
                                {d.label}
                            </option>
                        ))}
                    </Select>
                </FormField>
            </div>

            {/* Address */}
            <FormField label="Alamat Lengkap">
                <Textarea
                    value={address}
                    onChange={onAddressChange}
                    placeholder="Nama Jalan, No. Rumah, RT/RW, Patokan..."
                    rows={3}
                />
            </FormField>
        </section>
    )
}

export default RecipientForm
