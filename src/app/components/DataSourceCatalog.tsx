import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  BookOpen,
  ChevronRight,
  Database,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Globe2,
  Layers,
  ListFilter,
  Map,
  MapPin,
  Network,
  Search,
} from "lucide-react";
import {
  datasetCatalog,
  getDatasetById,
  getDatasetsByLayer,
  sourceTypeConfig,
  sourceTypeOrder,
  type DatasetDefinition,
  type DatasetLayer,
  type SourceTypeKey,
} from "../../data/dataSourceCatalog";

interface SourceRecord {
  id: string;
  url: string;
  nameEn: string;
  nameCn: string;
  description: string;
  year: string;
  country: string;
  marks: string;
}

interface NewsMediaCollections {
  international: SourceRecord[];
  african: SourceRecord[];
}

interface TraditionalCollections {
  government: SourceRecord[];
  ngo: SourceRecord[];
  research: SourceRecord[];
  commercial: SourceRecord[];
}

interface DataSourceSidebarProps {
  isLoading: boolean;
  loadError: string | null;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedDatasetId: string | null;
  setSelectedDatasetId: (value: string | null) => void;
  selectedType: string | null;
  setSelectedType: (value: string | null) => void;
  setPage: (value: number) => void;
  newsMediaData: NewsMediaCollections | null;
  traditionalData: TraditionalCollections | null;
}

interface DataSourceContentProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedDatasetId: string | null;
  setSelectedDatasetId: (value: string | null) => void;
  selectedType: string | null;
  setSelectedType: (value: string | null) => void;
  page: number;
  setPage: (value: number | ((prev: number) => number)) => void;
  filteredCardData: SourceRecord[];
  paginatedCardData: SourceRecord[];
  totalPages: number;
  sourceTypeCounts: SourceTypeCounts;
}

type SourceTypeCounts = Partial<Record<SourceTypeKey, number>>;

const layerLabel: Record<DatasetLayer, string> = {
  base: "基础数据",
  derived: "平台衍生数据",
};

const layerTone: Record<DatasetLayer, string> = {
  base: "bg-blue-50 text-blue-700 border-blue-200",
  derived: "bg-amber-50 text-amber-700 border-amber-200",
};

function getSourceTypeCount(
  type: SourceTypeKey,
  newsMediaData: NewsMediaCollections | null,
  traditionalData: TraditionalCollections | null,
) {
  if (type === "news-international") return newsMediaData?.international.length ?? 0;
  if (type === "news-african") return newsMediaData?.african.length ?? 0;
  return traditionalData?.[type]?.length ?? 0;
}

function getDatasetIcon(dataset: DatasetDefinition) {
  if (dataset.id === "pori") return BarChart3;
  if (dataset.id === "mineral-deposits") return FileSpreadsheet;
  if (dataset.id === "population-data" || dataset.id === "public-facilities") return Map;
  if (dataset.id === "emergency-strategy") return BookOpen;
  if (dataset.id === "social-media") return Activity;
  return Database;
}

