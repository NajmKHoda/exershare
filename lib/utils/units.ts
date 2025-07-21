import { IntensityType, VolumeType } from '../data/Exercise';

export type MeasurementSystem = 'metric' | 'imperial';

export const KGtoLBS = (x: number) => x * 2.20462;
export const LBStoKG = (x: number) => x * (1 / KGtoLBS(1));

export const MItoKM = (x: number) => x * 1.60934;
export const KMtoMI = (x: number) => x * (1 / MItoKM(1));

export function convertWeight(value: number, from: MeasurementSystem, to: MeasurementSystem) {
    if (from === 'metric' && to === 'imperial') {
        return KGtoLBS(value);
    } else if (from === 'imperial' && to === 'metric') {
        return LBStoKG(value);
    }
    return value;
};

export function convertDistance(value: number, from: MeasurementSystem, to: MeasurementSystem) {
    if (from === 'metric' && to === 'imperial') {
        return KMtoMI(value);
    } else if (from === 'imperial' && to === 'metric') {
        return MItoKM(value);
    }
    return value;
};

export function convertValue(
    value: number,
    type: VolumeType | IntensityType,
    from: MeasurementSystem,
    to: MeasurementSystem
) {
    switch (type) {
        case 'weight':
            return convertWeight(value, from, to);
        case 'distance':
        case 'speed':
            return convertDistance(value, from, to);
        default:
            return value;
    }
}

export function formatValue(
    value: number,
    type: VolumeType | IntensityType,
    units: MeasurementSystem
): string {
    const displayValue = Number.parseFloat(value.toFixed(2)).toString();
    return `${displayValue} ${TYPE_UNITS[type][units].short}`;
}

export const TYPE_UNITS: Record<
    VolumeType | IntensityType,
    Record<
        MeasurementSystem,
        {
            short: string,
            long: string
        }
    >
> = {
    reps: {
        metric: { short: '', long: 'reps' },
        imperial: { short: '', long: 'reps' }
    },
    distance: {
        metric: { short: 'km', long: 'kilometers' },
        imperial: { short: 'mi', long: 'miles' }
    },
    time: {
        metric: { short: 's', long: 'seconds' },
        imperial: { short: 's', long: 'seconds' }
    },
    calories: {
        metric: { short: 'kcal', long: 'calories' },
        imperial: { short: 'kcal', long: 'calories' }
    },
    weight: {
        metric: { short: 'kg', long: 'kilograms' },
        imperial: { short: 'lbs', long: 'pounds' }
    },
    speed: {
        metric: { short: 'km/h', long: 'km/h' },
        imperial: { short: 'mph', long: 'mph' }
    },
    incline: {
        metric: { short: '%', long: '% incline' },
        imperial: { short: '%', long: '% incline' }
    },
    resistance: {
        metric: { short: '', long: '' },
        imperial: { short: '', long: '' }
    },
    level: {
        metric: { short: '', long: '' },
        imperial: { short: '', long: '' }
    },
}