export interface JudetMeta {
  code: string
  name: string
  center: { lat: number; lng: number }
  zoom: number
}

export const JUDETE: JudetMeta[] = [
  { code: 'AB', name: 'Alba',               center: { lat: 46.08, lng: 23.57 }, zoom: 9 },
  { code: 'AR', name: 'Arad',               center: { lat: 46.17, lng: 21.65 }, zoom: 9 },
  { code: 'AG', name: 'Argeș',              center: { lat: 44.86, lng: 24.87 }, zoom: 9 },
  { code: 'BC', name: 'Bacău',              center: { lat: 46.49, lng: 26.75 }, zoom: 9 },
  { code: 'BH', name: 'Bihor',              center: { lat: 47.06, lng: 22.10 }, zoom: 9 },
  { code: 'BN', name: 'Bistrița-Năsăud',   center: { lat: 47.13, lng: 24.50 }, zoom: 9 },
  { code: 'BT', name: 'Botoșani',          center: { lat: 47.75, lng: 26.67 }, zoom: 9 },
  { code: 'BV', name: 'Brașov',            center: { lat: 45.65, lng: 25.60 }, zoom: 9 },
  { code: 'BR', name: 'Brăila',            center: { lat: 45.27, lng: 27.96 }, zoom: 10 },
  { code: 'B',  name: 'București',         center: { lat: 44.43, lng: 26.10 }, zoom: 11 },
  { code: 'BZ', name: 'Buzău',             center: { lat: 45.37, lng: 26.68 }, zoom: 9 },
  { code: 'CS', name: 'Caraș-Severin',     center: { lat: 45.31, lng: 22.07 }, zoom: 9 },
  { code: 'CL', name: 'Călărași',          center: { lat: 44.20, lng: 26.42 }, zoom: 10 },
  { code: 'CJ', name: 'Cluj',              center: { lat: 46.77, lng: 23.60 }, zoom: 9 },
  { code: 'CT', name: 'Constanța',         center: { lat: 44.18, lng: 28.65 }, zoom: 9 },
  { code: 'CV', name: 'Covasna',           center: { lat: 45.87, lng: 25.97 }, zoom: 9 },
  { code: 'DB', name: 'Dâmbovița',         center: { lat: 44.93, lng: 25.46 }, zoom: 9 },
  { code: 'DJ', name: 'Dolj',              center: { lat: 44.33, lng: 23.80 }, zoom: 9 },
  { code: 'GL', name: 'Galați',            center: { lat: 45.43, lng: 28.05 }, zoom: 9 },
  { code: 'GR', name: 'Giurgiu',           center: { lat: 43.90, lng: 25.97 }, zoom: 10 },
  { code: 'GJ', name: 'Gorj',              center: { lat: 44.87, lng: 23.22 }, zoom: 9 },
  { code: 'HR', name: 'Harghita',          center: { lat: 46.38, lng: 25.65 }, zoom: 9 },
  { code: 'HD', name: 'Hunedoara',         center: { lat: 45.82, lng: 22.90 }, zoom: 9 },
  { code: 'IL', name: 'Ialomița',          center: { lat: 44.57, lng: 27.67 }, zoom: 10 },
  { code: 'IS', name: 'Iași',              center: { lat: 47.16, lng: 27.59 }, zoom: 9 },
  { code: 'IF', name: 'Ilfov',             center: { lat: 44.73, lng: 26.15 }, zoom: 10 },
  { code: 'MM', name: 'Maramureș',         center: { lat: 47.67, lng: 24.00 }, zoom: 9 },
  { code: 'MH', name: 'Mehedinți',         center: { lat: 44.63, lng: 22.90 }, zoom: 9 },
  { code: 'MS', name: 'Mureș',             center: { lat: 46.55, lng: 24.57 }, zoom: 9 },
  { code: 'NT', name: 'Neamț',             center: { lat: 46.93, lng: 26.37 }, zoom: 9 },
  { code: 'OT', name: 'Olt',               center: { lat: 44.12, lng: 24.37 }, zoom: 9 },
  { code: 'PH', name: 'Prahova',           center: { lat: 45.07, lng: 26.07 }, zoom: 9 },
  { code: 'SM', name: 'Satu Mare',         center: { lat: 47.73, lng: 22.88 }, zoom: 9 },
  { code: 'SJ', name: 'Sălaj',             center: { lat: 47.20, lng: 23.07 }, zoom: 10 },
  { code: 'SB', name: 'Sibiu',             center: { lat: 45.80, lng: 24.15 }, zoom: 9 },
  { code: 'SV', name: 'Suceava',           center: { lat: 47.63, lng: 26.25 }, zoom: 9 },
  { code: 'TR', name: 'Teleorman',         center: { lat: 43.88, lng: 24.97 }, zoom: 9 },
  { code: 'TM', name: 'Timiș',             center: { lat: 45.75, lng: 21.23 }, zoom: 9 },
  { code: 'TL', name: 'Tulcea',            center: { lat: 44.97, lng: 29.03 }, zoom: 9 },
  { code: 'VS', name: 'Vaslui',            center: { lat: 46.63, lng: 27.73 }, zoom: 9 },
  { code: 'VL', name: 'Vâlcea',            center: { lat: 45.10, lng: 24.37 }, zoom: 9 },
  { code: 'VN', name: 'Vrancea',           center: { lat: 45.70, lng: 27.07 }, zoom: 9 },
]

export const JUDETE_BY_CODE = Object.fromEntries(JUDETE.map((j) => [j.code, j]))
