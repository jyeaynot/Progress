export interface CropEstimate {
  seedsPerHa: number;
  seedsUnit: string;
  fertilizerPerHa: number;
  fertilizerUnit: string;
}

const CROP_RATE_TABLE: Record<string, CropEstimate> = {
  Rice: {
    seedsPerHa: 60,
    seedsUnit: "kg seeds",
    fertilizerPerHa: 4,
    fertilizerUnit: "bags fertilizer",
  },
  Corn: {
    seedsPerHa: 20,
    seedsUnit: "kg seeds",
    fertilizerPerHa: 3,
    fertilizerUnit: "bags fertilizer",
  },
  Coconut: {
    seedsPerHa: 70,
    seedsUnit: "seedlings",
    fertilizerPerHa: 2,
    fertilizerUnit: "bags fertilizer",
  },
  Vegetables: {
    seedsPerHa: 4,
    seedsUnit: "kg seeds",
    fertilizerPerHa: 6,
    fertilizerUnit: "bags fertilizer",
  },
  Banana: {
    seedsPerHa: 200,
    seedsUnit: "suckers",
    fertilizerPerHa: 5,
    fertilizerUnit: "bags fertilizer",
  },
  Cacao: {
    seedsPerHa: 400,
    seedsUnit: "seedlings",
    fertilizerPerHa: 4,
    fertilizerUnit: "bags fertilizer",
  },
};

const DEFAULT_RATE: CropEstimate = {
  seedsPerHa: 25,
  seedsUnit: "kg seeds",
  fertilizerPerHa: 3,
  fertilizerUnit: "bags fertilizer",
};

function roundAmount(value: number) {
  return Math.round(value * 10) / 10;
}

export function getCropEstimate(cropType: string, areaHa: number | string | null | undefined) {
  const area = Number(areaHa);
  const safeArea = Number.isFinite(area) && area > 0 ? area : 0;
  const rate = CROP_RATE_TABLE[cropType] ?? DEFAULT_RATE;

  const seeds = roundAmount(rate.seedsPerHa * safeArea);
  const fertilizer = roundAmount(rate.fertilizerPerHa * safeArea);

  return {
    areaHa: safeArea,
    cropType,
    seeds,
    seedsUnit: rate.seedsUnit,
    fertilizer,
    fertilizerUnit: rate.fertilizerUnit,
  };
}

export function formatEstimateAmount(amount: number) {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(1);
}
