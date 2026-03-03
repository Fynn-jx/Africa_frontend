import { useState, useEffect } from 'react';
import { loadTazaraData, TazaraRailLine, TazaraStation } from '../utils/loadTazaraData';

export function useTazaraData() {
  const [railLines, setRailLines] = useState<TazaraRailLine[]>([]);
  const [stations, setStations] = useState<TazaraStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await loadTazaraData();
        setRailLines(data.railLines);
        setStations(data.stations);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载数据失败');
        console.error('加载坦赞铁路数据失败:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return { railLines, stations, loading, error };
}
