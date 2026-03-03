export interface TazaraStation {
  name: string;
  coordinates: [number, number];
  type: 'tanzania' | 'zambia';
  sequence?: number; // 添加序号
}

export interface TazaraRailLine {
  coordinates: [number, number][];
  type: 'tanzania' | 'zambia';
}

export async function loadTazaraData(): Promise<{
  railLines: TazaraRailLine[];
  stations: TazaraStation[];
}> {
  try {
    console.log('开始加载坦赞铁路数据（GeoJSON）...');

    const [tanzaniaStationsResponse, zambiaStationsResponse] = await Promise.all([
      fetch('/tazara-data/tanzania_stations.geojson'),
      fetch('/tazara-data/zambia_stations.geojson'),
    ]);

    const [tanzaniaStationsData, zambiaStationsData] = await Promise.all([
      tanzaniaStationsResponse.json(),
      zambiaStationsResponse.json(),
    ]);

    // 处理所有站点
    const tanzaniaStations: TazaraStation[] = tanzaniaStationsData.features
      .map((feature: any) => {
        const coords = feature.geometry.coordinates;
        const name = feature.properties?.name || feature.properties?.Name || '未命名站点';
        return {
          name: name,
          coordinates: coords,
          type: 'tanzania' as const,
        };
      });

    const zambiaStations: TazaraStation[] = zambiaStationsData.features
      .map((feature: any) => {
        const coords = feature.geometry.coordinates;
        const name = feature.properties?.name || feature.properties?.Name || '未命名站点';
        return {
          name: name,
          coordinates: coords,
          type: 'zambia' as const,
        };
      });

    // 智能连接算法：基于距离和方向的贪心算法
    function connectStationsSmart(stations: TazaraStation[]): TazaraStation[] {
      if (stations.length === 0) return [];

      // 1. 确定起点和终点的大致方向
      // 坦桑尼亚：从 Dar es Salaam (东北) 向 Tunduma (西南)
      // 赞比亚：从 Tunduma (东北) 向 Kapiri Mposhi (西南)

      const isTanzania = stations[0].type === 'tanzania';

      // 找起点（最东北）和终点（最西南）
      let startStation = stations[0];
      let endStation = stations[0];

      stations.forEach(s => {
        // 坦桑尼亚：东北角 = 最大经度和最小纬度
        if (isTanzania) {
          if (s.coordinates[0] > startStation.coordinates[0] ||
              (s.coordinates[0] === startStation.coordinates[0] && s.coordinates[1] < startStation.coordinates[1])) {
            startStation = s;
          }
          if (s.coordinates[0] < endStation.coordinates[0] ||
              (s.coordinates[0] === endStation.coordinates[0] && s.coordinates[1] > endStation.coordinates[1])) {
            endStation = s;
          }
        } else {
          // 赞比亚
          if (s.coordinates[0] > startStation.coordinates[0] ||
              (s.coordinates[0] === startStation.coordinates[0] && s.coordinates[1] < startStation.coordinates[1])) {
            startStation = s;
          }
          if (s.coordinates[0] < endStation.coordinates[0] ||
              (s.coordinates[0] === endStation.coordinates[0] && s.coordinates[1] > endStation.coordinates[1])) {
            endStation = s;
          }
        }
      });

      // 2. 使用贪心算法连接站点
      const visited = new Set<TazaraStation>();
      const orderedStations: TazaraStation[] = [];
      let current = startStation;

      while (current && visited.size < stations.length) {
        visited.add(current);
        orderedStations.push({ ...current, sequence: orderedStations.length + 1 });

        // 找下一个最近的未访问站点
        let nearest: TazaraStation | null = null;
        let minDistance = Infinity;

        stations.forEach(s => {
          if (!visited.has(s)) {
            // 计算距离
            const dist = Math.sqrt(
              Math.pow(s.coordinates[0] - current.coordinates[0], 2) +
              Math.pow(s.coordinates[1] - current.coordinates[1], 2)
            );

            // 计算方向得分（优先选择向西南方向的站点）
            const directionScore = isTanzania
              ? (current.coordinates[0] - s.coordinates[0]) * 0.1 + (s.coordinates[1] - current.coordinates[1]) * 0.1
              : (current.coordinates[0] - s.coordinates[0]) * 0.1 + (s.coordinates[1] - current.coordinates[1]) * 0.1;

            // 综合得分：距离 + 方向调整
            const score = dist + directionScore * 0.5;

            if (score < minDistance) {
              minDistance = score;
              nearest = s;
            }
          }
        });

        // 如果找不到合适的，或者已经接近终点，就停止
        if (!nearest || (nearest === endStation && visited.size > stations.length * 0.8)) {
          if (nearest && !visited.has(nearest)) {
            current = nearest;
          } else {
            break;
          }
        } else {
          current = nearest;
        }
      }

      // 添加未访问的站点（如果有）
      stations.forEach(s => {
        if (!visited.has(s)) {
          orderedStations.push({ ...s, sequence: orderedStations.length + 1 });
        }
      });

      return orderedStations;
    }

    // 分别连接坦桑尼亚和赞比亚站点
    const orderedTanzaniaStations = connectStationsSmart(tanzaniaStations);
    const orderedZambiaStations = connectStationsSmart(zambiaStations);

    // 从连接后的站点生成铁路线坐标
    const tanzaniaRailCoordinates: [number, number][] = orderedTanzaniaStations.map(s => s.coordinates);
    const zambiaRailCoordinates: [number, number][] = orderedZambiaStations.map(s => s.coordinates);

    // 合并所有站点
    const allStations = [...orderedTanzaniaStations, ...orderedZambiaStations];

    // 确保至少有一些数据
    const finalStations = allStations.length > 0 ? allStations : [
      { name: 'Dar es Salaam', coordinates: [39.2832, -6.8161], type: 'tanzania' as const, sequence: 1 },
      { name: 'Mlimba', coordinates: [35.8833, -7.8500], type: 'tanzania' as const, sequence: 2 },
      { name: 'Makambako', coordinates: [33.0, -12.5], type: 'tanzania' as const, sequence: 3 },
      { name: 'Tunduma', coordinates: [32.3829, -13.2594], type: 'zambia' as const, sequence: 4 },
      { name: 'Serenje', coordinates: [30.5167, -14.2500], type: 'zambia' as const, sequence: 5 },
      { name: 'Kapiri Mposhi', coordinates: [28.6336, -14.2833], type: 'zambia' as const, sequence: 6 },
    ];

    console.log(`坦赞铁路数据加载成功:`);
    console.log(`  坦桑尼亚铁路: ${tanzaniaRailCoordinates.length} 个坐标点`);
    console.log(`  赞比亚铁路: ${zambiaRailCoordinates.length} 个坐标点`);
    console.log(`  总站点数: ${finalStations.length} 个`);
    console.log(`  坦桑尼亚站点（前5个）:`, orderedTanzaniaStations.slice(0, 5).map(s => `${s.sequence}.${s.name}`));
    console.log(`  赞比亚站点（前5个）:`, orderedZambiaStations.slice(0, 5).map(s => `${s.sequence}.${s.name}`));

    return {
      railLines: [
        {
          type: 'tanzania',
          coordinates: tanzaniaRailCoordinates.length > 0 ? tanzaniaRailCoordinates : [
            [39.2832, -6.8161], [38.7333, -6.8333], [38.2667, -6.9167],
            [37.8333, -7.0500], [37.3167, -7.2167], [36.9167, -7.4000],
            [36.4500, -7.6167], [35.8833, -7.8500], [35.3500, -8.0833],
            [34.8833, -8.3167], [34.3667, -8.5500], [33.8833, -8.7833],
            [33.5000, -9.0167], [33.1500, -9.2667], [32.8667, -9.5500],
            [32.5833, -9.8500], [32.3333, -10.1833], [32.1167, -10.5500],
            [31.9167, -10.9333], [31.7500, -11.3333], [31.6167, -11.7667],
            [31.5000, -12.2000], [31.4167, -12.6500], [33.0, -12.5],
          ],
        },
        {
          type: 'zambia',
          coordinates: zambiaRailCoordinates.length > 0 ? zambiaRailCoordinates : [
            [33.0, -12.5], [32.3829, -13.2594], [31.7500, -13.5833],
            [31.1333, -13.9167], [30.5167, -14.2500], [29.9000, -14.5833],
            [29.2833, -14.9167], [28.9167, -15.1333], [28.6336, -14.2833],
          ],
        },
      ],
      stations: finalStations,
    };
  } catch (error) {
    console.error('加载坦赞铁路数据失败:', error);
    console.log('使用备用数据');

    return {
      railLines: [
        {
          type: 'tanzania',
          coordinates: [
            [39.2832, -6.8161], [38.7333, -6.8333], [38.2667, -6.9167],
            [37.8333, -7.0500], [37.3167, -7.2167], [36.9167, -7.4000],
            [36.4500, -7.6167], [35.8833, -7.8500], [35.3500, -8.0833],
            [34.8833, -8.3167], [34.3667, -8.5500], [33.8833, -8.7833],
            [33.5000, -9.0167], [33.1500, -9.2667], [32.8667, -9.5500],
            [32.5833, -9.8500], [32.3333, -10.1833], [32.1167, -10.5500],
            [31.9167, -10.9333], [31.7500, -11.3333], [31.6167, -11.7667],
            [31.5000, -12.2000], [31.4167, -12.6500], [33.0, -12.5],
          ],
        },
        {
          type: 'zambia',
          coordinates: [
            [33.0, -12.5], [32.3829, -13.2594], [31.7500, -13.5833],
            [31.1333, -13.9167], [30.5167, -14.2500], [29.9000, -14.5833],
            [29.2833, -14.9167], [28.9167, -15.1333], [28.6336, -14.2833],
          ],
        },
      ],
      stations: [
        { name: 'Dar es Salaam', coordinates: [39.2832, -6.8161], type: 'tanzania', sequence: 1 },
        { name: 'Mlimba', coordinates: [35.8833, -7.8500], type: 'tanzania', sequence: 2 },
        { name: 'Makambako', coordinates: [33.0, -12.5], type: 'tanzania', sequence: 3 },
        { name: 'Tunduma', coordinates: [32.3829, -13.2594], type: 'zambia', sequence: 4 },
        { name: 'Serenje', coordinates: [30.5167, -14.2500], type: 'zambia', sequence: 5 },
        { name: 'Kapiri Mposhi', coordinates: [28.6336, -14.2833], type: 'zambia', sequence: 6 },
      ],
    };
  }
}