function normalizeUrl(url: string) {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function getSourceRecordReliability(item: SourceRecord, selectedType: string): "高" | "中" {
  if (
    selectedType === "government" ||
    selectedType === "research" ||
    selectedType === "ngo" ||
    selectedType === "commercial" ||
    selectedType === "news-african"
  ) {
    return "高";
  }

  const text = `${item.nameCn} ${item.nameEn} ${item.url} ${item.description} ${item.marks}`.toLowerCase();
  const authoritativeKeywords = [
    "reuters",
    "associated press",
    "ap news",
    "afp",
    "bbc",
    "bloomberg",
    "financial times",
    "the guardian",
    "new york times",
    "washington post",
    "cnn",
    "al jazeera",
    "dw",
    "voa",
    "rfi",
    "france 24",
    "cnbc",
    "通讯社",
    "国家通讯社",
    "公共广播",
    "官方",
    "政府",
    "日报",
    "电视台",
    "广播",
  ];

  return authoritativeKeywords.some((keyword) => text.includes(keyword)) ? "高" : "中";
}

function ReliabilityBadge({ value }: { value: "高" | "中" }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        value === "高" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
      }`}
    >
      可信度{value}
    </span>
  );
}

function matchesDatasetSearch(dataset: DatasetDefinition, searchQuery: string) {
  if (!searchQuery) return true;
  const query = searchQuery.toLowerCase();
  return [
    dataset.name,
    dataset.shortName,
    dataset.domain,
    dataset.description,
    dataset.coverage,
    dataset.keyMetrics.join(" "),
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function formatSourceCount(count: number) {
  return count.toLocaleString("zh-CN");
}

function formatSourceUnit(type: SourceTypeKey, count: number) {
  return `${formatSourceCount(count)}${sourceTypeConfig[type].unitLabel}`;
}

function getDatasetLinkedSourceTypes(dataset: DatasetDefinition, sourceTypeCounts: SourceTypeCounts) {
  const seenTypes = new Set<SourceTypeKey>();

  return dataset.sources.flatMap((source) => {
    if (!source.sourceTypeKey || seenTypes.has(source.sourceTypeKey)) return [];

    seenTypes.add(source.sourceTypeKey);
    const config = sourceTypeConfig[source.sourceTypeKey];

    return {
      type: source.sourceTypeKey,
      sourceName: source.name,
      label: config.libraryName,
      color: config.color,
      count: sourceTypeCounts[source.sourceTypeKey] ?? 0,
    };
  });
}

function getDatasetSourceTotal(dataset: DatasetDefinition, sourceTypeCounts: SourceTypeCounts) {
  return getDatasetLinkedSourceTypes(dataset, sourceTypeCounts).reduce((total, source) => total + source.count, 0);
}

export function DataSourceSidebar({
  isLoading,
  loadError,
  searchQuery,
  setSearchQuery,
  selectedDatasetId,
  setSelectedDatasetId,
  selectedType,
  setSelectedType,
  setPage,
  newsMediaData,
  traditionalData,
}: DataSourceSidebarProps) {
  const renderDatasetGroup = (layer: DatasetLayer) => {
    const datasets = getDatasetsByLayer(layer).filter((dataset) =>
      matchesDatasetSearch(dataset, searchQuery),
    );

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-500 uppercase">{layerLabel[layer]}</h3>
          <span className="text-xs text-gray-400">{datasets.length}</span>
        </div>
        <div className="space-y-2">
          {datasets.map((dataset) => {
            const Icon = getDatasetIcon(dataset);
            const isSelected = selectedDatasetId === dataset.id;

            return (
              <button
                key={dataset.id}
                onClick={() => {
                  setSelectedDatasetId(dataset.id);
                  setSelectedType(null);
                  setPage(1);
                }}
                className={`w-full rounded-lg border px-3 py-3 text-left transition-all ${
                  isSelected
                    ? "border-[#005BBB] bg-blue-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                      isSelected ? "bg-[#005BBB] text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-gray-900">{dataset.shortName}</div>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">{dataset.domain}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">数据来源</h2>
        <p className="mt-1 text-xs text-gray-500">基础数据库、平台衍生数据与来源库统一管理</p>
      </div>

      {isLoading && (
        <div className="mb-4 flex items-center justify-center rounded-lg border border-blue-100 bg-blue-50 py-4">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#005BBB] border-t-transparent" />
            <span className="text-sm">加载来源库...</span>
          </div>
        </div>
      )}

      {loadError && !isLoading && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            <div className="text-sm text-red-700">
              <strong className="font-semibold">加载失败</strong>
              <p className="mt-1">{loadError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-5">
        <div className="relative">
          <input
            type="text"
            placeholder={selectedType ? "搜索来源..." : "搜索数据集或来源..."}
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-[#005BBB] focus:outline-none"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setPage(1);
            }}
          />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <div className="space-y-6">
        {renderDatasetGroup("base")}
        {renderDatasetGroup("derived")}

        <div className="border-t border-gray-200 pt-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-500 uppercase">来源库</h3>
            <span className="text-xs text-gray-400">保留原来源列表</span>
          </div>
          <div className="space-y-2">
            {sourceTypeOrder.map((type) => {
              const config = sourceTypeConfig[type];
              const count = getSourceTypeCount(type, newsMediaData, traditionalData);
              const isSelected = selectedType === type;

              return (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedType(isSelected ? null : type);
                    setSelectedDatasetId(null);
                    setSearchQuery("");
                    setPage(1);
                  }}
                  className={`w-full rounded-lg border px-3 py-2.5 text-left transition-all ${
                    isSelected
                      ? "border-[#005BBB] bg-blue-50"
                      : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: config.color }} />
                    <span className="text-sm font-medium text-gray-700">{config.libraryName}</span>
                    <span className="ml-auto text-xs text-gray-500">{formatSourceUnit(type, count)}</span>
                  </div>
                  <p className="mt-1 line-clamp-1 pl-5 text-xs text-gray-500">{config.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DataSourceContent({
  searchQuery,
  setSearchQuery,
  selectedDatasetId,
  setSelectedDatasetId,
  selectedType,
  setSelectedType,
  page,
  setPage,
  filteredCardData,
  paginatedCardData,
  totalPages,
  sourceTypeCounts,
}: DataSourceContentProps) {
  const selectedDataset = getDatasetById(selectedDatasetId);
  const openSourceLibrary = (type: SourceTypeKey) => {
    setSelectedType(type);
    setSelectedDatasetId(null);
    setSearchQuery("");
    setPage(1);
  };

  if (selectedDataset) {
    return (
      <DatasetWorkbench
        dataset={selectedDataset}
        sourceTypeCounts={sourceTypeCounts}
        onOpenSourceLibrary={openSourceLibrary}
      />
    );
  }

  if (selectedType) {
    return (
      <SourceLibraryView
        selectedType={selectedType}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        page={page}
        setPage={setPage}
        filteredCardData={filteredCardData}
        paginatedCardData={paginatedCardData}
        totalPages={totalPages}
      />
    );
  }

  return (
    <DatasetOverview
      searchQuery={searchQuery}
      setSelectedDatasetId={setSelectedDatasetId}
      sourceTypeCounts={sourceTypeCounts}
    />
  );
}

function DatasetOverview({
  searchQuery,
  setSelectedDatasetId,
  sourceTypeCounts,
}: {
  searchQuery: string;
  setSelectedDatasetId: (value: string | null) => void;
  sourceTypeCounts: SourceTypeCounts;
}) {
  const filteredDatasets = datasetCatalog.filter((dataset) => matchesDatasetSearch(dataset, searchQuery));
  const baseCount = getDatasetsByLayer("base").length;
  const derivedCount = getDatasetsByLayer("derived").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SummaryMetric icon={Layers} label="基础数据集" value={`${baseCount}类`} tone="blue" />
        <SummaryMetric icon={Network} label="平台衍生数据" value={`${derivedCount}类`} tone="amber" />
        <SummaryMetric icon={Database} label="数据资产总量" value={`${datasetCatalog.length}类`} tone="green" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">数据资产目录</h2>
              <p className="mt-1 text-sm text-gray-500">按基础数据与平台衍生数据分层展示，点击进入数据库工作台。</p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
              {filteredDatasets.length} 个数据集
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-2">
          {filteredDatasets.map((dataset, index) => {
            const Icon = getDatasetIcon(dataset);
            const linkedSources = getDatasetLinkedSourceTypes(dataset, sourceTypeCounts).filter(
              (source) => source.count > 0,
            );
            const linkedSourceTotal = linkedSources.reduce((total, source) => total + source.count, 0);

            return (
              <motion.button
                key={dataset.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => setSelectedDatasetId(dataset.id)}
                className="rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#005BBB]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">{dataset.name}</h3>
                      <span className={`rounded-full border px-2 py-0.5 text-xs ${layerTone[dataset.layer]}`}>
                        {layerLabel[dataset.layer]}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-gray-600">{dataset.description}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs lg:grid-cols-4">
                      <InfoPill label="覆盖" value={dataset.coverage} />
                      <InfoPill label="记录" value={dataset.records} />
                      <InfoPill label="更新" value={dataset.updateCycle} />
                      <InfoPill
                        label="来源库"
                        value={linkedSourceTotal > 0 ? `${formatSourceCount(linkedSourceTotal)}家单位` : `${dataset.sources.length}类`}
                      />
                    </div>
                    <DatasetSourceSummary
                      dataset={dataset}
                      sourceTypeCounts={sourceTypeCounts}
                      compact
                    />
                  </div>
                  <ChevronRight className="mt-1 h-5 w-5 flex-shrink-0 text-gray-300" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DatasetWorkbench({
  dataset,
  sourceTypeCounts,
  onOpenSourceLibrary,
}: {
  dataset: DatasetDefinition;
  sourceTypeCounts: SourceTypeCounts;
  onOpenSourceLibrary: (type: SourceTypeKey) => void;
}) {
  const [activeView, setActiveView] = useState<"intro" | "sources" | "fields" | "sample">("intro");
  const Icon = getDatasetIcon(dataset);
  const linkedSourceTotal = getDatasetSourceTotal(dataset, sourceTypeCounts);

  useEffect(() => {
    setActiveView("intro");
  }, [dataset.id]);

  const tabs = [
    { id: "intro", label: "数据介绍", icon: FileText },
    { id: "sources", label: "数据来源", icon: Globe2 },
    { id: "fields", label: "字段说明", icon: BookOpen },
    { id: "sample", label: "数据样例", icon: FileSpreadsheet },
  ] as const;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#005BBB] text-white">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${layerTone[dataset.layer]}`}>
                  {layerLabel[dataset.layer]}
                </span>
                <span className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-500">
                  {dataset.storage}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">{dataset.name}</h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-600">{dataset.description}</p>
            </div>
          </div>
          <div className="hidden min-w-[180px] rounded-lg bg-gray-50 p-3 text-right lg:block">
            <div className="text-xs text-gray-500">最近更新</div>
            <div className="mt-1 text-sm font-semibold text-gray-900">{dataset.lastUpdate}</div>
            <div className="mt-1 text-xs text-gray-500">{dataset.updateCycle}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-gray-200 md:grid-cols-5">
          <StatCell label="覆盖范围" value={dataset.coverage} />
          <StatCell label="记录规模" value={dataset.records} />
          <StatCell label="核心指标" value={`${dataset.keyMetrics.length}项`} />
          <StatCell label="来源类型" value={`${dataset.sources.length}类`} />
          <StatCell
            label="来源库规模"
            value={linkedSourceTotal > 0 ? `${formatSourceCount(linkedSourceTotal)}家单位` : "按来源维护"}
          />
        </div>
      </div>

      <div className="flex flex-col gap-5 xl:flex-row">
        <aside className="w-full flex-shrink-0 xl:w-72">
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <ListFilter className="h-4 w-4 text-[#005BBB]" />
                <h3 className="text-sm font-semibold text-gray-900">查询条件</h3>
              </div>
            </div>
            <div className="space-y-4 p-4">
              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-500">关键词</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="输入名称、国家、来源..."
                    className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-[#005BBB] focus:outline-none"
                  />
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-500">筛选项</label>
                <div className="flex flex-wrap gap-2">
                  {dataset.filters.map((filter) => (
                    <button
                      key={filter}
                      className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="flex flex-wrap gap-2 border-b border-gray-200 px-4 py-3">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeView === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveView(tab.id)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive
                        ? "bg-[#005BBB] text-white"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <TabIcon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="p-5">
              {activeView === "intro" && <DatasetIntro dataset={dataset} />}
              {activeView === "sources" && (
                <DatasetSourceList
                  dataset={dataset}
                  sourceTypeCounts={sourceTypeCounts}
                  onOpenSourceLibrary={onOpenSourceLibrary}
                />
              )}
              {activeView === "fields" && <DatasetDictionary dataset={dataset} />}
              {activeView === "sample" && <DatasetSample dataset={dataset} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function DatasetIntro({ dataset }: { dataset: DatasetDefinition }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <InfoBlock title="数据用途" value={dataset.domain} />
        <InfoBlock title="更新机制" value={dataset.updateCycle} />
        <InfoBlock title="存储形态" value={dataset.storage} />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">核心字段</h3>
        <div className="flex flex-wrap gap-2">
          {dataset.keyMetrics.map((metric) => (
            <span key={metric} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              {metric}
            </span>
          ))}
        </div>
      </div>

      {dataset.lineage && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">衍生生成链路</h3>
          <div className="flex flex-wrap items-center gap-2">
            {dataset.lineage.map((step, index) => (
              <div key={step} className="flex items-center gap-2">
                <span
                  className={`rounded-lg px-3 py-2 text-xs font-medium ${
                    index === dataset.lineage!.length - 1
                      ? "bg-amber-100 text-amber-800"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {step}
                </span>
                {index < dataset.lineage!.length - 1 && <ChevronRight className="h-4 w-4 text-gray-300" />}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

function DatasetDictionary({ dataset }: { dataset: DatasetDefinition }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-500">字段名</th>
            <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-500">中文说明</th>
            <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-500">字段描述</th>
          </tr>
        </thead>
        <tbody>
          {dataset.fields.map((field) => (
            <tr key={field.name} className="hover:bg-gray-50">
              <td className="border-b border-gray-100 px-4 py-3 font-mono text-xs text-[#005BBB]">{field.name}</td>
              <td className="border-b border-gray-100 px-4 py-3 font-medium text-gray-900">{field.label}</td>
              <td className="border-b border-gray-100 px-4 py-3 text-gray-600">{field.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const sampleCountries = ["Kenya", "Nigeria", "Sudan", "South Africa", "Ethiopia", "Zambia", "Ghana", "Tanzania"];
const sampleCountryCodes = ["KE", "NG", "SD", "ZA", "ET", "ZM", "GH", "TZ"];
const sampleCities = ["Nairobi", "Lagos", "Khartoum", "Johannesburg", "Addis Ababa", "Lusaka", "Accra", "Dar es Salaam"];
const sampleSources = ["Reuters", "BBC Africa", "UN OCHA", "Local Media", "Government Notice", "ACLED", "OSM", "WorldPop"];
const sampleRiskLevels = ["低", "中", "高", "极高"];
const sampleCredibilityLevels = ["高", "中", "高", "中"];
const sampleEventTypes = ["protest", "security", "strike", "policy", "armed_clash", "road_closure", "public_health", "supply_chain"];
const eventSummaryTemplates = [
  "{country}{city}市中心出现反燃油价格上涨示威，现场交通短时中断，警方部署防暴力量维持秩序，暂未收到中资机构受影响报告。",
  "{country}{city}周边发生武装抢劫与零星枪击，安全部门扩大巡逻范围，商业区营业时间缩短，建议项目人员减少夜间外出。",
  "{country}{city}主要工会宣布新一轮罢工计划，港口和公共交通可能受到影响，企业物流团队已开始调整运输和仓储安排。",
  "{country}政府发布新的外汇和进口许可政策，部分企业反馈审批周期拉长，市场担心关键设备与原材料采购成本继续上升。",
  "{country}{city}郊区发生武装团伙交火，安全部队封锁通往事发区域的道路，附近社区学校停课，局势仍在进一步核实。",
  "{country}{city}通往工业园区的主干道因抗议和临检出现拥堵，货运车辆排队时间延长，当地合作方建议改走备用线路。",
  "{country}卫生部门通报疑似传染病聚集病例，重点医院加强分诊和检测，公共卫生机构提醒人员密集场所做好防护。",
  "{country}港口作业因罢工和设备故障放缓，多批进口物资清关延迟，能源、矿业和基建项目供应计划面临短期扰动。",
];
const poriDimensionGroups: Record<"corePoliticalPower" | "geoEconomicResource" | "governanceRegulatory", string[]> = {
  corePoliticalPower: [
    "regime_policy_continuity",
    "military_conflict_war",
    "terrorism_extremism",
    "sanctions_diplomatic_isolation",
    "ideology_nationalism_decoupling",
  ],
  geoEconomicResource: [
    "supply_chain_critical_minerals",
    "energy_security_price_volatility",
    "cross_border_finance_capital_controls",
    "tariffs_trade_protectionism",
    "tech_cold_war_ip_barriers",
  ],
  governanceRegulatory: [
    "nationalization_expropriation",
    "weaponized_regulation_long_arm",
    "cyber_sovereignty_digital_conflict",
    "climate_policy_green_barriers",
    "social_unrest_esg_reputation",
  ],
};
const poriSubdimensionFields = Object.values(poriDimensionGroups).flat();
const poriSubdimensionBaseScores: Record<string, number> = {
  regime_policy_continuity: 68,
  military_conflict_war: 70,
  terrorism_extremism: 78,
  sanctions_diplomatic_isolation: 55,
  ideology_nationalism_decoupling: 58,
  supply_chain_critical_minerals: 69,
  energy_security_price_volatility: 61,
  cross_border_finance_capital_controls: 52,
  tariffs_trade_protectionism: 57,
  tech_cold_war_ip_barriers: 64,
  nationalization_expropriation: 50,
  weaponized_regulation_long_arm: 56,
  cyber_sovereignty_digital_conflict: 46,
  climate_policy_green_barriers: 48,
  social_unrest_esg_reputation: 73,
};

function getSampleDate(index: number) {
  return `2026-05-${String(12 + (index % 8)).padStart(2, "0")}`;
}

function getSampleDateTime(index: number) {
  return `${getSampleDate(index)} ${String(8 + (index % 10)).padStart(2, "0")}:${index % 2 === 0 ? "30" : "45"}`;
}

function getSampleEventSummary(index: number) {
  const country = sampleCountries[index % sampleCountries.length];
  const city = sampleCities[index % sampleCities.length];
  return eventSummaryTemplates[index % eventSummaryTemplates.length]
    .replaceAll("{country}", country)
    .replaceAll("{city}", city);
}

function roundScore(value: number) {
  return Number(value.toFixed(1));
}

function averageScores(values: number[]) {
  return roundScore(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getPoriSubdimensionScore(fieldName: string, index: number) {
  const baseScore = poriSubdimensionBaseScores[fieldName] ?? 55;
  return Math.max(0, Math.min(100, baseScore + ((index % 5) - 2) * 4 + Math.floor(index / 5) * 3));
}

function getPoriRiskLevel(score: number) {
  if (score >= 80) return "极高";
  if (score >= 65) return "高";
  if (score >= 45) return "中";
  return "低";
}

function buildPoriScores(index: number) {
  const subdimensionScores = poriSubdimensionFields.reduce<Record<string, number>>((scores, fieldName) => {
    scores[fieldName] = getPoriSubdimensionScore(fieldName, index);
    return scores;
  }, {});

  const core_political_power = averageScores(poriDimensionGroups.corePoliticalPower.map((fieldName) => subdimensionScores[fieldName]));
  const geo_economic_resource = averageScores(poriDimensionGroups.geoEconomicResource.map((fieldName) => subdimensionScores[fieldName]));
  const governance_regulatory = averageScores(poriDimensionGroups.governanceRegulatory.map((fieldName) => subdimensionScores[fieldName]));
  const pori_score = averageScores([core_political_power, geo_economic_resource, governance_regulatory]);

  return {
    pori_score,
    core_political_power,
    geo_economic_resource,
    governance_regulatory,
    ...subdimensionScores,
  };
}

function getGeneratedSampleValue(field: DatasetDefinition["fields"][number], dataset: DatasetDefinition, index: number) {
  const fieldName = field.name;
  const lowerName = fieldName.toLowerCase();
  const serial = String(index + 1).padStart(3, "0");

  if (fieldName === "FeatureUID") return ["SFd0001", "MOd0001", "ZId0001", "NAd0002", "GHd0003", "TZd0004", "ZMd0005", "CDd0006"][index % 8];
  if (fieldName === "Latitude") return (-29.2458 + index * 2.73).toFixed(4);
  if (fieldName === "Longitude") return (18.8392 + index * 3.41).toFixed(4);
  if (fieldName === "event_id") return `EVT-2026-${serial}`;
  if (fieldName === "post_id") return `POST-${serial}`;
  if (fieldName === "msg_id") return `MSG-${serial}`;
  if (fieldName === "conflict_id") return `CON-${serial}`;
  if (fieldName === "pori_id") return `PORI-${serial}`;
  if (fieldName === "pop_id") return `POP-${serial}`;
  if (fieldName === "asset_id") return `AST-${serial}`;
  if (fieldName === "fac_id") return `FAC-${serial}`;
  if (fieldName === "strategy_id") return `STR-${serial}`;
  if (fieldName === "Country" || lowerName === "country") return sampleCountries[index % sampleCountries.length];
  if (fieldName === "country_code") return sampleCountryCodes[index % sampleCountryCodes.length];
  if (lowerName === "city") return sampleCities[index % sampleCities.length];
  if (fieldName === "admin_area") return ["Greater Accra", "Lagos State", "Khartoum", "Gauteng", "Oromia", "Copperbelt", "Nairobi County", "Dar es Salaam"][index % 8];
  if (fieldName === "grid_id") return `${sampleCountryCodes[index % sampleCountryCodes.length]}-GRID-${serial}`;
  if (fieldName === "ADM1") return ["Northern Cape", "Lagos State", "Khartoum", "Copperbelt", "Greater Accra", "Dar es Salaam", "Oromia", "Gauteng"][index % 8];

  if (lowerName.endsWith("_id") || lowerName.includes("uid") || lowerName === "id") {
    const prefix = dataset.id
      .split("-")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
    return `${prefix}-${serial}`;
  }

  if (lowerName.includes("date") && !lowerName.includes("update")) return getSampleDate(index);
  if (lowerName.includes("time") || lowerName.includes("datetime")) return getSampleDateTime(index);
  if (lowerName.includes("update")) return getSampleDateTime(index + 1);

  if (lowerName.includes("risk_level")) return sampleRiskLevels[(index + 1) % sampleRiskLevels.length];
  if (lowerName.includes("event_type") || lowerName.includes("risk_type")) return sampleEventTypes[index % sampleEventTypes.length];
  if (lowerName.includes("risk_label")) return ["社会治安", "恐怖主义", "政治稳定性", "经济韧性", "出行安全", "供应链安全", "医疗卫生", "自然灾害"][index % 8];
  if (lowerName.includes("sentiment")) return ["negative", "neutral", "positive", "negative"][index % 4];
  if (lowerName.includes("credibility") || lowerName.includes("reliability")) return sampleCredibilityLevels[index % sampleCredibilityLevels.length];
  if (lowerName.includes("source")) return sampleSources[index % sampleSources.length];

  if (lowerName.includes("score") || lowerName.includes("political") || lowerName.includes("security") || lowerName.includes("social")) {
    return 48 + index * 6;
  }
  if (lowerName.includes("change")) return `${index % 2 === 0 ? "+" : "-"}${(1.2 + index * 0.7).toFixed(1)}`;
  if (lowerName.includes("count")) return 120 + index * 37;
  if (lowerName.includes("fatalities")) return index % 5;
  if (lowerName.includes("reposts")) return 40 + index * 31;
  if (fieldName === "population_total") return 54000 + index * 18000;
  if (fieldName === "population_density") return 1200 + index * 430;
  if (fieldName === "children_population") return 12000 + index * 3900;
  if (fieldName === "elderly_population") return 4200 + index * 980;
  if (fieldName === "vulnerable_population") return 17000 + index * 4600;
  if (lowerName.includes("population")) return 54000 + index * 18000;
  if (lowerName.includes("vulnerable")) return 8000 + index * 2100;
  if (lowerName.includes("ratio")) return `${20 + index * 5}%`;
  if (lowerName.includes("radius")) return `${3 + index}km`;

  if (lowerName.includes("title")) return `Security update in ${sampleCities[index % sampleCities.length]}`;
  if (lowerName.includes("summary")) return getSampleEventSummary(index);
  if (lowerName.includes("content") || lowerName.includes("raw_text")) return `Public report mentions a risk signal near ${sampleCities[index % sampleCities.length]}.`;
  if (lowerName.includes("trans_text")) return `Translated risk signal near ${sampleCities[index % sampleCities.length]}.`;
  if (lowerName.includes("location") || lowerName.includes("geo_tag")) return sampleCities[index % sampleCities.length];
  if (lowerName.includes("language")) return ["English", "Arabic", "French", "Portuguese", "Swahili"][index % 5];
  if (lowerName.includes("account")) return `monitor_account_${serial}`;
  if (lowerName.includes("actor")) return ["Security forces", "Protest group", "Local authority", "Armed group"][index % 4];
  if (lowerName.includes("fac_name")) return ["Accra Central Hospital", "Mombasa County School", "Lagos Police Command", "Addis Ababa Transport Hub", "Lusaka Water Station", "Nairobi Power Substation", "Khartoum Shelter Center", "Dar Port Clinic"][index % 8];
  if (lowerName.includes("asset_name")) return ["Copperbelt Mine", "Port Logistics Hub", "Industrial Park", "Railway Project"][index % 4];
  if (lowerName.includes("asset_type")) return ["mine", "port", "park", "railway"][index % 4];
  if (lowerName.includes("status")) return ["operating", "construction", "paused", "maintenance"][index % 4];
  if (lowerName.includes("key_node")) return index % 2 === 0 ? "是" : "否";
  if (lowerName.includes("fac_type")) return ["hospital", "school", "police", "transport", "water", "power", "shelter", "clinic"][index % 8];
  if (lowerName.includes("service_radius")) return `${3 + (index % 6)}km`;
  if (lowerName.includes("capacity")) return 120 + index * 55;
  if (lowerName.includes("stat_year")) return 2026;
  if (lowerName.includes("last_verified")) return getSampleDate(index);
  if (lowerName.includes("scene")) return ["道路封锁", "武装袭击", "罢工", "洪水"][index % 4];
  if (lowerName.includes("role")) return ["项目部", "企业", "保险", "使馆"][index % 4];
  if (lowerName.includes("response_level")) return ["一级", "二级", "三级"][index % 3];
  if (lowerName.includes("steps")) return "确认、通报、处置、复盘";
  if (lowerName.includes("linkage")) return ["当地安保", "领保中心", "项目部", "政府部门"][index % 4];
  if (lowerName.includes("template")) return ["应急通知", "撤离方案", "理赔申请", "事件简报"][index % 4];
  if (lowerName.includes("condition")) return "风险信号持续超过6小时";
  if (lowerName.includes("feature") || lowerName.includes("name")) return `${field.label || fieldName}-${serial}`;

  return field.example && field.example !== "..." ? `${field.example}-${index + 1}` : `模拟值-${serial}`;
}

function buildPoriSampleRow(dataset: DatasetDefinition, index: number) {
  const serial = String(index + 1).padStart(3, "0");
  const scores = buildPoriScores(index);
  const fieldValues: Record<string, string | number> = {
    pori_id: `PORI-${serial}`,
    country: sampleCountries[index % sampleCountries.length],
    country_code: sampleCountryCodes[index % sampleCountryCodes.length],
    risk_level: getPoriRiskLevel(scores.pori_score),
    week_change: `${index % 2 === 0 ? "+" : "-"}${(1.2 + index * 0.7).toFixed(1)}`,
    source_event_count: 180 + index * 31 + (index % 3) * 17,
    event_window: ["过去7天", "过去14天", "过去30天"][index % 3],
    stat_date: getSampleDate(index),
    update_time: getSampleDateTime(index + 1),
    ...scores,
  };

  return dataset.fields.reduce<Record<string, string | number>>((row, field) => {
    row[field.name] = fieldValues[field.name] ?? getGeneratedSampleValue(field, dataset, index);
    return row;
  }, {});
}

function buildSampleRows(dataset: DatasetDefinition) {
  const rowCount = Math.max(12, dataset.previewRows.length);
  return Array.from({ length: rowCount }, (_, index) => {
    if (dataset.id === "pori") return buildPoriSampleRow(dataset, index);

    const previewRow = dataset.previewRows[index];
    const generatedRow = dataset.fields.reduce<Record<string, string | number>>((row, field) => {
      row[field.name] = getGeneratedSampleValue(field, dataset, index);
      return row;
    }, {});

    return previewRow ? { ...generatedRow, ...previewRow } : generatedRow;
  });
}

function DatasetSample({ dataset }: { dataset: DatasetDefinition }) {
  const [expandedCells, setExpandedCells] = useState<Set<string>>(() => new Set());
  const columns = dataset.fields.map((field) => field.name);
  const sampleRows = buildSampleRows(dataset);
  const toggleCell = (cellKey: string) => {
    setExpandedCells((previous) => {
      const next = new Set(previous);
      if (next.has(cellKey)) {
        next.delete(cellKey);
      } else {
        next.add(cellKey);
      }
      return next;
    });
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[1120px] border-collapse text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="whitespace-nowrap border-b border-gray-200 px-4 py-3 text-left font-mono text-xs font-semibold text-gray-700"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((row, index) => (
              <tr key={`${dataset.id}-sample-${index}`} className="hover:bg-gray-50">
                {columns.map((column) => {
                  const cellKey = `${dataset.id}-${index}-${column}`;
                  const value = String(row[column] ?? "-");
                  const isSummary = ["summary", "raw_text", "trans_text"].includes(column);
                  return (
                    <td
                      key={column}
                      className={`border-b border-gray-100 px-4 py-3 text-gray-700 ${
                        isSummary ? "min-w-[360px] max-w-[520px] whitespace-normal" : "whitespace-nowrap"
                      }`}
                    >
                      {isSummary ? (
                        <ExpandableSampleText
                          text={value}
                          expanded={expandedCells.has(cellKey)}
                          onToggle={() => toggleCell(cellKey)}
                        />
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExpandableSampleText({
  text,
  expanded,
  onToggle,
}: {
  text: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const shouldCollapse = text.length > 42;

  return (
    <div className="max-w-[520px]">
      <p className={`text-sm leading-6 text-gray-700 ${!expanded && shouldCollapse ? "line-clamp-2" : ""}`}>
        {text}
      </p>
      {shouldCollapse && (
        <button
          type="button"
          onClick={onToggle}
          className="mt-1 text-xs font-medium text-[#005BBB] hover:underline"
        >
          {expanded ? "收起" : "展开"}
        </button>
      )}
    </div>
  );
}

function DatasetSourceSummary({
  dataset,
  sourceTypeCounts,
  compact = false,
  onOpenSourceLibrary,
}: {
  dataset: DatasetDefinition;
  sourceTypeCounts: SourceTypeCounts;
  compact?: boolean;
  onOpenSourceLibrary?: (type: SourceTypeKey) => void;
}) {
  const linkedSources = getDatasetLinkedSourceTypes(dataset, sourceTypeCounts).filter((source) => source.count > 0);
  const fallbackSources = dataset.sources.slice(0, compact ? 3 : dataset.sources.length);

  if (compact) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-gray-400">来源</span>
        {linkedSources.length > 0
          ? linkedSources.slice(0, 3).map((source) => (
              <span key={source.type} className="rounded-full bg-gray-50 px-2 py-1 text-[11px] text-gray-600">
                {source.label} {formatSourceUnit(source.type, source.count)}
              </span>
            ))
          : fallbackSources.map((source) => (
              <span key={source.name} className="rounded-full bg-gray-50 px-2 py-1 text-[11px] text-gray-600">
                {source.name}
              </span>
            ))}
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 px-5 py-3">
      <div className="flex flex-wrap gap-2">
        {linkedSources.length > 0
          ? linkedSources.map((source) => (
              <button
                key={source.type}
                type="button"
                onClick={() => onOpenSourceLibrary?.(source.type)}
                className="rounded-full border bg-white px-2.5 py-1 text-xs font-medium text-gray-700"
                style={{ borderColor: `${source.color}40` }}
              >
                {source.label} · {formatSourceUnit(source.type, source.count)}
              </button>
            ))
          : fallbackSources.map((source) => (
              <span key={source.name} className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600">
                {source.name}
              </span>
            ))}
      </div>
    </div>
  );
}

function DatasetSourceList({
  dataset,
  sourceTypeCounts,
  onOpenSourceLibrary,
}: {
  dataset: DatasetDefinition;
  sourceTypeCounts: SourceTypeCounts;
  onOpenSourceLibrary: (type: SourceTypeKey) => void;
}) {
  return (
    <div className="space-y-3">
      {dataset.sources.map((source) => {
        const sourceType = source.sourceTypeKey;
        const sourceConfig = sourceType ? sourceTypeConfig[sourceType] : null;
        const sourceCount = sourceType ? sourceTypeCounts[sourceType] ?? 0 : 0;
        const sourceTitle = sourceConfig?.libraryName ?? source.name;
        const sourceCard = (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">{sourceTitle}</h3>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{source.type}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-600">{source.description}</p>
              {sourceType && (
                <p className="mt-2 text-xs text-[#005BBB]">
                  点击查看全部 {formatSourceUnit(sourceType, sourceCount)}
                </p>
              )}
            </div>

            <div className="flex flex-shrink-0 items-center gap-5 text-right">
              {sourceType && (
                <div className="min-w-[118px] rounded-lg bg-blue-50 px-4 py-3 text-center">
                  <div className="text-xs text-blue-600">来源库规模</div>
                  <div className="mt-1 text-xl font-bold text-[#005BBB]">
                    {formatSourceCount(sourceCount)}
                  </div>
                  <div className="mt-0.5 text-xs text-blue-600">{sourceConfig?.unitLabel}</div>
                </div>
              )}
              <div className="min-w-[120px] text-xs text-gray-500">
                <div>{source.coverage}</div>
                <div className="mt-1">{source.update}</div>
              </div>
            </div>
          </div>
        );

        return sourceType ? (
          <button
            key={source.name}
            type="button"
            onClick={() => onOpenSourceLibrary(sourceType)}
            className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-sm"
          >
            {sourceCard}
          </button>
        ) : (
          <div key={source.name} className="rounded-lg border border-gray-200 bg-white p-4">
            {sourceCard}
          </div>
        );
      })}
    </div>
  );
}

function SourceLibraryView({
  selectedType,
  searchQuery,
  setSearchQuery,
  page,
  setPage,
  filteredCardData,
  paginatedCardData,
  totalPages,
}: {
  selectedType: string;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  page: number;
  setPage: (value: number | ((prev: number) => number)) => void;
  filteredCardData: SourceRecord[];
  paginatedCardData: SourceRecord[];
  totalPages: number;
}) {
  const config = sourceTypeConfig[selectedType as SourceTypeKey];
  const relatedDatasets = useMemo(
    () => config.relatedDatasetIds.map((datasetId) => getDatasetById(datasetId)).filter(Boolean) as DatasetDefinition[],
    [config.relatedDatasetIds],
  );

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: config.color }} />
              <h2 className="text-xl font-bold text-gray-900">{config.libraryName}</h2>
            </div>
            <p className="text-sm text-gray-600">{config.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {relatedDatasets.map((dataset) => (
                <span key={dataset.id} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                  关联 {dataset.shortName}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-right">
            <div className="text-xs text-gray-500">单位数量</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{formatSourceCount(filteredCardData.length)}</div>
            <div className="mt-0.5 text-xs text-gray-500">{config.unitLabel}</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">来源目录</h3>
            <p className="mt-1 text-sm text-gray-500">
              共 {formatSourceCount(filteredCardData.length)}{config.unitLabel}，可按名称、国家或说明检索完整名单。
            </p>
          </div>
          <div className="relative w-full lg:w-80">
            <input
              type="text"
              placeholder="搜索来源名称、国家、说明..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-[#005BBB] focus:outline-none"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setPage(1);
              }}
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {paginatedCardData.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {paginatedCardData.map((item, index) => {
              const reliability = getSourceRecordReliability(item, selectedType);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="p-5 transition-colors hover:bg-blue-50/30"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: config.bgColor }}>
                      <Globe2 className="h-5 w-5" style={{ color: config.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">{item.nameCn || item.nameEn}</h3>
                        {item.nameCn && item.nameEn && item.nameCn !== item.nameEn && (
                          <span className="text-sm text-gray-500">{item.nameEn}</span>
                        )}
                        <ReliabilityBadge value={reliability} />
                      </div>
                      {item.url && (
                        <a
                          href={normalizeUrl(item.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mb-2 inline-flex max-w-full items-center gap-1 truncate text-sm text-[#005BBB] hover:underline"
                        >
                          {item.url}
                          <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                        </a>
                      )}
                      <p className="line-clamp-2 text-sm leading-6 text-gray-600">{item.description}</p>
                      {item.marks && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.marks
                            .split(",")
                            .slice(0, 6)
                            .map((tag) => (
                              <span key={tag} className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                {tag.trim()}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                    <div className="hidden flex-shrink-0 text-right md:block">
                      <div className="flex items-center justify-end gap-1 text-sm text-gray-700">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {item.country || "未知"}
                      </div>
                      {item.year && <div className="mt-2 text-xs text-gray-500">创立/成立于 {item.year}</div>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Database className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">暂无匹配来源</h3>
            <p className="text-gray-500">请调整搜索关键词，或在左侧切换其他来源类型。</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-gray-100 px-5 py-4">
            <button
              onClick={() => setPage((previous) => Math.max(1, previous - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              上一页
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = index + 1;
                } else if (page <= 3) {
                  pageNumber = index + 1;
                } else if (page >= totalPages - 2) {
                  pageNumber = totalPages - 4 + index;
                } else {
                  pageNumber = page - 2 + index;
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    className={`rounded-lg px-3 py-1 text-sm ${
                      page === pageNumber
                        ? "bg-[#005BBB] text-white"
                        : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Database;
  label: string;
  value: string;
  tone: "blue" | "amber" | "green";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-green-50 text-green-700",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-gray-500">{label}</div>
          <div className="mt-1 text-xl font-bold text-gray-900">{value}</div>
        </div>
      </div>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <div className="text-[11px] text-gray-400">{label}</div>
      <div className="mt-1 truncate text-xs font-semibold text-gray-700">{value}</div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-5 py-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-base font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="text-xs font-semibold text-gray-500">{title}</div>
      <div className="mt-2 text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}
