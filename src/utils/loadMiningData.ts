export interface MineralSite {
  id: string;
  name: string;
  nameEn?: string;
  type: string;
  commodity: string;
  country: string;
  coordinates: [number, number];
  status?: string;
  capacity?: string;
}

export interface MineralExploration {
  id: string;
  name: string;
  country: string;
  coordinates: [number, number];
  commodity: string;
  stage?: string;
}

export interface MineralDeposit {
  id: string;
  name: string;
  country: string;
  coordinates: [number, number];
  commodity: string;
  type?: string;
}

export async function loadMiningData(): Promise<{
  facilities: MineralSite[];
  explorations: MineralExploration[];
  deposits: MineralDeposit[];
}> {
  try {
    console.log('开始加载矿产数据（GeoJSON）...');

    const [facilitiesResponse, explorationsResponse, depositsResponse] = await Promise.all([
      fetch('/data/mining/AFR_Mineral_Facilities.geojson'),
      fetch('/data/mining/AFR_Mineral_Exploration.geojson'),
      fetch('/data/mining/AFR_Mineral_Deposits.geojson'),
    ]);

    const [facilitiesData, explorationsData, depositsData] = await Promise.all([
      facilitiesResponse.json(),
      explorationsResponse.json(),
      depositsResponse.json(),
    ]);

    // 处理设施数据
    const facilities: MineralSite[] = facilitiesData.features.map((feature: any) => {
      const props = feature.properties || {};
      const coords = feature.geometry.coordinates;
      return {
        id: props.site_id || props.osm_id || `facility-${Math.random().toString(36).substr(2, 9)}`,
        name: props.site_name || props.name || '未知设施',
        nameEn: props.site_name_en || props.name_en,
        type: props.facility_type || props.type || props.fclass || '设施',
        commodity: props.commodity || props.commoditie || '未知',
        country: props.country || props.country_nam || '未知',
        coordinates: coords,
        status: props.status || props.oper_stat || '未知',
        capacity: props.capacity || props.production || undefined,
      };
    });

    // 处理勘探数据
    const explorations: MineralExploration[] = explorationsData.features.map((feature: any) => {
      const props = feature.properties || {};
      const coords = feature.geometry.coordinates;
      return {
        id: props.site_id || props.osm_id || `exploration-${Math.random().toString(36).substr(2, 9)}`,
        name: props.site_name || props.name || '勘探区',
        country: props.country || props.country_nam || '未知',
        coordinates: coords,
        commodity: props.commodity || props.commoditie || '未知',
        stage: props.stage || props.dev_stage || undefined,
      };
    });

    // 处理矿床数据
    const deposits: MineralDeposit[] = depositsData.features.map((feature: any) => {
      const props = feature.properties || {};
      const coords = feature.geometry.coordinates;
      return {
        id: props.site_id || props.osm_id || `deposit-${Math.random().toString(36).substr(2, 9)}`,
        name: props.site_name || props.name || props.deposit_na || '矿床',
        country: props.country || props.country_nam || '未知',
        coordinates: coords,
        commodity: props.commodity || props.commoditie || '未知',
        type: props.deposit_type || props.type || undefined,
      };
    });

    console.log(`矿产数据加载成功:`, {
      facilities: facilities.length,
      explorations: explorations.length,
      deposits: deposits.length,
    });

    return { facilities, explorations, deposits };
  } catch (error) {
    console.error('加载矿产数据失败:', error);
    return { facilities: [], explorations: [], deposits: [] };
  }
}
