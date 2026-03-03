import { useState, useEffect } from 'react';
import { loadMiningData, MineralSite, MineralExploration, MineralDeposit } from '../utils/loadMiningData';

export function useMiningData() {
  const [facilities, setFacilities] = useState<MineralSite[]>([]);
  const [explorations, setExplorations] = useState<MineralExploration[]>([]);
  const [deposits, setDeposits] = useState<MineralDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await loadMiningData();
        setFacilities(data.facilities);
        setExplorations(data.explorations);
        setDeposits(data.deposits);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载矿产数据失败');
        console.error('加载矿产数据失败:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return { facilities, explorations, deposits, loading, error };
}
