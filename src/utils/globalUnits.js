export const globalUnits = {
  // Length
  length: {
    m: { value: 1, unit: 'meter', symbol: 'm' },
    cm: { value: 0.01, unit: 'centimeter', symbol: 'cm' },
    mm: { value: 0.001, unit: 'millimeter', symbol: 'mm' },
    km: { value: 1000, unit: 'kilometer', symbol: 'km' },
    um: { value: 0.000001, unit: 'micrometer', symbol: 'um', note: 'also called micron' },
    nm: { value: 0.000000001, unit: 'nanometer', symbol: 'nm' },
    px: { value: 0.000264583, unit: 'pixel', symbol: 'px', note: '96dpi standard' },
    em: { value: 0.000264583 * 16, unit: 'em', symbol: 'em', note: '1em = 16px by default' },
    rem: { value: 0.000264583 * 16, unit: 'rem', symbol: 'rem', note: 'root em = 16px by default' },
    pt: { value: 0.000352778, unit: 'point', symbol: 'pt', note: '1pt = 1/72 inch' },
    pc: { value: 0.00423333, unit: 'pica', symbol: 'pc', note: '1pc = 12pt' },
    inch: { value: 0.0254, unit: 'inch', symbol: 'in' },
    ft: { value: 0.3048, unit: 'foot', symbol: 'ft' },
    yd: { value: 0.9144, unit: 'yard', symbol: 'yd' },
    mi: { value: 1609.344, unit: 'mile', symbol: 'mi' },
    thou: { value: 0.0000254, unit: 'mil', symbol: 'thou', note: 'thousandth of an inch' },
    furlong: { value: 201.168, unit: 'furlong', symbol: 'fur', note: '220 yards' },
    nmi: { value: 1852, unit: 'nautical mile', symbol: 'nmi' },
    fathom: { value: 1.8288, unit: 'fathom', symbol: 'fathom' },
    au: { value: 1.496e11, unit: 'astronomical unit', symbol: 'AU' },
    ly: { value: 9.4607e15, unit: 'light year', symbol: 'ly' },
    pc: { value: 3.0857e16, unit: 'parsec', symbol: 'pc' }
  },

  // Weight / Mass
  weight: {
    mg: { value: 1e-6, unit: 'milligram', symbol: 'mg' },
    g: { value: 0.001, unit: 'gram', symbol: 'g' },
    kg: { value: 1, unit: 'kilogram', symbol: 'kg' },
    t: { value: 1000, unit: 'tonne', symbol: 't', note: 'metric ton' },
    lb: { value: 0.453592, unit: 'pound', symbol: 'lb' },
    oz: { value: 0.0283495, unit: 'ounce', symbol: 'oz' },
    stone: { value: 6.35029, unit: 'stone', symbol: 'st', note: '1 stone = 14 lb' }
  },

  // Time
  time: {
    s: { value: 1, unit: 'second', symbol: 's' },
    min: { value: 60, unit: 'minute', symbol: 'min' },
    h: { value: 3600, unit: 'hour', symbol: 'h' },
    day: { value: 86400, unit: 'day', symbol: 'd' },
    week: { value: 604800, unit: 'week', symbol: 'wk' },
    month: { value: 2629800, unit: 'month', symbol: 'mo', note: 'average month = 30.44 days' },
    year: { value: 31557600, unit: 'year', symbol: 'yr', note: 'average year = 365.25 days' }
  },

  // Voltage
  voltage: {
    V:      { value: 1, unit: 'volt', symbol: 'V' },
    mV: { value: 0.001, unit: 'millivolt', symbol: 'mV' },
    kV: { value: 1000, unit: 'kilovolt', symbol: 'kV' },
    MV: { value: 1e6, unit: 'megavolt', symbol: 'MV' },
    GV: { value: 1e9, unit: 'gigavolt', symbol: 'GV' },
    statV: { value: 299.792458, unit: 'statvolt', symbol: 'statV', note: 'CGS unit' },
    abV: { value: 1e-8, unit: 'abvolt', symbol: 'abV', note: 'CGS electromagnetic unit' }
  },

  // Frequency
  frequency: {
    Hz: { value: 1, unit: 'hertz', symbol: 'Hz', note: '1 cycle per second' },
    kHz: { value: 1e3, unit: 'kilohertz', symbol: 'kHz' },
    MHz: { value: 1e6, unit: 'megahertz', symbol: 'MHz' },
    GHz: { value: 1e9, unit: 'gigahertz', symbol: 'GHz' },
    THz: { value: 1e12, unit: 'terahertz', symbol: 'THz' }
  },

  // Power
  power: {
    W: { value: 1, unit: 'watt', symbol: 'W', note: '1 joule per second' },
    mW: { value: 0.001, unit: 'milliwatt', symbol: 'mW' },
    kW: { value: 1000, unit: 'kilowatt', symbol: 'kW' },
    MW: { value: 1e6, unit: 'megawatt', symbol: 'MW' },
    GW: { value: 1e9, unit: 'gigawatt', symbol: 'GW' },
    HP: { value: 745.7, unit: 'horsepower', symbol: 'HP', note: 'mechanical HP = 745.7 W' },
    kcal_per_h: { value: 1.163, unit: 'kilocalorie per hour', symbol: 'kcal/h', note: '= 1.163 W' },
    BTU_per_h: { value: 0.29307107, unit: 'BTU per hour', symbol: 'BTU/h', note: '= 0.293 W' }
  },

  // Sound
  sound: {
    dB: { value: 1, unit: 'decibel', symbol: 'dB', note: 'logarithmic unit of sound intensity' },
    dBA: { value: 1, unit: 'A-weighted decibel', symbol: 'dBA', note: 'Adjusted for human hearing' },
    dBC: { value: 1, unit: 'C-weighted decibel', symbol: 'dBC', note: 'Flat weighting for high-level sounds' }
  },

  // Temperature
  temperature: {
    K: { value: 1, unit: 'kelvin', symbol: 'K' },
    C: { value: 1, unit: 'Celsius', symbol: '°C', note: '°C → K: add 273.15' },
    F: { value: 1, unit: 'Fahrenheit', symbol: '°F', note: '°F → K: (°F - 32) * 5/9 + 273.15' }
  },

  // Pressure
  pressure: {
    Pa: { value: 1, unit: 'pascal', symbol: 'Pa' },
    kPa: { value: 1000, unit: 'kilopascal', symbol: 'kPa' },
    MPa: { value: 1e6, unit: 'megapascal', symbol: 'MPa' },
    bar: { value: 1e5, unit: 'bar', symbol: 'bar' },
    atm: { value: 101325, unit: 'atmosphere', symbol: 'atm' },
    psi: { value: 6894.757, unit: 'pound per square inch', symbol: 'psi' },
    mmHg:{ value: 133.322, unit: 'millimeter of mercury', symbol: 'mmHg' }
  },

  // Energy
  energy: {
    J: { value: 1, unit: 'joule', symbol: 'J' },
    kJ: { value: 1000, unit: 'kilojoule', symbol: 'kJ' },
    cal: { value: 4.184, unit: 'calorie', symbol: 'cal' },
    kcal:{ value: 4184, unit: 'kilocalorie', symbol: 'kcal' },
    eV: { value: 1.60218e-19, unit: 'electronvolt', symbol: 'eV' },
    BTU: { value: 1055.06, unit: 'BTU', symbol: 'BTU' }
  },

  // Force
  force: {
    N: { value: 1, unit: 'newton', symbol: 'N' },
    kN: { value: 1000, unit: 'kilonewton', symbol: 'kN' },
    lbf: { value: 4.44822, unit: 'pound-force', symbol: 'lbf' },
    kgf: { value: 9.80665, unit: 'kilogram-force', symbol: 'kgf' },
    dyne:{ value: 1e-5, unit: 'dyne', symbol: 'dyn' }
  },

  // Area
  area: {
    m2: { value: 1, unit: 'square meter', symbol: 'm²' },
    cm2: { value: 0.0001, unit: 'square centimeter', symbol: 'cm²' },
    km2: { value: 1e6, unit: 'square kilometer', symbol: 'km²' },
    acre: { value: 4046.856, unit: 'acre', symbol: 'acre' },
    hectare:{ value: 10000, unit: 'hectare', symbol: 'ha' },
    ft2: { value: 0.092903, unit: 'square foot', symbol: 'ft²' },
    yd2: { value: 0.836127, unit: 'square yard', symbol: 'yd²' }
  },

  // Volume
  volume: {
    m3: { value: 1, unit: 'cubic meter', symbol: 'm³' },
    L: { value: 0.001, unit: 'liter', symbol: 'L' },
    mL: { value: 1e-6, unit: 'milliliter', symbol: 'mL' },
    gallon:{ value: 0.00378541, unit: 'US gallon', symbol: 'gal' },
    pint: { value: 0.000473176, unit: 'US pint', symbol: 'pt' },
    floz: { value: 2.9574e-5, unit: 'US fluid ounce', symbol: 'fl oz' }
  },

  // Electrical Current
  current: {
    A: { value: 1, unit: 'ampere', symbol: 'A' },
    mA: { value: 0.001, unit: 'milliampere', symbol: 'mA' },
    uA: { value: 0.000001, unit: 'microampere', symbol: 'uA' },
    kA: { value: 1000, unit: 'kiloampere', symbol: 'kA' }
  },

  // Resistance / Conductance
  resistance: {
    ohm: { value: 1, unit: 'ohm' },
    kohm: { value: 1000, unit: 'kiloohm'},
    megaohm: { value: 1e6, unit: 'megaohm'},
    S: { value: 1, unit: 'siemens', symbol: 'S', note: 'conductance' }
  },

  // Capacitance / Inductance
  capacitance: {
    F: { value: 1, unit: 'farad', symbol: 'F' },
    mF: { value: 0.001, unit: 'millifarad'},
    uF: { value: 0.000001, unit: 'microfarad' }
  },
  inductance: {
    H: { value: 1, unit: 'henry', symbol: 'H' },
    mH: { value: 0.001, unit: 'millihenry', symbol: 'mH' },
    uH: { value: 0.000001, unit: 'microhenry', symbol: 'uH' }
  },

  // Luminous Intensity / Illuminance
  light: {
    cd: { value: 1, unit: 'candela', symbol: 'cd' },
    lm: { value: 1, unit: 'lumen', symbol: 'lm' },
    lx: { value: 1, unit: 'lux', symbol: 'lx' }
  },

  // Data / Digital Storage
  data: {
    bit: { value: 1, unit: 'bit', symbol: 'bit' },
    B: { value: 8, unit: 'byte', symbol: 'B' },
    KB: { value: 8e3, unit: 'kilobyte', symbol: 'KB' },
    MB: { value: 8e6, unit: 'megabyte', symbol: 'MB' },
    GB: { value: 8e9, unit: 'gigabyte', symbol: 'GB' },
    TB: { value: 8e12, unit: 'terabyte', symbol: 'TB' }
  },

  // Angle
  angle: {
    deg: { value: 1, unit: 'degree', symbol: '°' },
    rad: { value: 57.2958, unit: 'radian', symbol: 'rad', note: '1 rad = 57.2958°' },
    grad:{ value: 0.9, unit: 'grad', symbol: 'grad', note: '1 grad = 0.9°' }
  },
  radiation: {
    // Absorbed Dose
    Gy: { value: 1, unit: 'gray', symbol: 'Gy', note: 'Absorbed dose: 1 Gy = 1 J/kg' },
    mGy: { value: 0.001, unit: 'milligray', symbol: 'mGy' },
    rad: { value: 0.01, unit: 'rad', symbol: 'rad', note: '1 rad = 0.01 Gy' },

    // Dose Equivalent
    Sv: { value: 1, unit: 'sievert', symbol: 'Sv', note: 'Biological effect dose equivalent' },
    mSv: { value: 0.001, unit: 'millisievert', symbol: 'mSv' },
    rem: { value: 0.01, unit: 'rem', symbol: 'rem', note: '1 rem = 0.01 Sv' },

    // Radioactivity
    Bq: { value: 1, unit: 'becquerel', symbol: 'Bq', note: '1 decay per second' },
    kBq: { value: 1e3, unit: 'kilobecquerel', symbol: 'kBq' },
    MBq: { value: 1e6, unit: 'megabecquerel', symbol: 'MBq' },
    GBq: { value: 1e9, unit: 'gigabecquerel', symbol: 'GBq' },
    Ci: { value: 3.7e10, unit: 'curie', symbol: 'Ci', note: '1 Ci = 3.7 x 10¹⁰ decays per second' },
    mCi: { value: 3.7e7, unit: 'millicurie', symbol: 'mCi' }
  }
};